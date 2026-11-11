# Đặc Tả Tính Năng: Thẩm Định Cơ Hội & Nguồn Gốc Minh Bạch

> **Mã tính năng:** `FR-EXP-05`, `FR-EXP-06`, `FR-EXP-07`, `FR-EXP-08`, `FR-EXP-09`, `FR-EXP-13`  
> **Thuộc cụm:** `05_06_EXPLORE_AND_SEARCH`  
> **Tác nhân:** Quản trị viên (Admin)  
> **Mức độ ưu tiên:** Bắt buộc (P0 - MVP)  
> **Trạng thái:** Confirmed Business Decision  

---

## 1. Nghiệp Vụ Bất Biến

1. **Độc quyền xuất bản bởi Admin (Admin-only Publishing - FR-EXP-13 & BR-13):**
   - Chỉ Admin mới có quyền tạo mới, chỉnh sửa, xuất bản và gỡ bỏ cơ hội.
   - Các công ty, doanh nghiệp hay câu lạc bộ sinh viên bên ngoài không có tài khoản và không thể tự đăng tin lên hệ thống.
2. **Minh bạch nguồn gốc (Source Provenance - FR-EXP-09 & BR-14):**
   - Mọi bản ghi cơ hội khi đăng tải bắt buộc phải lưu trữ:
     - `sourceName`: Tên tổ chức / Nguồn tin gốc (ví dụ: *Cổng thông tin Đại sứ quán Pháp, Trang tuyển dụng Unilever Vietnam*).
     - `sourceUrl`: Đường link dẫn đến thông báo gốc chính thức.
     - `verificationDate`: Thời điểm Admin tiến hành rà soát và kiểm duyệt nội dung.
     - `updatedByAdminId`: Tài khoản Admin chịu trách nhiệm duyệt/cập nhật bản ghi gần nhất.

---

## 2. Tiêu Chí Chấp Thuận

- **AC-01:** Sinh viên truy cập bất kỳ trang chi tiết cơ hội nào đều nhìn thấy mục "Nguồn thông tin" kèm liên kết kiểm chứng bên ngoài.
- **AC-02:** Sinh viên cố gắng gọi API tạo cơ hội bị hệ thống chặn bằng mã lỗi `403 Forbidden`.

