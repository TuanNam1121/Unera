import { NextResponse } from "next/server";
import { Types } from "mongoose";
import {
  ASSESSMENT_SUBMISSION_STATUS,
  AUTH_COOKIE_NAMES,
  ONBOARDING_STEPS,
} from "@/constants";
import { validateVisibleAnswers } from "@/lib/assessment-logic";
import {
  serializeQuestion,
  serializeSubmission,
} from "@/lib/assessment-seed";
import { connectToDatabase } from "@/lib/db";
import { ACCESS_TOKEN_MAX_AGE_SECONDS, getAuthCookieOptions } from "@/lib/jwt";
import { runOrientationAnalysis } from "@/lib/orientation-ai";
import { generatePersonalizedRoadmap } from "@/lib/roadmap-service";
import { handleAuthError, requireAuth } from "@/lib/session";
import { signAccessTokenForUser } from "@/lib/tokens";
import { AssessmentQuestion } from "@/models/AssessmentQuestion";
import { AssessmentSubmission } from "@/models/AssessmentSubmission";
import { Questionnaire } from "@/models/Questionnaire";
import { User } from "@/models/User";
import { assessmentSubmitSchema } from "@/validations/assessment";

/**
 * POST /api/assessments/submit
 * PA09: Validate conditional + required -> lưu SUBMITTED -> cập nhật onboardingStep
 * -> kích hoạt Gemini AI Analysis (AI01–AI09) -> sinh Lộ trình 4 năm (RM01).
 */
export async function POST(req: Request) {
  try {
    const authUser = await requireAuth(req);
    const body = await req.json();

    const parsed = assessmentSubmitSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Dữ liệu nộp bài không hợp lệ" },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const questionnaire = parsed.data.questionnaireId &&
      Types.ObjectId.isValid(parsed.data.questionnaireId)
      ? await Questionnaire.findOne({
          _id: new Types.ObjectId(parsed.data.questionnaireId),
          isActive: true,
          isDeleted: false,
        }).lean()
      : await Questionnaire.findOne({ isActive: true, isDeleted: false }).lean();

    if (!questionnaire) {
      return NextResponse.json(
        { error: "Bộ câu hỏi khảo sát hiện không còn kích hoạt." },
        { status: 404 }
      );
    }

    const questionDocs = await AssessmentQuestion.find({
      questionnaireId: questionnaire._id,
    })
      .sort({ order: 1 })
      .lean();

    if (questionDocs.length === 0) {
      return NextResponse.json(
        { error: "Bộ câu hỏi chưa có câu hỏi nào để nộp." },
        { status: 400 }
      );
    }

    const serializedQuestions = questionDocs.map(serializeQuestion);
    const validation = validateVisibleAnswers(
      serializedQuestions,
      parsed.data.answers
    );

    if (!validation.valid) {
      return NextResponse.json(
        {
          error: validation.errors[0]?.message || "Vui lòng hoàn thành các câu hỏi bắt buộc",
          errors: validation.errors,
        },
        { status: 400 }
      );
    }

    const questionMap = new Map(
      serializedQuestions.map((q) => [q._id, q])
    );
    const snapshotAnswers = Object.entries(validation.cleanedAnswers)
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

    let submission = await AssessmentSubmission.findOne({
      studentId: studentObjId,
      questionnaireId: questionnaire._id,
      status: ASSESSMENT_SUBMISSION_STATUS.IN_PROGRESS,
    }).sort({ updatedAt: -1 });

    if (submission) {
      submission.status = ASSESSMENT_SUBMISSION_STATUS.SUBMITTED;
      submission.answers = snapshotAnswers;
      submission.submittedAt = now;
      submission.lastSavedAt = now;
      await submission.save();
    } else {
      const latestSubmission = await AssessmentSubmission.findOne({
        studentId: studentObjId,
      })
        .sort({ attemptNumber: -1 })
        .select("attemptNumber")
        .lean();

      submission = await AssessmentSubmission.create({
        studentId: studentObjId,
        questionnaireId: questionnaire._id,
        status: ASSESSMENT_SUBMISSION_STATUS.SUBMITTED,
        attemptNumber: (latestSubmission?.attemptNumber ?? 0) + 1,
        answers: snapshotAnswers,
        currentStepIndex: Math.max(0, validation.visibleQuestions.length - 1),
        lastSavedAt: now,
        submittedAt: now,
      });
    }

    // Cập nhật onboardingStep = COMPLETED & làm mới Access Token cookie
    const dbUser = await User.findById(authUser.id);
    let refreshedToken: string | null = null;
    if (dbUser) {
      if (dbUser.onboardingStep !== ONBOARDING_STEPS.COMPLETED) {
        dbUser.onboardingStep = ONBOARDING_STEPS.COMPLETED;
        await dbUser.save();
      }
      refreshedToken = await signAccessTokenForUser(dbUser);
    }

    // Gọi Gemini AI Phân tích định hướng (AI01-AI09)
    const aiOutcome = await runOrientationAnalysis({
      studentId: authUser.id,
      submissionId: submission._id.toString(),
    });

    let roadmapResult = null;
    let roadmapError: string | undefined;

    if (aiOutcome.ok) {
      const rmOutcome = await generatePersonalizedRoadmap({
        studentId: authUser.id,
        analysisId: aiOutcome.analysis._id,
      });
      if (rmOutcome.ok && rmOutcome.roadmap) {
        roadmapResult = rmOutcome.roadmap;
      } else {
        roadmapError = rmOutcome.errorMessage;
      }
    }

    const response = NextResponse.json({
      success: true,
      message: aiOutcome.ok
        ? "Đã nộp bài khảo sát và hoàn tất phân tích định hướng AI!"
        : "Đã lưu bài khảo sát thành công. Quá trình phân tích AI đang gặp sự cố tạm thời, bạn có thể thử phân tích lại ngay ở trang kết quả.",
      submission: serializeSubmission(submission, questionnaire.title),
      analysis: aiOutcome.analysis,
      roadmap: roadmapResult,
      aiError: aiOutcome.errorMessage || roadmapError || null,
    });

    if (refreshedToken) {
      response.cookies.set(
        AUTH_COOKIE_NAMES.ACCESS_TOKEN,
        refreshedToken,
        getAuthCookieOptions(ACCESS_TOKEN_MAX_AGE_SECONDS)
      );
    }

    return response;
  } catch (error) {
    return handleAuthError(error);
  }
}

