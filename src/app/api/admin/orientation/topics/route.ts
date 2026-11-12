import { NextResponse } from "next/server";
import { Types } from "mongoose";
import { logAuditAction } from "@/lib/audit";
import { connectToDatabase } from "@/lib/db";
import { revalidateOrientationRoutes } from "@/lib/orientation";
import { slugifyVietnamese } from "@/lib/orientation-utils";
import { handleAuthError, requireAdmin } from "@/lib/session";
import { OrientationArticle } from "@/models/OrientationArticle";
import { OrientationCategory } from "@/models/OrientationCategory";
import { OrientationTopic } from "@/models/OrientationTopic";
import { adminOrientationTopicSchema } from "@/validations";

/**
 * GET /api/admin/orientation/topics
 * Danh sách Chủ đề / Danh mục con (có thể lọc theo ?categoryId=...)
 */
export async function GET(req: Request) {
  try {
    await requireAdmin(req);
    const { searchParams } = new URL(req.url);
    const categoryId = searchParams.get("categoryId")?.trim();

    await connectToDatabase();

    const filter: Record<string, unknown> = {};
    if (categoryId && categoryId !== "ALL") {
      if (!Types.ObjectId.isValid(categoryId)) {
        return NextResponse.json(
          { error: "Mã danh mục cha không hợp lệ." },
          { status: 400 }
        );
      }
      filter.categoryId = new Types.ObjectId(categoryId);
    }

    const [topics, articleCounts] = await Promise.all([
      OrientationTopic.find(filter)
        .populate("categoryId", "name slug")
        .sort({ order: 1, createdAt: 1 })
        .lean(),
      OrientationArticle.aggregate([
        { $unwind: "$topicIds" },
        { $group: { _id: "$topicIds", count: { $sum: 1 } } },
      ]),
    ]);

    const articleCountMap = new Map<string, number>(
      articleCounts.map((item) => [String(item._id), item.count])
    );

    return NextResponse.json({
      success: true,
      topics: topics.map((t) => {
        const id = t._id.toString();
        const rawCategory = t.categoryId as unknown as
          | { _id: Types.ObjectId; name: string; slug: string }
          | Types.ObjectId
          | null;
        const parentCat =
          rawCategory &&
          typeof rawCategory === "object" &&
          "name" in rawCategory
            ? {
                _id: rawCategory._id.toString(),
                name: rawCategory.name,
                slug: rawCategory.slug,
              }
            : null;

        return {
          ...t,
          _id: id,
          categoryId: parentCat ? parentCat._id : String(t.categoryId),
          category: parentCat,
          articleCount: articleCountMap.get(id) || 0,
        };
      }),
    });
  } catch (error) {
    return handleAuthError(error);
  }
}

/**
 * POST /api/admin/orientation/topics
 * Tạo Topic/Tag con thuộc một Category cha
 */
export async function POST(req: Request) {
  try {
    const admin = await requireAdmin(req);
    const body = await req.json();
    const parsed = adminOrientationTopicSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error:
            parsed.error.issues[0]?.message || "Dữ liệu chủ đề không hợp lệ.",
        },
        { status: 400 }
      );
    }

    const { categoryId, name, description, order, isActive } = parsed.data;
    if (!Types.ObjectId.isValid(categoryId)) {
      return NextResponse.json(
        { error: "Mã danh mục cha không hợp lệ." },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const parentCategory = await OrientationCategory.findById(categoryId)
      .select("_id name slug")
      .lean();

    if (!parentCategory) {
      return NextResponse.json(
        { error: "Danh mục cha không tồn tại." },
        { status: 404 }
      );
    }

    const finalSlug =
      parsed.data.slug || slugifyVietnamese(name) || `chu-de-${Date.now()}`;

    const duplicate = await OrientationTopic.findOne({
      categoryId: parentCategory._id,
      slug: finalSlug,
    })
      .select("_id")
      .lean();

    if (duplicate) {
      return NextResponse.json(
        {
          error: `Chủ đề với slug "${finalSlug}" đã tồn tại trong danh mục "${parentCategory.name}".`,
        },
        { status: 409 }
      );
    }

    let finalOrder = order;
    if (body.order === undefined || body.order === null) {
      const highest = await OrientationTopic.findOne({
        categoryId: parentCategory._id,
      })
        .sort({ order: -1 })
        .select("order")
        .lean();
      finalOrder = highest ? highest.order + 1 : 0;
    }

    const created = await OrientationTopic.create({
      categoryId: parentCategory._id,
      name,
      slug: finalSlug,
      description: description || "",
      order: finalOrder,
      isActive,
    });

    await logAuditAction({
      admin: { id: admin.id, email: admin.email, name: admin.name },
      action: "CREATE",
      targetCollection: "orientation_topics",
      targetId: created._id,
      targetTitle: created.name,
      changesAfter: {
        categoryId: parentCategory._id.toString(),
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
        topic: {
          ...created.toObject(),
          _id: created._id.toString(),
          categoryId: parentCategory._id.toString(),
          category: {
            _id: parentCategory._id.toString(),
            name: parentCategory.name,
            slug: parentCategory.slug,
          },
          articleCount: 0,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    return handleAuthError(error);
  }
}
