import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectToDatabase } from "@/lib/db";
import { User } from "@/models/User";
import { PasswordResetToken } from "@/models/PasswordResetToken";
import { resetPasswordSchema } from "@/validations";
import { ACCOUNT_STATUS } from "@/constants";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const validated = resetPasswordSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        {
          error: "Dữ liệu không hợp lệ",
          details: validated.error.issues.map((i) => i.message),
        },
        { status: 400 }
      );
    }

    const { token, password } = validated.data;

    await connectToDatabase();

    // 1. Tìm token và kiểm tra thời hạn (FR-AUTH-05 AC-01)
    const resetRecord = await PasswordResetToken.findOne({
      token,
      expiresAt: { $gt: new Date() },
    });

    if (!resetRecord) {
      return NextResponse.json(
        {
          error:
            "Liên kết đặt lại mật khẩu không hợp lệ hoặc đã hết hạn. Vui lòng gửi lại yêu cầu mới.",
        },
        { status: 400 }
      );
    }

    // 2. Tìm user tương ứng
    const user = await User.findById(resetRecord.userId);
    if (!user) {
      return NextResponse.json(
        { error: "Người dùng không tồn tại trong hệ thống." },
        { status: 404 }
      );
    }

    if (user.status === ACCOUNT_STATUS.DISABLED) {
      return NextResponse.json(
        { error: "Tài khoản của bạn đã bị vô hiệu hóa. Vui lòng liên hệ ban quản trị." },
        { status: 403 }
      );
    }

    // 3. Mã hóa mật khẩu mới (FR-AUTH-06)
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    user.password = hashedPassword;
    await user.save();

    // 4. Xóa token đã sử dụng (AC-02: Single-use)
    await PasswordResetToken.deleteOne({ _id: resetRecord._id });

    return NextResponse.json({
      success: true,
      message: "Đặt lại mật khẩu thành công! Bạn có thể đăng nhập bằng mật khẩu mới.",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Đã có lỗi xảy ra";
    return NextResponse.json(
      { error: "Không thể đặt lại mật khẩu. Vui lòng thử lại sau.", details: message },
      { status: 500 }
    );
  }
}

