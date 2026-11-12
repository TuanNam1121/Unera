import { NextResponse } from "next/server";
import { Types } from "mongoose";
import { ASSESSMENT_QUESTION_TYPES } from "@/constants";
import { validateConditionalGraph } from "@/lib/assessment-logic";
import { serializeQuestion } from "@/lib/assessment-seed";
import { logAuditAction } from "@/lib/audit";
import { connectToDatabase } from "@/lib/db";
import { handleAuthError, requireAdmin } from "@/lib/session";
import { AssessmentQuestion } from "@/models/AssessmentQuestion";
import { Questionnaire } from "@/models/Questionnaire";
import { assessmentQuestionInputSchema } from "@/validations/assessment";

/**
 * POST /api/admin/questionnaires/[id]/questions
 * PA17, PA20-PA24: Thêm câu hỏi mới vào bộ câu hỏi kèm kiểm tra điều kiện hiển thị & cycle guard.
 */
export async function POST(
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
    const parsed = assessmentQuestionInputSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Dữ liệu câu hỏi không hợp lệ" },
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

    const existingQuestions = await AssessmentQuestion.find({
      questionnaireId: questionnaire._id,
    })
      .sort({ order: 1 })
      .lean();

    if (
      existingQuestions.some(
        (q) => q.code.toLowerCase() === parsed.data.code.toLowerCase()
      )
    ) {
      return NextResponse.json(
        { error: `Mã câu hỏi "${parsed.data.code}" đã tồn tại trong bộ câu hỏi này.` },
        { status: 409 }
      );
    }

    const maxOrder = existingQuestions.reduce(
      (max, q) => Math.max(max, q.order),
      0
    );
    const assignedOrder = parsed.data.order ?? maxOrder + 1;
    const tempNewId = new Types.ObjectId();

    const graphCheck = validateConditionalGraph(
      existingQuestions.map((q) => ({
        _id: q._id.toString(),
        order: q.order,
        code: q.code,
        conditionalLogic: q.conditionalLogic,
      })),
      {
        questionId: tempNewId.toString(),
        order: assignedOrder,
        conditionalLogic: parsed.data.conditionalLogic ?? null,
      }
    );

    if (!graphCheck.valid) {
      return NextResponse.json({ error: graphCheck.error }, { status: 400 });
    }

    const isChoice =
      parsed.data.questionType === ASSESSMENT_QUESTION_TYPES.SINGLE_CHOICE ||
      parsed.data.questionType === ASSESSMENT_QUESTION_TYPES.MULTIPLE_CHOICE;

    const created = await AssessmentQuestion.create({
      _id: tempNewId,
      questionnaireId: questionnaire._id,
      code: parsed.data.code,
      questionText: parsed.data.questionText,
      description: parsed.data.description,
      questionType: parsed.data.questionType,
      isRequired: parsed.data.isRequired,
      allowCustomOption: isChoice ? parsed.data.allowCustomOption !== false : false,
      order: assignedOrder,
      options: isChoice
        ? parsed.data.options.map((o, idx) => ({
            ...o,
            order: idx + 1,
          }))
        : [],
      scaleConfig:
        parsed.data.questionType === ASSESSMENT_QUESTION_TYPES.SCALE
          ? parsed.data.scaleConfig || {
              min: 1,
              max: 5,
              step: 1,
              minLabel: "Hoàn toàn không đồng ý",
              maxLabel: "Rất đồng ý",
            }
          : undefined,
      textConfig:
        parsed.data.questionType === ASSESSMENT_QUESTION_TYPES.TEXT
          ? parsed.data.textConfig || {
              placeholder: "Nhập câu trả lời của bạn...",
              maxLength: 1000,
              multiline: true,
            }
          : undefined,
      multipleConfig:
        parsed.data.questionType === ASSESSMENT_QUESTION_TYPES.MULTIPLE_CHOICE
          ? parsed.data.multipleConfig
          : undefined,
      conditionalLogic: parsed.data.conditionalLogic?.enabled
        ? parsed.data.conditionalLogic
        : null,
    });

    await logAuditAction({
      admin,
      action: "CREATE",
      targetCollection: "assessment_questions",
      targetId: created._id,
      targetTitle: `[${created.code}] ${created.questionText}`,
      changesAfter: {
        questionnaireId: id,
        questionType: created.questionType,
        order: created.order,
      },
      req,
    });

    return NextResponse.json(
      { success: true, question: serializeQuestion(created) },
      { status: 201 }
    );
  } catch (error) {
    return handleAuthError(error);
  }
}

