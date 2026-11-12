import { NextRequest, NextResponse } from "next/server";
import { NEWS_ARTICLE_STATUS, type NewsArticleStatus } from "@/constants";
import { connectToDatabase } from "@/lib/db";
import { handleAuthError, requireAdmin } from "@/lib/session";
import { promoteDueScheduledNews, RawNewsArticleDoc } from "@/lib/news";
import { NewsCategory } from "@/models/NewsCategory";
import { NewsArticle } from "@/models/NewsArticle";

export async function GET(req: NextRequest) {
  try {
    await requireAdmin(req);
    await connectToDatabase();
    await promoteDueScheduledNews();

    const [categories, rawArticles] = await Promise.all([
      NewsCategory.find().sort({ order: 1, name: 1 }).lean(),
      NewsArticle.find()
        .select("-contentJson -contentText")
        .populate("categoryId", "name slug colorToken")
        .lean(),
    ]);

    const articles = rawArticles as unknown as RawNewsArticleDoc[];

    const byStatus: Record<NewsArticleStatus, number> = {
      DRAFT: 0,
      SCHEDULED: 0,
      PUBLISHED: 0,
      UNPUBLISHED: 0,
    };

    let featuredArticles = 0;
    let totalViews = 0;
    let totalBookmarks = 0;
    let totalShares = 0;

    const catMap = new Map<
      string,
      {
        categoryId: string;
        name: string;
        slug: string;
        colorToken: string;
        totalCount: number;
        publishedCount: number;
        totalViews: number;
        totalBookmarks: number;
        totalShares: number;
      }
    >();

    for (const cat of categories) {
      catMap.set(cat._id.toString(), {
        categoryId: cat._id.toString(),
        name: cat.name,
        slug: cat.slug,
        colorToken: cat.colorToken || "blue",
        totalCount: 0,
        publishedCount: 0,
        totalViews: 0,
        totalBookmarks: 0,
        totalShares: 0,
      });
    }

    const enriched = articles.map((doc) => {
      if (doc.status in byStatus) {
        byStatus[doc.status] += 1;
      }
      if (doc.isFeatured && doc.status === NEWS_ARTICLE_STATUS.PUBLISHED) {
        featuredArticles += 1;
      }

      const views = typeof doc.viewCount === "number" ? doc.viewCount : 0;
      const bookmarks =
        typeof doc.bookmarkCount === "number" ? doc.bookmarkCount : 0;
      const shares = typeof doc.shareCount === "number" ? doc.shareCount : 0;

      totalViews += views;
      totalBookmarks += bookmarks;
      totalShares += shares;

      const catRef =
        doc.categoryId &&
        typeof doc.categoryId === "object" &&
        "_id" in doc.categoryId &&
        "name" in doc.categoryId
          ? doc.categoryId
          : null;

      if (catRef) {
        const bucket = catMap.get(catRef._id.toString());
        if (bucket) {
          bucket.totalCount += 1;
          if (doc.status === NEWS_ARTICLE_STATUS.PUBLISHED) {
            bucket.publishedCount += 1;
          }
          bucket.totalViews += views;
          bucket.totalBookmarks += bookmarks;
          bucket.totalShares += shares;
        }
      }

      return {
        _id: doc._id.toString(),
        title: doc.title,
        slug: doc.slug,
        categoryName: catRef?.name || doc.category || "Chưa phân loại",
        viewCount: views,
        bookmarkCount: bookmarks,
        shareCount: shares,
        publishedAt: doc.publishedAt ?? null,
      };
    });

    const topViewed = [...enriched]
      .sort((a, b) => b.viewCount - a.viewCount || b.bookmarkCount - a.bookmarkCount)
      .slice(0, 10);

    const topBookmarked = [...enriched]
      .sort((a, b) => b.bookmarkCount - a.bookmarkCount || b.viewCount - a.viewCount)
      .slice(0, 10);

    const topShared = [...enriched]
      .sort((a, b) => b.shareCount - a.shareCount || b.viewCount - a.viewCount)
      .slice(0, 10);

    return NextResponse.json({
      success: true,
      analytics: {
        kpi: {
          totalArticles: articles.length,
          publishedArticles: byStatus.PUBLISHED,
          scheduledArticles: byStatus.SCHEDULED,
          draftArticles: byStatus.DRAFT,
          unpublishedArticles: byStatus.UNPUBLISHED,
          featuredArticles,
          totalViews,
          totalBookmarks,
          totalShares,
        },
        byStatus,
        byCategory: Array.from(catMap.values()),
        topViewed,
        topBookmarked,
        topShared,
      },
    });
  } catch (error) {
    return handleAuthError(error);
  }
}

