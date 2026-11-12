import { NextResponse } from "next/server";
import { connection } from "next/server";
import { getActiveNewsCategories, getActiveNewsTags } from "@/lib/news";

export async function GET() {
  await connection();
  try {
    const [categories, tags] = await Promise.all([
      getActiveNewsCategories(),
      getActiveNewsTags(),
    ]);
    return NextResponse.json({
      success: true,
      categories,
      tags,
    });
  } catch (error) {
    console.error("GET /api/news/categories error:", error);
    return NextResponse.json(
      { error: "Không thể tải danh mục và tag tin tức" },
      { status: 500 }
    );
  }
}

