import { NextResponse } from "next/server";
import { Types } from "mongoose";
import { ASSESSMENT_SUBMISSION_STATUS } from "@/constants";
import {
  ensureDefaultQuestionnaire,
  serializeSubmission,
} from "@/lib/assessment-seed";
import { connectToDatabase } from "@/lib/db";
import { handleAuthError, requireAuth } from "@/lib/session";
import { AssessmentSubmission } from "@/models/AssessmentSubmission";
import { Questionnaire } from "@/models/Questionnaire";

/**
 * POST /api/assessments/retake
 * PA12: Khởi tạo phiên làm lại (IN_PROGRESS mới) với attemptNumber = previousMaxAttempt + 1,
 * giữ nguyên toàn bộ các lần đã nộp trước đó để bảo toàn lịch sử (PA11).
 */
export async function POST(req: Request) {
  try {
    const authUser = await requireAuth(req);
    await connectToDatabase();

    const totalNonDeleted = await Questionnaire.countDocuments({ isDeleted: false });
    if (totalNonDeleted === 0) {
      await ensureDefaultQuestionnaire();
    }

    const activeQuestionnaire = await Questionnaire.findOne({
      isActive: true,
      isDeleted: false,
    })
      .sort({ updatedAt: -1 })
      .lean();

    if (!activeQuestionnaire) {
      return NextResponse.json(
        { error: "Hiện chưa có bộ câu hỏi nào được kích hoạt để làm lại." },
        { status: 404 }
      );
    }

    const studentObjId = new Types.ObjectId(authUser.id);
    const latestSubmitted = await AssessmentSubmission.findOne({
      studentId: studentObjId,
      status: ASSESSMENT_SUBMISSION_STATUS.SUBMITTED,
    })
      .sort({ attemptNumber: -1 })
      .select("attemptNumber")
      .lean();

    const nextAttempt = (latestSubmitted?.attemptNumber ?? 0) + 1;

    let draft = await AssessmentSubmission.findOne({
      studentId: studentObjId,
      questionnaireId: activeQuestionnaire._id,
      status: ASSESSMENT_SUBMISSION_STATUS.IN_PROGRESS,
    });

    if (draft) {
      draft.answers = [];
      draft.currentStepIndex = 0;
      draft.attemptNumber = nextAttempt;
      draft.lastSavedAt = new Date();
      await draft.save();
    } else {
      draft = await AssessmentSubmission.create({
        studentId: studentObjId,
        questionnaireId: activeQuestionnaire._id,
        status: ASSESSMENT_SUBMISSION_STATUS.IN_PROGRESS,
        attemptNumber: nextAttempt,
        answers: [],
        currentStepIndex: 0,
        lastSavedAt: new Date(),
      });
    }

    return NextResponse.json({
      success: true,
      draft: serializeSubmission(draft, activeQuestionnaire.title),
      nextUrl: "/onboarding",
    });
  } catch (error) {
    return handleAuthError(error);
  }
}

