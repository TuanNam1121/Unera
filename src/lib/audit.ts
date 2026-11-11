import { connectToDatabase } from "@/lib/db";
import { AuditLog } from "@/models/AuditLog";
import { Types } from "mongoose";

interface LogActionParams {
  admin: {
    id: string;
    email: string;
    name: string;
  };
  action:
    | "CREATE"
    | "UPDATE"
    | "DELETE"
    | "STATUS_CHANGE"
    | "LOCK_ACCOUNT"
    | "UNLOCK_ACCOUNT"
    | "RESOLVE_CONFLICT";
  targetCollection: string;
  targetId: string | Types.ObjectId;
  targetTitle?: string;
  targetVersion?: number;
  changesBefore?: Record<string, any>;
  changesAfter?: Record<string, any>;
  reason?: string;
  req?: Request;
}

export async function logAuditAction(params: LogActionParams) {
  try {
    await connectToDatabase();

    const ipAddress =
      params.req?.headers.get("x-forwarded-for")?.split(",")[0] ||
      params.req?.headers.get("x-real-ip") ||
      "127.0.0.1";

    const userAgent = params.req?.headers.get("user-agent") || undefined;

    await AuditLog.create({
      adminId: new Types.ObjectId(params.admin.id),
      adminEmail: params.admin.email,
      adminName: params.admin.name,
      action: params.action,
      targetCollection: params.targetCollection,
      targetId: new Types.ObjectId(params.targetId.toString()),
      targetTitle: params.targetTitle,
      targetVersion: params.targetVersion,
      changesBefore: params.changesBefore,
      changesAfter: params.changesAfter,
      reason: params.reason,
      ipAddress,
      userAgent,
    });
  } catch (error) {
    console.error("Lỗi khi ghi nhật ký kiểm toán (AuditLog):", error);
  }
}
