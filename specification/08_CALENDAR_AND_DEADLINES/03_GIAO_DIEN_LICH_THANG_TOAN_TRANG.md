# Tính Năng: Giao Diện Lịch Toàn Trang Dạng Lưới & Danh Sách (Full Calendar Views)

> **Mã SRS:** `FR-CAL-05`, `FR-CAL-06`, `FR-CAL-07`  
> **Trạng thái:** ![Kế hoạch theo SRS](https://img.shields.io/badge/-KẾ%20HOẠCH%20THEO%20SRS-amber)  
> **Thuộc cụm:** `08_CALENDAR_AND_DEADLINES`  
> **Tác nhân:** Sinh viên (Student)

---

## 1. Đặc Tả Giao Diện Lịch Theo SRS 1.0 (Specification)

### 1.1 Tuyến Đường `/calendar`
- Cung cấp 2 chế độ hiển thị linh hoạt:
  1. **Chế độ Lưới Tháng (Month Grid View):**
     - Hiển thị 7 ngày trong tuần từ Thứ Hai đến Chủ Nhật.
     - Các ngày có hạn chót được đánh dấu chấm màu theo loại cơ hội (Học bổng: xanh lá, Thực tập: xanh dương, Cuộc thi: tím).
     - Nhấp vào một ô ngày mở popover danh sách các sự kiện đóng đơn trong ngày đó.
  2. **Chế độ Dòng Thời Gian (Agenda / Timeline View):**
     - Sắp xếp các sự kiện theo trình tự thời gian tăng dần từ gần đến xa.
     - Nút "Hủy theo dõi" (Remove from Calendar).
