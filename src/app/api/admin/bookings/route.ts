import { NextResponse } from "next/server";
import { requireAdmin, handleAuthError } from "@/lib/session";
import { connectToDatabase } from "@/lib/db";
import { BookingRequest } from "@/models/BookingRequest";
import { MentorProfile } from "@/models/MentorProfile";
import { User } from "@/models/User";

/**
 * GET /api/admin/bookings
 * FR-ADM-06, FR-MEN-06: Xem danh sách yêu cầu tư vấn Mentor cho Admin
 */
export async function GET(req: Request) {
  try {
    await requireAdmin();
    await connectToDatabase();

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "15", 10);
    const skip = (page - 1) * limit;

    const query: Record<string, any> = {};
    if (status && status !== "ALL") {
      query.status = status;
    }

    const [bookings, total] = await Promise.all([
      BookingRequest.find(query)
        .populate("mentorId", "fullName title company avatar")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      BookingRequest.countDocuments(query),
    ]);

    // Lấy thông tin sinh viên tương ứng
    const studentIds = bookings.map((b) => b.studentId);
    const students = await User.find({ _id: { $in: studentIds } }).select("name email avatar");
    const studentMap = new Map(students.map((s) => [s._id.toString(), s]));

    const enrichedBookings = bookings.map((b) => {
      const student = studentMap.get(b.studentId);
      return {
        id: b._id.toString(),
        student: {
          id: b.studentId,
          name: student?.name || "Sinh viên",
          email: student?.email || "N/A",
          avatar: student?.avatar,
        },
        mentor: b.mentorId,
        topic: b.topic,
        preferredTime: b.preferredTime,
        message: b.message,
        status: b.status,
        adminResponse: b.adminResponse,
        processedByAdminId: b.processedByAdminId,
        createdAt: b.createdAt,
      };
    });

    return NextResponse.json({
      success: true,
      bookings: enrichedBookings,
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

