# Tính Năng: Gửi Yêu Cầu Đặt Lịch Tư Vấn 1-1 (Booking Request Submission)

> **Mã SRS:** `FR-MEN-04`, `FR-MEN-05`, `FR-MEN-13`  
> **Trạng thái:** ![Kế hoạch theo SRS](https://img.shields.io/badge/-KẾ%20HOẠCH%20THEO%20SRS-amber)  
> **Thuộc cụm:** `10_MENTOR_CONNECTION`  
> **Tác nhân:** Sinh viên (Student)

---

## 1. Hiện Trạng Triển Khai
- Mô hình dữ liệu đã có: [`src/models/BookingRequest.ts`](file:///c:/Users/AD/OneDrive/Desktop/Project/ULIS_DMST_2026/src/models/BookingRequest.ts).
- Cần xây dựng Modal / Form gửi yêu cầu đặt lịch phía sinh viên và API `POST /api/mentors/book` (hoặc `POST /api/bookings`).

---

## 2. Đặc Tả Nghiệp Vụ Theo SRS 1.0 (Specification)

### 2.1 Biểu Mẫu Đặt Lịch (Booking Form Dialog)
- Khi sinh viên nhấp "Đặt lịch tư vấn" trên hồ sơ Mentor:
  - **Chủ đề tư vấn (Topic) [Bắt buộc]:** Chọn từ danh sách chủ đề mentor cung cấp hoặc tự nhập (tối thiểu 10 ký tự, tối đa 200 ký tự).
  - **Khung thời gian mong muốn (Preferred Time) [Bắt buộc]:** Ví dụ: *Tối thứ 4 (19:30 - 20:30)* hoặc *Sáng thứ 7 (9:00 - 10:00)*.
  - **Nội dung / Câu hỏi cần tư vấn (Message) [Bắt buộc]:** Mô tả cụ thể vướng mắc, CV đính kèm hoặc mục tiêu cần giải đáp (tối thiểu 30 ký tự, tối đa 1000 ký tự).

### 2.2 Quy Trình Xử Lý Sau Khi Gửi (FR-MEN-04)
- Kiểm tra trạng thái xác thực: Sinh viên bắt buộc phải đăng nhập tài khoản.
- Tạo bản ghi mới vào CSDL với trạng thái khởi tạo: `status: 'PENDING'`.
- Hiển thị thông báo: *"Yêu cầu của bạn đã được gửi tới Ban quản trị. Quản trị viên sẽ liên hệ và xác nhận thời gian cùng đường link Google Meet sớm nhất qua email và thông báo."*

### 2.3 Hủy Đặt Lịch Phía Sinh Viên (FR-MEN-13)
- Sinh viên có quyền hủy lịch hẹn nếu yêu cầu vẫn đang ở trạng thái `PENDING`.
- Một khi Quản trị viên đã phê duyệt (`CONFIRMED`), sinh viên không thể tự hủy trên web mà phải liên hệ ban quản trị.
