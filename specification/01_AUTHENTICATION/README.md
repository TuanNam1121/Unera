# Cụm Module 01: Xác Thực & Quản Lý Tài Khoản (Authentication & Accounts)

> **Mã Module:** `01_AUTHENTICATION`  
> **Căn cứ SRS:** Mục 4.1 (`FR-AUTH-01` đến `FR-AUTH-13`)  
> **Trạng thái cụm:** ![Hoàn thành](https://img.shields.io/badge/-ĐÃ%20HOÀN%20THÀNH%20100%25-emerald)

---

## Danh Mục Các Tính Năng Con Trong Cụm

| Mã File | Tên Tính Năng Chi Tiết | Trạng Thái | Mô Tả & Endpoint |
|---|---|:---:|---|
| [`01_DANG_KY_TAI_KHOAN.md`](./01_DANG_KY_TAI_KHOAN.md) | Đăng ký tài khoản sinh viên | ![Hoàn thành](https://img.shields.io/badge/-DONE-emerald) | `POST /api/auth/register`, băm bcrypt salt 10, auto-sinh Profile. |
| [`02_DANG_NHAP_PASSWORD_GOOGLE.md`](./02_DANG_NHAP_PASSWORD_GOOGLE.md) | Đăng nhập mật khẩu & Google OAuth | ![Hoàn thành](https://img.shields.io/badge/-DONE-emerald) | NextAuth v5, chặn tài khoản `DISABLED`, Google OAuth 2.0. |
| [`03_DANG_XUAT.md`](./03_DANG_XUAT.md) | Đăng xuất an toàn | ![Hoàn thành](https://img.shields.io/badge/-DONE-emerald) | Xóa sạch cookie `authjs.session-token`, redirect `/login`. |
| [`04_QUEN_VA_DAT_LAI_MAT_KHAU.md`](./04_QUEN_VA_DAT_LAI_MAT_KHAU.md) | Quên & Khôi phục mật khẩu | ![Hoàn thành](https://img.shields.io/badge/-DONE-emerald) | Token crypto 32 bytes (TTL 30p), chống dò quét tài khoản, single-use. |
| [`05_XAC_THUC_EMAIL.md`](./05_XAC_THUC_EMAIL.md) | Xác thực địa chỉ email | ![Kế hoạch](https://img.shields.io/badge/-PLANNED-amber) | Model đã có `emailVerified`, kế hoạch gửi link kích hoạt qua email. |
| [`06_PHAN_QUYEN_ROLES_VA_ADMIN.md`](./06_PHAN_QUYEN_ROLES_VA_ADMIN.md) | Phân quyền Role & Đa quản trị viên | ![Hoàn thành](https://img.shields.io/badge/-DONE-emerald) | Role `STUDENT` vs `ADMIN`, helper `requireAdmin()`, 5 Admin accounts. |
| [`07_TRANG_THAI_TAI_KHOAN_VA_PHIEN.md`](./07_TRANG_THAI_TAI_KHOAN_VA_PHIEN.md) | Trạng thái tài khoản & Phiên đăng nhập | ![Hoàn thành](https://img.shields.io/badge/-DONE-emerald) | Trạng thái `ACTIVE` / `DISABLED`, cookie HttpOnly SameSite=lax. |
| [`08_CHAN_TU_XOA_TAI_KHOAN.md`](./08_CHAN_TU_XOA_TAI_KHOAN.md) | Chặn sinh viên tự xóa tài khoản | ![Hoàn thành](https://img.shields.io/badge/-DONE-emerald) | `DELETE /api/users/me` trả về 403 Forbidden theo quy định BR-29. |
