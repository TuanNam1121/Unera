import { NextResponse } from "next/server";
import { Types } from "mongoose";
import { logAuditAction } from "@/lib/audit";
import { connectToDatabase } from "@/lib/db";
import { revalidateOrientationRoutes } from "@/lib/orientation";
import { slugifyVietnamese } from "@/lib/orientation-utils";
import { handleAuthError, requireAdmin } from "@/lib/session";
import { OrientationArticle } from "@/models/OrientationArticle";
import { OrientationCategory } from "@/models/OrientationCategory";
import { OrientationTopic } from "@/models/OrientationTopic";
import { updateOrientationCategorySchema } from "@/validations";

/**
 * PATCH /api/admin/orientation/categories/[id]
 * Cập nhật Category (tên, slug, mô tả, icon, order, isActive)
 */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdmin(req);
    const { id } = await params;

    if (!Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: "Mã danh mục không hợp lệ." },
        { status: 400 }
      );
    }

    const body = await req.json();
    const parsed = updateOrientationCategorySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error:
            parsed.error.issues[0]?.message ||
            "Dữ liệu cập nhật danh mục không hợp lệ.",
        },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const category = await OrientationCategory.findById(id);
    if (!category) {
      return NextResponse.json(
        { error: "Không tìm thấy danh mục." },
        { status: 404 }
      );
    }

    const beforeSnapshot = {
      name: category.name,
      slug: category.slug,
      order: category.order,
      isActive: category.isActive,
    };

    const nextSlug =
      parsed.data.slug ||
      (parsed.data.name ? slugifyVietnamese(parsed.data.name) : undefined);

    if (nextSlug && nextSlug !== category.slug) {
      const duplicate = await OrientationCategory.findOne({
        slug: nextSlug,
        _id: { $ne: category._id },
      })
        .select("_id")
        .lean();

      if (duplicate) {
        return NextResponse.json(
          { error: `Slug danh mục "${nextSlug}" đã tồn tại.` },
          { status: 409 }
        );
      }
      category.slug = nextSlug;
    }

    if (parsed.data.name !== undefined) category.name = parsed.data.name;
    if (parsed.data.description !== undefined) {
      category.description = parsed.data.description;
    }
    if (parsed.data.icon !== undefined) category.icon = parsed.data.icon;
    if (parsed.data.order !== undefined) category.order = parsed.data.order;
    if (parsed.data.isActive !== undefined) {
      category.isActive = parsed.data.isActive;
    }

    await category.save();

    await logAuditAction({
      admin: { id: admin.id, email: admin.email, name: admin.name },
      action: "UPDATE",
      targetCollection: "orientation_categories",
      targetId: category._id,
      targetTitle: category.name,
      changesBefore: beforeSnapshot,
      changesAfter: {
        name: category.name,
        slug: category.slug,
        order: category.order,
        isActive: category.isActive,
      },
      req,
    });

    revalidateOrientationRoutes();

    return NextResponse.json({
      success: true,
      category: {
        ...category.toObject(),
        _id: category._id.toString(),
      },
    });
  } catch (error) {
    return handleAuthError(error);
  }
}

/**
 * DELETE /api/admin/orientation/categories/[id]
 * Chặn xóa (409 Conflict) nếu danh mục đang chứa Topic con hoặc Bài viết
 */
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdmin(req);
    const { id } = await params;

    if (!Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: "Mã danh mục không hợp lệ." },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const category = await OrientationCategory.findById(id).lean();
    if (!category) {
      return NextResponse.json(
        { error: "Không tìm thấy danh mục." },
        { status: 404 }
      );
    }

    const [topicCount, articleCount] = await Promise.all([
      OrientationTopic.countDocuments({ categoryId: category._id }),
      OrientationArticle.countDocuments({ categoryId: category._id }),
    ]);

    if (topicCount > 0 || articleCount > 0) {
      return NextResponse.json(
        {
          error: `Không thể xóa danh mục "${category.name}" vì đang có ${articleCount} bài viết và ${topicCount} chủ đề con phụ thuộc. Vui lòng chuyển sang danh mục khác hoặc ẩn (Tắt hiển thị).`,
          topicCount,
          articleCount,
        },
        { status: 409 }
      );
    }

    await OrientationCategory.deleteOne({ _id: category._id });

    await logAuditAction({
      admin: { id: admin.id, email: admin.email, name: admin.name },
      action: "DELETE",
      targetCollection: "orientation_categories",
      targetId: category._id,
      targetTitle: category.name,
      changesBefore: {
        name: category.name,
        slug: category.slug,
      },
      req,
    });

    revalidateOrientationRoutes();

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    return handleAuthError(error);
  }
}

