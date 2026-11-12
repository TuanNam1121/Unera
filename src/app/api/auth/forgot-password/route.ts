import { NextResponse } from "next/server";
import { ACCOUNT_STATUS } from "@/constants";
import { getDevErrorDetails } from "@/lib/api-error";
import { connectToDatabase } from "@/lib/db";
import { sendPasswordResetEmail } from "@/lib/email";
import { getAppBaseUrl } from "@/lib/jwt";
import {
  buildRateLimitResponse,
  checkRateLimit,
  getClientIp,
} from "@/lib/rate-limit";
import { generateSecureToken, hashToken } from "@/lib/tokens";
import { PasswordResetToken } from "@/models/PasswordResetToken";
import { User } from "@/models/User";
import { forgotPasswordSchema } from "@/validations";

const GENERIC_SUCCESS_MESSAGE =
  "Nếu địa chỉ email tồn tại trong hệ thống, liên kết khôi phục mật khẩu đã được gửi tới hộp thư của bạn.";

/**
 * POST /api/auth/forgot-password
 * Sinh token đặt lại mật khẩu (lưu SHA-256 hash trong DB, TTL 15 phút) và gửi email khôi phục
 */
export async function POST(req: Request) {
  try {
    const ip = getClientIp(req);
    const rate = checkRateLimit(`auth:forgot:${ip}`, 5, 15 * 60_000);
    if (!rate.allowed) {
      return buildRateLimitResponse(
        rate.retryAfterSeconds,
        "Bạn đã gửi quá nhiều yêu cầu khôi phục mật khẩu. Vui lòng thử lại sau."
      );
    }

    const body = await req.json();
    const parsed = forgotPasswordSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Email không hợp lệ" },
        { status: 400 }
      );
    }

    const { email } = parsed.data;
    await connectToDatabase();

    const user = await User.findOne({ email });
    if (!user || user.status === ACCOUNT_STATUS.DISABLED) {
      return NextResponse.json({
        success: true,
        message: GENERIC_SUCCESS_MESSAGE,
      });
    }

    // Gỡ index cũ `token_1` nếu tồn tại từ phiên bản trước để tránh xung đột unique null
    await PasswordResetToken.collection.dropIndex("token_1").catch(() => {});

    // Xóa các token khôi phục cũ chưa sử dụng của cùng user
    await PasswordResetToken.deleteMany({ userId: user._id });

    const rawToken = generateSecureToken(32);
    const tokenHash = hashToken(rawToken);
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    await PasswordResetToken.create({
      userId: user._id,
      email: user.email,
      tokenHash,
      expiresAt,
      usedAt: null,
    });

    const resetUrl = `${getAppBaseUrl()}/reset-password?token=${rawToken}`;
    const emailResult = await sendPasswordResetEmail({
      to: user.email,
      recipientName: user.name,
      resetUrl,
    });

    const isDev = process.env.NODE_ENV !== "production";

    return NextResponse.json({
      success: true,
      message: GENERIC_SUCCESS_MESSAGE,
      emailDelivered: emailResult.delivered,
      ...(isDev && !emailResult.delivered ? { debugResetLink: resetUrl } : {}),
    });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: "Lỗi máy chủ khi xử lý khôi phục mật khẩu", ...getDevErrorDetails(error) },
      { status: 500 }
    );
  }
}
