import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { buildRateLimitResponse, checkRateLimit } from "@/lib/rate-limit";
import { generatePersonalizedRoadmap } from "@/lib/roadmap-service";
import { handleAuthError, requireAuth } from "@/lib/session";
import { regenerateRoadmapSchema } from "@/validations/roadmap";

export const maxDuration = 60;

/**
 * POST /api/roadmap/generate
 * RM01, RM12: Sinh hoặc Tái tạo Lộ trình 4 năm bằng Google Gemini AI.
 * Nếu Gemini lỗi/timeout -> Bắt buộc giữ nguyên lộ trình ACTIVE hiện có.
 */
export async function POST(req: Request) {
  try {
    const authUser = await requireAuth(req);
    const rate = checkRateLimit(`ai:roadmap:${authUser.id}`, 10, 10 * 60_000);
    if (!rate.allowed) {
      return buildRateLimitResponse(
        rate.retryAfterSeconds,
        "Bạn đã yêu cầu tạo lộ trình AI quá nhiều lần. Vui lòng thử lại sau ít phút."
      );
    }
    const body = await req.json().catch(() => ({}));

    const parsed = regenerateRoadmapSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Thông tin yêu cầu không hợp lệ" },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const outcome = await generatePersonalizedRoadmap({
      studentId: authUser.id,
      analysisId: parsed.data.analysisId,
      targetDirection: parsed.data.targetDirection,
      notes: parsed.data.notes,
    });

    if (!outcome.ok || !outcome.roadmap) {
      return NextResponse.json(
        {
          success: false,
          error:
            outcome.errorMessage ||
            "Không thể sinh lộ trình AI lúc này. Lộ trình hiện tại của bạn vẫn được giữ nguyên.",
        },
        { status: 502 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Đã kiến tạo thành công lộ trình v${outcome.roadmap.version}!`,
      roadmap: outcome.roadmap,
    });
  } catch (error) {
    return handleAuthError(error);
  }
}

