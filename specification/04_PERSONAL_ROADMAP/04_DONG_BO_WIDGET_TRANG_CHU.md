# Tính Năng: Đồng Bộ Lộ Trình Lên Trang Chủ Dashboard (Home Dashboard Sync)

> **Mã SRS:** `FR-RM-08`, `FR-RM-09`  
> **Trạng thái:** ![Hoàn thành](https://img.shields.io/badge/-ĐÃ%20HOÀN%20THÀNH%20100%25-emerald)  
> **Thuộc cụm:** `04_PERSONAL_ROADMAP`  
> **Tác nhân:** Sinh viên (Student)

---

## 1. Cách Thức Hoạt Động Hiện Tại (Implementation Details)

### 1.1 Khối Widget "Lộ Trình Của Tôi" Trên Trang Chủ (`/`)
- **Tệp nguồn:** [`src/components/home/HomeRoadmapCard.tsx`](file:///c:/Users/AD/OneDrive/Desktop/Project/ULIS_DMST_2026/src/components/home/HomeRoadmapCard.tsx)
- **Tự động tải và đồng bộ dữ liệu:**
  1. Khi sinh viên đăng nhập và truy cập trang chủ `/`, component gọi `GET /api/roadmap` lấy lộ trình đang kích hoạt.
  2. Hiển thị tiêu đề mục tiêu lớn (ví dụ: *"Trở thành Du học sinh Mỹ"*).
  3. Hiển thị phần trăm tiến độ (ví dụ: `67%`) và số bước hoàn thành (`8 / 12 bước hoàn tất`).
  4. Thanh tiến độ bo tròn xanh dương hiển thị đúng tỷ lệ.
  5. Hiển thị nhiệm vụ vừa hoàn thành gần nhất và nhiệm vụ cần làm kế tiếp kèm liên kết: **"Bước tiếp theo &rarr;"** dẫn thẳng vào `/roadmap`.
- **Chế độ khách (Guest mode):** Nếu người dùng chưa đăng nhập, widget hiển thị dữ liệu minh họa sinh động mà không bị crash hoặc giật layout.
