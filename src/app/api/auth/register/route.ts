import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectToDatabase } from "@/lib/db";
import { User } from "@/models/User";
import { StudentProfile } from "@/models/StudentProfile";
import { registerSchema } from "@/validations";
import { USER_ROLES, ACCOUNT_STATUS } from "@/constants";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const validatedData = registerSchema.safeParse(body);

    if (!validatedData.success) {
      return NextResponse.json(
        {
          error: "Dữ liệu không hợp lệ",
          details: validatedData.error.issues.map((issue) => issue.message),
        },
        { status: 400 }
      );
    }

    const { name, email, password } = validatedData.data;
    const normalizedEmail = email.toLowerCase().trim();

    await connectToDatabase();

    // Kiểm tra xem email đã được đăng ký chưa
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return NextResponse.json(
        { error: "Email này đã được sử dụng. Vui lòng đăng nhập hoặc sử dụng email khác." },
        { status: 409 }
      );
    }

    // Mã hóa mật khẩu
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Tạo User với vai trò STUDENT theo FR-AUTH-01
    const newUser = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      role: USER_ROLES.STUDENT,
      status: ACCOUNT_STATUS.ACTIVE,
    });

    // Tự động khởi tạo StudentProfile ban đầu (FR-PRO-01)
    await StudentProfile.create({
      userId: newUser._id.toString(),
      fullName: newUser.name,
      skills: [],
      achievements: [],
      developmentGoals: {},
    });

    return NextResponse.json(
      {
        message: "Đăng ký tài khoản thành công",
        user: {
          id: newUser._id.toString(),
          name: newUser.name,
          email: newUser.email,
          role: newUser.role,
        },
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Đã có lỗi xảy ra";
    return NextResponse.json(
      { error: "Không thể tạo tài khoản. Vui lòng thử lại sau.", details: message },
      { status: 500 }
    );
  }
}

