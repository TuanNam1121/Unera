# Tính Năng: Tùy Chọn Nhận Thông Báo & Chống Trùng Lặp (Preferences & De-duplication)

> **Mã SRS:** `FR-NOTI-05`, `FR-NOTI-06`, `FR-NOTI-08`  
> **Trạng thái:** ![Kế hoạch theo SRS](https://img.shields.io/badge/-KẾ%20HOẠCH%20THEO%20SRS-amber)  
> **Thuộc cụm:** `09_NOTIFICATIONS`  
> **Tác nhân:** Sinh viên (Student), Hệ thống Backend

---

## 1. Hiện Trạng Triển Khai
- Trang hồ sơ cá nhân [`src/app/profile/page.tsx`](file:///c:/Users/AD/OneDrive/Desktop/Project/ULIS_DMST_2026/src/app/profile/page.tsx) hiện đã có các tab thông tin cá nhân và kỹ năng.
- Cần bổ sung tab / phần cấu hình "Cài đặt thông báo" (Notification Preferences) và bảng trạng thái giao email.

---

## 2. Đặc Tả Nghiệp Vụ Theo SRS 1.0 (Specification)

### 2.1 Tùy Chọn Người Dùng (FR-NOTI-05)
- Sinh viên có quyền bật/tắt nhận email cho từng nhóm thông báo:
  - `emailRemindersEnabled`: Nhận email nhắc hạn deadline học bổng / việc làm.
  - `emailBookingUpdates`: Nhận email phản hồi phê duyệt lịch mentor.
  - `emailSystemAnnouncements`: Nhận email thông báo bảo trì, tin tức quan trọng từ nhà trường.
- Thông báo In-app nội bộ luôn luôn được ghi nhận để đảm bảo sinh viên không bỏ lỡ thông tin quan trọng khi truy cập hệ thống.

### 2.2 Cơ Chế Chống Trùng Lặp (FR-NOTI-06 - Duplicate Prevention)
- Khi chạy cron job quét deadline, hệ thống sử dụng khóa hỗn hợp duy nhất (Idempotency Key):
  `remindKey = `${studentId}_${opportunityId}_${milestoneDays}_${deadlineDate.toISOString().slice(0, 10)}``
- Ghi nhận `milestonesSent: ['7d', '3d', '1d']` trên bản ghi `CalendarEntry` hoặc bảng lịch sử nhắc nhở.
- Ngăn chặn triệt để tình trạng người dùng nhận nhiều email hoặc nhiều thông báo trùng lặp cho cùng 1 mốc thời gian nếu cron job kích hoạt lại.

### 2.3 Ghi Nhận Trạng Thái Chuyển Tiếp Email (FR-NOTI-08)
- Ghi nhận trạng thái chuyển email: `PENDING` -> `SENT` hoặc `FAILED`.
- Trong trường hợp nhà cung cấp email trả về mã lỗi (Rate limit, Invalid email), hệ thống ghi log chi tiết mã lỗi để ban quản trị đối soát, không gây nghẽn hàng đợi (queue non-blocking).
