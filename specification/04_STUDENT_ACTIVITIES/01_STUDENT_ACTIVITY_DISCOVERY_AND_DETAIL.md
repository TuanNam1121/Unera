# ACT-01: Hiển Thị, Tìm Kiếm, Chi Tiết & Trạng Thái Hoạt Động Sinh Viên (SA01–SA04, SA08)

> **Module:** `04_STUDENT_ACTIVITIES`  
> **Feature IDs:** `SA01` (Activity Listing), `SA02` (Activity Categories), `SA03` (Search & Filter), `SA04` (Activity Detail), `SA08` (Activity Status).  
> **Tác nhân:** Visitor, Student.

---

## 1. Quy Tắc Nghiệp Vụ Từng Feature ID

### `SA01` — Activity Listing (`/activities`)
- Hiển thị lưới thẻ các hoạt động sinh viên có `publishStatus === "PUBLISHED"`.
- Mỗi thẻ hiển thị đầy đủ thông tin quét nhanh:
  1. Badge Danh mục (`NCKH`, `Học bổng`, `Thực tập`, `Cuộc thi`, `Hội thảo`...)
  2. Badge **Trạng thái (`SA08`)**
  3. Tiêu đề hoạt động & Đơn vị tổ chức
  4. **Hạn chót (`deadline`)** + Đếm ngược (`Còn 5 ngày`, `Sắp hết hạn`, `Đã hết hạn`)
  5. **Ngày diễn ra (`eventDate`)** (nếu có)
  6. Nút **"Quan tâm" / "Đã quan tâm"** (`SA05` / `SA06`) và số lượt đang quan tâm (`followerCount`).

### `SA02` — Activity Categories
- Thanh filter ngang (Filter Pills) + đồng bộ query param từ Sidebar (`/activities?type=nckh`, `hoc-bong`, `thuc-tap`, `cuoc-thi`, `hoi-thao`...).
- Danh sách categories lấy động từ `activity_categories` (`isActive: true`, sort theo `order`).

### `SA03` — Search & Filter
- **Tìm kiếm (`q`):** Tìm theo tiêu đề, mô tả ngắn, đơn vị tổ chức.
- **Bộ lọc đa chiều:**
  - Theo Danh mục (`categorySlug`)
  - Theo Trạng thái hoạt động (`activityStatus`: Đang mở đơn, Sắp hết hạn [<= 7 ngày], Sắp diễn ra, Đã đóng)
  - Theo Phạm vi (`isDomestic`: Tất cả / Trong nước / Quốc tế)
  - Sắp xếp (`sort`: `deadline_asc` [Hạn gần nhất trước], `event_asc` [Sắp diễn ra], `popular` [Nhiều người quan tâm], `newest` [Mới đăng]).
- Phân trang (`page`, `limit = 12`).

### `SA04` — Activity Detail (`/activities/[slug]` hoặc `/activities/[id]`)
- Bố cục 2 cột chuẩn [`UI_UX_DESIGN_SYSTEM.md`](file:///c:/Users/AD/OneDrive/Desktop/Project/ULIS_DMST_2026/UI_UX_DESIGN_SYSTEM.md):
  - **Cột trái:** Tiêu đề, Đơn vị tổ chức, Trạng thái, Nội dung chi tiết (Mô tả chương trình, Điều kiện tham gia, Quyền lợi, Cách thức ứng tuyển, Nguồn thông tin).
  - **Cột phải (Sticky Action Card):**
    - Hiển thị rõ **Deadline đăng ký** (`dd/MM/yyyy HH:mm`) và **Ngày diễn ra chương trình** (`dd/MM/yyyy HH:mm`).
    - Nút nổi bật **"Quan tâm cơ hội này"** / **"Đang quan tâm ✓ (Bấm để hủy)"** kèm chú thích tự động nhận thông báo mốc 1 tháng, 1 tuần, 1 ngày.
    - Nút **"Truy cập trang đăng ký chính thức"** (`registrationUrl` mở tab mới `rel="noopener noreferrer"`).

### `SA08` — Activity Status (Tính toán Trạng thái Động)
Hàm chuẩn hóa `computeActivityStatus(activity, now)` tính trạng thái hiển thị thống nhất giữa Server & Client:
1. Nếu `manualClosed === true`: `"CLOSED"` (**Đã đóng** — xám).
2. Nếu `deadline && deadline < now` và (`!eventDate || eventDate < now`): `"EXPIRED"` (**Đã kết thúc** — xám).
3. Nếu `openingDate && openingDate > now`: `"UPCOMING_OPEN"` (**Sắp mở đơn** — xanh nhạt).
4. Nếu `deadline && deadline >= now && (deadline - now) <= 7 ngày`: `"CLOSING_SOON"` (**Sắp hết hạn** — đỏ/cam cảnh báo).
5. Nếu `eventDate && eventDate >= now && (eventDate - now) <= 7 ngày` (khi deadline đã qua hoặc không có deadline): `"EVENT_SOON"` (**Sắp diễn ra** — tím/xanh ngọc).
6. Ngược lại: `"OPEN"` (**Đang mở** — xanh lá).

---

## 2. Đặc Tả API Contract

### `GET /api/activities`
- **Query:** `tab=all|followed`, `category`, `q`, `status`, `isDomestic`, `sort`, `page`, `limit`.
- **Response `200 OK`:** Trả `items` (kèm `computedStatus`, `isFollowedByMe`), `categories`, `pagination`.

### `GET /api/activities/[idOrSlug]`
- Tăng `viewCount`, trả chi tiết hoạt động (`publishStatus === "PUBLISHED"`), `computedStatus`, `isFollowedByMe`, và tối đa 3 hoạt động liên quan cùng danh mục.

---

## 3. Tiêu Chí Chấp Thuận

- **AC-01 (`SA01`, `SA02`, `SA03`):** Sinh viên lọc theo danh mục `"Học bổng"`, nhập từ khóa tìm kiếm và chọn sắp xếp theo hạn gần nhất → danh sách trả về đúng hoạt động khớp điều kiện và chỉ gồm bản ghi `PUBLISHED`.
- **AC-02 (`SA04`, `SA08`):** Hoạt động có `deadline` còn 3 ngày tự động hiển thị badge `"Sắp hết hạn"`, hiện đầy đủ ngày deadline và ngày diễn ra tại trang chi tiết.

