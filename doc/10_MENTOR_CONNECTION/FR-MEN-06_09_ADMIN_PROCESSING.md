# Đặc Tả Tính Năng: Admin Xử Lý Yêu Cầu & Thông Báo Kết Quả

> **Mã tính năng:** `FR-MEN-06`, `FR-MEN-07`, `FR-MEN-08`, `FR-MEN-09`  
> **Thuộc cụm:** `10_MENTOR_CONNECTION`  
> **Tác nhân:** Quản trị viên (Admin), Sinh viên (Student)  

---

## 1. Nghiệp Vụ Xử Lý Của Admin (FR-MEN-06, 08)

1. Admin truy cập trang Quản lý đặt lịch `/admin/bookings`.
2. Admin xem danh sách các yêu cầu đang ở trạng thái `PENDING`:
   - Xem thông tin sinh viên đặt lịch (Họ tên, Email, Trường, Ngành học, Lộ trình hiện tại).
   - Xem Mentor được chọn, chủ đề và khung giờ sinh viên đề xuất.
3. Admin liên hệ Mentor để sắp xếp buổi gặp và cập nhật quyết định:
   - Nếu **Duyệt (`APPROVED`)**: Nhập thời gian chính xác, nền tảng họp trực tuyến (Google Meet link), lời dặn dò chuẩn bị tài liệu.
   - Nếu **Từ chối (`REJECTED`)**: Nhập lý do giải thích rõ ràng cho sinh viên (ví dụ: *Mentor đang đi công tác nước ngoài, gợi ý chọn Mentor khác*).
4. **Tự động bắn thông báo cho Sinh viên (FR-MEN-09):**
   - Ngay khi Admin nhấn lưu quyết định, hệ thống tự động:
     - Tạo thông báo In-app thông báo kết quả duyệt lịch.
     - Gửi email chi tiết chứa link phòng họp hoặc lý do từ chối đến email của sinh viên.
