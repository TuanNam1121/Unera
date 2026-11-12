import { NextRequest, NextResponse } from "next/server";
import { Types } from "mongoose";
import { NEWS_ARTICLE_STATUS } from "@/constants";
import { connectToDatabase } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { promoteDueScheduledNews } from "@/lib/news";
import { NewsArticle } from "@/models/NewsArticle";

const SHARE_COOLDOWN_MS = 1000;
const recentShares = new Map<string, number>();

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    await connectToDatabase();
    await promoteDueScheduledNews();

    const { slug } = await params;
    const trimmed = slug.trim();

    const matchCondition = Types.ObjectId.isValid(trimmed)
      ? { $or: [{ _id: new Types.ObjectId(trimmed) }, { slug: trimmed.toLowerCase() }] }
      : { slug: trimmed.toLowerCase() };

    const article = await NewsArticle.findOne({
      ...matchCondition,
      status: NEWS_ARTICLE_STATUS.PUBLISHED,
    }).select("_id slug shareCount");

    if (!article) {
      return NextResponse.json(
        { error: "Không tìm thấy bài viết để chia sẻ" },
        { status: 404 }
      );
    }

    let currentUser = null;
    try {
      currentUser = await getCurrentUser(req);
    } catch {
      currentUser = null;
    }

    const clientIp =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      "local";
    const throttleKey = `${currentUser ? `u:${currentUser.id}` : `ip:${clientIp}`}:${article._id.toString()}`;
    const now = Date.now();
    const lastSharedAt = recentShares.get(throttleKey) || 0;

    if (recentShares.size > 2000) {
      recentShares.clear();
    }

    if (now - lastSharedAt < SHARE_COOLDOWN_MS) {
      return NextResponse.json({
        success: true,
        shareCount: article.shareCount || 0,
        counted: false,
      });
    }

    recentShares.set(throttleKey, now);
    const updated = await NewsArticle.findByIdAndUpdate(
      article._id,
      { $inc: { shareCount: 1 } },
      { returnDocument: "after" }
    ).select("shareCount");

    return NextResponse.json({
      success: true,
      shareCount: updated?.shareCount ?? (article.shareCount || 0) + 1,
      counted: true,
    });
  } catch (error) {
    console.error("POST /api/news/[slug]/share error:", error);
    return NextResponse.json(
      { error: "Không thể ghi nhận lượt chia sẻ" },
      { status: 500 }
    );
  }
}

