import { NextResponse } from "next/server";
import { requireAdmin, handleAuthError } from "@/lib/session";
import { connectToDatabase } from "@/lib/db";
import { QuizQuestion } from "@/models/QuizQuestion";
import { logAuditAction } from "@/lib/audit";

/**
 * GET /api/admin/quiz/questions/[id]
 * Lấy chi tiết một câu hỏi theo ID
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;
    await connectToDatabase();

    const question = await QuizQuestion.findById(id).lean();
    if (!question) {
      return NextResponse.json(
        { error: "Không tìm thấy câu hỏi yêu cầu." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      question,
    });
  } catch (error) {
    return handleAuthError(error);
  }
}

/**
 * PATCH /api/admin/quiz/questions/[id]
 * Cập nhật nội dung câu hỏi, danh mục, thứ tự, trạng thái kích hoạt hoặc phương án lựa chọn
 */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdmin();
    const { id } = await params;
    const body = await req.json();

    await connectToDatabase();

    const question = await QuizQuestion.findById(id);
    if (!question) {
      return NextResponse.json(
        { error: "Không tìm thấy câu hỏi cần cập nhật." },
        { status: 404 }
      );
    }

    const previousState = {
      question: question.question,
      category: question.category,
      order: question.order,
      isActive: question.isActive,
      optionsCount: question.options.length,
    };

    if (body.question !== undefined) {
      const qText = String(body.question).trim();
      if (!qText) {
        return NextResponse.json(
          { error: "Nội dung câu hỏi không được để trống." },
          { status: 400 }
        );
      }
      question.question = qText;
    }

    if (body.category !== undefined) {
      question.category = String(body.category).trim().toUpperCase();
    }

    if (body.order !== undefined) {
      const ord = Number(body.order);
      if (!isNaN(ord) && ord > 0) {
        question.order = ord;
      }
    }

    if (body.isActive !== undefined) {
      question.isActive = Boolean(body.isActive);
    }

    if (body.options !== undefined) {
      if (!Array.isArray(body.options) || body.options.length < 2) {
        return NextResponse.json(
          { error: "Câu hỏi bắt buộc phải có tối thiểu 2 phương án lựa chọn." },
          { status: 400 }
        );
      }

      const formattedOptions = body.options.map((opt: any, idx: number) => {
        const text = typeof opt.text === "string" ? opt.text.trim() : "";
        if (!text) {
          throw new Error(`Phương án lựa chọn thứ ${idx + 1} không được để trống.`);
        }

        return {
          id: opt.id && typeof opt.id === "string" ? opt.id : `opt_${Date.now()}_${idx + 1}`,
          text,
          scores: {
            study_abroad: Math.max(0, Number(opt.scores?.study_abroad || 0)),
            employment: Math.max(0, Number(opt.scores?.employment || 0)),
            research: Math.max(0, Number(opt.scores?.research || 0)),
            startup: Math.max(0, Number(opt.scores?.startup || 0)),
            skills: Math.max(0, Number(opt.scores?.skills || 0)),
          },
        };
      });

      question.options = formattedOptions;
    }

    await question.save();

    // Ghi nhật ký kiểm toán Append-only
    await logAuditAction({
      admin: {
        id: admin.id,
        email: admin.email || "",
        name: admin.name || "Admin",
      },
      action: body.isActive !== undefined && Object.keys(body).length === 1 ? "STATUS_CHANGE" : "UPDATE",
      targetCollection: "quiz_questions",
      targetId: question._id.toString(),
      targetTitle: question.question,
      changesBefore: previousState,
      changesAfter: {
        question: question.question,
        category: question.category,
        order: question.order,
        isActive: question.isActive,
        optionsCount: question.options.length,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Cập nhật câu hỏi thành công!",
      question,
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes("không được để trống")) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return handleAuthError(error);
  }
}

/**
 * DELETE /api/admin/quiz/questions/[id]
 * Xóa câu hỏi khỏi CSDL
 */
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdmin();
    const { id } = await params;

    await connectToDatabase();

    const question = await QuizQuestion.findById(id);
    if (!question) {
      return NextResponse.json(
        { error: "Không tìm thấy câu hỏi để xóa." },
        { status: 404 }
      );
    }

    const deletedTitle = question.question;
    await QuizQuestion.findByIdAndDelete(id);

    await logAuditAction({
      admin: {
        id: admin.id,
        email: admin.email || "",
        name: admin.name || "Admin",
      },
      action: "DELETE",
      targetCollection: "quiz_questions",
      targetId: id,
      targetTitle: deletedTitle,
      reason: "Admin deleted quiz question",
    });

    return NextResponse.json({
      success: true,
      message: "Đã xóa câu hỏi thành công!",
    });
  } catch (error) {
    return handleAuthError(error);
  }
}

