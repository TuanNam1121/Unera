import { NextResponse } from "next/server";
import { Types } from "mongoose";
import {
  CONTENT_TARGET_COLLECTIONS,
  ORIENTATION_ARTICLE_STATUS,
} from "@/constants";
import { logAuditAction } from "@/lib/audit";
import {
  detachAndDeleteUnusedMedia,
  syncContentMediaRefs,
} from "@/lib/content/media-sync";
import { validateAndSanitizeTiptapDoc } from "@/lib/content/tiptap-schema";
import { connectToDatabase } from "@/lib/db";
import {
  ensureUniqueArticleSlug,
  revalidateOrientationRoutes,
  serializeOrientationArticle,
} from "@/lib/orientation";
import { isSafeMediaUrl, normalizeStringList } from "@/lib/orientation-utils";
import { handleAuthError, requireAdmin } from "@/lib/session";
import { ArticleComment } from "@/models/ArticleComment";
import { ArticleLike } from "@/models/ArticleLike";
import { OrientationArticle } from "@/models/OrientationArticle";
import { OrientationCategory } from "@/models/OrientationCategory";
import { OrientationTopic } from "@/models/OrientationTopic";
import { updateOrientationArticleSchema } from "@/validations";

/**
 * GET /api/admin/orientation/articles/[id]
 * Chi tiết bài viết (kèm contentJson) để Admin chỉnh sửa trong Tiptap Editor
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin(req);
    const { id } = await params;

    if (!Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: "Mã bài viết không hợp lệ." },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const doc = await OrientationArticle.findById(id)
      .populate("categoryId", "name slug")
      .populate("topicIds", "name slug isActive")
      .lean();

    if (!doc) {
      return NextResponse.json(
        { error: "Không tìm thấy bài viết định hướng." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      article: serializeOrientationArticle(doc, { includeContent: true }),
    });
  } catch (error) {
    return handleAuthError(error);
  }
}

/**
 * PATCH /api/admin/orientation/articles/[id]
 * Cập nhật bài viết, tính lại contentText/readTime & đồng bộ lại MediaAsset refs
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
        { error: "Mã bài viết không hợp lệ." },
        { status: 400 }
      );
    }

    const body = await req.json();
    const parsed = updateOrientationArticleSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error:
            parsed.error.issues[0]?.message ||
            "Dữ liệu cập nhật không hợp lệ.",
        },
        { status: 400 }
      );
    }

    const data = parsed.data;

    await connectToDatabase();

    const article = await OrientationArticle.findById(id);
    if (!article) {
      return NextResponse.json(
        { error: "Không tìm thấy bài viết định hướng." },
        { status: 404 }
      );
    }

    const previousSlug = article.slug;
    const beforeSnapshot = {
      title: article.title,
      slug: article.slug,
      status: article.status,
      isFeatured: article.isFeatured,
    };

    if (data.coverImage !== undefined) {
      const nextCover = data.coverImage.trim();
      if (nextCover && !isSafeMediaUrl(nextCover)) {
        return NextResponse.json(
          { error: "URL ảnh bìa không hợp lệ hoặc không an toàn." },
          { status: 400 }
        );
      }
      article.coverImage = nextCover;
    }

    let nextReadTime = data.readTimeMinutes;

    if (data.contentJson !== undefined) {
      const tiptapRes = validateAndSanitizeTiptapDoc(data.contentJson, {
        minTextLength: 20,
      });
      if (!tiptapRes.ok) {
        return NextResponse.json({ error: tiptapRes.error }, { status: 400 });
      }
      article.contentJson = tiptapRes.doc;
      article.contentText = tiptapRes.plainText;
      article.markModified("contentJson");
      if (nextReadTime === undefined) {
        nextReadTime = tiptapRes.readTimeMinutes;
      }
    }

    if (data.categoryId !== undefined) {
      if (!Types.ObjectId.isValid(data.categoryId)) {
        return NextResponse.json(
          { error: "Danh mục định hướng không hợp lệ." },
          { status: 400 }
        );
      }
      const catExists = await OrientationCategory.exists({
        _id: data.categoryId,
      });
      if (!catExists) {
        return NextResponse.json(
          { error: "Danh mục định hướng không tồn tại." },
          { status: 404 }
        );
      }
      article.categoryId = new Types.ObjectId(data.categoryId);
    }

    if (data.topicIds !== undefined) {
      const uniqueTopicIds = Array.from(
        new Set(data.topicIds.filter((tid) => Types.ObjectId.isValid(tid)))
      ).map((tid) => new Types.ObjectId(tid));

      if (uniqueTopicIds.length > 0) {
        const validTopics = await OrientationTopic.find({
          _id: { $in: uniqueTopicIds },
        })
          .select("_id")
          .lean();
        if (validTopics.length !== uniqueTopicIds.length) {
          return NextResponse.json(
            { error: "Một hoặc nhiều chủ đề không tồn tại." },
            { status: 400 }
          );
        }
      }
      article.topicIds = uniqueTopicIds;
    }

    if (data.title !== undefined) {
      article.title = data.title;
    }

    if (data.slug !== undefined) {
      article.slug = await ensureUniqueArticleSlug(data.slug, id);
    }

    if (data.summary !== undefined) {
      article.summary = data.summary;
    }

    if (data.tags !== undefined) {
      article.tags = normalizeStringList(data.tags).slice(0, 20);
    }

    if (data.authorName !== undefined) {
      article.authorName = data.authorName;
    }

    if (typeof data.isFeatured === "boolean") {
      article.isFeatured = data.isFeatured;
    }

    if (nextReadTime !== undefined) {
      article.readTimeMinutes = nextReadTime;
    }

    const statusChanged =
      data.status !== undefined && data.status !== article.status;
    if (data.status !== undefined) {
      article.status = data.status;
      if (
        data.status === ORIENTATION_ARTICLE_STATUS.PUBLISHED &&
        !article.publishedAt
      ) {
        article.publishedAt = new Date();
      }
    }

    await article.save();

    if (data.coverImage !== undefined || data.contentJson !== undefined) {
      await syncContentMediaRefs({
        targetCollection: CONTENT_TARGET_COLLECTIONS.ORIENTATION_ARTICLES,
        documentId: article._id,
        coverImage: article.coverImage,
        contentJson: article.contentJson,
      });
    }

    const populated = await OrientationArticle.findById(article._id)
      .populate("categoryId", "name slug")
      .populate("topicIds", "name slug isActive")
      .lean();

    await logAuditAction({
      admin: { id: admin.id, email: admin.email, name: admin.name },
      action: statusChanged ? "STATUS_CHANGE" : "UPDATE",
      targetCollection: CONTENT_TARGET_COLLECTIONS.ORIENTATION_ARTICLES,
      targetId: article._id,
      targetTitle: article.title,
      changesBefore: beforeSnapshot,
      changesAfter: {
        title: article.title,
        slug: article.slug,
        status: article.status,
        isFeatured: article.isFeatured,
      },
      reason: statusChanged
        ? `Thay đổi trạng thái bài viết thành ${article.status}`
        : "Cập nhật nội dung bài viết Khám phá định hướng",
      req,
    });

    revalidateOrientationRoutes([previousSlug, article.slug]);

    return NextResponse.json({
      success: true,
      article: populated
        ? serializeOrientationArticle(populated, { includeContent: true })
        : null,
    });
  } catch (error) {
    return handleAuthError(error);
  }
}

/**
 * DELETE /api/admin/orientation/articles/[id]
 * Xóa bài viết, cascade Like/Comment và tự động dọn Cloudinary media không còn dùng
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
        { error: "Mã bài viết không hợp lệ." },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const existing = await OrientationArticle.findById(id).lean();
    if (!existing) {
      return NextResponse.json(
        { error: "Không tìm thấy bài viết định hướng." },
        { status: 404 }
      );
    }

    await Promise.all([
      ArticleLike.deleteMany({ articleId: existing._id }),
      ArticleComment.deleteMany({ articleId: existing._id }),
      OrientationArticle.deleteOne({ _id: existing._id }),
    ]);

    const mediaCleanup = await detachAndDeleteUnusedMedia({
      targetCollection: CONTENT_TARGET_COLLECTIONS.ORIENTATION_ARTICLES,
      documentId: existing._id,
      deleteUnusedOnCloudinary: true,
    });

    await logAuditAction({
      admin: { id: admin.id, email: admin.email, name: admin.name },
      action: "DELETE",
      targetCollection: CONTENT_TARGET_COLLECTIONS.ORIENTATION_ARTICLES,
      targetId: existing._id,
      targetTitle: existing.title,
      changesBefore: {
        title: existing.title,
        slug: existing.slug,
        status: existing.status,
      },
      reason: "Xóa bài viết Khám phá định hướng và thu hồi MediaAsset",
      req,
    });

    revalidateOrientationRoutes([existing.slug]);

    return NextResponse.json({
      success: true,
      mediaCleanup,
    });
  } catch (error) {
    return handleAuthError(error);
  }
}

