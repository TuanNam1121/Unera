import { NextResponse, connection } from "next/server";
import { ORIENTATION_ARTICLE_STATUS } from "@/constants";
import { connectToDatabase } from "@/lib/db";
import { serializeOrientationArticle } from "@/lib/orientation";
import { getCurrentUser } from "@/lib/session";
import { ArticleLike } from "@/models/ArticleLike";
import { OrientationArticle } from "@/models/OrientationArticle";

/**
 * GET /api/orientation/articles/[slug]
 * Chi tiết bài viết Khám phá định hướng (trả contentJson để render bằng TiptapContentRenderer)
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  await connection();

  try {
    const { slug } = await params;
    const normalizedSlug = slug.trim().toLowerCase();

    if (!normalizedSlug) {
      return NextResponse.json(
        { error: "Đường dẫn bài viết không hợp lệ." },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const doc = await OrientationArticle.findOneAndUpdate(
      {
        slug: normalizedSlug,
        status: ORIENTATION_ARTICLE_STATUS.PUBLISHED,
      },
      { $inc: { viewCount: 1 } },
      { returnDocument: "after" }
    )
      .populate("categoryId", "name slug")
      .populate("topicIds", "name slug isActive")
      .lean();

    if (!doc) {
      return NextResponse.json(
        { error: "Không tìm thấy bài viết định hướng hoặc bài viết đã ẩn." },
        { status: 404 }
      );
    }

    let currentUser = null;
    try {
      currentUser = await getCurrentUser(req);
    } catch {
      currentUser = null;
    }

    const likedIds = new Set<string>();
    if (currentUser) {
      const existingLike = await ArticleLike.exists({
        articleId: doc._id,
        userId: currentUser.id,
      });
      if (existingLike) {
        likedIds.add(doc._id.toString());
      }
    }

    const relatedDocs = await OrientationArticle.find({
      _id: { $ne: doc._id },
      categoryId:
        typeof doc.categoryId === "object" && doc.categoryId !== null && "_id" in doc.categoryId
          ? doc.categoryId._id
          : doc.categoryId,
      status: ORIENTATION_ARTICLE_STATUS.PUBLISHED,
    })
      .select("-contentJson -contentText")
      .sort({ isFeatured: -1, publishedAt: -1 })
      .limit(3)
      .populate("categoryId", "name slug")
      .populate("topicIds", "name slug isActive")
      .lean();

    return NextResponse.json({
      success: true,
      article: serializeOrientationArticle(doc, {
        likedIds,
        includeContent: true,
        onlyActiveTopics: true,
      }),
      relatedArticles: relatedDocs.map((rel) =>
        serializeOrientationArticle(rel, {
          likedIds,
          onlyActiveTopics: true,
        })
      ),
    });
  } catch (error) {
    console.error("GET /api/orientation/articles/[slug] error:", error);
    return NextResponse.json(
      { error: "Không thể tải nội dung bài viết." },
      { status: 500 }
    );
  }
}

