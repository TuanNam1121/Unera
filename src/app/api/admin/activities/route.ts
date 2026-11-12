import { NextRequest, NextResponse } from "next/server";
import { Types } from "mongoose";
import {
  ACTIVITY_PUBLISH_STATUS,
  ActivityComputedStatus,
  CONTENT_TARGET_COLLECTIONS,
} from "@/constants";
import { queryPaginatedActivitiesFromDb } from "@/lib/activities-query";
import { logAuditAction } from "@/lib/audit";
import { syncContentMediaRefs } from "@/lib/content/media-sync";
import { validateAndSanitizeTiptapDoc } from "@/lib/content/tiptap-schema";
import { connectToDatabase } from "@/lib/db";
import {
  isSafeMediaUrl,
  normalizeStringList,
} from "@/lib/orientation-utils";
import { handleAuthError, requireAdmin } from "@/lib/session";
import {
  ensureActivityIndexesInBackground,
  ensureUniqueActivitySlug,
  RawActivityDoc,
  revalidateActivityRoutes,
  serializeActivityCategory,
  serializeStudentActivity,
} from "@/lib/activities";
import { adminStudentActivitySchema } from "@/validations";
import { ActivityCategory } from "@/models/ActivityCategory";
import { StudentActivity } from "@/models/StudentActivity";

export async function GET(req: NextRequest) {
  try {
    await requireAdmin(req);
    await connectToDatabase();

    const { searchParams } = new URL(req.url);
    const publishStatus = (searchParams.get("publishStatus") || "").trim();
    const computedStatus = (searchParams.get("computedStatus") || "").trim();
    const categoryId = (searchParams.get("categoryId") || "").trim();
    const q = (searchParams.get("q") || "").trim();
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10) || 1);
    const limit = Math.min(
      50,
      Math.max(1, parseInt(searchParams.get("limit") || "15", 10) || 15)
    );

    const filter: Record<string, unknown> = {};
    if (
      publishStatus &&
      Object.values(ACTIVITY_PUBLISH_STATUS).includes(
        publishStatus as (typeof ACTIVITY_PUBLISH_STATUS)[keyof typeof ACTIVITY_PUBLISH_STATUS]
      )
    ) {
      filter.publishStatus = publishStatus;
    }

    if (categoryId && Types.ObjectId.isValid(categoryId)) {
      filter.categoryId = new Types.ObjectId(categoryId);
    }

    ensureActivityIndexesInBackground();
    const now = new Date();
    const computedStatusFilter = computedStatus
      ? [computedStatus as ActivityComputedStatus]
      : undefined;

    const [categories, paginated] = await Promise.all([
      ActivityCategory.find().sort({ order: 1, name: 1 }).lean(),
      queryPaginatedActivitiesFromDb({
        baseFilter: filter,
        q,
        computedStatusFilter,
        sort: "updated_desc",
        page,
        limit,
        now,
      }),
    ]);

    const serializedCategories = categories.map((c) => serializeActivityCategory(c));
    const categoryById = new Map(serializedCategories.map((c) => [c._id, c]));

    const items = (paginated.docs as RawActivityDoc[]).map((doc) => {
      const cat = doc.categoryId ? categoryById.get(String(doc.categoryId)) || null : null;
      return serializeStudentActivity(
        {
          ...doc,
          categoryId: cat
            ? {
                _id: cat._id,
                name: cat.name,
                slug: cat.slug,
                colorToken: cat.colorToken,
                icon: cat.icon,
              }
            : null,
        },
        { now }
      );
    });

    const total = paginated.total;
    const totalPages = total === 0 ? 0 : Math.ceil(total / limit);

    return NextResponse.json({
      success: true,
      items,
      categories: serializedCategories,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    });
  } catch (error) {
    return handleAuthError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdmin(req);
    await connectToDatabase();

    const body = await req.json();
    const parsed = adminStudentActivitySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Dữ liệu hoạt động không hợp lệ",
          details: parsed.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const data = parsed.data;
    if (!Types.ObjectId.isValid(data.categoryId)) {
      return NextResponse.json(
        { error: "Danh mục hoạt động không hợp lệ" },
        { status: 400 }
      );
    }

    const category = await ActivityCategory.findById(data.categoryId);
    if (!category) {
      return NextResponse.json(
        { error: "Không tìm thấy danh mục hoạt động đã chọn" },
        { status: 404 }
      );
    }

    if (data.coverImage && !isSafeMediaUrl(data.coverImage)) {
      return NextResponse.json(
        { error: "Đường dẫn ảnh bìa không hợp lệ" },
        { status: 400 }
      );
    }

    const tiptapCheck = validateAndSanitizeTiptapDoc(data.contentJson, {
      minTextLength: 20,
    });
    if (!tiptapCheck.ok) {
      return NextResponse.json(
        {
          error:
            tiptapCheck.error || "Nội dung chi tiết hoạt động không hợp lệ",
        },
        { status: 400 }
      );
    }

    const slug = await ensureUniqueActivitySlug(data.slug || data.title);
    const adminObjectId = Types.ObjectId.isValid(admin.id)
      ? new Types.ObjectId(admin.id)
      : undefined;

    const created = await StudentActivity.create({
      title: data.title,
      slug,
      summary: data.summary,
      contentJson: tiptapCheck.doc,
      contentText: tiptapCheck.plainText,
      coverImage: data.coverImage || "",
      categoryId: category._id,
      organizer: data.organizer || "",
      location: data.location || "",
      isDomestic: data.isDomestic,
      eligibility: data.eligibility || "",
      requirements: data.requirements || "",
      benefits: data.benefits || "",
      applicationInstructions: data.applicationInstructions || "",
      openingDate: data.openingDate ?? null,
      deadline: data.deadline ?? null,
      eventDate: data.eventDate ?? null,
      eventEndDate: data.eventEndDate ?? null,
      registrationUrl: data.registrationUrl || "",
      tags: normalizeStringList(data.tags),
      publishStatus: data.publishStatus,
      manualClosed: data.manualClosed,
      isFeatured: data.isFeatured,
      publishedAt:
        data.publishStatus === ACTIVITY_PUBLISH_STATUS.PUBLISHED
          ? new Date()
          : null,
      version: 1,
      ...(adminObjectId
        ? { createdBy: adminObjectId, updatedByAdminId: adminObjectId }
        : {}),
    });

    await syncContentMediaRefs({
      targetCollection: CONTENT_TARGET_COLLECTIONS.STUDENT_ACTIVITIES,
      documentId: created._id.toString(),
      coverImage: created.coverImage,
      contentJson: created.contentJson,
    });

    await logAuditAction({
      admin,
      action: "CREATE",
      targetCollection: CONTENT_TARGET_COLLECTIONS.STUDENT_ACTIVITIES,
      targetId: created._id,
      targetTitle: created.title,
      targetVersion: 1,
      changesAfter: {
        slug: created.slug,
        publishStatus: created.publishStatus,
        category: category.name,
      },
      req,
    });

    const populated = (await StudentActivity.findById(created._id)
      .populate("categoryId", "name slug colorToken icon")
      .lean()) as unknown as RawActivityDoc;

    revalidateActivityRoutes(created.slug);

    return NextResponse.json(
      {
        success: true,
        activity: serializeStudentActivity(populated, { includeContent: true }),
        message: "Đã tạo hoạt động sinh viên mới thành công",
      },
      { status: 201 }
    );
  } catch (error) {
    return handleAuthError(error);
  }
}
