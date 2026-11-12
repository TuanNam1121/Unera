import { NextRequest, NextResponse } from "next/server";
import { connection } from "next/server";
import { Types } from "mongoose";
import { NEWS_ARTICLE_STATUS } from "@/constants";
import { connectToDatabase } from "@/lib/db";
import { handleAuthError, requireAuth } from "@/lib/session";
import {
  promoteDueScheduledNews,
  RawNewsArticleDoc,
  serializeNewsArticle,
} from "@/lib/news";
import { NewsBookmark } from "@/models/NewsBookmark";
import { NewsReadingHistory } from "@/models/NewsReadingHistory";

interface PopulatedHistoryDoc {
  _id: Types.ObjectId | string;
  articleId: RawNewsArticleDoc | Types.ObjectId | null;
  lastReadAt: Date;
  readCount: number;
}

export async function GET(req: NextRequest) {
  await connection();

  try {
    const user = await requireAuth(req);
    await connectToDatabase();
    await promoteDueScheduledNews();

    const { searchParams } = new URL(req.url);
    const page = Math.max(
      1,
      parseInt(searchParams.get("page") || "1", 10) || 1
    );
    const limit = Math.min(
      50,
      Math.max(1, parseInt(searchParams.get("limit") || "12", 10) || 12)
    );
    const skip = (page - 1) * limit;
    const userObjId = new Types.ObjectId(user.id);

    const [total, rawHistory, userBookmarks] = await Promise.all([
      NewsReadingHistory.countDocuments({ userId: userObjId }),
      NewsReadingHistory.find({ userId: userObjId })
        .sort({ lastReadAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate({
          path: "articleId",
          select: "-contentJson -contentText",
          populate: {
            path: "categoryId",
            select: "name slug colorToken",
          },
        })
        .lean() as Promise<unknown[]>,
      NewsBookmark.find({ userId: userObjId }).select("articleId").lean(),
    ]);

    const bookmarkedIds = new Set(
      userBookmarks.map((b) => b.articleId.toString())
    );

    const typedHistory = rawHistory as PopulatedHistoryDoc[];
    const items = typedHistory.map((row) => {
      const populatedArticle =
        row.articleId &&
        typeof row.articleId === "object" &&
        "title" in row.articleId
          ? (row.articleId as RawNewsArticleDoc)
          : null;

      const isAvailable = Boolean(
        populatedArticle &&
          populatedArticle.status === NEWS_ARTICLE_STATUS.PUBLISHED
      );

      const rawArticleId =
        populatedArticle?._id.toString() ||
        (row.articleId ? row.articleId.toString() : "");

      return {
        _id: row._id.toString(),
        articleId: rawArticleId,
        lastReadAt: row.lastReadAt,
        readCount: row.readCount || 1,
        isAvailable,
        article:
          isAvailable && populatedArticle
            ? serializeNewsArticle(populatedArticle, { bookmarkedIds })
            : null,
      };
    });

    const totalPages = total === 0 ? 0 : Math.ceil(total / limit);

    return NextResponse.json({
      success: true,
      items,
      total,
      page,
      totalPages,
      pagination: { page, limit, total, totalPages },
    });
  } catch (error) {
    return handleAuthError(error);
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const user = await requireAuth(req);
    await connectToDatabase();

    const { searchParams } = new URL(req.url);
    const articleId = (searchParams.get("articleId") || "").trim();
    const userObjId = new Types.ObjectId(user.id);

    if (articleId) {
      if (!Types.ObjectId.isValid(articleId)) {
        return NextResponse.json(
          { error: "ID bài viết không hợp lệ" },
          { status: 400 }
        );
      }
      await NewsReadingHistory.deleteOne({
        userId: userObjId,
        articleId: new Types.ObjectId(articleId),
      });
      return NextResponse.json({
        success: true,
        message: "Đã xóa bài viết khỏi lịch sử đọc",
      });
    }

    await NewsReadingHistory.deleteMany({ userId: userObjId });
    return NextResponse.json({
      success: true,
      message: "Đã xóa toàn bộ lịch sử bài viết đã đọc",
    });
  } catch (error) {
    return handleAuthError(error);
  }
}

