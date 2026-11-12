import { NextRequest, NextResponse } from "next/server";
import { PipelineStage, Types } from "mongoose";
import {
  ACTIVITY_COMPUTED_STATUS,
  ACTIVITY_PUBLISH_STATUS,
  type ActivityComputedStatus,
} from "@/constants";
import {
  ensureActivityIndexesInBackground,
  getCachedActivityCategoryLookup,
  RawActivityDoc,
  serializeStudentActivity,
} from "@/lib/activities";
import { connectToDatabase } from "@/lib/db";
import { escapeRegexInput } from "@/lib/orientation-utils";
import { getOptionalUserIdFromRequest } from "@/lib/session";
import { ActivityFollow } from "@/models/ActivityFollow";
import { StudentActivity } from "@/models/StudentActivity";

const TYPE_SLUG_ALIAS: Record<string, string> = {
  research: "nckh",
  mt: "management-trainee",
  competitions: "cuoc-thi",
  ambassador: "dai-su-sinh-vien",
  scholarships: "hoc-bong",
  events: "su-kien",
};

const VALID_COMPUTED_STATUSES = new Set<string>(
  Object.values(ACTIVITY_COMPUTED_STATUS)
);

const MAX_FUTURE_DATE = new Date("9999-12-31T23:59:59.999Z");
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

export const ACTIVITY_LIST_PROJECT = {
  _id: 1,
  title: 1,
  slug: 1,
  summary: 1,
  coverImage: 1,
  categoryId: 1,
  organizer: 1,
  location: 1,
  isDomestic: 1,
  openingDate: 1,
  deadline: 1,
  eventDate: 1,
  eventEndDate: 1,
  registrationUrl: 1,
  tags: 1,
  publishStatus: 1,
  manualClosed: 1,
  isFeatured: 1,
  followerCount: 1,
  viewCount: 1,
  version: 1,
  publishedAt: 1,
  createdAt: 1,
} as const;

export interface PaginatedActivityAggregationOptions {
  baseFilter: Record<string, unknown>;
  q?: string;
  computedStatusFilter?: ActivityComputedStatus[];
  sort: "deadline_asc" | "event_asc" | "popular" | "newest" | "updated_desc";
  page: number;
  limit: number;
  now?: Date;
}

function buildComputedStatusExpression(now: Date, sevenDaysLater: Date) {
  return {
    $let: {
      vars: {
        maxTerminal: { $max: ["$deadline", "$eventDate", "$eventEndDate"] },
      },
      in: {
        $switch: {
          branches: [
            {
              case: { $eq: ["$manualClosed", true] },
              then: ACTIVITY_COMPUTED_STATUS.CLOSED,
            },
            {
              case: {
                $and: [
                  { $ne: ["$$maxTerminal", null] },
                  { $lt: ["$$maxTerminal", now] },
                ],
              },
              then: ACTIVITY_COMPUTED_STATUS.EXPIRED,
            },
            {
              case: {
                $and: [
                  { $ne: ["$openingDate", null] },
                  { $gt: ["$openingDate", now] },
                ],
              },
              then: ACTIVITY_COMPUTED_STATUS.UPCOMING_OPEN,
            },
            {
              case: {
                $and: [
                  { $ne: ["$deadline", null] },
                  { $gte: ["$deadline", now] },
                  { $lte: ["$deadline", sevenDaysLater] },
                ],
              },
              then: ACTIVITY_COMPUTED_STATUS.CLOSING_SOON,
            },
            {
              case: {
                $and: [
                  { $ne: ["$eventDate", null] },
                  { $gte: ["$eventDate", now] },
                  { $lte: ["$eventDate", sevenDaysLater] },
                ],
              },
              then: ACTIVITY_COMPUTED_STATUS.EVENT_SOON,
            },
            {
              case: {
                $and: [
                  { $ne: ["$deadline", null] },
                  { $lt: ["$deadline", now] },
                ],
              },
              then: ACTIVITY_COMPUTED_STATUS.CLOSED,
            },
          ],
          default: ACTIVITY_COMPUTED_STATUS.OPEN,
        },
      },
    },
  };
}

function buildSortStage(
  sort: PaginatedActivityAggregationOptions["sort"]
): Record<string, 1 | -1> {
  if (sort === "updated_desc") {
    return { updatedAt: -1, createdAt: -1, _id: -1 };
  }
  if (sort === "popular") {
    return { followerCount: -1, viewCount: -1, _id: -1 };
  }
  if (sort === "newest") {
    return { _publishedOrCreated: -1, _id: -1 };
  }
  if (sort === "event_asc") {
    return { _eventFutureBucket: 1, _eventSortKey: 1, followerCount: -1, _id: -1 };
  }
  return {
    _isClosedOrExpired: 1,
    _deadlineSortKey: 1,
    _eventSortKey: 1,
    _id: -1,
  };
}

async function executeActivityFacetAggregation(
  matchFilter: Record<string, unknown>,
  options: PaginatedActivityAggregationOptions
): Promise<{ docs: RawActivityDoc[]; total: number }> {
  const now = options.now ?? new Date();
  const sevenDaysLater = new Date(now.getTime() + SEVEN_DAYS_MS);
  const skip = (options.page - 1) * options.limit;

  const pipeline: PipelineStage[] = [{ $match: matchFilter }];

  const needsComputedStatus =
    (options.computedStatusFilter && options.computedStatusFilter.length > 0) ||
    options.sort === "deadline_asc";

  if (needsComputedStatus || options.sort === "newest" || options.sort === "event_asc") {
    const addFields: Record<string, unknown> = {};
    if (needsComputedStatus) {
      addFields._computedStatus = buildComputedStatusExpression(now, sevenDaysLater);
    }
    if (options.sort === "newest") {
      addFields._publishedOrCreated = { $ifNull: ["$publishedAt", "$createdAt"] };
    }
    if (options.sort === "event_asc") {
      addFields._eventFutureBucket = {
        $cond: [
          {
            $or: [
              { $eq: ["$eventDate", null] },
              { $not: ["$eventDate"] },
              { $gte: ["$eventDate", now] },
            ],
          },
          0,
          1,
        ],
      };
      addFields._eventSortKey = { $ifNull: ["$eventDate", MAX_FUTURE_DATE] };
    }
    if (options.sort === "deadline_asc") {
      addFields._deadlineSortKey = { $ifNull: ["$deadline", MAX_FUTURE_DATE] };
      addFields._eventSortKey = { $ifNull: ["$eventDate", MAX_FUTURE_DATE] };
    }
    pipeline.push({ $addFields: addFields });

    if (options.sort === "deadline_asc") {
      pipeline.push({
        $addFields: {
          _isClosedOrExpired: {
            $cond: [
              {
                $in: [
                  "$_computedStatus",
                  [ACTIVITY_COMPUTED_STATUS.CLOSED, ACTIVITY_COMPUTED_STATUS.EXPIRED],
                ],
              },
              1,
              0,
            ],
          },
        },
      });
    }
  }

  if (options.computedStatusFilter && options.computedStatusFilter.length > 0) {
    pipeline.push({
      $match: {
        _computedStatus: { $in: options.computedStatusFilter },
      },
    });
  }

  pipeline.push({
    $sort: buildSortStage(options.sort),
  });

  pipeline.push({
    $facet: {
      items: [
        { $skip: skip },
        { $limit: options.limit },
        { $project: ACTIVITY_LIST_PROJECT },
      ],
      totalCount: [{ $count: "count" }],
    },
  });

  const result = await StudentActivity.aggregate<{
    items: RawActivityDoc[];
    totalCount: { count: number }[];
  }>(pipeline);

  const facet = result[0];
  return {
    docs: facet?.items || [],
    total: facet?.totalCount?.[0]?.count ?? 0,
  };
}

/**
 * Shared DB-level search + status filter + sort + pagination helper for both public and admin activity feeds.
 */
export async function queryPaginatedActivitiesFromDb(
  options: PaginatedActivityAggregationOptions
): Promise<{ docs: RawActivityDoc[]; total: number }> {
  const q = options.q?.trim() || "";

  if (!q) {
    return executeActivityFacetAggregation(options.baseFilter, options);
  }

  if (q.length >= 2) {
    try {
      const textResult = await executeActivityFacetAggregation(
        { ...options.baseFilter, $text: { $search: q } },
        options
      );
      if (textResult.total > 0 || options.page > 1) {
        return textResult;
      }
    } catch {
      // Index may still be building on fresh deployments; fall through cleanly.
    }
  }

  const safeRegex = new RegExp(escapeRegexInput(q), "i");
  return executeActivityFacetAggregation(
    {
      ...options.baseFilter,
      $or: [
        { title: safeRegex },
        { slug: safeRegex },
        { summary: safeRegex },
        { organizer: safeRegex },
        { location: safeRegex },
        { tags: safeRegex },
      ],
    },
    options
  );
}

export async function queryPublishedActivities(
  req: NextRequest,
  options?: { forceTab?: "all" | "followed" }
) {
  try {
    const [, categoryLookup, userId] = await Promise.all([
      connectToDatabase(),
      getCachedActivityCategoryLookup(),
      getOptionalUserIdFromRequest(req),
    ]);
    ensureActivityIndexesInBackground();

    const { searchParams } = new URL(req.url);

    const tab =
      options?.forceTab || (searchParams.get("tab") || "all").toLowerCase();
    const rawCategoryParam = (
      searchParams.get("category") ||
      searchParams.get("type") ||
      ""
    ).trim();
    const q = (searchParams.get("q") || "").trim();
    const rawStatus = (searchParams.get("status") || "").trim();
    const isDomesticParam = (searchParams.get("isDomestic") || "").trim();
    const rawSort = (searchParams.get("sort") || "deadline_asc").trim();
    const sort: PaginatedActivityAggregationOptions["sort"] =
      rawSort === "popular" || rawSort === "newest" || rawSort === "event_asc"
        ? rawSort
        : "deadline_asc";
    const page = Math.max(
      1,
      parseInt(searchParams.get("page") || "1", 10) || 1
    );
    const limit = Math.min(
      50,
      Math.max(1, parseInt(searchParams.get("limit") || "12", 10) || 12)
    );

    if (tab === "followed" && !userId) {
      return NextResponse.json(
        { error: "Vui lòng đăng nhập để xem danh sách hoạt động đã quan tâm" },
        { status: 401 }
      );
    }

    const categories = categoryLookup.categories;

    let followedIds = new Set<string>();
    if (userId && Types.ObjectId.isValid(userId)) {
      const follows = await ActivityFollow.find({
        studentId: new Types.ObjectId(userId),
      })
        .select("activityId")
        .lean();
      followedIds = new Set(follows.map((f) => f.activityId.toString()));
    }

    const baseFilter: Record<string, unknown> = {
      publishStatus: ACTIVITY_PUBLISH_STATUS.PUBLISHED,
    };

    if (tab === "followed") {
      if (followedIds.size === 0) {
        return NextResponse.json({
          success: true,
          items: [],
          categories,
          followedCount: 0,
          pagination: { page, limit, total: 0, totalPages: 0 },
        });
      }
      baseFilter._id = {
        $in: Array.from(followedIds).map((id) => new Types.ObjectId(id)),
      };
    }

    if (rawCategoryParam && rawCategoryParam !== "all") {
      if (Types.ObjectId.isValid(rawCategoryParam)) {
        baseFilter.categoryId = new Types.ObjectId(rawCategoryParam);
      } else {
        const mappedSlug =
          TYPE_SLUG_ALIAS[rawCategoryParam.toLowerCase()] ||
          rawCategoryParam.toLowerCase();
        const matchedCat = categoryLookup.bySlug.get(mappedSlug);
        if (!matchedCat) {
          return NextResponse.json({
            success: true,
            items: [],
            categories,
            followedCount: followedIds.size,
            pagination: { page, limit, total: 0, totalPages: 0 },
          });
        }
        baseFilter.categoryId = new Types.ObjectId(matchedCat._id);
      }
    }

    if (isDomesticParam === "true") {
      baseFilter.isDomestic = true;
    } else if (isDomesticParam === "false") {
      baseFilter.isDomestic = false;
    }

    const computedStatusFilter = rawStatus
      ? rawStatus
        .split(",")
        .map((s) => s.trim().toUpperCase())
        .filter((s): s is ActivityComputedStatus =>
          VALID_COMPUTED_STATUSES.has(s)
        )
      : undefined;

    const now = new Date();
    const { docs, total } = await queryPaginatedActivitiesFromDb({
      baseFilter,
      q,
      computedStatusFilter,
      sort,
      page,
      limit,
      now,
    });

    const hydratedDocs = docs.map((doc) => {
      const cat = doc.categoryId
        ? categoryLookup.byId.get(String(doc.categoryId)) || null
        : null;
      return {
        ...doc,
        categoryId: cat
          ? {
            _id: cat._id,
            name: cat.name,
            slug: cat.slug,
            colorToken: cat.colorToken,
            icon: cat.icon,
          }
          : null,
      };
    });

    const totalPages = total === 0 ? 0 : Math.ceil(total / limit);

    return NextResponse.json({
      success: true,
      items: hydratedDocs.map((doc) =>
        serializeStudentActivity(doc, { followedIds, now })
      ),
      categories,
      followedCount: followedIds.size,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    });
  } catch (error) {
    console.error("queryPublishedActivities error:", error);
    return NextResponse.json(
      { error: "Không thể tải danh sách hoạt động sinh viên" },
      { status: 500 }
    );
  }
}
