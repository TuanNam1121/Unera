import { NextResponse } from "next/server";
import { filterUniversities } from "@/constants/universities";

/**
 * GET /api/universities?q=...
 * Trả về danh sách trường đại học có sẵn để sinh viên chọn ở Bước 2 đăng ký & cập nhật hồ sơ
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get("q") || "";
  const universities = filterUniversities(query);

  return NextResponse.json({
    universities,
    total: universities.length,
  });
}

