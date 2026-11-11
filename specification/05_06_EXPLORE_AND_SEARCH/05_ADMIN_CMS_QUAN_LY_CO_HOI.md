# Tính Năng: Admin CMS Quản Trị Cơ Hội (Admin Opportunity CMS)

> **Mã SRS:** `FR-OPP-07` đến `FR-OPP-14`  
> **Trạng thái:** ![Hoàn thành](https://img.shields.io/badge/-ĐÃ%20HOÀN%20THÀNH%20100%25-emerald)  
> **Thuộc cụm:** `05_06_EXPLORE_AND_SEARCH`  
> **Tác nhân:** Quản trị viên (Admin)

---

## 1. Cách Thức Hoạt Động Hiện Tại (Implementation Details)

### 1.1 Bảng Quản Trị Cơ Hội (`/admin/opportunities`)
- **Tệp nguồn:** [`src/app/admin/opportunities/page.tsx`](file:///c:/Users/AD/OneDrive/Desktop/Project/ULIS_DMST_2026/src/app/admin/opportunities/page.tsx)
- Hiển thị bảng cơ hội có phân trang, bộ lọc chuyên mục và trạng thái (*DRAFT*, *PUBLISHED*, *CLOSED*, *ARCHIVED*).
- Hiển thị nhãn version locking của từng bản ghi.
- Nút thao tác nhanh: Đóng đơn tuyển (`CLOSED`), Xuất bản (`PUBLISHED`), Sửa, Xóa.

### 1.2 Form Đăng Cơ Hội Mới (`/admin/opportunities/new`)
- **Tệp nguồn:** [`src/app/admin/opportunities/new/page.tsx`](file:///c:/Users/AD/OneDrive/Desktop/Project/ULIS_DMST_2026/src/app/admin/opportunities/new/page.tsx)
- Điền Tiêu đề, Chuyên mục, Ngày mở, Hạn chót, Địa điểm, Yêu cầu, Quyền lợi, Hướng dẫn nộp đơn.
- Toggle "Cơ hội có tài trợ (`isSponsored`)" và link nguồn tin chính thức.
- Tự động ghi nhật ký kiểm toán vào `AuditLog`.
