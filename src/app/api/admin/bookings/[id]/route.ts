import { NextResponse } from "next/server";
import { requireAdmin, handleAuthError } from "@/lib/session";
import { connectToDatabase } from "@/lib/db";
import { BookingRequest } from "@/models/BookingRequest";
import { logAuditAction } from "@/lib/audit";
import { BOOKING_STATUS } from "@/constants";

/**
 * PATCH /api/admin/bookings/[id]
 * FR-ADM-06, FR-MEN-08: Admin xử lý yêu cầu tư vấn (Phê duyệt hoặc Từ chối kèm lý do)
 */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdmin();
    const { id } = await params;
    const body = await req.json();
    const { status, adminResponse } = body;

    if (!status || !Object.keys(BOOKING_STATUS).includes(status)) {
      return NextResponse.json(
        { error: "Trạng thái đặt lịch không hợp lệ (PENDING, CONFIRMED, REJECTED, COMPLETED, CANCELLED)." },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const booking = await BookingRequest.findById(id);
    if (!booking) {
      return NextResponse.json({ error: "Không tìm thấy yêu cầu tư vấn." }, { status: 404 });
    }

    const previousStatus = booking.status;
    booking.status = status;
    if (adminResponse !== undefined) {
      booking.adminResponse = adminResponse.trim();
    }
    booking.processedByAdminId = admin.id;
    await booking.save();

    // Ghi nhật ký kiểm toán
    await logAuditAction({
      admin,
      action: "STATUS_CHANGE",
      targetCollection: "bookings",
      targetId: booking._id.toString(),
      targetTitle: `Yêu cầu tư vấn: ${booking.topic}`,
      changesBefore: { status: previousStatus },
      changesAfter: { status, adminResponse: booking.adminResponse },
      reason: adminResponse || `Chuyển trạng thái sang ${status}`,
      req,
    });

    return NextResponse.json({
      success: true,
      message: `Đã cập nhật trạng thái lịch hẹn thành ${status}.`,
      booking,
    });
  } catch (error) {
    return handleAuthError(error);
  }
}

