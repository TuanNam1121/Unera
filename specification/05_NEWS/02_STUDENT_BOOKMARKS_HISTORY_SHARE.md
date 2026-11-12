# NEWS-B: Lưu Bài Viết, Lịch Sử Đọc & Chia Sẻ Bài Viết (NEWS07, NEWS08, NEWS11, NEWS12)

> **Module:** `05_NEWS`  
> **Feature IDs:** `NEWS07` (Bookmark Article), `NEWS08` (Saved Articles), `NEWS11` (Reading History), `NEWS12` (Share Article).  
> **Thay đổi so với code cũ:** Thay thế state RAM + `alert(...)` hiện tại trong [`src/app/news/page.tsx`](file:///c:/Users/AD/OneDrive/Desktop/Project/ULIS_DMST_2026/src/app/news/page.tsx#L156-L198) bằng lưu trữ thật trong MongoDB.

---

## 1. Quy Tắc Nghiệp Vụ Từng Feature ID

### `NEWS07` — Bookmark Article (Lưu bài viết yêu thích)
- Yêu cầu đăng nhập (`ACTIVE`). Nếu chưa đăng nhập → chuyển `/login`.
- Bấm icon Bookmark trên thẻ bài viết hoặc trang chi tiết `/news/[slug]` để Toggle Lưu / Bỏ lưu xuống collection `news_bookmarks`.
- Đồng bộ tăng/giảm `NewsArticle.bookmarkCount` (`>= 0`).
- Unique index `{ userId: 1, articleId: 1 }` chống lưu trùng.

### `NEWS08` — Saved Articles (Xem danh sách bài viết đã lưu)
- Thay thế nút `alert(...)` ở [`src/app/news/page.tsx`](file:///c:/Users/AD/OneDrive/Desktop/Project/ULIS_DMST_2026/src/app/news/page.tsx#L193) bằng liên kết tới tab/trang `/news/saved` (hoặc Tab **"Bài viết đã lưu"** ngay trong `/news`).
- Hiển thị danh sách bài viết đã bookmark, sắp xếp theo thời điểm lưu mới nhất (`createdAt DESC`), cho phép bỏ lưu nhanh hoặc bấm đọc lại.
- Nếu bài viết bị Admin chuyển sang `UNPUBLISHED` hoặc xóa → không hiển thị nội dung hoặc gắn nhãn "Bài viết không còn khả dụng".

### `NEWS11` — Reading History (Lịch sử bài viết đã đọc)
- Khi sinh viên đã đăng nhập mở trang chi tiết `/news/[slug]` thành công, server tự động ghi/cập nhật bản ghi vào `news_reading_histories` (`lastReadAt = new Date()`, `$inc: { readCount: 1 }`).
- Giao diện `/news/history` (hoặc Tab **"Lịch sử đã đọc"** trên `/news`) liệt kê các bài viết đã xem, hiển thị thời điểm đọc gần nhất (`"Đọc 2 giờ trước"`), và có nút **"Xóa lịch sử đọc"** (xóa 1 bài hoặc xóa tất cả của bản thân).

### `NEWS12` — Share Article (Chia sẻ bài viết)
- Trên trang chi tiết `/news/[slug]` và menu thẻ bài viết, cung cấp nút **Chia sẻ**:
  1. Copy URL chuẩn (`${origin}/news/${slug}`) vào clipboard + hiển thị toast *"Đã sao chép liên kết bài viết!"*.
  2. Hỗ trợ nút Web Share API (`navigator.share`) trên thiết bị di động/trình duyệt hỗ trợ.
  3. Gọi `POST /api/news/[slug]/share` để tăng `NewsArticle.shareCount` phục vụ thống kê `NEWS22` (có chống spam cơ bản theo session/IP debounce).

---

## 2. Đặc Tả API Contract

| Method | Endpoint | Auth | Mô tả |
|---|---|---|---|
| `POST` | `/api/news/[slug]/bookmark` | Student | Toggle lưu/bỏ lưu bài viết, trả `{ bookmarked: boolean, bookmarkCount }` |
| `GET` | `/api/news/saved` | Student | Lấy danh sách bài viết đã lưu (có phân trang) |
| `GET` | `/api/news/history` | Student | Lấy lịch sử bài viết đã đọc (sắp xếp `lastReadAt DESC`) |
| `DELETE` | `/api/news/history` | Student | Xóa toàn bộ hoặc 1 mục lịch sử đọc (`?articleId=...`) |
| `POST` | `/api/news/[slug]/share` | Public/Student | Ghi nhận lượt chia sẻ (`$inc: { shareCount: 1 }`) |

---

## 3. Tiêu Chí Chấp Thuận

- **AC-01 (`NEWS07`, `NEWS08`):** *Given* sinh viên bấm Bookmark 2 bài viết, *When* reload trình duyệt và mở mục "Bài viết đã lưu", *Then* cả 2 bài viết vẫn xuất hiện đầy đủ từ DB.
- **AC-02 (`NEWS11`):** *Given* sinh viên mở bài viết A rồi mở bài viết B, *When* mở tab "Lịch sử đã đọc", *Then* bài B nằm trên bài A kèm thời gian đọc gần nhất.
- **AC-03 (`NEWS12`):** *Given* người dùng bấm "Chia sẻ bài viết", *Then* URL bài viết được copy vào clipboard, toast xác nhận hiện ra, và `shareCount` tăng lên `1`.

