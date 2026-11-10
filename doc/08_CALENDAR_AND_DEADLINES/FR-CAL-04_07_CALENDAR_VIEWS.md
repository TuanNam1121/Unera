# Đặc Tả Tính Năng: Giao Diện Lịch Tháng, Danh Sách & Khối Hạn Sắp Tới

> **Mã tính năng:** `FR-CAL-04`, `FR-CAL-05`, `FR-CAL-06`, `FR-CAL-07`  
> **Thuộc cụm:** `08_CALENDAR_AND_DEADLINES`  
> **Tác nhân:** Sinh viên (Student)  

---

## 1. Các Dạng Hiển Thị Lịch Chuẩn Hóa

Hệ thống cung cấp 3 chế độ xem lịch:
1. **Khối "Hạn sắp tới" (Upcoming Deadlines Widget - FR-CAL-07):**
   - Đặt ngay tại trang chủ Dashboard (tham chiếu Screenshot 2 và [`src/app/page.tsx`](file:///c:/Users/AD/OneDrive/Desktop/Project/ULIS_DMST_2026/src/app/page.tsx)).
   - Hiển thị 3 cơ hội có hạn chót gần nhất.
   - Thẻ ngày hình hộp: Số ngày nổi bật (ví dụ: `12`), tháng (`TH 11`), tên cơ hội, phân loại và nhãn đếm ngược (`Còn 3 ngày`).
2. **Chế độ Lịch tháng (Monthly Calendar View - FR-CAL-06):**
   - Lưới 7 cột (Thứ 2 đến Chủ nhật) hiển thị trọn vẹn tháng.
   - Ngày có hạn chót hiển thị chấm tròn màu hoặc thanh nhãn tên cơ hội.
3. **Chế độ Danh sách thời gian (List View - FR-CAL-06):**
   - Danh sách dòng thời gian sắp xếp theo thứ tự ngày tăng dần, phân nhóm theo Tuần này, Tuần tới, Tháng này.
