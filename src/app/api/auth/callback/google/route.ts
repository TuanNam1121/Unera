import { handleGoogleOAuthCallback } from "@/lib/google-oauth";

/**
 * GET /api/auth/callback/google
 * Route tương thích ngược nếu Google Cloud Console được cấu hình redirect URI kiểu legacy
 */
export async function GET(req: Request) {
  return handleGoogleOAuthCallback(req);
}

