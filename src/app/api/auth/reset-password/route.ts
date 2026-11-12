import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { ACCOUNT_STATUS, AUTH_PROVIDERS } from "@/constants";
import { getDevErrorDetails } from "@/lib/api-error";
import { connectToDatabase } from "@/lib/db";
import { clearAuthCookies } from "@/lib/jwt";
import {
  buildRateLimitResponse,
  checkRateLimit,
  getClientIp,
} from "@/lib/rate-limit";
import { hashToken, revokeAllUserRefreshTokens } from "@/lib/tokens";
import { PasswordResetToken } from "@/models/PasswordResetToken";
import { User } from "@/models/User";
import { resetPasswordSchema } from "@/validations";

/**
 * POST /api/auth/reset-password
 * Xác thực token 1 lần, cập nhật mật khẩu mới và thu hồi toàn bộ phiên Refresh Token hiện có
 */
export async function POST(req: Request) {
  try {
    const ip = getClientIp(req);
    const rate = checkRateLimit(`auth:reset:${ip}`, 10, 15 * 60_000);
    if (!rate.allowed) {
      return buildRateLimitResponse(
        rate.retryAfterSeconds,
        "Bạn đã thử đặt lại mật khẩu quá nhiều lần. Vui lòng thử lại sau."
      );
    }

    const body = await req.json();
    const parsed = resetPasswordSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Dữ liệu không hợp lệ" },
        { status: 400 }
      );
    }

    const { token, password } = parsed.data;
    await connectToDatabase();

    const tokenHash = hashToken(token.trim());
    const resetDoc = await PasswordResetToken.findOne({ tokenHash });

    if (!resetDoc) {
      return NextResponse.json(
        { error: "Liên kết khôi phục mật khẩu không hợp lệ hoặc đã được sử dụng." },
        { status: 400 }
      );
    }

    if (resetDoc.usedAt || resetDoc.expiresAt.getTime() <= Date.now()) {
      await PasswordResetToken.deleteOne({ _id: resetDoc._id });
      return NextResponse.json(
        { error: "Liên kết khôi phục mật khẩu đã hết hạn. Vui lòng gửi yêu cầu mới." },
        { status: 400 }
      );
    }

    const user = await User.findById(resetDoc.userId);
    if (!user) {
      return NextResponse.json(
        { error: "Tài khoản không tồn tại." },
        { status: 404 }
      );
    }

    if (user.status === ACCOUNT_STATUS.DISABLED) {
      return NextResponse.json(
        { error: "Tài khoản này đang bị vô hiệu hóa." },
        { status: 403 }
      );
    }

    user.password = await bcrypt.hash(password, 12);
    const providers = Array.isArray(user.authProviders) ? user.authProviders : [];
    if (!providers.includes(AUTH_PROVIDERS.CREDENTIALS)) {
      user.authProviders = [...providers, AUTH_PROVIDERS.CREDENTIALS];
    }
    await user.save();

    // Đánh dấu đã sử dụng & xóa các token khôi phục của người dùng
    resetDoc.usedAt = new Date();
    await resetDoc.save();
    await PasswordResetToken.deleteMany({ userId: user._id });

    // Thu hồi toàn bộ Refresh Token đang hoạt động để bảo mật tài khoản sau khi đổi mật khẩu
    await revokeAllUserRefreshTokens(user._id.toString());

    const res = NextResponse.json({
      success: true,
      message: "Đặt lại mật khẩu thành công! Vui lòng đăng nhập lại với mật khẩu mới.",
    });
    clearAuthCookies(res);
    return res;
  } catch (error: unknown) {
    return NextResponse.json(
      { error: "Lỗi máy chủ khi đặt lại mật khẩu", ...getDevErrorDetails(error) },
      { status: 500 }
    );
  }
}
