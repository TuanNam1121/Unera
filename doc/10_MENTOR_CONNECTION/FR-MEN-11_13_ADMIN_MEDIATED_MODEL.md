# Đặc Tả Tính Năng: Mô Hình Trung Gian Không Tài Khoản Mentor & Quy Định Hủy

> **Mã tính năng:** `FR-MEN-11`, `FR-MEN-12`, `FR-MEN-13`  
> **Thuộc cụm:** `10_MENTOR_CONNECTION`  
> **Tác nhân:** Sinh viên (Student), Quản trị viên (Admin)  
> **Trạng thái:** Confirmed (Mô hình) & TBD (Chính sách hủy đơn)  

---

## 1. Nghiệp Vụ Mô Hình Trung Gian (FR-MEN-11, FR-MEN-12)

- **Không tài khoản Mentor:** Hệ thống không cung cấp chức năng đăng ký, đăng nhập hay giao diện riêng cho Mentor. Việc này giúp giảm tải thao tác công nghệ cho các chuyên gia bận rộn và giao toàn quyền điều phối chất lượng cho đội ngũ Admin vận hành.
- **Không tự động xác nhận:** Sinh viên gửi yêu cầu không đồng nghĩa với việc lịch hẹn đã được chốt. Mọi cuộc gặp đều phải qua khâu rà soát và xác nhận thủ công từ Admin.

---

## 2. Quy Định Về Hủy Yêu Cầu (Student Cancellation - FR-MEN-13 & OI-06)

- **Trạng thái:** **TBD (Chưa quyết định theo SRS 1.0).**
- **Quy tắc triển khai tạm thời trong MVP:**
  - Sinh viên được phép hủy yêu cầu (`status: "CANCELLED"`) khi yêu cầu vẫn đang ở trạng thái `PENDING`.
  - Một khi yêu cầu đã được Admin duyệt (`APPROVED`), sinh viên không thể tự ý bấm hủy trên website mà phải liên hệ trực tiếp với Admin hỗ trợ để tránh gây lãng phí thời gian của Mentor.
