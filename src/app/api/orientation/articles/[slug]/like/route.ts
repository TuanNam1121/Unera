import { NextResponse } from "next/server";
import { Types } from "mongoose";
import { ORIENTATION_ARTICLE_STATUS } from "@/constants";
import { connectToDatabase } from "@/lib/db";
import { handleAuthError, requireAuth } from "@/lib/session";
import { ArticleLike } from "@/models/ArticleLike";
import { OrientationArticle } from "@/models/OrientationArticle";

/**
 * POST /api/orientation/articles/[slug]/like
 * Toggle thích / bỏ thích bài viết Khám phá định hướng
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const authUser = await requireAuth(req);
    const { slug } = await params;
    const normalizedSlug = slug.trim().toLowerCase();

    await connectToDatabase();

    const article = await OrientationArticle.findOne({
      slug: normalizedSlug,
      status: ORIENTATION_ARTICLE_STATUS.PUBLISHED,
    })
      .select("_id likeCount")
      .lean();

    if (!article) {
      return NextResponse.json(
        { error: "Không tìm thấy bài viết định hướng." },
        { status: 404 }
      );
    }

    const userObjectId = new Types.ObjectId(authUser.id);
    const existing = await ArticleLike.findOne({
      articleId: article._id,
      userId: userObjectId,
    });

    let liked = false;
    let delta = 0;

    if (existing) {
      await ArticleLike.deleteOne({ _id: existing._id });
      liked = false;
      delta = -1;
    } else {
      try {
        await ArticleLike.create({
          articleId: article._id,
          userId: userObjectId,
        });
        liked = true;
        delta = 1;
      } catch (err: unknown) {
        const mongoCode =
          err && typeof err === "object" && "code" in err
            ? (err as { code?: number }).code
            : undefined;
        if (mongoCode === 11000) {
          liked = true;
          delta = 0;
        } else {
          throw err;
        }
      }
    }

    const nextLikeCount = Math.max(0, (article.likeCount || 0) + delta);
    if (delta !== 0) {
      await OrientationArticle.updateOne(
        { _id: article._id },
        { $set: { likeCount: nextLikeCount } }
      );
    }

    return NextResponse.json({
      success: true,
      liked,
      likeCount: nextLikeCount,
    });
  } catch (error) {
    return handleAuthError(error);
  }
}

