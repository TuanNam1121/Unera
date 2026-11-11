# Tính Năng: Quản Trị Danh Mục Chứng Chỉ & Hoạt Động (Admin Content Moderation)

> **Mã SRS:** `FR-CERT-06`, `FR-ACT-06`, `FR-ADM-07`, `FR-ADM-08`  
> **Trạng thái:** ![Kế hoạch theo SRS](https://img.shields.io/badge/-KẾ%20HOẠCH%20THEO%20SRS-amber)  
> **Thuộc cụm:** `12_CERTIFICATES_AND_ACTIVITIES`, `15_ADMIN_CMS_AND_AUDIT`  
> **Tác nhân:** Quản trị viên (Admin)

---

## 1. Hiện Trạng Triển Khai
- Quản trị viên hiện đã quản lý các cơ hội hoạt động/cuộc thi thông qua mục `/admin/opportunities`.
- Cần mở rộng bảng quản trị danh mục chứng chỉ chuẩn và sự kiện phong trào chuyên biệt tại `/admin/certificates` và `/admin/activities`.

---

## 2. Đặc Tả Nghiệp Vụ Theo SRS 1.0 (Specification)

### 2.1 Quản Trị Danh Mục Chứng Chỉ (FR-CERT-06, FR-ADM-07)
- Admin có quyền:
  - Thêm mới chứng chỉ: Tên, Đơn vị cấp, Lệ phí tham khảo, Thời hạn giá trị (tháng), Danh sách tài liệu luyện thi.
  - Sửa đổi biểu phí, cập nhật quy chế điểm quy đổi theo thông báo mới nhất của Nhà trường hoặc ĐHQGHN.
  - Tạm ẩn hoặc kích hoạt chứng chỉ trong danh mục.

### 2.2 Quản Trị Danh Mục Hoạt Động (FR-ACT-06, FR-ADM-08)
- Admin có quyền:
  - Đăng tải thông báo hoạt động mới: Tiêu đề, Đơn vị tổ chức (Đoàn Thanh niên, Hội Sinh viên, Doanh nghiệp), Hạn đăng ký, Điểm rèn luyện quy đổi, Link form đăng ký.
  - Đóng nhận đăng ký khi hoạt động đã hết hạn hoặc đủ số lượng sinh viên.
  - Ghi nhật ký kiểm toán (Audit Log) cho mọi thao tác sửa đổi danh mục.
