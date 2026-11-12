# CM-04: Media Lifecycle, Orphan Cleanup & Tích Hợp Vào Các Module (CM14–CM16)

> **Module:** `00_CONTENT_MANAGEMENT`  
> **Feature IDs:** `CM14` (Reference Sync & Unused Media Cleanup), `CM15` (Article Delete Media Cascade), `CM16` (Cross-Module Integration Contract).  
> **Tác nhân:** Backend Services, Admin CMS.

---

## 1. Quản Lý Vòng Đời & Dọn Rác Media (`CM14`, `CM15`)

### `CM14` — Đồng Bộ Tham Chiếu Khi Lưu Bài (`syncContentMediaRefs`)
Mọi thao tác tạo (`POST`) hoặc cập nhật (`PATCH`) của `OrientationArticle`, `StudentActivity`, `NewsArticle` đều gọi hàm dùng chung `syncContentMediaRefs({ targetCollection, documentId, coverImage, contentJson })`:

1. **Trích xuất tài nguyên hiện dùng:** Duyệt `coverImage` (`role: "COVER"`) và toàn bộ `contentJson` (`image`, `audioBlock`, `role: "CONTENT"`) để thu thập tập hợp `publicId` / Cloudinary URL thuộc hệ thống.
2. **Gắn tham chiếu mới (`$addToSet`):** Với mỗi `MediaAsset` có trong tập mới, đảm bảo `usedBy` chứa `{ targetCollection, documentId, role }` và cập nhật `status = "ATTACHED"`.
3. **Gỡ tham chiếu cũ khi Admin sửa bài:** Tìm các `MediaAsset` trước đây từng có `{ targetCollection, documentId }` trong `usedBy` nhưng không còn xuất hiện trong phiên bản mới của bài viết → gỡ entry `{ targetCollection, documentId }` ra khỏi `usedBy`.
4. **Xử lý `MediaAsset` khi `usedBy` rỗng (`usedBy.length === 0`):**
   - Đặt trạng thái `status = "ORPHANED"` (hoặc gọi xóa trực tiếp trên Cloudinary nếu chính sách dọn ngay được bật).
   - Endpoint dọn rác `POST /api/admin/media/cleanup` sẽ xóa khỏi **Cloudinary + MongoDB**:
     - Tất cả asset có `status === "TEMP"` (upload lên nhưng Admin thoát trang không lưu) tạo quá **24 giờ**.
     - Tất cả asset có `status === "ORPHANED"` (bị gỡ khỏi bài viết khi chỉnh sửa và không còn bất kỳ bài viết nào khác tham chiếu).

### `CM15` — Xóa Media Không Còn Sử Dụng Khi Xóa Bài Viết (`detachAndDeleteUnusedMedia`)
Khi Admin thực hiện `DELETE` bài viết ở Module 03, 04 hoặc 05:
1. Tìm toàn bộ `MediaAsset` có `usedBy` chứa `{ targetCollection, documentId }`.
2. Gỡ tham chiếu `{ targetCollection, documentId }` khỏi các `MediaAsset` đó.
3. Với những `MediaAsset` sau khi gỡ có **`usedBy.length === 0`**:
   - Gọi `cloudinary.uploader.destroy(asset.publicId, { resource_type: asset.resourceType })`.
   - Xóa bản ghi `MediaAsset` khỏi MongoDB.
   - Ghi nhận thông tin số lượng tài nguyên media đã dọn vào `AuditLog` (lỗi Cloudinary đơn lẻ được log cảnh báo và đánh dấu `ORPHANED` để retry ở `/api/admin/media/cleanup`, không làm treo thao tác xóa bài).
4. Với những `MediaAsset` vẫn còn `usedBy.length > 0` (đang dùng chung ở bài viết khác): **giữ nguyên** trên Cloudinary và MongoDB.

---

## 2. Hợp Đồng Tích Hợp Sang Các Module (`CM16`)

Thay thế triệt để mô hình nội dung cũ để toàn hệ thống dùng chung **1 Editor — 1 Media Pipeline — 1 Renderer**:

| Module | Collection / Model | Thay đổi cần thực hiện theo `00_CONTENT_MANAGEMENT` |
|---|---|---|
| **Module 03 — Khám phá định hướng** (`03_ORIENTATION_EXPLORE`) | `OrientationArticle` (`orientation_articles`) | - Xóa cơ chế `content: string` Markdown & `SafeMarkdownRenderer` cũ.<br>- Thay bằng `contentJson` + `contentText`.<br>- Thay textarea Markdown trong `AdminArticleForm` bằng `<TiptapContentEditor />` + `<CoverImageField />`.<br>- Trang `/explore/[slug]` dùng `<TiptapContentRenderer />`.<br>- `POST/PATCH/DELETE` `/api/admin/orientation/articles*` gọi `syncContentMediaRefs` / `detachAndDeleteUnusedMedia`.<br>- Cập nhật seed script sang `contentJson` hợp lệ. |
| **Module 04 — Hoạt động sinh viên** (`04_STUDENT_ACTIVITIES`) | `StudentActivity` (`student_activities`) | - Trường nội dung chi tiết sử dụng `contentJson` + `contentText` (thay cho `description: string` thuần).<br>- Form Admin `/admin/activities/*` dùng `<TiptapContentEditor />` + `<CoverImageField />`.<br>- Trang chi tiết `/activities/[slug]` dùng `<TiptapContentRenderer />`.<br>- Tích hợp `syncContentMediaRefs` & `detachAndDeleteUnusedMedia`. |
| **Module 05 — Tin tức** (`05_NEWS`) | `NewsArticle` (`news_articles`) | - Loại bỏ trường `content: string` cũ, thay bằng `contentJson` + `contentText`.<br>- Nâng cấp `/admin/news/new` & edit page dùng `<TiptapContentEditor />` + `<CoverImageField />`.<br>- Trang `/news/[slug]` render bằng `<TiptapContentRenderer />`.<br>- Tích hợp `syncContentMediaRefs` & `detachAndDeleteUnusedMedia`. |

---

## 3. Lộ Trình Triển Khai Đề Xuất
1. **Giai đoạn 1 (Build Base):** Cài Tiptap + Cloudinary SDK → Xây `MediaAsset`, `src/lib/cloudinary.ts`, `src/lib/content/*`, API `/api/admin/media/*`, `<TiptapContentEditor />`, `<CoverImageField />`, `<TiptapContentRenderer />`.
2. **Giai đoạn 2 (Migrate Module 03 sạch sẽ):** Xóa code Markdown cũ ở Module 03 (`SafeMarkdownRenderer`, textarea markdown), chuyển `OrientationArticle` & seed data sang `contentJson` + `contentText` + media lifecycle.
3. **Giai đoạn 3 (Áp dụng cho Module 04 & 05):** Triển khai `04_STUDENT_ACTIVITIES` và nâng cấp `05_NEWS` trực tiếp trên nền tảng `00_CONTENT_MANAGEMENT` đã sẵn sàng.

---

## 4. Tiêu Chí Chấp Thuận

- **AC-01 (`CM14`):** Admin sửa bài viết, xóa một block ảnh cũ khỏi Tiptap JSON và lưu lại → `MediaAsset` của ảnh cũ bị gỡ khỏi `usedBy` của bài đó; nếu không còn bài nào tham chiếu, asset chuyển sang `ORPHANED` và được dọn sạch trên Cloudinary qua cơ chế cleanup.
- **AC-02 (`CM14`):** Admin upload ảnh mới vào Editor nhưng đóng tab không lưu → quá `24h`, chạy `POST /api/admin/media/cleanup` xóa bỏ cả file Cloudinary lẫn document `TEMP`.
- **AC-03 (`CM15`):** Admin xóa bài viết có 2 ảnh (1 ảnh chỉ thuộc bài này, 1 ảnh dùng chung với bài khác) → ảnh dùng riêng bị xóa khỏi Cloudinary & DB, ảnh dùng chung vẫn còn nguyên ở bài kia.
- **AC-04 (`CM16`):** Cả `OrientationArticle`, `StudentActivity`, và `NewsArticle` dùng chung một cặp component `<TiptapContentEditor />` và `<TiptapContentRenderer />` cùng thư viện media Cloudinary.

