import { NextResponse } from "next/server";
import { requireAuth, handleAuthError } from "@/lib/session";
import { connectToDatabase } from "@/lib/db";
import { StudentProfile } from "@/models/StudentProfile";
import { User } from "@/models/User";
import { updateProfileSchema } from "@/validations";

/**
 * GET /api/profile
 * FR-PRO-01, FR-PRO-05: Lấy thông tin hồ sơ của sinh viên đang đăng nhập
 */
export async function GET() {
  try {
    const authUser = await requireAuth();

    await connectToDatabase();
    let profile = await StudentProfile.findOne({ userId: authUser.id });

    // Tự động khởi tạo profile nếu chưa có
    if (!profile) {
      profile = await StudentProfile.create({
        userId: authUser.id,
        fullName: authUser.name,
        avatar: authUser.image,
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
    }

    return NextResponse.json({
      success: true,
      profile,
      user: {
        id: authUser.id,
        name: authUser.name,
        email: authUser.email,
        role: authUser.role,
        image: authUser.image,
      },
    });
  } catch (error) {
    return handleAuthError(error);
  }
}

/**
 * PUT /api/profile
 * FR-PRO-01, FR-PRO-03, FR-PRO-04, FR-PRO-06: Cập nhật thông tin học vấn, tiểu sử, kỹ năng, thành tích
 */
export async function PUT(req: Request) {
  try {
    const authUser = await requireAuth();

    const body = await req.json();
    const validated = updateProfileSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        {
          error: "Dữ liệu cập nhật hồ sơ không hợp lệ",
          details: validated.error.issues.map((i) => i.message),
        },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const updateData: Record<string, any> = {};
    const { fullName, university, major, academicYear, bio, skills, achievements } = validated.data;

    if (fullName !== undefined) updateData.fullName = fullName.trim();
    if (university !== undefined) updateData.university = university.trim();
    if (major !== undefined) updateData.major = major.trim();
    if (academicYear !== undefined) updateData.academicYear = academicYear.trim();
    if (bio !== undefined) updateData.bio = bio.trim();
    if (skills !== undefined) updateData.skills = skills;
    if (achievements !== undefined) updateData.achievements = achievements;

    const updatedProfile = await StudentProfile.findOneAndUpdate(
      { userId: authUser.id },
      { $set: updateData },
      { new: true, upsert: true }
    );

    // Đồng bộ tên sang User nếu họ tên thay đổi
    if (fullName && fullName.trim() !== authUser.name) {
      await User.findByIdAndUpdate(authUser.id, { $set: { name: fullName.trim() } });
    }

    return NextResponse.json({
      success: true,
      message: "Cập nhật hồ sơ sinh viên thành công!",
      profile: updatedProfile,
    });
  } catch (error) {
    return handleAuthError(error);
  }
}

