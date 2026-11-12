# EXP-01: Xem Danh Sách & Chi Tiết Bài Viết Định Hướng (Student)

> **Module:** `03_ORIENTATION_EXPLORE`  
> **Yêu cầu:** Xem danh sách các bài viết liên quan đến các ngành, điều hướng theo Category/Topic trên Sidebar, xem chi tiết bài viết, hiển thị bài viết nổi bật.  
> **Tác nhân:** Visitor (xem), Student (xem + tương tác).

---

## 1. Quy Tắc Nghiệp Vụ & UI/UX

1. **Điều hướng Sidebar Động:**
   - Sidebar mục **"Khám phá định hướng"** lấy cây danh mục từ `GET /api/orientation/taxonomy` (chỉ gồm các Category và Topic có `isActive: true`, sắp xếp theo `order`).
   - Khi người dùng bấm vào **Category** (VD: `Khối ngành`) → chuyển tới `/explore?category=khoi-nganh`.
   - Khi người dùng bấm vào **Topic/Tag con** (VD: `· Ngôn ngữ`) → chuyển tới `/explore?category=khoi-nganh&topic=ngon-ngu`.
2. **Trang Danh sách (`/explore`):**
   - **Khu vực Bài viết Nổi bật (Featured Banner/Cards):** Hiển thị tối đa 1–3 bài viết có `isFeatured: true` và `status: "PUBLISHED"` (lọc theo category hiện tại nếu đang chọn category, hoặc toàn bộ nếu ở "Tất cả").
   - **Thanh Lọc & Tìm kiếm:**
     - Pills lọc nhanh theo Category + Pills lọc con theo Topic thuộc Category đang chọn.
     - Ô tìm kiếm từ khóa theo tiêu đề/tóm tắt/thẻ tag.
     - Sắp xếp: Mới nhất, Phổ biến nhất (nhiều Like/Lượt xem).
   - **Lưới Bài viết (3 cột responsive):** Mỗi Card hiển thị ảnh bìa (hoặc gradient category placeholder), badge Category + Topic tags, Tiêu đề, Tóm tắt 2–3 dòng, Thời gian đọc, số `likeCount`, số `commentCount`, trạng thái đã like của user hiện tại.
   - **Chế độ hiển thị công khai:** Chỉ trả về các bài viết có `status === "PUBLISHED"`. Bài `DRAFT` hoặc `UNPUBLISHED` tuyệt đối không xuất hiện.
3. **Trang Chi Tiết Bài Viết (`/explore/[slug]`):**
   - Hiển thị Breadcrumb (`Khám phá định hướng > [Category] > [Topic] > [Tiêu đề]`).
   - Tiêu đề, Tác giả, Ngày đăng, Thời gian đọc, Danh mục & Tags, Ảnh bìa, Nội dung đầy đủ (render Markdown an toàn chống XSS).
   - Thanh tương tác nhanh (Nút **Like** + đếm lượt thích, nút **Bình luận** nhảy xuống vùng comment, nút Copy link chia sẻ).
   - Khối **Bài viết liên quan** cùng Category/Topic ở cuối trang.
   - Tăng `viewCount` khi truy cập trang chi tiết.

---

## 2. Đặc Tả API Contract

### 2.1 `GET /api/orientation/taxonomy`
- Trả cây danh mục `categories` đang `isActive: true` kèm `topics` (`isActive: true`) lồng bên trong để Sidebar và `/explore` render đồng bộ.

### 2.2 `GET /api/orientation/articles`
- **Query params:** `category` (slug), `topic` (slug), `q` (search), `sort` (`latest` | `popular`), `featured` (`true`), `page` (default 1), `limit` (default 9).
- **Filter bắt buộc:** `status: "PUBLISHED"` và category/topic đang active.
- **Response `200 OK`:**
  ```json
  {
    "success": true,
    "featuredArticles": [...],
    "articles": [
      {
        "_id": "...",
        "title": "Ngành Ngôn ngữ Anh: Học gì và cơ hội sự nghiệp 2026",
        "slug": "nganh-ngon-ngu-anh-hoc-gi-va-co-hoi-su-nghiep",
        "summary": "...",
        "category": { "_id": "...", "name": "Khối ngành", "slug": "khoi-nganh" },
        "topics": [{ "_id": "...", "name": "Ngôn ngữ", "slug": "ngon-ngu" }],
        "isFeatured": true,
        "readTimeMinutes": 6,
        "likeCount": 42,
        "commentCount": 12,
        "isLikedByMe": true,
        "publishedAt": "..."
      }
    ],
    "pagination": { "page": 1, "limit": 9, "total": 24, "totalPages": 3 }
  }
  ```

### 2.3 `GET /api/orientation/articles/[slug]`
- Tìm bài viết theo `slug` với `status: "PUBLISHED"`.
- Tăng `viewCount` (`$inc: { viewCount: 1 }`).
- Kiểm tra user hiện tại (nếu đã đăng nhập) đã Like bài này chưa (`isLikedByMe`).
- Trả về `article` + `relatedArticles` (tối đa 3 bài cùng Category/Topic).
- Nếu không tìm thấy hoặc bài đã bị Unpublish (`status !== "PUBLISHED"`) → trả `404`.

---

## 3. Tiêu Chí Chấp Thuận (Acceptance Criteria)

- **AC-01:** *Given* Admin tạo Category "Khối ngành" và Topic con "Ngôn ngữ" đều `isActive: true`, *When* sinh viên tải lại trang, *Then* Sidebar dưới "Khám phá định hướng" hiển thị đúng danh mục này và bấm vào sẽ lọc bài viết tương ứng tại `/explore`.
- **AC-02:** *Given* bài viết có trạng thái `DRAFT` hoặc `UNPUBLISHED`, *When* sinh viên tìm kiếm hoặc truy cập trực tiếp `/explore/[slug]`, *Then* bài viết không hiển thị và trả về trang 404.
- **AC-03:** *Given* sinh viên mở `/explore/[slug]`, *When* trang tải xong, *Then* hiển thị đầy đủ nội dung, danh mục/chủ đề, số Like/Comment, và các bài viết liên quan.

