import { createGoogleAuthRedirectResponse } from "@/lib/google-oauth";

/**
 * GET /api/auth/google
 * Khởi tạo luồng đăng nhập / tự động đăng ký bằng Google OAuth 2.0
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const callbackUrl = searchParams.get("callbackUrl");
  return createGoogleAuthRedirectResponse(callbackUrl);
}

