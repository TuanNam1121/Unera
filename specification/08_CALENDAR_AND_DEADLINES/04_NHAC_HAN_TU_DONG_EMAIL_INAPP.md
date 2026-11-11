# Tính Năng: Nhắc Hạn Tự Động Qua Email & In-App (Automated Deadline Reminders)

> **Mã SRS:** `FR-CAL-08` đến `FR-CAL-11`, `FR-NOTI-09..11`  
> **Trạng thái:** ![Kế hoạch theo SRS](https://img.shields.io/badge/-KẾ%20HOẠCH%20THEO%20SRS-amber)  
> **Thuộc cụm:** `08_CALENDAR_AND_DEADLINES`  
> **Tác nhân:** Hệ thống (System), Sinh viên (Student)

---

## 1. Đặc Tả Thuật Toán Nhắc Hạn Theo SRS 1.0 (Specification)

### 1.1 Các Mốc Nhắc Nhở Chuẩn Hóa
Hệ thống tự động gửi thông báo theo 3 mốc đếm ngược:
1. **Trước 7 ngày (7 days prior):** Nhắc sinh viên hoàn thiện hồ sơ ban đầu.
2. **Trước 3 ngày (3 days prior):** Nhắc kiểm tra các giấy tờ cần thiết.
3. **Trước 1 ngày (24 hours prior):** Cảnh báo khẩn cấp trước khi cổng nộp đơn chính thức đóng.

### 1.2 Chống Gửi Trùng Lặp (`FR-CAL-11`)
- Mảng `remindersSent: [7, 3, 1]` trong `CalendarEntry` ghi lại các mốc đã gửi.
- Nếu một mốc đã có trong mảng, hệ thống tuyệt đối không gửi lại lần thứ hai, tránh gây phiền toái hoặc spam hộp thư sinh viên.
