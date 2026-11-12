import { NextRequest, NextResponse } from "next/server";
import { Types } from "mongoose";
import { handleAuthError, requireAdmin } from "@/lib/session";
import { revalidateNewsRoutes, seedDefaultNews } from "@/lib/news";

export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdmin(req);
    const adminObjectId = Types.ObjectId.isValid(admin.id)
      ? new Types.ObjectId(admin.id)
      : undefined;

    const result = await seedDefaultNews(adminObjectId);
    revalidateNewsRoutes();

    return NextResponse.json({
      success: true,
      ...result,
      message: result.seeded
        ? `Đã khởi tạo ${result.categoriesCount} danh mục, ${result.tagsCount} tag và ${result.articlesCount} bài viết tin tức mẫu`
        : "Hệ thống đã có sẵn dữ liệu tin tức",
    });
  } catch (error) {
    return handleAuthError(error);
  }
}

