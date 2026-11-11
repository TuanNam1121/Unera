import { NextResponse } from "next/server";

/**
 * FR-AUTH-11 & BR-29: Ngăn chặn tuyệt đối sinh viên tự xóa tài khoản
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
  return NextResponse.redirect(new URL("/api/auth/me", process.env.NEXTAUTH_URL || "http://localhost:3000"));
}
