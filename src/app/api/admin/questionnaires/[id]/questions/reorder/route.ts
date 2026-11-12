import { NextResponse } from "next/server";
import { Types } from "mongoose";
import { validateConditionalGraph } from "@/lib/assessment-logic";
import { serializeQuestion } from "@/lib/assessment-seed";
import { logAuditAction } from "@/lib/audit";
import { connectToDatabase } from "@/lib/db";
import { handleAuthError, requireAdmin } from "@/lib/session";
import { AssessmentQuestion } from "@/models/AssessmentQuestion";
import { Questionnaire } from "@/models/Questionnaire";
import { reorderQuestionsSchema } from "@/validations/assessment";

/**
 * PATCH /api/admin/questionnaires/[id]/questions/reorder
 * PA23: Cập nhật đồng loạt thứ tự câu hỏi trong bộ câu hỏi, kiểm tra không phá vỡ điều kiện thứ tự (PA24).
 */
export async function PATCH(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdmin(req);
    const { id } = await context.params;
    if (!Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Mã bộ câu hỏi không hợp lệ" }, { status: 400 });
    }

    const body = await req.json();
    const parsed = reorderQuestionsSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Danh sách thứ tự không hợp lệ" },
        { status: 400 }
      );
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
    }).lean();

    const orderedIds = parsed.data.orderedQuestionIds;
    const existingIds = new Set(questions.map((q) => q._id.toString()));
    if (
      orderedIds.length !== questions.length ||
      orderedIds.some((qId) => !existingIds.has(qId)) ||
      new Set(orderedIds).size !== questions.length
    ) {
      return NextResponse.json(
        { error: "Danh sách orderedQuestionIds phải khớp đầy đủ với các câu hỏi hiện có." },
        { status: 400 }
      );
    }

    const newOrderMap = new Map(orderedIds.map((qId, idx) => [qId, idx + 1]));
    const updatedGraphNodes = questions.map((q) => ({
      _id: q._id.toString(),
      order: newOrderMap.get(q._id.toString())!,
      code: q.code,
      conditionalLogic: q.conditionalLogic,
    }));

    for (const node of updatedGraphNodes) {
      const check = validateConditionalGraph(updatedGraphNodes, {
        questionId: node._id,
        order: node.order,
        conditionalLogic: node.conditionalLogic,
      });
      if (!check.valid) {
        return NextResponse.json(
          { error: check.error || "Thứ tự mới làm sai lệch điều kiện hiển thị giữa các câu hỏi." },
          { status: 400 }
        );
      }
    }

    await AssessmentQuestion.bulkWrite(
      orderedIds.map((qId, idx) => ({
        updateOne: {
          filter: {
            _id: new Types.ObjectId(qId),
            questionnaireId: questionnaire._id,
          },
          update: { $set: { order: idx + 1 } },
        },
      }))
    );

    const refreshed = await AssessmentQuestion.find({
      questionnaireId: questionnaire._id,
    })
      .sort({ order: 1 })
      .lean();

    await logAuditAction({
      admin,
      action: "UPDATE",
      targetCollection: "questionnaires",
      targetId: questionnaire._id,
      targetTitle: `${questionnaire.title} (Sắp xếp thứ tự câu hỏi)`,
      changesAfter: { orderedQuestionIds: orderedIds },
      req,
    });

    return NextResponse.json({
      success: true,
      questions: refreshed.map(serializeQuestion),
    });
  } catch (error) {
    return handleAuthError(error);
  }
}

