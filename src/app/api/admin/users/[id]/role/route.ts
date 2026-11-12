import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/session";
import {
  handleUserAdminError,
  updateUserRoleService,
} from "@/lib/user-management";
import { updateUserRoleSchema } from "@/validations/user-admin";

/**
 * PATCH /api/admin/users/[id]/role
 * AUTH-04: Chuyển đổi vai trò người dùng (STUDENT <-> ADMIN) có kiểm tra bảo vệ & thu hồi RefreshToken.
 */
export async function PATCH(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdmin(req);
    const { id } = await context.params;
    const body = await req.json().catch(() => ({}));

    const parsed = updateUserRoleSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error:
            parsed.error.issues[0]?.message ||
            "Dữ liệu thay đổi vai trò không hợp lệ.",
        },
        { status: 400 }
      );
    }

    const updatedUser = await updateUserRoleService({
      targetUserId: id,
      nextRole: parsed.data.role,
      reason: parsed.data.reason,
      currentAdmin: admin,
      req,
    });

    return NextResponse.json({
      success: true,
      message: `Đã cập nhật vai trò của ${updatedUser.name} thành ${updatedUser.role}.`,
      user: updatedUser,
    });
  } catch (error) {
    return handleUserAdminError(error);
  }
}

