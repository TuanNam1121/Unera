# Đặc Tả Tính Năng: Lịch Nhắc Hạn Chót 7, 3, 1 Ngày Qua In-app & Email

> **Mã tính năng:** `FR-NOTI-09`, `FR-NOTI-10`, `FR-NOTI-11`  
> **Thuộc cụm:** `09_NOTIFICATIONS`  
> **Tác nhân:** Hệ thống (System), Sinh viên (Student)  
> **Mức độ ưu tiên:** Bắt buộc (P0 - MVP)  
> **Trạng thái:** Confirmed Business Decision (BR-19, BR-20, BR-21)  

---

## 1. Nghiệp Vụ Bất Biến

1. **Điều kiện kích hoạt (Eligibility - FR-NOTI-09 & BR-19):**
   - Chỉ những cơ hội đã được sinh viên **thêm vào lịch** (`CalendarEntry.isActive == true`) và **có ngày hạn chót hợp lệ** mới được hệ thống xếp lịch nhắc nhở.
2. **Lịch trình nhắc hẹn chuẩn (FR-NOTI-10 & BR-20):**
   - **Mốc 7 ngày trước hạn chót:** Nhắc nhở sinh viên chuẩn bị giấy tờ, thư giới thiệu và hoàn thiện bản nháp.
   - **Mốc 3 ngày trước hạn chót:** Cảnh báo gấp để sinh viên kiểm tra lại hồ sơ và nộp đơn sớm tránh nghẽn mạng.
   - **Mốc 1 ngày trước hạn chót:** Thông báo khẩn cấp ngày cuối cùng nộp đơn.
3. **Phát sóng đa kênh song song (Dual Channel - FR-NOTI-11):**
   - Tại mỗi mốc, hệ thống kích hoạt đồng thời:
     - 01 thông báo In-app xuất hiện trong ứng dụng.
     - 01 email định dạng HTML chuẩn nhận diện thương hiệu UNERA gửi tới hòm thư cá nhân của sinh viên.
4. **Mẫu Email Tiêu Chuẩn:**
   - Tiêu đề email: `[UNERA Nhắc hẹn] Còn {X} ngày đến hạn nộp đơn: {Tên cơ hội}`
   - Nội dung: Tên cơ hội, ngày giờ hạn chót chính xác, tóm tắt điều kiện, link trực tiếp đến trang nộp đơn.

