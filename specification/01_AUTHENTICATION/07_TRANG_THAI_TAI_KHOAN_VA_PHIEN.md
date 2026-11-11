# Tính Năng: Trạng Thái Tài Khoản & Quản Lý Phiên (Account Status & Session Management)

> **Mã SRS:** `FR-AUTH-08`, `FR-AUTH-10`  
> **Trạng thái:** ![Hoàn thành](https://img.shields.io/badge/-ĐÃ%20HOÀN%20THÀNH%20100%25-emerald)  
> **Thuộc cụm:** `01_AUTHENTICATION`  
> **Tác nhân:** Sinh viên (Student), Quản trị viên (Admin)

---

## 1. Cách Thức Hoạt Động Hiện Tại (Implementation Details)

### 1.1 Trạng Thái Tài Khoản (`FR-AUTH-08`)
- Bảng `User` lưu trữ trường `status: "ACTIVE" | "DISABLED"`.
- **ACTIVE:** Tài khoản bình thường, có toàn quyền sử dụng các tính năng theo vai trò.
- **DISABLED:** Tài khoản bị Quản trị viên khóa (do vi phạm nội quy hoặc gian lận).
  - Khi bị `DISABLED`, người dùng bị đăng xuất ngay lập tức hoặc không thể đăng nhập lại.
  - Mọi API gọi lên server đều bị từ chối với thông báo: *"Tài khoản của bạn đã bị khóa. Vui lòng liên hệ ban quản trị."*

### 1.2 Quản Lý Phiên Làm Việc (Session Management - `FR-AUTH-10`)
- Hệ thống sử dụng cơ chế JWT Session của NextAuth v5 với cookie an toàn `authjs.session-token`:
  - Flag `HttpOnly`: Ngăn chặn JavaScript độc hại đọc trộm token (chống tấn công XSS).
  - Flag `SameSite: "lax"`: Chống tấn công giả mạo yêu cầu (CSRF).
  - Thời hạn phiên: 30 ngày (tự động làm mới khi người dùng hoạt động).
- Server API trích xuất thông tin người dùng từ phiên đã ký số bí mật (`AUTH_SECRET`), loại bỏ hoàn toàn khả năng người dùng tự sửa đổi `role` hoặc `id` ở client.

---

## 2. Tiêu Chí Nghiệm Thu (Acceptance Criteria)
- [x] **AC-01:** Admin khóa tài khoản sinh viên từ trang `/admin/students` &rarr; CSDL cập nhật `status = "DISABLED"`.
- [x] **AC-02:** Sinh viên dùng tài khoản bị khóa để đăng nhập &rarr; Bị từ chối với thông báo khóa tài khoản.
- [x] **AC-03:** Cookie phiên mang cờ `HttpOnly`, không thể đọc được bằng `document.cookie`.
