import { NextRequest, NextResponse } from "next/server";
import { Types } from "mongoose";
import { CONTENT_TARGET_COLLECTIONS, NEWS_ARTICLE_STATUS } from "@/constants";
import { logAuditAction } from "@/lib/audit";
import { syncContentMediaRefs } from "@/lib/content/media-sync";
import { validateAndSanitizeTiptapDoc } from "@/lib/content/tiptap-schema";
import { connectToDatabase } from "@/lib/db";
import { escapeRegexInput, isSafeMediaUrl } from "@/lib/orientation-utils";
import { handleAuthError, requireAdmin } from "@/lib/session";
import {
  ensureUniqueNewsSlug,
  promoteDueScheduledNews,
  RawNewsArticleDoc,
  revalidateNewsRoutes,
  serializeNewsArticle,
  serializeNewsCategory,
  syncNewsTagEntitiesAndUsage,
} from "@/lib/news";
import { adminNewsArticleSchema } from "@/validations";
import { NewsCategory } from "@/models/NewsCategory";
import { NewsTag } from "@/models/NewsTag";
import { NewsArticle } from "@/models/NewsArticle";

export async function GET(req: NextRequest) {
  try {
    await requireAdmin(req);
    await connectToDatabase();
    await promoteDueScheduledNews();

    const { searchParams } = new URL(req.url);
    const status = (searchParams.get("status") || "").trim().toUpperCase();
    const category = (searchParams.get("category") || "").trim();
    const tag = (searchParams.get("tag") || "").trim();
    const isFeatured = (searchParams.get("isFeatured") || "").trim();
    const search = (
      searchParams.get("search") ||
      searchParams.get("q") ||
      ""
    ).trim();
    const page = Math.max(
      1,
      parseInt(searchParams.get("page") || "1", 10) || 1
    );
    const limit = Math.min(
      50,
      Math.max(1, parseInt(searchParams.get("limit") || "12", 10) || 12)
    );

    const filter: Record<string, unknown> = {};
    if (
      status &&
      Object.values(NEWS_ARTICLE_STATUS).includes(
        status as (typeof NEWS_ARTICLE_STATUS)[keyof typeof NEWS_ARTICLE_STATUS]
      )
    ) {
      filter.status = status;
    }

    if (category && category.toLowerCase() !== "all") {
      if (Types.ObjectId.isValid(category)) {
        filter.categoryId = new Types.ObjectId(category);
      } else {
        filter.category = category.toLowerCase();
      }
    }

    if (tag && tag.toLowerCase() !== "all") {
      filter.tags = new RegExp(`^${escapeRegexInput(tag)}$`, "i");
    }

    if (isFeatured === "true") {
      filter.isFeatured = true;
    } else if (isFeatured === "false") {
      filter.isFeatured = false;
    }

    if (search) {
      const regex = new RegExp(escapeRegexInput(search), "i");
      filter.$or = [
        { title: regex },
        { slug: regex },
        { summary: regex },
        { authorName: regex },
        { tags: regex },
      ];
    }

    const skip = (page - 1) * limit;
    const [
      total,
      rawDocs,
      categories,
      tags,
      allCount,
      publishedCount,
      scheduledCount,
      draftCount,
    ] = await Promise.all([
      NewsArticle.countDocuments(filter),
      NewsArticle.find(filter)
        .select("-contentJson -contentText")
        .populate("categoryId", "name slug colorToken")
        .sort({ updatedAt: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean() as Promise<unknown[]>,
      NewsCategory.find().sort({ order: 1, name: 1 }).lean(),
      NewsTag.find({ isActive: true }).sort({ usageCount: -1, name: 1 }).lean(),
      NewsArticle.countDocuments(),
      NewsArticle.countDocuments({ status: NEWS_ARTICLE_STATUS.PUBLISHED }),
      NewsArticle.countDocuments({ status: NEWS_ARTICLE_STATUS.SCHEDULED }),
      NewsArticle.countDocuments({ status: NEWS_ARTICLE_STATUS.DRAFT }),
    ]);

    const totalPages = total === 0 ? 0 : Math.ceil(total / limit);

    return NextResponse.json({
      success: true,
      articles: (rawDocs as RawNewsArticleDoc[]).map((doc) =>
        serializeNewsArticle(doc)
      ),
      categories: categories.map((c) => serializeNewsCategory(c)),
      tags: tags.map((t) => ({
        _id: t._id.toString(),
        name: t.name,
        slug: t.slug,
        usageCount: t.usageCount,
        isActive: t.isActive,
      })),
      counts: {
        all: allCount,
        published: publishedCount,
        scheduled: scheduledCount,
        draft: draftCount,
      },
      pagination: { page, limit, total, totalPages },
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
    const parsed = adminNewsArticleSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Dữ liệu bài viết tin tức không hợp lệ",
          details: parsed.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const data = parsed.data;
    if (!Types.ObjectId.isValid(data.categoryId)) {
      return NextResponse.json(
        { error: "Danh mục tin tức không hợp lệ" },
        { status: 400 }
      );
    }

    const categoryDoc = await NewsCategory.findById(data.categoryId);
    if (!categoryDoc) {
      return NextResponse.json(
        { error: "Không tìm thấy danh mục tin tức đã chọn" },
        { status: 404 }
      );
    }

    if (data.coverImage && !isSafeMediaUrl(data.coverImage)) {
      return NextResponse.json(
        { error: "Đường dẫn ảnh bìa không hợp lệ" },
        { status: 400 }
      );
    }

    const tiptapCheck = validateAndSanitizeTiptapDoc(data.contentJson, {
      minTextLength: 20,
    });
    if (!tiptapCheck.ok) {
      return NextResponse.json(
        {
          error: tiptapCheck.error || "Nội dung bài viết Tiptap JSON không hợp lệ",
        },
        { status: 400 }
      );
    }

    const slug = await ensureUniqueNewsSlug(data.slug || data.title);
    const cleanedTags = await syncNewsTagEntitiesAndUsage(data.tags || []);
    const adminObjectId = Types.ObjectId.isValid(admin.id)
      ? new Types.ObjectId(admin.id)
      : undefined;

    const now = new Date();
    const publishedAt =
      data.status === NEWS_ARTICLE_STATUS.PUBLISHED ? now : null;
    const scheduledAt =
      data.status === NEWS_ARTICLE_STATUS.SCHEDULED ? data.scheduledAt : null;

    const created = await NewsArticle.create({
      title: data.title,
      slug,
      summary: data.summary,
      contentJson: tiptapCheck.doc,
      contentText: tiptapCheck.plainText,
      coverImage: data.coverImage || "",
      categoryId: categoryDoc._id,
      category: categoryDoc.slug,
      tags: cleanedTags,
      authorName: data.authorName || admin.name || "Ban biên tập Unera",
      readTimeMinutes: data.readTimeMinutes || tiptapCheck.readTimeMinutes,
      status: data.status,
      scheduledAt,
      publishedAt,
      isFeatured: data.isFeatured,
      isSponsored: data.isSponsored,
      sponsorInfo: data.isSponsored ? data.sponsorInfo || "" : "",
      sourceName: data.sourceName || "",
      sourceUrl: data.sourceUrl || "",
      version: 1,
      ...(adminObjectId
        ? { createdBy: adminObjectId, updatedByAdminId: adminObjectId }
        : {}),
    });

    await Promise.all([
      syncContentMediaRefs({
        targetCollection: CONTENT_TARGET_COLLECTIONS.NEWS_ARTICLES,
        documentId: created._id.toString(),
        coverImage: created.coverImage,
        contentJson: created.contentJson,
      }),
      syncNewsTagEntitiesAndUsage(cleanedTags),
    ]);

    await logAuditAction({
      admin,
      action: "CREATE",
      targetCollection: CONTENT_TARGET_COLLECTIONS.NEWS_ARTICLES,
      targetId: created._id,
      targetTitle: created.title,
      targetVersion: 1,
      changesAfter: {
        slug: created.slug,
        status: created.status,
        category: categoryDoc.name,
        scheduledAt: created.scheduledAt,
      },
      req,
    });

    const populated = (await NewsArticle.findById(created._id)
      .populate("categoryId", "name slug colorToken")
      .lean()) as unknown as RawNewsArticleDoc;

    revalidateNewsRoutes(created.slug);

    return NextResponse.json(
      {
        success: true,
        article: serializeNewsArticle(populated, { includeContent: true }),
        message:
          data.status === NEWS_ARTICLE_STATUS.SCHEDULED
            ? "Đã lên lịch xuất bản bài viết tin tức"
            : "Đã tạo bài viết tin tức thành công",
      },
      { status: 201 }
    );
  } catch (error) {
    return handleAuthError(error);
  }
}

