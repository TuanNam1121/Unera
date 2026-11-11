# Tính Năng: Quên & Khôi Phục Mật Khẩu (Password Recovery Flow)

> **Mã SRS:** `FR-AUTH-05`  
> **Trạng thái:** ![Hoàn thành](https://img.shields.io/badge/-ĐÃ%20HOÀN%20THÀNH%20100%25-emerald)  
> **Thuộc cụm:** `01_AUTHENTICATION`  
> **Tác nhân:** Sinh viên (Student), Quản trị viên (Admin)

---

## 1. Cách Thức Hoạt Động Hiện Tại (Implementation Details)

Hệ thống cung cấp quy trình khôi phục mật khẩu 2 bước an toàn cao với cơ chế bảo vệ quyền riêng tư người dùng:

### 1.1 Bước 1: Yêu Cầu Khôi Phục Mật Khẩu
- **Giao diện:** [`src/app/(auth)/forgot-password/page.tsx`](file:///c:/Users/AD/OneDrive/Desktop/Project/ULIS_DMST_2026/src/app/(auth)/forgot-password/page.tsx)
- **API Handler:** `POST /api/auth/forgot-password` ([`src/app/api/auth/forgot-password/route.ts`](file:///c:/Users/AD/OneDrive/Desktop/Project/ULIS_DMST_2026/src/app/api/auth/forgot-password/route.ts))
- **Cơ Chế Bảo Mật Chống Dò Quét Tài Khoản (User Enumeration Protection):**
  - Bất kể email người dùng nhập có tồn tại trong hệ thống hay không, API **luôn trả về cùng một thông báo thành công HTTP 200**: *"Nếu email của bạn tồn tại trong hệ thống, chúng tôi đã gửi hướng dẫn đặt lại mật khẩu đến hộp thư."*
  - Hacker không thể dựa vào thông báo lỗi để biết được email nào đã đăng ký tài khoản tại trường.
- **Tạo Mã Khôi Phục (Token Generation):**
  - Nếu email tồn tại: Sinh chuỗi ngẫu nhiên 32 bytes (`crypto.randomBytes(32).toString("hex")`).
  - Lưu vào bảng [`src/models/PasswordResetToken.ts`](file:///c:/Users/AD/OneDrive/Desktop/Project/ULIS_DMST_2026/src/models/PasswordResetToken.ts) kèm thời gian sống (TTL) đúng **30 phút**.
  - Tự động xóa token cũ chưa sử dụng của email đó nếu có.

### 1.2 Bước 2: Đặt Lại Mật Khẩu Mới
- **Giao diện:** [`src/app/(auth)/reset-password/page.tsx`](file:///c:/Users/AD/OneDrive/Desktop/Project/ULIS_DMST_2026/src/app/(auth)/reset-password/page.tsx)
- **API Handler:** `POST /api/auth/reset-password` ([`src/app/api/auth/reset-password/route.ts`](file:///c:/Users/AD/OneDrive/Desktop/Project/ULIS_DMST_2026/src/app/api/auth/reset-password/route.ts))
- **Quy trình xử lý:**
  1. Nhận payload `{ token, newPassword }`.
  2. Kiểm tra token trong CSDL: Phải tồn tại và thời gian `expiresAt > new Date()`.
  3. Kiểm tra mật khẩu mới $\ge 8$ ký tự.
  4. Mã hóa mật khẩu mới bằng `bcryptjs` salt 10 và cập nhật vào bản ghi `User`.
  5. **Hủy Token (Single-use Invariant):** Lập tức xóa bản ghi `PasswordResetToken` khỏi CSDL để token không thể bị tái sử dụng (Replay Attack).
  6. Trả về thành công và chuyển hướng sinh viên về trang `/login`.

---

## 2. Tiêu Chí Nghiệm Thu (Acceptance Criteria)
- [x] **AC-01:** Nhập email bất kỳ &rarr; Luôn nhận được thông báo tích cực, bảo vệ danh tính người dùng.
- [x] **AC-02:** Token quá hạn 30 phút &rarr; Bị từ chối với lỗi *"Mã khôi phục đã hết hạn. Vui lòng gửi lại yêu cầu mới."*
- [x] **AC-03:** Đặt lại mật khẩu thành công &rarr; Đăng nhập được ngay bằng mật khẩu mới; token cũ bị hủy hoàn toàn.
