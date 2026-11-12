import { NextRequest, NextResponse } from "next/server";
import { connection } from "next/server";
import { Types } from "mongoose";
import { NEWS_ARTICLE_STATUS, USER_ROLES } from "@/constants";
import { connectToDatabase } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import {
  promoteDueScheduledNews,
  RawNewsArticleDoc,
  serializeNewsArticle,
} from "@/lib/news";
import { NewsArticle } from "@/models/NewsArticle";
import { NewsBookmark } from "@/models/NewsBookmark";
import { NewsReadingHistory } from "@/models/NewsReadingHistory";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  await connection();

  try {
    await connectToDatabase();
    await promoteDueScheduledNews();

    const { slug } = await params;
    const trimmed = slug.trim();
    const currentUser = await getCurrentUser(req);
    const isAdmin = currentUser?.role === USER_ROLES.ADMIN;

    const matchCondition = Types.ObjectId.isValid(trimmed)
      ? { $or: [{ _id: new Types.ObjectId(trimmed) }, { slug: trimmed.toLowerCase() }] }
      : { slug: trimmed.toLowerCase() };

    const query = isAdmin
      ? matchCondition
      : { ...matchCondition, status: NEWS_ARTICLE_STATUS.PUBLISHED };

    const doc = (await NewsArticle.findOne(query)
      .populate("categoryId", "name slug colorToken")
      .lean()) as unknown as RawNewsArticleDoc | null;

    if (!doc) {
      return NextResponse.json(
        { error: "Không tìm thấy bài viết tin tức hoặc bài viết đã ẩn" },
        { status: 404 }
      );
    }

    let updatedViewCount = typeof doc.viewCount === "number" ? doc.viewCount : 0;
    if (doc.status === NEWS_ARTICLE_STATUS.PUBLISHED) {
      await NewsArticle.updateOne(
        { _id: doc._id },
        { $inc: { viewCount: 1 } }
      );
      updatedViewCount += 1;
    }

    let isBookmarked = false;
    const bookmarkedIds = new Set<string>();

    if (currentUser && Types.ObjectId.isValid(currentUser.id)) {
      const userObjId = new Types.ObjectId(currentUser.id);
      const articleObjId = new Types.ObjectId(doc._id.toString());

      const existingBookmark = await NewsBookmark.exists({
        userId: userObjId,
        articleId: articleObjId,
      });

      if (existingBookmark) {
        isBookmarked = true;
        bookmarkedIds.add(doc._id.toString());
      }

      if (doc.status === NEWS_ARTICLE_STATUS.PUBLISHED) {
        await NewsReadingHistory.findOneAndUpdate(
          { userId: userObjId, articleId: articleObjId },
          {
            $set: { lastReadAt: new Date() },
            $inc: { readCount: 1 },
          },
          { upsert: true, returnDocument: "after" }
        );
      }
    }

    const article = serializeNewsArticle(
      { ...doc, viewCount: updatedViewCount },
      { bookmarkedIds, includeContent: true }
    );

    const categoryObjId =
      doc.categoryId &&
      typeof doc.categoryId === "object" &&
      "_id" in doc.categoryId
        ? doc.categoryId._id
        : doc.categoryId;

    const currentTags = Array.isArray(doc.tags) ? doc.tags : [];
    const relatedOr: Record<string, unknown>[] = [];
    if (categoryObjId) relatedOr.push({ categoryId: categoryObjId });
    if (currentTags.length > 0) relatedOr.push({ tags: { $in: currentTags } });

    const relatedCandidates = (await NewsArticle.find({
      _id: { $ne: doc._id },
      status: NEWS_ARTICLE_STATUS.PUBLISHED,
      ...(relatedOr.length > 0 ? { $or: relatedOr } : {}),
    })
      .select("-contentJson -contentText")
      .populate("categoryId", "name slug colorToken")
      .sort({ publishedAt: -1, viewCount: -1 })
      .limit(12)
      .lean()) as unknown as RawNewsArticleDoc[];

    const tagSet = new Set(currentTags.map((t) => t.toLowerCase()));
    const scoredRelated = relatedCandidates
      .map((cand) => {
        const candTags = Array.isArray(cand.tags) ? cand.tags : [];
        const overlap = candTags.filter((t) => tagSet.has(t.toLowerCase())).length;
        const candCatId =
          cand.categoryId &&
          typeof cand.categoryId === "object" &&
          "_id" in cand.categoryId
            ? cand.categoryId._id.toString()
            : cand.categoryId?.toString();
        const sameCategory =
          categoryObjId && candCatId === categoryObjId.toString() ? 1 : 0;
        return {
          cand,
          score: overlap * 3 + sameCategory * 2,
        };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 4)
      .map((entry) => entry.cand);

    let relatedBookmarkedIds = bookmarkedIds;
    if (
      currentUser &&
      Types.ObjectId.isValid(currentUser.id) &&
      scoredRelated.length > 0
    ) {
      const relBm = await NewsBookmark.find({
        userId: new Types.ObjectId(currentUser.id),
        articleId: { $in: scoredRelated.map((r) => r._id) },
      })
        .select("articleId")
        .lean();
      relatedBookmarkedIds = new Set([
        ...bookmarkedIds,
        ...relBm.map((b) => b.articleId.toString()),
      ]);
    }

    return NextResponse.json({
      success: true,
      article,
      relatedArticles: scoredRelated.map((rel) =>
        serializeNewsArticle(rel, { bookmarkedIds: relatedBookmarkedIds })
      ),
      isBookmarked,
    });
  } catch (error) {
    console.error("GET /api/news/[slug] error:", error);
    return NextResponse.json(
      { error: "Không thể tải chi tiết bài viết" },
      { status: 500 }
    );
  }
}

