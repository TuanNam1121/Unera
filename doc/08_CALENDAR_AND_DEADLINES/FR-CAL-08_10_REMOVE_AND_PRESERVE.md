# Đặc Tả Tính Năng: Hủy Theo Dõi Lịch & Bảo Tồn Lịch Sử Thông Báo

> **Mã tính năng:** `FR-CAL-08`, `FR-CAL-09`, `FR-CAL-10`  
> **Thuộc cụm:** `08_CALENDAR_AND_DEADLINES`  
> **Tác nhân:** Sinh viên (Student), Hệ thống (System)  
> **Mức độ ưu tiên:** Bắt buộc (P0 - Crucial Invariant)  
> **Trạng thái:** Confirmed Business Decision  

---

## 1. Nghiệp Vụ Bất Biến

1. **Hủy theo dõi khỏi lịch (FR-CAL-08):**
   - Sinh viên có thể chọn "Hủy theo dõi" (Remove from Calendar / Unfollow) trên trang lịch hoặc trang chi tiết cơ hội.
2. **Dừng toàn bộ thông báo tương lai (Stop Future Reminders - FR-CAL-09 & BR-22):**
   - Ngay sau khi hủy theo dõi, bản ghi `CalendarEntry` được cập nhật `isActive: false`.
   - Tiến trình gửi thông báo định kỳ (Cron) sẽ kiểm tra cờ `isActive`. Mọi mốc nhắc nhở chưa tới (ví dụ: mốc 3 ngày, 1 ngày) sẽ bị hủy bỏ hoặc bỏ qua hoàn toàn.
3. **Bảo tồn nguyên vẹn lịch sử thông báo đã gửi (Preserve Sent History - FR-CAL-10 & BR-23):**
   - **Hành động hủy theo dõi lịch KHÔNG ĐƯỢC PHÉP xóa đi các thông báo mà sinh viên đã nhận trước đó.**
   - Ví dụ: Nếu mốc 7 ngày đã gửi thông báo in-app và email vào ngày hôm qua, thì bản ghi thông báo đó vẫn nằm nguyên trong Trung tâm thông báo (`Notification Center`) của sinh viên để phục vụ việc tra cứu lịch sử.

---

## 2. Tiêu Chí Chấp Thuận

- **AC-01:** Sinh viên hủy theo dõi cơ hội A. Kiểm tra danh sách thông báo đã nhận, thông báo "Còn 7 ngày đến hạn cơ hội A" đã nhận hôm qua vẫn hiển thị bình thường.
- **AC-02:** Đến mốc 3 ngày và 1 ngày, sinh viên không nhận thêm bất kỳ email hay thông báo in-app nào cho cơ hội A.

