# Tính Năng: Widget Hạn Sắp Tới Trên Dashboard (Upcoming Deadlines Widget)

> **Mã SRS:** `FR-CAL-04`, `UI-06`  
> **Trạng thái:** ![Hoàn thành](https://img.shields.io/badge/-ĐÃ%20HOÀN%20THÀNH%20100%25-emerald)  
> **Thuộc cụm:** `08_CALENDAR_AND_DEADLINES`  
> **Tác nhân:** Sinh viên (Student)

---

## 1. Cách Thức Hoạt Động Hiện Tại (Implementation Details)

### 1.1 Khối Widget Bên Phải Trang Chủ (`/`)
- **Tệp nguồn:** [`src/app/page.tsx`](file:///c:/Users/AD/OneDrive/Desktop/Project/ULIS_DMST_2026/src/app/page.tsx)
- Hiển thị danh sách các deadline sắp đến gần nhất của sinh viên:
  - Ô ngày tháng dạng lịch con: Ô vuông nền xanh, hiển thị số ngày và tháng (ví dụ: `12 TH 11`).
  - Tiêu đề cơ hội và phân loại (Công việc thực tập, Sự kiện trực tuyến, Học bổng đã lưu).
  - Huy hiệu đếm ngược: `Còn 3 ngày`, `Còn 5 ngày`, `Còn 9 ngày`.
- Nút **"Xem tất cả"** dẫn sang trang Lịch chi tiết `/calendar`.
