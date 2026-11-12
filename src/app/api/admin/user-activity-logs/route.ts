import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { escapeRegexInput } from "@/lib/orientation-utils";
import { handleAuthError, requireAdmin } from "@/lib/session";
import {
  USER_ACTIVITY_ACTOR_ROLES,
  USER_ACTIVITY_CATEGORIES,
  USER_ACTIVITY_SEVERITIES,
  USER_ACTIVITY_STATUSES,
  UserActivityActorRole,
  UserActivityCategory,
  UserActivityLog,
  UserActivitySeverity,
  UserActivityStatus,
} from "@/models/UserActivityLog";

function isOneOf<T extends readonly string[]>(
  allowed: T,
  val: string | null
): val is T[number] {
  return Boolean(val && allowed.includes(val));
}

/**
 * GET /api/admin/user-activity-logs
 * FR-ADM-21: Tra cứu nhật ký hoạt động người dùng hệ thống & địa chỉ IP
 */
export async function GET(req: Request) {
  try {
    await requireAdmin(req);
    await connectToDatabase();

    const { searchParams } = new URL(req.url);
    const page = Math.max(1, Number(searchParams.get("page") || "1") || 1);
    const limit = Math.min(
      100,
      Math.max(1, Number(searchParams.get("limit") || "25") || 25)
    );
    const skip = (page - 1) * limit;

    const search = searchParams.get("search")?.trim() || "";
    const category = searchParams.get("category")?.trim() || "";
    const status = searchParams.get("status")?.trim() || "";
    const severity = searchParams.get("severity")?.trim() || "";
    const actorRole = searchParams.get("actorRole")?.trim() || "";
    const ipAddress = searchParams.get("ipAddress")?.trim() || "";
    const fromDate = searchParams.get("fromDate")?.trim() || "";
    const toDate = searchParams.get("toDate")?.trim() || "";

    const query: Record<string, unknown> = {};

    if (isOneOf(USER_ACTIVITY_CATEGORIES, category)) {
      query.category = category as UserActivityCategory;
    }
    if (isOneOf(USER_ACTIVITY_STATUSES, status)) {
      query.status = status as UserActivityStatus;
    }
    if (isOneOf(USER_ACTIVITY_SEVERITIES, severity)) {
      query.severity = severity as UserActivitySeverity;
    }
    if (isOneOf(USER_ACTIVITY_ACTOR_ROLES, actorRole)) {
      query.actorRole = actorRole as UserActivityActorRole;
    }
    if (ipAddress) {
      query.ipAddress = { $regex: escapeRegexInput(ipAddress), $options: "i" };
    }

    if (fromDate || toDate) {
      const createdAtFilter: Record<string, Date> = {};
      if (fromDate) {
        const parsedFrom = new Date(fromDate);
        if (!Number.isNaN(parsedFrom.getTime())) {
          createdAtFilter.$gte = parsedFrom;
        }
      }
      if (toDate) {
        const parsedTo = new Date(toDate);
        if (!Number.isNaN(parsedTo.getTime())) {
          parsedTo.setHours(23, 59, 59, 999);
          createdAtFilter.$lte = parsedTo;
        }
      }
      if (Object.keys(createdAtFilter).length > 0) {
        query.createdAt = createdAtFilter;
      }
    }

    if (search) {
      const safePattern = escapeRegexInput(search);
      const regex = { $regex: safePattern, $options: "i" };
      query.$or = [
        { actorEmail: regex },
        { actorName: regex },
        { ipAddress: regex },
        { action: regex },
        { description: regex },
        { targetTitle: regex },
        { requestPath: regex },
      ];
    }

    const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const [items, total, summaryAgg] = await Promise.all([
      UserActivityLog.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      UserActivityLog.countDocuments(query),
      UserActivityLog.aggregate<{
        _id: null;
        total24h: number;
        failedCount24h: number;
        blockedCount24h: number;
        uniqueIps: string[];
      }>([
        { $match: { createdAt: { $gte: since24h } } },
        {
          $group: {
            _id: null,
            total24h: { $sum: 1 },
            failedCount24h: {
              $sum: { $cond: [{ $eq: ["$status", "FAILED"] }, 1, 0] },
            },
            blockedCount24h: {
              $sum: { $cond: [{ $eq: ["$status", "BLOCKED"] }, 1, 0] },
            },
            uniqueIps: { $addToSet: "$ipAddress" },
          },
        },
      ]),
    ]);

    const aggRow = summaryAgg[0];
    const uniqueIpList = (aggRow?.uniqueIps || []).filter(
      (ip) => ip && ip !== "unknown"
    );

    return NextResponse.json({
      success: true,
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
      summary24h: {
        total24h: aggRow?.total24h ?? 0,
        failedCount24h: aggRow?.failedCount24h ?? 0,
        blockedCount24h: aggRow?.blockedCount24h ?? 0,
        uniqueIps24h: uniqueIpList.length,
      },
    });
  } catch (error) {
    return handleAuthError(error);
  }
}

