import { NextRequest, NextResponse } from "next/server";
import { Types } from "mongoose";
import { CONTENT_TARGET_COLLECTIONS } from "@/constants";
import { logAuditAction } from "@/lib/audit";
import { connectToDatabase } from "@/lib/db";
import { handleAuthError, requireAdmin } from "@/lib/session";
import {
  ensureUniqueNewsCategorySlug,
  revalidateNewsRoutes,
  serializeNewsCategory,
} from "@/lib/news";
import { updateNewsCategorySchema } from "@/validations";
import { NewsCategory } from "@/models/NewsCategory";
import { NewsArticle } from "@/models/NewsArticle";

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

    const existing = await NewsCategory.findById(id);
    if (!existing) {
      return NextResponse.json(
        { error: "Không tìm thấy danh mục tin tức" },
        { status: 404 }
      );
    }

    const body = await req.json();
    const parsed = updateNewsCategorySchema.safeParse(body);
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
    if (parsed.data.colorToken !== undefined) {
      updates.colorToken = parsed.data.colorToken;
    }
    if (parsed.data.order !== undefined) updates.order = parsed.data.order;
    if (parsed.data.isActive !== undefined) {
      updates.isActive = parsed.data.isActive;
    }
    if (parsed.data.showInSidebar !== undefined) {
      updates.showInSidebar = parsed.data.showInSidebar;
    }
    if (parsed.data.slug !== undefined) {
      updates.slug = await ensureUniqueNewsCategorySlug(parsed.data.slug, id);
    }

    const updated = await NewsCategory.findByIdAndUpdate(
      id,
      { $set: updates },
      { returnDocument: "after" }
    );

    if (typeof updates.slug === "string" && updates.slug !== existing.slug) {
      await NewsArticle.updateMany(
        { categoryId: existing._id },
        { $set: { category: updates.slug } }
      );
    }

    const linkedCount = await NewsArticle.countDocuments({
      categoryId: existing._id,
    });

    await logAuditAction({
      admin,
      action: "UPDATE",
      targetCollection: CONTENT_TARGET_COLLECTIONS.NEWS_ARTICLES,
      targetId: existing._id,
      targetTitle: `Danh mục tin tức: ${updated?.name || existing.name}`,
      changesBefore: {
        name: existing.name,
        isActive: existing.isActive,
        showInSidebar: existing.showInSidebar !== false,
      },
      changesAfter: updates,
      req,
    });

    revalidateNewsRoutes();

    return NextResponse.json({
      success: true,
      category: serializeNewsCategory(updated!, linkedCount),
      message: "Đã cập nhật danh mục tin tức",
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

    const existing = await NewsCategory.findById(id);
    if (!existing) {
      return NextResponse.json(
        { error: "Không tìm thấy danh mục tin tức" },
        { status: 404 }
      );
    }

    const linkedCount = await NewsArticle.countDocuments({
      categoryId: existing._id,
    });
    if (linkedCount > 0) {
      return NextResponse.json(
        {
          error: `Không thể xóa danh mục "${existing.name}" vì đang có ${linkedCount} bài viết tin tức sử dụng. Hãy chuyển danh mục hoặc tạm ẩn danh mục này.`,
          linkedCount,
        },
        { status: 409 }
      );
    }

    await NewsCategory.findByIdAndDelete(existing._id);

    await logAuditAction({
      admin,
      action: "DELETE",
      targetCollection: CONTENT_TARGET_COLLECTIONS.NEWS_ARTICLES,
      targetId: existing._id,
      targetTitle: `Danh mục tin tức: ${existing.name}`,
      changesBefore: { name: existing.name, slug: existing.slug },
      req,
    });

    revalidateNewsRoutes();

    return NextResponse.json({
      success: true,
      message: `Đã xóa danh mục "${existing.name}"`,
    });
  } catch (error) {
    return handleAuthError(error);
  }
}

