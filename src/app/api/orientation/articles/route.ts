import { cookies } from "next/headers";
import { NextResponse, connection } from "next/server";
import { Types } from "mongoose";
import { AUTH_COOKIE_NAMES, ORIENTATION_ARTICLE_STATUS } from "@/constants";
import { connectToDatabase } from "@/lib/db";
import { verifyAccessToken } from "@/lib/jwt";
import {
  ensureOrientationArticleIndexesInBackground,
  getCachedTaxonomyLookup,
  serializeOrientationArticle,
} from "@/lib/orientation";
import { escapeRegexInput } from "@/lib/orientation-utils";
import { ArticleLike } from "@/models/ArticleLike";
import { OrientationArticle } from "@/models/OrientationArticle";

/**
 * Extracts user ID directly from the JWT without hitting the User collection.
 * Keeps public feed + search fast while still resolving liked state for logged-in users.
 */
async function getOptionalUserIdFromRequest(req: Request): Promise<string | null> {
  try {
    let token: string | null = null;
    const authHeader = req.headers.get("authorization");
    if (authHeader && authHeader.toLowerCase().startsWith("bearer ")) {
      token = authHeader.slice(7).trim() || null;
    }
    if (!token) {
      const cookieStore = await cookies();
      token = cookieStore.get(AUTH_COOKIE_NAMES.ACCESS_TOKEN)?.value || null;
    }
    if (!token) return null;
    const payload = await verifyAccessToken(token);
    return payload?.sub ? String(payload.sub) : null;
  } catch {
    return null;
  }
}

/**
 * GET /api/orientation/articles
 * Feed công khai các bài viết Khám phá định hướng đã PUBLISHED
 */
export async function GET(req: Request) {
  await connection();

  try {
    const { searchParams } = new URL(req.url);
    const categorySlug = searchParams.get("category")?.trim().toLowerCase() || "";
    const topicSlug = searchParams.get("topic")?.trim().toLowerCase() || "";
    const featured = searchParams.get("featured")?.trim() || "";
    const tag = searchParams.get("tag")?.trim() || "";
    const q = searchParams.get("q")?.trim() || "";
    const sort = searchParams.get("sort")?.trim() || "latest";

    const parsedPage = Number.parseInt(searchParams.get("page") || "1", 10);
    const parsedLimit = Number.parseInt(searchParams.get("limit") || "12", 10);
    const page = Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : 1;
    const limit =
      Number.isFinite(parsedLimit) && parsedLimit > 0
        ? Math.min(parsedLimit, 30)
        : 12;

    const [, taxonomyLookup, userId] = await Promise.all([
      connectToDatabase(),
      getCachedTaxonomyLookup(),
      getOptionalUserIdFromRequest(req),
    ]);
    ensureOrientationArticleIndexesInBackground();

    const baseFilter: Record<string, unknown> = {
      status: ORIENTATION_ARTICLE_STATUS.PUBLISHED,
    };

    if (categorySlug) {
      const cat = taxonomyLookup.categoryBySlug.get(categorySlug);
      if (!cat) {
        return NextResponse.json({
          success: true,
          articles: [],
          pagination: { page, limit, total: 0, totalPages: 1 },
        });
      }
      baseFilter.categoryId = new Types.ObjectId(cat._id);
    }

    if (topicSlug) {
      const topic = taxonomyLookup.topicBySlug.get(topicSlug);
      if (!topic) {
        return NextResponse.json({
          success: true,
          articles: [],
          pagination: { page, limit, total: 0, totalPages: 1 },
        });
      }
      baseFilter.topicIds = new Types.ObjectId(topic._id);
    }

    if (featured === "true") {
      baseFilter.isFeatured = true;
    }

    if (tag) {
      baseFilter.tags = new RegExp(`^${escapeRegexInput(tag)}$`, "i");
    }

    const baseSort: Record<string, 1 | -1> =
      sort === "popular"
        ? { viewCount: -1, publishedAt: -1 }
        : sort === "most_liked"
        ? { likeCount: -1, publishedAt: -1 }
        : { isFeatured: -1, publishedAt: -1, createdAt: -1 };

    const skip = (page - 1) * limit;

    type ArticleDocRow = {
      _id: Types.ObjectId;
      title: string;
      slug: string;
      summary: string;
      coverImage?: string;
      categoryId: Types.ObjectId | { _id: string; name: string; slug: string } | null;
      topicIds: (
        | Types.ObjectId
        | { _id: string; name: string; slug: string; isActive?: boolean }
      )[];
      tags?: string[];
      status: "DRAFT" | "PUBLISHED" | "UNPUBLISHED";
      isFeatured: boolean;
      authorName: string;
      readTimeMinutes: number;
      viewCount: number;
      likeCount: number;
      commentCount: number;
      publishedAt?: Date | null;
      createdAt?: Date;
    };

    const ARTICLE_PROJECTION =
      "_id title slug summary coverImage categoryId topicIds tags status isFeatured authorName readTimeMinutes viewCount likeCount commentCount publishedAt createdAt";

    let docs: ArticleDocRow[] = [];
    let total = 0;

    if (q) {
      let textSearchSucceeded = false;

      if (q.length >= 2) {
        try {
          const textFilter = { ...baseFilter, $text: { $search: q } };
          const textDocs = (await OrientationArticle.find(textFilter, {
            ...(sort === "latest" ? { score: { $meta: "textScore" } } : {}),
          })
            .select(ARTICLE_PROJECTION)
            .sort(
              sort === "latest"
                ? ({ score: { $meta: "textScore" }, isFeatured: -1, publishedAt: -1 } as Record<
                    string,
                    1 | -1 | { $meta: "textScore" }
                  >)
                : baseSort
            )
            .skip(skip)
            .limit(limit)
            .lean()) as unknown as ArticleDocRow[];

          if (textDocs.length > 0 || page > 1) {
            docs = textDocs;
            total =
              page === 1 && textDocs.length < limit
                ? textDocs.length
                : await OrientationArticle.countDocuments(textFilter);
            textSearchSucceeded = true;
          }
        } catch {
          // Index may still be building on fresh deployments; fall back cleanly.
          textSearchSucceeded = false;
        }
      }

      if (!textSearchSucceeded) {
        // Lightweight metadata regex fallback for partial prefixes/short queries without scanning full contentText.
        const safeRegex = new RegExp(escapeRegexInput(q), "i");
        const fallbackFilter = {
          ...baseFilter,
          $or: [
            { title: safeRegex },
            { summary: safeRegex },
            { tags: safeRegex },
            { authorName: safeRegex },
          ],
        };

        const fallbackDocs = (await OrientationArticle.find(fallbackFilter)
          .select(ARTICLE_PROJECTION)
          .sort(baseSort)
          .skip(skip)
          .limit(limit)
          .lean()) as unknown as ArticleDocRow[];

        docs = fallbackDocs;
        total =
          page === 1 && fallbackDocs.length < limit
            ? fallbackDocs.length
            : await OrientationArticle.countDocuments(fallbackFilter);
      }
    } else {
      const feedDocs = (await OrientationArticle.find(baseFilter)
        .select(ARTICLE_PROJECTION)
        .sort(baseSort)
        .skip(skip)
        .limit(limit)
        .lean()) as unknown as ArticleDocRow[];

      docs = feedDocs;
      total =
        page === 1 && feedDocs.length < limit
          ? feedDocs.length
          : await OrientationArticle.countDocuments(baseFilter);
    }

    const likedIds = new Set<string>();
    if (userId && docs.length > 0) {
      const articleIds = docs.map((d) => d._id);
      const likes = await ArticleLike.find({
        userId,
        articleId: { $in: articleIds },
      })
        .select("articleId")
        .lean();
      for (const like of likes) {
        likedIds.add(like.articleId.toString());
      }
    }

    const hydratedDocs = docs.map((doc) => {
      const catIdStr = doc.categoryId ? String(doc.categoryId) : "";
      const resolvedCategory = taxonomyLookup.categoryById.get(catIdStr) || null;
      const resolvedTopics = Array.isArray(doc.topicIds)
        ? doc.topicIds
            .map((tid) => taxonomyLookup.topicById.get(String(tid)))
            .filter(
              (
                t
              ): t is {
                _id: string;
                categoryId: string;
                name: string;
                slug: string;
                isActive: boolean;
              } => Boolean(t)
            )
        : [];

      return {
        ...doc,
        categoryId: resolvedCategory,
        topicIds: resolvedTopics,
      };
    });

    return NextResponse.json({
      success: true,
      articles: hydratedDocs.map((doc) =>
        serializeOrientationArticle(doc, {
          likedIds,
          onlyActiveTopics: true,
        })
      ),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    });
  } catch (error) {
    console.error("GET /api/orientation/articles error:", error);
    return NextResponse.json(
      { error: "Không thể tải danh sách bài viết định hướng." },
      { status: 500 }
    );
  }
}
