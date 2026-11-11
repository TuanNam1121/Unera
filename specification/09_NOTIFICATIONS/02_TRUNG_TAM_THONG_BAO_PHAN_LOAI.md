# Tính Năng: Trung Tâm Thông Báo & Phân Loại Lịch Sử (Notification Center)

> **Mã SRS:** `FR-NOTI-03`, `FR-NOTI-07`  
> **Trạng thái:** ![Kế hoạch theo SRS](https://img.shields.io/badge/-KẾ%20HOẠCH%20THEO%20SRS-amber)  
> **Thuộc cụm:** `09_NOTIFICATIONS`  
> **Tác nhân:** Sinh viên (Student)

---

## 1. Hiện Trạng Triển Khai
- Đường dẫn đích `/notifications` đã được định nghĩa trong hệ thống điều hướng của Topbar.
- Cần triển khai trang giao diện danh sách thông báo và các bộ lọc phân loại.

---

## 2. Đặc Tả Nghiệp Vụ Theo SRS 1.0 (Specification)

### 2.1 Cấu Trúc Trang `/notifications`
- **Bộ lọc danh mục tab:**
  1. **Tất cả (All):** Toàn bộ thông báo gửi đến sinh viên.
  2. **Hạn chót & Lịch (Deadlines):** Nhắc hạn nộp học bổng, cuộc thi, việc làm (7 ngày, 3 ngày, 1 ngày).
  3. **Cố vấn & Tư vấn (Mentor):** Lịch hẹn tư vấn được chấp thuận, link Google Meet, lý do từ chối.
  4. **Hệ thống (System):** Khóa/mở tài khoản, cập nhật quan trọng từ ban quản trị.
- **Thao tác nhanh:**
  - Nút "Đánh dấu tất cả là đã đọc" (Mark all as read).
  - Nút "Lọc chưa đọc" (Unread only).
  - Phân trang hoặc tải thêm (Infinite scroll / Pagination 20 mục/trang).

### 2.2 Mô Hình Dữ Liệu Thông Báo (Proposed Schema)
```typescript
interface NotificationDocument {
  _id: ObjectId;
  userId: ObjectId;
  type: 'DEADLINE' | 'MENTOR' | 'SYSTEM' | 'ROADMAP';
  title: string;
  body: string;
  link?: string;
  read: boolean;
  readAt?: Date;
  emailSent?: boolean;
  metadata?: Record<string, any>;
  createdAt: Date;
}
```

### 2.3 Tiêu Chí Nghiệp Vụ SRS
- **FR-NOTI-03 (Notification Center):** Cung cấp giao diện trung tâm hiển thị danh sách các thông báo đã nhận kèm thời gian, nội dung tóm tắt và đường dẫn tương ứng.
- **FR-NOTI-07 (Notification History):** Duy trì lịch sử thông báo tối thiểu trong suốt quá trình tài khoản đang hoạt động để sinh viên có thể xem lại khi cần.
