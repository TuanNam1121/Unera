import { SignJWT, jwtVerify } from "jose";
import { NextResponse } from "next/server";
import {
  ACCOUNT_STATUS,
  AUTH_COOKIE_NAMES,
  AccountStatus,
  ONBOARDING_STEPS,
  OnboardingStep,
  USER_ROLES,
  UserRole,
} from "@/constants";

export const ACCESS_TOKEN_EXPIRES_IN = "15m";
export const ACCESS_TOKEN_MAX_AGE_SECONDS = 15 * 60;
export const REFRESH_TOKEN_MAX_AGE_SHORT_SECONDS = 7 * 24 * 60 * 60;
export const REFRESH_TOKEN_MAX_AGE_REMEMBER_SECONDS = 30 * 24 * 60 * 60;

export interface AccessTokenPayload {
  sub: string;
  email: string;
  name: string;
  role: UserRole;
  status: AccountStatus;
  isProfileCompleted: boolean;
  onboardingStep: OnboardingStep;
  type: "access";
}

export interface RefreshTokenPayload {
  sub: string;
  familyId: string;
  jti: string;
  type: "refresh";
}

function getBaseSecret(): string {
  const secret =
    process.env.JWT_ACCESS_SECRET?.trim() ||
    process.env.NEXTAUTH_SECRET?.trim() ||
    process.env.AUTH_SECRET?.trim();

  if (secret) {
    return secret;
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "Thiếu biến môi trường JWT_ACCESS_SECRET (hoặc AUTH_SECRET / NEXTAUTH_SECRET) trong môi trường production."
    );
  }

  return "unera-dev-access-secret-key-2026";
}

function getAccessSecretKey(): Uint8Array {
  return new TextEncoder().encode(getBaseSecret());
}

function getRefreshSecretKey(): Uint8Array {
  const refreshSecret =
    process.env.JWT_REFRESH_SECRET?.trim() ||
    `${getBaseSecret()}::unera-refresh-secret`;
  return new TextEncoder().encode(refreshSecret);
}

export async function signAccessToken(
  payload: Omit<AccessTokenPayload, "type">
): Promise<string> {
  return new SignJWT({
    email: payload.email,
    name: payload.name,
    role: payload.role,
    status: payload.status,
    isProfileCompleted: payload.isProfileCompleted,
    onboardingStep: payload.onboardingStep,
    type: "access",
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime(ACCESS_TOKEN_EXPIRES_IN)
    .sign(getAccessSecretKey());
}

export async function verifyAccessToken(token: string): Promise<AccessTokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getAccessSecretKey(), {
      algorithms: ["HS256"],
    });

    if (
      payload.type !== "access" ||
      typeof payload.sub !== "string" ||
      typeof payload.email !== "string"
    ) {
      return null;
    }

    return {
      sub: payload.sub,
      email: payload.email,
      name: typeof payload.name === "string" ? payload.name : "",
      role: (payload.role as UserRole) || "STUDENT",
      status: (payload.status as AccountStatus) || ACCOUNT_STATUS.ACTIVE,
      isProfileCompleted: payload.isProfileCompleted !== false,
      onboardingStep:
        (payload.onboardingStep as OnboardingStep) || ONBOARDING_STEPS.COMPLETED,
      type: "access",
    };
  } catch {
    return null;
  }
}

export async function signRefreshToken(
  payload: Omit<RefreshTokenPayload, "type">,
  rememberMe = false
): Promise<string> {
  const ttl = rememberMe ? "30d" : "7d";
  return new SignJWT({
    familyId: payload.familyId,
    jti: payload.jti,
    type: "refresh",
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime(ttl)
    .sign(getRefreshSecretKey());
}

export async function verifyRefreshToken(token: string): Promise<RefreshTokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getRefreshSecretKey(), {
      algorithms: ["HS256"],
    });

    if (
      payload.type !== "refresh" ||
      typeof payload.sub !== "string" ||
      typeof payload.familyId !== "string" ||
      typeof payload.jti !== "string"
    ) {
      return null;
    }

    return {
      sub: payload.sub,
      familyId: payload.familyId,
      jti: payload.jti,
      type: "refresh",
    };
  } catch {
    return null;
  }
}

export function getAuthCookieOptions(maxAgeSeconds: number) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: maxAgeSeconds,
  };
}

export function setAuthCookies(
  res: NextResponse,
  accessToken: string,
  refreshToken: string,
  rememberMe = false
): void {
  const refreshMaxAge = rememberMe
    ? REFRESH_TOKEN_MAX_AGE_REMEMBER_SECONDS
    : REFRESH_TOKEN_MAX_AGE_SHORT_SECONDS;

  res.cookies.set(
    AUTH_COOKIE_NAMES.ACCESS_TOKEN,
    accessToken,
    getAuthCookieOptions(ACCESS_TOKEN_MAX_AGE_SECONDS)
  );
  res.cookies.set(
    AUTH_COOKIE_NAMES.REFRESH_TOKEN,
    refreshToken,
    getAuthCookieOptions(refreshMaxAge)
  );
}

export function clearAuthCookies(res: NextResponse): void {
  res.cookies.set(AUTH_COOKIE_NAMES.ACCESS_TOKEN, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
  res.cookies.set(AUTH_COOKIE_NAMES.REFRESH_TOKEN, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
}

export function getSafeRedirectPath(
  rawPath?: string | null,
  fallback = "/"
): string {
  if (!rawPath) return fallback;
  const trimmed = rawPath.trim();
  if (
    !trimmed.startsWith("/") ||
    trimmed.startsWith("//") ||
    trimmed.startsWith("/\\") ||
    trimmed.includes("\\")
  ) {
    return fallback;
  }
  try {
    const parsed = new URL(trimmed, "https://localhost");
    if (parsed.origin !== "https://localhost") {
      return fallback;
    }
    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return fallback;
  }
}

export function getPostAuthRedirectPath(params: {
  isProfileCompleted: boolean;
  onboardingStep?: OnboardingStep | string;
  role?: UserRole | string;
  callbackUrl?: string | null;
}): string {
  if (!params.isProfileCompleted && params.role !== USER_ROLES.ADMIN) {
    return "/register/complete-profile";
  }
  if (
    params.onboardingStep === ONBOARDING_STEPS.QUIZ &&
    params.role !== USER_ROLES.ADMIN
  ) {
    return "/onboarding?from=register";
  }
  return getSafeRedirectPath(params.callbackUrl, "/");
}

export function getAppBaseUrl(): string {
  const configuredUrl =
    process.env.NEXT_PUBLIC_APP_URL?.trim() ||
    process.env.NEXTAUTH_URL?.trim() ||
    process.env.AUTH_URL?.trim();
  if (configuredUrl) {
    return configuredUrl.replace(/\/+$/, "");
  }
  const vercelUrl =
    process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim() ||
    process.env.VERCEL_URL?.trim();
  if (vercelUrl) {
    const normalized = vercelUrl.startsWith("http")
      ? vercelUrl
      : `https://${vercelUrl}`;
    return normalized.replace(/\/+$/, "");
  }
  return "http://localhost:8000";
}

