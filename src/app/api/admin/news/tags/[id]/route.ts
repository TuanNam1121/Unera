import { NextRequest, NextResponse } from "next/server";
import { Types } from "mongoose";
import { CONTENT_TARGET_COLLECTIONS } from "@/constants";
import { logAuditAction } from "@/lib/audit";
import { connectToDatabase } from "@/lib/db";
import { escapeRegexInput } from "@/lib/orientation-utils";
import { handleAuthError, requireAdmin } from "@/lib/session";
import {
  ensureUniqueNewsTagSlug,
  recalculateNewsTagUsageCounts,
  revalidateNewsRoutes,
  serializeNewsTag,
} from "@/lib/news";
import { updateNewsTagSchema } from "@/validations";
import { NewsTag } from "@/models/NewsTag";
import { NewsArticle } from "@/models/NewsArticle";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdmin(req);
    await connectToDatabase();
    const { id } = await params;

    if (!Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "ID tag không hợp lệ" }, { status: 400 });
    }

    const existing = await NewsTag.findById(id);
    if (!existing) {
      return NextResponse.json(
        { error: "Không tìm thấy tag tin tức" },
        { status: 404 }
      );
    }

    const body = await req.json();
    const parsed = updateNewsTagSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Dữ liệu cập nhật tag không hợp lệ",
          details: parsed.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    // Merge into another tag (NEWS19)
    if (parsed.data.mergeTargetId) {
      if (
        !Types.ObjectId.isValid(parsed.data.mergeTargetId) ||
        parsed.data.mergeTargetId === id
      ) {
        return NextResponse.json(
          { error: "Tag đích cần gộp không hợp lệ" },
          { status: 400 }
        );
      }
      const targetTag = await NewsTag.findById(parsed.data.mergeTargetId);
      if (!targetTag) {
        return NextResponse.json(
          { error: "Không tìm thấy tag đích để gộp" },
          { status: 404 }
        );
      }

      const sourceNameLower = existing.name.trim().toLowerCase();
      const matchingArticles = await NewsArticle.find({
        tags: new RegExp(`^${escapeRegexInput(existing.name)}$`, "i"),
      }).select("_id tags");

      for (const art of matchingArticles) {
        const nextTags = Array.from(
          new Set(
            art.tags.map((t) =>
              t.trim().toLowerCase() === sourceNameLower ? targetTag.name : t
            )
          )
        );
        await NewsArticle.updateOne(
          { _id: art._id },
          { $set: { tags: nextTags } }
        );
      }

      await NewsTag.findByIdAndDelete(existing._id);
      await recalculateNewsTagUsageCounts();
      const refreshedTarget = await NewsTag.findById(targetTag._id).lean();

      await logAuditAction({
        admin,
        action: "UPDATE",
        targetCollection: CONTENT_TARGET_COLLECTIONS.NEWS_ARTICLES,
        targetId: targetTag._id,
        targetTitle: `Gộp tag "${existing.name}" → "${targetTag.name}"`,
        changesBefore: { sourceTag: existing.name },
        changesAfter: { mergedInto: targetTag.name },
        req,
      });

      revalidateNewsRoutes();

      return NextResponse.json({
        success: true,
        merged: true,
        tag: refreshedTarget ? serializeNewsTag(refreshedTarget) : null,
        message: `Đã gộp tag "${existing.name}" vào "${targetTag.name}"`,
      });
    }

    const updates: Record<string, unknown> = {};
    if (parsed.data.name !== undefined) updates.name = parsed.data.name;
    if (parsed.data.isActive !== undefined) {
      updates.isActive = parsed.data.isActive;
    }
    if (parsed.data.slug !== undefined) {
      updates.slug = await ensureUniqueNewsTagSlug(parsed.data.slug, id);
    }

    const updated = await NewsTag.findByIdAndUpdate(
      id,
      { $set: updates },
      { returnDocument: "after" }
    );

    if (
      typeof updates.name === "string" &&
      updates.name !== existing.name
    ) {
      const sourceLower = existing.name.trim().toLowerCase();
      const affected = await NewsArticle.find({
        tags: new RegExp(`^${escapeRegexInput(existing.name)}$`, "i"),
      }).select("_id tags");

      for (const art of affected) {
        const nextTags = Array.from(
          new Set(
            art.tags.map((t) =>
              t.trim().toLowerCase() === sourceLower ? String(updates.name) : t
            )
          )
        );
        await NewsArticle.updateOne(
          { _id: art._id },
          { $set: { tags: nextTags } }
        );
      }
      await recalculateNewsTagUsageCounts();
    }

    await logAuditAction({
      admin,
      action: "UPDATE",
      targetCollection: CONTENT_TARGET_COLLECTIONS.NEWS_ARTICLES,
      targetId: existing._id,
      targetTitle: `Tag tin tức: ${updated?.name || existing.name}`,
      changesBefore: { name: existing.name, isActive: existing.isActive },
      changesAfter: updates,
      req,
    });

    revalidateNewsRoutes();

    const finalTag = await NewsTag.findById(id).lean();

    return NextResponse.json({
      success: true,
      tag: finalTag ? serializeNewsTag(finalTag) : serializeNewsTag(updated!),
      message: "Đã cập nhật tag tin tức",
    });
  } catch (error) {
    return handleAuthError(error);
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdmin(req);
    await connectToDatabase();
    const { id } = await params;

    if (!Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "ID tag không hợp lệ" }, { status: 400 });
    }

    const existing = await NewsTag.findById(id);
    if (!existing) {
      return NextResponse.json(
        { error: "Không tìm thấy tag tin tức" },
        { status: 404 }
      );
    }

    const sourceLower = existing.name.trim().toLowerCase();
    const affected = await NewsArticle.find({
      tags: new RegExp(`^${escapeRegexInput(existing.name)}$`, "i"),
    }).select("_id tags");

    for (const art of affected) {
      const nextTags = art.tags.filter(
        (t) => t.trim().toLowerCase() !== sourceLower
      );
      await NewsArticle.updateOne(
        { _id: art._id },
        { $set: { tags: nextTags } }
      );
    }

    await NewsTag.findByIdAndDelete(existing._id);

    await logAuditAction({
      admin,
      action: "DELETE",
      targetCollection: CONTENT_TARGET_COLLECTIONS.NEWS_ARTICLES,
      targetId: existing._id,
      targetTitle: `Tag tin tức: ${existing.name}`,
      changesBefore: { name: existing.name, removedFromArticles: affected.length },
      req,
    });

    revalidateNewsRoutes();

    return NextResponse.json({
      success: true,
      message: `Đã xóa tag "${existing.name}"`,
    });
  } catch (error) {
    return handleAuthError(error);
  }
}

