import { NextResponse } from "next/server";
import { requireAuth, handleAuthError } from "@/lib/session";
import { connectToDatabase } from "@/lib/db";
import { QuizResult } from "@/models/QuizResult";

/**
 * GET /api/quiz/latest
 * Lấy kết quả trắc nghiệm gần nhất của sinh viên
 */
export async function GET() {
  try {
    const authUser = await requireAuth();

    await connectToDatabase();
    const latest = await QuizResult.findOne({ studentId: authUser.id }).sort({
      createdAt: -1,
    });

    return NextResponse.json({
      success: true,
      hasResult: !!latest,
      result: latest || null,
    });
  } catch (error) {
    return handleAuthError(error);
  }
}

