import { NextResponse } from "next/server";
import { requireAdmin, handleAuthError } from "@/lib/session";
import { connectToDatabase } from "@/lib/db";
import { QuizQuestion } from "@/models/QuizQuestion";
import { logAuditAction } from "@/lib/audit";

/**
 * GET /api/admin/quiz/questions
 * Lấy danh sách toàn bộ câu hỏi trắc nghiệm kèm chi tiết options và bảng điểm
 */
export async function GET() {
  try {
    await requireAdmin();
    await connectToDatabase();

    const questions = await QuizQuestion.find({}).sort({ order: 1, createdAt: 1 }).lean();

    return NextResponse.json({
      success: true,
      total: questions.length,
      questions,
    });
  } catch (error) {
    return handleAuthError(error);
  }
}

/**
 * POST /api/admin/quiz/questions
 * Thêm câu hỏi mới kèm danh sách phương án lựa chọn và trọng số điểm (FR-ONB-10, FR-ONB-11)
 */
export async function POST(req: Request) {
  try {
    const admin = await requireAdmin();
    const body = await req.json();
    const { question, category, order, isActive, options } = body;

    if (!question || typeof question !== "string" || !question.trim()) {
      return NextResponse.json(
        { error: "Vui lòng nhập nội dung câu hỏi khảo sát." },
        { status: 400 }
      );
    }

    if (!Array.isArray(options) || options.length < 2) {
      return NextResponse.json(
        { error: "Mỗi câu hỏi cần có tối thiểu 2 phương án lựa chọn." },
        { status: 400 }
      );
    }

    // Chuẩn hóa và kiểm tra từng phương án
    const formattedOptions = options.map((opt, idx) => {
      const optText = typeof opt.text === "string" ? opt.text.trim() : "";
      if (!optText) {
        throw new Error(`Phương án lựa chọn thứ ${idx + 1} không được để trống nội dung.`);
      }

      return {
        id: opt.id && typeof opt.id === "string" ? opt.id : `opt_${Date.now()}_${idx + 1}`,
        text: optText,
        scores: {
          study_abroad: Number(opt.scores?.study_abroad || 0),
          employment: Number(opt.scores?.employment || 0),
          research: Number(opt.scores?.research || 0),
          startup: Number(opt.scores?.startup || 0),
          skills: Number(opt.scores?.skills || 0),
        },
      };
    });

    await connectToDatabase();

    // Xác định số thứ tự tiếp theo nếu không nhập
    let nextOrder = Number(order);
    if (isNaN(nextOrder) || nextOrder <= 0) {
      const highest = await QuizQuestion.findOne({}).sort({ order: -1 }).select("order");
      nextOrder = (highest?.order || 0) + 1;
    }

    const newQuestion = new QuizQuestion({
      question: question.trim(),
      category: category ? category.trim().toUpperCase() : "GENERAL",
      order: nextOrder,
      isActive: isActive !== undefined ? Boolean(isActive) : true,
      options: formattedOptions,
    });

    await newQuestion.save();

    // Ghi nhật ký kiểm toán Append-only (FR-AUD-01)
    await logAuditAction({
      admin: {
        id: admin.id,
        email: admin.email || "",
        name: admin.name || "Admin",
      },
      action: "CREATE",
      targetCollection: "quiz_questions",
      targetId: newQuestion._id.toString(),
      targetTitle: newQuestion.question,
      changesAfter: {
        question: newQuestion.question,
        category: newQuestion.category,
        order: newQuestion.order,
        optionsCount: newQuestion.options.length,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Tạo câu hỏi trắc nghiệm mới thành công!",
      question: newQuestion,
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes("không được để trống")) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return handleAuthError(error);
  }
}
