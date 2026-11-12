import { NextRequest, NextResponse, connection } from "next/server";
import { Types } from "mongoose";
import { TOOL_TYPES } from "@/constants";
import { connectToDatabase } from "@/lib/db";
import { handleAuthError, requireAuth } from "@/lib/session";
import { calculateMbtiResult, validateMbtiAnswers } from "@/lib/tools/mbti";
import { calculateMiResult, validateMiAnswers } from "@/lib/tools/mi";
import { serializeToolResult } from "@/lib/tools/results";
import { ToolResult } from "@/models/ToolResult";
import { createToolResultSchema } from "@/validations";

export async function GET(req: NextRequest) {
  await connection();

  try {
    const user = await requireAuth(req);
    await connectToDatabase();

    const { searchParams } = new URL(req.url);
    const rawType = (searchParams.get("type") || "").trim().toUpperCase();
    const limit = Math.min(
      50,
      Math.max(1, parseInt(searchParams.get("limit") || "20", 10) || 20)
    );

    if (rawType && rawType !== TOOL_TYPES.MBTI && rawType !== TOOL_TYPES.MI) {
      return NextResponse.json(
        { error: "Tham số type chỉ chấp nhận MBTI hoặc MI" },
        { status: 400 }
      );
    }

    const userObjectId = new Types.ObjectId(user.id);
    const query: Record<string, unknown> = { userId: userObjectId };
    if (rawType) {
      query.toolType = rawType;
    }

    const [docs, latestMbtiDoc, latestMiDoc] = await Promise.all([
      ToolResult.find(query).sort({ createdAt: -1 }).limit(limit).lean(),
      ToolResult.findOne({ userId: userObjectId, toolType: TOOL_TYPES.MBTI })
        .sort({ createdAt: -1 })
        .lean(),
      ToolResult.findOne({ userId: userObjectId, toolType: TOOL_TYPES.MI })
        .sort({ createdAt: -1 })
        .lean(),
    ]);

    return NextResponse.json({
      results: docs.map((d) => serializeToolResult(d)),
      latestByType: {
        MBTI: latestMbtiDoc ? serializeToolResult(latestMbtiDoc) : null,
        MI: latestMiDoc ? serializeToolResult(latestMiDoc) : null,
      },
    });
  } catch (error: unknown) {
    if (error instanceof Response) return handleAuthError(error);
    const message =
      error instanceof Error ? error.message : "Không thể tải lịch sử công cụ";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  await connection();

  try {
    const user = await requireAuth(req);
    await connectToDatabase();

    const body = await req.json();
    const parsed = createToolResultSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Dữ liệu lưu kết quả công cụ không hợp lệ",
          details: parsed.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { toolType, answers } = parsed.data;
    const userObjectId = new Types.ObjectId(user.id);

    if (toolType === TOOL_TYPES.MBTI) {
      const check = validateMbtiAnswers(answers);
      if (!check.valid) {
        return NextResponse.json(
          {
            error: `Bài trắc nghiệm MBTI chưa hoàn thành (còn thiếu ${check.missingIds.length} câu hỏi).`,
            missingIds: check.missingIds,
          },
          { status: 400 }
        );
      }

      const computed = calculateMbtiResult(check.normalized);
      const created = await ToolResult.create({
        userId: userObjectId,
        toolType: TOOL_TYPES.MBTI,
        answers: check.normalized,
        resultCode: computed.code,
        scoresBreakdown: {
          axes: computed.axes,
          hasBalancedAxis: computed.hasBalancedAxis,
          nameVi: computed.nameVi,
        },
        summary: computed.summary,
      });

      return NextResponse.json(
        {
          success: true,
          message: "Đã lưu kết quả trắc nghiệm MBTI vào lịch sử tài khoản",
          result: serializeToolResult(created),
        },
        { status: 201 }
      );
    }

    // TOOL_TYPES.MI
    const check = validateMiAnswers(answers);
    if (!check.valid) {
      return NextResponse.json(
        {
          error: `Bài trắc nghiệm MI chưa hoàn thành (còn thiếu ${check.missingIds.length} phát biểu).`,
          missingIds: check.missingIds,
        },
        { status: 400 }
      );
    }

    const computed = calculateMiResult(check.normalized);
    const created = await ToolResult.create({
      userId: userObjectId,
      toolType: TOOL_TYPES.MI,
      answers: check.normalized,
      resultCode: computed.topCode,
      scoresBreakdown: {
        ranked: computed.ranked.map((r) => ({
          category: r.category,
          nameVi: r.nameVi,
          shortLabel: r.shortLabel,
          percentage: r.percentage,
          rawScore: r.rawScore,
          maxScore: r.maxScore,
          rank: r.rank,
        })),
        byCategory: computed.byCategory,
      },
      summary: computed.summary,
    });

    return NextResponse.json(
      {
        success: true,
        message: "Đã lưu kết quả trắc nghiệm MI vào lịch sử tài khoản",
        result: serializeToolResult(created),
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    if (error instanceof Response) return handleAuthError(error);
    const message =
      error instanceof Error ? error.message : "Không thể lưu kết quả công cụ";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

