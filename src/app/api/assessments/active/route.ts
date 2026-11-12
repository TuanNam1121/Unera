import { NextResponse } from "next/server";
import { Types } from "mongoose";
import { ASSESSMENT_SUBMISSION_STATUS } from "@/constants";
import {
  ensureDefaultQuestionnaire,
  serializeQuestion,
  serializeQuestionnaire,
  serializeSubmission,
} from "@/lib/assessment-seed";
import { connectToDatabase } from "@/lib/db";
import { handleAuthError, requireAuth } from "@/lib/session";
import { AssessmentQuestion } from "@/models/AssessmentQuestion";
import { AssessmentSubmission } from "@/models/AssessmentSubmission";
import { Questionnaire } from "@/models/Questionnaire";

/**
 * GET /api/assessments/active
 * PA01, PA08: Lấy bộ câu hỏi đang kích hoạt (isActive: true) + bản nháp IN_PROGRESS hiện tại của sinh viên.
 */
export async function GET(req: Request) {
  try {
    const authUser = await requireAuth(req);
    await connectToDatabase();

    // Chỉ auto-seed bộ câu hỏi mặc định nếu hệ thống chưa có bộ câu hỏi nào
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
      return NextResponse.json({
        success: true,
        questionnaire: null,
        questions: [],
        draft: null,
        submittedCount: await AssessmentSubmission.countDocuments({
          studentId: new Types.ObjectId(authUser.id),
          status: ASSESSMENT_SUBMISSION_STATUS.SUBMITTED,
        }),
      });
    }

    const studentObjId = new Types.ObjectId(authUser.id);

    const [questions, draft, submittedCount] = await Promise.all([
      AssessmentQuestion.find({ questionnaireId: activeQuestionnaire._id })
        .sort({ order: 1, createdAt: 1 })
        .lean(),
      AssessmentSubmission.findOne({
        studentId: studentObjId,
        questionnaireId: activeQuestionnaire._id,
        status: ASSESSMENT_SUBMISSION_STATUS.IN_PROGRESS,
      })
        .sort({ updatedAt: -1 })
        .lean(),
      AssessmentSubmission.countDocuments({
        studentId: studentObjId,
        status: ASSESSMENT_SUBMISSION_STATUS.SUBMITTED,
      }),
    ]);

    return NextResponse.json({
      success: true,
      questionnaire: serializeQuestionnaire(activeQuestionnaire, {
        questionCount: questions.length,
      }),
      questions: questions.map(serializeQuestion),
      draft: draft ? serializeSubmission(draft, activeQuestionnaire.title) : null,
      submittedCount,
    });
  } catch (error) {
    return handleAuthError(error);
  }
}

