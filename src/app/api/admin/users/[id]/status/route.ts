import { NextResponse } from "next/server";
import { ACCOUNT_STATUS } from "@/constants";
import { requireAdmin } from "@/lib/session";
import {
  handleUserAdminError,
  updateUserStatusService,
} from "@/lib/user-management";
import { updateUserStatusSchema } from "@/validations/user-admin";

/**
 * PATCH /api/admin/users/[id]/status
 * AUTH-04: Khóa hoặc mở khóa tài khoản người dùng (STUDENT hoặc ADMIN) kèm lý do kiểm toán.
 */
export async function PATCH(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdmin(req);
    const { id } = await context.params;
    const body = await req.json().catch(() => ({}));

    const parsed = updateUserStatusSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error:
            parsed.error.issues[0]?.message ||
            "Dữ liệu cập nhật trạng thái tài khoản không hợp lệ.",
        },
        { status: 400 }
      );
    }

    const updatedUser = await updateUserStatusService({
      targetUserId: id,
      nextStatus: parsed.data.status,
      reason: parsed.data.reason,
      currentAdmin: admin,
      req,
    });

    return NextResponse.json({
      success: true,
      message:
        parsed.data.status === ACCOUNT_STATUS.DISABLED
          ? `Đã khóa tài khoản ${updatedUser.name}.`
          : `Đã mở khóa tài khoản ${updatedUser.name}.`,
      user: updatedUser,
    });
  } catch (error) {
    return handleUserAdminError(error);
  }
}

