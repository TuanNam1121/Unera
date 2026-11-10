# Cụm Tính Năng 01: Xác Thực & Quản Lý Tài Khoản (Authentication & Account Management)

> **Mã Module:** `AUTH`  
> **Căn cứ SRS:** Mục 4.1 (FR-AUTH-01 đến FR-AUTH-13)  
> **Tác nhân:** Visitor, Student, Admin  
> **Công nghệ thực thi:** NextAuth.js (Auth.js v5), bcryptjs, Zod, MongoDB/Mongoose  

---

## 1. Tổng Quan Nghiệp Vụ Cụm Tính Năng

Cụm tính năng Xác thực đóng vai trò làm nền tảng bảo mật và kiểm soát danh tính cho toàn bộ hệ sinh thái UNERA:
1. **Phân cấp 2 vai trò chuẩn:** `STUDENT` (Sinh viên) và `ADMIN` (Quản trị viên). Hệ thống không hỗ trợ vai trò Mentor (Mentor là hồ sơ được Admin quản trị, không có tài khoản đăng nhập) và không có tài khoản Doanh nghiệp/Tổ chức.
2. **Đa tài khoản Admin đồng quyền:** Hỗ trợ nhiều tài khoản Admin cùng quản trị hệ thống với quyền hạn ngang nhau (không chia super-admin hay phân cấp phòng ban).
3. **Cơ chế xác thực kép:** Hỗ trợ đăng ký/đăng nhập bằng Email/Mật khẩu truyền thống (mã hóa bcrypt salt round 10) và Đăng nhập xã hội một chạm qua Google OAuth 2.0.
4. **Bảo mật trạng thái tài khoản:** Tài khoản có trạng thái `ACTIVE` hoặc `DISABLED`. Khi Admin vô hiệu hóa (`DISABLED`), mọi phiên đăng nhập của người dùng bị chặn lập tức.
5. **Ràng buộc bất biến:** Sinh viên **KHÔNG ĐƯỢC PHÉP TỰ XÓA TÀI KHOẢN** qua giao diện hoặc API (FR-AUTH-11). Việc quản trị trạng thái hoàn toàn do Admin đảm trách.

---

## 2. Kiến Trúc Dữ Liệu & Mô Hình Schema

### 2.1 Collection `users`
Mô hình lưu trữ trong MongoDB (tham chiếu [`src/models/User.ts`](file:///c:/Users/AD/OneDrive/Desktop/Project/ULIS_DMST_2026/src/models/User.ts)):

```typescript
interface IUser {
  _id: ObjectId;
  name: string;           // Tên hiển thị người dùng (Họ và tên)
  email: string;          // Chuỗi email chuẩn hóa lowercase, unique index
  password?: string;      // Hash bcrypt (chỉ có khi đăng ký bằng email/password)
  role: "STUDENT" | "ADMIN"; // Mặc định STUDENT
  avatar?: string;        // URL ảnh đại diện (Gravatar / Google avatar / uploaded)
  status: "ACTIVE" | "DISABLED"; // Mặc định ACTIVE
  emailVerified?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}
```

**Chỉ mục cơ sở dữ liệu (Indexes):**
- `{ email: 1 }`: Unique Index, đảm bảo không có 2 tài khoản trùng email trong hệ thống.
- `{ role: 1, status: 1 }`: Phục vụ truy vấn phân quyền và kiểm tra trạng thái truy cập nhanh.

---

## 3. Danh Sách Các Tính Năng Chi Tiết Trong Cụm

| Mã Tính Năng | Tên Tính Năng | Trọng Tâm Nghiệp Vụ | File Đặc Tả Chi Tiết |
|---|---|---|---|
| **FR-AUTH-01** | Đăng ký tài khoản Sinh viên | Email/Mật khẩu, tạo User & khởi tạo StudentProfile tự động | [`FR-AUTH-01_REGISTRATION.md`](./FR-AUTH-01_REGISTRATION.md) |
| **FR-AUTH-02 & 03** | Đăng nhập & Google OAuth | Credentials Login, Google OAuth, cấp JWT session | [`FR-AUTH-02_03_LOGIN_OAUTH.md`](./FR-AUTH-02_03_LOGIN_OAUTH.md) |
| **FR-AUTH-04 & 10** | Đăng xuất & Quản lý Phiên | Xóa cookie phiên, JWT maxAge 30 ngày, bảo vệ route | [`FR-AUTH-04_10_SESSION_LOGOUT.md`](./FR-AUTH-04_10_SESSION_LOGOUT.md) |
| **FR-AUTH-05 & 06** | Quên Mật Khẩu & Xác Thực | Gửi token qua email, đặt lại mật khẩu an toàn | [`FR-AUTH-05_06_PASSWORD_VERIFY.md`](./FR-AUTH-05_06_PASSWORD_VERIFY.md) |
| **FR-AUTH-07, 12, 13** | Phân Quyền & Đa Admin | Middleware xác thực server, đa Admin quyền đồng đẳng | [`FR-AUTH-07_12_13_ROLES_PERMISSIONS.md`](./FR-AUTH-07_12_13_ROLES_PERMISSIONS.md) |
| **FR-AUTH-08 & 11** | Trạng Thái & Chặn Tự Xóa | Chặn disabled user, ngăn chặn API tự xóa tài khoản | [`FR-AUTH-08_11_ACCOUNT_STATUS_RESTRICTION.md`](./FR-AUTH-08_11_ACCOUNT_STATUS_RESTRICTION.md) |

---

## 4. Ma Trận Quyền Hạn (Permission Matrix)

| Hành Động / Tài Nguyên | Visitor (Khách) | Student (Sinh viên) | Admin (Quản trị viên) |
|---|:---:|:---:|:---:|
| Đăng ký tài khoản mới (`/register`) | ✅ Cho phép | ❌ Đã đăng nhập | ❌ Đã đăng nhập |
| Đăng nhập (`/login`) | ✅ Cho phép | ❌ Đã đăng nhập | ❌ Đã đăng nhập |
| Đăng xuất (`/api/auth/signout`) | ❌ Không hợp lệ | ✅ Cho phép | ✅ Cho phép |
| Quản lý hồ sơ cá nhân | ❌ Bị chặn | ✅ Chỉ hồ sơ của mình | ✅ Xem & Quản trị |
| Đổi trạng thái tài khoản người khác | ❌ Bị chặn | ❌ Bị chặn | ✅ Cho phép |
| Tự xóa tài khoản cá nhân | ❌ Bị chặn | ⛔ **Bị chặn tuyệt đối (FR-AUTH-11)** | ❌ Bị chặn |
| Tạo tài khoản Admin mới | ❌ Bị chặn | ❌ Bị chặn | ✅ Cấp bởi Admin |
