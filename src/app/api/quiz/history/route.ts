import { NextResponse } from "next/server";
import { requireAuth, handleAuthError } from "@/lib/session";
import { connectToDatabase } from "@/lib/db";
import { QuizResult } from "@/models/QuizResult";

/**
 * GET /api/quiz/history
 * FR-ONB-08: Lấy toàn bộ lịch sử các lần làm trắc nghiệm của sinh viên
 */
export async function GET() {
  try {
    const authUser = await requireAuth();

    await connectToDatabase();
    const history = await QuizResult.find({ studentId: authUser.id })
      .sort({ createdAt: -1 })
      .limit(20);

    return NextResponse.json({
      success: true,
      totalAttempts: history.length,
      history,
    });
  } catch (error) {
    return handleAuthError(error);
  }
}

