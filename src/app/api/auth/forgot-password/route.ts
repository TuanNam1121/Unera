import { NextResponse } from "next/server";
import crypto from "crypto";
import { connectToDatabase } from "@/lib/db";
import { User } from "@/models/User";
import { PasswordResetToken } from "@/models/PasswordResetToken";
import { forgotPasswordSchema } from "@/validations";
import { ACCOUNT_STATUS } from "@/constants";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const validated = forgotPasswordSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        {
          error: "Dữ liệu không hợp lệ",
          details: validated.error.issues.map((i) => i.message),
        },
        { status: 400 }
      );
    }

    const { email } = validated.data;
    const normalizedEmail = email.toLowerCase().trim();

    await connectToDatabase();

    const user = await User.findOne({ email: normalizedEmail });

    let resetToken = "";

    // FR-AUTH-05: Chống rò rỉ thông tin người dùng (User Enumeration Protection)
    // Nếu User tồn tại và đang hoạt động, sinh token reset mật khẩu
    if (user && user.status === ACCOUNT_STATUS.ACTIVE) {
      // Xóa các token cũ của email này nếu có
      await PasswordResetToken.deleteMany({ email: normalizedEmail });

      resetToken = crypto.randomBytes(32).toString("hex");
      const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 phút

      await PasswordResetToken.create({
        userId: user._id,
        email: normalizedEmail,
        token: resetToken,
        expiresAt,
      });

      // Ghi log token để hỗ trợ kiểm thử / môi trường dev
      console.log(`[PASSWORD RESET] Token generated for ${normalizedEmail}: ${resetToken}`);
      console.log(`[PASSWORD RESET] Reset link: /reset-password?token=${resetToken}`);
    }

    return NextResponse.json({
      success: true,
      message:
        "Nếu địa chỉ email tồn tại trong hệ thống UNERA, hướng dẫn đặt lại mật khẩu đã được gửi đến bạn.",
      // Trong môi trường development, trả về resetToken để tiện trải nghiệm và kiểm thử
      ...(process.env.NODE_ENV !== "production" && resetToken
        ? {
            debugResetLink: `/reset-password?token=${resetToken}`,
          }
        : {}),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Đã có lỗi xảy ra";
    return NextResponse.json(
      { error: "Không thể xử lý yêu cầu đặt lại mật khẩu.", details: message },
      { status: 500 }
    );
  }
}

