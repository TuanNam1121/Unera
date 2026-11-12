import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import {
  ACCOUNT_STATUS,
  AUTH_PROVIDERS,
  ONBOARDING_STEPS,
  USER_ROLES,
} from "@/constants";
import { logAuditAction } from "@/lib/audit";
import { connectToDatabase } from "@/lib/db";
import { handleAuthError, requireAdmin } from "@/lib/session";
import { StudentProfile } from "@/models/StudentProfile";
import { User } from "@/models/User";
import { adminCreateUserSchema } from "@/validations/user-admin";

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * GET /api/admin/users
 * AUTH-04: Danh sách người dùng đa vai trò (STUDENT & ADMIN) kèm tìm kiếm, lọc và thống kê KPI.
 */
export async function GET(req: Request) {
  try {
    await requireAdmin(req);
    await connectToDatabase();

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search")?.trim() || "";
    const role = searchParams.get("role")?.trim().toUpperCase() || "ALL";
    const status = searchParams.get("status")?.trim().toUpperCase() || "ALL";
    const authProvider =
      searchParams.get("authProvider")?.trim().toUpperCase() || "ALL";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10) || 1);
    const limit = Math.min(
      50,
      Math.max(1, parseInt(searchParams.get("limit") || "15", 10) || 15)
    );
    const skip = (page - 1) * limit;

    const query: Record<string, unknown> = {};

    if (
      role === USER_ROLES.STUDENT ||
      role === USER_ROLES.ADMIN
    ) {
      query.role = role;
    }

    if (
      status === ACCOUNT_STATUS.ACTIVE ||
      status === ACCOUNT_STATUS.DISABLED
    ) {
      query.status = status;
    }

    if (
      authProvider === AUTH_PROVIDERS.CREDENTIALS ||
      authProvider === AUTH_PROVIDERS.GOOGLE
    ) {
      query.authProviders = authProvider;
    }

    if (search) {
      const safeSearch = escapeRegex(search);
      query.$or = [
        { name: { $regex: safeSearch, $options: "i" } },
        { email: { $regex: safeSearch, $options: "i" } },
      ];
    }

    const [
      users,
      total,
      totalUsers,
      totalStudents,
      totalAdmins,
      activeUsers,
      disabledUsers,
    ] = await Promise.all([
      User.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .select("-password")
        .lean(),
      User.countDocuments(query),
      User.countDocuments({}),
      User.countDocuments({ role: USER_ROLES.STUDENT }),
      User.countDocuments({ role: USER_ROLES.ADMIN }),
      User.countDocuments({ status: ACCOUNT_STATUS.ACTIVE }),
      User.countDocuments({ status: ACCOUNT_STATUS.DISABLED }),
    ]);

    const userIds = users.map((u) => u._id.toString());
    const profiles = await StudentProfile.find({ userId: { $in: userIds } }).lean();
    const profileMap = new Map(profiles.map((p) => [p.userId, p]));

    const enrichedUsers = users.map((u) => {
      const profile = profileMap.get(u._id.toString());
      return {
        id: u._id.toString(),
        name: u.name,
        email: u.email,
        role: u.role,
        status: u.status,
        avatar: u.avatar || profile?.avatar || "",
        authProviders: u.authProviders?.length
          ? u.authProviders
          : [AUTH_PROVIDERS.CREDENTIALS],
        isProfileCompleted: u.isProfileCompleted !== false,
        onboardingStep: u.onboardingStep || ONBOARDING_STEPS.COMPLETED,
        university: profile?.university || "",
        major: profile?.major || "",
        academicYear: profile?.academicYear || "",
        birthYear: profile?.birthYear ?? null,
        lastLoginAt: u.lastLoginAt || null,
        createdAt: u.createdAt,
      };
    });

    return NextResponse.json({
      success: true,
      users: enrichedUsers,
      summary: {
        totalUsers,
        totalStudents,
        totalAdmins,
        activeUsers,
        disabledUsers,
      },
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    });
  } catch (error) {
    return handleAuthError(error);
  }
}

/**
 * POST /api/admin/users
 * AUTH-04: Admin tạo mới tài khoản STUDENT hoặc ADMIN trực tiếp từ trang Quản lý Người dùng.
 */
export async function POST(req: Request) {
  try {
    const admin = await requireAdmin(req);
    const body = await req.json().catch(() => ({}));
    const parsed = adminCreateUserSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error:
            parsed.error.issues[0]?.message ||
            "Thông tin tạo tài khoản không hợp lệ.",
        },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const normalizedEmail = parsed.data.email.toLowerCase().trim();
    const existing = await User.findOne({ email: normalizedEmail })
      .select("_id")
      .lean();
    if (existing) {
      return NextResponse.json(
        { error: "Địa chỉ email này đã tồn tại trong hệ thống." },
        { status: 409 }
      );
    }

    const hashedPassword = await bcrypt.hash(parsed.data.password, 10);
    const isAdminAccount = parsed.data.role === USER_ROLES.ADMIN;

    const createdUser = await User.create({
      name: parsed.data.name,
      email: normalizedEmail,
      password: hashedPassword,
      role: parsed.data.role,
      status: parsed.data.status,
      authProviders: [AUTH_PROVIDERS.CREDENTIALS],
      isProfileCompleted: isAdminAccount,
      onboardingStep: isAdminAccount
        ? ONBOARDING_STEPS.COMPLETED
        : ONBOARDING_STEPS.PROFILE,
      emailVerified: new Date(),
    });

    if (!isAdminAccount) {
      await StudentProfile.create({
        userId: createdUser._id.toString(),
        fullName: createdUser.name,
      });
    }

    await logAuditAction({
      admin: {
        id: admin.id,
        email: admin.email,
        name: admin.name,
      },
      action: "CREATE",
      targetCollection: "users",
      targetId: createdUser._id,
      targetTitle: `${createdUser.name} (${createdUser.email})`,
      changesAfter: {
        name: createdUser.name,
        email: createdUser.email,
        role: createdUser.role,
        status: createdUser.status,
      },
      reason:
        parsed.data.reason?.trim() ||
        `Admin tạo mới tài khoản với vai trò ${createdUser.role}`,
      req,
    });

    return NextResponse.json(
      {
        success: true,
        message: `Đã tạo tài khoản ${createdUser.name} (${createdUser.role}).`,
        user: {
          id: createdUser._id.toString(),
          name: createdUser.name,
          email: createdUser.email,
          role: createdUser.role,
          status: createdUser.status,
          isProfileCompleted: createdUser.isProfileCompleted,
          onboardingStep: createdUser.onboardingStep,
          createdAt: createdUser.createdAt,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    return handleAuthError(error);
  }
}

