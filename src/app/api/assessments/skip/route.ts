import { NextResponse } from "next/server";
import { AUTH_COOKIE_NAMES, ONBOARDING_STEPS } from "@/constants";
import { connectToDatabase } from "@/lib/db";
import { ACCESS_TOKEN_MAX_AGE_SECONDS, getAuthCookieOptions } from "@/lib/jwt";
import { handleAuthError, requireAuth } from "@/lib/session";
import { signAccessTokenForUser } from "@/lib/tokens";
import { User } from "@/models/User";

/**
 * POST /api/assessments/skip
 * Cho phép sinh viên ở Bước 3/3 (onboardingStep = QUIZ) tạm bỏ qua Quiz để vào Dashboard
 * và có thể làm lại bất kỳ lúc nào qua banner hoặc trang /onboarding.
 */
export async function POST(req: Request) {
  try {
    const authUser = await requireAuth(req);
    await connectToDatabase();

    const dbUser = await User.findById(authUser.id);
    if (!dbUser) {
      return NextResponse.json(
        { error: "Không tìm thấy tài khoản người dùng." },
        { status: 404 }
      );
    }

    if (dbUser.onboardingStep !== ONBOARDING_STEPS.COMPLETED) {
      dbUser.onboardingStep = ONBOARDING_STEPS.COMPLETED;
      await dbUser.save();
    }

    const accessToken = await signAccessTokenForUser(dbUser);
    const response = NextResponse.json({
      success: true,
      redirectTo: "/",
      user: {
        id: dbUser._id.toString(),
        name: dbUser.name,
        email: dbUser.email,
        role: dbUser.role,
        status: dbUser.status,
        image: dbUser.avatar || undefined,
        isProfileCompleted: dbUser.isProfileCompleted,
        onboardingStep: dbUser.onboardingStep,
      },
    });

    response.cookies.set(
      AUTH_COOKIE_NAMES.ACCESS_TOKEN,
      accessToken,
      getAuthCookieOptions(ACCESS_TOKEN_MAX_AGE_SECONDS)
    );

    return response;
  } catch (error) {
    return handleAuthError(error);
  }
}

