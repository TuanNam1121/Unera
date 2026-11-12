import { Types } from "mongoose";
import { TOOL_TYPES, type ToolType } from "@/constants";
import { MBTI_QUESTIONS } from "@/constants/mbti";
import { MI_QUESTIONS } from "@/constants/mi";
import { calculateMbtiResult } from "@/lib/tools/mbti";
import { calculateMiResult } from "@/lib/tools/mi";
import { ToolResult, type IToolResultDocument } from "@/models/ToolResult";
import type { IToolResultDTO } from "@/types";

type RawToolResultDoc = {
  _id: Types.ObjectId | string;
  userId: Types.ObjectId | string;
  toolType: ToolType;
  answers?: Record<string, string | number>;
  resultCode: string;
  scoresBreakdown?: Record<string, unknown>;
  summary: string;
  createdAt?: Date | string;
};

export function serializeToolResult(
  doc: RawToolResultDoc | IToolResultDocument
): IToolResultDTO {
  return {
    _id: doc._id.toString(),
    userId: doc.userId.toString(),
    toolType: doc.toolType,
    answers: doc.answers || {},
    resultCode: doc.resultCode,
    scoresBreakdown: doc.scoresBreakdown || {},
    summary: doc.summary,
    createdAt: doc.createdAt
      ? new Date(doc.createdAt).toISOString()
      : new Date().toISOString(),
  };
}

/**
 * Khởi tạo dữ liệu kết quả MBTI & MI mẫu cho tài khoản sinh viên demo trong /api/seed
 */
export async function seedDefaultToolResults(studentUserId: Types.ObjectId) {
  // Tạo mẫu MBTI nghiêng về INTJ (I, N, T, J)
  const sampleMbtiAnswers: Record<string, "A" | "B"> = {};
  for (const q of MBTI_QUESTIONS) {
    const preferPole =
      q.axis === "EI"
        ? "I"
        : q.axis === "SN"
          ? "N"
          : q.axis === "TF"
            ? "T"
            : "J";
    sampleMbtiAnswers[q.id] = q.optionA.pole === preferPole ? "A" : "B";
  }
  const mbtiComputed = calculateMbtiResult(sampleMbtiAnswers);

  // Tạo mẫu MI với điểm nổi bật Ngôn ngữ & Logic-Toán học & Tương tác
  const sampleMiAnswers: Record<string, number> = {};
  for (const q of MI_QUESTIONS) {
    if (q.category === "LINGUISTIC") sampleMiAnswers[q.id] = 5;
    else if (q.category === "LOGICAL_MATHEMATICAL") sampleMiAnswers[q.id] = 4;
    else if (q.category === "INTERPERSONAL") sampleMiAnswers[q.id] = 4;
    else sampleMiAnswers[q.id] = 3;
  }
  const miComputed = calculateMiResult(sampleMiAnswers);

  const docs = await ToolResult.insertMany([
    {
      userId: studentUserId,
      toolType: TOOL_TYPES.MBTI,
      answers: sampleMbtiAnswers,
      resultCode: mbtiComputed.code,
      scoresBreakdown: {
        axes: mbtiComputed.axes,
        hasBalancedAxis: mbtiComputed.hasBalancedAxis,
        nameVi: mbtiComputed.nameVi,
      },
      summary: mbtiComputed.summary,
    },
    {
      userId: studentUserId,
      toolType: TOOL_TYPES.MI,
      answers: sampleMiAnswers,
      resultCode: miComputed.topCode,
      scoresBreakdown: {
        ranked: miComputed.ranked.map((r) => ({
          category: r.category,
          nameVi: r.nameVi,
          shortLabel: r.shortLabel,
          percentage: r.percentage,
          rawScore: r.rawScore,
          maxScore: r.maxScore,
          rank: r.rank,
        })),
        byCategory: miComputed.byCategory,
      },
      summary: miComputed.summary,
    },
  ]);

  return { toolResultsCount: docs.length };
}

