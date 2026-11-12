# NOTI-02: In-App Notification, Notification Center, Read Status & Reminder Settings (OP11–OP14)

> **Module:** `06_NOTIFICATIONS`  
> **Feature IDs:** `OP11` (In-app Notification), `OP12` (Notification Center), `OP13` (Notification Read Status), `OP14` (Reminder Settings).  
> **Tác nhân:** Student (đã đăng nhập).

---

## 1. Quy Tắc Nghiệp Vụ Từng Feature ID

### `OP11` — In-app Notification (Chuông Thông Báo trên Topbar)
- Cập nhật [`src/components/common/Topbar.tsx`](file:///c:/Users/AD/OneDrive/Desktop/Project/ULIS_DMST_2026/src/components/common/Topbar.tsx#L90-L99):
  - Thay dấu chấm xanh tĩnh hiện tại bằng **Badge đếm số thông báo chưa đọc thực tế** (`unreadCount`, hiển thị `"9+"` nếu `> 9`, ẩn nếu `=== 0`).
  - Khi bấm vào chuông: mở **Notification Dropdown Preview** hiển thị 5 thông báo mới nhất (tiêu đề, thời gian tương đối `"2 giờ trước"`, chấm xanh nếu chưa đọc), nút nhanh **"Đánh dấu đã đọc tất cả"** và link **"Xem tất cả thông báo"** → `/notifications`.
  - Đồng bộ polling định kỳ (mỗi 60 giây khi tab đang active) hoặc cập nhật khi chuyển trang.

### `OP12` — Notification Center (`/notifications`)
- Trang danh sách thông báo đầy đủ với bộ lọc tab khớp với Sidebar (`Tất cả`, `Chưa đọc`, `Nhắc hạn nộp [Deadline]`, `Sự kiện sắp diễn ra [Event]`, `Lộ trình & Hệ thống`).
- Phân trang (`page`, `limit = 20`).
- Mỗi dòng thông báo có icon phân biệt loại (Đồng hồ đỏ/vàng cho Deadline, Lịch xanh cho Event, AI/Roadmap cho Lộ trình), tiêu đề, nội dung, thời gian, trạng thái đọc/chưa đọc, và hành động click mở `link` chi tiết.

### `OP13` — Notification Read Status
- Đánh dấu **1 thông báo là đã đọc hoặc chưa đọc** (`PATCH /api/notifications/[id]`).
- Khi sinh viên bấm trực tiếp vào một thông báo chưa đọc để đi tới trang đích → tự động gọi đánh dấu đã đọc (`isRead: true`, `readAt: new Date()`) và giảm `unreadCount` trên Topbar.
- Nút **"Đánh dấu tất cả đã đọc"** (`PATCH /api/notifications/read-all`).
- Chỉ thao tác được trên thông báo của chính mình (`recipientId === authUser.id`).

### `OP14` — Reminder Settings (`/notifications/settings` hoặc tab Cài đặt trên `/notifications`)
- Giao diện Switch/Checkbox trực quan cho phép sinh viên tùy chỉnh:
  1. **Công tắc tổng:** Bật/tắt nhận thông báo nhắc nhở tự động (`enableReminders`).
  2. **Loại nhắc nhở:**
     - Nhắc trước Hạn chót nộp hồ sơ (`enableDeadlineReminder`)
     - Nhắc trước Ngày diễn ra sự kiện (`enableEventReminder`)
  3. **Các mốc thời gian nhắc:** Checkbox chọn từng mốc `30 ngày (1 tháng)`, `7 ngày (1 tuần)`, `1 ngày (Sắp tới)`.
  4. **Kênh nhận thông báo:** Thông báo trong ứng dụng UNERA (`channels.inApp`) và qua Email (`channels.email`).
- Lưu ngay lập tức qua `PUT /api/notifications/settings` kèm toast xác nhận.

---

## 2. Đặc Tả API Contract (`/api/notifications/*`)

Tất cả endpoint yêu cầu `requireAuth()`.

| Method | Endpoint | Feature ID | Mô tả |
|---|---|---|---|
| `GET` | `/api/notifications` | `OP11`, `OP12` | Lấy danh sách thông báo của user (query: `filter=all|unread`, `type`, `page`, `limit`) + `unreadCount` |
| `GET` | `/api/notifications/unread-count` | `OP11` | Trả `{ unreadCount }` nhẹ cho Topbar badge |
| `PATCH` | `/api/notifications/[id]` | `OP13` | Cập nhật `{ isRead: boolean }` cho 1 thông báo |
| `PATCH` | `/api/notifications/read-all` | `OP13` | Đánh dấu tất cả thông báo chưa đọc của user thành `isRead: true` |
| `GET` | `/api/notifications/settings` | `OP14` | Lấy cấu hình `ReminderSetting` của user (tự khởi tạo default nếu chưa có) |
| `PUT` | `/api/notifications/settings` | `OP14` | Cập nhật cấu hình `ReminderSetting` (Zod validated) |

---

## 3. Tiêu Chí Chấp Thuận

- **AC-01 (`OP11`, `OP12`):** *Given* sinh viên có 3 thông báo chưa đọc, *When* đăng nhập, *Then* icon chuông trên Topbar hiển thị số `3` và trang `/notifications` hiển thị đủ 3 thông báo này ở đầu danh sách.
- **AC-02 (`OP13`):** *Given* sinh viên bấm vào 1 thông báo chưa đọc hoặc bấm "Đánh dấu tất cả đã đọc", *Then* trạng thái `isRead` đổi thành `true` trong DB và badge trên Topbar giảm tương ứng.
- **AC-03 (`OP14`):** *Given* sinh viên tắt "Nhắc trước 1 tháng" và lưu cài đặt, *When* tải lại trang Settings, *Then* cấu hình giữ nguyên trạng thái đã tắt.

