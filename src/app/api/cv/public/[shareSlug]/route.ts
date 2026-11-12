import { NextResponse } from "next/server";
import { serializePublicCv } from "@/lib/cv-service";
import { connectToDatabase } from "@/lib/db";
import { CvDocument } from "@/models/CvDocument";

interface RouteContext {
  params: Promise<{ shareSlug: string }>;
}

/**
 * GET /api/cv/public/[shareSlug]
 * Lấy dữ liệu CV công khai (Public, không cần đăng nhập), chỉ trả khi isPublic === true
 */
export async function GET(req: Request, context: RouteContext) {
  try {
    const { shareSlug } = await context.params;
    const normalizedSlug = shareSlug.trim();

    if (!normalizedSlug || normalizedSlug.length > 100) {
      return NextResponse.json(
        { error: "Liên kết chia sẻ CV không hợp lệ." },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const { searchParams } = new URL(req.url);
    const shouldCountView = searchParams.get("trackView") !== "0";

    const doc = shouldCountView
      ? await CvDocument.findOneAndUpdate(
          {
            "sharing.shareSlug": normalizedSlug,
            "sharing.isPublic": true,
          },
          { $inc: { "sharing.viewCount": 1 } },
          { returnDocument: "after" }
        ).lean()
      : await CvDocument.findOne({
          "sharing.shareSlug": normalizedSlug,
          "sharing.isPublic": true,
        }).lean();

    if (!doc) {
      return NextResponse.json(
        { error: "CV này hiện ở chế độ riêng tư hoặc không tồn tại." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      cv: serializePublicCv(doc),
    });
  } catch (error) {
    const msg =
      error instanceof Error ? error.message : "Không thể tải CV công khai";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

