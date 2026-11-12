# Module 05: Tin Tức (News & Editorial Hub — NEWS01 đến NEWS22)

> **Mã Module:** `NEWS`  
> **Yêu cầu liên quan:** `NEWS01`–`NEWS12` (Student) và `NEWS13`–`NEWS22` (Admin).  
> **Trạng thái hiện tại:** Đã có [`src/app/news/page.tsx`](file:///c:/Users/AD/OneDrive/Desktop/Project/ULIS_DMST_2026/src/app/news/page.tsx), [`src/app/news/[slug]/page.tsx`](file:///c:/Users/AD/OneDrive/Desktop/Project/ULIS_DMST_2026/src/app/news/[slug]/page.tsx), [`src/models/NewsArticle.ts`](file:///c:/Users/AD/OneDrive/Desktop/Project/ULIS_DMST_2026/src/models/NewsArticle.ts) và [`src/app/admin/news/page.tsx`](file:///c:/Users/AD/OneDrive/Desktop/Project/ULIS_DMST_2026/src/app/admin/news/page.tsx). Tuy nhiên, bookmark hiện mới nằm ở state client, nút "Bài viết đã lưu" hiện `alert()`, và thiếu `tags`, filter thời gian, sort phổ biến, reading history, share tracking, category/tag CMS, article scheduling và analytics.  
> **Tác nhân:** Visitor/Student (`NEWS01`–`NEWS12`), Admin (`NEWS13`–`NEWS22`).

---

## 1. Mở Rộng Mô Hình Dữ Liệu (MongoDB / Mongoose)

### 1.1 Mở rộng `news_articles` ([`NewsArticle.ts`](file:///c:/Users/AD/OneDrive/Desktop/Project/ULIS_DMST_2026/src/models/NewsArticle.ts))
| Trường | Kiểu | Hiện có | Mới / Thay đổi | Mô tả |
|---|---|---|---|---|
| `title`, `slug`, `summary`, `content` | `String` | Có | Giữ | Nội dung bài viết |
| `category` | `String` | Có | Chuẩn hóa | Liên kết `NewsCategory.slug` (mặc định seed 6 nhóm: `ORIENTATION`, `STUDY_ABROAD`, `DISCIPLINES`, `POSTGRAD`, `SKILLS_CV`, `SCHOLARSHIPS`) |
| `tags` | `String[]` | Chưa | **Thêm mới** | Danh sách tag/chủ đề (index), phục vụ `NEWS04`, `NEWS09`, `NEWS19` |
| `status` | `Enum` | Có | **Mở rộng** | `"DRAFT"` \| `"SCHEDULED"` \| `"PUBLISHED"` \| `"UNPUBLISHED"` |
| `scheduledAt` | `Date` | Chưa | **Thêm mới** | Thời điểm hẹn giờ tự động xuất bản (`NEWS21`), index |
| `publishedAt` | `Date` | Có | Giữ | Thời điểm xuất bản thực tế |
| `isFeatured` | `Boolean` | Có | Giữ | Bài viết nổi bật (`NEWS10`, `NEWS20`) |
| `viewCount` | `Number` | Chưa | **Thêm mới** | Tổng lượt xem (`NEWS05`, `NEWS22`), mặc định `0` |
| `bookmarkCount` | `Number` | Chưa | **Thêm mới** | Tổng lượt lưu (`NEWS22`), mặc định `0` |
| `shareCount` | `Number` | Chưa | **Thêm mới** | Tổng lượt chia sẻ (`NEWS12`, `NEWS22`), mặc định `0` |

### 1.2 Các Collection Mới Cho News
- **`news_categories` (`NEWS18`):** `name`, `slug` (unique), `description`, `colorToken`, `order`, `isActive`.
- **`news_tags` (`NEWS19`):** `name`, `slug` (unique), `usageCount`, `isActive`.
- **`news_bookmarks` (`NEWS07`, `NEWS08`):** `userId` (`ObjectId`), `articleId` (`ObjectId`), `createdAt`. Unique index `{ userId: 1, articleId: 1 }`.
- **`news_reading_histories` (`NEWS11`):** `userId` (`ObjectId`), `articleId` (`ObjectId`), `lastReadAt` (`Date`), `readCount` (`Number`). Unique index `{ userId: 1, articleId: 1 }`, TTL hoặc giới hạn giữ lịch sử gần nhất.

---

## 2. Danh Sách Đặc Tả Chi Tiết

| Mã | Tính năng bao phủ | Tệp |
|---|---|---|
| `NEWS-A` | `NEWS01`–`NEWS06`, `NEWS09`–`NEWS10` (Listing, Categories, Search, Filter, Sort, Detail, Related, Featured) | [`01_STUDENT_NEWS_LISTING_FILTER_SORT_DETAIL.md`](./01_STUDENT_NEWS_LISTING_FILTER_SORT_DETAIL.md) |
| `NEWS-B` | `NEWS07`, `NEWS08`, `NEWS11`, `NEWS12` (Bookmark, Saved Articles, Reading History, Share) | [`02_STUDENT_BOOKMARKS_HISTORY_SHARE.md`](./02_STUDENT_BOOKMARKS_HISTORY_SHARE.md) |
| `NEWS-C` | `NEWS13`–`NEWS22` (Admin CMS, Draft/Publish, Category/Tag, Featured, Scheduling, Analytics) | [`03_ADMIN_NEWS_CMS_SCHEDULING_ANALYTICS.md`](./03_ADMIN_NEWS_CMS_SCHEDULING_ANALYTICS.md) |

