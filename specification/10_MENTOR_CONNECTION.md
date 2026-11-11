# Cụm Tính Năng 10: Kết Nối Cố Vấn Định Hướng (Mentor Connection & Booking)

> **Mã SRS:** `FR-MEN-01` đến `FR-MEN-14`  
> **Trạng thái:** ![Đã có Admin CMS](https://img.shields.io/badge/-ĐÃ%20CÓ%20ADMIN%20CMS-blue) *(Cần hoàn thiện giao diện xem & đặt lịch sinh viên)*  
> **Tác nhân:** Sinh viên (Student), Quản trị viên (Admin - Trung gian)

---

## 1. Cách Thức Hoạt Động Hiện Tại (Current Implementation)

### 1.1 Mô Hình Trung Gian Admin Phê Duyệt (`FR-MEN-01..05`)
- Theo SRS 1.0, **Mentor không phải là một tài khoản đăng nhập** mà là hồ sơ được Admin quản lý (`BR-02`).
- Quy trình vận hành:
  1. Sinh viên gửi yêu cầu tư vấn (kèm chủ đề, câu hỏi băn khoăn, thời gian đề xuất).
  2. Yêu cầu vào hàng đợi chờ duyệt của Admin (`PENDING`).
  3. Admin liên hệ với Mentor bên ngoài, sau đó duyệt yêu cầu và nhập liên kết phòng họp trực tuyến (Google Meet / Zoom link).
  4. Hệ thống gửi thông báo kèm đường dẫn cuộc hẹn cho sinh viên.

### 1.2 Phân Hệ Quản Trị Yêu Cầu Cố Vấn Của Admin (`/admin/bookings`)
- **Giao diện:** [`src/app/admin/bookings/page.tsx`](file:///c:/Users/AD/OneDrive/Desktop/Project/ULIS_DMST_2026/src/app/admin/bookings/page.tsx)
  - Hàng đợi danh sách đặt lịch hẹn kèm thông tin Sinh viên, Cố vấn, Chủ đề tư vấn, Thời gian.
  - Modal **Phê duyệt lịch hẹn**: Nhập link Google Meet và lời dặn dò cho sinh viên.
  - Modal **Từ chối lịch hẹn**: Bắt buộc nhập lý do từ chối để thông báo minh bạch cho sinh viên.
- **APIs:**
  - `GET /api/admin/bookings`: Lấy danh sách booking requests.
  - `PATCH /api/admin/bookings/[id]`: Cập nhật trạng thái `APPROVED` (kèm meetingLink) hoặc `REJECTED` (kèm lý do). Tự động ghi `AuditLog`.

### 1.3 Mô Hình Dữ Liệu
- [`src/models/MentorProfile.ts`](file:///c:/Users/AD/OneDrive/Desktop/Project/ULIS_DMST_2026/src/models/MentorProfile.ts): Họ tên, Chức danh, Lĩnh vực chuyên môn, Tiểu sử, Avatar, Đơn vị công tác.
- [`src/models/BookingRequest.ts`](file:///c:/Users/AD/OneDrive/Desktop/Project/ULIS_DMST_2026/src/models/BookingRequest.ts): `studentId`, `mentorId`, `topic`, `questions`, `proposedTime`, `status`, `meetingLink`, `rejectionReason`.

---

## 2. Kế Hoạch Triển Khai Tiếp Theo (Upcoming Implementation)

1. **Giao Diện Sinh Viên Khám Phá Cố Vấn (`/mentors` & `/mentors/[id]`):**
   - Danh sách thẻ Cố vấn lọc theo chuyên môn: *Du học*, *Quản trị viên tập sự*, *Nghiên cứu khoa học*, *Khởi nghiệp*.
   - Trang chi tiết Mentor: Thành tích, kinh nghiệm làm việc, các chủ đề nhận tư vấn.
   - Form đặt lịch tư vấn 1-1: Nhập câu hỏi băn khoăn, chọn khung giờ mong muốn và gửi yêu cầu.
2. **Giao Diện Quản Trị Hồ Sơ Mentor Của Admin (`/admin/mentors`):**
   - Thêm mới, chỉnh sửa hồ sơ Mentor, kích hoạt/tạm ẩn cố vấn.
