# Đặc Tả Tính Năng: Xử Lý Thêm Muộn & Cô Lập Lỗi Gửi Email

> **Mã tính năng:** `FR-NOTI-12`, `FR-NOTI-13`, `FR-NOTI-14`  
> **Thuộc cụm:** `09_NOTIFICATIONS`  
> **Tác nhân:** Hệ thống (System)  

---

## 1. Xử Lý Thêm Lịch Muộn (Late Enrollment - FR-NOTI-13)

- **Tình huống:** Cơ hội có hạn chót vào ngày 10/11. Đến ngày 06/11 sinh viên mới bấm "Thêm vào lịch" (nghĩa là mốc 7 ngày đã trôi qua trong quá khứ).
- **Quy tắc xử lý:**
  - Hệ thống **TUYỆT ĐỐI KHÔNG GỬI BÙ (Retroactive)** các thông báo của mốc 7 ngày đã qua để tránh gây nhiễu và hoang mang cho người dùng.
  - Hệ thống chỉ lên lịch gửi cho các mốc thời gian còn lại trong tương lai (trong trường hợp này là mốc 3 ngày vào ngày 07/11 và mốc 1 ngày vào ngày 09/11).

---

## 2. Cô Lập Lỗi Gửi Email (Email Failure Isolation - FR-NOTI-14)

- **Tình huống:** Dịch vụ gửi email (SMTP/Resend/SendGrid) gặp sự cố mạng hoặc email của sinh viên bị từ chối (bounced).
- **Quy tắc bảo toàn:**
  - Lỗi gửi email **KHÔNG ĐƯỢC PHÉP làm thất bại hoặc xóa bỏ bản ghi thông báo In-app**.
  - Hệ thống vẫn lưu trữ bản ghi thông báo In-app và hiển thị bình thường cho sinh viên khi họ đăng nhập vào website.
  - Cập nhật trạng thái kênh email là `emailDeliveryStatus: "FAILED"` kèm lý do lỗi vào nhật ký để phục vụ kiểm tra vận hành.

