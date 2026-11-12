import { NextRequest, NextResponse } from "next/server";
import { CONTENT_TARGET_COLLECTIONS } from "@/constants";
import { logAuditAction } from "@/lib/audit";
import { handleAuthError, requireAdmin } from "@/lib/session";
import { promoteDueScheduledNews } from "@/lib/news";
import { Types } from "mongoose";

export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdmin(req);
    const publishedCount = await promoteDueScheduledNews();

    if (publishedCount > 0) {
      await logAuditAction({
        admin,
        action: "STATUS_CHANGE",
        targetCollection: CONTENT_TARGET_COLLECTIONS.NEWS_ARTICLES,
        targetId: new Types.ObjectId(admin.id),
        targetTitle: `Xuất bản tự động ${publishedCount} bài viết hẹn giờ`,
        changesAfter: { promotedCount: publishedCount },
        req,
      });
    }

    return NextResponse.json({
      success: true,
      promotedCount: publishedCount,
      message:
        publishedCount > 0
          ? `Đã tự động xuất bản ${publishedCount} bài viết đến lịch`
          : "Không có bài viết nào đến hạn xuất bản",
    });
  } catch (error) {
    return handleAuthError(error);
  }
}

