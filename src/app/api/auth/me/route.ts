import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { ACCOUNT_STATUS, AUTH_COOKIE_NAMES } from "@/constants";
import { getDevErrorDetails } from "@/lib/api-error";
import { connectToDatabase } from "@/lib/db";
import { clearAuthCookies, setAuthCookies } from "@/lib/jwt";
import { getCurrentUser } from "@/lib/session";
import { resolveUserOnboardingState, rotateRefreshToken } from "@/lib/tokens";
import { StudentProfile } from "@/models/StudentProfile";

/**
 * GET /api/auth/me
 * Lấy thông tin người dùng hiện tại; tự động làm mới bằng Refresh Token nếu Access Token vừa hết hạn
 */
export async function GET(req: Request) {
  try {
    let user = await getCurrentUser(req);
    let rotatedTokens: {
      accessToken: string;
      refreshToken: string;
      rememberMe: boolean;
    } | null = null;

    if (!user) {
      const cookieStore = await cookies();
      const rawRefreshToken = cookieStore.get(
        AUTH_COOKIE_NAMES.REFRESH_TOKEN
      )?.value;

      if (rawRefreshToken) {
        const rotated = await rotateRefreshToken({ rawRefreshToken, req });
        if (rotated.ok) {
          const { isProfileCompleted, onboardingStep } =
            resolveUserOnboardingState(rotated.user);
          user = {
            id: rotated.user._id.toString(),
            name: rotated.user.name,
            email: rotated.user.email,
            role: rotated.user.role,
            status: rotated.user.status,
            image: rotated.user.avatar || undefined,
            isProfileCompleted,
            onboardingStep,
          };
          rotatedTokens = {
            accessToken: rotated.accessToken,
            refreshToken: rotated.refreshToken,
            rememberMe: rotated.rememberMe,
          };
        } else {
          const expiredRes = NextResponse.json(
            { authenticated: false, user: null },
            { status: 401 }
          );
          clearAuthCookies(expiredRes);
          return expiredRes;
        }
      }
    }

    if (!user) {
      return NextResponse.json(
        { authenticated: false, user: null },
        { status: 401 }
      );
    }

    if (user.status === ACCOUNT_STATUS.DISABLED) {
      const disabledRes = NextResponse.json(
        {
          error:
            "Tài khoản của bạn đã bị vô hiệu hóa. Vui lòng liên hệ ban quản trị.",
          status: ACCOUNT_STATUS.DISABLED,
        },
        { status: 403 }
      );
      clearAuthCookies(disabledRes);
      return disabledRes;
    }

    await connectToDatabase();
    const profile = await StudentProfile.findOne({ userId: user.id }).lean();

    const res = NextResponse.json({
      authenticated: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        image: user.image,
        isProfileCompleted: user.isProfileCompleted,
        onboardingStep: user.onboardingStep,
      },
      profile: profile || null,
    });

    if (rotatedTokens) {
      setAuthCookies(
        res,
        rotatedTokens.accessToken,
        rotatedTokens.refreshToken,
        rotatedTokens.rememberMe
      );
    }

    return res;
  } catch (error) {
    return NextResponse.json(
      { error: "Không thể lấy thông tin người dùng", ...getDevErrorDetails(error) },
      { status: 500 }
    );
  }
}
