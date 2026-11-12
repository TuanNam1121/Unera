# EXP-04: Admin CMS — Category Management & Topic/Tag Management (Đồng Bộ Sidebar)

> **Module:** `03_ORIENTATION_EXPLORE`  
> **Yêu cầu:**  
> - **Category Management:** Quản lý danh mục và danh mục con (**phần danh mục này chính là các phần sẽ được hiển thị ở sidebar của Khám phá định hướng**).  
> - **Topic/Tag Management:** Quản lý các chủ đề và thẻ (**phần danh mục con này là các phần con của các category được hiển thị trên hệ thống**).  
> **Tác nhân:** Admin (`role === "ADMIN"`).

---

## 1. Quy Tắc Nghiệp Vụ & Mô Hình Cây 2 Cấp

1. **Cấu trúc phân cấp:**
   - **Cấp 1 — Category (`OrientationCategory`):** Ví dụ: `Du học`, `Khối ngành`, `Thạc sĩ, NCS, Tiến sĩ`.
   - **Cấp 2 — Topic/Tag (`OrientationTopic`):** Mỗi Topic bắt buộc thuộc về **1 Category cha** (`categoryId`). Ví dụ dưới `Khối ngành` có các Topic con: `Ngôn ngữ`, `Kinh tế – Quản trị`, `Công nghệ – Kỹ thuật`, `Truyền thông`, `Luật`, `Khoa học xã hội`, `Du lịch – Dịch vụ`.
2. **Đồng bộ tự động lên Sidebar người dùng:**
   - Sidebar (`src/components/common/Sidebar.tsx`) dưới mục cha **"Khám phá định hướng"** không hardcode nữa mà đọc danh sách từ API `/api/orientation/taxonomy` (hoặc Server Layout Props có cache revalidation).
   - Mọi thao tác Admin **thêm, sửa tên, đổi thứ tự (`order`), ẩn/hiện (`isActive`), hoặc xóa** Category và Topic/Tag đều phản ánh lên Sidebar sau khi lưu (`revalidatePath` / refetch client state).
3. **Ràng buộc toàn vẹn khi Xóa:**
   - **Xóa Category:** Nếu Category vẫn đang chứa Topics hoặc Bài viết (`OrientationArticle`), **chặn xóa cứng** (trả `409 Conflict` kèm số lượng bài viết/topic đang phụ thuộc) và gợi ý chuyển bài viết sang danh mục khác hoặc đặt `isActive: false` để ẩn khỏi Sidebar.
   - **Xóa Topic/Tag:** Nếu có bài viết đang gắn `topicId` đó, gỡ `topicId` ra khỏi mảng `topicIds` của các bài viết (hoặc cảnh báo Admin xác nhận trước khi gỡ).
4. **Sắp xếp thứ tự hiển thị:**
   - Admin có thể thay đổi `order` của Category và Topic (nút lên/xuống hoặc drag-drop) để quyết định thứ tự xuất hiện trên Sidebar.

---

## 2. Đặc Tả API Contract (`/api/admin/orientation/*`)

### 2.1 Category Management
- `GET /api/admin/orientation/categories`: Lấy tất cả Categories (kèm đếm số Topics & số Bài viết mỗi Category).
- `POST /api/admin/orientation/categories`: Tạo Category mới (`name`, `slug`, `description`, `order`, `isActive`).
- `PATCH /api/admin/orientation/categories/[id]`: Cập nhật tên, slug, thứ tự, trạng thái `isActive`.
- `DELETE /api/admin/orientation/categories/[id]`: Xóa Category (chặn nếu còn bài viết hoặc topic con).

### 2.2 Topic/Tag Management
- `GET /api/admin/orientation/topics?categoryId=...`: Lấy danh sách Topics (lọc theo Category cha, kèm số lượng bài viết gắn topic).
- `POST /api/admin/orientation/topics`: Tạo Topic/Tag con thuộc một `categoryId` (`categoryId`, `name`, `slug`, `description`, `order`, `isActive`).
- `PATCH /api/admin/orientation/topics/[id]`: Sửa tên, chuyển Category cha (nếu cần), đổi `order`, bật/tắt `isActive`.
- `DELETE /api/admin/orientation/topics/[id]`: Xóa Topic và dọn tham chiếu trong `OrientationArticle.topicIds`.

---

## 3. Tiêu Chí Chấp Thuận (Acceptance Criteria)

- **AC-01 (Sidebar Sync - Category):** *Given* Admin tạo Category mới `"Kỹ năng nghiên cứu"` với `isActive: true`, *Then* trên Sidebar của sinh viên dưới mục "Khám phá định hướng" xuất hiện mục `"Kỹ năng nghiên cứu"` trỏ về `/explore?category=ky-nang-nghien-cuu`.
- **AC-02 (Sidebar Sync - Topic/Tag):** *Given* Admin thêm Topic `"Trí tuệ nhân tạo"` thuộc Category `"Khối ngành"`, *Then* dưới `"Khối ngành"` trên Sidebar xuất hiện mục con `"· Trí tuệ nhân tạo"` trỏ về `/explore?category=khoi-nganh&topic=tri-tue-nhan-tao`.
- **AC-03 (Ẩn danh mục):** *Given* Admin chuyển `isActive = false` cho một Category hoặc Topic, *Then* mục đó biến mất khỏi Sidebar của sinh viên nhưng không xóa mất bài viết cũ trong CMS.
- **AC-04 (Bảo vệ ràng buộc xóa):** *Given* một Category đang có 5 bài viết thuộc về nó, *When* Admin nhấn Xóa Category, *Then* hệ thống từ chối (`409`) và thông báo số bài viết đang sử dụng.

