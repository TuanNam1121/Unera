import { NextResponse } from "next/server";
import { requireAdmin, handleAuthError } from "@/lib/session";
import { connectToDatabase } from "@/lib/db";
import { NewsArticle } from "@/models/NewsArticle";
import { logAuditAction } from "@/lib/audit";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[đĐ]/g, "d")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

/**
 * GET /api/admin/news
 * Danh sách toàn bộ bài viết dành cho Admin CMS
 */
export async function GET(req: Request) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");
    const status = searchParams.get("status");
    const search = searchParams.get("search");
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "10", 10);

    await connectToDatabase();

    const filter: Record<string, unknown> = {};

    if (category && category !== "ALL") {
      filter.category = category.toUpperCase();
    }

    if (status && status !== "ALL") {
      filter.status = status;
    }

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: "i" } },
        { author: { $regex: search, $options: "i" } },
      ];
    }

    const total = await NewsArticle.countDocuments(filter);
    const articles = await NewsArticle.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    return NextResponse.json({
      success: true,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      articles,
    });
  } catch (error) {
    return handleAuthError(error);
  }
}

/**
 * POST /api/admin/news
 * Đăng bài viết mới từ Admin CMS (FR-NEWS-01..07)
 */
export async function POST(req: Request) {
  try {
    const admin = await requireAdmin();
    const body = await req.json();
    const {
      title,
      summary,
      content,
      category,
      author,
      readTime,
      isFeatured,
      isSponsored,
      sponsorInfo,
      status,
    } = body;

    if (!title || !summary || !content) {
      return NextResponse.json(
        { error: "Vui lòng nhập đầy đủ tiêu đề, tóm tắt và nội dung bài viết." },
        { status: 400 }
      );
    }

    await connectToDatabase();

    // Sinh slug duy nhất
    let baseSlug = slugify(title);
    let finalSlug = baseSlug;
    let count = 1;
    while (await NewsArticle.findOne({ slug: finalSlug })) {
      finalSlug = `${baseSlug}-${count++}`;
    }

    const article = new NewsArticle({
      title: title.trim(),
      slug: finalSlug,
      summary: summary.trim(),
      content: content.trim(),
      category: (category || "ORIENTATION").toUpperCase(),
      author: author?.trim() || "Ban biên tập Polaris",
      readTime: readTime?.trim() || "5 phút đọc",
      isFeatured: Boolean(isFeatured),
      isSponsored: Boolean(isSponsored),
      sponsorInfo: isSponsored
        ? {
            sponsorName: sponsorInfo?.sponsorName || "",
            sponsorLogoUrl: sponsorInfo?.sponsorLogoUrl || "",
            targetUrl: sponsorInfo?.targetUrl || "",
          }
        : undefined,
      status: status || "PUBLISHED",
      createdByAdminId: admin.id,
      publishedAt: new Date(),
    });

    await article.save();

    // Ghi nhật ký kiểm toán Append-only (FR-AUD-01)
    await logAuditAction({
      admin: {
        id: admin.id,
        email: admin.email || "",
        name: admin.name || "Admin",
      },
      action: "CREATE",
      targetCollection: "news_articles",
      targetId: article._id.toString(),
      targetTitle: article.title,
      changesAfter: {
        title: article.title,
        slug: article.slug,
        category: article.category,
        isSponsored: article.isSponsored,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Tạo bài viết mới thành công",
      article,
    });
  } catch (error) {
    return handleAuthError(error);
  }
}
