# Tính Năng: Lịch Nhắc Hạn Tự Động Kênh Đôi (Dual-Channel Automated Reminders)

> **Mã SRS:** `FR-NOTI-02`, `FR-NOTI-09`, `FR-NOTI-10`, `FR-NOTI-11`, `FR-NOTI-12`, `FR-NOTI-13`, `FR-NOTI-14`  
> **Trạng thái:** ![Kế hoạch theo SRS](https://img.shields.io/badge/-KẾ%20HOẠCH%20THEO%20SRS-amber)  
> **Thuộc cụm:** `09_NOTIFICATIONS`  
> **Tác nhân:** Hệ thống tự động (Cron Job / Background Worker), Sinh viên (Student)

---

## 1. Hiện Trạng Triển Khai
- Mô hình lưu lịch của sinh viên đã hoạt động tại [`src/models/CalendarEntry.ts`](file:///c:/Users/AD/OneDrive/Desktop/Project/ULIS_DMST_2026/src/models/CalendarEntry.ts).
- Các mốc deadline cơ hội được lưu trữ tại [`src/models/Opportunity.ts`](file:///c:/Users/AD/OneDrive/Desktop/Project/ULIS_DMST_2026/src/models/Opportunity.ts).
- Cần xây dựng background scheduler (Node cron / Vercel Cron) để quét và gửi thông báo kênh đôi.

---

## 2. Đặc Tả Nghiệp Vụ Theo SRS 1.0 (Specification)

### 2.1 Tiêu Chuẩn Lịch Nhắc (FR-NOTI-10)
- Hệ thống tự động quét và gửi nhắc hạn theo 3 mốc cố định:
  1. **Trước 7 ngày (7 days prior):** Nhắc chuẩn bị hồ sơ bước đầu.
  2. **Trước 3 ngày (3 days prior):** Nhắc hoàn thiện bản thảo, xin thư giới thiệu.
  3. **Trước 1 ngày (1 day prior / 24h):** Nhắc nộp đơn khẩn cấp trước giờ G.

### 2.2 Kênh Đôi Kèm Cô Lập Lỗi (Dual Channel & Isolation)
- **Kênh thông báo (FR-NOTI-11):** Gửi đồng thời qua:
  - **In-app Notification:** Hiện ngay trong chuông thông báo và trang `/notifications`.
  - **Email Notification (FR-NOTI-02):** Gửi qua dịch vụ SMTP (Nodemailer / Resend) đến email sinh viên đã đăng ký.
- **Cô lập lỗi (FR-NOTI-14):** Sự cố thất bại khi gửi email (ví dụ lỗi mạng SMTP, email sai) **tuyệt đối không được làm gián đoạn** việc tạo in-app notification nội bộ và không gây crash cron job.

### 2.3 Xử Lý Ghi Danh Muộn & Xóa Mục Lịch (Edge Cases)
- **FR-NOTI-12 (Removed Entry Handling):** Khi sinh viên gỡ cơ hội ra khỏi lịch (`DELETE /api/calendar`), tất cả các thông báo nhắc hạn trong tương lai phải bị hủy bỏ ngay lập tức. Lịch sử các thông báo đã gửi trong quá khứ được giữ nguyên (không bị xóa).
- **FR-NOTI-13 (Late Enrollment):** Nếu sinh viên thêm cơ hội vào lịch khi thời hạn còn **dưới 7 ngày** (ví dụ còn 5 ngày), hệ thống bỏ qua mốc 7 ngày và kích hoạt mốc nhắc kế tiếp (3 ngày và 1 ngày), không gửi dồn dập thông báo quá khứ.
