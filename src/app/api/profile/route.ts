import { NextResponse } from "next/server";
import { AUTH_COOKIE_NAMES } from "@/constants";
import { connectToDatabase } from "@/lib/db";
import { ACCESS_TOKEN_MAX_AGE_SECONDS, getAuthCookieOptions } from "@/lib/jwt";
import {
  normalizeUniqueStrings,
  resolveCategorizedSkills,
} from "@/lib/profile-skills";
import { handleAuthError, requireAuth } from "@/lib/session";
import { signAccessTokenForUser } from "@/lib/tokens";
import { StudentProfile } from "@/models/StudentProfile";
import { User } from "@/models/User";
import type { IDevelopmentGoals } from "@/types";
import { updateProfileSchema } from "@/validations";

function formatProfileResponse(
  profileDoc: {
    _id: unknown;
    userId: string;
    fullName: string;
    birthYear?: number;
    avatar?: string;
    university?: string;
    major?: string;
    academicYear?: string;
    bio?: string;
    developmentGoals?: IDevelopmentGoals;
    skills?: string[];
    hardSkills?: string[];
    softSkills?: string[];
    achievements?: string[];
    createdAt?: Date;
    updatedAt?: Date;
  }
) {
  const { hardSkills, softSkills, skills } = resolveCategorizedSkills({
    hardSkills: profileDoc.hardSkills,
    softSkills: profileDoc.softSkills,
    skills: profileDoc.skills,
  });

  return {
    _id: String(profileDoc._id),
    userId: profileDoc.userId,
    fullName: profileDoc.fullName,
    birthYear: profileDoc.birthYear,
    avatar: profileDoc.avatar,
    university: profileDoc.university || "",
    major: profileDoc.major || "",
    academicYear: profileDoc.academicYear || "",
    bio: profileDoc.bio || "",
    developmentGoals: profileDoc.developmentGoals || {},
    skills,
    hardSkills,
    softSkills,
    achievements: normalizeUniqueStrings(profileDoc.achievements),
    createdAt: profileDoc.createdAt,
    updatedAt: profileDoc.updatedAt,
  };
}

/**
 * GET /api/profile
 * Xem thông tin hồ sơ của sinh viên đang đăng nhập (tự động khởi tạo nếu chưa có)
 */
export async function GET(req: Request) {
  try {
    const authUser = await requireAuth(req);

    await connectToDatabase();
    let profile = await StudentProfile.findOne({ userId: authUser.id }).lean();

    if (!profile) {
      const created = await StudentProfile.create({
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
        hardSkills: [],
        softSkills: [],
        achievements: [],
      });
      profile = created.toObject();
    }

    return NextResponse.json({
      success: true,
      profile: formatProfileResponse(profile),
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
 * Cập nhật thông tin cá nhân, học vấn, kỹ năng chuyên môn & kỹ năng mềm, bảng thành tích
 */
export async function PUT(req: Request) {
  try {
    const authUser = await requireAuth(req);

    const body = await req.json();
    const validated = updateProfileSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        {
          error:
            validated.error.issues[0]?.message ||
            "Dữ liệu cập nhật hồ sơ không hợp lệ",
          details: validated.error.issues.map((i) => i.message),
        },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const updateData: Record<string, unknown> = {};
    const {
      fullName,
      birthYear,
      university,
      major,
      academicYear,
      bio,
      skills,
      hardSkills,
      softSkills,
      achievements,
    } = validated.data;

    if (fullName !== undefined) updateData.fullName = fullName.trim();
    if (birthYear !== undefined) updateData.birthYear = birthYear;
    if (university !== undefined) updateData.university = university.trim();
    if (major !== undefined) updateData.major = major.trim();
    if (academicYear !== undefined) updateData.academicYear = academicYear.trim();
    if (bio !== undefined) updateData.bio = bio.trim();

    if (hardSkills !== undefined || softSkills !== undefined) {
      const existing = await StudentProfile.findOne({ userId: authUser.id })
        .select("hardSkills softSkills skills")
        .lean();
      const resolvedExisting = resolveCategorizedSkills(existing || undefined);

      const nextHard =
        hardSkills !== undefined
          ? normalizeUniqueStrings(hardSkills)
          : resolvedExisting.hardSkills;
      const nextSoft =
        softSkills !== undefined
          ? normalizeUniqueStrings(softSkills)
          : resolvedExisting.softSkills;

      updateData.hardSkills = nextHard;
      updateData.softSkills = nextSoft;
      updateData.skills = normalizeUniqueStrings([...nextHard, ...nextSoft]);
    } else if (skills !== undefined) {
      const resolved = resolveCategorizedSkills({ skills });
      updateData.hardSkills = resolved.hardSkills;
      updateData.softSkills = resolved.softSkills;
      updateData.skills = resolved.skills;
    }

    if (achievements !== undefined) {
      updateData.achievements = normalizeUniqueStrings(achievements);
    }

    const updatedProfile = await StudentProfile.findOneAndUpdate(
      { userId: authUser.id },
      { $set: updateData },
      { returnDocument: "after", upsert: true }
    ).lean();

    let updatedUserDoc = null;
    if (fullName !== undefined && fullName.trim() !== authUser.name) {
      updatedUserDoc = await User.findByIdAndUpdate(
        authUser.id,
        { $set: { name: fullName.trim() } },
        { returnDocument: "after" }
      );
    }

    const formatted = formatProfileResponse(updatedProfile);
    const response = NextResponse.json({
      success: true,
      message: "Cập nhật hồ sơ sinh viên thành công!",
      profile: formatted,
    });

    // Làm mới Access Token cookie nếu họ tên trên User vừa thay đổi
    if (updatedUserDoc) {
      const freshAccessToken = await signAccessTokenForUser(updatedUserDoc);
      response.cookies.set(
        AUTH_COOKIE_NAMES.ACCESS_TOKEN,
        freshAccessToken,
        getAuthCookieOptions(ACCESS_TOKEN_MAX_AGE_SECONDS)
      );
    }

    return response;
  } catch (error) {
    return handleAuthError(error);
  }
}
