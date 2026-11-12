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
import { updateOrientationTopicSchema } from "@/validations";

/**
 * PATCH /api/admin/orientation/topics/[id]
 * Cập nhật Topic (tên, slug, chuyển categoryId, mô tả, order, isActive)
 */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdmin(req);
    const { id } = await params;

    if (!Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: "Mã chủ đề không hợp lệ." },
        { status: 400 }
      );
    }

    const body = await req.json();
    const parsed = updateOrientationTopicSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error:
            parsed.error.issues[0]?.message ||
            "Dữ liệu cập nhật chủ đề không hợp lệ.",
        },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const topic = await OrientationTopic.findById(id);
    if (!topic) {
      return NextResponse.json(
        { error: "Không tìm thấy chủ đề." },
        { status: 404 }
      );
    }

    const beforeSnapshot = {
      categoryId: topic.categoryId.toString(),
      name: topic.name,
      slug: topic.slug,
      order: topic.order,
      isActive: topic.isActive,
    };

    let nextCategoryId = topic.categoryId;
    if (
      parsed.data.categoryId &&
      parsed.data.categoryId !== topic.categoryId.toString()
    ) {
      if (!Types.ObjectId.isValid(parsed.data.categoryId)) {
        return NextResponse.json(
          { error: "Mã danh mục cha mới không hợp lệ." },
          { status: 400 }
        );
      }
      const targetCat = await OrientationCategory.findById(
        parsed.data.categoryId
      )
        .select("_id")
        .lean();
      if (!targetCat) {
        return NextResponse.json(
          { error: "Danh mục cha mới không tồn tại." },
          { status: 404 }
        );
      }
      nextCategoryId = targetCat._id;
    }

    const nextSlug =
      parsed.data.slug ||
      (parsed.data.name ? slugifyVietnamese(parsed.data.name) : topic.slug);

    const duplicate = await OrientationTopic.findOne({
      categoryId: nextCategoryId,
      slug: nextSlug,
      _id: { $ne: topic._id },
    })
      .select("_id")
      .lean();

    if (duplicate) {
      return NextResponse.json(
        { error: `Slug chủ đề "${nextSlug}" đã tồn tại trong danh mục này.` },
        { status: 409 }
      );
    }

    const categoryChanged =
      nextCategoryId.toString() !== topic.categoryId.toString();

    topic.categoryId = nextCategoryId;
    topic.slug = nextSlug;
    if (parsed.data.name !== undefined) topic.name = parsed.data.name;
    if (parsed.data.description !== undefined) {
      topic.description = parsed.data.description;
    }
    if (parsed.data.order !== undefined) topic.order = parsed.data.order;
    if (parsed.data.isActive !== undefined) {
      topic.isActive = parsed.data.isActive;
    }

    await topic.save();

    if (categoryChanged) {
      await OrientationArticle.updateMany(
        { topicIds: topic._id, categoryId: { $ne: nextCategoryId } },
        { $pull: { topicIds: topic._id } }
      );
    }

    await logAuditAction({
      admin: { id: admin.id, email: admin.email, name: admin.name },
      action: "UPDATE",
      targetCollection: "orientation_topics",
      targetId: topic._id,
      targetTitle: topic.name,
      changesBefore: beforeSnapshot,
      changesAfter: {
        categoryId: topic.categoryId.toString(),
        name: topic.name,
        slug: topic.slug,
        order: topic.order,
        isActive: topic.isActive,
      },
      req,
    });

    revalidateOrientationRoutes();

    return NextResponse.json({
      success: true,
      topic: {
        ...topic.toObject(),
        _id: topic._id.toString(),
        categoryId: topic.categoryId.toString(),
      },
    });
  } catch (error) {
    return handleAuthError(error);
  }
}

/**
 * DELETE /api/admin/orientation/topics/[id]
 * Xóa Topic và tự động gỡ tham chiếu khỏi topicIds của các bài viết liên quan
 */
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdmin(req);
    const { id } = await params;

    if (!Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: "Mã chủ đề không hợp lệ." },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const topic = await OrientationTopic.findById(id).lean();
    if (!topic) {
      return NextResponse.json(
        { error: "Không tìm thấy chủ đề." },
        { status: 404 }
      );
    }

    const pullResult = await OrientationArticle.updateMany(
      { topicIds: topic._id },
      { $pull: { topicIds: topic._id } }
    );

    await OrientationTopic.deleteOne({ _id: topic._id });

    await logAuditAction({
      admin: { id: admin.id, email: admin.email, name: admin.name },
      action: "DELETE",
      targetCollection: "orientation_topics",
      targetId: topic._id,
      targetTitle: topic.name,
      changesBefore: {
        categoryId: topic.categoryId.toString(),
        name: topic.name,
        slug: topic.slug,
        detachedArticles: pullResult.modifiedCount,
      },
      req,
    });

    revalidateOrientationRoutes();

    return NextResponse.json({
      success: true,
      detachedArticles: pullResult.modifiedCount,
    });
  } catch (error) {
    return handleAuthError(error);
  }
}

