import crypto from "crypto";
import { NextResponse } from "next/server";
import { Types } from "mongoose";
import { AI_ANALYSIS_STATUS } from "@/constants";
import { connectToDatabase } from "@/lib/db";
import { handleAuthError, requireAuth } from "@/lib/session";
import { AiOrientationAnalysis } from "@/models/AiOrientationAnalysis";
import { customCareerOptionSchema } from "@/validations/roadmap";

const MAX_CUSTOM_CAREER_OPTIONS = 15;

export const maxDuration = 60;

/**
 * POST /api/ai/orientation/custom-career
 * Cho phép sinh viên tự thêm định hướng nghề nghiệp / vai trò mục tiêu riêng trên kết quả phân tích
 * để AI sinh lộ trình 4 năm bám sát định hướng đó.
 */
export async function POST(req: Request) {
  try {
    const authUser = await requireAuth(req);
    const body = await req.json();

    const parsed = customCareerOptionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Dữ liệu định hướng không hợp lệ." },
        { status: 400 }
      );
    }

    const { analysisId, title, reason } = parsed.data;
    if (!Types.ObjectId.isValid(analysisId)) {
      return NextResponse.json({ error: "Mã phân tích AI không hợp lệ." }, { status: 400 });
    }

    await connectToDatabase();

    const analysis = await AiOrientationAnalysis.findOne({
      _id: new Types.ObjectId(analysisId),
      studentId: new Types.ObjectId(authUser.id),
      status: AI_ANALYSIS_STATUS.COMPLETED,
    });

    if (!analysis) {
      return NextResponse.json(
        { error: "Không tìm thấy kết quả phân tích định hướng AI." },
        { status: 404 }
      );
    }

    const existing = Array.isArray(analysis.customCareerOptions)
      ? analysis.customCareerOptions
      : [];

    if (
      existing.some(
        (item) => item.title.trim().toLowerCase() === title.trim().toLowerCase()
      )
    ) {
      return NextResponse.json(
        { error: "Định hướng nghề nghiệp này đã có trong danh sách của bạn." },
        { status: 409 }
      );
    }

    if (existing.length >= MAX_CUSTOM_CAREER_OPTIONS) {
      return NextResponse.json(
        {
          error: `Bạn chỉ có thể thêm tối đa ${MAX_CUSTOM_CAREER_OPTIONS} định hướng tự chọn cho mỗi lần phân tích.`,
        },
        { status: 400 }
      );
    }

    const newOption = {
      id: crypto.randomUUID(),
      title: title.trim(),
      reason: reason?.trim() || "",
      createdAt: new Date().toISOString(),
    };

    analysis.customCareerOptions = [...existing, newOption];
    await analysis.save();

    return NextResponse.json(
      {
        success: true,
        option: newOption,
        customCareerOptions: analysis.customCareerOptions,
      },
      { status: 201 }
    );
  } catch (error) {
    return handleAuthError(error);
  }
}

/**
 * DELETE /api/ai/orientation/custom-career?analysisId=...&optionId=...
 * Xóa một định hướng nghề nghiệp tự thêm của sinh viên.
 */
export async function DELETE(req: Request) {
  try {
    const authUser = await requireAuth(req);
    const { searchParams } = new URL(req.url);
    const analysisId = searchParams.get("analysisId")?.trim() || "";
    const optionId = searchParams.get("optionId")?.trim() || "";

    if (!Types.ObjectId.isValid(analysisId) || !optionId) {
      return NextResponse.json(
        { error: "Thiếu mã phân tích hoặc mã định hướng cần xóa." },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const analysis = await AiOrientationAnalysis.findOne({
      _id: new Types.ObjectId(analysisId),
      studentId: new Types.ObjectId(authUser.id),
    });

    if (!analysis) {
      return NextResponse.json(
        { error: "Không tìm thấy kết quả phân tích định hướng AI." },
        { status: 404 }
      );
    }

    const existing = Array.isArray(analysis.customCareerOptions)
      ? analysis.customCareerOptions
      : [];
    analysis.customCareerOptions = existing.filter((item) => item.id !== optionId);
    await analysis.save();

    return NextResponse.json({
      success: true,
      customCareerOptions: analysis.customCareerOptions,
    });
  } catch (error) {
    return handleAuthError(error);
  }
}

