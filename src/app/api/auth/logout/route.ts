import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { AUTH_COOKIE_NAMES } from "@/constants";
import { clearAuthCookies } from "@/lib/jwt";
import { revokeRefreshToken } from "@/lib/tokens";

/**
 * POST /api/auth/logout
 * Thu hồi Refresh Token hiện tại trong MongoDB và xóa Auth cookies
 */
export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    let rawRefreshToken =
      cookieStore.get(AUTH_COOKIE_NAMES.REFRESH_TOKEN)?.value || "";

    if (!rawRefreshToken) {
      try {
        const body = await req.json();
        if (typeof body?.refreshToken === "string") {
          rawRefreshToken = body.refreshToken.trim();
        }
      } catch {
        // Không có JSON body
      }
    }

    if (rawRefreshToken) {
      await revokeRefreshToken(rawRefreshToken);
    }

    const res = NextResponse.json({
      success: true,
      message: "Đã đăng xuất thành công.",
    });
    clearAuthCookies(res);
    return res;
  } catch {
    const res = NextResponse.json({
      success: true,
      message: "Đã đăng xuất.",
    });
    clearAuthCookies(res);
    return res;
  }
}

