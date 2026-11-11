import { NextResponse } from "next/server";
import { requireAdmin, handleAuthError } from "@/lib/session";
import { connectToDatabase } from "@/lib/db";
import { User } from "@/models/User";
import { StudentProfile } from "@/models/StudentProfile";
import { Opportunity } from "@/models/Opportunity";
import { BookingRequest } from "@/models/BookingRequest";
import { Roadmap } from "@/models/Roadmap";
import { AuditLog } from "@/models/AuditLog";
import { USER_ROLES, ACCOUNT_STATUS } from "@/constants";

/**
 * GET /api/admin/dashboard/stats
 * FR-ADM-01: Bảng điều khiển thống kê tổng quan của Admin CMS
 */
export async function GET() {
  try {
    await requireAdmin();
    await connectToDatabase();

    const [
      totalStudents,
      activeStudents,
      disabledStudents,
      totalOpportunities,
      openOpportunities,
      pendingBookings,
      totalActiveRoadmaps,
      recentAuditLogs,
      recentStudents,
    ] = await Promise.all([
      User.countDocuments({ role: USER_ROLES.STUDENT }),
      User.countDocuments({ role: USER_ROLES.STUDENT, status: ACCOUNT_STATUS.ACTIVE }),
      User.countDocuments({ role: USER_ROLES.STUDENT, status: ACCOUNT_STATUS.DISABLED }),
      Opportunity.countDocuments(),
      Opportunity.countDocuments({ status: "PUBLISHED" }),
      BookingRequest.countDocuments({ status: "PENDING" }),
      Roadmap.countDocuments({ status: "ACTIVE" }),
      AuditLog.find().sort({ createdAt: -1 }).limit(6),
      User.find({ role: USER_ROLES.STUDENT }).sort({ createdAt: -1 }).limit(5).select("-password"),
    ]);

    return NextResponse.json({
      success: true,
      stats: {
        totalStudents,
        activeStudents,
        disabledStudents,
        totalOpportunities,
        openOpportunities,
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
