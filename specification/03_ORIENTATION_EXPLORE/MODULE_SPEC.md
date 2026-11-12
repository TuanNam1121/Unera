# Module 03: Khám Phá Định Hướng (Career Orientation Articles & Taxonomy)

> **Mã Module:** `ORIENTATION_EXPLORE`  
> **Trạng thái hiện tại:** [`src/app/explore/page.tsx`](file:///c:/Users/AD/OneDrive/Desktop/Project/ULIS_DMST_2026/src/app/explore/page.tsx) hiện đang hiển thị Cơ hội (`Opportunity`) và [`src/components/common/Sidebar.tsx`](file:///c:/Users/AD/OneDrive/Desktop/Project/ULIS_DMST_2026/src/components/common/Sidebar.tsx#L185-L202) đang hardcode các mục con của "Khám phá định hướng". **Cần tái kiến trúc** chuyển `/explore` thành Thư viện **Bài viết Định hướng theo ngành**, đồng bộ **Sidebar động** từ Category & Topic/Tag do Admin quản trị, và bổ sung **Like** + **Comment**.  
> **Tác nhân:** Visitor/Student (xem, tìm kiếm, like, comment), Admin (quản trị bài viết, danh mục, chủ đề/thẻ, bài nổi bật).

---

## 1. Tổng Quan Nghiệp Vụ & Kết Nối Sidebar

1. **Bản chất Module:** Module "Khám phá định hướng" cung cấp các **bài viết chuyên sâu liên quan đến các khối ngành, lộ trình du học, sau đại học và định hướng nghề nghiệp** để sinh viên đọc hiểu trước khi quyết định hướng đi. *(Các chương trình tuyển dụng, học bổng, NCKH có hạn nộp nằm ở Module 04 — Hoạt động sinh viên `/activities`)*.
2. **Đồng bộ 2 cấp giữa Admin Taxonomy và Sidebar:**
   - **Cấp 1 — Category (`orientation_categories`):** Là các danh mục lớn hiển thị trực tiếp trong menu accordion **"Khám phá định hướng"** trên Sidebar (VD: *Du học*, *Khối ngành*, *Thạc sĩ / NCS / Tiến sĩ*...).
   - **Cấp 2 — Topic/Tag (`orientation_topics`):** Là các **danh mục con thuộc từng Category** (VD dưới *Khối ngành* có: *Ngôn ngữ*, *Kinh tế – Quản trị*, *Công nghệ – Kỹ thuật*, *Truyền thông*, *Luật*, *Khoa học xã hội*, *Du lịch – Dịch vụ*...). Các Topic/Tag này tự động hiển thị dưới Category cha trên Sidebar và làm bộ lọc con trên trang `/explore`.
3. **Tương tác của Sinh viên:** Xem danh sách theo Category/Topic, xem chi tiết bài viết, **Like Article**, và **Comment on Article**.

---

## 2. Mô Hình Dữ Liệu (MongoDB / Mongoose)

### 2.1 `orientation_categories` (Danh mục cấp 1 - hiển thị ở Sidebar)
| Trường | Kiểu | Bắt buộc | Mô tả |
|---|---|---|---|
| `name` | `String` | Có | Tên danh mục (VD: `"Khối ngành"`, `"Du học"`) |
| `slug` | `String` | Có | Unique slug dùng trên URL (`/explore?category=khoi-nganh`) |
| `description` | `String` | Không | Mô tả ngắn cho trang header khi lọc |
| `icon` | `String` | Không | Tên icon Lucide (tùy chọn) |
| `order` | `Number` | Có | Thứ tự hiển thị ở Sidebar và CMS (`0, 1, 2...`) |
| `isActive` | `Boolean` | Có | `true` mới hiển thị ở Sidebar & trang người dùng |

### 2.2 `orientation_topics` (Chủ đề / Thẻ - Danh mục con của Category)
| Trường | Kiểu | Bắt buộc | Mô tả |
|---|---|---|---|
| `categoryId` | `ObjectId` | Có | Ref `orientation_categories._id` (Category cha), index |
| `name` | `String` | Có | Tên chủ đề/danh mục con (VD: `"Ngôn ngữ"`, `"Kinh tế – Quản trị"`) |
| `slug` | `String` | Có | Unique slug theo category (`{ categoryId: 1, slug: 1 }` unique) |
| `description` | `String` | Không | Mô tả ngắn |
| `order` | `Number` | Có | Thứ tự hiển thị dưới Category cha ở Sidebar |
| `isActive` | `Boolean` | Có | `true` mới hiển thị |

### 2.3 `orientation_articles` (Bài viết Định hướng)
| Trường | Kiểu | Bắt buộc | Mô tả |
|---|---|---|---|
| `title` | `String` | Có | Tiêu đề bài viết |
| `slug` | `String` | Có | Unique slug (`/explore/[slug]`) |
| `summary` | `String` | Có | Tóm tắt ngắn hiển thị trên thẻ |
| `content` | `String` | Có | Nội dung Markdown/HTML chi tiết |
| `coverImage` | `String` | Không | URL ảnh bìa |
| `categoryId` | `ObjectId` | Có | Ref `orientation_categories._id`, index |
| `topicIds` | `ObjectId[]` | Không | Danh sách `orientation_topics._id` thuộc category (index) |
| `tags` | `String[]` | Không | Từ khóa phụ bổ trợ tìm kiếm |
| `status` | `Enum` | Có | `"DRAFT"` \| `"PUBLISHED"` \| `"UNPUBLISHED"` |
| `isFeatured` | `Boolean` | Có | Bài viết nổi bật do Admin chọn (`Featured Management`) |
| `authorName` | `String` | Có | Tên tác giả / Ban biên tập |
| `createdByAdminId` | `ObjectId` | Có | Admin tạo bài |
| `readTimeMinutes` | `Number` | Có | Ước tính thời gian đọc |
| `viewCount` | `Number` | Có | Mặc định `0` |
| `likeCount` | `Number` | Có | Bộ đếm phi chuẩn hóa, đồng bộ với `article_likes` |
| `commentCount` | `Number` | Có | Bộ đếm phi chuẩn hóa, đồng bộ với `article_comments` |
| `publishedAt` | `Date` | Không | Thời điểm xuất bản |

### 2.4 `article_likes` (Lượt thích bài viết)
- `articleId` (`ObjectId`, ref `orientation_articles`), `userId` (`ObjectId`, ref `users`).
- **Unique Index:** `{ articleId: 1, userId: 1 }` — đảm bảo mỗi người dùng chỉ Like 1 lần trên 1 bài viết.

### 2.5 `article_comments` (Bình luận bài viết)
- `articleId` (`ObjectId`, index), `userId` (`ObjectId`), `authorName` (`String`), `authorAvatar` (`String`), `parentCommentId` (`ObjectId | null` — hỗ trợ reply 1 cấp nếu cần), `content` (`String`, 1–1000 ký tự), `isEdited` (`Boolean`), `isDeleted` (`Boolean` — soft delete nếu có reply hoặc xóa hẳn), `createdAt`, `updatedAt`.

---

## 3. Danh Sách Đặc Tả Chi Tiết

| Mã | Tên đặc tả | Tệp |
|---|---|---|
| `EXP-01` | Xem danh sách bài viết & chi tiết bài viết định hướng | [`01_STUDENT_ARTICLES_FEED_AND_DETAIL.md`](./01_STUDENT_ARTICLES_FEED_AND_DETAIL.md) |
| `EXP-02` | Like & Comment bài viết định hướng | [`02_STUDENT_ARTICLE_LIKES_AND_COMMENTS.md`](./02_STUDENT_ARTICLE_LIKES_AND_COMMENTS.md) |
| `EXP-03` | Admin CMS — Quản trị Bài viết Định hướng | [`03_ADMIN_ARTICLE_MANAGEMENT.md`](./03_ADMIN_ARTICLE_MANAGEMENT.md) |
| `EXP-04` | Admin CMS — Quản lý Category & Topic/Tag đồng bộ Sidebar | [`04_ADMIN_CATEGORY_AND_TOPIC_TAG_MANAGEMENT.md`](./04_ADMIN_CATEGORY_AND_TOPIC_TAG_MANAGEMENT.md) |

