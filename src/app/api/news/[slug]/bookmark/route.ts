import { NextRequest, NextResponse } from "next/server";
import { Types } from "mongoose";
import { NEWS_ARTICLE_STATUS } from "@/constants";
import { connectToDatabase } from "@/lib/db";
import { handleAuthError, requireAuth } from "@/lib/session";
import { promoteDueScheduledNews, revalidateNewsRoutes } from "@/lib/news";
import { NewsArticle } from "@/models/NewsArticle";
import { NewsBookmark } from "@/models/NewsBookmark";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const user = await requireAuth(req);
    await connectToDatabase();
    await promoteDueScheduledNews();

    const { slug } = await params;
    const trimmed = slug.trim();
    const userObjId = new Types.ObjectId(user.id);

    const matchCondition = Types.ObjectId.isValid(trimmed)
      ? { $or: [{ _id: new Types.ObjectId(trimmed) }, { slug: trimmed.toLowerCase() }] }
      : { slug: trimmed.toLowerCase() };

    const article = await NewsArticle.findOne(matchCondition).select(
      "_id slug status bookmarkCount"
    );

    if (!article) {
      // Allow removing orphaned bookmark if called with raw article ObjectId
      if (Types.ObjectId.isValid(trimmed)) {
        await NewsBookmark.deleteOne({
          userId: userObjId,
          articleId: new Types.ObjectId(trimmed),
        });
        revalidateNewsRoutes();
        return NextResponse.json({
          success: true,
          bookmarked: false,
          bookmarkCount: 0,
          message: "Đã bỏ lưu bài viết",
        });
      }
      return NextResponse.json(
        { error: "Không tìm thấy bài viết tin tức" },
        { status: 404 }
      );
    }

    const existing = await NewsBookmark.findOne({
      userId: userObjId,
      articleId: article._id,
    });

    if (existing) {
      await NewsBookmark.deleteOne({ _id: existing._id });
      const updated = await NewsArticle.findOneAndUpdate(
        { _id: article._id, bookmarkCount: { $gt: 0 } },
        { $inc: { bookmarkCount: -1 } },
        { returnDocument: "after" }
      ).select("bookmarkCount");

      revalidateNewsRoutes(article.slug);

      return NextResponse.json({
        success: true,
        bookmarked: false,
        bookmarkCount: updated?.bookmarkCount ?? 0,
        message: "Đã bỏ lưu bài viết",
      });
    }

    if (article.status !== NEWS_ARTICLE_STATUS.PUBLISHED) {
      return NextResponse.json(
        { error: "Bài viết chưa xuất bản nên không thể lưu" },
        { status: 404 }
      );
    }

    let nextCount = article.bookmarkCount || 0;
    try {
      await NewsBookmark.create({
        userId: userObjId,
        articleId: article._id,
      });
      const updated = await NewsArticle.findByIdAndUpdate(
        article._id,
        { $inc: { bookmarkCount: 1 } },
        { returnDocument: "after" }
      ).select("bookmarkCount");
      nextCount = updated?.bookmarkCount ?? nextCount + 1;
    } catch (err: unknown) {
      const isDup =
        typeof err === "object" &&
        err !== null &&
        "code" in err &&
        (err as { code?: number }).code === 11000;
      if (!isDup) throw err;
    }

    revalidateNewsRoutes(article.slug);

    return NextResponse.json({
      success: true,
      bookmarked: true,
      bookmarkCount: nextCount,
      message: "Đã lưu bài viết vào danh sách yêu thích",
    });
  } catch (error) {
    return handleAuthError(error);
  }
}

