# Tính Năng: Đăng Nhập Bằng Mật Khẩu & Google OAuth (Login & Social Authentication)

> **Mã SRS:** `FR-AUTH-02`, `FR-AUTH-03`  
> **Trạng thái:** ![Hoàn thành](https://img.shields.io/badge/-ĐÃ%20HOÀN%20THÀNH%20100%25-emerald)  
> **Thuộc cụm:** `01_AUTHENTICATION`  
> **Tác nhân:** Sinh viên (Student), Quản trị viên (Admin)

---

## 1. Cách Thức Hoạt Động Hiện Tại (Implementation Details)

### 1.1 Giao Diện Đăng Nhập (`/login`)
- **Tệp nguồn:** [`src/app/(auth)/login/page.tsx`](file:///c:/Users/AD/OneDrive/Desktop/Project/ULIS_DMST_2026/src/app/(auth)/login/page.tsx)
- Cung cấp 2 hình thức đăng nhập bình đẳng:
  1. Nhập Email & Mật khẩu.
  2. Nút *"Tiếp tục với Google"* (Google OAuth 2.0).
- Hiển thị liên kết *"Quên mật khẩu?"* dẫn sang `/forgot-password`.
- Xử lý trạng thái tải (loading spinner) và hiển thị thông báo lỗi thân thiện khi sai thông tin hoặc tài khoản bị khóa.

### 1.2 Đăng Nhập Bằng Email & Mật Khẩu (Credentials Provider)
- **Tệp cấu hình:** [`src/lib/auth.ts`](file:///c:/Users/AD/OneDrive/Desktop/Project/ULIS_DMST_2026/src/lib/auth.ts)
- **Quy trình xác thực:**
  1. Người dùng bấm Đăng nhập &rarr; NextAuth gọi hàm `authorize(credentials)`.
  2. Truy vấn người dùng theo email trong bảng `User`. Nếu không tìm thấy &rarr; Báo lỗi *"Email hoặc mật khẩu không chính xác"*.
  3. **Kiểm tra trạng thái tài khoản (`FR-AUTH-08`):** Nếu `user.status === "DISABLED"` &rarr; Từ chối đăng nhập với lỗi: *"Tài khoản của bạn đã bị khóa. Vui lòng liên hệ ban quản trị để được hỗ trợ."*
  4. So khớp mật khẩu với hàm `bcrypt.compare(password, user.password)`.
  5. Nếu chính xác &rarr; Cấp phiên JWT chứa `{ id, email, name, role, status }`. Chuyển hướng người dùng về trang chủ `/` (hoặc `/admin` nếu là Admin).

### 1.3 Đăng Nhập Một Chạm Bằng Google OAuth 2.0
- **Tệp cấu hình:** [`src/lib/auth.ts`](file:///c:/Users/AD/OneDrive/Desktop/Project/ULIS_DMST_2026/src/lib/auth.ts) & `.env.local`
- **Cơ chế hoạt động:**
  - Sử dụng Google OAuth Provider với Scopes: `openid email profile`.
  - Callback URL chuẩn hóa: `http://localhost:8000/api/auth/callback/google`.
  - Khi người dùng đăng nhập Google lần đầu:
    1. Callback `signIn()` tự động kiểm tra email trong CSDL MongoDB.
    2. Nếu chưa có: Tự động khởi tạo bản ghi `User` mới (`emailVerified: new Date()`, `role: "STUDENT"`, `status: "ACTIVE"`).
    3. Tự động khởi tạo `StudentProfile` rỗng tương ứng.
    4. Cấp phiên đăng nhập hợp lệ.

---

## 2. Tiêu Chí Nghiệm Thu (Acceptance Criteria)
- [x] **AC-01:** Đăng nhập đúng email/mật khẩu &rarr; Đăng nhập thành công, Topbar hiển thị tên và avatar của người dùng.
- [x] **AC-02:** Nhập sai mật khẩu &rarr; Hiển thị thông báo lỗi cụ thể, không crash ứng dụng.
- [x] **AC-03:** Tài khoản có trạng thái `DISABLED` trong MongoDB &rarr; Bị chặn hoàn toàn không thể đăng nhập.
- [x] **AC-04:** Bấm Đăng nhập Google &rarr; Mở cửa sổ ủy quyền của Google, xác nhận xong thì tự động đăng nhập vào UNERA.
