# Cụm Tính Năng 15: Bảng Điều Khiển Quản Trị & Nhật Ký Kiểm Toán (Admin CMS & Audit Logs)

> **Mã SRS:** `FR-ADM-01` đến `FR-ADM-08`, `FR-AUD-01` đến `FR-AUD-04`  
> **Trạng thái:** ![Hoàn thành 100%](https://img.shields.io/badge/-ĐÃ%20HOÀN%20THÀNH%20100%25-emerald)  
> **Tác nhân:** Quản trị viên (Admin)

---

## 1. Cách Thức Hoạt Động Hiện Tại (Current Implementation)

Toàn bộ hệ thống quản trị trung tâm đã được hoàn thiện với giao diện riêng biệt và cơ chế bảo mật nghiêm ngặt:

### 1.1 Thanh Điều Hướng Độc Quyền Của Admin (Dedicated Admin Sidebar)
- **Tệp mã nguồn:** [`src/components/common/Sidebar.tsx`](file:///c:/Users/AD/OneDrive/Desktop/Project/ULIS_DMST_2026/src/components/common/Sidebar.tsx)
- **Cơ chế tự động chuyển đổi giao diện:**
  - Khi người dùng ở bất kỳ URL nào bắt đầu bằng `/admin/*`, Sidebar **ẩn toàn bộ menu người dùng thông thường** và chỉ hiển thị các module quản trị chuyên sâu.
  - **Cơ chế Accordion mở tức thì:** Bấm vào bất kỳ dòng menu cha nào có mục con sẽ bung mở ngay lập tức toàn bộ các mục con (không cần click trúng icon mũi tên nhỏ).
- **Danh mục menu Admin:**
  1. *Tổng quan Quản trị* (`/admin`)
  2. *Quản lý Sinh viên* (`/admin/students`)
  3. *Quản trị Cơ hội* (`/admin/opportunities`)
  4. *Tin tức & Sự kiện* (`/admin/news`)
  5. *Cố vấn & Đặt lịch* (`/admin/bookings`)
  6. *Trắc nghiệm & Lộ trình* (`/admin/quiz`)
  7. *Nhật ký Kiểm toán* (`/admin/audit-logs`)

### 1.2 Bảng Điều Khiển Tổng Quan (`/admin`)
- **Tệp mã nguồn:** [`src/app/admin/page.tsx`](file:///c:/Users/AD/OneDrive/Desktop/Project/ULIS_DMST_2026/src/app/admin/page.tsx)
- **Thống kê thời gian thực (KPIs):**
  - Tổng số sinh viên & Tỷ lệ tăng trưởng.
  - Số cơ hội đang mở tuyển.
  - Lịch hẹn cố vấn đang chờ duyệt (`PENDING`).
  - Tỷ lệ sinh viên hoàn thành lộ trình.
- **Danh sách sinh viên mới đăng ký** và **Dòng sự kiện kiểm toán gần nhất** (Live Audit Trail Feed).

### 1.3 Quản Lý Tài Khoản Sinh Viên & Khóa/Mở Khóa Có Lý Do (`/admin/students` - `FR-ADM-02`)
- **Tệp mã nguồn:** [`src/app/admin/students/page.tsx`](file:///c:/Users/AD/OneDrive/Desktop/Project/ULIS_DMST_2026/src/app/admin/students/page.tsx)
- Tìm kiếm sinh viên theo tên, email, trường lớp, lọc theo trạng thái *ACTIVE* / *DISABLED*.
- **Modal Khóa/Mở khóa tài khoản:** Bắt buộc Admin phải nhập **Lý do hành động (Audit Reason)** trước khi xác nhận. Lý do này được ghi vĩnh viễn vào nhật ký kiểm toán.

### 1.4 Nhật Ký Kiểm Toán Append-Only & Trình Xem Khác Biệt (`/admin/audit-logs` - `FR-AUD-01..04`)
- **Tệp mã nguồn:** [`src/app/admin/audit-logs/page.tsx`](file:///c:/Users/AD/OneDrive/Desktop/Project/ULIS_DMST_2026/src/app/admin/audit-logs/page.tsx)
- **Đặc tính kỹ thuật:**
  - Bảng CSDL [`src/models/AuditLog.ts`](file:///c:/Users/AD/OneDrive/Desktop/Project/ULIS_DMST_2026/src/models/AuditLog.ts) là **Append-only** (Chỉ cho phép thêm mới, tuyệt đối không có API sửa hay xóa nhật ký kiểm toán).
  - Tự động ghi lại: Thời gian, IP Address, User Agent, ID Admin, Hành động (`CREATE`, `UPDATE`, `DELETE`, `STATUS_CHANGE`, `LOCK_ACCOUNT`, `UNLOCK_ACCOUNT`), Dữ liệu trước thay đổi (`changesBefore`) và sau thay đổi (`changesAfter`).
- **Diff Viewer Modal:** Cho phép Admin xem so sánh trực quan từng trường dữ liệu bị thay đổi (Before vs After) dưới dạng JSON đẹp mắt.

### 1.5 Danh Mục APIs Admin
- `GET /api/admin/dashboard/stats`: Thống kê realtime KPIs.
- `GET /api/admin/students`: Lấy danh sách sinh viên phân trang và tìm kiếm.
- `PATCH /api/admin/students/[id]/status`: Khóa hoặc mở khóa tài khoản kèm lý do kiểm toán.
- `GET /api/admin/audit-logs`: Lấy dòng sự kiện kiểm toán kèm bộ lọc hành động.
- `GET /api/admin/bookings`, `PATCH /api/admin/bookings/[id]`: Duyệt lịch hẹn và gửi Meet link.
- `GET /api/admin/news`, `POST /api/admin/news`, `PATCH /api/admin/news/[id]`, `DELETE /api/admin/news/[id]`.
- `GET /api/admin/quiz/questions`, `POST /api/admin/quiz/questions`, `PATCH /api/admin/quiz/questions/[id]`, `DELETE /api/admin/quiz/questions/[id]`.
