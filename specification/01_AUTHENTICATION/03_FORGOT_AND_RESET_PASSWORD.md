# AUTH-03: Quên Mật Khẩu & Đặt Lại Mật Khẩu (Forgot / Reset Password)

> **Module:** `01_AUTHENTICATION`  
> **Yêu cầu liên quan:** Nhập địa chỉ email tài khoản → gửi link khôi phục → người dùng bấm vào link nhập mật khẩu mới & xác nhận mật khẩu → trở về trang chủ đăng nhập.  
> **Tác nhân:** Visitor / User chưa đăng nhập.

---

## 1. Quy Tắc Nghiệp Vụ & Bảo Mật

1. **Chống lộ thông tin tài khoản (Anti-User Enumeration):**
   - Khi người dùng nhập email và bấm "Gửi link khôi phục" tại `/forgot-password`, API **luôn trả về thông báo thành công chung** dù email có tồn tại hay không (trừ khi sai định dạng email).
   - Nếu email tồn tại và `status === "ACTIVE"`, hệ thống mới tạo token và gửi email thực tế.
2. **Bảo mật Token Khôi Phục:**
   - Sinh chuỗi ngẫu nhiên 32 bytes (`crypto.randomBytes(32).toString("hex")`).
   - Lưu **SHA-256 hash** của token vào `password_reset_tokens` (chỉ gửi raw token qua URL trong email: `${NEXT_PUBLIC_APP_URL}/reset-password?token=${rawToken}`).
   - Token chỉ có hiệu lực trong **30 phút** và **dùng một lần duy nhất (Single-use)**. Khi gửi yêu cầu mới cho cùng email, các token cũ chưa sử dụng bị vô hiệu hóa ngay lập tức.
3. **Gửi Email thực tế:**
   - Tích hợp Email Provider (`nodemailer` SMTP hoặc `Resend`) gửi email HTML chuẩn thương hiệu UNERA chứa nút CTA "Đặt lại mật khẩu".
   - Môi trường `development` vẫn có thể giữ log console hoặc `debugResetLink` khi chưa cấu hình SMTP để tiện kiểm thử.
4. **Cập nhật mật khẩu & Thu hồi phiên cũ:**
   - Tại `/reset-password?token=...`: kiểm tra token tồn tại và còn hạn (khuyến nghị thêm endpoint `GET /api/auth/reset-password/verify?token=...` để báo lỗi sớm nếu link hết hạn trước khi người dùng nhập mật khẩu).
   - Người dùng nhập **Mật khẩu mới** (tối thiểu 6 ký tự) và **Xác nhận mật khẩu**.
   - Nếu người dùng trước đó đăng ký bằng Google (`!user.password`), việc đặt mật khẩu mới sẽ **bổ sung luôn khả năng đăng nhập bằng Email/Password** (`authProviders` thêm `"CREDENTIALS"`).
   - Sau khi lưu mật khẩu mới (bcrypt hash):
     1. Xóa/đánh dấu đã dùng bản ghi `PasswordResetToken`.
     2. **Thu hồi toàn bộ Refresh Token đang hoạt động** của user (`RefreshToken.updateMany({ userId, revokedAt: null }, { revokedAt: new Date() })`) để đăng xuất khỏi mọi thiết bị khác.
   - Hiển thị thông báo thành công và tự động điều hướng (hoặc nút bấm) trở về `/login?reset=success`.

---

## 2. Đặc Tả API Contract

### 2.1 `POST /api/auth/forgot-password`
- **Zod Schema:** `z.object({ email: z.string().email("Địa chỉ email không hợp lệ") })`
- **Rate Limiting:** Tối đa 5 lần / 15 phút theo cặp IP + email để tránh spam email.
- **Response `200 OK`:**
  ```json
  {
    "success": true,
    "message": "Nếu địa chỉ email tồn tại trong hệ thống UNERA, liên kết khôi phục mật khẩu đã được gửi đến hộp thư của bạn."
  }
  ```

### 2.2 `GET /api/auth/reset-password/verify?token=...`
- Kiểm tra nhanh tính hợp lệ và thời hạn của token khi người dùng mở trang `/reset-password`.
- **Response `200 OK`:** `{ valid: true }` hoặc `400` `{ valid: false, error: "Liên kết không hợp lệ hoặc đã hết hạn." }`.

### 2.3 `POST /api/auth/reset-password`
- **Zod Schema:**
  ```typescript
  const resetPasswordSchema = z.object({
    token: z.string().min(1),
    password: z.string().min(6, "Mật khẩu mới phải có ít nhất 6 ký tự").max(128),
    confirmPassword: z.string().min(1),
  }).refine((d) => d.password === d.confirmPassword, {
    message: "Mật khẩu xác nhận không khớp",
    path: ["confirmPassword"],
  });
  ```
- **Response `200 OK`:**
  ```json
  {
    "success": true,
    "message": "Đặt lại mật khẩu thành công! Vui lòng đăng nhập lại.",
    "redirectTo": "/login?reset=success"
  }
  ```

---

## 3. Tiêu Chí Chấp Thuận (Acceptance Criteria)

- **AC-01:** *Given* user nhập email đã đăng ký tại `/forgot-password`, *When* submit form, *Then* email chứa link `/reset-password?token=...` (hiệu lực 30 phút) được gửi đi và UI hiển thị thông báo đã gửi.
- **AC-02:** *Given* user mở link reset hợp lệ, *When* nhập mật khẩu mới và xác nhận khớp nhau rồi nhấn lưu, *Then* mật khẩu mới được mã hóa bcrypt lưu vào DB, toàn bộ Refresh Token cũ bị thu hồi, và chuyển hướng về `/login` hiển thị banner thành công.
- **AC-03:** *Given* token đã dùng hoặc quá 30 phút, *When* mở lại link hoặc submit đặt lại mật khẩu, *Then* hệ thống từ chối (`400`) và gợi ý gửi lại yêu cầu khôi phục mới.

