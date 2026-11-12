import { NextResponse } from "next/server";
import { CV_TEMPLATES } from "@/lib/cv-templates";

/**
 * GET /api/cv/templates
 * Trả danh mục mẫu CV kèm filter industry, style, level, q
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const industry = searchParams.get("industry")?.trim() || "ALL";
  const style = searchParams.get("style")?.trim() || "ALL";
  const level = searchParams.get("level")?.trim() || "ALL";
  const q = searchParams.get("q")?.trim().toLowerCase() || "";

  const filtered = CV_TEMPLATES.filter((tpl) => {
    if (industry !== "ALL" && !tpl.industry.includes(industry as never)) {
      return false;
    }
    if (style !== "ALL" && tpl.style !== style) {
      return false;
    }
    if (level !== "ALL" && !tpl.experienceLevel.includes(level as never)) {
      return false;
    }
    if (q) {
      const hay = `${tpl.name} ${tpl.description}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });

  return NextResponse.json({
    success: true,
    templates: filtered,
  });
}

