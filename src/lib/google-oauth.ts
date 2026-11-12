import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  ACCOUNT_STATUS,
  AUTH_COOKIE_NAMES,
  AUTH_PROVIDERS,
  ONBOARDING_STEPS,
  USER_ROLES,
} from "@/constants";
import { connectToDatabase } from "@/lib/db";
import {
  getAppBaseUrl,
  getPostAuthRedirectPath,
  getSafeRedirectPath,
  setAuthCookies,
} from "@/lib/jwt";
import {
  generateSecureToken,
  issueTokenPair,
  resolveUserOnboardingState,
} from "@/lib/tokens";
import { logUserActivity } from "@/lib/user-activity-log";
import { StudentProfile } from "@/models/StudentProfile";
import { User } from "@/models/User";

interface GoogleOAuthStateCookie {
  nonce: string;
  callbackUrl: string;
}

interface GoogleUserInfo {
  sub: string;
  email?: string;
  email_verified?: boolean;
  name?: string;
  picture?: string;
}

export function isGoogleOAuthConfigured(): boolean {
  return Boolean(
    process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
  );
}

export function getGoogleRedirectUri(): string {
  if (process.env.GOOGLE_REDIRECT_URI) {
    return process.env.GOOGLE_REDIRECT_URI;
  }
  return `${getAppBaseUrl()}/api/auth/google/callback`;
}

function redirectToLoginWithError(errorCode: string): NextResponse {
  const loginUrl = new URL("/login", getAppBaseUrl());
  loginUrl.searchParams.set("error", errorCode);
  return NextResponse.redirect(loginUrl);
}

export async function createGoogleAuthRedirectResponse(
  rawCallbackUrl?: string | null
): Promise<NextResponse> {
  if (!isGoogleOAuthConfigured()) {
    return redirectToLoginWithError("GoogleOAuthNotConfigured");
  }

  const nonce = generateSecureToken(24);
  const callbackUrl = getSafeRedirectPath(rawCallbackUrl, "/");

  const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  authUrl.searchParams.set("client_id", process.env.GOOGLE_CLIENT_ID!);
  authUrl.searchParams.set("redirect_uri", getGoogleRedirectUri());
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("scope", "openid email profile");
  authUrl.searchParams.set("access_type", "offline");
  authUrl.searchParams.set("prompt", "select_account");
  authUrl.searchParams.set("state", nonce);

  const response = NextResponse.redirect(authUrl);
  response.cookies.set(
    AUTH_COOKIE_NAMES.OAUTH_STATE,
    JSON.stringify({ nonce, callbackUrl }),
    {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 600,
    }
  );

  return response;
}

export async function handleGoogleOAuthCallback(
  req: Request
): Promise<NextResponse> {
  if (!isGoogleOAuthConfigured()) {
    return redirectToLoginWithError("GoogleOAuthNotConfigured");
  }

  const { searchParams } = new URL(req.url);
  const oauthError = searchParams.get("error");
  const code = searchParams.get("code");
  const state = searchParams.get("state");

  const cookieStore = await cookies();
  const rawStateCookie = cookieStore.get(AUTH_COOKIE_NAMES.OAUTH_STATE)?.value;

  const clearStateCookie = (res: NextResponse) => {
    res.cookies.set(AUTH_COOKIE_NAMES.OAUTH_STATE, "", {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 0,
    });
    return res;
  };

  if (oauthError) {
    return clearStateCookie(redirectToLoginWithError("GoogleOAuthCancelled"));
  }

  if (!code || !state || !rawStateCookie) {
    return clearStateCookie(redirectToLoginWithError("GoogleOAuthStateInvalid"));
  }

  let parsedState: GoogleOAuthStateCookie;
  try {
    parsedState = JSON.parse(rawStateCookie) as GoogleOAuthStateCookie;
  } catch {
    return clearStateCookie(redirectToLoginWithError("GoogleOAuthStateInvalid"));
  }

  if (!parsedState.nonce || parsedState.nonce !== state) {
    return clearStateCookie(redirectToLoginWithError("GoogleOAuthStateInvalid"));
  }

  try {
    // 1. Trao đổi authorization code lấy access token từ Google
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        redirect_uri: getGoogleRedirectUri(),
        grant_type: "authorization_code",
      }),
    });

    if (!tokenRes.ok) {
      return clearStateCookie(redirectToLoginWithError("GoogleOAuthTokenFailed"));
    }

    const tokenData = (await tokenRes.json()) as { access_token?: string };
    if (!tokenData.access_token) {
      return clearStateCookie(redirectToLoginWithError("GoogleOAuthTokenFailed"));
    }

    // 2. Lấy thông tin hồ sơ người dùng từ Google UserInfo endpoint
    const userInfoRes = await fetch(
      "https://www.googleapis.com/oauth2/v3/userinfo",
      {
        headers: {
          Authorization: `Bearer ${tokenData.access_token}`,
        },
      }
    );

    if (!userInfoRes.ok) {
      return clearStateCookie(redirectToLoginWithError("GoogleOAuthProfileFailed"));
    }

    const googleProfile = (await userInfoRes.json()) as GoogleUserInfo;
    if (
      !googleProfile.sub ||
      !googleProfile.email ||
      googleProfile.email_verified === false
    ) {
      return clearStateCookie(redirectToLoginWithError("GoogleEmailNotVerified"));
    }

    const normalizedEmail = googleProfile.email.trim().toLowerCase();
    const displayName =
      googleProfile.name?.trim() || normalizedEmail.split("@")[0] || "Sinh viên UNERA";

    await connectToDatabase();

    let user = await User.findOne({
      $or: [{ googleId: googleProfile.sub }, { email: normalizedEmail }],
    });
    const isNewUser = !user;

    if (user) {
      if (user.status === ACCOUNT_STATUS.DISABLED) {
        await logUserActivity({
          req,
          actorId: user._id,
          actorEmail: user.email,
          actorName: user.name,
          actorRole: user.role,
          category: "AUTH",
          action: "LOGIN_GOOGLE_BLOCKED",
          description: `Từ chối đăng nhập Google do tài khoản ${user.email} bị vô hiệu hóa`,
          status: "BLOCKED",
          severity: "HIGH",
          statusCode: 403,
          errorMessage: "AccountDisabled",
          targetCollection: "users",
          targetId: user._id,
          targetTitle: user.name,
        });
        return clearStateCookie(redirectToLoginWithError("AccountDisabled"));
      }

      const providers = Array.isArray(user.authProviders) ? user.authProviders : [];
      if (!providers.includes(AUTH_PROVIDERS.GOOGLE)) {
        user.authProviders = [...providers, AUTH_PROVIDERS.GOOGLE];
      }
      if (!user.googleId) {
        user.googleId = googleProfile.sub;
      }
      if (!user.avatar && googleProfile.picture) {
        user.avatar = googleProfile.picture;
      }
      if (!user.emailVerified) {
        user.emailVerified = new Date();
      }
      user.lastLoginAt = new Date();
      await user.save();

      const existingProfile = await StudentProfile.findOne({
        userId: user._id.toString(),
      });
      if (!existingProfile) {
        await StudentProfile.create({
          userId: user._id.toString(),
          fullName: user.name || displayName,
          avatar: user.avatar,
          developmentGoals: {
            studyAbroad: false,
            employment: false,
            scientificResearch: false,
            startup: false,
            personalGrowth: false,
          },
          skills: [],
          achievements: [],
        });
      }
    } else {
      // Tự động đăng ký tài khoản mới cho Gmail chưa tồn tại và chuyển thẳng đến Bước 2 (Complete Profile)
      user = await User.create({
        name: displayName,
        email: normalizedEmail,
        role: USER_ROLES.STUDENT,
        status: ACCOUNT_STATUS.ACTIVE,
        avatar: googleProfile.picture,
        authProviders: [AUTH_PROVIDERS.GOOGLE],
        googleId: googleProfile.sub,
        isProfileCompleted: false,
        onboardingStep: ONBOARDING_STEPS.PROFILE,
        emailVerified: new Date(),
        lastLoginAt: new Date(),
      });

      await StudentProfile.create({
        userId: user._id.toString(),
        fullName: displayName,
        avatar: googleProfile.picture,
        developmentGoals: {
          studyAbroad: false,
          employment: false,
          scientificResearch: false,
          startup: false,
          personalGrowth: false,
        },
        skills: [],
        achievements: [],
      });
    }

    const { accessToken, refreshToken } = await issueTokenPair({
      user,
      rememberMe: true,
      req,
    });

    const { isProfileCompleted, onboardingStep } = resolveUserOnboardingState(user);
    const targetPath = getPostAuthRedirectPath({
      isProfileCompleted,
      onboardingStep,
      role: user.role,
      callbackUrl: parsedState.callbackUrl,
    });

    const response = NextResponse.redirect(new URL(targetPath, getAppBaseUrl()));
    setAuthCookies(response, accessToken, refreshToken, true);

    await logUserActivity({
      req,
      actorId: user._id,
      actorEmail: user.email,
      actorName: user.name,
      actorRole: user.role,
      category: "AUTH",
      action: "LOGIN_GOOGLE_SUCCESS",
      description: isNewUser
        ? `Đăng ký & đăng nhập mới bằng Google (${user.email})`
        : `Đăng nhập thành công bằng Google (${user.email})`,
      status: "SUCCESS",
      statusCode: 302,
      targetCollection: "users",
      targetId: user._id,
      targetTitle: user.name,
      metadata: { isNewUser, redirectTo: targetPath },
    });

    return clearStateCookie(response);
  } catch (error) {
    console.error("[Google OAuth Error]", error);
    return clearStateCookie(redirectToLoginWithError("GoogleOAuthServerError"));
  }
}

