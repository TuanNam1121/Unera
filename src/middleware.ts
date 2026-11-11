import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const { nextUrl } = req;
  const sessionToken =
    req.cookies.get("authjs.session-token")?.value ||
    req.cookies.get("__Secure-authjs.session-token")?.value;

  const isLoggedIn = !!sessionToken;

  // 1. Chuyển hướng người dùng đã đăng nhập nếu cố truy cập trang xác thực
  const isAuthRoute =
    nextUrl.pathname === "/login" ||
    nextUrl.pathname === "/register" ||
    nextUrl.pathname === "/forgot-password" ||
    nextUrl.pathname === "/reset-password";

  if (isAuthRoute && isLoggedIn) {
    return NextResponse.redirect(new URL("/explore", nextUrl.origin));
  }

  // 2. Bảo vệ phân hệ Quản trị viên (FR-AUTH-07, FR-AUTH-12)
  if (nextUrl.pathname.startsWith("/admin")) {
    if (!isLoggedIn) {
      const loginUrl = new URL("/login", nextUrl.origin);
      loginUrl.searchParams.set("callbackUrl", nextUrl.pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Áp dụng matcher cho mọi route ngoại trừ static files, images, favicon
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
