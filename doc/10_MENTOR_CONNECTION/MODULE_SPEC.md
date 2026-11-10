# Cụm Tính Năng 10: Kết Nối Mentor Qua Trung Gian Admin (Mentor Connection)

> **Mã Module:** `MENTOR`  
> **Căn cứ SRS:** Mục 4.10 (FR-MEN-01 đến FR-MEN-13)  
> **Tác nhân:** Sinh viên (Student), Quản trị viên (Admin)  
> **Mô hình kiến trúc:** Mô hình trung gian quản lý (Admin-mediated Model) — Mentor không có tài khoản đăng nhập.

---

## 1. Mô Hình Nghiệp Vụ Cốt Lõi (Admin-mediated Architecture)

Theo các quyết định nghiệp vụ đã được chốt (Confirmed Decisions) trong `PROJECT_CONTEXT.md` và `SRS_1.0.md`:
1. **Mentor là Hồ Sơ, KHÔNG PHẢI TÀI KHOẢN HỆ THỐNG (FR-MEN-11 & BR-25):**
   - **Mentor không có tài khoản đăng nhập vào hệ thống UNERA.**
   - Mentor không có dashboard quản trị lịch hay công cụ tự thiết lập khung giờ rảnh tự động.
   - Toàn bộ danh bạ hồ sơ Mentor được tạo lập, xác thực và quản lý tập trung bởi tài khoản **Admin**.
2. **Quy trình Đặt lịch qua Trung gian Admin (Admin-mediated Scheduling - FR-MEN-12 & BR-26):**
   - Sinh viên gửi Yêu cầu đặt lịch tư vấn (`BookingRequest`) gồm: Mentor muốn gặp, chủ đề cần trao đổi, khung giờ đề xuất và câu hỏi cụ thể.
   - Yêu cầu này **CHƯA PHẢI là một lịch hẹn đã được xác nhận tự động**.
   - Admin tiếp nhận yêu cầu, liên hệ với Mentor bên ngoài hệ thống (qua email/điện thoại/zalo) để chốt thời gian và phương thức kết nối (Google Meet / Zoom).
   - Admin cập nhật trạng thái yêu cầu (`APPROVED` / `REJECTED`) và nhập phản hồi / link phòng họp cho sinh viên.
   - Hệ thống tự động bắn thông báo cho sinh viên khi Admin cập nhật trạng thái (FR-MEN-09).
3. **5 Trạng thái vòng đời của yêu cầu đặt lịch (FR-MEN-07):**
   - `PENDING`: Đang chờ Admin xử lý.
   - `APPROVED`: Đã duyệt và chốt lịch tư vấn.
   - `REJECTED`: Từ chối (kèm lý do: Mentor bận, chủ đề chưa phù hợp...).
   - `CANCELLED`: Yêu cầu bị hủy.
   - `COMPLETED`: Buổi tư vấn đã diễn ra thành công.

---

## 2. Mô Hình Dữ Liệu `mentor_profiles` & `booking_requests`

Tham chiếu [`src/models/MentorProfile.ts`](file:///c:/Users/AD/OneDrive/Desktop/Project/ULIS_DMST_2026/src/models/MentorProfile.ts) và [`src/models/BookingRequest.ts`](file:///c:/Users/AD/OneDrive/Desktop/Project/ULIS_DMST_2026/src/models/BookingRequest.ts):

```typescript
// Hồ sơ Mentor (Do Admin tạo & quản trị)
interface IMentorProfile {
  _id: ObjectId;
  name: string;
  avatar?: string;
  position: string;         // Chức vụ hiện tại (ví dụ: Senior Product Manager)
  organization: string;     // Cơ quan / Tập đoàn (ví dụ: Shopee Singapore, VinAI)
  expertise: string[];      // Lĩnh vực chuyên môn (tags)
  experience: string;       // Số năm kinh nghiệm & tóm tắt quá trình làm việc
  bio: string;              // Giới thiệu chi tiết
  topics: string[];         // Các chủ đề sẵn sàng hỗ trợ tư vấn
  isActive: boolean;        // true: Đang nhận tư vấn, false: Ẩn
}

// Yêu cầu đặt lịch của Sinh viên
interface IBookingRequest {
  _id: ObjectId;
  studentId: string;        // ID sinh viên đặt lịch
  mentorId: ObjectId;       // Tham chiếu đến MentorProfile
  topic: string;            // Chủ đề sinh viên cần tư vấn
  preferredTime: string;    // Khung giờ đề xuất (ví dụ: Tối thứ 7 từ 20h-21h)
  message: string;          // Lời nhắn & băn khoăn cụ thể của sinh viên
  status: "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED" | "COMPLETED";
  adminResponse?: string;   // Phản hồi / Hướng dẫn / Link họp từ Admin
  processedByAdminId?: string; // ID Admin chịu trách nhiệm xử lý
  createdAt: Date;
  updatedAt: Date;
}
```

---

## 3. Danh Mục Các Tính Năng Chi Tiết

| Mã Tính Năng | Tên Tính Năng | File Đặc Tả |
|---|---|---|
| **FR-MEN-01 đến 03** | Danh bạ hồ sơ Mentor thẩm định & Tìm kiếm chuyên gia | [`FR-MEN-01_03_MENTOR_DIRECTORY.md`](./FR-MEN-01_03_MENTOR_DIRECTORY.md) |
| **FR-MEN-04 & 05** | Sinh viên gửi yêu cầu đặt lịch tư vấn | [`FR-MEN-04_05_BOOKING_SUBMISSION.md`](./FR-MEN-04_05_BOOKING_SUBMISSION.md) |
| **FR-MEN-06 đến 09** | Admin xử lý yêu cầu, phản hồi & thông báo kết quả | [`FR-MEN-06_09_ADMIN_PROCESSING.md`](./FR-MEN-06_09_ADMIN_PROCESSING.md) |
| **FR-MEN-11 đến 13** | Mô hình trung gian không tài khoản Mentor & Quy định hủy | [`FR-MEN-11_13_ADMIN_MEDIATED_MODEL.md`](./FR-MEN-11_13_ADMIN_MEDIATED_MODEL.md) |
