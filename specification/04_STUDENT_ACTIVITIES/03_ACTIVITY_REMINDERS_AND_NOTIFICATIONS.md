# ACT-03: Nhắc Nhở Deadline & Ngày Diễn Ra Cho Hoạt Động Đã Quan Tâm (SA09–SA12)

> **Module:** `04_STUDENT_ACTIVITIES` (Liên thông chặt chẽ với `06_NOTIFICATIONS`)  
> **Feature IDs:** `SA09` (Deadline Reminder), `SA10` (Event Reminder), `SA11` (Notification Center), `SA12` (Reminder Settings).  
> **Tác nhân:** Student, System Scheduler.

---

## 1. Quy Tắc Nhắc Nhở Tích Hợp Với Hoạt Động Sinh Viên

1. **Điều kiện kích hoạt (`SA09`, `SA10`):**
   - Chỉ gửi nhắc nhở cho sinh viên đối với những hoạt động mà **sinh viên đã bấm "Quan tâm" (`ActivityFollow`)** và hoạt động chưa bị xóa/ẩn (`publishStatus === "PUBLISHED"`).
   - **Mốc nhắc nhở chuẩn theo yêu cầu:**
     - **Mốc 1 tháng (`30 ngày`):** Khi còn `29 < daysRemaining <= 30` (hoặc cửa sổ ngày `30` ngày trước mốc).
     - **Mốc 1 tuần (`7 ngày`):** Khi còn `6 < daysRemaining <= 7` (trước 1 tuần).
     - **Mốc sắp đến hạn / sắp diễn ra (`1 ngày` — có thể cấu hình thêm `3 ngày` hoặc `1 ngày`):** Khi còn `0 < daysRemaining <= 1` (ngày mai hết hạn / ngày mai diễn ra).
2. **Phân biệt rõ 2 luồng nhắc nhở:**
   - **`SA09` — Deadline Reminder:** Quét theo trường `StudentActivity.deadline`. Tiêu đề mẫu: `"[Nhắc hạn nộp hồ sơ - Còn 1 tuần] Học bổng Vingroup 2026"`.
   - **`SA10` — Event Reminder:** Quét theo trường `StudentActivity.eventDate`. Tiêu đề mẫu: `"[Sự kiện sắp diễn ra - Còn 1 ngày] Hội thảo NCKH Sinh viên 2026"`.
3. **Liên kết sang Notification Center (`SA11`) & Reminder Settings (`SA12`):**
   - Bấm vào thông báo → Mở thẳng trang chi tiết hoạt động `/activities/[slug]` và tự động đánh dấu đã đọc (`isRead = true`).
   - Trên tab **"Cơ hội đã quan tâm"** tại `/activities`, hiển thị nút icon bánh răng **"Cài đặt nhắc nhở"** (`SA12`) liên kết/mở drawer cấu hình `ReminderSetting` (Module 06 `OP14`), cho phép bật/tắt từng mốc `1 tháng`, `1 tuần`, `1 ngày` và loại nhắc (`Deadline` / `Event`).

*(Chi tiết kiến trúc Scheduler, Cron Job, Idempotency Key và Schema `Notification` / `ReminderSetting` xem tại [`specification/06_NOTIFICATIONS/MODULE_SPEC.md`](../06_NOTIFICATIONS/MODULE_SPEC.md) và [`01_DEADLINE_AND_EVENT_REMINDER_JOB.md`](../06_NOTIFICATIONS/01_DEADLINE_AND_EVENT_REMINDER_JOB.md)).*

---

## 2. Tiêu Chí Chấp Thuận

- **AC-01 (`SA09`):** *Given* Sinh viên A đang quan tâm hoạt động có `deadline` còn đúng 7 ngày (1 tuần) và đã bật cài đặt nhắc deadline 1 tuần, *When* Scheduler chạy, *Then* sinh viên nhận được 1 thông báo loại `ACTIVITY_DEADLINE_REMINDER` trong Notification Center.
- **AC-02 (`SA10`):** *Given* Sinh viên A đang quan tâm hội thảo có `eventDate` còn đúng 30 ngày (1 tháng), *When* Scheduler chạy, *Then* sinh viên nhận được 1 thông báo loại `ACTIVITY_EVENT_REMINDER`.
- **AC-03 (`SA12`):** *Given* Sinh viên tắt nhận nhắc nhở mốc 1 tháng trong Reminder Settings, *When* hoạt động đến mốc 30 ngày, *Then* không tạo thông báo mới cho mốc đó nhưng vẫn nhắc ở mốc 1 tuần và 1 ngày nếu đang bật.

