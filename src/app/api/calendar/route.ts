import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { CalendarEntry } from "@/models/CalendarEntry";
import { Opportunity } from "@/models/Opportunity";
import { User } from "@/models/User";
import { auth } from "@/lib/auth";

// Helper lấy ID người dùng hiện tại (có fallback dev mode sang student mặc định)
async function getAuthenticatedStudentId(): Promise<string | null> {
  const session = await auth();
  if (session?.user?.id) return session.user.id;

  if (process.env.NODE_ENV !== "production") {
    const defaultStudent = await User.findOne({ email: "student@unera.edu.vn" });
    if (defaultStudent) return defaultStudent._id.toString();
  }
  return null;
}

export async function GET() {
  try {
    await connectToDatabase();
    const studentId = await getAuthenticatedStudentId();

    if (!studentId) {
      return NextResponse.json({ error: "Yêu cầu đăng nhập để xem lịch" }, { status: 401 });
    }

    const entries = await CalendarEntry.find({ studentId, isActive: true })
      .populate("opportunityId")
      .sort({ deadline: 1 })
      .lean();

    return NextResponse.json({ entries });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Đã có lỗi xảy ra";
    return NextResponse.json({ error: "Không thể lấy lịch theo dõi", details: message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await connectToDatabase();
    const studentId = await getAuthenticatedStudentId();

    if (!studentId) {
      return NextResponse.json({ error: "Yêu cầu đăng nhập để thêm vào lịch" }, { status: 401 });
    }

    const { opportunityId } = await req.json();
    if (!opportunityId) {
      return NextResponse.json({ error: "Vui lòng cung cấp ID cơ hội" }, { status: 400 });
    }

    const opportunity = await Opportunity.findById(opportunityId);
    if (!opportunity) {
      return NextResponse.json({ error: "Không tìm thấy cơ hội" }, { status: 404 });
    }

    // Kiểm tra và cập nhật hoặc tạo mới Calendar Entry (ngăn chặn trùng lặp theo FR-CAL-11)
    const entry = await CalendarEntry.findOneAndUpdate(
      { studentId, opportunityId },
      {
        studentId,
        opportunityId,
        deadline: opportunity.deadline,
        isActive: true,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    return NextResponse.json({
      message: "Đã thêm cơ hội vào lịch theo dõi hạn chót thành công",
      entry,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Đã có lỗi xảy ra";
    return NextResponse.json({ error: "Không thể thêm vào lịch", details: message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    await connectToDatabase();
    const studentId = await getAuthenticatedStudentId();

    if (!studentId) {
      return NextResponse.json({ error: "Yêu cầu đăng nhập" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const opportunityId = searchParams.get("opportunityId");

    if (!opportunityId) {
      return NextResponse.json({ error: "Thiếu tham số opportunityId" }, { status: 400 });
    }

    // Đánh dấu dừng theo dõi (FR-CAL-08, FR-CAL-09) mà không xóa lịch sử thông báo đã gửi
    await CalendarEntry.findOneAndUpdate(
      { studentId, opportunityId },
      { isActive: false }
    );

    return NextResponse.json({
      message: "Đã hủy theo dõi cơ hội khỏi lịch",
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Đã có lỗi xảy ra";
    return NextResponse.json({ error: "Lỗi khi hủy theo dõi cơ hội", details: message }, { status: 500 });
  }
}
