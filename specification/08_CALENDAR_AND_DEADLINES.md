# Cụm Tính Năng 08: Lịch Hoạt Động & Theo Dõi Hạn Chót (Calendar & Opportunity Tracking)

> **Mã SRS:** `FR-CAL-01` đến `FR-CAL-11`  
> **Trạng thái:** ![Đã có API & Widget](https://img.shields.io/badge/-ĐÃ%20CÓ%20API%20%26%20WIDGET-blue) *(Cần hoàn thiện giao diện Lịch tháng toàn trang)*  
> **Tác nhân:** Sinh viên (Student)

---

## 1. Cách Thức Hoạt Động Hiện Tại (Current Implementation)

### 1.1 Khối "Hạn Sắp Tới" Trên Dashboard Trang Chủ (`/`)
- Component widget bên phải trang chủ hiển thị danh sách các deadline sắp đến hạn (12 TH 11, 14 TH 11, 18 TH 11...).
- Đếm ngược số ngày còn lại (ví dụ: *"Còn 3 ngày"*, *"Còn 5 ngày"*).

### 1.2 Backend API & Mô Hình Dữ Liệu
- **Mô hình:** [`src/models/CalendarEntry.ts`](file:///c:/Users/AD/OneDrive/Desktop/Project/ULIS_DMST_2026/src/models/CalendarEntry.ts)
  - `studentId`: ID sinh viên.
  - `opportunityId`: Liên kết tới cơ hội.
  - `deadline`: Ngày hết hạn.
  - `isActive`: Trạng thái theo dõi.
  - `remindersSent`: Mảng đánh dấu các mốc nhắc nhở đã gửi qua email/in-app (ví dụ: `[7, 3, 1]` ngày trước hạn).
- **API:**
  - `GET /api/calendar` ([`src/app/api/calendar/route.ts`](file:///c:/Users/AD/OneDrive/Desktop/Project/ULIS_DMST_2026/src/app/api/calendar/route.ts)): Trả về các mục lịch sắp đến hạn của sinh viên.
  - `POST /api/calendar`: Thêm một cơ hội vào lịch cá nhân.

---

## 2. Kế Hoạch Triển Khai Tiếp Theo (Upcoming Implementation)

1. **Trang Giao Diện Lịch Toàn Trang (`/calendar`):**
   - Chế độ xem theo Tháng (Month Grid View) và Danh sách (Agenda List View).
   - Đánh dấu màu sắc các ngày có sự kiện/hạn chót nộp đơn.
   - Nhấp vào một ngày để xem chi tiết các cơ hội đóng đơn trong ngày đó.
2. **Cơ Chế Nhắc Hạn Tự Động (`FR-CAL-07..10`):**
   - Thiết lập cron job hoặc scheduled worker định kỳ quét các `CalendarEntry` sắp đến hạn (còn 7 ngày, 3 ngày, 1 ngày) để sinh thông báo in-app và gửi email nhắc nhở cho sinh viên.
