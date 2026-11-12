import { NextResponse } from "next/server";
import { Types } from "mongoose";
import { connectToDatabase } from "@/lib/db";
import {
  ensureRoadmapCollectionClean,
  serializeRoadmapHistoryItem,
} from "@/lib/roadmap-service";
import { handleAuthError, requireAuth } from "@/lib/session";
import { Roadmap } from "@/models/Roadmap";

/**
 * GET /api/roadmap/history
 * RM13: Danh sách các phiên bản lộ trình đã lưu (ACTIVE & ARCHIVED) của sinh viên.
 */
export async function GET(req: Request) {
  try {
    const authUser = await requireAuth(req);
    await connectToDatabase();
    await ensureRoadmapCollectionClean();

    const docs = await Roadmap.find({
      studentId: new Types.ObjectId(authUser.id),
    })
      .sort({ version: -1, createdAt: -1 })
      .lean();

    return NextResponse.json({
      success: true,
      versions: docs.map(serializeRoadmapHistoryItem),
    });
  } catch (error) {
    return handleAuthError(error);
  }
}

