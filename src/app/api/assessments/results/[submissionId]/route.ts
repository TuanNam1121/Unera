import { NextResponse } from "next/server";
import { Types } from "mongoose";
import { ROADMAP_STATUS } from "@/constants";
import { formatReadableAnswer } from "@/lib/assessment-logic";
import { serializeSubmission } from "@/lib/assessment-seed";
import { connectToDatabase } from "@/lib/db";
import { serializeAiAnalysis } from "@/lib/orientation-ai";
import { handleAuthError, requireAuth } from "@/lib/session";
import { AiOrientationAnalysis } from "@/models/AiOrientationAnalysis";
import { AssessmentQuestion } from "@/models/AssessmentQuestion";
import { AssessmentSubmission } from "@/models/AssessmentSubmission";
import { Questionnaire } from "@/models/Questionnaire";
import { Roadmap } from "@/models/Roadmap";

/**
 * GET /api/assessments/results/[submissionId]
 * PA10: Chi tiết bài nộp + kết quả phân tích AI tương ứng của sinh viên.
 */
export async function GET(
  req: Request,
  context: { params: Promise<{ submissionId: string }> }
) {
  try {
    const authUser = await requireAuth(req);
    const { submissionId } = await context.params;

    if (!Types.ObjectId.isValid(submissionId)) {
      return NextResponse.json(
        { error: "Mã bài đánh giá không hợp lệ." },
        { status: 400 }
      );
    }

    await connectToDatabase();
    const studentObjId = new Types.ObjectId(authUser.id);
    const subObjId = new Types.ObjectId(submissionId);

    const submission = await AssessmentSubmission.findOne({
      _id: subObjId,
      studentId: studentObjId,
    }).lean();

    if (!submission) {
      return NextResponse.json(
        { error: "Không tìm thấy kết quả bài khảo sát này." },
        { status: 404 }
      );
    }

    const [questionnaire, questions, analyses, activeRoadmap] = await Promise.all([
      Questionnaire.findById(submission.questionnaireId)
        .select("title version")
        .lean(),
      AssessmentQuestion.find({ questionnaireId: submission.questionnaireId }).lean(),
      AiOrientationAnalysis.find({
        studentId: studentObjId,
        submissionId: subObjId,
      })
        .sort({ createdAt: -1 })
        .lean(),
      Roadmap.findOne({
        studentId: studentObjId,
        status: ROADMAP_STATUS.ACTIVE,
      })
        .select("_id title orientationDirection version progressPercent analysisId")
        .lean(),
    ]);

    const questionMap = new Map(questions.map((q) => [q._id.toString(), q]));
    const serializedSub = serializeSubmission(submission, questionnaire?.title);
    serializedSub.answers = serializedSub.answers.map((ans) => {
      const q = questionMap.get(ans.questionId);
      const readableValue = q
        ? formatReadableAnswer(
            {
              questionType: q.questionType,
              options: q.options,
              scaleConfig: q.scaleConfig,
            },
            ans.value
          )
        : Array.isArray(ans.value)
          ? ans.value.join("; ")
          : String(ans.value);
      return { ...ans, readableValue };
    });

    return NextResponse.json({
      success: true,
      submission: serializedSub,
      latestAnalysis: analyses[0] ? serializeAiAnalysis(analyses[0]) : null,
      analyses: analyses.map(serializeAiAnalysis),
      activeRoadmap: activeRoadmap
        ? {
            _id: activeRoadmap._id.toString(),
            title: activeRoadmap.title,
            orientationDirection: activeRoadmap.orientationDirection,
            version: activeRoadmap.version,
            progressPercent: activeRoadmap.progressPercent,
            analysisId: activeRoadmap.analysisId
              ? activeRoadmap.analysisId.toString()
              : null,
          }
        : null,
    });
  } catch (error) {
    return handleAuthError(error);
  }
}

