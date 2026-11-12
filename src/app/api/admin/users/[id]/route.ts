import { NextResponse } from "next/server";
import { AUTH_PROVIDERS, ONBOARDING_STEPS } from "@/constants";
import { connectToDatabase } from "@/lib/db";
import { requireAdmin } from "@/lib/session";
import {
  assertValidUserId,
  cascadeDeleteUserService,
  getUserRelatedDataSummary,
  handleUserAdminError,
} from "@/lib/user-management";
import { StudentProfile } from "@/models/StudentProfile";
import { User } from "@/models/User";
import { deleteUserSchema } from "@/validations/user-admin";

/**
 * GET /api/admin/users/[id]
 * AUTH-04: Chi tiết người dùng + hồ sơ + thống kê dữ liệu liên quan trước khi thao tác xóa/phân quyền.
 */
export async function GET(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin(req);
    const { id } = await context.params;
    const targetObjId = assertValidUserId(id);

    await connectToDatabase();

    const [user, profile, relatedDataSummary] = await Promise.all([
      User.findById(targetObjId).select("-password").lean(),
      StudentProfile.findOne({ userId: targetObjId.toString() }).lean(),
      getUserRelatedDataSummary(targetObjId.toString()),
    ]);

    if (!user) {
      return NextResponse.json(
        { error: "Không tìm thấy tài khoản người dùng." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        avatar: user.avatar || profile?.avatar || "",
        authProviders: user.authProviders?.length
          ? user.authProviders
          : [AUTH_PROVIDERS.CREDENTIALS],
        isProfileCompleted: user.isProfileCompleted !== false,
        onboardingStep: user.onboardingStep || ONBOARDING_STEPS.COMPLETED,
        lastLoginAt: user.lastLoginAt || null,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
      profile: profile
        ? {
            fullName: profile.fullName,
            birthYear: profile.birthYear ?? null,
            university: profile.university || "",
            major: profile.major || "",
            academicYear: profile.academicYear || "",
            bio: profile.bio || "",
            hardSkills: profile.hardSkills || [],
            softSkills: profile.softSkills || [],
            achievements: profile.achievements || [],
          }
        : null,
      relatedDataSummary,
    });
  } catch (error) {
    return handleUserAdminError(error);
  }
}

/**
 * DELETE /api/admin/users/[id]
 * AUTH-04: Admin xóa vĩnh viễn tài khoản user & Cascade Delete toàn bộ dữ liệu liên quan.
 */
export async function DELETE(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdmin(req);
    const { id } = await context.params;
    const body = await req.json().catch(() => ({}));

    const parsed = deleteUserSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error:
            parsed.error.issues[0]?.message ||
            "Vui lòng nhập đầy đủ email xác nhận và lý do xóa tài khoản.",
        },
        { status: 400 }
      );
    }

    const result = await cascadeDeleteUserService({
      targetUserId: id,
      confirmEmail: parsed.data.confirmEmail,
      reason: parsed.data.reason,
      currentAdmin: admin,
      req,
    });

    return NextResponse.json({
      success: true,
      message: `Đã xóa vĩnh viễn tài khoản ${result.target.name} (${result.target.email}) và toàn bộ dữ liệu liên quan.`,
      deletedCounts: result.deletedCounts,
    });
  } catch (error) {
    return handleUserAdminError(error);
  }
}

