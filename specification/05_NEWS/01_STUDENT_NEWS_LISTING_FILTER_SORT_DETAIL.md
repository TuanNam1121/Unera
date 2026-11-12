# NEWS-A: Danh Sách, Điều Hướng, Tìm Kiếm, Lọc, Sắp Xếp & Chi Tiết Tin Tức (NEWS01–NEWS06, NEWS09–NEWS10)

> **Module:** `05_NEWS`  
> **Feature IDs:** `NEWS01`, `NEWS02`, `NEWS03`, `NEWS04`, `NEWS05`, `NEWS06`, `NEWS09`, `NEWS10`.  
> **Tác nhân:** Visitor, Student.

---

## 1. Quy Tắc Nghiệp Vụ Từng Feature ID

1. **`NEWS01` — News Listing (`/news`):**
   - Chỉ hiển thị các bài viết có `status === "PUBLISHED"` (hoặc bài `SCHEDULED` đã đến giờ `scheduledAt <= now`, được auto-promote sang `PUBLISHED`).
   - Phân trang chuẩn (`limit = 9`, hiển thị số trang & nút điều hướng).
2. **`NEWS02` — Category Navigation:**
   - Thanh điều hướng pills chuẩn ở đầu trang: **Tất cả**, **Định hướng**, **Du học**, **Khối ngành**, **Sau đại học**, **Kỹ năng & CV**, **Học bổng** (đọc động từ `news_categories` để phản ánh thay đổi từ Admin `NEWS18`).
3. **`NEWS03` — Search Articles:**
   - Tìm kiếm theo `title`, `summary`, `tags`, và `content` (debounce 300ms trên client + hỗ trợ search từ thanh Topbar).
4. **`NEWS04` — Filter Articles:**
   - Lọc kết hợp theo:
     - Danh mục (`category`)
     - Chủ đề/Tag (`tag`)
     - Thời gian đăng (`dateRange`: `all` | `today` | `7d` | `30d` | `90d`).
5. **`NEWS05` — Sort Articles:**
   - `latest` (**Mới nhất** — mặc định): sắp xếp theo `publishedAt DESC`.
   - `popular` (**Phổ biến nhất**): sắp xếp theo công thức độ phổ biến (`viewCount + bookmarkCount * 3 + shareCount * 2`, hoặc `viewCount DESC, bookmarkCount DESC`).
6. **`NEWS10` — Featured Articles:**
   - Khối Hero / Featured trên đầu trang `/news` hiển thị các bài viết có `isFeatured === true && status === "PUBLISHED"` do Admin lựa chọn (`NEWS20`).
7. **`NEWS06` — Article Detail (`/news/[slug]`):**
   - Hiển thị đầy đủ tiêu đề, danh mục, tags, tác giả, ngày xuất bản, thời gian đọc, lượt xem, nội dung chi tiết (Markdown an toàn), thông tin nguồn / nhãn tài trợ minh bạch (nếu `isSponsored === true`), nút Bookmark (`NEWS07`), nút Share (`NEWS12`).
   - Tự động tăng `viewCount` khi mở bài viết và ghi nhận `Reading History` (`NEWS11`) nếu đã đăng nhập.
8. **`NEWS09` — Related Articles:**
   - Ở cuối trang `/news/[slug]`, gợi ý tối đa `3–4` bài viết `PUBLISHED` khác có cùng `category` hoặc trùng nhiều `tags` nhất với bài viết hiện tại.

---

## 2. Đặc Tả API Contract

### `GET /api/news`
- **Query params:** `category`, `tag`, `search`, `dateRange` (`7d`|`30d`|`90d`), `sort` (`latest`|`popular`), `page`, `limit`.
- **Auto-publish scheduled check:** Trước khi query (hoặc qua cron worker), tự động cập nhật `status = "PUBLISHED"` cho các bài có `status = "SCHEDULED" && scheduledAt <= now`.
- **Response `200 OK`:** `{ success: true, articles, featuredArticles, categories, tags, total, page, totalPages }`.

### `GET /api/news/[slug]`
- Tăng `viewCount` lên `1`. Nếu có user đăng nhập, upsert `NewsReadingHistory` (`NEWS11`) và kiểm tra `isBookmarked` (`NEWS07`).
- Trả về `{ success: true, article, relatedArticles, isBookmarked }`.

---

## 3. Tiêu Chí Chấp Thuận

- **AC-01 (`NEWS02`–`NEWS05`):** Sinh viên chọn danh mục `"Du học"`, lọc tag `"IELTS"`, lọc thời gian `"30 ngày qua"` và sắp xếp `"Phổ biến nhất"` → danh sách trả về đúng tập bài viết thỏa mãn và xếp đúng thứ tự `viewCount` giảm dần.
- **AC-02 (`NEWS06`, `NEWS09`, `NEWS10`):** Trang `/news` hiển thị đúng bài nổi bật từ Admin, và trang `/news/[slug]` hiển thị nội dung đầy đủ + tối đa 3 bài viết liên quan cùng danh mục/tag.

