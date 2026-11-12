import { NextResponse } from "next/server";
import { Types } from "mongoose";
import { logAuditAction } from "@/lib/audit";
import { connectToDatabase } from "@/lib/db";
import { runWithOptionalTransaction } from "@/lib/mongo-helpers";
import {
  ensureDefaultSystemPrompts,
  serializeSystemPrompt,
} from "@/lib/orientation-ai";
import { handleAuthError, requireAdmin } from "@/lib/session";
import { SystemPrompt } from "@/models/SystemPrompt";
import { systemPromptCreateSchema } from "@/validations/assessment";

/**
 * GET /api/admin/ai-prompts
 * AI03: Liệt kê các phiên bản System Prompt của Gemini (ORIENTATION_ANALYSIS, ROADMAP_GENERATION).
 */
export async function GET(req: Request) {
  try {
    const admin = await requireAdmin(req);
    await connectToDatabase();
    await ensureDefaultSystemPrompts(admin.id);

    const { searchParams } = new URL(req.url);
    const keyFilter = searchParams.get("key")?.trim();

    const query: Record<string, unknown> = {};
    if (
      keyFilter === "ORIENTATION_ANALYSIS" ||
      keyFilter === "ROADMAP_GENERATION"
    ) {
      query.key = keyFilter;
    }

    const prompts = await SystemPrompt.find(query)
      .sort({ key: 1, version: -1 })
      .lean();

    return NextResponse.json({
      success: true,
      prompts: prompts.map(serializeSystemPrompt),
    });
  } catch (error) {
    return handleAuthError(error);
  }
}

/**
 * POST /api/admin/ai-prompts
 * AI03: Tạo phiên bản System Prompt mới (version++), có thể kích hoạt ngay.
 */
export async function POST(req: Request) {
  try {
    const admin = await requireAdmin(req);
    const body = await req.json();

    const parsed = systemPromptCreateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Dữ liệu prompt không hợp lệ" },
        { status: 400 }
      );
    }

    await connectToDatabase();
    await ensureDefaultSystemPrompts(admin.id);

    const { key, name, promptContent, modelName, temperature, activateImmediately } =
      parsed.data;

    const latestForKey = await SystemPrompt.findOne({ key })
      .sort({ version: -1 })
      .lean();
    const nextVersion = (latestForKey?.version ?? 0) + 1;

    const prevActive = await SystemPrompt.findOne({ key, isActive: true })
      .select("_id")
      .lean();

    const created = await runWithOptionalTransaction(
      async (session) => {
        if (activateImmediately) {
          await SystemPrompt.updateMany(
            { key, isActive: true },
            { $set: { isActive: false } },
            session ? { session } : undefined
          );
        }

        const docs = await SystemPrompt.create(
          [
            {
              key,
              name,
              promptContent,
              modelName,
              temperature,
              version: nextVersion,
              isActive: Boolean(activateImmediately),
              updatedByAdminId: new Types.ObjectId(admin.id),
            },
          ],
          session ? { session } : undefined
        );
        return docs[0];
      },
      async () => {
        if (activateImmediately && prevActive?._id) {
          await SystemPrompt.updateOne(
            { _id: prevActive._id },
            { $set: { isActive: true } }
          );
        }
      }
    );

    await logAuditAction({
      admin,
      action: "CREATE",
      targetCollection: "system_prompts",
      targetId: created._id,
      targetTitle: `${created.key} v${created.version} - ${created.name}`,
      targetVersion: created.version,
      changesAfter: {
        key: created.key,
        modelName: created.modelName,
        temperature: created.temperature,
        isActive: created.isActive,
      },
      req,
    });

    return NextResponse.json(
      {
        success: true,
        prompt: serializeSystemPrompt(created),
      },
      { status: 201 }
    );
  } catch (error) {
    return handleAuthError(error);
  }
}

