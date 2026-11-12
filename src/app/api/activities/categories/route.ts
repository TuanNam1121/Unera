import { NextResponse } from "next/server";
import { connection } from "next/server";
import { getActiveActivityCategories } from "@/lib/activities";

export async function GET() {
  await connection();
  try {
    const categories = await getActiveActivityCategories();
    return NextResponse.json({
      success: true,
      categories,
    });
  } catch (error) {
    console.error("GET /api/activities/categories error:", error);
    return NextResponse.json(
      { error: "Không thể tải danh mục hoạt động sinh viên" },
      { status: 500 }
    );
  }
}

