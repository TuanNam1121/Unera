# Tính Năng: Quản Trị Soạn Thảo & Đăng Bài Viết CMS (Admin News Management)

> **Mã SRS:** `FR-NEWS-04`, `FR-ADM-04`, `FR-ADM-12`  
> **Trạng thái:** ![Hoàn thành 100%](https://img.shields.io/badge/-ĐÃ%20HOÀN%20THÀNH%20100%25-emerald)  
> **Thuộc cụm:** `13_14_COMMUNITY_AND_NEWS`, `15_ADMIN_CMS_AND_AUDIT`  
> **Tác nhân:** Quản trị viên (Admin)

---

## 1. Cách Thức Hoạt Động Hiện Tại (Implementation Details)

### 1.1 Giao Diện Danh Sách Bài Viết Admin (`/admin/news`)
- Tệp nguồn giao diện: [`src/app/admin/news/page.tsx`](file:///c:/Users/AD/OneDrive/Desktop/Project/ULIS_DMST_2026/src/app/admin/news/page.tsx).
- Quản lý toàn diện:
  - Bảng danh sách bài viết: Tiêu đề, danh mục, tác giả, trạng thái (`PUBLISHED`, `DRAFT`, `ARCHIVED`), ngày tạo.
  - Các nút hành động: Xem nhanh, Chỉnh sửa, Đổi trạng thái xuất bản, Xóa bài.
  - Nút thêm mới bài viết dẫn tới `/admin/news/new`.

### 1.2 Trình Soạn Thảo Bài Viết (`/admin/news/new`)
- Tệp nguồn: [`src/app/admin/news/new/page.tsx`](file:///c:/Users/AD/OneDrive/Desktop/Project/ULIS_DMST_2026/src/app/admin/news/new/page.tsx).
- Cho phép Admin nhập:
  - Tiêu đề bài viết và tự động sinh slug URL thân thiện.
  - Tóm tắt dẫn dắt (Summary).
  - Nội dung bài viết đầy đủ (hỗ trợ phân đoạn, định dạng).
  - Ảnh bìa bài viết (URL hoặc tải lên).
  - Thời lượng đọc ước tính (`readTime`).
  - Gán danh mục (`category`), tác giả (`author`), nguồn bài viết (`source`).
  - Tùy chọn gán bài viết nổi bật (`isFeatured`) và nội dung tài trợ (`isSponsored`).
  - Trạng thái: Lưu nháp (`DRAFT`) hoặc Xuất bản ngay (`PUBLISHED`).

### 1.3 Backend APIs & Kiểm Toán
- `GET /api/admin/news`: Danh sách tất cả bài viết phục vụ quản trị.
- `POST /api/admin/news`: Tạo bài viết mới.
- `PATCH /api/admin/news/[id]`: Cập nhật nội dung hoặc trạng thái.
- `DELETE /api/admin/news/[id]`: Xóa bài viết khỏi hệ thống.
- Tự động ghi nhật ký kiểm toán vào [`src/models/AuditLog.ts`](file:///c:/Users/AD/OneDrive/Desktop/Project/ULIS_DMST_2026/src/models/AuditLog.ts).
