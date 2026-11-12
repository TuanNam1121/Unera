import { NextRequest, NextResponse } from "next/server";
import { PipelineStage, Types } from "mongoose";
import {
  NEWS_ARTICLE_STATUS,
  NEWS_DATE_RANGES,
  NEWS_SORT_OPTIONS,
} from "@/constants";
import { connectToDatabase } from "@/lib/db";
import {
  ensureNewsIndexesInBackground,
  getCachedNewsTaxonomyLookup,
  promoteDueScheduledNews,
  RawNewsArticleDoc,
  serializeNewsArticle,
} from "@/lib/news";
import { escapeRegexInput, slugifyVietnamese } from "@/lib/orientation-utils";
import { getOptionalUserIdFromRequest } from "@/lib/session";
import { NewsArticle } from "@/models/NewsArticle";
import { NewsBookmark } from "@/models/NewsBookmark";
import type { INewsCategoryDTO } from "@/types";

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

const NEWS_LIST_PROJECTION =
  "_id title slug summary coverImage categoryId category tags authorName readTimeMinutes status scheduledAt publishedAt isFeatured isSponsored sponsorInfo sourceName sourceUrl viewCount bookmarkCount shareCount version createdAt";

const NEWS_AGG_PROJECT = {
  _id: 1,
  title: 1,
  slug: 1,
  summary: 1,
  coverImage: 1,
  categoryId: 1,
  category: 1,
  tags: 1,
  authorName: 1,
  readTimeMinutes: 1,
  status: 1,
  scheduledAt: 1,
  publishedAt: 1,
  isFeatured: 1,
  isSponsored: 1,
  sponsorInfo: 1,
  sourceName: 1,
  sourceUrl: 1,
  viewCount: 1,
  bookmarkCount: 1,
  shareCount: 1,
  version: 1,
  createdAt: 1,
} as const;

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

function hydrateNewsCategory(
  docs: RawNewsArticleDoc[],
  categoryById: Map<string, INewsCategoryDTO>
): RawNewsArticleDoc[] {
  return docs.map((doc) => {
    const cat = doc.categoryId
      ? categoryById.get(String(doc.categoryId)) || null
      : null;
    return {
      ...doc,
      categoryId: cat
        ? {
            _id: cat._id,
            name: cat.name,
            slug: cat.slug,
            colorToken: cat.colorToken,
          }
        : null,
    };
  });
}

async function runNewsFilterQuery(params: {
  matchFilter: Record<string, unknown>;
  sort: string;
  page: number;
  limit: number;
  useTextScore?: boolean;
}): Promise<{ docs: RawNewsArticleDoc[]; total: number }> {
  const { matchFilter, sort, page, limit, useTextScore } = params;
  const skip = (page - 1) * limit;

  if (sort === NEWS_SORT_OPTIONS.POPULAR) {
    const pipeline: PipelineStage[] = [
      { $match: matchFilter },
      {
        $addFields: {
          _popularScore: {
            $add: [
              { $ifNull: ["$viewCount", 0] },
              { $multiply: [{ $ifNull: ["$bookmarkCount", 0] }, 3] },
              { $multiply: [{ $ifNull: ["$shareCount", 0] }, 2] },
            ],
          },
        },
      },
      { $sort: { _popularScore: -1, viewCount: -1, publishedAt: -1, _id: -1 } },
      {
        $facet: {
          items: [
            { $skip: skip },
            { $limit: limit },
            { $project: NEWS_AGG_PROJECT },
          ],
          totalCount: [{ $count: "count" }],
        },
      },
    ];

    const aggRes = await NewsArticle.aggregate<{
      items: RawNewsArticleDoc[];
      totalCount: { count: number }[];
    }>(pipeline);

    const facet = aggRes[0];
    return {
      docs: facet?.items || [],
      total: facet?.totalCount?.[0]?.count ?? 0,
    };
  }

  const docs = (await NewsArticle.find(
    matchFilter,
    useTextScore ? { score: { $meta: "textScore" } } : undefined
  )
    .select(NEWS_LIST_PROJECTION)
    .sort(
      useTextScore
        ? ({ score: { $meta: "textScore" }, publishedAt: -1, createdAt: -1 } as Record<
            string,
            1 | -1 | { $meta: "textScore" }
          >)
        : { publishedAt: -1, createdAt: -1, _id: -1 }
    )
    .skip(skip)
    .limit(limit)
    .lean()) as unknown as RawNewsArticleDoc[];

  const total =
    page === 1 && docs.length < limit
      ? docs.length
      : await NewsArticle.countDocuments(matchFilter);

  return { docs, total };
}

export async function queryPublishedNews(req: NextRequest) {
  try {
    const [, taxonomyLookup, userId] = await Promise.all([
      connectToDatabase().then(() => promoteDueScheduledNews()),
      getCachedNewsTaxonomyLookup(),
      getOptionalUserIdFromRequest(req),
    ]);
    ensureNewsIndexesInBackground();

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

    const { categories, tags, categoryById, categoryBySlug, tagBySlug } =
      taxonomyLookup;

    const baseFilter: Record<string, unknown> = {
      status: NEWS_ARTICLE_STATUS.PUBLISHED,
    };

    if (rawCategory && rawCategory.toLowerCase() !== "all") {
      if (Types.ObjectId.isValid(rawCategory)) {
        baseFilter.categoryId = new Types.ObjectId(rawCategory);
      } else {
        const lowerCat = rawCategory.toLowerCase();
        const mappedSlug = CATEGORY_SLUG_ALIAS[lowerCat] || lowerCat;
        const matchedCat = categoryBySlug.get(mappedSlug);

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
        baseFilter.categoryId = new Types.ObjectId(matchedCat._id);
      }
    }

    if (rawTag && rawTag.toLowerCase() !== "all") {
      const rawTagLower = rawTag.toLowerCase();
      const normalizedTagSlug = slugifyVietnamese(rawTag);
      const matchedTag =
        tagBySlug.get(rawTagLower) ||
        (normalizedTagSlug ? tagBySlug.get(normalizedTagSlug) : undefined) ||
        tags.find((t) => t.name.toLowerCase() === rawTagLower);

      const tagPatterns = Array.from(
        new Set(
          [rawTag, matchedTag?.name, matchedTag?.slug].filter((v): v is string =>
            Boolean(v)
          )
        )
      ).map((v) => new RegExp(`^${escapeRegexInput(v)}$`, "i"));

      baseFilter.tags = { $in: tagPatterns };
    }

    const now = new Date();
    const rangeStart = getDateRangeStart(dateRange, now);
    if (rangeStart) {
      baseFilter.publishedAt = { $gte: rangeStart };
    }

    const shouldLoadFeatured =
      !rawCategory &&
      !rawTag &&
      !search &&
      dateRange === "all" &&
      page === 1;

    const queryNewsList = async (): Promise<{
      docs: RawNewsArticleDoc[];
      total: number;
    }> => {
      if (!search) {
        return runNewsFilterQuery({
          matchFilter: baseFilter,
          sort,
          page,
          limit,
        });
      }

      if (search.length >= 2) {
        try {
          const textRes = await runNewsFilterQuery({
            matchFilter: { ...baseFilter, $text: { $search: search } },
            sort,
            page,
            limit,
            useTextScore: sort !== NEWS_SORT_OPTIONS.POPULAR,
          });
          if (textRes.total > 0 || page > 1) {
            return textRes;
          }
        } catch {
          // Index may still be building on fresh deployments; fall back cleanly.
        }
      }

      const safeRegex = new RegExp(escapeRegexInput(search), "i");
      return runNewsFilterQuery({
        matchFilter: {
          ...baseFilter,
          $or: [
            { title: safeRegex },
            { summary: safeRegex },
            { tags: safeRegex },
            { authorName: safeRegex },
          ],
        },
        sort,
        page,
        limit,
      });
    };

    const [listResult, rawFeaturedDocs] = await Promise.all([
      queryNewsList(),
      shouldLoadFeatured
        ? (NewsArticle.find({
            status: NEWS_ARTICLE_STATUS.PUBLISHED,
            isFeatured: true,
          })
            .select(NEWS_LIST_PROJECTION)
            .sort({ publishedAt: -1, viewCount: -1 })
            .limit(4)
            .lean() as Promise<unknown[]>)
        : Promise.resolve([]),
    ]);

    const rawDocs = hydrateNewsCategory(listResult.docs, categoryById);
    const hydratedFeatured = hydrateNewsCategory(
      rawFeaturedDocs as RawNewsArticleDoc[],
      categoryById
    );

    const bookmarkedIds = new Set<string>();
    if (userId && Types.ObjectId.isValid(userId)) {
      const checkIds = [
        ...rawDocs.map((d) => d._id),
        ...hydratedFeatured.map((d) => d._id),
      ];
      if (checkIds.length > 0) {
        const bookmarks = await NewsBookmark.find({
          userId: new Types.ObjectId(userId),
          articleId: { $in: checkIds },
        })
          .select("articleId")
          .lean();
        for (const b of bookmarks) {
          bookmarkedIds.add(b.articleId.toString());
        }
      }
    }

    const total = listResult.total;
    const totalPages = total === 0 ? 0 : Math.ceil(total / limit);

    return NextResponse.json({
      success: true,
      articles: rawDocs.map((doc) =>
        serializeNewsArticle(doc, { bookmarkedIds })
      ),
      featuredArticles: hydratedFeatured.map((doc) =>
        serializeNewsArticle(doc, { bookmarkedIds })
      ),
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
