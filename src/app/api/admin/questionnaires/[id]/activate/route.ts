import { NextResponse } from "next/server";
import { Types } from "mongoose";
import { logAuditAction } from "@/lib/audit";
import { serializeQuestionnaire } from "@/lib/assessment-seed";
import { connectToDatabase } from "@/lib/db";
import { runWithOptionalTransaction } from "@/lib/mongo-helpers";
import { handleAuthError, requireAdmin } from "@/lib/session";
import { AssessmentQuestion } from "@/models/AssessmentQuestion";
import { AssessmentSubmission } from "@/models/AssessmentSubmission";
import { Questionnaire } from "@/models/Questionnaire";

/**
 * POST /api/admin/questionnaires/[id]/activate
 * PA16: Kích hoạt hoặc hủy kích hoạt bộ câu hỏi.
 * Khi kích hoạt, tự động tắt tất cả bộ khác (tối đa 1 bộ active) và chặn kích hoạt nếu có 0 câu hỏi.
 */
export async function POST(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdmin(req);
    const { id } = await context.params;

    if (!Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Mã bộ câu hỏi không hợp lệ" }, { status: 400 });
    }

    const body = await req.json().catch(() => ({}));
    const active = typeof body?.active === "boolean" ? body.active : true;

    await connectToDatabase();
    const target = await Questionnaire.findOne({
      _id: new Types.ObjectId(id),
      isDeleted: false,
    });

    if (!target) {
      return NextResponse.json({ error: "Không tìm thấy bộ câu hỏi" }, { status: 404 });
    }

    const [questionCount, submissionCount] = await Promise.all([
      AssessmentQuestion.countDocuments({ questionnaireId: target._id }),
      AssessmentSubmission.countDocuments({
        questionnaireId: target._id,
        status: "SUBMITTED",
      }),
    ]);

    if (active && questionCount === 0) {
      return NextResponse.json(
        {
          error:
            "Không thể kích hoạt bộ câu hỏi chưa có câu hỏi nào. Vui lòng thêm ít nhất 1 câu hỏi trước.",
        },
        { status: 400 }
      );
    }

    const prevActiveDocs = await Questionnaire.find({
      isActive: true,
      _id: { $ne: target._id },
    })
      .select("_id")
      .lean();

    const updated = await runWithOptionalTransaction(
      async (session) => {
        if (active) {
          await Questionnaire.updateMany(
            { isActive: true, _id: { $ne: target._id } },
            { $set: { isActive: false } },
            session ? { session } : undefined
          );
        }

        const doc = await Questionnaire.findByIdAndUpdate(
          target._id,
          { $set: { isActive: active } },
          { returnDocument: "after", ...(session ? { session } : {}) }
        );
        return doc!;
      },
      async () => {
        if (active && prevActiveDocs.length > 0) {
          await Questionnaire.updateMany(
            { _id: { $in: prevActiveDocs.map((d) => d._id) } },
            { $set: { isActive: true } }
          );
        }
      }
    );

    await logAuditAction({
      admin,
      action: "STATUS_CHANGE",
      targetCollection: "questionnaires",
      targetId: updated._id,
      targetTitle: updated.title,
      targetVersion: updated.version,
      changesBefore: { isActive: target.isActive },
      changesAfter: { isActive: updated.isActive },
      req,
    });

    return NextResponse.json({
      success: true,
      questionnaire: serializeQuestionnaire(updated, {
        questionCount,
        submissionCount,
      }),
    });
  } catch (error) {
    return handleAuthError(error);
  }
}

