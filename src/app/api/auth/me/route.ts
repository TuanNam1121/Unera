import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { ACCOUNT_STATUS, AUTH_COOKIE_NAMES } from "@/constants";
import { getDevErrorDetails } from "@/lib/api-error";
import { connectToDatabase } from "@/lib/db";
import {
  ACCESS_TOKEN_MAX_AGE_SECONDS,
  clearAuthCookies,
  getAuthCookieOptions,
  setAuthCookies,
  signAccessToken,
  verifyAccessToken,
} from "@/lib/jwt";
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

    let syncedAccessToken: string | null = null;
    if (!rotatedTokens) {
      const cookieStore = await cookies();
      const rawAccessToken = cookieStore.get(
        AUTH_COOKIE_NAMES.ACCESS_TOKEN
      )?.value;
      const tokenPayload = rawAccessToken
        ? await verifyAccessToken(rawAccessToken)
        : null;

      if (
        tokenPayload &&
        (tokenPayload.role !== user.role ||
          tokenPayload.status !== user.status ||
          tokenPayload.isProfileCompleted !== user.isProfileCompleted ||
          tokenPayload.onboardingStep !== user.onboardingStep ||
          tokenPayload.name !== user.name ||
          tokenPayload.email !== user.email)
      ) {
        syncedAccessToken = await signAccessToken({
          sub: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          status: user.status,
          isProfileCompleted: user.isProfileCompleted,
          onboardingStep: user.onboardingStep,
        });
      }
    }

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
    } else if (syncedAccessToken) {
      res.cookies.set(
        AUTH_COOKIE_NAMES.ACCESS_TOKEN,
        syncedAccessToken,
        getAuthCookieOptions(ACCESS_TOKEN_MAX_AGE_SECONDS)
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
