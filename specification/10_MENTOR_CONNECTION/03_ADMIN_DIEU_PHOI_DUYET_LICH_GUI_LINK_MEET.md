# Tính Năng: Quản Trị CMS Điều Phối & Phê Duyệt Lịch Hẹn Mentor (Admin Booking Moderation)

> **Mã SRS:** `FR-MEN-06`, `FR-MEN-07`, `FR-MEN-08`, `FR-MEN-12`  
> **Trạng thái:** ![Hoàn thành 100%](https://img.shields.io/badge/-ĐÃ%20HOÀN%20THÀNH%20100%25-emerald)  
> **Thuộc cụm:** `10_MENTOR_CONNECTION`, `15_ADMIN_CMS_AND_AUDIT`  
> **Tác nhân:** Quản trị viên (Admin)

---

## 1. Cách Thức Hoạt Động Hiện Tại (Implementation Details)

### 1.1 Giao Diện Admin CMS
- Tệp nguồn giao diện: [`src/app/admin/bookings/page.tsx`](file:///c:/Users/AD/OneDrive/Desktop/Project/ULIS_DMST_2026/src/app/admin/bookings/page.tsx).
- **Bộ lọc trạng thái tabs:** `Tất cả`, `Chờ duyệt (PENDING)`, `Đã duyệt (CONFIRMED)`, `Từ chối (REJECTED)`, `Hoàn thành (COMPLETED)`, `Đã hủy (CANCELLED)`.
- **Thẻ lịch hẹn hiển thị:**
  - Thông tin sinh viên đặt lịch (`studentId`).
  - Thông tin Mentor được chọn (`mentorId`).
  - Chủ đề tư vấn (`topic`), thời gian đề xuất (`preferredTime`), câu hỏi chi tiết (`message`).
  - Nút thao tác nhanh: **"Duyệt & Gửi Link Meet"** và **"Từ chối"**.

### 1.2 Modal Phê Duyệt & Gửi Link Cuộc Họp (FR-MEN-08)
- Khi ấn "Duyệt & Gửi Link Meet":
  - Mở Dialog cho Admin nhập đường dẫn phòng họp trực tuyến (Google Meet, MS Teams, Zoom) hoặc thời gian thống nhất chính xác:
    *Ví dụ: "Lịch hẹn đã được xác nhận vào lúc 20:00 Thứ 6 ngày 15/12. Link Google Meet: https://meet.google.com/abc-defg-hij"*.
  - Gửi request `PATCH /api/admin/bookings/[id]` với `{ status: "CONFIRMED", adminResponse: "..." }`.

### 1.3 Modal Từ Chối Kèm Lý Do Rõ Ràng (FR-MEN-08)
- Khi ấn "Từ chối":
  - Admin bắt buộc phải nhập lý do từ chối (e.g. *Mentor đang trong chuyến công tác nước ngoài, vui lòng chọn khung giờ khác hoặc mentor khác*).
  - Gửi request `PATCH /api/admin/bookings/[id]` với `{ status: "REJECTED", adminResponse: "..." }`.

### 1.4 API Backend & Ghi Nhật Ký Kiểm Toán (Audit Log)
- API Endpoint: [`src/app/api/admin/bookings/[id]/route.ts`](file:///c:/Users/AD/OneDrive/Desktop/Project/ULIS_DMST_2026/src/app/api/admin/bookings/[id]/route.ts).
- Kiểm tra quyền `requireAdmin()`.
- Tự động ghi nhận lịch sử vào bảng [`src/models/AuditLog.ts`](file:///c:/Users/AD/OneDrive/Desktop/Project/ULIS_DMST_2026/src/models/AuditLog.ts):
  - `action: "STATUS_CHANGE"`.
  - `targetCollection: "bookings"`.
  - `changesBefore: { status: previousStatus }`.
  - `changesAfter: { status, adminResponse }`.
  - `reason: adminResponse`.
