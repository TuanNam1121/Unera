import { NextResponse } from "next/server";
import { Types } from "mongoose";
import { ASSESSMENT_SUBMISSION_STATUS } from "@/constants";
import { connectToDatabase } from "@/lib/db";
import { runOrientationAnalysis } from "@/lib/orientation-ai";
import { buildRateLimitResponse, checkRateLimit } from "@/lib/rate-limit";
import { handleAuthError, requireAuth } from "@/lib/session";
import { AiOrientationAnalysis } from "@/models/AiOrientationAnalysis";
import { AssessmentSubmission } from "@/models/AssessmentSubmission";

export const maxDuration = 60;

/**
 * POST /api/ai/orientation/regenerate
 * AI11: Phân tích lại định hướng dựa trên lần nộp bài gần nhất (hoặc submissionId chỉ định) + hồ sơ sinh viên mới nhất.
 */
export async function POST(req: Request) {
  try {
    const authUser = await requireAuth(req);
    const rate = checkRateLimit(`ai:regenerate:${authUser.id}`, 8, 10 * 60_000);
    if (!rate.allowed) {
      return buildRateLimitResponse(
        rate.retryAfterSeconds,
        "Bạn đã phân tích lại quá nhiều lần liên tiếp. Vui lòng đợi vài phút."
      );
    }
    const body = await req.json().catch(() => ({}));
    const requestedSubId =
      typeof body?.submissionId === "string" ? body.submissionId.trim() : "";

    await connectToDatabase();
    const studentObjId = new Types.ObjectId(authUser.id);

    const submission =
      requestedSubId && Types.ObjectId.isValid(requestedSubId)
        ? await AssessmentSubmission.findOne({
            _id: new Types.ObjectId(requestedSubId),
            studentId: studentObjId,
            status: ASSESSMENT_SUBMISSION_STATUS.SUBMITTED,
          }).lean()
        : await AssessmentSubmission.findOne({
            studentId: studentObjId,
            status: ASSESSMENT_SUBMISSION_STATUS.SUBMITTED,
          })
            .sort({ submittedAt: -1, createdAt: -1 })
            .lean();

    if (!submission) {
      return NextResponse.json(
        {
          error:
            "Bạn chưa có bài khảo sát đã nộp nào. Vui lòng hoàn thành khảo sát định hướng trước.",
        },
        { status: 400 }
      );
    }

    const previousAnalysis = await AiOrientationAnalysis.findOne({
      studentId: studentObjId,
      submissionId: submission._id,
    })
      .sort({ createdAt: -1 })
      .select("_id")
      .lean();

    const aiOutcome = await runOrientationAnalysis({
      studentId: authUser.id,
      submissionId: submission._id.toString(),
      regenerationOfId: previousAnalysis?._id?.toString() || null,
    });

    if (!aiOutcome.ok) {
      return NextResponse.json(
        {
          success: false,
          error: aiOutcome.errorMessage,
          analysis: aiOutcome.analysis,
        },
        { status: 502 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Đã cập nhật bản phân tích định hướng AI mới nhất dựa trên hồ sơ của bạn.",
      analysis: aiOutcome.analysis,
    });
  } catch (error) {
    return handleAuthError(error);
  }
}

