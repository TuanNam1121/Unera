# NEWS-C: Admin CMS, Lịch Xuất Bản & Thống Kê Tin Tức (NEWS13–NEWS22)

> **Module:** `05_NEWS`  
> **Feature IDs:** `NEWS13` (Create), `NEWS14` (Edit), `NEWS15` (Delete), `NEWS16` (Draft Management), `NEWS17` (Publish/Unpublish), `NEWS18` (Category Management), `NEWS19` (Tag Management), `NEWS20` (Featured Management), `NEWS21` (Article Scheduling), `NEWS22` (Article Analytics).  
> **Tác nhân:** Admin (`role === "ADMIN"`).

---

## 1. Quy Tắc Nghiệp Vụ Từng Feature ID (`/admin/news`)

1. **`NEWS13` – `NEWS17` (Article CRUD, Draft, Publish/Unpublish):**
   - Tạo bài mới (`/admin/news/new`), sửa bài (`/admin/news/[id]/edit`), xóa bài (cascade dọn `NewsBookmark`, `NewsReadingHistory`), lưu nháp (`DRAFT`), xuất bản (`PUBLISHED`), ẩn/gỡ bài (`UNPUBLISHED`).
   - Hỗ trợ ảnh bìa, danh mục, nhiều tags, nội dung tài trợ (`isSponsored`, `sponsorInfo`), nguồn trích dẫn.
2. **`NEWS18` — Category Management (`/admin/news/categories`):**
   - Thêm, sửa tên/màu/thứ tự, bật/tắt `isActive`, xóa danh mục tin tức (chặn xóa cứng nếu đang có bài viết thuộc danh mục đó).
3. **`NEWS19` — Tag Management (`/admin/news/tags`):**
   - Quản lý danh sách tag/chủ đề (`news_tags`), gộp/xóa/đổi tên tag, tự động gợi ý tag có sẵn khi Admin soạn bài viết.
4. **`NEWS20` — Featured Management:**
   - Chọn/bỏ chọn `isFeatured` cho bài viết từ danh sách CMS hoặc trang sửa; hiển thị bộ lọc riêng "Đang nổi bật".
5. **`NEWS21` — Article Scheduling (Hẹn giờ xuất bản):**
   - Trên form tạo/sửa bài viết, Admin có 3 lựa chọn xuất bản:
     - **Lưu bản nháp (`DRAFT`)**
     - **Xuất bản ngay (`PUBLISHED`)**
     - **Lên lịch xuất bản (`SCHEDULED`):** Bắt buộc chọn `scheduledAt` ở **tương lai** (`scheduledAt > now`).
   - **Cơ chế kích hoạt tự động:**
     - Cron/Scheduler định kỳ (cùng hoặc tách với reminder job) kiểm tra `NewsArticle.find({ status: "SCHEDULED", scheduledAt: { $lte: new Date() } })` → chuyển sang `status: "PUBLISHED"`, `publishedAt = scheduledAt`.
     - Đồng thời tại query public `GET /api/news`, tự động promote các bài đã quá giờ `scheduledAt` để đảm bảo đúng thời gian thực dù cron có độ trễ vài giây.
6. **`NEWS22` — Article Analytics (`/admin/news/analytics`):**
   - Hiển thị thống kê hiệu suất nội dung tin tức:
     - Tổng lượt xem (`viewCount`), tổng lượt lưu (`bookmarkCount`), tổng lượt chia sẻ (`shareCount`).
     - Bảng xếp hạng Top bài viết đọc nhiều nhất / lưu nhiều nhất.
     - Biểu đồ tổng hợp tương tác theo danh mục và theo trạng thái (`PUBLISHED`, `SCHEDULED`, `DRAFT`).

---

## 2. Đặc Tả API Contract (`/api/admin/news/*`)

Tất cả endpoint yêu cầu `requireAdmin()` + ghi `AuditLog`.

| Method | Endpoint | Feature ID | Chức năng |
|---|---|---|---|
| `GET` | `/api/admin/news` | `NEWS13`–`NEWS21` | Danh sách CMS (filter `search`, `category`, `tag`, `status`, `isFeatured`, `page`) |
| `POST` | `/api/admin/news` | `NEWS13`, `NEWS16`, `NEWS21` | Tạo bài viết (`DRAFT`, `PUBLISHED`, hoặc `SCHEDULED` + `scheduledAt`) |
| `PATCH` | `/api/admin/news/[id]` | `NEWS14`, `NEWS17`, `NEWS20`, `NEWS21` | Sửa nội dung, đổi trạng thái, toggle `isFeatured`, cập nhật lịch xuất bản |
| `DELETE` | `/api/admin/news/[id]` | `NEWS15` | Xóa bài viết & cascade bookmarks/history |
| `GET/POST/PATCH/DELETE` | `/api/admin/news/categories` | `NEWS18` | CRUD danh mục tin tức |
| `GET/POST/PATCH/DELETE` | `/api/admin/news/tags` | `NEWS19` | CRUD tag & chủ đề |
| `GET` | `/api/admin/news/analytics` | `NEWS22` | Thống kê viewCount, bookmarkCount, shareCount & top articles |

---

## 3. Tiêu Chí Chấp Thuận

- **AC-01 (`NEWS21` Scheduling):** *Given* Admin tạo bài viết ở trạng thái `SCHEDULED` với `scheduledAt` là 5 phút sau, *Then* trước thời điểm đó sinh viên không thấy bài viết trên `/news`; *When* qua mốc `scheduledAt`, *Then* bài viết tự động chuyển sang `PUBLISHED` và hiển thị công khai.
- **AC-02 (`NEWS22` Analytics):** *Given* bài viết có 15 lượt xem, 4 lượt lưu và 2 lượt chia sẻ, *When* Admin mở `/admin/news/analytics`, *Then* các chỉ số này hiển thị chính xác.
- **AC-03 (`NEWS18`, `NEWS19`):** Admin tạo tag `"Học bổng Chính phủ"` và danh mục mới → xuất hiện ngay trong form soạn bài viết và bộ lọc của sinh viên.

