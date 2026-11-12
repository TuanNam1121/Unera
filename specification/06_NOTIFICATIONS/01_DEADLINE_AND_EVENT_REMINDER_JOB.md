# NOTI-01: Engine Nhắc Nhở Deadline & Sự Kiện Tự Động (OP09, OP10)

> **Module:** `06_NOTIFICATIONS`  
> **Feature IDs:** `OP09` (Deadline Reminder: 1 tháng, 1 tuần, 1 ngày), `OP10` (Event Reminder: trước ngày diễn ra theo các mốc thiết lập).  
> **Liên thông:** Module 04 (`SA05` Follow Activity, `SA09`, `SA10`).

---

## 1. Quy Tắc Nghiệp Vụ & Thuật Toán Tính Mốc Nhắc

1. **Mốc thời gian chuẩn (`constants/index.ts`):**
   - Cập nhật `REMINDER_OFFSETS_DAYS = [30, 7, 1]`:
     - `30`: **Trước 1 tháng**
     - `7`: **Trước 1 tuần**
     - `1`: **Trước 1 ngày (Sắp đến hạn / Sắp diễn ra)**
2. **Phạm vi quét đối tượng:**
   - Chỉ quét các bản ghi `ActivityFollow` của những **sinh viên đang `ACTIVE`** và **hoạt động đang `PUBLISHED`** (chưa bị đóng thủ công `manualClosed !== true`).
   - Kiểm tra cấu hình `ReminderSetting` của sinh viên:
     - Nếu không có bản ghi `ReminderSetting`, áp dụng mặc định (`enableReminders: true`, `enableDeadlineReminder: true`, `enableEventReminder: true`, `offsetsDays: [30, 7, 1]`, `channels: { inApp: true, email: true }`).
     - Nếu `enableReminders === false` → Bỏ qua sinh viên này.
3. **Tính toán cửa sổ nhắc (Theo múi giờ chuẩn `Asia/Ho_Chi_Minh` UTC+7):**
   - Tính `daysUntilTarget = differenceInCalendarDays(targetDate_VN, today_VN)`.
   - Nếu `daysUntilTarget` thuộc danh sách mốc đã bật của sinh viên (VD: `30`, `7`, hoặc `1`), và `follow.notifyDeadline === true` (cho `deadline`) hoặc `follow.notifyEvent === true` (cho `eventDate`):
     - Sinh `idempotencyKey = "${studentId}:${activityId}:${reminderType}:${daysUntilTarget}:${targetDateYYYYMMDD}"`.
     - Chèn vào `notifications` với `insertOne` / `upsert` kiểm tra `idempotencyKey` unique index:
       - Nếu đã tồn tại → Bỏ qua (chống gửi trùng dù cron chạy nhiều lần trong ngày!).
       - Nếu tạo mới thành công → Cập nhật in-app notification và gửi email (nếu `channels.email === true` và đã cấu hình SMTP).
4. **Cơ chế kích hoạt Scheduler:**
   - **Vercel Cron / Scheduled API (`POST /api/cron/reminders`):** Bảo vệ bằng header `Authorization: Bearer ${CRON_SECRET}` (chạy định kỳ mỗi ngày lúc 07:00 sáng giờ VN hoặc mỗi 6 giờ để không bỏ sót).
   - Ngoài ra, có thể trigger kiểm tra nhẹ cho user hiện tại khi họ đăng nhập / gọi `GET /api/notifications/unread-count` (với throttle tối đa 1 lần mỗi 1 giờ/user) để đảm bảo trong môi trường local dev không có Vercel Cron thông báo vẫn hoạt động mượt mà!

---

## 2. Mẫu Nội Dung Thông Báo

- **`OP09` Deadline Reminder:**
  - `offset = 30`: *"Còn 1 tháng tới hạn nộp: [Tên hoạt động]"* — *"Hạn chót đăng ký là ngày dd/MM/yyyy. Hãy kiểm tra hồ sơ và chuẩn bị sớm!"*
  - `offset = 7`: *"Còn 1 tuần tới hạn nộp: [Tên hoạt động]"* — *"Chỉ còn 7 ngày nữa là đóng đơn vào dd/MM/yyyy."*
  - `offset = 1`: *"Sắp hết hạn (Ngày mai): [Tên hoạt động]"* — *"Hạn chót là ngày mai (dd/MM/yyyy). Đừng bỏ lỡ cơ hội bạn đã quan tâm!"*
- **`OP10` Event Reminder:**
  - `offset = 30 / 7 / 1`: *"[Còn 1 tháng / Còn 1 tuần / Ngày mai diễn ra]: [Tên chương trình]"* — *"Chương trình sẽ diễn ra vào dd/MM/yyyy lúc HH:mm tại [Địa điểm]."*

---

## 3. Tiêu Chí Chấp Thuận

- **AC-01 (`OP09`):** *Given* sinh viên đã Quan tâm một học bổng có `deadline` cách hôm nay đúng 30 ngày / 7 ngày / 1 ngày, *When* job `/api/cron/reminders` chạy, *Then* tạo đúng 1 thông báo `DEADLINE_REMINDER` tương ứng cho mốc đó.
- **AC-02 (`OP10`):** *Given* sinh viên đã Quan tâm một hội thảo có `eventDate` cách hôm nay 7 ngày, *When* job chạy, *Then* tạo đúng 1 thông báo `EVENT_REMINDER`.
- **AC-03 (Chống trùng lặp):** *Given* job `/api/cron/reminders` chạy lại lần thứ 2 trong cùng ngày, *Then* không tạo thêm bản ghi thông báo trùng lặp nhờ `idempotencyKey`.
- **AC-04 (Bảo mật Cron):** *Given* request gọi `POST /api/cron/reminders` không có hoặc sai `CRON_SECRET`, *Then* trả về `401 Unauthorized`.

