import { NextRequest, NextResponse } from "next/server";
import {
  ACTIVITY_COMPUTED_STATUS,
  ACTIVITY_PUBLISH_STATUS,
  type ActivityComputedStatus,
} from "@/constants";
import { computeActivityStatus } from "@/lib/activity-utils";
import { connectToDatabase } from "@/lib/db";
import { handleAuthError, requireAdmin } from "@/lib/session";
import { RawActivityDoc } from "@/lib/activities";
import { ActivityCategory } from "@/models/ActivityCategory";
import { StudentActivity } from "@/models/StudentActivity";

export async function GET(req: NextRequest) {
  try {
    await requireAdmin(req);
    await connectToDatabase();

    const [categories, rawActivities] = await Promise.all([
      ActivityCategory.find().sort({ order: 1, name: 1 }).lean(),
      StudentActivity.find()
        .populate("categoryId", "name slug colorToken")
        .lean(),
    ]);

    const activities = rawActivities as unknown as RawActivityDoc[];
    const now = new Date();
    const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;

    const byComputedStatus: Record<ActivityComputedStatus, number> = {
      OPEN: 0,
      CLOSING_SOON: 0,
      EVENT_SOON: 0,
      UPCOMING_OPEN: 0,
      CLOSED: 0,
      EXPIRED: 0,
    };

    let publishedActivities = 0;
    let totalFollowers = 0;
    let totalViews = 0;
    let closingWithin7Days = 0;

    const catStatsMap = new Map<
      string,
      {
        categoryId: string;
        name: string;
        slug: string;
        colorToken: string;
        totalCount: number;
        publishedCount: number;
        totalFollowers: number;
        totalViews: number;
      }
    >();

    for (const cat of categories) {
      catStatsMap.set(cat._id.toString(), {
        categoryId: cat._id.toString(),
        name: cat.name,
        slug: cat.slug,
        colorToken: cat.colorToken || "blue",
        totalCount: 0,
        publishedCount: 0,
        totalFollowers: 0,
        totalViews: 0,
      });
    }

    const enriched = activities.map((doc) => {
      const computedStatus = computeActivityStatus(doc, now);
      byComputedStatus[computedStatus] += 1;

      const followers = typeof doc.followerCount === "number" ? doc.followerCount : 0;
      const views = typeof doc.viewCount === "number" ? doc.viewCount : 0;
      totalFollowers += followers;
      totalViews += views;

      const isPublished = doc.publishStatus === ACTIVITY_PUBLISH_STATUS.PUBLISHED;
      if (isPublished) publishedActivities += 1;

      if (doc.deadline && !doc.manualClosed) {
        const diff = new Date(doc.deadline).getTime() - now.getTime();
        if (diff >= 0 && diff <= sevenDaysMs) {
          closingWithin7Days += 1;
        }
      }

      const catRef =
        typeof doc.categoryId === "object" &&
        doc.categoryId !== null &&
        "_id" in doc.categoryId &&
        "name" in doc.categoryId
          ? doc.categoryId
          : null;

      if (catRef) {
        const catBucket = catStatsMap.get(catRef._id.toString());
        if (catBucket) {
          catBucket.totalCount += 1;
          if (isPublished) catBucket.publishedCount += 1;
          catBucket.totalFollowers += followers;
          catBucket.totalViews += views;
        }
      }

      const conversionRate =
        views > 0 ? Math.round((followers / views) * 1000) / 10 : 0;

      return {
        _id: doc._id.toString(),
        title: doc.title,
        slug: doc.slug,
        categoryName: catRef?.name || "Chưa phân loại",
        followerCount: followers,
        viewCount: views,
        conversionRate,
        computedStatus,
        deadline: doc.deadline ? new Date(doc.deadline).toISOString() : null,
      };
    });

    const topFollowed = [...enriched]
      .sort((a, b) => b.followerCount - a.followerCount || b.viewCount - a.viewCount)
      .slice(0, 10);

    const topViewed = [...enriched]
      .sort((a, b) => b.viewCount - a.viewCount || b.followerCount - a.followerCount)
      .slice(0, 10);

    const openActivities =
      byComputedStatus[ACTIVITY_COMPUTED_STATUS.OPEN] +
      byComputedStatus[ACTIVITY_COMPUTED_STATUS.CLOSING_SOON] +
      byComputedStatus[ACTIVITY_COMPUTED_STATUS.EVENT_SOON];

    return NextResponse.json({
      success: true,
      statistics: {
        kpi: {
          totalActivities: activities.length,
          publishedActivities,
          openActivities,
          closingWithin7Days,
          totalFollowers,
          totalViews,
          byComputedStatus,
        },
        topFollowed,
        topViewed,
        byCategory: Array.from(catStatsMap.values()),
      },
    });
  } catch (error) {
    return handleAuthError(error);
  }
}
