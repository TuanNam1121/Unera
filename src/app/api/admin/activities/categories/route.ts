import { NextRequest, NextResponse } from "next/server";
import { CONTENT_TARGET_COLLECTIONS } from "@/constants";
import { logAuditAction } from "@/lib/audit";
import { connectToDatabase } from "@/lib/db";
import { handleAuthError, requireAdmin } from "@/lib/session";
import {
  ensureUniqueActivityCategorySlug,
  revalidateActivityRoutes,
  serializeActivityCategory,
} from "@/lib/activities";
import {
  adminActivityCategorySchema,
  reorderActivityCategoriesSchema,
} from "@/validations";
import { ActivityCategory } from "@/models/ActivityCategory";
import { StudentActivity } from "@/models/StudentActivity";

export async function GET(req: NextRequest) {
  try {
    await requireAdmin(req);
    await connectToDatabase();

    const [categories, counts] = await Promise.all([
      ActivityCategory.find().sort({ order: 1, name: 1 }).lean(),
      StudentActivity.aggregate<{ _id: string; count: number }>([
        { $group: { _id: { $toString: "$categoryId" }, count: { $sum: 1 } } },
      ]),
    ]);

    const countMap = new Map(counts.map((c) => [c._id, c.count]));
    const items = categories.map((cat) =>
      serializeActivityCategory(cat, countMap.get(cat._id.toString()) || 0)
    );

    return NextResponse.json({
      success: true,
      categories: items,
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
    const parsed = adminActivityCategorySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Dữ liệu danh mục không hợp lệ",
          details: parsed.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { name, slug, description, icon, colorToken, order, isActive } =
      parsed.data;
    const finalSlug = await ensureUniqueActivityCategorySlug(slug || name);

    const created = await ActivityCategory.create({
      name,
      slug: finalSlug,
      description: description || "",
      icon: icon || "Sparkles",
      colorToken: colorToken || "blue",
      order,
      isActive,
    });

    await logAuditAction({
      admin,
      action: "CREATE",
      targetCollection: CONTENT_TARGET_COLLECTIONS.STUDENT_ACTIVITIES,
      targetId: created._id,
      targetTitle: `Danh mục: ${created.name}`,
      changesAfter: { name: created.name, slug: created.slug },
      req,
    });

    revalidateActivityRoutes();

    return NextResponse.json(
      {
        success: true,
        category: serializeActivityCategory(created, 0),
        message: "Đã tạo danh mục hoạt động mới",
      },
      { status: 201 }
    );
  } catch (error) {
    return handleAuthError(error);
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const admin = await requireAdmin(req);
    await connectToDatabase();

    const body = await req.json();
    const parsed = reorderActivityCategoriesSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Danh sách sắp xếp không hợp lệ" },
        { status: 400 }
      );
    }

    const bulkOps = parsed.data.orderedIds.map((id, idx) => ({
      updateOne: {
        filter: { _id: id },
        update: { $set: { order: idx + 1 } },
      },
    }));

    if (bulkOps.length > 0) {
      await ActivityCategory.bulkWrite(bulkOps);
      await logAuditAction({
        admin,
        action: "UPDATE",
        targetCollection: CONTENT_TARGET_COLLECTIONS.STUDENT_ACTIVITIES,
        targetId: parsed.data.orderedIds[0],
        targetTitle: "Sắp xếp thứ tự danh mục hoạt động",
        req,
      });
    }

    revalidateActivityRoutes();

    return NextResponse.json({
      success: true,
      message: "Đã cập nhật thứ tự danh mục",
    });
  } catch (error) {
    return handleAuthError(error);
  }
}

