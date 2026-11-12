import { NextResponse } from "next/server";
import { AUTH_COOKIE_NAMES, ONBOARDING_STEPS } from "@/constants";
import { connectToDatabase } from "@/lib/db";
import { ACCESS_TOKEN_MAX_AGE_SECONDS, getAuthCookieOptions } from "@/lib/jwt";
import { handleAuthError, requireAuth } from "@/lib/session";
import { signAccessTokenForUser } from "@/lib/tokens";
import { logUserActivity } from "@/lib/user-activity-log";
import { StudentProfile } from "@/models/StudentProfile";
import { User } from "@/models/User";
import { completeProfileSchema } from "@/validations";

/**
 * POST /api/auth/complete-profile
 * Bước 2 đăng ký (và bước đầu tiên sau khi đăng ký mới qua Google OAuth):
 * Cập nhật Họ tên, Năm sinh, Sinh viên năm mấy, Trường Đại học (preset), Ngành học (tự điền)
 * rồi nối luồng sang Quiz định hướng (/onboarding).
 */
export async function POST(req: Request) {
  try {
    const authUser = await requireAuth(req);
    const body = await req.json();

    const parsed = completeProfileSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: parsed.error.issues[0]?.message || "Thông tin hồ sơ không hợp lệ",
          details: parsed.error.issues.map((issue) => issue.message),
        },
        { status: 400 }
      );
    }

    const { fullName, birthYear, academicYear, university, major } = parsed.data;

    await connectToDatabase();

    const currentUser = await User.findById(authUser.id);
    if (!currentUser) {
      return NextResponse.json(
        { error: "Không tìm thấy tài khoản người dùng." },
        { status: 404 }
      );
    }

    const nextStep =
      currentUser.onboardingStep === ONBOARDING_STEPS.COMPLETED
        ? ONBOARDING_STEPS.COMPLETED
        : ONBOARDING_STEPS.QUIZ;

    currentUser.name = fullName;
    currentUser.isProfileCompleted = true;
    currentUser.onboardingStep = nextStep;
    await currentUser.save();

    const updatedProfile = await StudentProfile.findOneAndUpdate(
      { userId: currentUser._id.toString() },
      {
        $set: {
          fullName,
          birthYear,
          academicYear,
          university,
          major,
          avatar: currentUser.avatar,
        },
        $setOnInsert: {
          developmentGoals: {
            studyAbroad: false,
            employment: false,
            scientificResearch: false,
            startup: false,
            personalGrowth: false,
          },
          skills: [],
          achievements: [],
        },
      },
      { returnDocument: "after", upsert: true }
    );

    const newAccessToken = await signAccessTokenForUser(currentUser);

    await logUserActivity({
      req,
      actorId: currentUser._id,
      actorEmail: currentUser.email,
      actorName: currentUser.name,
      actorRole: currentUser.role,
      category: "PROFILE",
      action: "PROFILE_COMPLETE",
      description: `Hoàn thiện hồ sơ onboarding bước 2 (${university} - ${major})`,
      status: "SUCCESS",
      statusCode: 200,
      targetCollection: "student_profiles",
      targetId: updatedProfile?._id || currentUser._id,
      targetTitle: fullName,
      metadata: { academicYear, university, major },
    });

    const response = NextResponse.json({
      success: true,
      message: "Hoàn thiện hồ sơ thành công! Đang chuyển sang Quiz định hướng.",
      nextStepUrl: "/onboarding?from=register",
      accessToken: newAccessToken,
      user: {
        id: currentUser._id.toString(),
        name: currentUser.name,
        email: currentUser.email,
        role: currentUser.role,
        status: currentUser.status,
        image: currentUser.avatar || undefined,
        isProfileCompleted: true,
        onboardingStep: nextStep,
      },
      profile: updatedProfile,
    });

    response.cookies.set(
      AUTH_COOKIE_NAMES.ACCESS_TOKEN,
      newAccessToken,
      getAuthCookieOptions(ACCESS_TOKEN_MAX_AGE_SECONDS)
    );

    return response;
  } catch (error) {
    return handleAuthError(error);
  }
}

