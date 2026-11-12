import { NextResponse, connection } from "next/server";
import { getActiveTaxonomyTree } from "@/lib/orientation";

/**
 * GET /api/orientation/taxonomy
 * Trả cây danh mục 2 cấp (Category -> Topics) đang isActive: true để đồng bộ Sidebar & /explore
 */
export async function GET() {
  await connection();
  try {
    const categories = await getActiveTaxonomyTree();
    return NextResponse.json({
      success: true,
      categories,
    });
  } catch (error) {
    console.error("GET /api/orientation/taxonomy error:", error);
    return NextResponse.json(
      { error: "Không thể tải danh mục Khám phá định hướng." },
      { status: 500 }
    );
  }
}

