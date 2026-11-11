# Cụm Tính Năng 13 & 14: Thư Viện Tin Tức & Bài Viết Định Hướng (Community & News Articles)

> **Mã SRS:** `FR-COM-01` đến `FR-COM-06`, `FR-NEWS-01` đến `FR-NEWS-07`  
> **Trạng thái:** ![Hoàn thành 100%](https://img.shields.io/badge/-ĐÃ%20HOÀN%20THÀNH%20100%25-emerald)  
> **Tác nhân:** Sinh viên (Student - Xem), Quản trị viên (Admin - Quản lý)

---

## 1. Cách Thức Hoạt Động Hiện Tại (Current Implementation)

Cung cấp chuyên trang Thư viện tin tức học thuật và bài viết cẩm nang định hướng, hỗ trợ nội dung tài trợ minh bạch từ đối tác:

### 1.1 Giao Diện Thư Viện Bài Viết Sinh Viên (`/news`)
- **Tệp mã nguồn:** [`src/app/news/page.tsx`](file:///c:/Users/AD/OneDrive/Desktop/Project/ULIS_DMST_2026/src/app/news/page.tsx)
- **Thiết kế chuẩn UI tham khảo 100%:**
  - Tiêu đề thư viện: *"Đọc hôm nay, vững bước ngày mai."*
  - **Khối Hero Banner lớn (2/3 chiều rộng):** "Ban biên tập đề xuất" ghim bài viết nổi bật nhất (Featured Article) kèm nút đọc bài và thời gian đọc.
  - **Khối Đọc theo lộ trình (1/3 chiều rộng):** 3 bước đọc tuần tự:
    - *01. Hiểu mình trước khi chọn ngành* &rarr; dẫn sang `/onboarding`.
    - *02. Tìm hiểu ngành học và cơ hội* &rarr; dẫn sang `/explore`.
    - *03. Lên kế hoạch cho bước tiếp theo* &rarr; dẫn sang `/roadmap`.
  - **Bộ lọc chuyên mục ngang:** *Tất cả*, *Định hướng*, *Du học*, *Khối ngành*, *Sau đại học*, *Kỹ năng & CV*, *Học bổng*.
  - **Thanh tìm kiếm nhanh:** Tìm kiếm realtime theo tiêu đề và nội dung bài viết.
  - **Lưới thẻ bài viết (Article Grid):** Hiển thị nhãn chuyên mục, huy hiệu "Tài trợ" (nếu có), nút bookmark lưu bài viết, tác giả và thời gian đọc.

### 1.2 Trang Đọc Bài Viết Chi Tiết (`/news/[slug]`)
- **Tệp mã nguồn:** [`src/app/news/[slug]/page.tsx`](file:///c:/Users/AD/OneDrive/Desktop/Project/ULIS_DMST_2026/src/app/news/[slug]/page.tsx)
- Hỗ trợ hiển thị Markdown đầy đủ, đoạn tóm tắt (Lead), tác giả, ngày đăng.
- **Minh bạch Nội dung tài trợ (`FR-NEWS-06`):**
  - Hiển thị banner riêng biệt: *"Nội dung hợp tác cùng [Tên đối tác]"* kèm liên kết chiến dịch ngoài.
- Nút chia sẻ (Web Share API) và lưu bài viết.
- Khối các bài viết liên quan cùng chuyên mục ở chân trang.

### 1.3 Phân Hệ Quản Trị Bài Viết Admin CMS (`/admin/news`)
- **Quản lý danh sách bài viết (`/admin/news`):** [`src/app/admin/news/page.tsx`](file:///c:/Users/AD/OneDrive/Desktop/Project/ULIS_DMST_2026/src/app/admin/news/page.tsx)
  - Tìm kiếm, lọc theo chuyên mục và trạng thái (*Đã xuất bản*, *Bản nháp*, *Lưu trữ*).
  - Nút chuyển đổi nhanh trạng thái xuất bản, xem trước và xóa bài viết.
- **Tạo bài viết mới (`/admin/news/new`):** [`src/app/admin/news/new/page.tsx`](file:///c:/Users/AD/OneDrive/Desktop/Project/ULIS_DMST_2026/src/app/admin/news/new/page.tsx)
  - Soạn thảo Tiêu đề, Chuyên mục, Tóm tắt, Nội dung Markdown.
  - **Toggle Tin nổi bật (`isFeatured` - `FR-NEWS-05`):** Đưa bài viết lên vị trí Hero Banner "Ban biên tập đề xuất".
  - **Toggle Nội dung tài trợ (`isSponsored` - `FR-NEWS-06, 07`):** Nhập Tên đối tác và Link chiến dịch.
  - Tự động ghi nhật ký kiểm toán vào `AuditLog`.

### 1.4 Mô Hình Dữ Liệu `NewsArticle`
- **Tệp mã nguồn:** [`src/models/NewsArticle.ts`](file:///c:/Users/AD/OneDrive/Desktop/Project/ULIS_DMST_2026/src/models/NewsArticle.ts)
```typescript
interface INewsArticle {
  title: string;
  slug: string; // Tự động sinh từ title (unique, index)
  summary: string;
  content: string;
  category: string;
  author: string;
  readTime: string;
  isFeatured: boolean;
  isSponsored: boolean;
  sponsorInfo?: {
    sponsorName: string;
    sponsorLogoUrl?: string;
    targetUrl?: string;
  };
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  publishedAt: Date;
}
```

### 1.5 Ranh Giới Phạm Vi SRS 1.0 (`FR-COM-01`, `BR-22`)
- Phân hệ Community trong phạm vi 1.0 là nội dung biên tập chính thức được kiểm duyệt bởi Admin/Nhà trường (Read-only editorial content). Hệ thống **không hỗ trợ** mạng xã hội tự do, bình luận không kiểm duyệt hay tính năng chat realtime giữa sinh viên.
