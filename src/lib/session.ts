import { auth } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import { User } from "@/models/User";
import { USER_ROLES, ACCOUNT_STATUS } from "@/constants";
import { NextResponse } from "next/server";

export interface AuthenticatedUser {
  id: string;
  name: string;
  email: string;
  role: "STUDENT" | "ADMIN";
  status: "ACTIVE" | "DISABLED";
  image?: string;
}

/**
 * Lấy thông tin người dùng từ Session và kiểm tra trạng thái trong DB (FR-AUTH-04, FR-AUTH-08)
 */
export async function getCurrentUser(): Promise<AuthenticatedUser | null> {
  const session = await auth();
  if (!session?.user?.id) {
    return null;
  }

  await connectToDatabase();
  const dbUser = await User.findById(session.user.id).select("-password");

  if (!dbUser) {
    return null;
  }

  return {
    id: dbUser._id.toString(),
    name: dbUser.name,
    email: dbUser.email,
    role: dbUser.role as "STUDENT" | "ADMIN",
    status: dbUser.status as "ACTIVE" | "DISABLED",
    image: dbUser.avatar,
  };
}

/**
 * Yêu cầu người dùng phải đăng nhập và tài khoản ở trạng thái ACTIVE
 */
export async function requireAuth(): Promise<AuthenticatedUser> {
  const user = await getCurrentUser();

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
 * Yêu cầu người dùng có vai trò Quản trị viên (ADMIN) - FR-AUTH-07, FR-AUTH-12, FR-AUTH-13
 */
export async function requireAdmin(): Promise<AuthenticatedUser> {
  const user = await requireAuth();

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
