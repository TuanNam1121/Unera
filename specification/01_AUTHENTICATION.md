# Cụm Tính Năng 01: Xác Thực & Quản Lý Tài Khoản (Authentication & Account Management)

> **Mã SRS:** `FR-AUTH-01` đến `FR-AUTH-13`  
> **Trạng thái:** ![Hoàn thành](https://img.shields.io/badge/-ĐÃ%20HOÀN%20THÀNH%20100%25-emerald)  
> **Tác nhân:** Khách vãng lai (Visitor), Sinh viên (Student), Quản trị viên (Admin)

---

## 1. Cách Thức Hoạt Động Hiện Tại (Current Implementation)

Hệ thống xác thực đã được triển khai hoàn chỉnh bằng **NextAuth v5** (`@auth/core`), hỗ trợ xác thực bằng Email/Mật khẩu truyền thống và Đăng nhập một chạm bằng Google OAuth 2.0:

### 1.1 Luồng Đăng Ký Tài Khoản (`FR-AUTH-01`)
- **Giao diện:** [`src/app/(auth)/register/page.tsx`](file:///c:/Users/AD/OneDrive/Desktop/Project/ULIS_DMST_2026/src/app/(auth)/register/page.tsx)
- **API Handler:** `POST /api/auth/register` ([`src/app/api/auth/register/route.ts`](file:///c:/Users/AD/OneDrive/Desktop/Project/ULIS_DMST_2026/src/app/api/auth/register/route.ts))
- **Cơ chế xử lý:**
  1. Kiểm tra định dạng email và mật khẩu tối thiểu 8 ký tự.
  2. Băm mật khẩu an toàn bằng `bcryptjs` với salt rounds = 10.
  3. Tạo bản ghi `User` với quyền mặc định `role: "STUDENT"`, trạng thái `status: "ACTIVE"`.
  4. **Tự động sinh kèm `StudentProfile`** rỗng tương ứng để sẵn sàng lưu trữ thông tin học vấn.

### 1.2 Đăng Nhập Mật Khẩu & Google OAuth (`FR-AUTH-02, 03`)
- **Giao diện:** [`src/app/(auth)/login/page.tsx`](file:///c:/Users/AD/OneDrive/Desktop/Project/ULIS_DMST_2026/src/app/(auth)/login/page.tsx)
- **Cấu hình:** [`src/lib/auth.ts`](file:///c:/Users/AD/OneDrive/Desktop/Project/ULIS_DMST_2026/src/lib/auth.ts)
- **Cơ chế xử lý:**
  - **Credentials:** So sánh mật khẩu băm qua bcrypt. Kiểm tra tài khoản có bị khóa (`status === "DISABLED"`), nếu bị khóa sẽ trả về lỗi từ chối đăng nhập ngay lập tức.
  - **Google OAuth:** Khi người dùng bấm *"Đăng nhập bằng Google"*, hệ thống redirect về Google OAuth Consent. Callback tại `http://localhost:8000/api/auth/callback/google`:
    - Nếu email chưa có trong DB: Tự động khởi tạo `User` (email verified, không cần password) và `StudentProfile`.
    - Nếu đã có: Tự động liên kết tài khoản và cấp phiên đăng nhập.

### 1.3 Quên & Khôi Phục Mật Khẩu (`FR-AUTH-05`)
- **Giao diện:**
  - Yêu cầu gửi mã: [`src/app/(auth)/forgot-password/page.tsx`](file:///c:/Users/AD/OneDrive/Desktop/Project/ULIS_DMST_2026/src/app/(auth)/forgot-password/page.tsx)
  - Đặt lại mật khẩu: [`src/app/(auth)/reset-password/page.tsx`](file:///c:/Users/AD/OneDrive/Desktop/Project/ULIS_DMST_2026/src/app/(auth)/reset-password/page.tsx)
- **APIs:**
  - `POST /api/auth/forgot-password`: Sinh token ngẫu nhiên mã hóa crypto 32 bytes, TTL 30 phút, lưu vào bảng `PasswordResetToken`.
  - **Bảo mật chống dò quét tài khoản (User Enumeration Protection):** Cho dù email có tồn tại hay không, API luôn trả về HTTP 200 thông báo thành công.
  - `POST /api/auth/reset-password`: Xác thực token hợp lệ, cập nhật mật khẩu mới, băm bcrypt và hủy token (Single-use token).

### 1.4 Phân Quyền & Bảo Vệ Tuyến Đường (Edge Middleware - `FR-AUTH-07, 10`)
- **Middleware:** [`src/middleware.ts`](file:///c:/Users/AD/OneDrive/Desktop/Project/ULIS_DMST_2026/src/middleware.ts) chạy trên Edge Runtime.
  - Kiểm tra cookie `authjs.session-token`.
  - Tự động chuyển hướng khách chưa đăng nhập khi cố truy cập `/admin/*` về `/login`.
  - Tự động chuyển hướng người đã đăng nhập ra khỏi các trang `/login`, `/register`.
- **Server Helpers:** [`src/lib/session.ts`](file:///c:/Users/AD/OneDrive/Desktop/Project/ULIS_DMST_2026/src/lib/session.ts) cung cấp `requireAuth()` và `requireAdmin()`. Mọi API Admin đều gọi `await requireAdmin()`, chặn đứng các yêu cầu không mang quyền `ADMIN` với HTTP 403 Forbidden.

### 1.5 Cấm Sinh Viên Tự Xóa Tài Khoản (`FR-AUTH-11`, `BR-29`)
- Endpoint `DELETE /api/users/me` ([`src/app/api/users/me/route.ts`](file:///c:/Users/AD/OneDrive/Desktop/Project/ULIS_DMST_2026/src/app/api/users/me/route.ts)): Trả về HTTP 403 Forbidden kèm thông báo quy định: sinh viên không có quyền tự xóa tài khoản học tập; việc khóa tài khoản do Quản trị viên quản lý.

### 1.6 Danh Sách Tài Khoản Admin Đã Seed Trong CSDL
Mật khẩu chung cho tất cả tài khoản admin ban đầu là: `Admin@123456`
1. `admin@unera.edu.vn` (Admin Trưởng)
2. `admin.lan@unera.edu.vn` (Admin Đào tạo)
3. `admin.minh@unera.edu.vn` (Admin Hợp tác doanh nghiệp)
4. `quantri@ulis.edu.vn` (Quản trị viên ULIS)
5. `emnam2k5@gmail.com` (Tài khoản Google Admin của Developer)
*(Có thể chạy lại lệnh `npm run create-admins` bất cứ lúc nào để đồng bộ lại mật khẩu).*
