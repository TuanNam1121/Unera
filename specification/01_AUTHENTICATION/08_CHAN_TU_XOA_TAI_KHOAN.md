# Tính Năng: Chặn Sinh Viên Tự Xóa Tài Khoản (Student Self-Deletion Restriction)

> **Mã SRS:** `FR-AUTH-11`, `BR-29`  
> **Trạng thái:** ![Hoàn thành](https://img.shields.io/badge/-ĐÃ%20HOÀN%20THÀNH%20100%25-emerald)  
> **Thuộc cụm:** `01_AUTHENTICATION`  
> **Tác nhân:** Sinh viên (Student)

---

## 1. Cách Thức Hoạt Động Hiện Tại (Implementation Details)

Theo quy định học thuật của Trường đại học và ràng buộc nghiệp vụ bất biến `BR-29` trong SRS 1.0:
> *"The system shall not provide a Student-facing account deletion function. Student requests to delete their own account through Student interfaces or APIs shall be rejected. Admin account-status management remains available."*

### 1.1 Loại Bỏ Hoàn Toàn Nút Xóa Trên Giao Diện
- Trên toàn bộ giao diện của sinh viên (Trang cá nhân `/profile`, Cài đặt, Topbar), **hoàn toàn không có nút hoặc tùy chọn "Xóa tài khoản"**.

### 1.2 Chặn Đứng Phía Server (`DELETE /api/users/me`)
- **Tệp nguồn:** [`src/app/api/users/me/route.ts`](file:///c:/Users/AD/OneDrive/Desktop/Project/ULIS_DMST_2026/src/app/api/users/me/route.ts)
- **Cơ chế xử lý:**
  - Nếu kẻ xấu hoặc sinh viên cố tình dùng Postman / curl gửi request `DELETE /api/users/me` hoặc `DELETE /api/profile`, endpoint sẽ chặn đứng và trả về:
    - **HTTP Status:** `403 Forbidden`
    - **JSON Response:**
      ```json
      {
        "error": "Chức năng tự xóa tài khoản không khả dụng theo quy định của hệ thống đào tạo (BR-29). Vui lòng liên hệ Quản trị viên nếu cần vô hiệu hóa tài khoản."
      }
      ```
  - Dữ liệu học tập, lộ trình và hồ sơ của sinh viên được bảo vệ nguyên vẹn phục vụ công tác quản lý và kiểm toán đào tạo của Nhà trường.

---

## 2. Tiêu Chí Nghiệm Thu (Acceptance Criteria)
- [x] **AC-01:** Kiểm tra toàn bộ UI sinh viên, không có nút tự xóa tài khoản.
- [x] **AC-02:** Gửi request `DELETE /api/users/me` với token sinh viên hợp lệ &rarr; Nhận phản hồi HTTP 403 Forbidden.
