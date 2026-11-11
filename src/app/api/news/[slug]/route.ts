import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { NewsArticle } from "@/models/NewsArticle";

/**
 * GET /api/news/[slug]
 * Chi tiết bài viết theo slug
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    await connectToDatabase();

    const article = await NewsArticle.findOne({
      $or: [{ slug }, { _id: slug.length === 24 ? slug : null }],
      status: "PUBLISHED",
    }).lean();

    if (!article) {
      return NextResponse.json(
        { error: "Không tìm thấy bài viết yêu cầu." },
        { status: 404 }
      );
    }

    // Lấy bài viết liên quan cùng chuyên mục
    const relatedArticles = await NewsArticle.find({
      _id: { $ne: article._id },
      category: article.category,
      status: "PUBLISHED",
    })
      .limit(3)
      .lean();

    return NextResponse.json({
      success: true,
      article,
      relatedArticles,
    });
  } catch (error) {
    console.error("GET /api/news/[slug] error", error);
    return NextResponse.json(
      { error: "Lỗi khi tải chi tiết bài viết." },
      { status: 500 }
    );
  }
}
