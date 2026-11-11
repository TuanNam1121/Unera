# Tính Năng: Sidebar Quản Trị CMS Riêng Biệt & Mở Rộng Mục Con (Admin Sidebar)

> **Mã SRS:** `FR-ADM-15`  
> **Trạng thái:** ![Hoàn thành 100%](https://img.shields.io/badge/-ĐÃ%20HOÀN%20THÀNH%20100%25-emerald)  
> **Thuộc cụm:** `15_ADMIN_CMS_AND_AUDIT`  
> **Tác nhân:** Quản trị viên (Admin)

---

## 1. Cách Thức Hoạt Động Hiện Tại (Implementation Details)

### 1.1 Tách Biệt Hoàn Toàn Sidebar Admin Khỏi Sidebar Người Dùng
- Tệp nguồn giao diện: [`src/components/common/Sidebar.tsx`](file:///c:/Users/AD/OneDrive/Desktop/Project/ULIS_DMST_2026/src/components/common/Sidebar.tsx).
- Khi Admin truy cập bất kỳ route nào bắt đầu bằng `/admin`:
  - Sidebar chuyển đổi hoàn toàn sang **Giao diện Quản Trị Viên (Admin CMS)**.
  - Không hiển thị các danh mục sinh viên (như Lộ trình, Lịch, Ví chứng chỉ, v.v.).
  - Header Sidebar hiển thị huy hiệu `ADMIN CMS` với viền xanh công nghệ và icon `ShieldCheck`.

### 1.2 Hiển Thị Mục Con Mở Sẵn (Auto-expanded Submenu)
- Các cụm tính năng quản trị có cấu trúc phân cấp được mở sẵn các mục con ngay khi nhấp vào:
  - **Quản lý Nội dung (Content):**
    - `Cơ hội (Opportunities)` -> `/admin/opportunities`
    - `Đăng cơ hội mới` -> `/admin/opportunities/new`
    - `Tin tức & Bài viết` -> `/admin/news`
    - `Soạn bài viết mới` -> `/admin/news/new`
  - **Định hướng & Cố vấn:**
    - `Quản trị Quiz & Điểm 5 hướng` -> `/admin/quiz`
    - `Duyệt lịch hẹn Mentor` -> `/admin/bookings`
  - **Hệ thống & Người dùng:**
    - `Tài khoản Sinh viên` -> `/admin/students`
    - `Nhật ký kiểm toán (Audit Log)` -> `/admin/audit-logs`
  - Nút chuyển nhanh: *"Quay lại Cổng Sinh Viên"* ở chân sidebar.
