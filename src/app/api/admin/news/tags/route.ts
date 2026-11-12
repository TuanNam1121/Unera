import { NextRequest, NextResponse } from "next/server";
import { CONTENT_TARGET_COLLECTIONS } from "@/constants";
import { logAuditAction } from "@/lib/audit";
import { connectToDatabase } from "@/lib/db";
import { handleAuthError, requireAdmin } from "@/lib/session";
import {
  ensureUniqueNewsTagSlug,
  recalculateNewsTagUsageCounts,
  revalidateNewsRoutes,
  serializeNewsTag,
} from "@/lib/news";
import { adminNewsTagSchema } from "@/validations";
import { NewsTag } from "@/models/NewsTag";

export async function GET(req: NextRequest) {
  try {
    await requireAdmin(req);
    await connectToDatabase();
    await recalculateNewsTagUsageCounts();

    const tags = await NewsTag.find().sort({ usageCount: -1, name: 1 }).lean();
    return NextResponse.json({
      success: true,
      tags: tags.map((t) => serializeNewsTag(t)),
    });
  } catch (error) {
    return handleAuthError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdmin(req);
    await connectToDatabase();

    const body = await req.json();
    const parsed = adminNewsTagSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Dữ liệu tag không hợp lệ",
          details: parsed.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { name, slug, isActive } = parsed.data;
    const finalSlug = await ensureUniqueNewsTagSlug(slug || name);
    const dupName = await NewsTag.findOne({
      name: new RegExp(`^${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i"),
    });
    if (dupName) {
      return NextResponse.json(
        { error: `Tag "${dupName.name}" đã tồn tại trong hệ thống` },
        { status: 409 }
      );
    }

    const created = await NewsTag.create({
      name,
      slug: finalSlug,
      usageCount: 0,
      isActive,
    });

    await logAuditAction({
      admin,
      action: "CREATE",
      targetCollection: CONTENT_TARGET_COLLECTIONS.NEWS_ARTICLES,
      targetId: created._id,
      targetTitle: `Tag tin tức: ${created.name}`,
      changesAfter: { name: created.name, slug: created.slug },
      req,
    });

    revalidateNewsRoutes();

    return NextResponse.json(
      {
        success: true,
        tag: serializeNewsTag(created),
        message: `Đã tạo tag "${created.name}"`,
      },
      { status: 201 }
    );
  } catch (error) {
    return handleAuthError(error);
  }
}

