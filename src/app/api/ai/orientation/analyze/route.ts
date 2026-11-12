import { NextResponse } from "next/server";
import { Types } from "mongoose";
import { ASSESSMENT_SUBMISSION_STATUS } from "@/constants";
import { connectToDatabase } from "@/lib/db";
import { runOrientationAnalysis } from "@/lib/orientation-ai";
import { buildRateLimitResponse, checkRateLimit } from "@/lib/rate-limit";
import { generatePersonalizedRoadmap } from "@/lib/roadmap-service";
import { handleAuthError, requireAuth } from "@/lib/session";
import { AssessmentSubmission } from "@/models/AssessmentSubmission";
import { Roadmap } from "@/models/Roadmap";
import { ROADMAP_STATUS } from "@/constants";

export const maxDuration = 60;

/**
 * POST /api/ai/orientation/analyze
 * AI01-AI10: Chạy phân tích Gemini AI cho submissionId (hoặc retry nếu lần trước FAILED).
 */
export async function POST(req: Request) {
  try {
    const authUser = await requireAuth(req);
    const rate = checkRateLimit(`ai:analyze:${authUser.id}`, 10, 10 * 60_000);
    if (!rate.allowed) {
      return buildRateLimitResponse(
        rate.retryAfterSeconds,
        "Bạn đang yêu cầu phân tích AI quá nhanh. Vui lòng đợi vài phút."
      );
    }
    const body = await req.json().catch(() => ({}));
    const submissionId =
      typeof body?.submissionId === "string" ? body.submissionId.trim() : "";
    const generateRoadmapIfMissing =
      body?.generateRoadmapIfMissing === true;

    if (!submissionId || !Types.ObjectId.isValid(submissionId)) {
      return NextResponse.json(
        { error: "Thiếu hoặc sai định dạng mã bài đánh giá (submissionId)." },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const submission = await AssessmentSubmission.findOne({
      _id: new Types.ObjectId(submissionId),
      studentId: new Types.ObjectId(authUser.id),
      status: ASSESSMENT_SUBMISSION_STATUS.SUBMITTED,
    }).lean();

    if (!submission) {
      return NextResponse.json(
        { error: "Không tìm thấy bài khảo sát đã nộp hợp lệ để phân tích." },
        { status: 404 }
      );
    }

    const aiOutcome = await runOrientationAnalysis({
      studentId: authUser.id,
      submissionId,
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

    let roadmap = null;
    if (generateRoadmapIfMissing) {
      const existingActive = await Roadmap.findOne({
        studentId: new Types.ObjectId(authUser.id),
        status: ROADMAP_STATUS.ACTIVE,
        orientationDirection: { $exists: true },
      })
        .select("_id")
        .lean();

      if (!existingActive) {
        const rm = await generatePersonalizedRoadmap({
          studentId: authUser.id,
          analysisId: aiOutcome.analysis._id,
        });
        if (rm.ok) {
          roadmap = rm.roadmap;
        }
      }
    }

    return NextResponse.json({
      success: true,
      analysis: aiOutcome.analysis,
      roadmap,
    });
  } catch (error) {
    return handleAuthError(error);
  }
}

