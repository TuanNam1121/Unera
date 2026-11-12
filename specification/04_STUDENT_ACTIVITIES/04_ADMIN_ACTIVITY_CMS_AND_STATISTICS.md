# ACT-04: Admin CMS — Quản Lý Hoạt Động, Danh Mục, Mốc Thời Gian & Thống Kê (SA13–SA19)

> **Module:** `04_STUDENT_ACTIVITIES`  
> **Feature IDs:** `SA13` (Create Activity), `SA14` (Edit Activity), `SA15` (Delete Activity), `SA16` (Publish / Unpublish), `SA17` (Activity Category Management), `SA18` (Deadline & Event Management), `SA19` (Activity Statistics).  
> **Tác nhân:** Admin (`role === "ADMIN"`).

---

## 1. Quy Tắc Nghiệp Vụ Từng Feature ID (`/admin/activities`)

### `SA13` — Create Activity & `SA18` — Deadline & Event Management
- Form tạo mới tại `/admin/activities/new`:
  - Thông tin cơ bản: Tiêu đề, Slug, Danh mục (`categoryId`), Mô tả ngắn, Nội dung chi tiết, Đơn vị tổ chức, Địa điểm, Trong nước/Quốc tế, Link đăng ký chính thức, Ảnh bìa.
  - **Quản lý Mốc Thời Gian (`SA18`):**
    - Ngày mở đơn (`openingDate` - tùy chọn)
    - **Hạn chót đăng ký (`deadline` - date/time picker)**
    - **Ngày diễn ra chương trình (`eventDate` - date/time picker)** và Ngày kết thúc (`eventEndDate` - tùy chọn).
    - *Validation thời gian:* Nếu cả `openingDate` và `deadline` đều có → `deadline >= openingDate`. Nếu có `eventEndDate` → `eventEndDate >= eventDate`.
  - Trạng thái xuất bản khởi tạo: `DRAFT` hoặc `PUBLISHED`.

### `SA14` — Edit Activity (Kèm Optimistic Locking)
- Chỉnh sửa toàn bộ thông tin hoạt động tại `/admin/activities/[id]/edit`.
- **Kiểm soát xung đột đồng thời:** Giữ cơ chế `version` như `Opportunity` hiện tại. Khi 2 Admin sửa cùng 1 hoạt động, nếu `version` gửi lên khác DB → trả `409 Conflict` để tránh ghi đè nhầm.
- **Lưu ý khi đổi `deadline` hoặc `eventDate`:** Khi Admin gia hạn deadline hoặc đổi ngày diễn ra, hệ thống vẫn đảm bảo Scheduler ở Module 06 dùng khóa duy nhất theo `(recipientId, activityId, reminderType, reminderOffsetDays, targetDateKey)` để nhắc lại đúng theo ngày mới nếu cần!

### `SA15` — Delete Activity
- Xóa hoạt động trong CMS (hiển thị modal xác nhận kèm cảnh báo nếu đang có `followerCount > 0`).
- Dọn dẹp `ActivityFollow` liên quan và ghi `AuditLog`.

### `SA16` — Publish / Unpublish
- Chuyển đổi trạng thái giữa `PUBLISHED` (hiển thị cho sinh viên) và `UNPUBLISHED` / `DRAFT` (ẩn khỏi sinh viên), cùng tùy chọn `manualClosed` (đóng nhận đơn sớm).

### `SA17` — Activity Category Management (`/admin/activities/categories`)
- Tạo, sửa tên/màu badge/thứ tự, ẩn/hiện, xóa danh mục hoạt động (`NCKH`, `Học bổng`, `Thực tập`, `Cuộc thi`, `Hội thảo`...).
- Chặn xóa cứng danh mục đang có hoạt động liên kết (`409 Conflict`).

### `SA19` — Activity Statistics (`/admin/activities/statistics`)
- Bảng điều khiển thống kê trực quan cho Admin:
  1. **KPI Cards:** Tổng số hoạt động đang mở, Tổng lượt quan tâm toàn hệ thống, Số hoạt động sắp hết hạn trong 7 ngày, Tỷ lệ hoạt động theo trạng thái.
  2. **Top Hoạt Động Được Quan Tâm Nhất:** Bảng/biểu đồ xếp hạng theo `followerCount` & `viewCount` + tỷ lệ chuyển đổi (Follow / View).
  3. **Phân bổ Lượt Quan Tâm Theo Danh Mục:** Biểu đồ cột/tròn thể hiện mức độ quan tâm của sinh viên theo từng nhóm (`NCKH`, `Học bổng`, `Thực tập`, `Cuộc thi`...).
  4. Bộ lọc khoảng thời gian & Xuất dữ liệu danh sách cơ bản (tùy chọn).

---

## 2. Đặc Tả API Contract (`/api/admin/activities/*`)

Tất cả endpoint yêu cầu `requireAdmin()` + ghi `AuditLog`.

| Method | Endpoint | Feature ID | Mô tả |
|---|---|---|---|
| `GET` | `/api/admin/activities` | `SA13`–`SA18` | Danh sách hoạt động CMS (filter `q`, `categoryId`, `publishStatus`, `hasUpcomingDeadline`, `page`) |
| `POST` | `/api/admin/activities` | `SA13`, `SA18` | Tạo hoạt động mới |
| `GET` | `/api/admin/activities/[id]` | `SA14` | Lấy chi tiết hoạt động kèm `version` |
| `PATCH` | `/api/admin/activities/[id]` | `SA14`, `SA16`, `SA18` | Cập nhật nội dung (check `version`), đổi `publishStatus`, đổi `deadline`/`eventDate` |
| `DELETE` | `/api/admin/activities/[id]` | `SA15` | Xóa hoạt động & dọn `ActivityFollow` |
| `GET/POST` | `/api/admin/activities/categories` | `SA17` | Lấy danh sách / Tạo danh mục hoạt động |
| `PATCH/DELETE` | `/api/admin/activities/categories/[id]` | `SA17` | Sửa / Xóa danh mục hoạt động |
| `GET` | `/api/admin/activities/statistics` | `SA19` | Dữ liệu thống kê lượt quan tâm, top hoạt động, phân bổ theo danh mục |

---

## 3. Tiêu Chí Chấp Thuận

- **AC-01 (`SA13`, `SA16`, `SA18`):** Admin tạo hoạt động `"NCKH Sinh viên ULIS 2026"` với `deadline` và `eventDate`, chọn Xuất bản → hoạt động hiển thị ngay trên `/activities` với đúng 2 mốc ngày.
- **AC-02 (`SA14` Concurrent Check):** 2 Admin mở cùng hoạt động `version = 1`. Admin A lưu thành công (`version = 2`). Admin B lưu với `version = 1` → nhận `409 Conflict` và cảnh báo tải lại dữ liệu mới.
- **AC-03 (`SA19`):** Sau khi 3 sinh viên bấm Quan tâm vào 1 hoạt động, trang `/admin/activities/statistics` hiển thị chính xác `followerCount = 3` và tổng hợp đúng theo danh mục.

