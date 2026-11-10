# Cụm Tính Năng 08: Lịch Hạn Chót & Theo Dõi Tường Minh (Calendar & Deadlines)

> **Mã Module:** `CALENDAR`  
> **Căn cứ SRS:** Mục 4.8 (FR-CAL-01 đến FR-CAL-14)  
> **Tác nhân:** Sinh viên (Student)  
> **Trọng tâm cốt lõi:** Hành động tường minh "Thêm vào lịch", không tự động thêm khi chỉ xem, nhắc hẹn 7/3/1 ngày.

---

## 1. Tổng Quan Nghiệp Vụ Cụm Tính Năng

Cơ chế quản lý hạn chót của UNERA được thiết kế chặt chẽ theo yêu cầu nghiệp vụ:
1. **Hành động thêm vào lịch tường minh (Explicit Enrollment - FR-CAL-01, 02, 03 & BR-16, 17):**
   - **Chỉ khi sinh viên chủ động bấm nút "Thêm vào lịch" trên trang chi tiết cơ hội, hệ thống mới tạo bản ghi theo dõi `CalendarEntry`.**
   - Việc sinh viên chỉ xem cơ hội, tìm kiếm hay bấm "Lưu cơ hội" **tuyệt đối không được phép tự ý đưa cơ hội vào lịch cá nhân**.
2. **Kích hoạt nhắc hẹn hạn chót (Deadline Reminders Eligibility - BR-19):**
   - Chỉ những cơ hội nằm trong `CalendarEntry` đang hoạt động (`isActive: true`) VÀ có ngày `deadline` hợp lệ mới đủ điều kiện nhận thông báo nhắc hẹn trước **7 ngày, 3 ngày và 1 ngày**.
3. **Cơ chế Hủy theo dõi an toàn (Calendar Removal - FR-CAL-08, 09, 10 & BR-22, 23):**
   - Sinh viên có thể bấm "Hủy theo dõi khỏi lịch" bất cứ lúc nào.
   - Khi hủy theo dõi: Các lệnh nhắc hẹn trong tương lai sẽ bị hủy bỏ, **nhưng toàn bộ lịch sử các thông báo đã gửi trước đó vẫn được giữ nguyên vẹn** trong hộp thư thông báo (không bị xóa mất).
4. **Chống trùng lặp tuyệt đối (Duplicate Prevention - FR-CAL-11 & BR-24):**
   - Bấm "Thêm vào lịch" nhiều lần không được sinh ra nhiều bản ghi lịch trùng lặp. Đảm bảo bằng Unique Compound Index trên CSDL `{ studentId: 1, opportunityId: 1 }`.

---

## 2. Mô Hình Dữ Liệu `calendar_entries`

Tham chiếu [`src/models/CalendarEntry.ts`](file:///c:/Users/AD/OneDrive/Desktop/Project/ULIS_DMST_2026/src/models/CalendarEntry.ts):

```typescript
interface ICalendarEntry {
  _id: ObjectId;
  studentId: string;               // ID sinh viên (Index)
  opportunityId: ObjectId;         // Tham chiếu sang Opportunity (Index)
  deadline?: Date | null;          // Cache hạn chót
  isActive: boolean;               // true: Đang theo dõi, false: Đã hủy theo dõi (Index)
  remindersSent: number[];         // Danh sách các mốc ngày đã gửi thành công, ví dụ: [7, 3, 1]
  createdAt: Date;
  updatedAt: Date;
}
// Unique compound index: { studentId: 1, opportunityId: 1 }
```

---

## 3. Danh Mục Các Tính Năng Chi Tiết

| Mã Tính Năng | Tên Tính Năng | File Đặc Tả |
|---|---|---|
| **FR-CAL-01 đến 03** | Hành động tường minh "Thêm vào lịch" & Không thêm khi xem | [`FR-CAL-01_03_ADD_TO_CALENDAR.md`](./FR-CAL-01_03_ADD_TO_CALENDAR.md) |
| **FR-CAL-04 đến 07** | Giao diện Lịch tháng, Danh sách & Khối hạn sắp tới | [`FR-CAL-04_07_CALENDAR_VIEWS.md`](./FR-CAL-04_07_CALENDAR_VIEWS.md) |
| **FR-CAL-08 đến 10** | Hủy theo dõi, Dừng nhắc hẹn & Bảo tồn lịch sử thông báo | [`FR-CAL-08_10_REMOVE_AND_PRESERVE.md`](./FR-CAL-08_10_REMOVE_AND_PRESERVE.md) |
| **FR-CAL-11 đến 14** | Chống trùng lặp, Cơ hội không hạn & Tách biệt danh sách lưu | [`FR-CAL-11_14_DUPLICATE_PREVENTION.md`](./FR-CAL-11_14_DUPLICATE_PREVENTION.md) |
