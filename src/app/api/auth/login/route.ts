import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { ACCOUNT_STATUS, AUTH_PROVIDERS } from "@/constants";
import { getDevErrorDetails } from "@/lib/api-error";
import { connectToDatabase } from "@/lib/db";
import { getPostAuthRedirectPath, setAuthCookies } from "@/lib/jwt";
import {
  buildRateLimitResponse,
  checkRateLimit,
  getClientIp,
} from "@/lib/rate-limit";
import { issueTokenPair, resolveUserOnboardingState } from "@/lib/tokens";
import { User } from "@/models/User";
import { loginSchema } from "@/validations";

/**
 * POST /api/auth/login
 * Đăng nhập bằng Email & Mật khẩu, cấp JWT Access Token + Refresh Token (HttpOnly Cookie + Bearer)
 */
export async function POST(req: Request) {
  try {
    const ip = getClientIp(req);
    const rate = checkRateLimit(`auth:login:${ip}`, 15, 5 * 60_000);
    if (!rate.allowed) {
      return buildRateLimitResponse(
        rate.retryAfterSeconds,
        "Bạn đã thử đăng nhập quá nhiều lần. Vui lòng thử lại sau ít phút."
      );
    }

    const body = await req.json();
    const parsed = loginSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: parsed.error.issues[0]?.message || "Thông tin đăng nhập không hợp lệ",
          details: parsed.error.issues.map((issue) => issue.message),
        },
        { status: 400 }
      );
    }

    const { email, password, rememberMe = false } = parsed.data;
    const requestedCallback =
      typeof body?.callbackUrl === "string" ? body.callbackUrl : null;

    await connectToDatabase();

    const user = await User.findOne({ email });
    if (!user) {
      return NextResponse.json(
        { error: "Email hoặc mật khẩu không chính xác." },
        { status: 401 }
      );
    }

    if (user.status === ACCOUNT_STATUS.DISABLED) {
      return NextResponse.json(
        { error: "Tài khoản của bạn đã bị vô hiệu hóa. Vui lòng liên hệ quản trị viên." },
        { status: 403 }
      );
    }

    if (!user.password) {
      return NextResponse.json(
        {
          error:
            "Tài khoản này sử dụng đăng nhập Google. Vui lòng chọn 'Đăng nhập bằng Google' hoặc đặt mật khẩu mới qua chức năng Quên mật khẩu.",
        },
        { status: 400 }
      );
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: "Email hoặc mật khẩu không chính xác." },
        { status: 401 }
      );
    }

    const existingProviders = Array.isArray(user.authProviders) ? user.authProviders : [];
    if (!existingProviders.includes(AUTH_PROVIDERS.CREDENTIALS)) {
      user.authProviders = [...existingProviders, AUTH_PROVIDERS.CREDENTIALS];
    }
    user.lastLoginAt = new Date();
    await user.save();

    const { accessToken, refreshToken } = await issueTokenPair({
      user,
      rememberMe,
      req,
    });

    const { isProfileCompleted, onboardingStep } = resolveUserOnboardingState(user);
    const redirectTo = getPostAuthRedirectPath({
      isProfileCompleted,
      onboardingStep,
      role: user.role,
      callbackUrl: requestedCallback,
    });

    const response = NextResponse.json({
      success: true,
      message: "Đăng nhập thành công!",
      redirectTo,
      accessToken,
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        image: user.avatar || undefined,
        isProfileCompleted,
        onboardingStep,
      },
    });

    setAuthCookies(response, accessToken, refreshToken, rememberMe);
    return response;
  } catch (error: unknown) {
    return NextResponse.json(
      { error: "Không thể xử lý đăng nhập lúc này", ...getDevErrorDetails(error) },
      { status: 500 }
    );
  }
}

