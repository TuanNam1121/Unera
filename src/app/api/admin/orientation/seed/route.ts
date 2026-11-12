import { NextResponse } from "next/server";
import {
  revalidateOrientationRoutes,
  seedDefaultOrientationExplore,
} from "@/lib/orientation";
import { handleAuthError, requireAdmin } from "@/lib/session";

/**
 * POST /api/admin/orientation/seed
 * Khởi tạo nhanh danh mục, chủ đề & bài viết định hướng mẫu nếu hệ thống chưa có dữ liệu
 */
export async function POST(req: Request) {
  try {
    const admin = await requireAdmin(req);
    const result = await seedDefaultOrientationExplore(admin.id);
    revalidateOrientationRoutes();

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error) {
    return handleAuthError(error);
  }
}

