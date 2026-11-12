import { NextResponse } from "next/server";
import { Types } from "mongoose";
import { logAuditAction } from "@/lib/audit";
import { cleanupOrphanedMedia } from "@/lib/content/media-sync";
import { connectToDatabase } from "@/lib/db";
import { handleAuthError, requireAdmin } from "@/lib/session";

/**
 * POST /api/admin/media/cleanup
 * Quét và xóa các MediaAsset không còn được sử dụng (ORPHANED hoặc TEMP quá hạn) trên Cloudinary + MongoDB
 */
export async function POST(req: Request) {
  try {
    const admin = await requireAdmin(req);
    let tempOlderThanHours = 24;
    let includeOrphaned = true;

    try {
      const body = await req.json();
      if (
        typeof body?.tempOlderThanHours === "number" &&
        Number.isFinite(body.tempOlderThanHours) &&
        body.tempOlderThanHours >= 0
      ) {
        tempOlderThanHours = body.tempOlderThanHours;
      }
      if (typeof body?.includeOrphaned === "boolean") {
        includeOrphaned = body.includeOrphaned;
      }
    } catch {
      // Optional JSON body
    }

    await connectToDatabase();

    const result = await cleanupOrphanedMedia({
      tempOlderThanHours,
      includeOrphaned,
    });

    await logAuditAction({
      admin: { id: admin.id, email: admin.email, name: admin.name },
      action: "DELETE",
      targetCollection: "media_assets",
      targetId: new Types.ObjectId(admin.id),
      targetTitle: `Dọn rác Media Cloudinary (${result.deleted}/${result.scanned})`,
      changesAfter: {
        tempOlderThanHours,
        includeOrphaned,
        ...result,
      },
      req,
    });

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error) {
    return handleAuthError(error);
  }
}

