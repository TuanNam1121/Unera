import { NextRequest, NextResponse } from "next/server";
import { Types } from "mongoose";
import { CONTENT_TARGET_COLLECTIONS } from "@/constants";
import { logAuditAction } from "@/lib/audit";
import { connectToDatabase } from "@/lib/db";
import { handleAuthError, requireAdmin } from "@/lib/session";
import {
  ensureUniqueActivityCategorySlug,
  revalidateActivityRoutes,
  serializeActivityCategory,
} from "@/lib/activities";
import { updateActivityCategorySchema } from "@/validations";
import { ActivityCategory } from "@/models/ActivityCategory";
import { StudentActivity } from "@/models/StudentActivity";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdmin(req);
    await connectToDatabase();
    const { id } = await params;

    if (!Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "ID danh mục không hợp lệ" }, { status: 400 });
    }

    const existing = await ActivityCategory.findById(id);
    if (!existing) {
      return NextResponse.json(
        { error: "Không tìm thấy danh mục hoạt động" },
        { status: 404 }
      );
    }

    const body = await req.json();
    const parsed = updateActivityCategorySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Dữ liệu cập nhật danh mục không hợp lệ",
          details: parsed.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const updates: Record<string, unknown> = {};
    if (parsed.data.name !== undefined) updates.name = parsed.data.name;
    if (parsed.data.description !== undefined) {
      updates.description = parsed.data.description;
    }
    if (parsed.data.icon !== undefined) updates.icon = parsed.data.icon;
    if (parsed.data.colorToken !== undefined) {
      updates.colorToken = parsed.data.colorToken;
    }
    if (parsed.data.order !== undefined) updates.order = parsed.data.order;
    if (parsed.data.isActive !== undefined) {
      updates.isActive = parsed.data.isActive;
    }

    if (parsed.data.slug !== undefined) {
      updates.slug = await ensureUniqueActivityCategorySlug(
        parsed.data.slug,
        id
      );
    }

    const updated = await ActivityCategory.findByIdAndUpdate(
      id,
      { $set: updates },
      { returnDocument: "after" }
    );
    const linkedCount = await StudentActivity.countDocuments({
      categoryId: existing._id,
    });

    await logAuditAction({
      admin,
      action: "UPDATE",
      targetCollection: CONTENT_TARGET_COLLECTIONS.STUDENT_ACTIVITIES,
      targetId: existing._id,
      targetTitle: `Danh mục: ${updated?.name || existing.name}`,
      changesBefore: { name: existing.name, isActive: existing.isActive },
      changesAfter: updates,
      req,
    });

    revalidateActivityRoutes();

    return NextResponse.json({
      success: true,
      category: serializeActivityCategory(updated!, linkedCount),
      message: "Đã cập nhật danh mục hoạt động",
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
      return NextResponse.json({ error: "ID danh mục không hợp lệ" }, { status: 400 });
    }

    const existing = await ActivityCategory.findById(id);
    if (!existing) {
      return NextResponse.json(
        { error: "Không tìm thấy danh mục hoạt động" },
        { status: 404 }
      );
    }

    const linkedCount = await StudentActivity.countDocuments({
      categoryId: existing._id,
    });

    if (linkedCount > 0) {
      return NextResponse.json(
        {
          error: `Không thể xóa danh mục "${existing.name}" vì đang có ${linkedCount} hoạt động liên kết. Vui lòng chuyển danh mục các hoạt động đó trước hoặc ẩn danh mục.`,
          linkedCount,
        },
        { status: 409 }
      );
    }

    await ActivityCategory.findByIdAndDelete(id);

    await logAuditAction({
      admin,
      action: "DELETE",
      targetCollection: CONTENT_TARGET_COLLECTIONS.STUDENT_ACTIVITIES,
      targetId: existing._id,
      targetTitle: `Xóa danh mục: ${existing.name}`,
      req,
    });

    revalidateActivityRoutes();

    return NextResponse.json({
      success: true,
      message: `Đã xóa danh mục "${existing.name}"`,
    });
  } catch (error) {
    return handleAuthError(error);
  }
}

