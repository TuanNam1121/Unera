import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import {
  ACCOUNT_STATUS,
  AUTH_PROVIDERS,
  ONBOARDING_STEPS,
  USER_ROLES,
} from "@/constants";
import { getDevErrorDetails } from "@/lib/api-error";
import { connectToDatabase } from "@/lib/db";
import { setAuthCookies } from "@/lib/jwt";
import {
  buildRateLimitResponse,
  checkRateLimit,
  getClientIp,
} from "@/lib/rate-limit";
import { issueTokenPair } from "@/lib/tokens";
import { StudentProfile } from "@/models/StudentProfile";
import { User } from "@/models/User";
import { registerSchema } from "@/validations";

/**
 * POST /api/auth/register
 * Bước 1 đăng ký tài khoản: Email, Password, Confirm Password.
 * Tạo tài khoản chưa hoàn thiện hồ sơ và điều hướng sang Bước 2 (/register/complete-profile).
 */
export async function POST(req: Request) {
  try {
    const ip = getClientIp(req);
    const rate = checkRateLimit(`auth:register:${ip}`, 10, 15 * 60_000);
    if (!rate.allowed) {
      return buildRateLimitResponse(
        rate.retryAfterSeconds,
        "Quá nhiều yêu cầu đăng ký từ thiết bị này. Vui lòng thử lại sau."
      );
    }

    const body = await req.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: parsed.error.issues[0]?.message || "Dữ liệu đăng ký không hợp lệ",
          details: parsed.error.issues.map((issue) => issue.message),
        },
        { status: 400 }
      );
    }

    const { email, password } = parsed.data;
    await connectToDatabase();

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json(
        { error: "Địa chỉ email này đã được đăng ký trong hệ thống." },
        { status: 409 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const tempDisplayName = email.split("@")[0] || "Sinh viên UNERA";

    const newUser = await User.create({
      name: tempDisplayName,
      email,
      password: hashedPassword,
      role: USER_ROLES.STUDENT,
      status: ACCOUNT_STATUS.ACTIVE,
      authProviders: [AUTH_PROVIDERS.CREDENTIALS],
      isProfileCompleted: false,
      onboardingStep: ONBOARDING_STEPS.PROFILE,
      lastLoginAt: new Date(),
    });

    await StudentProfile.create({
      userId: newUser._id.toString(),
      fullName: tempDisplayName,
      developmentGoals: {
        studyAbroad: false,
        employment: false,
        scientificResearch: false,
        startup: false,
        personalGrowth: false,
      },
      skills: [],
      achievements: [],
    });

    const { accessToken, refreshToken } = await issueTokenPair({
      user: newUser,
      rememberMe: false,
      req,
    });

    const response = NextResponse.json(
      {
        success: true,
        message: "Tạo tài khoản thành công! Vui lòng hoàn thiện thông tin sinh viên.",
        nextStepUrl: "/register/complete-profile",
        accessToken,
        user: {
          id: newUser._id.toString(),
          name: newUser.name,
          email: newUser.email,
          role: newUser.role,
          status: newUser.status,
          isProfileCompleted: false,
          onboardingStep: ONBOARDING_STEPS.PROFILE,
        },
      },
      { status: 201 }
    );

    setAuthCookies(response, accessToken, refreshToken, false);
    return response;
  } catch (error: unknown) {
    return NextResponse.json(
      { error: "Lỗi máy chủ trong quá trình đăng ký", ...getDevErrorDetails(error) },
      { status: 500 }
    );
  }
}
