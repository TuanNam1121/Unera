# Cụm Tính Năng 09: Hệ Thống Thông Báo Đa Kênh (Notifications)

> **Mã Module:** `NOTIFICATIONS`  
> **Căn cứ SRS:** Mục 4.9 (FR-NOTI-01 đến FR-NOTI-14)  
> **Tác nhân:** Hệ thống (System), Sinh viên (Student)  
> **Trọng tâm kỹ thuật:** Kênh kép (In-app + Email), Lịch nhắc 7/3/1 ngày, Khóa chống trùng lặp (Deduplication Key), Cô lập lỗi gửi email.

---

## 1. Tổng Quan Nghiệp Vụ Cụm Tính Năng

Hệ thống thông báo đảm bảo sinh viên không bỏ lỡ bất kỳ cơ hội học tập hay mốc thời gian quan trọng nào:
1. **Hỗ trợ đa kênh đồng bộ (Dual Channels - FR-NOTI-01, 02, 11 & BR-21):**
   - Hỗ trợ song song cả **Thông báo trong ứng dụng (In-app Notification)** hiển thị tại menu chuông và **Thông báo qua Email (Email Notification)** gửi đến hòm thư đã đăng ký của sinh viên.
2. **Lịch nhắc hẹn hạn chót chuẩn hóa (Reminder Schedule - FR-NOTI-10 & BR-20):**
   - Tự động quét và phát thông báo tại **3 mốc thời gian trước hạn chót: 7 ngày, 3 ngày và 1 ngày**.
3. **Chống trùng lặp tuyệt đối (Deduplication - FR-NOTI-06 & BR-24):**
   - Đảm bảo mỗi sinh viên chỉ nhận đúng 01 thông báo in-app và 01 email cho cùng một cơ hội tại cùng một mốc ngày nhắc hẹn.
   - Được bảo vệ bằng Unique Compound Index trên collection `notifications`:
     `{ recipientId: 1, opportunityId: 1, reminderOffsetDays: 1, channel: 1 }`.
4. **Xử lý đăng ký muộn (Late Enrollment - FR-NOTI-13):**
   - Nếu sinh viên bấm "Thêm vào lịch" khi chỉ còn 2 ngày đến hạn, hệ thống **không gửi hồi cứu (retroactive)** các mốc đã qua (mốc 7 ngày và 3 ngày), mà chỉ lên lịch gửi cho mốc 1 ngày còn lại.
5. **Cô lập lỗi gửi Email (Email Failure Isolation - FR-NOTI-14):**
   - Nếu dịch vụ email bên thứ ba gặp sự cố hoặc gửi thất bại, bản ghi thông báo In-app trong hệ thống **vẫn được tạo thành công và lưu giữ nguyên vẹn**, ghi nhận trạng thái email là `FAILED` để phục vụ đối soát kỹ thuật.

---

## 2. Mô Hình Dữ Liệu `notifications`

Tham chiếu [`src/models/Notification.ts`](file:///c:/Users/AD/OneDrive/Desktop/Project/ULIS_DMST_2026/src/models/Notification.ts):

```typescript
interface INotification {
  _id: ObjectId;
  recipientId: string;         // ID người nhận (Student) (Index)
  type: "DEADLINE_REMINDER" | "BOOKING_UPDATE" | "ROADMAP_UPDATE" | "SYSTEM_ANNOUNCEMENT";
  title: string;               // Tiêu đề thông báo
  message: string;             // Nội dung chi tiết
  link?: string;               // Đường dẫn điều hướng khi bấm vào
  isRead: boolean;             // Trạng thái đã đọc (Index)
  channel: "IN_APP" | "EMAIL"; // Kênh gửi
  emailDeliveryStatus?: "PENDING" | "SENT" | "FAILED";
  opportunityId?: string;      // ID cơ hội liên quan (nếu là nhắc hạn)
  reminderOffsetDays?: number; // 7, 3, hoặc 1 (nếu là nhắc hạn)
  createdAt: Date;
}
```

---

## 3. Danh Mục Các Tính Năng Chi Tiết

| Mã Tính Năng | Tên Tính Năng | File Đặc Tả |
|---|---|---|
| **FR-NOTI-01 đến 04** | Trung tâm thông báo In-app & Trạng thái đã đọc | [`FR-NOTI-01_04_NOTIFICATION_CENTER.md`](./FR-NOTI-01_04_NOTIFICATION_CENTER.md) |
| **FR-NOTI-06** | Khóa ngăn trùng lặp thông báo (Deduplication) | [`FR-NOTI-06_DUPLICATE_PREVENTION.md`](./FR-NOTI-06_DUPLICATE_PREVENTION.md) |
| **FR-NOTI-09 đến 11** | Lịch nhắc hạn chót 7, 3, 1 ngày qua In-app & Email | [`FR-NOTI-09_11_DEADLINE_REMINDERS.md`](./FR-NOTI-09_11_DEADLINE_REMINDERS.md) |
| **FR-NOTI-12 đến 14** | Xử lý thêm muộn & Cô lập lỗi gửi Email | [`FR-NOTI-12_14_LATE_AND_FAILURE.md`](./FR-NOTI-12_14_LATE_AND_FAILURE.md) |
