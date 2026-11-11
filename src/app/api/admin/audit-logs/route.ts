import { NextResponse } from "next/server";
import { requireAdmin, handleAuthError } from "@/lib/session";
import { connectToDatabase } from "@/lib/db";
import { AuditLog } from "@/models/AuditLog";

/**
 * GET /api/admin/audit-logs
 * FR-ADM-14, FR-ADM-20: Tra cứu dòng sự kiện kiểm toán bảo mật của hệ thống
 */
export async function GET(req: Request) {
  try {
    await requireAdmin();
    await connectToDatabase();

    const { searchParams } = new URL(req.url);
    const action = searchParams.get("action");
    const targetCollection = searchParams.get("collection");
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "20", 10);
    const skip = (page - 1) * limit;

    const query: Record<string, any> = {};

    if (action && action !== "ALL") {
      query.action = action;
    }

    if (targetCollection && targetCollection !== "ALL") {
      query.targetCollection = targetCollection;
    }

    const [logs, total] = await Promise.all([
      AuditLog.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
      AuditLog.countDocuments(query),
    ]);

    return NextResponse.json({
      success: true,
      logs: logs.map((l) => ({
        id: l._id.toString(),
        adminId: l.adminId.toString(),
        adminEmail: l.adminEmail,
        adminName: l.adminName,
        action: l.action,
        targetCollection: l.targetCollection,
        targetId: l.targetId.toString(),
        targetTitle: l.targetTitle,
        targetVersion: l.targetVersion,
        changesBefore: l.changesBefore,
        changesAfter: l.changesAfter,
        reason: l.reason,
        ipAddress: l.ipAddress,
        userAgent: l.userAgent,
        createdAt: l.createdAt,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    return handleAuthError(error);
  }
}

