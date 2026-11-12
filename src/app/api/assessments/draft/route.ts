import { NextResponse } from "next/server";
import { Types } from "mongoose";
import { ASSESSMENT_SUBMISSION_STATUS } from "@/constants";
import { isAnswerEmpty } from "@/lib/assessment-logic";
import { serializeSubmission } from "@/lib/assessment-seed";
import { connectToDatabase } from "@/lib/db";
import { handleAuthError, requireAuth } from "@/lib/session";
import { AssessmentQuestion } from "@/models/AssessmentQuestion";
import { AssessmentSubmission } from "@/models/AssessmentSubmission";
import { Questionnaire } from "@/models/Questionnaire";
import { assessmentDraftSchema } from "@/validations/assessment";

/**
 * PUT /api/assessments/draft
 * PA08: Lưu nháp tiến độ trả lời bài trắc nghiệm định hướng (IN_PROGRESS).
 */
export async function PUT(req: Request) {
  try {
    const authUser = await requireAuth(req);
    const body = await req.json();

    const parsed = assessmentDraftSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Dữ liệu lưu nháp không hợp lệ" },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const activeQuestionnaire = parsed.data.questionnaireId &&
      Types.ObjectId.isValid(parsed.data.questionnaireId)
      ? await Questionnaire.findOne({
          _id: new Types.ObjectId(parsed.data.questionnaireId),
          isDeleted: false,
        }).lean()
      : await Questionnaire.findOne({ isActive: true, isDeleted: false }).lean();

    if (!activeQuestionnaire) {
      return NextResponse.json(
        { error: "Hiện không có bộ câu hỏi nào đang kích hoạt để lưu tiến độ." },
        { status: 404 }
      );
    }

    const questions = await AssessmentQuestion.find({
      questionnaireId: activeQuestionnaire._id,
    })
      .sort({ order: 1 })
      .lean();
    const questionMap = new Map(questions.map((q) => [q._id.toString(), q]));

    const snapshotAnswers = Object.entries(parsed.data.answers)
      .filter(([, val]) => !isAnswerEmpty(val))
      .map(([questionId, value]) => {
        const q = questionMap.get(questionId);
        if (!q) return null;
        return {
          questionId,
          questionCode: q.code,
          questionTextSnapshot: q.questionText,
          questionType: q.questionType,
          value,
        };
      })
      .filter((item): item is NonNullable<typeof item> => item !== null);

    const studentObjId = new Types.ObjectId(authUser.id);
    const now = new Date();

    let draft = await AssessmentSubmission.findOneAndUpdate(
      {
        studentId: studentObjId,
        questionnaireId: activeQuestionnaire._id,
        status: ASSESSMENT_SUBMISSION_STATUS.IN_PROGRESS,
      },
      {
        $set: {
          answers: snapshotAnswers,
          currentStepIndex: parsed.data.currentStepIndex,
          lastSavedAt: now,
        },
      },
      {
        sort: { updatedAt: -1 },
        returnDocument: "after",
      }
    );

    if (!draft) {
      const latestSubmitted = await AssessmentSubmission.findOne({
        studentId: studentObjId,
      })
        .sort({ attemptNumber: -1 })
        .select("attemptNumber")
        .lean();

      draft = await AssessmentSubmission.create({
        studentId: studentObjId,
        questionnaireId: activeQuestionnaire._id,
        status: ASSESSMENT_SUBMISSION_STATUS.IN_PROGRESS,
        attemptNumber: (latestSubmitted?.attemptNumber ?? 0) + 1,
        answers: snapshotAnswers,
        currentStepIndex: parsed.data.currentStepIndex,
        lastSavedAt: now,
      });
    }

    return NextResponse.json({
      success: true,
      draft: serializeSubmission(draft, activeQuestionnaire.title),
      savedAt: now.toISOString(),
    });
  } catch (error) {
    return handleAuthError(error);
  }
}

