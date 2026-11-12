import { NextResponse } from "next/server";
import { Types } from "mongoose";
import { connectToDatabase } from "@/lib/db";
import {
  ensureRoadmapCollectionClean,
  serializeRoadmap,
} from "@/lib/roadmap-service";
import { handleAuthError, requireAuth } from "@/lib/session";
import { Roadmap } from "@/models/Roadmap";

/**
 * GET /api/roadmap/history/[roadmapId]
 * RM13: Xem chi tiết (read-only) một phiên bản lộ trình lịch sử của chính sinh viên.
 */
export async function GET(
  req: Request,
  context: { params: Promise<{ roadmapId: string }> }
) {
  try {
    const authUser = await requireAuth(req);
    const { roadmapId } = await context.params;
    if (!Types.ObjectId.isValid(roadmapId)) {
      return NextResponse.json({ error: "Mã lộ trình không hợp lệ" }, { status: 400 });
    }

    await connectToDatabase();
    await ensureRoadmapCollectionClean();

    const doc = await Roadmap.findOne({
      _id: new Types.ObjectId(roadmapId),
      studentId: new Types.ObjectId(authUser.id),
    }).lean();

    if (!doc) {
      return NextResponse.json(
        { error: "Không tìm thấy phiên bản lộ trình này." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      roadmap: serializeRoadmap(doc),
    });
  } catch (error) {
    return handleAuthError(error);
  }
}

