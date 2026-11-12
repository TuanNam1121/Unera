import crypto from "crypto";
import {
  ACCOUNT_STATUS,
  ONBOARDING_STEPS,
  OnboardingStep,
} from "@/constants";
import { connectToDatabase } from "@/lib/db";
import {
  REFRESH_TOKEN_MAX_AGE_REMEMBER_SECONDS,
  REFRESH_TOKEN_MAX_AGE_SHORT_SECONDS,
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from "@/lib/jwt";
import { RefreshToken } from "@/models/RefreshToken";
import User, { IUserDocument } from "@/models/User";

export function hashToken(rawToken: string): string {
  return crypto.createHash("sha256").update(rawToken).digest("hex");
}

export function generateSecureToken(byteLength = 32): string {
  return crypto.randomBytes(byteLength).toString("hex");
}

export function getRequestMetadata(req?: Request): {
  userAgent?: string;
  ipAddress?: string;
} {
  if (!req) return {};
  const userAgent = req.headers.get("user-agent") || undefined;
  const forwardedFor = req.headers.get("x-forwarded-for");
  const realIp = req.headers.get("x-real-ip");
  const ipAddress = forwardedFor
    ? forwardedFor.split(",")[0]?.trim()
    : realIp || undefined;
  return { userAgent, ipAddress };
}

export function resolveUserOnboardingState(user: Pick<IUserDocument, "isProfileCompleted" | "onboardingStep">): {
  isProfileCompleted: boolean;
  onboardingStep: OnboardingStep;
} {
  // Các tài khoản cũ trong DB chưa có field isProfileCompleted được xem như đã hoàn thiện hồ sơ
  const isProfileCompleted = user.isProfileCompleted !== false;
  const onboardingStep: OnboardingStep =
    user.onboardingStep ||
    (isProfileCompleted ? ONBOARDING_STEPS.COMPLETED : ONBOARDING_STEPS.PROFILE);

  return { isProfileCompleted, onboardingStep };
}

export async function signAccessTokenForUser(user: IUserDocument): Promise<string> {
  const { isProfileCompleted, onboardingStep } = resolveUserOnboardingState(user);

  return signAccessToken({
    sub: user._id.toString(),
    email: user.email,
    name: user.name,
    role: user.role,
    status: user.status,
    isProfileCompleted,
    onboardingStep,
  });
}

export async function issueTokenPair({
  user,
  rememberMe = false,
  req,
  existingFamilyId,
}: {
  user: IUserDocument;
  rememberMe?: boolean;
  req?: Request;
  existingFamilyId?: string;
}): Promise<{
  accessToken: string;
  refreshToken: string;
  rememberMe: boolean;
  familyId: string;
}> {
  await connectToDatabase();

  const familyId = existingFamilyId || crypto.randomUUID();
  const jti = crypto.randomUUID();
  const { userAgent, ipAddress } = getRequestMetadata(req);

  const [accessToken, refreshToken] = await Promise.all([
    signAccessTokenForUser(user),
    signRefreshToken(
      {
        sub: user._id.toString(),
        familyId,
        jti,
      },
      rememberMe
    ),
  ]);

  const maxAgeSeconds = rememberMe
    ? REFRESH_TOKEN_MAX_AGE_REMEMBER_SECONDS
    : REFRESH_TOKEN_MAX_AGE_SHORT_SECONDS;

  await RefreshToken.create({
    userId: user._id,
    tokenHash: hashToken(refreshToken),
    familyId,
    userAgent,
    ipAddress,
    expiresAt: new Date(Date.now() + maxAgeSeconds * 1000),
  });

  return {
    accessToken,
    refreshToken,
    rememberMe,
    familyId,
  };
}

export type RotateRefreshTokenResult =
  | {
      ok: true;
      user: IUserDocument;
      accessToken: string;
      refreshToken: string;
      rememberMe: boolean;
    }
  | {
      ok: false;
      reason: "INVALID_TOKEN" | "TOKEN_REUSED" | "EXPIRED" | "ACCOUNT_DISABLED";
    };

export async function rotateRefreshToken({
  rawRefreshToken,
  req,
}: {
  rawRefreshToken: string;
  req?: Request;
}): Promise<RotateRefreshTokenResult> {
  const payload = await verifyRefreshToken(rawRefreshToken);
  if (!payload) {
    return { ok: false, reason: "INVALID_TOKEN" };
  }

  await connectToDatabase();

  const incomingHash = hashToken(rawRefreshToken);
  const tokenDoc = await RefreshToken.findOne({ tokenHash: incomingHash });

  if (!tokenDoc) {
    return { ok: false, reason: "INVALID_TOKEN" };
  }

  // Reuse detection: nếu refresh token cũ đã bị thu hồi trước đó mà vẫn được dùng lại -> thu hồi cả family
  if (tokenDoc.revokedAt) {
    await RefreshToken.updateMany(
      { familyId: tokenDoc.familyId, revokedAt: null },
      { $set: { revokedAt: new Date() } }
    );
    return { ok: false, reason: "TOKEN_REUSED" };
  }

  if (tokenDoc.expiresAt.getTime() <= Date.now()) {
    tokenDoc.revokedAt = new Date();
    await tokenDoc.save();
    return { ok: false, reason: "EXPIRED" };
  }

  const user = await User.findById(tokenDoc.userId);
  if (!user || user.status === ACCOUNT_STATUS.DISABLED) {
    await RefreshToken.updateMany(
      { userId: tokenDoc.userId, revokedAt: null },
      { $set: { revokedAt: new Date() } }
    );
    return { ok: false, reason: "ACCOUNT_DISABLED" };
  }

  const totalTtlMs =
    tokenDoc.expiresAt.getTime() - tokenDoc.createdAt.getTime();
  const rememberMe = totalTtlMs > 14 * 24 * 60 * 60 * 1000;

  const newPair = await issueTokenPair({
    user,
    rememberMe,
    req,
    existingFamilyId: tokenDoc.familyId,
  });

  tokenDoc.revokedAt = new Date();
  tokenDoc.replacedByTokenHash = hashToken(newPair.refreshToken);
  await tokenDoc.save();

  return {
    ok: true,
    user,
    accessToken: newPair.accessToken,
    refreshToken: newPair.refreshToken,
    rememberMe: newPair.rememberMe,
  };
}

export async function revokeRefreshToken(rawRefreshToken: string): Promise<void> {
  if (!rawRefreshToken) return;
  await connectToDatabase();
  const tokenHash = hashToken(rawRefreshToken);
  await RefreshToken.updateOne(
    { tokenHash, revokedAt: null },
    { $set: { revokedAt: new Date() } }
  );
}

export async function revokeAllUserRefreshTokens(userId: string): Promise<void> {
  if (!userId) return;
  await connectToDatabase();
  await RefreshToken.updateMany(
    { userId, revokedAt: null },
    { $set: { revokedAt: new Date() } }
  );
}

