import { NextResponse } from "next/server";
import { logAuditAction } from "@/lib/audit";
import { connectToDatabase } from "@/lib/db";
import { revalidateOrientationRoutes } from "@/lib/orientation";
import { slugifyVietnamese } from "@/lib/orientation-utils";
import { handleAuthError, requireAdmin } from "@/lib/session";
import { OrientationArticle } from "@/models/OrientationArticle";
import { OrientationCategory } from "@/models/OrientationCategory";
import { OrientationTopic } from "@/models/OrientationTopic";
import { adminOrientationCategorySchema } from "@/validations";

/**
 * GET /api/admin/orientation/categories
 * Danh sách toàn bộ Category kèm số lượng Topic và Bài viết
 */
export async function GET(req: Request) {
  try {
    await requireAdmin(req);
    await connectToDatabase();

    const [categories, topicCounts, articleCounts] = await Promise.all([
      OrientationCategory.find({})
        .sort({ order: 1, createdAt: 1 })
        .lean(),
      OrientationTopic.aggregate([
        { $group: { _id: "$categoryId", count: { $sum: 1 } } },
      ]),
      OrientationArticle.aggregate([
        { $group: { _id: "$categoryId", count: { $sum: 1 } } },
      ]),
    ]);

    const topicCountMap = new Map<string, number>(
      topicCounts.map((item) => [String(item._id), item.count])
    );
    const articleCountMap = new Map<string, number>(
      articleCounts.map((item) => [String(item._id), item.count])
    );

    return NextResponse.json({
      success: true,
      categories: categories.map((cat) => {
        const id = cat._id.toString();
        return {
          ...cat,
          _id: id,
          topicCount: topicCountMap.get(id) || 0,
          articleCount: articleCountMap.get(id) || 0,
        };
      }),
    });
  } catch (error) {
    return handleAuthError(error);
  }
}

/**
 * POST /api/admin/orientation/categories
 * Tạo Category mới (hiển thị cấp 1 ở Sidebar Khám phá định hướng)
 */
export async function POST(req: Request) {
  try {
    const admin = await requireAdmin(req);
    const body = await req.json();
    const parsed = adminOrientationCategorySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error:
            parsed.error.issues[0]?.message ||
            "Dữ liệu danh mục không hợp lệ.",
        },
        { status: 400 }
      );
    }

    const { name, description, icon, order, isActive } = parsed.data;
    const finalSlug =
      parsed.data.slug || slugifyVietnamese(name) || `danh-muc-${Date.now()}`;

    await connectToDatabase();

    const duplicate = await OrientationCategory.findOne({ slug: finalSlug })
      .select("_id")
      .lean();
    if (duplicate) {
      return NextResponse.json(
        { error: `Slug danh mục "${finalSlug}" đã tồn tại.` },
        { status: 409 }
      );
    }

    let finalOrder = order;
    if (body.order === undefined || body.order === null) {
      const highest = await OrientationCategory.findOne({})
        .sort({ order: -1 })
        .select("order")
        .lean();
      finalOrder = highest ? highest.order + 1 : 0;
    }

    const created = await OrientationCategory.create({
      name,
      slug: finalSlug,
      description: description || "",
      icon: icon || "Compass",
      order: finalOrder,
      isActive,
    });

    await logAuditAction({
      admin: { id: admin.id, email: admin.email, name: admin.name },
      action: "CREATE",
      targetCollection: "orientation_categories",
      targetId: created._id,
      targetTitle: created.name,
      changesAfter: {
        name: created.name,
        slug: created.slug,
        order: created.order,
        isActive: created.isActive,
      },
      req,
    });

    revalidateOrientationRoutes();

    return NextResponse.json(
      {
        success: true,
        category: {
          ...created.toObject(),
          _id: created._id.toString(),
          topicCount: 0,
          articleCount: 0,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    return handleAuthError(error);
  }
}

