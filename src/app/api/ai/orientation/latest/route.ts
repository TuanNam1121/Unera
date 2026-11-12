import { NextResponse } from "next/server";
import { Types } from "mongoose";
import { AI_ANALYSIS_STATUS } from "@/constants";
import { connectToDatabase } from "@/lib/db";
import { serializeAiAnalysis } from "@/lib/orientation-ai";
import { handleAuthError, requireAuth } from "@/lib/session";
import { AiOrientationAnalysis } from "@/models/AiOrientationAnalysis";

/**
 * GET /api/ai/orientation/latest
 * AI09: Lấy bản phân tích định hướng AI mới nhất của sinh viên.
 */
export async function GET(req: Request) {
  try {
    const authUser = await requireAuth(req);
    await connectToDatabase();
    const studentObjId = new Types.ObjectId(authUser.id);

    const [latest, latestCompleted] = await Promise.all([
      AiOrientationAnalysis.findOne({ studentId: studentObjId })
        .sort({ createdAt: -1 })
        .lean(),
      AiOrientationAnalysis.findOne({
        studentId: studentObjId,
        status: AI_ANALYSIS_STATUS.COMPLETED,
      })
        .sort({ createdAt: -1 })
        .lean(),
    ]);

    return NextResponse.json({
      success: true,
      analysis: latest ? serializeAiAnalysis(latest) : null,
      latestCompleted: latestCompleted
        ? serializeAiAnalysis(latestCompleted)
        : null,
    });
  } catch (error) {
    return handleAuthError(error);
  }
}

