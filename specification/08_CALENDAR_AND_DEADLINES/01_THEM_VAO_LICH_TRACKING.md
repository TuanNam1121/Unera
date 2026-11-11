# Tính Năng: Thêm Cơ Hội Vào Lịch Cá Nhân (Add to Calendar Action)

> **Mã SRS:** `FR-CAL-01`, `FR-CAL-02`, `FR-CAL-03`, `UI-06`  
> **Trạng thái:** ![Hoàn thành](https://img.shields.io/badge/-ĐÃ%20HOÀN%20THÀNH%20100%25-emerald)  
> **Thuộc cụm:** `08_CALENDAR_AND_DEADLINES`  
> **Tác nhân:** Sinh viên (Student)

---

## 1. Cách Thức Hoạt Động Hiện Tại (Implementation Details)

Theo nguyên tắc bất biến của SRS 1.0:
> *"Saving an Opportunity does not automatically activate calendar reminders. The Student must explicitly click 'Thêm vào lịch' to track deadlines (UI-06, BR-08)."*

### 1.1 Nút "Thêm Vào Lịch" (Explicit Action)
- Xuất hiện trên trang chi tiết cơ hội và thẻ cơ hội.
- Khi sinh viên bấm nút, gửi request `POST /api/calendar` kèm `{ opportunityId }`.
- Server lưu bản ghi vào [`src/models/CalendarEntry.ts`](file:///c:/Users/AD/OneDrive/Desktop/Project/ULIS_DMST_2026/src/models/CalendarEntry.ts):
  - `studentId`: ID của sinh viên.
  - `opportunityId`: ID cơ hội.
  - `deadline`: Ngày hết hạn nộp hồ sơ.
  - `isActive: true`.
- **Chống Trùng Lặp (`FR-CAL-11`):** Nếu cơ hội đã có trong lịch, hệ thống không tạo bản ghi mới mà giữ nguyên bản ghi hiện có.
