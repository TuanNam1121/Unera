import { NextResponse } from "next/server";
import { requireAdmin, handleAuthError } from "@/lib/session";
import { connectToDatabase } from "@/lib/db";
import { NewsArticle } from "@/models/NewsArticle";
import { logAuditAction } from "@/lib/audit";

/**
 * GET /api/admin/news/[id]
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;
    await connectToDatabase();

    const article = await NewsArticle.findById(id).lean();
    if (!article) {
      return NextResponse.json(
        { error: "Không tìm thấy bài viết." },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, article });
  } catch (error) {
    return handleAuthError(error);
  }
}

/**
 * PATCH /api/admin/news/[id]
 * Cập nhật bài viết hoặc thay đổi trạng thái
 */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdmin();
    const { id } = await params;
    const body = await req.json();

    await connectToDatabase();

    const article = await NewsArticle.findById(id);
    if (!article) {
      return NextResponse.json(
        { error: "Không tìm thấy bài viết." },
        { status: 404 }
      );
    }

    const previousState = {
      title: article.title,
      status: article.status,
      isFeatured: article.isFeatured,
      isSponsored: article.isSponsored,
    };

    if (body.title !== undefined) article.title = body.title.trim();
    if (body.summary !== undefined) article.summary = body.summary.trim();
    if (body.content !== undefined) article.content = body.content.trim();
    if (body.category !== undefined) article.category = body.category.toUpperCase();
    if (body.author !== undefined) article.author = body.author.trim();
    if (body.readTime !== undefined) article.readTime = body.readTime.trim();
    if (body.isFeatured !== undefined) article.isFeatured = Boolean(body.isFeatured);
    if (body.isSponsored !== undefined) article.isSponsored = Boolean(body.isSponsored);
    if (body.status !== undefined) article.status = body.status;
    if (body.sponsorInfo !== undefined) {
      article.sponsorInfo = {
        sponsorName: body.sponsorInfo.sponsorName || "",
        sponsorLogoUrl: body.sponsorInfo.sponsorLogoUrl || "",
        targetUrl: body.sponsorInfo.targetUrl || "",
      };
    }

    await article.save();

    await logAuditAction({
      admin: {
        id: admin.id,
        email: admin.email || "",
        name: admin.name || "Admin",
      },
      action: "UPDATE",
      targetCollection: "news_articles",
      targetId: article._id.toString(),
      targetTitle: article.title,
      changesBefore: previousState,
      changesAfter: {
        title: article.title,
        status: article.status,
        isFeatured: article.isFeatured,
        isSponsored: article.isSponsored,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Cập nhật bài viết thành công",
      article,
    });
  } catch (error) {
    return handleAuthError(error);
  }
}

/**
 * DELETE /api/admin/news/[id]
 * Xóa hoặc lưu trữ bài viết
 */
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdmin();
    const { id } = await params;

    await connectToDatabase();

    const article = await NewsArticle.findById(id);
    if (!article) {
      return NextResponse.json(
        { error: "Không tìm thấy bài viết." },
        { status: 404 }
      );
    }

    const deletedTitle = article.title;
    await NewsArticle.findByIdAndDelete(id);

    await logAuditAction({
      admin: {
        id: admin.id,
        email: admin.email || "",
        name: admin.name || "Admin",
      },
      action: "DELETE",
      targetCollection: "news_articles",
      targetId: id,
      targetTitle: deletedTitle,
      reason: "Admin deleted article",
    });

    return NextResponse.json({
      success: true,
      message: "Đã xóa bài viết thành công",
    });
  } catch (error) {
    return handleAuthError(error);
  }
}
