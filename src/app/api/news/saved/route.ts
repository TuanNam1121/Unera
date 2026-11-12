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

interface PopulatedBookmarkDoc {
  _id: Types.ObjectId | string;
  articleId: RawNewsArticleDoc | Types.ObjectId | null;
  createdAt: Date;
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
      Math.max(1, parseInt(searchParams.get("limit") || "9", 10) || 9)
    );
    const skip = (page - 1) * limit;
    const userObjId = new Types.ObjectId(user.id);

    const [total, rawBookmarks] = await Promise.all([
      NewsBookmark.countDocuments({ userId: userObjId }),
      NewsBookmark.find({ userId: userObjId })
        .sort({ createdAt: -1 })
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
    ]);

    const typedBookmarks = rawBookmarks as PopulatedBookmarkDoc[];
    const bookmarkedIds = new Set<string>();
    for (const bm of typedBookmarks) {
      if (bm.articleId && typeof bm.articleId === "object" && "_id" in bm.articleId) {
        bookmarkedIds.add(bm.articleId._id.toString());
      }
    }

    const items = typedBookmarks.map((bm) => {
      const populatedArticle =
        bm.articleId &&
        typeof bm.articleId === "object" &&
        "title" in bm.articleId
          ? (bm.articleId as RawNewsArticleDoc)
          : null;

      const isAvailable = Boolean(
        populatedArticle &&
          populatedArticle.status === NEWS_ARTICLE_STATUS.PUBLISHED
      );

      const rawId =
        populatedArticle?._id.toString() ||
        (bm.articleId ? bm.articleId.toString() : "");

      return {
        _id: bm._id.toString(),
        articleId: rawId,
        savedAt: bm.createdAt,
        isAvailable,
        article: isAvailable && populatedArticle
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

