import { handleGoogleOAuthCallback } from "@/lib/google-oauth";

/**
 * GET /api/auth/google/callback
 * Xử lý OAuth callback từ Google, tự động đăng ký Gmail mới nếu chưa tồn tại và cấp cặp JWT
 */
export async function GET(req: Request) {
  return handleGoogleOAuthCallback(req);
}

