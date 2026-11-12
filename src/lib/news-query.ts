import { NextRequest, NextResponse } from "next/server";
import { Types } from "mongoose";
import {
  NEWS_ARTICLE_STATUS,
  NEWS_DATE_RANGES,
  NEWS_SORT_OPTIONS,
} from "@/constants";
import { connectToDatabase } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { escapeRegexInput, slugifyVietnamese } from "@/lib/orientation-utils";
import {
  getActiveNewsCategories,
  getActiveNewsTags,
  promoteDueScheduledNews,
  RawNewsArticleDoc,
  serializeNewsArticle,
} from "@/lib/news";
import { computeNewsPopularScore } from "@/lib/news-utils";
import { NewsCategory } from "@/models/NewsCategory";
import { NewsTag } from "@/models/NewsTag";
import { NewsArticle } from "@/models/NewsArticle";
import { NewsBookmark } from "@/models/NewsBookmark";

const CATEGORY_SLUG_ALIAS: Record<string, string> = {
  orientation: "orientation",
  study_abroad: "study-abroad",
  "study-abroad": "study-abroad",
  disciplines: "disciplines",
  postgrad: "postgrad",
  skills_cv: "skills-cv",
  "skills-cv": "skills-cv",
  scholarships: "scholarships",
};

function getDateRangeStart(dateRange: string, now: Date): Date | null {
  switch (dateRange) {
    case NEWS_DATE_RANGES.TODAY: {
      const start = new Date(now);
      start.setHours(0, 0, 0, 0);
      return start;
    }
    case NEWS_DATE_RANGES.LAST_7_DAYS:
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    case NEWS_DATE_RANGES.LAST_30_DAYS:
      return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    case NEWS_DATE_RANGES.LAST_90_DAYS:
      return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    default:
      return null;
  }
}

export async function queryPublishedNews(req: NextRequest) {
  try {
    await connectToDatabase();
    await promoteDueScheduledNews();

    const currentUser = await getCurrentUser(req);
    const { searchParams } = new URL(req.url);

    const rawCategory = (searchParams.get("category") || "").trim();
    const rawTag = (searchParams.get("tag") || "").trim();
    const search = (
      searchParams.get("search") ||
      searchParams.get("q") ||
      ""
    ).trim();
    const dateRange = (searchParams.get("dateRange") || "all").toLowerCase();
    const sort = (searchParams.get("sort") || NEWS_SORT_OPTIONS.LATEST).toLowerCase();
    const page = Math.max(
      1,
      parseInt(searchParams.get("page") || "1", 10) || 1
    );
    const limit = Math.min(
      50,
      Math.max(1, parseInt(searchParams.get("limit") || "9", 10) || 9)
    );

    const [categories, tags] = await Promise.all([
      getActiveNewsCategories(),
      getActiveNewsTags(),
    ]);

    let bookmarkedIds = new Set<string>();
    if (currentUser && Types.ObjectId.isValid(currentUser.id)) {
      const bookmarks = await NewsBookmark.find({
        userId: new Types.ObjectId(currentUser.id),
      })
        .select("articleId")
        .lean();
      bookmarkedIds = new Set(bookmarks.map((b) => b.articleId.toString()));
    }

    const filter: Record<string, unknown> = {
      status: NEWS_ARTICLE_STATUS.PUBLISHED,
    };

    if (rawCategory && rawCategory.toLowerCase() !== "all") {
      if (Types.ObjectId.isValid(rawCategory)) {
        filter.categoryId = new Types.ObjectId(rawCategory);
      } else {
        const lowerCat = rawCategory.toLowerCase();
        const mappedSlug = CATEGORY_SLUG_ALIAS[lowerCat] || lowerCat;
        const matchedCat = await NewsCategory.findOne({
          slug: mappedSlug,
          isActive: true,
        })
          .select("_id slug")
          .lean();

        if (!matchedCat) {
          return NextResponse.json({
            success: true,
            articles: [],
            featuredArticles: [],
            categories,
            tags,
            total: 0,
            page,
            totalPages: 0,
            pagination: { page, limit, total: 0, totalPages: 0 },
          });
        }
        filter.categoryId = matchedCat._id;
      }
    }

    if (rawTag && rawTag.toLowerCase() !== "all") {
      const tagSlug = slugifyVietnamese(rawTag);
      const matchedTag = await NewsTag.findOne({
        $or: [
          { slug: rawTag.toLowerCase() },
          ...(tagSlug ? [{ slug: tagSlug }] : []),
          { name: new RegExp(`^${escapeRegexInput(rawTag)}$`, "i") },
        ],
      })
        .select("name slug")
        .lean();

      const tagPatterns = Array.from(
        new Set(
          [rawTag, matchedTag?.name, matchedTag?.slug].filter((v): v is string =>
            Boolean(v)
          )
        )
      ).map((v) => new RegExp(`^${escapeRegexInput(v)}$`, "i"));

      filter.tags = { $in: tagPatterns };
    }

    const now = new Date();
    const rangeStart = getDateRangeStart(dateRange, now);
    if (rangeStart) {
      filter.publishedAt = { $gte: rangeStart };
    }

    if (search) {
      const regex = new RegExp(escapeRegexInput(search), "i");
      filter.$or = [
        { title: regex },
        { summary: regex },
        { tags: regex },
        { authorName: regex },
        { contentText: regex },
      ];
    }

    const [rawDocs, rawFeaturedDocs] = await Promise.all([
      NewsArticle.find(filter)
        .select("-contentJson -contentText")
        .populate("categoryId", "name slug colorToken")
        .lean() as Promise<unknown[]>,
      NewsArticle.find({
        status: NEWS_ARTICLE_STATUS.PUBLISHED,
        isFeatured: true,
      })
        .select("-contentJson -contentText")
        .populate("categoryId", "name slug colorToken")
        .sort({ publishedAt: -1, viewCount: -1 })
        .limit(4)
        .lean() as Promise<unknown[]>,
    ]);

    const items = (rawDocs as RawNewsArticleDoc[]).map((doc) =>
      serializeNewsArticle(doc, { bookmarkedIds })
    );

    items.sort((a, b) => {
      if (sort === NEWS_SORT_OPTIONS.POPULAR) {
        const diff = computeNewsPopularScore(b) - computeNewsPopularScore(a);
        if (diff !== 0) return diff;
        return (b.viewCount || 0) - (a.viewCount || 0);
      }

      const aTime = new Date(a.publishedAt || a.createdAt || 0).getTime();
      const bTime = new Date(b.publishedAt || b.createdAt || 0).getTime();
      return bTime - aTime;
    });

    const total = items.length;
    const totalPages = total === 0 ? 0 : Math.ceil(total / limit);
    const start = (page - 1) * limit;

    const featuredArticles = (rawFeaturedDocs as RawNewsArticleDoc[]).map(
      (doc) => serializeNewsArticle(doc, { bookmarkedIds })
    );

    return NextResponse.json({
      success: true,
      articles: items.slice(start, start + limit),
      featuredArticles,
      categories,
      tags,
      total,
      page,
      totalPages,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    });
  } catch (error) {
    console.error("queryPublishedNews error:", error);
    return NextResponse.json(
      { error: "Không thể tải danh sách tin tức" },
      { status: 500 }
    );
  }
}

