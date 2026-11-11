# Đặc Tả Tính Năng: Trạng Thái Tài Khoản & Ràng Buộc Không Tự Xóa

> **Mã tính năng:** `FR-AUTH-08`, `FR-AUTH-11`  
> **Thuộc cụm:** `01_AUTHENTICATION`  
> **Tác nhân thực hiện:** Sinh viên (Student), Quản trị viên (Admin)  
> **Mức độ ưu tiên:** Bắt buộc (P0 - MVP)  
> **Trạng thái:** Confirmed  

---

## 1. Mục Tiêu & Nghiệp Vụ

1. **Quản lý trạng thái tài khoản (Account Status - FR-AUTH-08):**
   - Hệ thống duy trì trạng thái tài khoản: `ACTIVE` (Đang hoạt động) và `DISABLED` (Đã bị vô hiệu hóa).
   - Chỉ có Admin mới có quyền chuyển đổi trạng thái tài khoản của người dùng từ `ACTIVE` sang `DISABLED` và ngược lại.
   - Khi tài khoản chuyển sang `DISABLED`:
     - Người dùng bị từ chối đăng nhập.
     - Mọi API gọi kèm session của tài khoản này ngay lập tức bị từ chối với HTTP 403 Forbidden.
2. **Ràng buộc cấm sinh viên tự xóa tài khoản (FR-AUTH-11 & BR-29):**
   - **Giao diện sinh viên tuyệt đối không cung cấp nút hoặc luồng "Xóa tài khoản của tôi".**
   - **Hệ thống không cung cấp API cho phép sinh viên tự xóa tài khoản của mình.** Mọi yêu cầu `DELETE /api/users/me` hoặc tương tự từ client phải bị từ chối với mã lỗi `403 Forbidden` cùng thông điệp: *"Chức năng tự xóa tài khoản không được hỗ trợ. Vui lòng liên hệ ban quản trị để được hỗ trợ khóa tài khoản."*
   - Chính sách lưu trữ/xóa dữ liệu dài hạn khi tài khoản bị khóa thuộc diện **TBD** và được quản lý tập trung bởi Admin.

---

## 2. Tiêu Chí Chấp Thuận

- **AC-01:** Trên toàn bộ trang Cài đặt / Hồ sơ sinh viên (`/profile/settings`), không xuất hiện mục "Xóa tài khoản" (Delete Account).
- **AC-02:** Nếu sinh viên gọi trực tiếp API `DELETE /api/users/:id` nhắm vào chính mình, backend trả về HTTP `403 Forbidden`.
- **AC-03:** Admin thay đổi trạng thái sinh viên sang `DISABLED`, tài khoản đó không thể thực hiện bất kỳ hành động nào trong hệ thống ở lần request tiếp theo.

