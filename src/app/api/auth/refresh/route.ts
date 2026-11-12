import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { AUTH_COOKIE_NAMES, USER_ROLES } from "@/constants";
import { getDevErrorDetails } from "@/lib/api-error";
import {
  clearAuthCookies,
  getAppBaseUrl,
  getSafeRedirectPath,
  setAuthCookies,
} from "@/lib/jwt";
import { resolveUserOnboardingState, rotateRefreshToken } from "@/lib/tokens";

async function extractRawRefreshToken(req: Request, parseBody = false): Promise<string | null> {
  const cookieStore = await cookies();
  const fromCookie = cookieStore.get(AUTH_COOKIE_NAMES.REFRESH_TOKEN)?.value;
  if (fromCookie) return fromCookie;

  if (parseBody) {
    try {
      const body = await req.json();
      if (typeof body?.refreshToken === "string" && body.refreshToken.trim()) {
        return body.refreshToken.trim();
      }
    } catch {
      // Body rỗng hoặc không phải JSON
    }
  }
  return null;
}

/**
 * POST /api/auth/refresh
 * Xoay vòng (rotate) Refresh Token và cấp cặp JWT Access + Refresh Token mới
 */
export async function POST(req: Request) {
  try {
    const rawRefreshToken = await extractRawRefreshToken(req, true);
    if (!rawRefreshToken) {
      const res = NextResponse.json(
        { error: "Thiếu Refresh Token hoặc phiên đăng nhập đã hết hạn." },
        { status: 401 }
      );
      clearAuthCookies(res);
      return res;
    }

    const result = await rotateRefreshToken({ rawRefreshToken, req });

    if (!result.ok) {
      const status = result.reason === "ACCOUNT_DISABLED" ? 403 : 401;
      const message =
        result.reason === "ACCOUNT_DISABLED"
          ? "Tài khoản của bạn đã bị vô hiệu hóa."
          : result.reason === "TOKEN_REUSED"
          ? "Phát hiện phiên đăng nhập bất thường. Vui lòng đăng nhập lại."
          : "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.";

      const res = NextResponse.json({ error: message, reason: result.reason }, { status });
      clearAuthCookies(res);
      return res;
    }

    const { isProfileCompleted, onboardingStep } = resolveUserOnboardingState(result.user);

    const res = NextResponse.json({
      success: true,
      accessToken: result.accessToken,
      user: {
        id: result.user._id.toString(),
        name: result.user.name,
        email: result.user.email,
        role: result.user.role,
        status: result.user.status,
        image: result.user.avatar || undefined,
        isProfileCompleted,
        onboardingStep,
      },
    });

    setAuthCookies(res, result.accessToken, result.refreshToken, result.rememberMe);
    return res;
  } catch (error: unknown) {
    return NextResponse.json(
      { error: "Không thể làm mới phiên đăng nhập", ...getDevErrorDetails(error) },
      { status: 500 }
    );
  }
}

/**
 * GET /api/auth/refresh?redirect=...
 * Dùng khi proxy.ts phát hiện Access Token hết hạn nhưng còn Refresh Token trong trình duyệt
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const requestedRedirect = getSafeRedirectPath(searchParams.get("redirect"), "/");
  const baseUrl = getAppBaseUrl();

  const rawRefreshToken = await extractRawRefreshToken(req, false);
  if (!rawRefreshToken) {
    const loginUrl = new URL("/login", baseUrl);
    loginUrl.searchParams.set("callbackUrl", requestedRedirect);
    const res = NextResponse.redirect(loginUrl);
    clearAuthCookies(res);
    return res;
  }

  const result = await rotateRefreshToken({ rawRefreshToken, req });
  if (!result.ok) {
    const loginUrl = new URL("/login", baseUrl);
    loginUrl.searchParams.set("callbackUrl", requestedRedirect);
    if (result.reason === "ACCOUNT_DISABLED") {
      loginUrl.searchParams.set("error", "AccountDisabled");
    }
    const res = NextResponse.redirect(loginUrl);
    clearAuthCookies(res);
    return res;
  }

  const { isProfileCompleted } = resolveUserOnboardingState(result.user);
  let targetPath = requestedRedirect;

  if (!isProfileCompleted && result.user.role !== USER_ROLES.ADMIN) {
    targetPath = "/register/complete-profile";
  } else if (
    requestedRedirect.startsWith("/admin") &&
    result.user.role !== USER_ROLES.ADMIN
  ) {
    targetPath = "/";
  } else if (
    requestedRedirect === "/login" ||
    requestedRedirect === "/register" ||
    requestedRedirect === "/forgot-password" ||
    requestedRedirect === "/reset-password"
  ) {
    targetPath = "/";
  }

  const res = NextResponse.redirect(new URL(targetPath, baseUrl));
  setAuthCookies(res, result.accessToken, result.refreshToken, result.rememberMe);
  return res;
}

