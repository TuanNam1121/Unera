# Tính Năng: Xác Thực Địa Chỉ Email (Email Verification)

> **Mã SRS:** `FR-AUTH-06`  
> **Trạng thái:** ![Kế hoạch theo SRS](https://img.shields.io/badge/-KẾ%20HOẠCH%20THEO%20SRS-amber)  
> **Thuộc cụm:** `01_AUTHENTICATION`  
> **Tác nhân:** Sinh viên (Student)

---

## 1. Hiện Trạng Triển Khai (Current State)
- **Model User:** Bản ghi `User` đã có trường `emailVerified: Date | null`.
- **Google OAuth:** Tài khoản đăng nhập qua Google tự động được gán `emailVerified = new Date()` do Google đã xác minh quyền sở hữu email.
- **Email Credentials:** Người dùng đăng ký bằng mật khẩu hiện tại có thể đăng nhập ngay mà không bị chặn bắt buộc xác thực email, đúng theo quyết định TBD trong SRS 1.0 (nhằm giảm thiểu ma sát người dùng ban đầu).

---

## 2. Đặc Tả Triển Khai Theo SRS 1.0 (Specification)

1. **Gửi Email Kích Hoạt:**
   - Khi sinh viên đăng ký tài khoản bằng email/mật khẩu, hệ thống sinh mã xác thực `emailVerificationToken` (TTL 24 giờ).
   - Gửi email kèm liên kết kích hoạt: `https://unera.edu.vn/verify-email?token=...`.
2. **Xác Minh Token:**
   - Endpoint `GET /api/auth/verify-email?token=...` kiểm tra token hợp lệ và cập nhật `User.emailVerified = new Date()`.
   - Hiển thị thông báo chúc mừng tài khoản đã được kích hoạt thành công.
3. **Huy Hiệu Hồ Sơ:**
   - Trên trang `/profile`, tài khoản đã xác thực hiển thị huy hiệu tích xanh *"Email đã xác minh"*.
