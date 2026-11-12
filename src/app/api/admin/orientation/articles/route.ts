import { NextResponse } from "next/server";
import { Types } from "mongoose";
import {
  CONTENT_TARGET_COLLECTIONS,
  ORIENTATION_ARTICLE_STATUS,
} from "@/constants";
import { logAuditAction } from "@/lib/audit";
import { syncContentMediaRefs } from "@/lib/content/media-sync";
import { validateAndSanitizeTiptapDoc } from "@/lib/content/tiptap-schema";
import { connectToDatabase } from "@/lib/db";
import {
  ensureUniqueArticleSlug,
  revalidateOrientationRoutes,
  serializeOrientationArticle,
} from "@/lib/orientation";
import {
  escapeRegexInput,
  isSafeMediaUrl,
  normalizeStringList,
} from "@/lib/orientation-utils";
import { handleAuthError, requireAdmin } from "@/lib/session";
import { OrientationArticle } from "@/models/OrientationArticle";
import { OrientationCategory } from "@/models/OrientationCategory";
import { OrientationTopic } from "@/models/OrientationTopic";
import { adminOrientationArticleSchema } from "@/validations";

/**
 * GET /api/admin/orientation/articles
 * Danh sách bài viết Khám phá định hướng cho Admin CMS (hỗ trợ lọc & tìm kiếm cả contentText)
 */
export async function GET(req: Request) {
  try {
    await requireAdmin(req);
    const { searchParams } = new URL(req.url);

    const status = searchParams.get("status")?.trim().toUpperCase() || "ALL";
    const categoryId = searchParams.get("categoryId")?.trim() || "";
    const featured = searchParams.get("featured")?.trim() || "";
    const q = searchParams.get("q")?.trim() || "";

    const parsedPage = Number.parseInt(searchParams.get("page") || "1", 10);
    const parsedLimit = Number.parseInt(searchParams.get("limit") || "15", 10);
    const page = Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : 1;
    const limit =
      Number.isFinite(parsedLimit) && parsedLimit > 0
        ? Math.min(parsedLimit, 50)
        : 15;

    await connectToDatabase();

    const filter: Record<string, unknown> = {};

    if (
      status === ORIENTATION_ARTICLE_STATUS.DRAFT ||
      status === ORIENTATION_ARTICLE_STATUS.PUBLISHED ||
      status === ORIENTATION_ARTICLE_STATUS.UNPUBLISHED
    ) {
      filter.status = status;
    }

    if (categoryId && Types.ObjectId.isValid(categoryId)) {
      filter.categoryId = new Types.ObjectId(categoryId);
    }

    if (featured === "true") {
      filter.isFeatured = true;
    } else if (featured === "false") {
      filter.isFeatured = false;
    }

    if (q) {
      const safeRegex = new RegExp(escapeRegexInput(q), "i");
      filter.$or = [
        { title: safeRegex },
        { slug: safeRegex },
        { summary: safeRegex },
        { tags: safeRegex },
        { authorName: safeRegex },
      ];
    }

    const skip = (page - 1) * limit;

    const [articles, total, totalAll, publishedCount, draftCount, unpublishedCount] =
      await Promise.all([
        OrientationArticle.find(filter)
          .select("-contentJson -contentText")
          .sort({ isFeatured: -1, updatedAt: -1 })
          .skip(skip)
          .limit(limit)
          .populate("categoryId", "name slug")
          .populate("topicIds", "name slug isActive")
          .lean(),
        OrientationArticle.countDocuments(filter),
        OrientationArticle.countDocuments({}),
        OrientationArticle.countDocuments({
          status: ORIENTATION_ARTICLE_STATUS.PUBLISHED,
        }),
        OrientationArticle.countDocuments({
          status: ORIENTATION_ARTICLE_STATUS.DRAFT,
        }),
        OrientationArticle.countDocuments({
          status: ORIENTATION_ARTICLE_STATUS.UNPUBLISHED,
        }),
      ]);

    return NextResponse.json({
      success: true,
      articles: articles.map((doc) => serializeOrientationArticle(doc)),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
      counts: {
        all: totalAll,
        published: publishedCount,
        draft: draftCount,
        unpublished: unpublishedCount,
      },
    });
  } catch (error) {
    return handleAuthError(error);
  }
}

/**
 * POST /api/admin/orientation/articles
 * Tạo bài viết Khám phá định hướng mới với nội dung Tiptap JSON & đồng bộ MediaAsset
 */
export async function POST(req: Request) {
  try {
    const admin = await requireAdmin(req);
    const body = await req.json();

    const parsed = adminOrientationArticleSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error:
            parsed.error.issues[0]?.message ||
            "Thông tin bài viết không hợp lệ.",
        },
        { status: 400 }
      );
    }

    const data = parsed.data;
    const coverImage = data.coverImage?.trim() || "";

    if (coverImage && !isSafeMediaUrl(coverImage)) {
      return NextResponse.json(
        { error: "URL ảnh bìa không hợp lệ hoặc không an toàn." },
        { status: 400 }
      );
    }

    const tiptapRes = validateAndSanitizeTiptapDoc(data.contentJson, {
      minTextLength: 20,
    });
    if (!tiptapRes.ok) {
      return NextResponse.json({ error: tiptapRes.error }, { status: 400 });
    }

    if (!Types.ObjectId.isValid(data.categoryId)) {
      return NextResponse.json(
        { error: "Danh mục định hướng không hợp lệ." },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const categoryExists = await OrientationCategory.exists({
      _id: data.categoryId,
    });
    if (!categoryExists) {
      return NextResponse.json(
        { error: "Danh mục định hướng không tồn tại." },
        { status: 404 }
      );
    }

    const uniqueTopicIds = Array.from(
      new Set(data.topicIds.filter((id) => Types.ObjectId.isValid(id)))
    ).map((id) => new Types.ObjectId(id));

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

    const slug = await ensureUniqueArticleSlug(data.slug || data.title);
    const cleanTags = normalizeStringList(data.tags).slice(0, 20);
    const readTimeMinutes = data.readTimeMinutes || tiptapRes.readTimeMinutes;
    const isPublished = data.status === ORIENTATION_ARTICLE_STATUS.PUBLISHED;

    const created = await OrientationArticle.create({
      title: data.title,
      slug,
      summary: data.summary,
      contentJson: tiptapRes.doc,
      contentText: tiptapRes.plainText,
      coverImage,
      categoryId: new Types.ObjectId(data.categoryId),
      topicIds: uniqueTopicIds,
      tags: cleanTags,
      status: data.status,
      isFeatured: data.isFeatured,
      authorName: data.authorName || admin.name || "Ban biên tập Unera",
      createdByAdminId: new Types.ObjectId(admin.id),
      readTimeMinutes,
      publishedAt: isPublished ? new Date() : null,
    });

    await syncContentMediaRefs({
      targetCollection: CONTENT_TARGET_COLLECTIONS.ORIENTATION_ARTICLES,
      documentId: created._id,
      coverImage: created.coverImage,
      contentJson: tiptapRes.doc,
    });

    const populated = await OrientationArticle.findById(created._id)
      .populate("categoryId", "name slug")
      .populate("topicIds", "name slug isActive")
      .lean();

    await logAuditAction({
      admin: { id: admin.id, email: admin.email, name: admin.name },
      action: "CREATE",
      targetCollection: CONTENT_TARGET_COLLECTIONS.ORIENTATION_ARTICLES,
      targetId: created._id,
      targetTitle: created.title,
      changesAfter: {
        title: created.title,
        slug: created.slug,
        status: created.status,
        isFeatured: created.isFeatured,
      },
      reason: "Tạo bài viết Khám phá định hướng (Tiptap CMS)",
      req,
    });

    revalidateOrientationRoutes([created.slug]);

    return NextResponse.json(
      {
        success: true,
        article: populated
          ? serializeOrientationArticle(populated, { includeContent: true })
          : serializeOrientationArticle(created.toObject(), {
              includeContent: true,
            }),
      },
      { status: 201 }
    );
  } catch (error) {
    return handleAuthError(error);
  }
}

