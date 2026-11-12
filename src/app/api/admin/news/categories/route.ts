import { NextRequest, NextResponse } from "next/server";
import { CONTENT_TARGET_COLLECTIONS } from "@/constants";
import { logAuditAction } from "@/lib/audit";
import { connectToDatabase } from "@/lib/db";
import { handleAuthError, requireAdmin } from "@/lib/session";
import {
  ensureUniqueNewsCategorySlug,
  revalidateNewsRoutes,
  serializeNewsCategory,
} from "@/lib/news";
import {
  adminNewsCategorySchema,
  reorderNewsCategoriesSchema,
} from "@/validations";
import { NewsCategory } from "@/models/NewsCategory";
import { NewsArticle } from "@/models/NewsArticle";

export async function GET(req: NextRequest) {
  try {
    await requireAdmin(req);
    await connectToDatabase();

    const [categories, counts] = await Promise.all([
      NewsCategory.find().sort({ order: 1, name: 1 }).lean(),
      NewsArticle.aggregate<{ _id: string; count: number }>([
        { $group: { _id: { $toString: "$categoryId" }, count: { $sum: 1 } } },
      ]),
    ]);

    const countMap = new Map(counts.map((c) => [c._id, c.count]));
    return NextResponse.json({
      success: true,
      categories: categories.map((cat) =>
        serializeNewsCategory(cat, countMap.get(cat._id.toString()) || 0)
      ),
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
    const parsed = adminNewsCategorySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Dữ liệu danh mục tin tức không hợp lệ",
          details: parsed.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const {
      name,
      slug,
      description,
      colorToken,
      order,
      isActive,
      showInSidebar,
    } = parsed.data;
    const finalSlug = await ensureUniqueNewsCategorySlug(slug || name);

    const created = await NewsCategory.create({
      name,
      slug: finalSlug,
      description: description || "",
      colorToken: colorToken || "blue",
      order,
      isActive,
      showInSidebar,
    });

    await logAuditAction({
      admin,
      action: "CREATE",
      targetCollection: CONTENT_TARGET_COLLECTIONS.NEWS_ARTICLES,
      targetId: created._id,
      targetTitle: `Danh mục tin tức: ${created.name}`,
      changesAfter: {
        name: created.name,
        slug: created.slug,
        showInSidebar: created.showInSidebar !== false,
      },
      req,
    });

    revalidateNewsRoutes();

    return NextResponse.json(
      {
        success: true,
        category: serializeNewsCategory(created, 0),
        message: "Đã tạo danh mục tin tức mới",
      },
      { status: 201 }
    );
  } catch (error) {
    return handleAuthError(error);
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const admin = await requireAdmin(req);
    await connectToDatabase();

    const body = await req.json();
    const parsed = reorderNewsCategoriesSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Danh sách sắp xếp không hợp lệ" },
        { status: 400 }
      );
    }

    await NewsCategory.bulkWrite(
      parsed.data.orderedIds.map((id, idx) => ({
        updateOne: {
          filter: { _id: id },
          update: { $set: { order: idx + 1 } },
        },
      }))
    );

    await logAuditAction({
      admin,
      action: "UPDATE",
      targetCollection: CONTENT_TARGET_COLLECTIONS.NEWS_ARTICLES,
      targetId: parsed.data.orderedIds[0],
      targetTitle: "Sắp xếp thứ tự danh mục tin tức",
      req,
    });

    revalidateNewsRoutes();

    return NextResponse.json({
      success: true,
      message: "Đã cập nhật thứ tự danh mục tin tức",
    });
  } catch (error) {
    return handleAuthError(error);
  }
}

