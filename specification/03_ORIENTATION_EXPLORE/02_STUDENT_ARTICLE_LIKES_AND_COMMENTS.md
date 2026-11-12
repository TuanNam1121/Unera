# EXP-02: Like & Comment Trên Bài Viết Định Hướng

> **Module:** `03_ORIENTATION_EXPLORE`  
> **Yêu cầu:** `Comment on Article`, `Like Article` cho người dùng (Sinh viên).  
> **Tác nhân:** Student (Like & Comment), Visitor (chỉ xem số Like & danh sách Comment, yêu cầu đăng nhập khi tương tác), Admin (xóa bình luận vi phạm nếu cần).

---

## 1. Quy Tắc Nghiệp Vụ — Like Article

1. **Yêu cầu đăng nhập:** Chỉ người dùng đã đăng nhập (`ACTIVE`) mới có thể Like/Unlike. Nếu Visitor (chưa đăng nhập) bấm nút Like → hiển thị thông báo hoặc modal điều hướng tới `/login?callbackUrl=/explore/[slug]`.
2. **Toggle Idempotent & Không trùng lặp:**
   - Dùng `ArticleLike` với unique compound index `{ articleId: 1, userId: 1 }`.
   - Nếu chưa có bản ghi Like → Insert `ArticleLike` và `$inc: { likeCount: 1 }`.
   - Nếu đã có bản ghi Like → Delete `ArticleLike` và `$inc: { likeCount: -1 }` (đảm bảo `likeCount >= 0`).
3. **Chỉ áp dụng trên bài đã xuất bản:** Nếu bài viết đang `DRAFT` hoặc `UNPUBLISHED` → từ chối với HTTP `404` / `400`.
4. **Optimistic UI:** Frontend cập nhật trạng thái nút tim và số đếm tức thì khi click, tự động rollback nếu API lỗi.

---

## 2. Quy Tắc Nghiệp Vụ — Comment on Article

1. **Xem bình luận:** Ai cũng có thể xem danh sách bình luận trên bài viết `PUBLISHED`, phân trang (`limit = 10` hoặc `20`), sắp xếp mới nhất trước (hoặc cũ nhất trước cho reply).
2. **Tạo bình luận mới:**
   - Yêu cầu đăng nhập (`ACTIVE`).
   - Nội dung bình luận (`content`): `trim()`, độ dài từ `1` đến `1000` ký tự; làm sạch chống XSS/HTML injection (lưu plain text và render escaped).
   - Hỗ trợ **Reply (trả lời 1 cấp)** thông qua `parentCommentId` tùy chọn (nếu `parentCommentId` có giá trị, kiểm tra comment cha tồn tại và thuộc cùng `articleId`, không cho lồng quá 1 cấp).
   - Tăng `OrientationArticle.commentCount` lên `1`.
3. **Chỉnh sửa & Xóa bình luận:**
   - **Sinh viên** chỉ được sửa hoặc xóa **bình luận do chính mình tạo** (`comment.userId === currentUser.id`). Khi sửa, cập nhật `isEdited = true`.
   - **Admin** có quyền xóa bất kỳ bình luận nào vi phạm tiêu chuẩn cộng đồng (ghi nhật ký `AuditLog`).
   - Khi xóa bình luận gốc, giảm `commentCount` tương ứng (hoặc ẩn comment nếu giữ cấu trúc reply, cập nhật bộ đếm chính xác).

---

## 3. Đặc Tả API Contract

### 3.1 `POST /api/orientation/articles/[slug]/like`
- **Auth:** `requireAuth()`.
- **Xử lý:** Toggle trạng thái Like cho `(article._id, user.id)`.
- **Response `200 OK`:**
  ```json
  {
    "success": true,
    "liked": true,
    "likeCount": 43
  }
  ```

### 3.2 `GET /api/orientation/articles/[slug]/comments`
- **Query params:** `page` (default 1), `limit` (default 10).
- **Response `200 OK`:**
  ```json
  {
    "success": true,
    "comments": [
      {
        "_id": "...",
        "content": "Bài viết phân tích rất rõ về ngành Ngôn ngữ Anh!",
        "user": { "id": "...", "name": "Trần Minh", "avatar": "..." },
        "parentCommentId": null,
        "isEdited": false,
        "isOwner": true,
        "createdAt": "...",
        "replies": []
      }
    ],
    "pagination": { "page": 1, "total": 12, "totalPages": 2 }
  }
  ```

### 3.3 `POST /api/orientation/articles/[slug]/comments`
- **Auth:** `requireAuth()`.
- **Zod Schema:**
  ```typescript
  const createCommentSchema = z.object({
    content: z.string().trim().min(1, "Vui lòng nhập nội dung bình luận").max(1000, "Bình luận tối đa 1000 ký tự"),
    parentCommentId: z.string().optional().nullable(),
  });
  ```
- **Response `201 Created`:** Trả về object `comment` vừa tạo + `commentCount` mới.

### 3.4 `PATCH /api/orientation/comments/[commentId]` & `DELETE /api/orientation/comments/[commentId]`
- **Auth:** `requireAuth()`.
- Kiểm tra quyền sở hữu (`comment.userId === authUser.id`, riêng `DELETE` cho phép thêm `authUser.role === "ADMIN"`). Nếu không phải chủ sở hữu → `403 Forbidden`.

---

## 4. Tiêu Chí Chấp Thuận (Acceptance Criteria)

- **AC-01 (Like Toggle):** *Given* sinh viên đã đăng nhập mở bài viết có `likeCount = 10`, *When* bấm nút Like lần 1, *Then* `liked = true` và `likeCount = 11`; *When* bấm lần 2, *Then* `liked = false` và `likeCount = 10` (không bao giờ tạo 2 bản ghi Like trùng).
- **AC-02 (Comment CRUD):** *Given* sinh viên nhập bình luận hợp lệ và gửi, *When* reload trang, *Then* bình luận vẫn hiển thị đúng tên/avatar tác giả và `commentCount` tăng lên `1`.
- **AC-03 (Chống IDOR Comment):** *Given* Sinh viên A gửi request `PATCH` hoặc `DELETE` vào `commentId` của Sinh viên B, *Then* server từ chối với HTTP `403`.

