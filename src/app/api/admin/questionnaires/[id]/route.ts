import { NextResponse } from "next/server";
import { Types } from "mongoose";
import { logAuditAction } from "@/lib/audit";
import {
  serializeQuestion,
  serializeQuestionnaire,
} from "@/lib/assessment-seed";
import { connectToDatabase } from "@/lib/db";
import { handleAuthError, requireAdmin } from "@/lib/session";
import { AssessmentQuestion } from "@/models/AssessmentQuestion";
import { AssessmentSubmission } from "@/models/AssessmentSubmission";
import { Questionnaire } from "@/models/Questionnaire";
import { questionnaireUpdateSchema } from "@/validations/assessment";

/**
 * GET /api/admin/questionnaires/[id]
 * Lấy chi tiết bộ câu hỏi và danh sách câu hỏi sắp theo order ASC.
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

    const [questions, submissionCount] = await Promise.all([
      AssessmentQuestion.find({ questionnaireId: questionnaire._id })
        .sort({ order: 1, createdAt: 1 })
        .lean(),
      AssessmentSubmission.countDocuments({
        questionnaireId: questionnaire._id,
        status: "SUBMITTED",
      }),
    ]);

    return NextResponse.json({
      success: true,
      questionnaire: serializeQuestionnaire(questionnaire, {
        questionCount: questions.length,
        submissionCount,
      }),
      questions: questions.map(serializeQuestion),
    });
  } catch (error) {
    return handleAuthError(error);
  }
}

/**
 * PATCH /api/admin/questionnaires/[id]
 * PA14: Chỉnh sửa tiêu đề, mô tả, phiên bản bộ câu hỏi.
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
    const parsed = questionnaireUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Dữ liệu cập nhật không hợp lệ" },
        { status: 400 }
      );
    }

    await connectToDatabase();
    const existing = await Questionnaire.findOne({
      _id: new Types.ObjectId(id),
      isDeleted: false,
    });
    if (!existing) {
      return NextResponse.json({ error: "Không tìm thấy bộ câu hỏi" }, { status: 404 });
    }

    const before = {
      title: existing.title,
      description: existing.description,
      version: existing.version,
    };

    if (parsed.data.title !== undefined) existing.title = parsed.data.title;
    if (parsed.data.description !== undefined) existing.description = parsed.data.description;
    if (parsed.data.version !== undefined) existing.version = parsed.data.version;
    await existing.save();

    await logAuditAction({
      admin,
      action: "UPDATE",
      targetCollection: "questionnaires",
      targetId: existing._id,
      targetTitle: existing.title,
      targetVersion: existing.version,
      changesBefore: before,
      changesAfter: {
        title: existing.title,
        description: existing.description,
        version: existing.version,
      },
      req,
    });

    const [questionCount, submissionCount] = await Promise.all([
      AssessmentQuestion.countDocuments({ questionnaireId: existing._id }),
      AssessmentSubmission.countDocuments({
        questionnaireId: existing._id,
        status: "SUBMITTED",
      }),
    ]);

    return NextResponse.json({
      success: true,
      questionnaire: serializeQuestionnaire(existing, {
        questionCount,
        submissionCount,
      }),
    });
  } catch (error) {
    return handleAuthError(error);
  }
}

/**
 * DELETE /api/admin/questionnaires/[id]
 * PA15: Nếu đã có sinh viên nộp bài -> bắt buộc soft-delete (isDeleted: true, isActive: false).
 * Nếu chưa có lượt làm bài nào -> cho phép xóa sạch khỏi hệ thống.
 */
export async function DELETE(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdmin(req);
    const { id } = await context.params;
    if (!Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Mã bộ câu hỏi không hợp lệ" }, { status: 400 });
    }

    await connectToDatabase();
    const existing = await Questionnaire.findOne({
      _id: new Types.ObjectId(id),
      isDeleted: false,
    });
    if (!existing) {
      return NextResponse.json({ error: "Không tìm thấy bộ câu hỏi" }, { status: 404 });
    }

    const totalSubmissions = await AssessmentSubmission.countDocuments({
      questionnaireId: existing._id,
    });

    if (totalSubmissions > 0) {
      existing.isDeleted = true;
      existing.isActive = false;
      await existing.save();

      await logAuditAction({
        admin,
        action: "DELETE",
        targetCollection: "questionnaires",
        targetId: existing._id,
        targetTitle: existing.title,
        reason: `Soft-delete để bảo toàn ${totalSubmissions} bài làm lịch sử của sinh viên`,
        req,
      });

      return NextResponse.json({
        success: true,
        softDeleted: true,
        message: `Đã lưu trữ ẩn (soft-delete) bộ câu hỏi để bảo toàn ${totalSubmissions} bài làm của sinh viên.`,
      });
    }

    await AssessmentQuestion.deleteMany({ questionnaireId: existing._id });
    await Questionnaire.deleteOne({ _id: existing._id });

    await logAuditAction({
      admin,
      action: "DELETE",
      targetCollection: "questionnaires",
      targetId: existing._id,
      targetTitle: existing.title,
      reason: "Xóa bộ câu hỏi chưa có dữ liệu nộp bài",
      req,
    });

    return NextResponse.json({
      success: true,
      softDeleted: false,
      message: "Đã xóa bộ câu hỏi thành công.",
    });
  } catch (error) {
    return handleAuthError(error);
  }
}

