import { NextRequest, NextResponse } from "next/server";
import { Types } from "mongoose";
import {
  ACTIVITY_PUBLISH_STATUS,
  CONTENT_TARGET_COLLECTIONS,
} from "@/constants";
import { logAuditAction } from "@/lib/audit";
import {
  detachAndDeleteUnusedMedia,
  syncContentMediaRefs,
} from "@/lib/content/media-sync";
import { validateAndSanitizeTiptapDoc } from "@/lib/content/tiptap-schema";
import { connectToDatabase } from "@/lib/db";
import { isSafeMediaUrl, normalizeStringList } from "@/lib/orientation-utils";
import { handleAuthError, requireAdmin } from "@/lib/session";
import {
  ensureUniqueActivitySlug,
  RawActivityDoc,
  revalidateActivityRoutes,
  serializeStudentActivity,
} from "@/lib/activities";
import { updateStudentActivitySchema } from "@/validations";
import { ActivityCategory } from "@/models/ActivityCategory";
import { StudentActivity } from "@/models/StudentActivity";
import { ActivityFollow } from "@/models/ActivityFollow";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin(req);
    await connectToDatabase();
    const { id } = await params;

    if (!Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: "ID hoạt động không hợp lệ" },
        { status: 400 }
      );
    }

    const doc = (await StudentActivity.findById(id)
      .populate("categoryId", "name slug colorToken icon")
      .lean()) as unknown as RawActivityDoc | null;

    if (!doc) {
      return NextResponse.json(
        { error: "Không tìm thấy hoạt động sinh viên" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      activity: serializeStudentActivity(doc, { includeContent: true }),
    });
  } catch (error) {
    return handleAuthError(error);
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdmin(req);
    await connectToDatabase();
    const { id } = await params;

    if (!Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: "ID hoạt động không hợp lệ" },
        { status: 400 }
      );
    }

    const existing = await StudentActivity.findById(id);
    if (!existing) {
      return NextResponse.json(
        { error: "Không tìm thấy hoạt động cần cập nhật" },
        { status: 404 }
      );
    }

    const body = await req.json();
    const parsed = updateStudentActivitySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Dữ liệu cập nhật hoạt động không hợp lệ",
          details: parsed.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const data = parsed.data;

    // Optimistic locking check (SA14)
    if (existing.version !== data.version) {
      return NextResponse.json(
        {
          error:
            "Hoạt động vừa được quản trị viên khác chỉnh sửa. Vui lòng tải lại dữ liệu mới nhất trước khi lưu.",
          conflict: true,
          currentVersion: existing.version,
        },
        { status: 409 }
      );
    }

    // Cross-field date consistency against stored values
    const effectiveOpeningDate =
      data.openingDate !== undefined ? data.openingDate : existing.openingDate;
    const effectiveDeadline =
      data.deadline !== undefined ? data.deadline : existing.deadline;
    const effectiveEventDate =
      data.eventDate !== undefined ? data.eventDate : existing.eventDate;
    const effectiveEventEndDate =
      data.eventEndDate !== undefined
        ? data.eventEndDate
        : existing.eventEndDate;

    if (
      effectiveOpeningDate &&
      effectiveDeadline &&
      new Date(effectiveDeadline) < new Date(effectiveOpeningDate)
    ) {
      return NextResponse.json(
        { error: "Hạn chót đăng ký phải lớn hơn hoặc bằng ngày mở đơn" },
        { status: 400 }
      );
    }

    if (
      effectiveEventDate &&
      effectiveEventEndDate &&
      new Date(effectiveEventEndDate) < new Date(effectiveEventDate)
    ) {
      return NextResponse.json(
        {
          error:
            "Ngày kết thúc sự kiện phải lớn hơn hoặc bằng ngày bắt đầu sự kiện",
        },
        { status: 400 }
      );
    }

    const updates: Record<string, unknown> = {};
    if (data.title !== undefined) updates.title = data.title;
    if (data.summary !== undefined) updates.summary = data.summary;
    if (data.organizer !== undefined) updates.organizer = data.organizer;
    if (data.location !== undefined) updates.location = data.location;
    if (data.isDomestic !== undefined) updates.isDomestic = data.isDomestic;
    if (data.eligibility !== undefined) updates.eligibility = data.eligibility;
    if (data.requirements !== undefined) {
      updates.requirements = data.requirements;
    }
    if (data.benefits !== undefined) updates.benefits = data.benefits;
    if (data.applicationInstructions !== undefined) {
      updates.applicationInstructions = data.applicationInstructions;
    }
    if (data.openingDate !== undefined) updates.openingDate = data.openingDate;
    if (data.deadline !== undefined) updates.deadline = data.deadline;
    if (data.eventDate !== undefined) updates.eventDate = data.eventDate;
    if (data.eventEndDate !== undefined) {
      updates.eventEndDate = data.eventEndDate;
    }
    if (data.registrationUrl !== undefined) {
      updates.registrationUrl = data.registrationUrl;
    }
    if (data.manualClosed !== undefined) {
      updates.manualClosed = data.manualClosed;
    }
    if (data.isFeatured !== undefined) updates.isFeatured = data.isFeatured;
    if (data.tags !== undefined) updates.tags = normalizeStringList(data.tags);

    if (data.categoryId !== undefined) {
      if (!Types.ObjectId.isValid(data.categoryId)) {
        return NextResponse.json(
          { error: "Danh mục hoạt động không hợp lệ" },
          { status: 400 }
        );
      }
      const cat = await ActivityCategory.findById(data.categoryId);
      if (!cat) {
        return NextResponse.json(
          { error: "Không tìm thấy danh mục hoạt động đã chọn" },
          { status: 404 }
        );
      }
      updates.categoryId = cat._id;
    }

    if (data.coverImage !== undefined) {
      if (data.coverImage && !isSafeMediaUrl(data.coverImage)) {
        return NextResponse.json(
          { error: "Đường dẫn ảnh bìa không hợp lệ" },
          { status: 400 }
        );
      }
      updates.coverImage = data.coverImage;
    }

    if (data.slug !== undefined) {
      updates.slug = await ensureUniqueActivitySlug(
        data.slug || data.title || existing.title,
        id
      );
    }

    let contentOrCoverChanged = data.coverImage !== undefined;
    if (data.contentJson !== undefined) {
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
      updates.contentJson = tiptapCheck.doc;
      updates.contentText = tiptapCheck.plainText;
      contentOrCoverChanged = true;
    }

    if (data.publishStatus !== undefined) {
      updates.publishStatus = data.publishStatus;
      if (
        data.publishStatus === ACTIVITY_PUBLISH_STATUS.PUBLISHED &&
        !existing.publishedAt
      ) {
        updates.publishedAt = new Date();
      }
    }

    if (Types.ObjectId.isValid(admin.id)) {
      updates.updatedByAdminId = new Types.ObjectId(admin.id);
    }

    // Atomic optimistic locking update
    const updated = await StudentActivity.findOneAndUpdate(
      { _id: existing._id, version: data.version },
      { $set: updates, $inc: { version: 1 } },
      { returnDocument: "after" }
    );

    if (!updated) {
      const latest = await StudentActivity.findById(id).select("version").lean();
      return NextResponse.json(
        {
          error:
            "Xung đột phiên bản cập nhật đồng thời. Vui lòng tải lại dữ liệu mới nhất.",
          conflict: true,
          currentVersion: latest?.version ?? existing.version + 1,
        },
        { status: 409 }
      );
    }

    if (contentOrCoverChanged) {
      await syncContentMediaRefs({
        targetCollection: CONTENT_TARGET_COLLECTIONS.STUDENT_ACTIVITIES,
        documentId: updated._id.toString(),
        coverImage: updated.coverImage,
        contentJson: updated.contentJson,
      });
    }

    const isStatusOnly =
      (data.publishStatus !== undefined || data.manualClosed !== undefined) &&
      data.title === undefined &&
      data.contentJson === undefined;

    await logAuditAction({
      admin,
      action: isStatusOnly ? "STATUS_CHANGE" : "UPDATE",
      targetCollection: CONTENT_TARGET_COLLECTIONS.STUDENT_ACTIVITIES,
      targetId: updated._id,
      targetTitle: updated.title,
      targetVersion: updated.version,
      changesBefore: {
        publishStatus: existing.publishStatus,
        manualClosed: existing.manualClosed,
        version: existing.version,
      },
      changesAfter: {
        publishStatus: updated.publishStatus,
        manualClosed: updated.manualClosed,
        version: updated.version,
      },
      req,
    });

    const populated = (await StudentActivity.findById(updated._id)
      .populate("categoryId", "name slug colorToken icon")
      .lean()) as unknown as RawActivityDoc;

    revalidateActivityRoutes(existing.slug);
    if (updated.slug !== existing.slug) {
      revalidateActivityRoutes(updated.slug);
    }

    return NextResponse.json({
      success: true,
      activity: serializeStudentActivity(populated, { includeContent: true }),
      message: "Đã cập nhật hoạt động sinh viên",
    });
  } catch (error) {
    return handleAuthError(error);
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdmin(req);
    await connectToDatabase();
    const { id } = await params;

    if (!Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: "ID hoạt động không hợp lệ" },
        { status: 400 }
      );
    }

    const existing = await StudentActivity.findById(id);
    if (!existing) {
      return NextResponse.json(
        { error: "Không tìm thấy hoạt động cần xóa" },
        { status: 404 }
      );
    }

    await Promise.all([
      ActivityFollow.deleteMany({ activityId: existing._id }),
      StudentActivity.findByIdAndDelete(existing._id),
    ]);

    await detachAndDeleteUnusedMedia({
      targetCollection: CONTENT_TARGET_COLLECTIONS.STUDENT_ACTIVITIES,
      documentId: existing._id.toString(),
      deleteUnusedOnCloudinary: true,
    });

    await logAuditAction({
      admin,
      action: "DELETE",
      targetCollection: CONTENT_TARGET_COLLECTIONS.STUDENT_ACTIVITIES,
      targetId: existing._id,
      targetTitle: existing.title,
      targetVersion: existing.version,
      changesBefore: {
        slug: existing.slug,
        followerCount: existing.followerCount,
      },
      req,
    });

    revalidateActivityRoutes(existing.slug);

    return NextResponse.json({
      success: true,
      message: `Đã xóa hoạt động "${existing.title}" và dọn dẹp dữ liệu liên quan`,
    });
  } catch (error) {
    return handleAuthError(error);
  }
}
