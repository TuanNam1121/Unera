import { NextRequest, NextResponse } from "next/server";
import { Types } from "mongoose";
import { CONTENT_TARGET_COLLECTIONS, NEWS_ARTICLE_STATUS } from "@/constants";
import { logAuditAction } from "@/lib/audit";
import {
  detachAndDeleteUnusedMedia,
  syncContentMediaRefs,
} from "@/lib/content/media-sync";
import { validateAndSanitizeTiptapDoc } from "@/lib/content/tiptap-schema";
import { connectToDatabase } from "@/lib/db";
import { isSafeMediaUrl } from "@/lib/orientation-utils";
import { handleAuthError, requireAdmin } from "@/lib/session";
import {
  ensureUniqueNewsSlug,
  promoteDueScheduledNews,
  RawNewsArticleDoc,
  recalculateNewsTagUsageCounts,
  revalidateNewsRoutes,
  serializeNewsArticle,
  syncNewsTagEntitiesAndUsage,
} from "@/lib/news";
import { updateNewsArticleSchema } from "@/validations";
import { NewsCategory } from "@/models/NewsCategory";
import { NewsArticle } from "@/models/NewsArticle";
import { NewsBookmark } from "@/models/NewsBookmark";
import { NewsReadingHistory } from "@/models/NewsReadingHistory";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin(req);
    await connectToDatabase();
    await promoteDueScheduledNews();
    const { id } = await params;

    if (!Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: "ID bài viết tin tức không hợp lệ" },
        { status: 400 }
      );
    }

    const doc = (await NewsArticle.findById(id)
      .populate("categoryId", "name slug colorToken")
      .lean()) as unknown as RawNewsArticleDoc | null;

    if (!doc) {
      return NextResponse.json(
        { error: "Không tìm thấy bài viết tin tức" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      article: serializeNewsArticle(doc, { includeContent: true }),
    });
  } catch (error) {
    return handleAuthError(error);
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdmin(req);
    await connectToDatabase();
    const { id } = await params;

    if (!Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: "ID bài viết tin tức không hợp lệ" },
        { status: 400 }
      );
    }

    const existing = await NewsArticle.findById(id);
    if (!existing) {
      return NextResponse.json(
        { error: "Không tìm thấy bài viết cần cập nhật" },
        { status: 404 }
      );
    }

    const body = await req.json();
    const parsed = updateNewsArticleSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Dữ liệu cập nhật bài viết không hợp lệ",
          details: parsed.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const data = parsed.data;
    const updates: Record<string, unknown> = {};
    const adminObjectId = Types.ObjectId.isValid(admin.id)
      ? new Types.ObjectId(admin.id)
      : undefined;
    if (adminObjectId) updates.updatedByAdminId = adminObjectId;

    if (data.title !== undefined) updates.title = data.title;
    if (data.summary !== undefined) updates.summary = data.summary;
    if (data.authorName !== undefined) updates.authorName = data.authorName;
    if (data.isFeatured !== undefined) updates.isFeatured = data.isFeatured;
    if (data.isSponsored !== undefined) {
      updates.isSponsored = data.isSponsored;
      if (!data.isSponsored) updates.sponsorInfo = "";
    }
    if (data.sponsorInfo !== undefined) updates.sponsorInfo = data.sponsorInfo;
    if (data.sourceName !== undefined) updates.sourceName = data.sourceName;
    if (data.sourceUrl !== undefined) updates.sourceUrl = data.sourceUrl;

    if (data.slug !== undefined) {
      updates.slug = await ensureUniqueNewsSlug(data.slug, id);
    }

    if (data.categoryId !== undefined) {
      if (!Types.ObjectId.isValid(data.categoryId)) {
        return NextResponse.json(
          { error: "Danh mục tin tức không hợp lệ" },
          { status: 400 }
        );
      }
      const catDoc = await NewsCategory.findById(data.categoryId);
      if (!catDoc) {
        return NextResponse.json(
          { error: "Không tìm thấy danh mục tin tức" },
          { status: 404 }
        );
      }
      updates.categoryId = catDoc._id;
      updates.category = catDoc.slug;
    }

    let contentOrCoverChanged = false;
    if (data.coverImage !== undefined) {
      if (data.coverImage && !isSafeMediaUrl(data.coverImage)) {
        return NextResponse.json(
          { error: "Đường dẫn ảnh bìa không hợp lệ" },
          { status: 400 }
        );
      }
      updates.coverImage = data.coverImage;
      contentOrCoverChanged = true;
    }

    if (data.contentJson !== undefined) {
      const tiptapCheck = validateAndSanitizeTiptapDoc(data.contentJson, {
        minTextLength: 20,
      });
      if (!tiptapCheck.ok) {
        return NextResponse.json(
          {
            error:
              tiptapCheck.error || "Nội dung bài viết Tiptap JSON không hợp lệ",
          },
          { status: 400 }
        );
      }
      updates.contentJson = tiptapCheck.doc;
      updates.contentText = tiptapCheck.plainText;
      if (data.readTimeMinutes === undefined) {
        updates.readTimeMinutes = tiptapCheck.readTimeMinutes;
      }
      contentOrCoverChanged = true;
    }

    if (data.readTimeMinutes !== undefined) {
      updates.readTimeMinutes = data.readTimeMinutes;
    }

    let tagsChanged = false;
    if (data.tags !== undefined) {
      updates.tags = await syncNewsTagEntitiesAndUsage(data.tags);
      tagsChanged = true;
    }

    const effectiveStatus = data.status ?? existing.status;
    if (data.status !== undefined) {
      updates.status = data.status;
      if (data.status === NEWS_ARTICLE_STATUS.PUBLISHED) {
        updates.scheduledAt = null;
        if (!existing.publishedAt) {
          updates.publishedAt = new Date();
        }
      } else if (data.status === NEWS_ARTICLE_STATUS.SCHEDULED) {
        const nextScheduledAt =
          data.scheduledAt !== undefined ? data.scheduledAt : existing.scheduledAt;
        if (!nextScheduledAt || new Date(nextScheduledAt).getTime() <= Date.now()) {
          return NextResponse.json(
            { error: "Thời gian hẹn xuất bản phải ở tương lai" },
            { status: 400 }
          );
        }
        updates.scheduledAt = nextScheduledAt;
      } else {
        updates.scheduledAt = null;
      }
    } else if (
      data.scheduledAt !== undefined &&
      effectiveStatus === NEWS_ARTICLE_STATUS.SCHEDULED
    ) {
      updates.scheduledAt = data.scheduledAt;
    }

    const updated = await NewsArticle.findOneAndUpdate(
      { _id: existing._id, version: data.version },
      { $set: updates, $inc: { version: 1 } },
      { returnDocument: "after" }
    );

    if (!updated) {
      const latest = await NewsArticle.findById(existing._id)
        .select("version")
        .lean();
      return NextResponse.json(
        {
          error:
            "Bài viết vừa được cập nhật bởi phiên làm việc khác. Vui lòng tải lại dữ liệu mới nhất trước khi lưu.",
          conflict: true,
          currentVersion: latest?.version ?? existing.version + 1,
        },
        { status: 409 }
      );
    }

    if (contentOrCoverChanged) {
      await syncContentMediaRefs({
        targetCollection: CONTENT_TARGET_COLLECTIONS.NEWS_ARTICLES,
        documentId: updated._id.toString(),
        coverImage: updated.coverImage,
        contentJson: updated.contentJson,
      });
    }

    if (tagsChanged) {
      await recalculateNewsTagUsageCounts();
    }

    const isStatusOrFeaturedOnly =
      (data.status !== undefined || data.isFeatured !== undefined) &&
      data.title === undefined &&
      data.contentJson === undefined;

    await logAuditAction({
      admin,
      action: isStatusOrFeaturedOnly ? "STATUS_CHANGE" : "UPDATE",
      targetCollection: CONTENT_TARGET_COLLECTIONS.NEWS_ARTICLES,
      targetId: updated._id,
      targetTitle: updated.title,
      targetVersion: updated.version,
      changesBefore: {
        status: existing.status,
        isFeatured: existing.isFeatured,
        scheduledAt: existing.scheduledAt,
        version: existing.version,
      },
      changesAfter: {
        status: updated.status,
        isFeatured: updated.isFeatured,
        scheduledAt: updated.scheduledAt,
        version: updated.version,
      },
      req,
    });

    const populated = (await NewsArticle.findById(updated._id)
      .populate("categoryId", "name slug colorToken")
      .lean()) as unknown as RawNewsArticleDoc;

    revalidateNewsRoutes(existing.slug);
    if (updated.slug !== existing.slug) {
      revalidateNewsRoutes(updated.slug);
    }

    return NextResponse.json({
      success: true,
      article: serializeNewsArticle(populated, { includeContent: true }),
      message: "Đã cập nhật bài viết tin tức",
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
      return NextResponse.json(
        { error: "ID bài viết không hợp lệ" },
        { status: 400 }
      );
    }

    const existing = await NewsArticle.findById(id);
    if (!existing) {
      return NextResponse.json(
        { error: "Không tìm thấy bài viết cần xóa" },
        { status: 404 }
      );
    }

    await Promise.all([
      NewsBookmark.deleteMany({ articleId: existing._id }),
      NewsReadingHistory.deleteMany({ articleId: existing._id }),
      NewsArticle.findByIdAndDelete(existing._id),
    ]);

    await Promise.all([
      detachAndDeleteUnusedMedia({
        targetCollection: CONTENT_TARGET_COLLECTIONS.NEWS_ARTICLES,
        documentId: existing._id.toString(),
        deleteUnusedOnCloudinary: true,
      }),
      recalculateNewsTagUsageCounts(),
    ]);

    await logAuditAction({
      admin,
      action: "DELETE",
      targetCollection: CONTENT_TARGET_COLLECTIONS.NEWS_ARTICLES,
      targetId: existing._id,
      targetTitle: existing.title,
      targetVersion: existing.version,
      changesBefore: {
        slug: existing.slug,
        status: existing.status,
        viewCount: existing.viewCount,
        bookmarkCount: existing.bookmarkCount,
      },
      req,
    });

    revalidateNewsRoutes(existing.slug);

    return NextResponse.json({
      success: true,
      message: `Đã xóa bài viết "${existing.title}" và dọn dẹp tài nguyên liên quan`,
    });
  } catch (error) {
    return handleAuthError(error);
  }
}

