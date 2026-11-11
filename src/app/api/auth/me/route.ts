import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { connectToDatabase } from "@/lib/db";
import { StudentProfile } from "@/models/StudentProfile";
import { ACCOUNT_STATUS } from "@/constants";

export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { authenticated: false, user: null },
        { status: 401 }
      );
    }

    if (user.status === ACCOUNT_STATUS.DISABLED) {
      return NextResponse.json(
        {
          error: "Tài khoản của bạn đã bị vô hiệu hóa. Vui lòng liên hệ ban quản trị.",
          status: "DISABLED",
        },
        { status: 403 }
      );
    }

    await connectToDatabase();
    const profile = await StudentProfile.findOne({ userId: user.id });

    return NextResponse.json({
      authenticated: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        image: user.image,
      },
      profile: profile || null,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Đã có lỗi xảy ra";
    return NextResponse.json(
      { error: "Không thể lấy thông tin người dùng", details: message },
      { status: 500 }
    );
  }
}

