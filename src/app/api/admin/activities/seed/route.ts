import { NextRequest, NextResponse } from "next/server";
import { Types } from "mongoose";
import { handleAuthError, requireAdmin } from "@/lib/session";
import {
  revalidateActivityRoutes,
  seedDefaultStudentActivities,
} from "@/lib/activities";

export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdmin(req);
    const adminObjectId = Types.ObjectId.isValid(admin.id)
      ? new Types.ObjectId(admin.id)
      : undefined;

    const result = await seedDefaultStudentActivities(adminObjectId);
    revalidateActivityRoutes();

    return NextResponse.json({
      success: true,
      ...result,
      message: result.seeded
        ? `Đã khởi tạo ${result.categoriesCount} danh mục và ${result.activitiesCount} hoạt động mẫu`
        : "Hệ thống đã có sẵn dữ liệu danh mục/hoạt động",
    });
  } catch (error) {
    return handleAuthError(error);
  }
}

