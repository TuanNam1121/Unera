import { NextResponse } from "next/server";
import { requireAdmin, handleAuthError } from "@/lib/session";
import { connectToDatabase } from "@/lib/db";
import { User } from "@/models/User";
import { StudentProfile } from "@/models/StudentProfile";
import { USER_ROLES } from "@/constants";

/**
 * GET /api/admin/students
 * FR-ADM-02: Danh sách và tìm kiếm sinh viên cho Admin
 */
export async function GET(req: Request) {
  try {
    await requireAdmin();
    await connectToDatabase();

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search")?.trim() || "";
    const status = searchParams.get("status");
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "15", 10);
    const skip = (page - 1) * limit;

    const query: Record<string, any> = { role: USER_ROLES.STUDENT };

    if (status && status !== "ALL") {
      query.status = status;
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    const [students, total] = await Promise.all([
      User.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).select("-password"),
      User.countDocuments(query),
    ]);

    // Lấy thông tin profile kèm theo
    const studentIds = students.map((s) => s._id.toString());
    const profiles = await StudentProfile.find({ userId: { $in: studentIds } });
    const profileMap = new Map(profiles.map((p) => [p.userId, p]));

    const enrichedStudents = students.map((s) => {
      const p = profileMap.get(s._id.toString());
      return {
        id: s._id.toString(),
        name: s.name,
        email: s.email,
        status: s.status,
        role: s.role,
        avatar: s.avatar || p?.avatar,
        university: p?.university || "Chưa cập nhật",
        major: p?.major || "Chưa cập nhật",
        academicYear: p?.academicYear || "YEAR_1",
        createdAt: s.createdAt,
      };
    });

    return NextResponse.json({
      success: true,
      students: enrichedStudents,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    return handleAuthError(error);
  }
}
