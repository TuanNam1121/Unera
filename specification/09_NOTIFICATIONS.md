# Cụm Tính Năng 09: Hệ Thống Thông Báo (Notifications)

> **Mã SRS:** `FR-NOTIF-01` đến `FR-NOTIF-09`  
> **Trạng thái:** ![Đã có Model & Bell](https://img.shields.io/badge/-ĐÃ%20CÓ%20MODEL%20%26%20BELL-blue) *(Cần hoàn thiện giao diện trung tâm thông báo)*  
> **Tác nhân:** Sinh viên (Student), Hệ thống (System)

---

## 1. Cách Thức Hoạt Động Hiện Tại (Current Implementation)

- **Mô hình dữ liệu:** [`src/models/Notification.ts`](file:///c:/Users/AD/OneDrive/Desktop/Project/ULIS_DMST_2026/src/models/Notification.ts)
  - `recipientId`: ID người nhận.
  - `type`: `DEADLINE_REMINDER`, `BOOKING_UPDATE`, `SYSTEM`, `OPPORTUNITY_UPDATE`.
  - `title`: Tiêu đề thông báo.
  - `message`: Nội dung chi tiết.
  - `link`: Đường dẫn chuyển hướng khi bấm vào thông báo.
  - `read`: Trạng thái đã đọc/chưa đọc.
- **Thanh điều hướng:** Nút biểu tượng Chuông thông báo trên [`src/components/common/Topbar.tsx`](file:///c:/Users/AD/OneDrive/Desktop/Project/ULIS_DMST_2026/src/components/common/Topbar.tsx) có chấm đỏ báo hiệu.

---

## 2. Kế Hoạch Triển Khai Tiếp Theo (Upcoming Implementation)

1. **Dropdown & Trang Trung Tâm Thông Báo (`/notifications`):**
   - Click vào icon chuông trên Topbar mở Popover danh sách 5 thông báo mới nhất.
   - Trang `/notifications`: Lọc theo các loại thông báo:
     - Thông báo sự kiện sắp diễn ra (`type=upcoming`).
     - Thông báo sự kiện mở đơn (`type=opened`).
     - Thông báo sự kiện sắp đóng đơn (`type=closing`).
     - Thông báo tuyển dụng (`type=jobs`).
   - Nút "Đánh dấu tất cả đã đọc".
2. **APIs Bổ Sung:**
   - `GET /api/notifications`: Lấy danh sách thông báo kèm số lượng chưa đọc (`unreadCount`).
   - `PATCH /api/notifications/[id]/read`: Đánh dấu một thông báo đã đọc.
   - `PATCH /api/notifications/read-all`: Đánh dấu toàn bộ đã đọc.
