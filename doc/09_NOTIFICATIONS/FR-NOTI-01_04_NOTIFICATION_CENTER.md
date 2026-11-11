# Đặc Tả Tính Năng: Trung Tâm Thông Báo In-app & Trạng Thái Đã Đọc

> **Mã tính năng:** `FR-NOTI-01`, `FR-NOTI-03`, `FR-NOTI-04`, `FR-NOTI-07`  
> **Thuộc cụm:** `09_NOTIFICATIONS`  
> **Tác nhân:** Sinh viên (Student)  

---

## 1. Nghiệp Vụ Tính Năng

1. **Menu chuông & Trung tâm thông báo (FR-NOTI-01, 03):**
   - Biểu tượng chuông trên Topbar hiển thị chấm đỏ khi có thông báo chưa đọc.
   - Nhấp vào chuông mở dropdown xem nhanh 5 thông báo mới nhất hoặc điều hướng đến trang `/notifications`.
   - Mỗi thông báo hiển thị: Tiêu đề, tóm tắt nội dung, icon phân loại (Hạn chót, Đặt lịch Mentor, Hệ thống), thời gian nhận (ví dụ: *2 giờ trước*) và liên kết điều hướng trực tiếp.
2. **Cập nhật trạng thái đã đọc (Read Status - FR-NOTI-04):**
   - Bấm vào một thông báo tự động đánh dấu thông báo đó là `isRead: true`.
   - Cung cấp nút **"Đánh dấu tất cả là đã đọc"** trên giao diện trung tâm thông báo.
3. **Lịch sử thông báo (Notification History - FR-NOTI-07):**
   - Lưu trữ toàn bộ các thông báo sinh viên đã nhận theo dòng thời gian để tra cứu lại khi cần.

