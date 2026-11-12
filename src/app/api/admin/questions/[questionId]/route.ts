import { NextResponse } from "next/server";
import { Types } from "mongoose";
import { ASSESSMENT_QUESTION_TYPES } from "@/constants";
import { validateConditionalGraph } from "@/lib/assessment-logic";
import { serializeQuestion } from "@/lib/assessment-seed";
import { logAuditAction } from "@/lib/audit";
import { connectToDatabase } from "@/lib/db";
import { handleAuthError, requireAdmin } from "@/lib/session";
import { AssessmentQuestion } from "@/models/AssessmentQuestion";
import { assessmentQuestionInputSchema } from "@/validations/assessment";

/**
 * PATCH /api/admin/questions/[questionId]
 * PA18, PA20-PA24: Sửa câu hỏi kèm kiểm tra chu trình điều kiện (DFS cycle guard).
 */
export async function PATCH(
  req: Request,
  context: { params: Promise<{ questionId: string }> }
) {
  try {
    const admin = await requireAdmin(req);
    const { questionId } = await context.params;
    if (!Types.ObjectId.isValid(questionId)) {
      return NextResponse.json({ error: "Mã câu hỏi không hợp lệ" }, { status: 400 });
    }

    const body = await req.json();
    const parsed = assessmentQuestionInputSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Dữ liệu cập nhật câu hỏi không hợp lệ" },
        { status: 400 }
      );
    }

    await connectToDatabase();
    const existing = await AssessmentQuestion.findById(questionId);
    if (!existing) {
      return NextResponse.json({ error: "Không tìm thấy câu hỏi" }, { status: 404 });
    }

    const siblings = await AssessmentQuestion.find({
      questionnaireId: existing.questionnaireId,
    })
      .sort({ order: 1 })
      .lean();

    if (
      siblings.some(
        (q) =>
          q._id.toString() !== questionId &&
          q.code.toLowerCase() === parsed.data.code.toLowerCase()
      )
    ) {
      return NextResponse.json(
        { error: `Mã câu hỏi "${parsed.data.code}" đã được sử dụng trong bộ câu hỏi.` },
        { status: 409 }
      );
    }

    const targetOrder = parsed.data.order ?? existing.order;

    const graphCheck = validateConditionalGraph(
      siblings.map((q) => ({
        _id: q._id.toString(),
        order: q._id.toString() === questionId ? targetOrder : q.order,
        code: q._id.toString() === questionId ? parsed.data.code : q.code,
        conditionalLogic: q.conditionalLogic,
      })),
      {
        questionId,
        order: targetOrder,
        conditionalLogic: parsed.data.conditionalLogic ?? null,
      }
    );

    if (!graphCheck.valid) {
      return NextResponse.json({ error: graphCheck.error }, { status: 400 });
    }

    const before = {
      code: existing.code,
      questionText: existing.questionText,
      questionType: existing.questionType,
      isRequired: existing.isRequired,
    };

    const isChoice =
      parsed.data.questionType === ASSESSMENT_QUESTION_TYPES.SINGLE_CHOICE ||
      parsed.data.questionType === ASSESSMENT_QUESTION_TYPES.MULTIPLE_CHOICE;

    existing.code = parsed.data.code;
    existing.questionText = parsed.data.questionText;
    existing.description = parsed.data.description;
    existing.questionType = parsed.data.questionType;
    existing.isRequired = parsed.data.isRequired;
    existing.allowCustomOption = isChoice
      ? parsed.data.allowCustomOption !== false
      : false;
    existing.order = targetOrder;
    existing.options = isChoice
      ? parsed.data.options.map((o, idx) => ({ ...o, order: idx + 1 }))
      : [];
    existing.scaleConfig =
      parsed.data.questionType === ASSESSMENT_QUESTION_TYPES.SCALE
        ? parsed.data.scaleConfig
        : undefined;
    existing.textConfig =
      parsed.data.questionType === ASSESSMENT_QUESTION_TYPES.TEXT
        ? parsed.data.textConfig
        : undefined;
    existing.multipleConfig =
      parsed.data.questionType === ASSESSMENT_QUESTION_TYPES.MULTIPLE_CHOICE
        ? parsed.data.multipleConfig
        : undefined;
    existing.conditionalLogic = parsed.data.conditionalLogic?.enabled
      ? parsed.data.conditionalLogic
      : null;

    await existing.save();

    await logAuditAction({
      admin,
      action: "UPDATE",
      targetCollection: "assessment_questions",
      targetId: existing._id,
      targetTitle: `[${existing.code}] ${existing.questionText}`,
      changesBefore: before,
      changesAfter: {
        code: existing.code,
        questionText: existing.questionText,
        questionType: existing.questionType,
        isRequired: existing.isRequired,
      },
      req,
    });

    return NextResponse.json({
      success: true,
      question: serializeQuestion(existing),
    });
  } catch (error) {
    return handleAuthError(error);
  }
}

/**
 * DELETE /api/admin/questions/[questionId]
 * PA19: Xóa câu hỏi khỏi bộ câu hỏi, tự động dọn/vô hiệu hóa rule conditionalLogic phụ thuộc bị gãy ở các câu khác và cảnh báo Admin.
 */
export async function DELETE(
  req: Request,
  context: { params: Promise<{ questionId: string }> }
) {
  try {
    const admin = await requireAdmin(req);
    const { questionId } = await context.params;
    if (!Types.ObjectId.isValid(questionId)) {
      return NextResponse.json({ error: "Mã câu hỏi không hợp lệ" }, { status: 400 });
    }

    await connectToDatabase();
    const target = await AssessmentQuestion.findById(questionId);
    if (!target) {
      return NextResponse.json({ error: "Không tìm thấy câu hỏi" }, { status: 404 });
    }

    const dependentQuestions = await AssessmentQuestion.find({
      questionnaireId: target.questionnaireId,
      "conditionalLogic.rules.sourceQuestionId": questionId,
    });

    const affectedCodes: string[] = [];
    for (const dep of dependentQuestions) {
      if (!dep.conditionalLogic) continue;
      const filteredRules = (dep.conditionalLogic.rules || []).filter(
        (r) => r.sourceQuestionId !== questionId
      );
      dep.conditionalLogic.rules = filteredRules;
      if (filteredRules.length === 0) {
        dep.conditionalLogic.enabled = false;
      }
      await dep.save();
      affectedCodes.push(dep.code);
    }

    await AssessmentQuestion.deleteOne({ _id: target._id });

    // Chuẩn hóa lại thứ tự các câu còn lại
    const remaining = await AssessmentQuestion.find({
      questionnaireId: target.questionnaireId,
    }).sort({ order: 1 });
    if (remaining.length > 0) {
      await AssessmentQuestion.bulkWrite(
        remaining.map((q, idx) => ({
          updateOne: {
            filter: { _id: q._id },
            update: { $set: { order: idx + 1 } },
          },
        }))
      );
    }

    await logAuditAction({
      admin,
      action: "DELETE",
      targetCollection: "assessment_questions",
      targetId: target._id,
      targetTitle: `[${target.code}] ${target.questionText}`,
      reason:
        affectedCodes.length > 0
          ? `Đã tự động gỡ điều kiện phụ thuộc tại: ${affectedCodes.join(", ")}`
          : undefined,
      req,
    });

    return NextResponse.json({
      success: true,
      affectedCodes,
      message:
        affectedCodes.length > 0
          ? `Đã xóa câu hỏi "${target.code}" và tự động vô hiệu hóa điều kiện phụ thuộc ở các câu: ${affectedCodes.join(", ")}.`
          : `Đã xóa câu hỏi "${target.code}" thành công.`,
    });
  } catch (error) {
    return handleAuthError(error);
  }
}

