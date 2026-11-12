import { z } from "zod";
import { ACCOUNT_STATUS, USER_ROLES } from "@/constants";

export const adminCreateUserSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Họ và tên phải có ít nhất 2 ký tự")
    .max(100, "Họ và tên tối đa 100 ký tự"),
  email: z.string().trim().email("Địa chỉ email không hợp lệ").toLowerCase(),
  password: z
    .string()
    .min(8, "Mật khẩu khởi tạo phải có ít nhất 8 ký tự")
    .max(128, "Mật khẩu tối đa 128 ký tự"),
  role: z.enum([USER_ROLES.STUDENT, USER_ROLES.ADMIN]),
  status: z
    .enum([ACCOUNT_STATUS.ACTIVE, ACCOUNT_STATUS.DISABLED])
    .optional()
    .default(ACCOUNT_STATUS.ACTIVE),
  reason: z.string().trim().max(500).optional(),
});

export const updateUserRoleSchema = z.object({
  role: z.enum([USER_ROLES.STUDENT, USER_ROLES.ADMIN]),
  reason: z
    .string()
    .trim()
    .min(5, "Vui lòng nhập lý do thay đổi vai trò (tối thiểu 5 ký tự)")
    .max(500, "Lý do tối đa 500 ký tự"),
});

export const updateUserStatusSchema = z
  .object({
    status: z.enum([ACCOUNT_STATUS.ACTIVE, ACCOUNT_STATUS.DISABLED]),
    reason: z.string().trim().max(500).optional().default(""),
  })
  .superRefine((data, ctx) => {
    if (
      data.status === ACCOUNT_STATUS.DISABLED &&
      data.reason.trim().length < 5
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["reason"],
        message:
          "Vui lòng nhập lý do khóa tài khoản (tối thiểu 5 ký tự) để phục vụ kiểm toán.",
      });
    }
  });

export const deleteUserSchema = z.object({
  confirmEmail: z
    .string()
    .trim()
    .email("Vui lòng nhập đúng định dạng email xác nhận")
    .toLowerCase(),
  reason: z
    .string()
    .trim()
    .min(5, "Vui lòng nhập lý do xóa tài khoản (tối thiểu 5 ký tự)")
    .max(500, "Lý do tối đa 500 ký tự"),
});

