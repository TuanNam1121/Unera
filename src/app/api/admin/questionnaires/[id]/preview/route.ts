import { NextResponse } from "next/server";
import { Types } from "mongoose";
import {
  serializeQuestion,
  serializeQuestionnaire,
} from "@/lib/assessment-seed";
import { connectToDatabase } from "@/lib/db";
import { handleAuthError, requireAdmin } from "@/lib/session";
import { AssessmentQuestion } from "@/models/AssessmentQuestion";
import { Questionnaire } from "@/models/Questionnaire";

/**
 * GET /api/admin/questionnaires/[id]/preview
 * PA25: Lấy toàn bộ bộ câu hỏi (kể cả khi chưa active) để Admin chạy thử nghiệm logic điều kiện.
 */
export async function GET(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin(req);
    const { id } = await context.params;
    if (!Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Mã bộ câu hỏi không hợp lệ" }, { status: 400 });
    }

    await connectToDatabase();
    const questionnaire = await Questionnaire.findOne({
      _id: new Types.ObjectId(id),
      isDeleted: false,
    }).lean();

    if (!questionnaire) {
      return NextResponse.json({ error: "Không tìm thấy bộ câu hỏi" }, { status: 404 });
    }

    const questions = await AssessmentQuestion.find({
      questionnaireId: questionnaire._id,
    })
      .sort({ order: 1, createdAt: 1 })
      .lean();

    return NextResponse.json({
      success: true,
      previewMode: true,
      questionnaire: serializeQuestionnaire(questionnaire, {
        questionCount: questions.length,
      }),
      questions: questions.map(serializeQuestion),
    });
  } catch (error) {
    return handleAuthError(error);
  }
}

