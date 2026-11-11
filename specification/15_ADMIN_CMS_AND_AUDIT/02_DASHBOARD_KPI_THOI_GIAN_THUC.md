# Tính Năng: Bảng Điều Khiển KPI Thời Gian Thực (Admin KPI Dashboard)

> **Mã SRS:** `FR-ADM-01`  
> **Trạng thái:** ![Hoàn thành 100%](https://img.shields.io/badge/-ĐÃ%20HOÀN%20THÀNH%20100%25-emerald)  
> **Thuộc cụm:** `15_ADMIN_CMS_AND_AUDIT`  
> **Tác nhân:** Quản trị viên (Admin)

---

## 1. Cách Thức Hoạt Động Hiện Tại (Implementation Details)

### 1.1 Giao Diện Trung Tâm Điều Hành (`/admin`)
- Tệp nguồn giao diện: [`src/app/admin/page.tsx`](file:///c:/Users/AD/OneDrive/Desktop/Project/ULIS_DMST_2026/src/app/admin/page.tsx).
- Hiển thị 4 thẻ số liệu KPI chính (Overview Metric Cards):
  1. **Tổng sinh viên đăng ký:** Tổng tài khoản sinh viên hoạt động trong hệ thống, kèm tỷ lệ tăng trưởng.
  2. **Cơ hội đang công khai:** Số lượng cơ hội học bổng, việc làm đang ở trạng thái `PUBLISHED`.
  3. **Lịch hẹn Mentor chờ duyệt:** Số lượng yêu cầu tư vấn cần xử lý (`PENDING`) kèm cảnh báo màu cam.
  4. **Bài viết & Tin tức đã đăng:** Số lượng bài viết định hướng đang xuất bản.

### 1.2 Biểu Đồ & Tỷ Lệ Hoàn Thành Lộ Trình
- Bảng tổng hợp phân bố theo 5 hướng đi nghề nghiệp chính của sinh viên:
  - Du học & Học bổng quốc tế.
  - Biên - Phiên dịch chuyên nghiệp.
  - Sư phạm & Giảng dạy ngoại ngữ.
  - Doanh nghiệp & Marketing / Logistics.
  - Khởi nghiệp & Lãnh đạo trẻ.
- Tỷ lệ sinh viên hoàn thành bài Quiz định hướng và tiến độ trung bình trên lộ trình 4 năm.

### 1.3 Backend API
- Endpoint: `GET /api/admin/dashboard/stats` trong [`src/app/api/admin/dashboard/stats/route.ts`](file:///c:/Users/AD/OneDrive/Desktop/Project/ULIS_DMST_2026/src/app/api/admin/dashboard/stats/route.ts).
- Truy vấn tổng hợp song song bằng `Promise.all` kết hợp aggregation pipeline của Mongoose để đảm bảo tốc độ phản hồi dưới 200ms.
