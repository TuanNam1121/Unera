import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { ACCOUNT_STATUS, AUTH_COOKIE_NAMES, USER_ROLES } from "@/constants";
import {
  clearAuthCookies,
  getPostAuthRedirectPath,
  verifyAccessToken,
} from "@/lib/jwt";

const AUTH_ENTRY_PATHS = new Set(["/login", "/register", "/forgot-password"]);
const COMPLETE_PROFILE_PATH = "/register/complete-profile";
const PROTECTED_USER_PATHS = new Set([
  "/profile",
  "/onboarding",
  "/roadmap",
  "/register/complete-profile",
]);

function isProtectedPath(pathname: string): boolean {
  if (pathname.startsWith("/admin")) return true;
  if (pathname.startsWith("/onboarding/")) return true;
  if (pathname.startsWith("/roadmap/")) return true;
  if (
    pathname === "/tools/cv-builder" ||
    pathname.startsWith("/tools/cv-builder/")
  ) {
    return true;
  }
  return PROTECTED_USER_PATHS.has(pathname);
}

export async function proxy(req: NextRequest) {
  const { pathname, search } = req.nextUrl;

  if (pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  // Không kích hoạt xoay vòng Refresh Token cho background prefetch của Next.js Router
  const isPrefetch =
    req.headers.get("next-router-prefetch") === "1" ||
    req.headers.get("purpose") === "prefetch";

  const rawAccessToken = req.cookies.get(AUTH_COOKIE_NAMES.ACCESS_TOKEN)?.value;
  const rawRefreshToken = req.cookies.get(AUTH_COOKIE_NAMES.REFRESH_TOKEN)?.value;

  const accessPayload = rawAccessToken
    ? await verifyAccessToken(rawAccessToken)
    : null;

  // 1. Trường hợp Access Token hợp lệ
  if (accessPayload) {
    if (accessPayload.status === ACCOUNT_STATUS.DISABLED) {
      const loginUrl = new URL("/login", req.url);
      loginUrl.searchParams.set("error", "AccountDisabled");
      const res = NextResponse.redirect(loginUrl);
      clearAuthCookies(res);
      return res;
    }

    const mustCompleteProfile =
      !accessPayload.isProfileCompleted &&
      accessPayload.role !== USER_ROLES.ADMIN;

    // Sinh viên chưa hoàn thiện hồ sơ Bước 2 bắt buộc điền thông tin trước khi dùng ứng dụng
    if (mustCompleteProfile) {
      if (pathname !== COMPLETE_PROFILE_PATH) {
        return NextResponse.redirect(new URL(COMPLETE_PROFILE_PATH, req.url));
      }
      return NextResponse.next();
    }

    // Đã hoàn thiện hồ sơ: không quay lại các trang login/register/complete-profile
    if (AUTH_ENTRY_PATHS.has(pathname) || pathname === COMPLETE_PROFILE_PATH) {
      const target = getPostAuthRedirectPath({
        isProfileCompleted: accessPayload.isProfileCompleted,
        onboardingStep: accessPayload.onboardingStep,
        role: accessPayload.role,
      });
      return NextResponse.redirect(new URL(target, req.url));
    }

    // Bảo vệ khu vực Quản trị viên
    if (
      pathname.startsWith("/admin") &&
      accessPayload.role !== USER_ROLES.ADMIN
    ) {
      return NextResponse.redirect(new URL("/", req.url));
    }

    return NextResponse.next();
  }

  // 2. Access Token thiếu hoặc hết hạn, nhưng còn Refresh Token trên trình duyệt
  if (rawRefreshToken && req.method === "GET" && !isPrefetch) {
    if (isProtectedPath(pathname) || AUTH_ENTRY_PATHS.has(pathname)) {
      const refreshUrl = new URL("/api/auth/refresh", req.url);
      refreshUrl.searchParams.set("redirect", `${pathname}${search}`);
      return NextResponse.redirect(refreshUrl);
    }
  }

  // 3. Chưa đăng nhập mà truy cập route được bảo vệ
  if (isProtectedPath(pathname)) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", `${pathname}${search}`);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ttf|woff|woff2)$).*)",
  ],
};

