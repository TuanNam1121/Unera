import { NextResponse } from "next/server";
import { requireAdmin, handleAuthError } from "@/lib/session";
import { connectToDatabase } from "@/lib/db";
import { User } from "@/models/User";
import { logAuditAction } from "@/lib/audit";
import { ACCOUNT_STATUS } from "@/constants";

/**
 * PATCH /api/admin/students/[id]/status
 * FR-ADM-02, FR-ADM-14: Khóa hoặc kích hoạt lại tài khoản sinh viên kèm lý do & ghi AuditLog
 */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdmin();
    const { id } = await params;
    const body = await req.json();
    const { status, reason } = body;

    if (!status || !Object.values(ACCOUNT_STATUS).includes(status)) {
      return NextResponse.json(
        { error: "Trạng thái tài khoản không hợp lệ (yêu cầu ACTIVE hoặc DISABLED)." },
        { status: 400 }
      );
    }

    if (status === ACCOUNT_STATUS.DISABLED && (!reason || reason.trim().length < 5)) {
      return NextResponse.json(
        { error: "Vui lòng nhập lý do khóa tài khoản (tối thiểu 5 ký tự) để phục vụ kiểm toán." },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const student = await User.findById(id);
    if (!student) {
      return NextResponse.json({ error: "Không tìm thấy tài khoản sinh viên." }, { status: 404 });
    }

    const previousStatus = student.status;
    student.status = status;
    await student.save();

    // Ghi nhật ký kiểm toán (Audit Trail)
    await logAuditAction({
      admin,
      action: status === ACCOUNT_STATUS.DISABLED ? "LOCK_ACCOUNT" : "UNLOCK_ACCOUNT",
      targetCollection: "users",
      targetId: student._id.toString(),
      targetTitle: `${student.name} (${student.email})`,
      changesBefore: { status: previousStatus },
      changesAfter: { status },
      reason: reason?.trim() || (status === ACCOUNT_STATUS.ACTIVE ? "Admin mở khóa tài khoản" : "Khóa tài khoản"),
      req,
    });

    return NextResponse.json({
      success: true,
      message:
        status === ACCOUNT_STATUS.DISABLED
          ? `Đã khóa tài khoản sinh viên ${student.name}.`
          : `Đã mở khóa tài khoản sinh viên ${student.name}.`,
      student: {
        id: student._id.toString(),
        name: student.name,
        email: student.email,
        status: student.status,
      },
    });
  } catch (error) {
    return handleAuthError(error);
  }
}

