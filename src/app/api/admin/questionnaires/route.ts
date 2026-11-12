import { NextResponse } from "next/server";
import { Types } from "mongoose";
import { logAuditAction } from "@/lib/audit";
import {
  ensureDefaultQuestionnaire,
  serializeQuestionnaire,
} from "@/lib/assessment-seed";
import { connectToDatabase } from "@/lib/db";
import { handleAuthError, requireAdmin } from "@/lib/session";
import { AssessmentQuestion } from "@/models/AssessmentQuestion";
import { AssessmentSubmission } from "@/models/AssessmentSubmission";
import { Questionnaire } from "@/models/Questionnaire";
import { questionnaireCreateSchema } from "@/validations/assessment";

/**
 * GET /api/admin/questionnaires
 * PA13: Liệt kê danh sách bộ câu hỏi (chưa bị soft-delete) kèm số lượng câu hỏi & lượt làm bài.
 */
export async function GET(req: Request) {
  try {
    const admin = await requireAdmin(req);
    await connectToDatabase();

    const totalNonDeleted = await Questionnaire.countDocuments({ isDeleted: false });
    if (totalNonDeleted === 0) {
      await ensureDefaultQuestionnaire(admin.id);
    }

    const questionnaires = await Questionnaire.find({ isDeleted: false })
      .sort({ isActive: -1, updatedAt: -1 })
      .lean();

    const ids = questionnaires.map((q) => q._id);
    const [qCounts, subCounts] = await Promise.all([
      AssessmentQuestion.aggregate<{ _id: Types.ObjectId; count: number }>([
        { $match: { questionnaireId: { $in: ids } } },
        { $group: { _id: "$questionnaireId", count: { $sum: 1 } } },
      ]),
      AssessmentSubmission.aggregate<{ _id: Types.ObjectId; count: number }>([
        { $match: { questionnaireId: { $in: ids }, status: "SUBMITTED" } },
        { $group: { _id: "$questionnaireId", count: { $sum: 1 } } },
      ]),
    ]);

    const qCountMap = new Map(qCounts.map((c) => [c._id.toString(), c.count]));
    const subCountMap = new Map(subCounts.map((c) => [c._id.toString(), c.count]));

    return NextResponse.json({
      success: true,
      questionnaires: questionnaires.map((q) =>
        serializeQuestionnaire(q, {
          questionCount: qCountMap.get(q._id.toString()) ?? 0,
          submissionCount: subCountMap.get(q._id.toString()) ?? 0,
        })
      ),
    });
  } catch (error) {
    return handleAuthError(error);
  }
}

/**
 * POST /api/admin/questionnaires
 * PA13: Tạo bộ câu hỏi mới (mặc định isActive = false).
 */
export async function POST(req: Request) {
  try {
    const admin = await requireAdmin(req);
    const body = await req.json();

    const parsed = questionnaireCreateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Dữ liệu bộ câu hỏi không hợp lệ" },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const created = await Questionnaire.create({
      title: parsed.data.title,
      description: parsed.data.description,
      version: 1,
      isActive: false,
      isDeleted: false,
      createdByAdminId: new Types.ObjectId(admin.id),
    });

    await logAuditAction({
      admin,
      action: "CREATE",
      targetCollection: "questionnaires",
      targetId: created._id,
      targetTitle: created.title,
      targetVersion: created.version,
      changesAfter: {
        title: created.title,
        isActive: created.isActive,
      },
      req,
    });

    return NextResponse.json(
      {
        success: true,
        questionnaire: serializeQuestionnaire(created, {
          questionCount: 0,
          submissionCount: 0,
        }),
      },
      { status: 201 }
    );
  } catch (error) {
    return handleAuthError(error);
  }
}

