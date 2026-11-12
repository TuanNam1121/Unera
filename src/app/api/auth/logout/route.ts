import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { AUTH_COOKIE_NAMES } from "@/constants";
import { clearAuthCookies } from "@/lib/jwt";
import { getCurrentUser } from "@/lib/session";
import { revokeRefreshToken } from "@/lib/tokens";
import { logUserActivity } from "@/lib/user-activity-log";

/**
 * POST /api/auth/logout
 * Thu hồi Refresh Token hiện tại trong MongoDB và xóa Auth cookies
 */
export async function POST(req: Request) {
  try {
    const currentUser = await getCurrentUser(req).catch(() => null);
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

    if (currentUser) {
      await logUserActivity({
        req,
        actorId: currentUser.id,
        actorEmail: currentUser.email,
        actorName: currentUser.name,
        actorRole: currentUser.role,
        category: "AUTH",
        action: "LOGOUT",
        description: `Đăng xuất khỏi hệ thống (${currentUser.email})`,
        status: "SUCCESS",
        statusCode: 200,
        targetCollection: "users",
        targetId: currentUser.id,
        targetTitle: currentUser.name,
      });
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

