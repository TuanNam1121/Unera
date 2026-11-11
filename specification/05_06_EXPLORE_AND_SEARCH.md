# Cụm Tính Năng 05 & 06: Khám Phá Cơ Hội & Tìm Kiếm Đa Chiều (Explore, Search & Filtering)

> **Mã SRS:** `FR-OPP-01` đến `FR-OPP-14`, `FR-SRCH-01` đến `FR-SRCH-07`  
> **Trạng thái:** ![Hoàn thành MVP](https://img.shields.io/badge/-ĐÃ%20HOÀN%20THÀNH%20(MVP)-emerald)  
> **Tác nhân:** Sinh viên (Student), Quản trị viên (Admin)

---

## 1. Cách Thức Hoạt Động Hiện Tại (Current Implementation)

Cung cấp cổng thông tin tập trung về học bổng, việc làm, hội thảo, thực tập và các chương trình sinh viên:

### 1.1 Giao Diện Khám Phá Của Sinh Viên (`/explore`)
- **Tệp mã nguồn:** [`src/app/explore/page.tsx`](file:///c:/Users/AD/OneDrive/Desktop/Project/ULIS_DMST_2026/src/app/explore/page.tsx)
- **Thanh tìm kiếm & Bộ lọc chuẩn hóa:**
  - Lọc theo 7 chuyên mục: *Học bổng*, *Du học*, *Thực tập*, *Cuộc thi*, *Nghiên cứu khoa học*, *Workshop*, *Chương trình sinh viên*.
  - Lọc theo phạm vi địa lý: *Trong nước* (`isDomestic: true`) vs *Quốc tế* (`isDomestic: false`).
  - Lọc theo trạng thái: *Đang mở nộp đơn*, *Sắp mở*, *Đã đóng*.
- **Thẻ Cơ Hội (Opportunity Card):**
  - Hiển thị Tiêu đề, Đơn vị tổ chức, Hạn chót nộp đơn kèm số ngày đếm ngược (ví dụ: *"Còn 3 ngày"*).
  - Nút lưu cơ hội (Bookmark).
  - Nút "Thêm vào lịch" (`FR-CAL-01`).

### 1.2 Phân Hệ Quản Trị Cơ Hội Của Admin
- **Danh sách cơ hội (`/admin/opportunities`):** [`src/app/admin/opportunities/page.tsx`](file:///c:/Users/AD/OneDrive/Desktop/Project/ULIS_DMST_2026/src/app/admin/opportunities/page.tsx)
  - Hiển thị bảng cơ hội, trạng thái kiểm duyệt, nhãn version locking.
- **Tạo cơ hội mới (`/admin/opportunities/new`):** [`src/app/admin/opportunities/new/page.tsx`](file:///c:/Users/AD/OneDrive/Desktop/Project/ULIS_DMST_2026/src/app/admin/opportunities/new/page.tsx)
  - Form đăng tin đầy đủ tiêu đề, hạn chót, yêu cầu, quyền lợi, cờ tài trợ (`isSponsored`).

### 1.3 Cơ Chế Khóa Lạc Quan (Optimistic Concurrency Locking - `FR-OPP-11`)
- Trường `version: number` trong [`src/models/Opportunity.ts`](file:///c:/Users/AD/OneDrive/Desktop/Project/ULIS_DMST_2026/src/models/Opportunity.ts).
- Khi Admin lưu chỉnh sửa, hệ thống kiểm tra xem bản ghi trong DB có cùng version hay không. Nếu có Admin khác đã sửa trước đó, hệ thống sẽ cảnh báo xung đột (Conflict 409) và yêu cầu tải lại dữ liệu mới nhất.

### 1.4 Backend APIs
- **`GET /api/opportunities`:** Tìm kiếm cơ hội có phân trang, lọc theo chuyên mục, địa lý, trạng thái.
- **`GET /api/opportunities/[id]`:** Lấy chi tiết cơ hội.
- **`POST /api/opportunities`:** Admin đăng cơ hội mới.
- **`PATCH /api/opportunities/[id]`:** Admin cập nhật thông tin kèm kiểm tra version.
