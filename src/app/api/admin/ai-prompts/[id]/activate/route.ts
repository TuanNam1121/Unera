import { NextResponse } from "next/server";
import { Types } from "mongoose";
import { logAuditAction } from "@/lib/audit";
import { connectToDatabase } from "@/lib/db";
import { runWithOptionalTransaction } from "@/lib/mongo-helpers";
import { serializeSystemPrompt } from "@/lib/orientation-ai";
import { handleAuthError, requireAdmin } from "@/lib/session";
import { SystemPrompt } from "@/models/SystemPrompt";

/**
 * PATCH /api/admin/ai-prompts/[id]/activate
 * AI03: Kích hoạt phiên bản System Prompt được chọn và tắt phiên bản active cũ cùng key.
 */
export async function PATCH(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdmin(req);
    const { id } = await context.params;

    if (!Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: "Mã System Prompt không hợp lệ." },
        { status: 400 }
      );
    }

    await connectToDatabase();
    const target = await SystemPrompt.findById(id);
    if (!target) {
      return NextResponse.json(
        { error: "Không tìm thấy phiên bản System Prompt." },
        { status: 404 }
      );
    }

    const prevActive = await SystemPrompt.findOne({
      key: target.key,
      isActive: true,
      _id: { $ne: target._id },
    })
      .select("_id version")
      .lean();

    const updated = await runWithOptionalTransaction(
      async (session) => {
        await SystemPrompt.updateMany(
          { key: target.key, isActive: true, _id: { $ne: target._id } },
          { $set: { isActive: false } },
          session ? { session } : undefined
        );

        const doc = await SystemPrompt.findByIdAndUpdate(
          target._id,
          {
            $set: {
              isActive: true,
              updatedByAdminId: new Types.ObjectId(admin.id),
            },
          },
          { returnDocument: "after", ...(session ? { session } : {}) }
        );
        return doc!;
      },
      async () => {
        if (prevActive?._id) {
          await SystemPrompt.updateOne(
            { _id: prevActive._id },
            { $set: { isActive: true } }
          );
        }
      }
    );

    await logAuditAction({
      admin,
      action: "STATUS_CHANGE",
      targetCollection: "system_prompts",
      targetId: updated._id,
      targetTitle: `${updated.key} v${updated.version} - ${updated.name}`,
      targetVersion: updated.version,
      changesBefore: {
        activeVersion: prevActive?.version ?? null,
      },
      changesAfter: {
        activeVersion: updated.version,
        isActive: true,
      },
      req,
    });

    return NextResponse.json({
      success: true,
      prompt: serializeSystemPrompt(updated),
    });
  } catch (error) {
    return handleAuthError(error);
  }
}

