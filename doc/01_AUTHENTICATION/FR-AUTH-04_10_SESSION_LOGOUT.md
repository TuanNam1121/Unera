# Đặc Tả Tính Năng: Đăng Xuất & Quản Lý Phiên Làm Việc

> **Mã tính năng:** `FR-AUTH-04`, `FR-AUTH-10`  
> **Thuộc cụm:** `01_AUTHENTICATION`  
> **Tác nhân thực hiện:** Sinh viên (Student), Quản trị viên (Admin)  
> **Mức độ ưu tiên:** Bắt buộc (P0 - MVP)  
> **Trạng thái:** Confirmed  

---

## 1. Mục Tiêu & Nghiệp Vụ

1. **Đăng xuất (Logout - FR-AUTH-04):** Cho phép người dùng đang đăng nhập chủ động hủy phiên làm việc hiện tại, xóa sạch token xác thực ở phía trình duyệt và máy chủ, ngăn chặn người khác sử dụng lại phiên trên máy dùng chung.
2. **Quản lý phiên (Session Management - FR-AUTH-10):**
   - Hệ thống duy trì phiên làm việc thông qua JWT an toàn với thời hạn tối đa `30 ngày` (`maxAge: 30 * 24 * 60 * 60`).
   - Mọi request gửi đến các API hoặc trang bảo vệ đều phải mang theo cookie phiên hợp lệ.
   - Khi token hết hạn hoặc không hợp lệ, hệ thống tự động từ chối và điều hướng người dùng về trang đăng nhập (`/login`).

---

## 2. Luồng Xử Lý Kỹ Thuật

- **API Endpoint Đăng xuất:** `POST /api/auth/signout`
- **Thư viện thực hiện:** NextAuth client-side helper `signOut({ callbackUrl: "/login" })`
- **Hành vi xử lý:**
  1. Xóa toàn bộ Cookie chứa session token: `authjs.session-token` (hoặc `__Secure-authjs.session-token` trên môi trường Production HTTPS).
  2. Xóa trạng thái người dùng trong bộ nhớ cache client-side.
  3. Chuyển hướng người dùng về trang đăng nhập hoặc trang chủ công khai.

---

## 3. Tiêu Chí Chấp Thuận

### Kịch bản 1: Đăng xuất thành công
- **Given:** Người dùng đang đăng nhập trong hệ thống.
- **When:** Người dùng bấm nút "Đăng xuất" trong menu hồ sơ.
- **Then:** Cookie phiên bị xóa sạch.
- **And:** Người dùng không thể nhấn nút "Back" trên trình duyệt để thực hiện các thao tác riêng tư (API sẽ trả về HTTP 401 Unauthorized).
- **And:** Chuyển hướng về `/login`.
