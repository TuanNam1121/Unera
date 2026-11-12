import { NextRequest, NextResponse } from "next/server";
import { Types } from "mongoose";
import {
  ACTIVITY_COMPUTED_STATUS,
  ACTIVITY_PUBLISH_STATUS,
  type ActivityComputedStatus,
} from "@/constants";
import { connectToDatabase } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { escapeRegexInput } from "@/lib/orientation-utils";
import {
  getActiveActivityCategories,
  RawActivityDoc,
  serializeStudentActivity,
} from "@/lib/activities";
import { ActivityCategory } from "@/models/ActivityCategory";
import { StudentActivity } from "@/models/StudentActivity";
import { ActivityFollow } from "@/models/ActivityFollow";

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

function getTimestampOrInf(value?: string | Date | null): number {
  if (!value) return Number.POSITIVE_INFINITY;
  const parsed =
    value instanceof Date ? value.getTime() : new Date(value).getTime();
  return Number.isNaN(parsed) ? Number.POSITIVE_INFINITY : parsed;
}

export async function queryPublishedActivities(
  req: NextRequest,
  options?: { forceTab?: "all" | "followed" }
) {
  try {
    await connectToDatabase();
    const currentUser = await getCurrentUser(req);
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
    const sort = (searchParams.get("sort") || "deadline_asc").trim();
    const page = Math.max(
      1,
      parseInt(searchParams.get("page") || "1", 10) || 1
    );
    const limit = Math.min(
      50,
      Math.max(1, parseInt(searchParams.get("limit") || "12", 10) || 12)
    );

    if (tab === "followed" && !currentUser) {
      return NextResponse.json(
        { error: "Vui lòng đăng nhập để xem danh sách hoạt động đã quan tâm" },
        { status: 401 }
      );
    }

    const categories = await getActiveActivityCategories();

    let followedIds = new Set<string>();
    if (currentUser && Types.ObjectId.isValid(currentUser.id)) {
      const follows = await ActivityFollow.find({
        studentId: new Types.ObjectId(currentUser.id),
      })
        .select("activityId")
        .lean();
      followedIds = new Set(follows.map((f) => f.activityId.toString()));
    }

    const filter: Record<string, unknown> = {
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
      filter._id = {
        $in: Array.from(followedIds).map((id) => new Types.ObjectId(id)),
      };
    }

    if (rawCategoryParam && rawCategoryParam !== "all") {
      if (Types.ObjectId.isValid(rawCategoryParam)) {
        filter.categoryId = new Types.ObjectId(rawCategoryParam);
      } else {
        const mappedSlug =
          TYPE_SLUG_ALIAS[rawCategoryParam.toLowerCase()] ||
          rawCategoryParam.toLowerCase();
        const matchedCat = await ActivityCategory.findOne({
          slug: mappedSlug,
          isActive: true,
        })
          .select("_id")
          .lean();
        if (!matchedCat) {
          return NextResponse.json({
            success: true,
            items: [],
            categories,
            followedCount: followedIds.size,
            pagination: { page, limit, total: 0, totalPages: 0 },
          });
        }
        filter.categoryId = matchedCat._id;
      }
    }

    if (isDomesticParam === "true") {
      filter.isDomestic = true;
    } else if (isDomesticParam === "false") {
      filter.isDomestic = false;
    }

    if (q) {
      const regex = new RegExp(escapeRegexInput(q), "i");
      filter.$or = [
        { title: regex },
        { summary: regex },
        { organizer: regex },
        { location: regex },
        { tags: regex },
        { contentText: regex },
      ];
    }

    const rawDocs = (await StudentActivity.find(filter)
      .populate("categoryId", "name slug colorToken icon")
      .lean()) as unknown as RawActivityDoc[];

    const now = new Date();
    const nowMs = now.getTime();
    let items = rawDocs.map((doc) =>
      serializeStudentActivity(doc, { followedIds, now })
    );

    if (rawStatus) {
      const requestedStatuses = rawStatus
        .split(",")
        .map((s) => s.trim().toUpperCase())
        .filter((s): s is ActivityComputedStatus =>
          VALID_COMPUTED_STATUSES.has(s)
        );
      if (requestedStatuses.length > 0) {
        const statusSet = new Set<ActivityComputedStatus>(requestedStatuses);
        items = items.filter((item) => statusSet.has(item.computedStatus));
      }
    }

    items.sort((a, b) => {
      if (sort === "popular") {
        if (b.followerCount !== a.followerCount) {
          return b.followerCount - a.followerCount;
        }
        return b.viewCount - a.viewCount;
      }

      if (sort === "newest") {
        const aTime = new Date(a.publishedAt || a.createdAt || 0).getTime();
        const bTime = new Date(b.publishedAt || b.createdAt || 0).getTime();
        return bTime - aTime;
      }

      if (sort === "event_asc") {
        const aEv = getTimestampOrInf(a.eventDate);
        const bEv = getTimestampOrInf(b.eventDate);
        const aFuture = aEv >= nowMs ? 0 : 1;
        const bFuture = bEv >= nowMs ? 0 : 1;
        if (aFuture !== bFuture) return aFuture - bFuture;
        if (aEv !== bEv) return aEv - bEv;
        return b.followerCount - a.followerCount;
      }

      const aClosed =
        a.computedStatus === ACTIVITY_COMPUTED_STATUS.CLOSED ||
          a.computedStatus === ACTIVITY_COMPUTED_STATUS.EXPIRED
          ? 1
          : 0;
      const bClosed =
        b.computedStatus === ACTIVITY_COMPUTED_STATUS.CLOSED ||
          b.computedStatus === ACTIVITY_COMPUTED_STATUS.EXPIRED
          ? 1
          : 0;
      if (aClosed !== bClosed) return aClosed - bClosed;

      const aDl = getTimestampOrInf(a.deadline);
      const bDl = getTimestampOrInf(b.deadline);
      if (aDl !== bDl) return aDl - bDl;

      const aEv = getTimestampOrInf(a.eventDate);
      const bEv = getTimestampOrInf(b.eventDate);
      return aEv - bEv;
    });

    const total = items.length;
    const totalPages = total === 0 ? 0 : Math.ceil(total / limit);
    const start = (page - 1) * limit;

    return NextResponse.json({
      success: true,
      items: items.slice(start, start + limit),
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

