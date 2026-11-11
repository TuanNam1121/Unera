# Tính Năng: Bài Viết Tiêu Điểm Nổi Bật Hero Section (Featured Article)

> **Mã SRS:** `FR-NEWS-05`  
> **Trạng thái:** ![Hoàn thành 100%](https://img.shields.io/badge/-ĐÃ%20HOÀN%20THÀNH%20100%25-emerald)  
> **Thuộc cụm:** `13_14_COMMUNITY_AND_NEWS`  
> **Tác nhân:** Sinh viên (Student), Khách truy cập (Guest)

---

## 1. Cách Thức Hoạt Động Hiện Tại (Implementation Details)

### 1.1 Khối Bài Viết Tiêu Điểm Trang Tin Tức (`/news`)
- Tệp nguồn giao diện: [`src/app/news/page.tsx`](file:///c:/Users/AD/OneDrive/Desktop/Project/ULIS_DMST_2026/src/app/news/page.tsx).
- Khi có bài viết được gán cờ `isFeatured: true`, hệ thống ưu tiên hiển thị bài viết đó tại **vị trí Hero Banner** kích thước lớn trên cùng của trang:
  - Khung ảnh bìa lớn toàn cảnh (Panoramic Cover).
  - Huy hiệu nổi bật: `"TIÊU ĐIỂM HÔM NAY"`.
  - Tiêu đề đậm lớn và đoạn tóm tắt xúc tích.
  - Nút kêu gọi hành động `"Đọc toàn bộ bài viết"` dẫn trực tiếp tới trang chi tiết.

### 1.2 Cấu Hình Phía CSDL & Admin
- Trường CSDL: `isFeatured: { type: Boolean, default: false, index: true }` trong [`src/models/NewsArticle.ts`](file:///c:/Users/AD/OneDrive/Desktop/Project/ULIS_DMST_2026/src/models/NewsArticle.ts).
- Quản trị viên chỉ cần bật toggle "Đặt làm bài viết nổi bật" trong form tạo/sửa bài viết tại `/admin/news/new`.
