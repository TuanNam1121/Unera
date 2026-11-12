import { NextResponse } from "next/server";
import { getDevErrorDetails } from "@/lib/api-error";
import { connectToDatabase } from "@/lib/db";
import { hashToken } from "@/lib/tokens";
import { PasswordResetToken } from "@/models/PasswordResetToken";

/**
 * GET /api/auth/reset-password/verify?token=...
 * Kiểm tra tính hợp lệ và hạn dùng của token khôi phục trước khi người dùng nhập mật khẩu mới
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const rawToken = searchParams.get("token")?.trim();

    if (!rawToken) {
      return NextResponse.json(
        {
          valid: false,
          error: "Thiếu mã token khôi phục mật khẩu.",
        },
        { status: 400 }
      );
    }

    await connectToDatabase();
    const tokenHash = hashToken(rawToken);
    const tokenDoc = await PasswordResetToken.findOne({ tokenHash }).lean();

    if (!tokenDoc) {
      return NextResponse.json(
        {
          valid: false,
          error: "Liên kết đặt lại mật khẩu không hợp lệ hoặc đã được sử dụng.",
        },
        { status: 400 }
      );
    }

    if (tokenDoc.usedAt || tokenDoc.expiresAt.getTime() <= Date.now()) {
      return NextResponse.json(
        {
          valid: false,
          error: "Liên kết đặt lại mật khẩu đã hết hạn hoặc đã được sử dụng.",
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      valid: true,
    });
  } catch (error: unknown) {
    return NextResponse.json(
      { valid: false, error: "Không thể xác minh liên kết khôi phục", ...getDevErrorDetails(error) },
      { status: 500 }
    );
  }
}

