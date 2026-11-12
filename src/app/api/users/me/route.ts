import { NextResponse } from "next/server";
import { getAppBaseUrl } from "@/lib/jwt";

/**
 * Ngăn chặn sinh viên tự xóa tài khoản; chuyển tiếp GET sang /api/auth/me
 */
export async function DELETE() {
  return NextResponse.json(
    {
      error:
        "Chức năng tự xóa tài khoản không được hỗ trợ. Vui lòng liên hệ ban quản trị để được hỗ trợ khóa tài khoản.",
      code: "ACCOUNT_DELETION_RESTRICTED",
    },
    { status: 403 }
  );
}

export async function GET() {
  return NextResponse.redirect(new URL("/api/auth/me", getAppBaseUrl()));
}
