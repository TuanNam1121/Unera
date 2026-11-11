# Tính Năng: Đăng Ký Tài Khoản Sinh Viên (Student Registration)

> **Mã SRS:** `FR-AUTH-01`  
> **Trạng thái:** ![Hoàn thành](https://img.shields.io/badge/-ĐÃ%20HOÀN%20THÀNH%20100%25-emerald)  
> **Thuộc cụm:** `01_AUTHENTICATION`  
> **Tác nhân:** Khách vãng lai (Visitor)

---

## 1. Cách Thức Hoạt Động Hiện Tại (Implementation Details)

### 1.1 Giao Diện Người Dùng (`/register`)
- **Tệp nguồn:** [`src/app/(auth)/register/page.tsx`](file:///c:/Users/AD/OneDrive/Desktop/Project/ULIS_DMST_2026/src/app/(auth)/register/page.tsx)
- **Bố cục:** Thiết kế Split Screen hiện đại:
  - Cột trái: Form nhập liệu gồm Họ và tên (`fullName`), Địa chỉ Email (`email`), Mật khẩu (`password`), Xác nhận mật khẩu (`confirmPassword`), Nút Đăng ký và nút Đăng nhập nhanh bằng Google OAuth.
  - Cột phải: Khối đồ họa thương hiệu Polaris / Unera.
- **Validation Client-side:**
  - Kiểm tra email hợp lệ (regex).
  - Mật khẩu tối thiểu 8 ký tự.
  - Mật khẩu và Xác nhận mật khẩu phải trùng khớp 100%.

### 1.2 Xử Lý Phía Server (`POST /api/auth/register`)
- **Tệp nguồn:** [`src/app/api/auth/register/route.ts`](file:///c:/Users/AD/OneDrive/Desktop/Project/ULIS_DMST_2026/src/app/api/auth/register/route.ts)
- **Quy trình xử lý:**
  1. Nhận payload `{ fullName, email, password }`.
  2. Kết nối CSDL MongoDB (`connectToDatabase()`).
  3. Kiểm tra trùng lặp email trong bảng `User` (case-insensitive). Nếu đã tồn tại &rarr; trả về lỗi HTTP 409 Conflict *"Email này đã được đăng ký trong hệ thống"*.
  4. Mã hóa mật khẩu bằng thư viện `bcryptjs` với salt rounds = 10.
  5. Tạo bản ghi `User` mới:
     ```typescript
     const newUser = new User({
       name: fullName.trim(),
       email: email.toLowerCase().trim(),
       password: hashedPassword,
       role: "STUDENT",
       status: "ACTIVE",
     });
     ```
  6. **Tự động khởi tạo `StudentProfile` rỗng (`FR-PRO-01`):** Hệ thống lập tức tạo bản ghi hồ sơ sinh viên liên kết với `userId: newUser._id`, tên `fullName`, sẵn sàng cho sinh viên cập nhật học vấn sau này.
  7. Trả về HTTP 201 Created kèm thông báo thành công và chuyển hướng sinh viên về trang `/login`.

---

## 2. Tiêu Chí Nghiệm Thu (Acceptance Criteria)
- [x] **AC-01:** Khách truy cập nhập email chưa có trong hệ thống, mật khẩu $\ge 8$ ký tự, tạo tài khoản thành công.
- [x] **AC-02:** Kiểm tra CSDL MongoDB, mật khẩu được mã hóa băm an toàn (chuỗi `$2a$10$...`), không lưu plain-text.
- [x] **AC-03:** Kiểm tra bảng `student_profiles`, tự động xuất hiện 1 bản ghi mang `userId` của tài khoản vừa tạo.
- [x] **AC-04:** Đăng ký lại với email đã có sẽ bị từ chối với thông báo lỗi rõ ràng.
