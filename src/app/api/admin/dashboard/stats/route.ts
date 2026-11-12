import { NextResponse } from "next/server";
import { requireAdmin, handleAuthError } from "@/lib/session";
import { connectToDatabase } from "@/lib/db";
import { ensureRoadmapCollectionClean } from "@/lib/roadmap-service";
import { User } from "@/models/User";
import { StudentActivity } from "@/models/StudentActivity";
import { NewsArticle } from "@/models/NewsArticle";
import { BookingRequest } from "@/models/BookingRequest";
import { Roadmap } from "@/models/Roadmap";
import { AuditLog } from "@/models/AuditLog";
import {
  USER_ROLES,
  ACCOUNT_STATUS,
  ACTIVITY_PUBLISH_STATUS,
  NEWS_ARTICLE_STATUS,
} from "@/constants";

/**
 * GET /api/admin/dashboard/stats
 * FR-ADM-01: Bảng điều khiển thống kê tổng quan của Admin CMS
 */
export async function GET() {
  try {
    await requireAdmin();
    await connectToDatabase();
    await ensureRoadmapCollectionClean();

    const [
      totalUsers,
      totalAdmins,
      totalStudents,
      activeStudents,
      disabledStudents,
      totalActivities,
      publishedActivities,
      followerAgg,
      totalNews,
      publishedNews,
      pendingBookings,
      totalActiveRoadmaps,
      recentAuditLogs,
      recentStudents,
    ] = await Promise.all([
      User.countDocuments({}),
      User.countDocuments({ role: USER_ROLES.ADMIN }),
      User.countDocuments({ role: USER_ROLES.STUDENT }),
      User.countDocuments({ role: USER_ROLES.STUDENT, status: ACCOUNT_STATUS.ACTIVE }),
      User.countDocuments({ role: USER_ROLES.STUDENT, status: ACCOUNT_STATUS.DISABLED }),
      StudentActivity.countDocuments(),
      StudentActivity.countDocuments({
        publishStatus: ACTIVITY_PUBLISH_STATUS.PUBLISHED,
        manualClosed: { $ne: true },
      }),
      StudentActivity.aggregate<{ total: number }>([
        { $group: { _id: null, total: { $sum: "$followerCount" } } },
      ]),
      NewsArticle.countDocuments(),
      NewsArticle.countDocuments({ status: NEWS_ARTICLE_STATUS.PUBLISHED }),
      BookingRequest.countDocuments({ status: "PENDING" }),
      Roadmap.countDocuments({ status: "ACTIVE" }),
      AuditLog.find().sort({ createdAt: -1 }).limit(6),
      User.find({ role: USER_ROLES.STUDENT })
        .sort({ createdAt: -1 })
        .limit(5)
        .select("-password"),
    ]);

    return NextResponse.json({
      success: true,
      stats: {
        totalUsers,
        totalAdmins,
        totalStudents,
        activeStudents,
        disabledStudents,
        totalActivities,
        publishedActivities,
        totalActivityFollowers: followerAgg[0]?.total || 0,
        totalNews,
        publishedNews,
        pendingBookings,
        totalActiveRoadmaps,
      },
      recentAuditLogs,
      recentStudents,
    });
  } catch (error) {
    return handleAuthError(error);
  }
}
