# Module 06: Notification — Thông Báo & Nhắc Nhở (OP09–OP14)

> **Mã Module:** `NOTIFICATIONS`  
> **Yêu cầu liên quan:** `OP09` (Deadline Reminder 1 tháng, 1 tuần, 1 ngày), `OP10` (Event Reminder theo mốc thời gian), `OP11` (In-app Notification), `OP12` (Notification Center), `OP13` (Notification Read Status), `OP14` (Reminder Settings).  
> **Trạng thái hiện tại:** Mới chỉ có [`src/models/Notification.ts`](file:///c:/Users/AD/OneDrive/Desktop/Project/ULIS_DMST_2026/src/models/Notification.ts) với `DEADLINE_REMINDER` và `constants` đang là `[7, 3, 1]` ngày. Chưa có UI `/notifications`, chưa có API `/api/notifications`, chưa có cron reminder, chưa có `ReminderSetting`.  
> **Tác nhân:** Student, System Scheduler / Cron Job.

---

## 1. Mở Rộng Mô Hình Dữ Liệu (MongoDB / Mongoose)

### 1.1 Mở rộng `notifications` ([`Notification.ts`](file:///c:/Users/AD/OneDrive/Desktop/Project/ULIS_DMST_2026/src/models/Notification.ts))
| Trường | Kiểu | Mô tả |
|---|---|---|
| `recipientId` | `String` (ObjectId string) | User ID nhận thông báo, index |
| `type` | `Enum` | `"DEADLINE_REMINDER"` \| `"EVENT_REMINDER"` \| `"ROADMAP_UPDATE"` \| `"AI_ANALYSIS_READY"` \| `"SYSTEM_ANNOUNCEMENT"` |
| `title` | `String` | Tiêu đề ngắn gọn rõ ràng |
| `message` | `String` | Nội dung chi tiết thông báo |
| `link` | `String` | URL điều hướng khi click (VD: `/activities/[slug]`) |
| `isRead` | `Boolean` | Mặc định `false`, index |
| `readAt` | `Date` | Thời điểm đánh dấu đã đọc (`null` nếu chưa đọc) |
| `channel` | `Enum` | `"IN_APP"` \| `"EMAIL"` |
| `activityId` | `String` | Ref `student_activities._id` (tương thích/thay `opportunityId`) |
| `reminderType` | `Enum` | `"DEADLINE"` \| `"EVENT"` (tùy chọn, dùng cho nhắc hẹn) |
| `reminderOffsetDays` | `Number` | `30` (1 tháng) \| `7` (1 tuần) \| `1` (1 ngày) |
| `idempotencyKey` | `String` | **Unique sparse index**: `${recipientId}:${activityId}:${reminderType}:${reminderOffsetDays}:${targetDateISO}` — đảm bảo không bao giờ gửi trùng một mốc cho cùng hạn/ngày sự kiện, nhưng vẫn nhắc lại được nếu Admin gia hạn ngày mới! |

### 1.2 Collection mới `reminder_settings` (`OP14`, `SA12`)
| Trường | Kiểu | Mặc định | Mô tả |
|---|---|---|---|
| `userId` | `ObjectId` | Unique index | Tham chiếu `users._id` |
| `enableReminders` | `Boolean` | `true` | Bật/tắt tổng thể toàn bộ thông báo nhắc nhở |
| `enableDeadlineReminder` | `Boolean` | `true` | Bật/tắt nhắc hạn nộp hồ sơ (`OP09`) |
| `enableEventReminder` | `Boolean` | `true` | Bật/tắt nhắc ngày diễn ra chương trình (`OP10`) |
| `offsetsDays` | `Number[]` | `[30, 7, 1]` | Các mốc ngày được chọn: `30` (1 tháng), `7` (1 tuần), `1` (1 ngày) |
| `channels.inApp` | `Boolean` | `true` | Nhận thông báo In-app (`OP11`) |
| `channels.email` | `Boolean` | `true` | Nhận email nhắc nhở (tùy chọn) |

---

## 2. Danh Sách Đặc Tả Chi Tiết

| Mã | Tính năng bao phủ | Tệp |
|---|---|---|
| `NOTI-01` | `OP09`, `OP10` (Engine nhắc nhở Deadline & Event 1 tháng / 1 tuần / 1 ngày) | [`01_DEADLINE_AND_EVENT_REMINDER_JOB.md`](./01_DEADLINE_AND_EVENT_REMINDER_JOB.md) |
| `NOTI-02` | `OP11`, `OP12`, `OP13`, `OP14` (In-app Bell, Notification Center, Read Status & Reminder Settings) | [`02_IN_APP_CENTER_READ_STATUS_AND_SETTINGS.md`](./02_IN_APP_CENTER_READ_STATUS_AND_SETTINGS.md) |

