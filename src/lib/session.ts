import { cookies, headers } from "next/headers";
import { NextResponse } from "next/server";
import {
  ACCOUNT_STATUS,
  AUTH_COOKIE_NAMES,
  AccountStatus,
  OnboardingStep,
  USER_ROLES,
  UserRole,
} from "@/constants";
import { connectToDatabase } from "@/lib/db";
import { verifyAccessToken } from "@/lib/jwt";
import { resolveUserOnboardingState } from "@/lib/tokens";
import { User } from "@/models/User";

export interface AuthenticatedUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: AccountStatus;
  image?: string;
  isProfileCompleted: boolean;
  onboardingStep: OnboardingStep;
}

async function extractAccessToken(req?: Request): Promise<string | null> {
  const authHeader = req
    ? req.headers.get("authorization")
    : (await headers()).get("authorization");

  if (authHeader && authHeader.toLowerCase().startsWith("bearer ")) {
    const bearerToken = authHeader.slice(7).trim();
    if (bearerToken) return bearerToken;
  }

  const cookieStore = await cookies();
  return cookieStore.get(AUTH_COOKIE_NAMES.ACCESS_TOKEN)?.value || null;
}

/**
 * Lấy thông tin người dùng hiện tại từ JWT Access Token (Cookie HttpOnly hoặc Bearer Header)
 * và đối chiếu trạng thái ACTIVE mới nhất từ MongoDB.
 */
export async function getCurrentUser(
  req?: Request
): Promise<AuthenticatedUser | null> {
  const rawAccessToken = await extractAccessToken(req);
  if (!rawAccessToken) return null;

  const payload = await verifyAccessToken(rawAccessToken);
  if (!payload) return null;

  await connectToDatabase();
  const dbUser = await User.findById(payload.sub)
    .select("_id name email role status avatar isProfileCompleted onboardingStep")
    .lean();

  if (!dbUser) return null;

  const { isProfileCompleted, onboardingStep } = resolveUserOnboardingState({
    isProfileCompleted: dbUser.isProfileCompleted,
    onboardingStep: dbUser.onboardingStep,
  });

  return {
    id: dbUser._id.toString(),
    name: dbUser.name,
    email: dbUser.email,
    role: dbUser.role,
    status: dbUser.status,
    image: dbUser.avatar || undefined,
    isProfileCompleted,
    onboardingStep,
  };
}

/**
 * Yêu cầu người dùng phải đăng nhập và tài khoản ở trạng thái ACTIVE
 */
export async function requireAuth(req?: Request): Promise<AuthenticatedUser> {
  const user = await getCurrentUser(req);

  if (!user) {
    throw new Response(
      JSON.stringify({ error: "Yêu cầu đăng nhập để truy cập tài nguyên này." }),
      { status: 401, headers: { "Content-Type": "application/json" } }
    );
  }

  if (user.status === ACCOUNT_STATUS.DISABLED) {
    throw new Response(
      JSON.stringify({
        error: "Tài khoản của bạn đã bị vô hiệu hóa. Vui lòng liên hệ ban quản trị.",
      }),
      { status: 403, headers: { "Content-Type": "application/json" } }
    );
  }

  return user;
}

/**
 * Yêu cầu người dùng có vai trò Quản trị viên (ADMIN)
 */
export async function requireAdmin(req?: Request): Promise<AuthenticatedUser> {
  const user = await requireAuth(req);

  if (user.role !== USER_ROLES.ADMIN) {
    throw new Response(
      JSON.stringify({
        error: "Truy cập bị từ chối. Chức năng này yêu cầu quyền Quản trị viên (ADMIN).",
      }),
      { status: 403, headers: { "Content-Type": "application/json" } }
    );
  }

  return user;
}

/**
 * Helper chuẩn hóa bắt lỗi Auth Response
 */
export function handleAuthError(error: unknown) {
  if (error instanceof Response) {
    return error;
  }
  const message = error instanceof Error ? error.message : "Lỗi xác thực hệ thống";
  return NextResponse.json({ error: message }, { status: 500 });
}
