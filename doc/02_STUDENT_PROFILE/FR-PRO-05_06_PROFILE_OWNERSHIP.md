# Đặc Tả Tính Năng: Tổng Quan Hồ Sơ & Bảo Vệ Quyền Sở Hữu Dữ Liệu

> **Mã tính năng:** `FR-PRO-05`, `FR-PRO-06`  
> **Thuộc cụm:** `02_STUDENT_PROFILE`  
> **Tác nhân:** Sinh viên (Student), Quản trị viên (Admin)  
> **Mức độ ưu tiên:** Bắt buộc (P0 - Security Guardrail)  

---

## 1. Nghiệp Vụ Bảo Mật & Phân Quyền Sở Hữu (Data Isolation)

1. **Tổng quan Hồ sơ 360 (FR-PRO-05):**
   - Màn hình `/profile` cung cấp cái nhìn toàn diện về quá trình học tập:
     - Thẻ thông tin cá nhân (Ảnh đại diện, Họ tên, Trường, Ngành, Năm học).
     - Thẻ mục tiêu phát triển & tiến độ lộ trình hiện tại.
     - Danh sách kỹ năng và thành tích.
     - Số lượng cơ hội đã lưu (`SavedOpportunity`) và số lượng hồ sơ đang theo dõi (`Application`).
2. **Quyền sở hữu tuyệt đối (Profile Ownership - FR-PRO-06 & BR-03):**
   - **Sinh viên chỉ có quyền xem và chỉnh sửa duy nhất hồ sơ thuộc quyền sở hữu của mình.**
   - Hệ thống ngăn chặn việc thay đổi hoặc xem trộm hồ sơ của sinh viên khác thông qua việc thay đổi ID trên URL hoặc trong body request (ID Insecure Direct Object References - IDOR).
   - Backend luôn lấy `userId` từ token phiên đã ký (`session.user.id`).

---

## 2. Tiêu Chí Chấp Thuận

- **AC-01:** Sinh viên A (ID `user_A`) cố ý gửi request `PUT /api/profile` kèm ID của Sinh viên B (`user_B`). Backend tự động bỏ qua `user_B` và chỉ cập nhật dữ liệu của `user_A`.
- **AC-02:** Sinh viên không thể xem trang chỉnh sửa hồ sơ của người khác.
