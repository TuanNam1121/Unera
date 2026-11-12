import { NextResponse, connection } from "next/server";
import { ORIENTATION_ARTICLE_STATUS } from "@/constants";
import { connectToDatabase } from "@/lib/db";
import { serializeOrientationArticle } from "@/lib/orientation";
import { escapeRegexInput } from "@/lib/orientation-utils";
import { getCurrentUser } from "@/lib/session";
import { ArticleLike } from "@/models/ArticleLike";
import { OrientationArticle } from "@/models/OrientationArticle";
import { OrientationCategory } from "@/models/OrientationCategory";
import { OrientationTopic } from "@/models/OrientationTopic";

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

    await connectToDatabase();

    let currentUser = null;
    try {
      currentUser = await getCurrentUser(req);
    } catch {
      currentUser = null;
    }

    const filter: Record<string, unknown> = {
      status: ORIENTATION_ARTICLE_STATUS.PUBLISHED,
    };

    if (categorySlug) {
      const cat = await OrientationCategory.findOne({
        slug: categorySlug,
        isActive: true,
      })
        .select("_id")
        .lean();

      if (!cat) {
        return NextResponse.json({
          success: true,
          articles: [],
          pagination: { page, limit, total: 0, totalPages: 1 },
        });
      }
      filter.categoryId = cat._id;
    }

    if (topicSlug) {
      const topic = await OrientationTopic.findOne({
        slug: topicSlug,
        isActive: true,
      })
        .select("_id")
        .lean();

      if (!topic) {
        return NextResponse.json({
          success: true,
          articles: [],
          pagination: { page, limit, total: 0, totalPages: 1 },
        });
      }
      filter.topicIds = topic._id;
    }

    if (featured === "true") {
      filter.isFeatured = true;
    }

    if (tag) {
      filter.tags = new RegExp(`^${escapeRegexInput(tag)}$`, "i");
    }

    if (q) {
      const safeRegex = new RegExp(escapeRegexInput(q), "i");
      filter.$or = [
        { title: safeRegex },
        { summary: safeRegex },
        { contentText: safeRegex },
        { tags: safeRegex },
        { authorName: safeRegex },
      ];
    }

    const sortQuery: Record<string, 1 | -1> =
      sort === "popular"
        ? { viewCount: -1, publishedAt: -1 }
        : sort === "most_liked"
        ? { likeCount: -1, publishedAt: -1 }
        : { isFeatured: -1, publishedAt: -1, createdAt: -1 };

    const skip = (page - 1) * limit;

    const [docs, total] = await Promise.all([
      OrientationArticle.find(filter)
        .select("-contentJson -contentText")
        .sort(sortQuery)
        .skip(skip)
        .limit(limit)
        .populate("categoryId", "name slug")
        .populate("topicIds", "name slug isActive")
        .lean(),
      OrientationArticle.countDocuments(filter),
    ]);

    const likedIds = new Set<string>();
    if (currentUser && docs.length > 0) {
      const articleIds = docs.map((d) => d._id);
      const likes = await ArticleLike.find({
        userId: currentUser.id,
        articleId: { $in: articleIds },
      })
        .select("articleId")
        .lean();
      for (const like of likes) {
        likedIds.add(like.articleId.toString());
      }
    }

    return NextResponse.json({
      success: true,
      articles: docs.map((doc) =>
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

