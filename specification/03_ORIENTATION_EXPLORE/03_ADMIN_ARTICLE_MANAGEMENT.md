# EXP-03: Admin CMS — Quản Trị Bài Viết Định Hướng

> **Module:** `03_ORIENTATION_EXPLORE`  
> **Yêu cầu Admin:** `Create Article`, `Edit Article`, `Delete Article`, `Publish Article`, `Unpublish Article`, `Article Draft`, `Featured Management`, `Article Search & Filter`.  
> **Tác nhân:** Admin (`role === "ADMIN"`).

---

## 1. Quy Tắc Nghiệp Vụ & Luồng Admin (`/admin/explore`)

1. **Create Article (Tạo bài viết mới):**
   - Đường dẫn: `/admin/explore/new`.
   - Trường thông tin: Tiêu đề, Slug (tự động sinh từ tiêu đề không dấu + cho phép sửa, kiểm tra duy nhất), Tóm tắt, Nội dung (Markdown/Rich Text Editor), Ảnh bìa (URL hoặc upload <= 10MB), **Danh mục (`categoryId`)**, **Các Chủ đề/Thẻ (`topicIds`)** (chỉ cho phép chọn các topic thuộc `categoryId` đã chọn), Từ khóa tìm kiếm (`tags`), Thời gian đọc ước tính, Tùy chọn **Nổi bật (`isFeatured`)**, và Hành động lưu: **"Lưu bản nháp (`DRAFT`)"** hoặc **"Xuất bản ngay (`PUBLISHED`)"**.
2. **Edit Article (Chỉnh sửa bài viết):**
   - Đường dẫn: `/admin/explore/[id]/edit`.
   - Cập nhật mọi trường của bài viết; nếu đổi `categoryId`, kiểm tra lại `topicIds` thuộc danh mục mới. Ghi nhận `AuditLog` diff trước/sau.
3. **Article Draft & Publish / Unpublish (Quản lý trạng thái):**
   - 3 trạng thái rõ ràng:
     - `DRAFT`: Bản nháp, đang biên tập, không hiển thị cho sinh viên.
     - `PUBLISHED`: Đã xuất bản công khai trên `/explore`. Nếu `publishedAt` chưa có thì tự gán `new Date()`.
     - `UNPUBLISHED`: Đã gỡ khỏi hệ thống công khai (ẩn khỏi user feed và detail page), giữ lại trong CMS để Admin có thể chỉnh sửa và xuất bản lại sau.
   - Hỗ trợ nút bật/tắt nhanh **Xuất bản (Publish)** / **Gỡ bài (Unpublish)** / **Chuyển về Nháp (Draft)** ngay trên bảng danh sách CMS.
4. **Delete Article (Xóa bài viết):**
   - Yêu cầu hộp thoại xác nhận rõ ràng trước khi xóa.
   - Khi xóa bài viết, xóa kèm các bản ghi `ArticleLike` và `ArticleComment` liên quan (cascade cleanup) và ghi `AuditLog`.
5. **Featured Management (Quản lý bài viết nổi bật):**
   - Admin có thể đánh dấu/bỏ đánh dấu `isFeatured` trực tiếp từ form hoặc toggle sao (⭐) nhanh trên danh sách quản trị.
   - Nên có tab/filter riêng "Bài viết nổi bật" để Admin kiểm soát số lượng bài đang được ghim trên Banner/Top Explore.
6. **Article Search & Filter trong Admin CMS:**
   - Tìm kiếm theo tiêu đề, tóm tắt, tags.
   - Lọc theo **Trạng thái** (`ALL`, `PUBLISHED`, `DRAFT`, `UNPUBLISHED`), **Danh mục (`categoryId`)**, **Chủ đề (`topicId`)**, và **Nổi bật (`isFeatured`)**.
   - Phân trang chuẩn (`limit = 10` hoặc `20`).

---

## 2. Đặc Tả API Contract (`/api/admin/orientation/articles`)

Mọi endpoint đều yêu cầu `requireAdmin()`.

| Method | Endpoint | Chức năng |
|---|---|---|
| `GET` | `/api/admin/orientation/articles` | Danh sách bài viết kèm filter `q`, `status`, `categoryId`, `topicId`, `isFeatured`, `page`, `limit` |
| `POST` | `/api/admin/orientation/articles` | Tạo bài viết mới (`DRAFT` hoặc `PUBLISHED`) |
| `GET` | `/api/admin/orientation/articles/[id]` | Lấy chi tiết bài viết để edit |
| `PATCH` | `/api/admin/orientation/articles/[id]` | Cập nhật nội dung, hoặc chuyển trạng thái (`status: PUBLISHED / UNPUBLISHED / DRAFT`), hoặc toggle `isFeatured` |
| `DELETE` | `/api/admin/orientation/articles/[id]` | Xóa bài viết & cascade xóa Likes/Comments |

### Zod Validation Schema (Create / Update)
```typescript
const adminOrientationArticleSchema = z.object({
  title: z.string().trim().min(5, "Tiêu đề tối thiểu 5 ký tự").max(200),
  slug: z.string().trim().min(3).regex(/^[a-z0-9-]+$/, "Slug chỉ chứa chữ thường, số và dấu gạch ngang").optional(),
  summary: z.string().trim().min(10, "Tóm tắt tối thiểu 10 ký tự").max(500),
  content: z.string().trim().min(20, "Nội dung tối thiểu 20 ký tự"),
  coverImage: z.string().optional(),
  categoryId: z.string().min(1, "Vui lòng chọn danh mục"),
  topicIds: z.array(z.string()).default([]),
  tags: z.array(z.string().trim()).default([]),
  status: z.enum(["DRAFT", "PUBLISHED", "UNPUBLISHED"]).default("DRAFT"),
  isFeatured: z.boolean().default(false),
  readTimeMinutes: z.coerce.number().int().min(1).max(120).default(5),
});
```

---

## 3. Tiêu Chí Chấp Thuận (Acceptance Criteria)

- **AC-01 (Draft & Publish):** *Given* Admin tạo bài viết với `status = "DRAFT"`, *Then* bài viết hiện trong Admin CMS nhưng không xuất hiện trên `/explore` của sinh viên; *When* Admin bấm "Xuất bản" (`PUBLISHED`), *Then* bài viết lập tức hiển thị trên `/explore`.
- **AC-02 (Unpublish):** *Given* bài viết đang `PUBLISHED`, *When* Admin bấm "Gỡ bài" (`UNPUBLISHED`), *Then* bài biến mất khỏi `/explore`, truy cập link cũ báo 404, nhưng dữ liệu vẫn tồn tại trong Admin CMS.
- **AC-03 (Search, Filter & Featured):** *Given* Admin bật sao `isFeatured = true` cho bài viết và lọc theo Category + Trạng thái trong CMS, *Then* bảng CMS lọc chính xác và bài viết hiển thị ở khu vực nổi bật của `/explore`.
- **AC-04 (Authorization):** *Given* tài khoản `STUDENT` gọi `POST/PATCH/DELETE /api/admin/orientation/articles`, *Then* bị chặn với HTTP `403 Forbidden`.

