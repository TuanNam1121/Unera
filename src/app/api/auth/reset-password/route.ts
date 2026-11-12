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
import { logUserActivity } from "@/lib/user-activity-log";
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
      await logUserActivity({
        req,
        actorRole: "GUEST",
        category: "AUTH",
        action: "PASSWORD_RESET_BLOCKED",
        description: `Bị chặn đặt lại mật khẩu do vượt ngưỡng tần suất (${ip})`,
        status: "BLOCKED",
        severity: "HIGH",
        statusCode: 429,
        errorMessage: "Rate limit exceeded",
      });
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
      await logUserActivity({
        req,
        actorRole: "GUEST",
        category: "AUTH",
        action: "PASSWORD_RESET_FAILED",
        description: "Đặt lại mật khẩu thất bại: token không hợp lệ hoặc đã dùng",
        status: "FAILED",
        severity: "WARN",
        statusCode: 400,
        errorMessage: "Invalid reset token",
      });
      return NextResponse.json(
        { error: "Liên kết khôi phục mật khẩu không hợp lệ hoặc đã được sử dụng." },
        { status: 400 }
      );
    }

    if (resetDoc.usedAt || resetDoc.expiresAt.getTime() <= Date.now()) {
      await PasswordResetToken.deleteOne({ _id: resetDoc._id });
      await logUserActivity({
        req,
        actorId: resetDoc.userId,
        actorEmail: resetDoc.email,
        actorRole: "STUDENT",
        category: "AUTH",
        action: "PASSWORD_RESET_FAILED",
        description: `Đặt lại mật khẩu thất bại cho ${resetDoc.email}: liên kết đã hết hạn`,
        status: "FAILED",
        severity: "INFO",
        statusCode: 400,
        errorMessage: "Reset token expired",
      });
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

    await logUserActivity({
      req,
      actorId: user._id,
      actorEmail: user.email,
      actorName: user.name,
      actorRole: user.role,
      category: "AUTH",
      action: "PASSWORD_RESET_COMPLETE",
      description: `Đặt lại mật khẩu thành công cho ${user.email}`,
      status: "SUCCESS",
      statusCode: 200,
      targetCollection: "users",
      targetId: user._id,
      targetTitle: user.name,
    });

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
