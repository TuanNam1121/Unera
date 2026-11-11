# Tính Năng: Thư Viện Bài Viết Định Hướng Nghề Nghiệp (News & Orientation Articles)

> **Mã SRS:** `FR-NEWS-01`, `FR-NEWS-02`, `FR-NEWS-03`  
> **Trạng thái:** ![Hoàn thành 100%](https://img.shields.io/badge/-ĐÃ%20HOÀN%20THÀNH%20100%25-emerald)  
> **Thuộc cụm:** `13_14_COMMUNITY_AND_NEWS`  
> **Tác nhân:** Sinh viên (Student), Khách truy cập (Guest)

---

## 1. Cách Thức Hoạt Động Hiện Tại (Implementation Details)

### 1.1 Giao Diện Danh Sách Bài Viết (`/news`)
- Tệp nguồn giao diện: [`src/app/news/page.tsx`](file:///c:/Users/AD/OneDrive/Desktop/Project/ULIS_DMST_2026/src/app/news/page.tsx).
- Cung cấp thanh lọc danh mục:
  - `ORIENTATION`: Định hướng nghề nghiệp sinh viên ngoại ngữ.
  - `SCHOLARSHIP`: Bí quyết săn học bổng du học.
  - `CAREER`: Kỹ năng ứng tuyển, viết CV và phỏng vấn.
  - `LANGUAGE`: Phương pháp học ngoại ngữ chuyên sâu.
  - `EVENT`: Tin tức sự kiện hội thảo, workshop.
- Mỗi bài viết hiển thị ảnh bìa, tiêu đề, tóm tắt ngắn, thời gian đọc ước tính (`readTime`), tên tác giả và ngày đăng.

### 1.2 Giao Diện Đọc Chi Tiết Bài Viết (`/news/[slug]`)
- Tệp nguồn giao diện: [`src/app/news/[slug]/page.tsx`](file:///c:/Users/AD/OneDrive/Desktop/Project/ULIS_DMST_2026/src/app/news/[slug]/page.tsx).
- Định dạng bài viết chuẩn Typography:
  - Tiêu đề H1 lớn, trích dẫn nổi bật.
  - Ảnh bìa tỷ lệ 16:9 sắc nét.
  - Nội dung trình bày phân đoạn rõ ràng, kèm danh mục các tệp tài liệu đính kèm (nếu có).
  - Nút Bookmark lưu trữ bài viết yêu thích và nút chia sẻ liên kết.

### 1.3 Backend APIs
- API Danh sách: `GET /api/news` (hỗ trợ lọc theo `category`, `search`, phân trang).
- API Chi tiết: `GET /api/news/[slug]` lấy bài viết theo slug thân thiện SEO.
- Mô hình CSDL: [`src/models/NewsArticle.ts`](file:///c:/Users/AD/OneDrive/Desktop/Project/ULIS_DMST_2026/src/models/NewsArticle.ts).
