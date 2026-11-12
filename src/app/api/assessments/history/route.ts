import { NextResponse } from "next/server";
import { Types } from "mongoose";
import { ASSESSMENT_SUBMISSION_STATUS } from "@/constants";
import { serializeAiAnalysis } from "@/lib/orientation-ai";
import { serializeSubmission } from "@/lib/assessment-seed";
import { connectToDatabase } from "@/lib/db";
import { handleAuthError, requireAuth } from "@/lib/session";
import { AiOrientationAnalysis } from "@/models/AiOrientationAnalysis";
import { AssessmentSubmission } from "@/models/AssessmentSubmission";
import { Questionnaire } from "@/models/Questionnaire";

/**
 * GET /api/assessments/history
 * PA11: Danh sách lịch sử các lần đã nộp bài trắc nghiệm định hướng + trạng thái phân tích AI.
 */
export async function GET(req: Request) {
  try {
    const authUser = await requireAuth(req);
    await connectToDatabase();

    const studentObjId = new Types.ObjectId(authUser.id);
    const submissions = await AssessmentSubmission.find({
      studentId: studentObjId,
      status: ASSESSMENT_SUBMISSION_STATUS.SUBMITTED,
    })
      .sort({ submittedAt: -1, createdAt: -1 })
      .lean();

    if (submissions.length === 0) {
      return NextResponse.json({ success: true, items: [] });
    }

    const qIds = Array.from(
      new Set(submissions.map((s) => s.questionnaireId.toString()))
    ).map((id) => new Types.ObjectId(id));
    const subIds = submissions.map((s) => s._id);

    const [questionnaires, analyses] = await Promise.all([
      Questionnaire.find({ _id: { $in: qIds } })
        .select("title version")
        .lean(),
      AiOrientationAnalysis.find({
        studentId: studentObjId,
        submissionId: { $in: subIds },
      })
        .sort({ createdAt: -1 })
        .lean(),
    ]);

    const qMap = new Map(questionnaires.map((q) => [q._id.toString(), q]));
    const latestAnalysisBySub = new Map<string, (typeof analyses)[number]>();
    for (const a of analyses) {
      const key = a.submissionId.toString();
      if (!latestAnalysisBySub.has(key)) {
        latestAnalysisBySub.set(key, a);
      }
    }

    const items = submissions.map((sub) => {
      const q = qMap.get(sub.questionnaireId.toString());
      const analysis = latestAnalysisBySub.get(sub._id.toString());
      return {
        submission: serializeSubmission(sub, q?.title || "Bộ khảo sát định hướng"),
        questionnaireTitle: q?.title || "Bộ khảo sát định hướng",
        questionnaireVersion: q?.version ?? 1,
        latestAnalysis: analysis ? serializeAiAnalysis(analysis) : null,
      };
    });

    return NextResponse.json({ success: true, items });
  } catch (error) {
    return handleAuthError(error);
  }
}

