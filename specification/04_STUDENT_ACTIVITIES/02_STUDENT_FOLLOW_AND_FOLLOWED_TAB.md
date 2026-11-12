# ACT-02: Quan Tâm Hoạt Động & Tab "Cơ Hội Đã Quan Tâm" (SA05–SA07)

> **Module:** `04_STUDENT_ACTIVITIES`  
> **Feature IDs:** `SA05` (Follow Activity), `SA06` (Unfollow Activity), `SA07` (Followed Activities — Tab "Cơ hội đã quan tâm").  
> **Tác nhân:** Student (đã đăng nhập).

---

## 1. Quy Tắc Nghiệp Vụ (Business Rules)

1. **`SA05` — Follow Activity (Quan tâm hoạt động):**
   - Yêu cầu đăng nhập (`ACTIVE`). Nếu chưa đăng nhập → chuyển hướng `/login?callbackUrl=/activities`.
   - Khi bấm nút **"Quan tâm"** trên thẻ hoạt động hoặc trang chi tiết:
     - Tạo bản ghi `ActivityFollow` (`{ studentId, activityId, notifyDeadline: true, notifyEvent: true }`).
     - Dùng unique index `{ studentId: 1, activityId: 1 }` để **ngăn trùng lặp** nếu user bấm liên tiếp (idempotent).
     - Tăng `StudentActivity.followerCount` thêm `1` (chỉ khi tạo mới bản ghi thành công).
     - Hiển thị toast xác nhận: *"Đã thêm vào Cơ hội đã quan tâm! Hệ thống sẽ nhắc bạn trước các mốc 1 tháng, 1 tuần và 1 ngày."*
2. **`SA06` — Unfollow Activity (Hủy quan tâm):**
   - Khi bấm **"Đang quan tâm"** / **"Hủy quan tâm"**:
     - Xóa bản ghi `ActivityFollow` tương ứng của sinh viên hiện tại.
     - Giảm `StudentActivity.followerCount` đi `1` (đảm bảo `>= 0`).
     - **Dừng toàn bộ nhắc nhở tương lai** cho hoạt động này (`SA09`, `SA10`).
     - **Bảo toàn lịch sử:** Các thông báo đã từng gửi trước đó trong `notifications` vẫn được giữ lại.
3. **`SA07` — Followed Activities (Tab "Cơ hội đã quan tâm"):**
   - Ngay đầu trang `/activities` có 2 Tab chuyển đổi rõ ràng:
     - Tab 1: **Tất cả hoạt động**
     - Tab 2: **Cơ hội đã quan tâm** (kèm badge số lượng hoạt động đang quan tâm, VD: `Cơ hội đã quan tâm (5)`).
   - Tại Tab **Cơ hội đã quan tâm**:
     - Hiển thị toàn bộ hoạt động mà sinh viên đang follow (mặc định sắp xếp theo mốc deadline/sự kiện sắp tới gần nhất ở trên cùng).
     - Hiển thị rõ **Timeline đếm ngược** của từng hoạt động: ngày Deadline, ngày Diễn ra, và trạng thái nhắc nhở sắp tới (VD: *"Nhắc trước 1 tuần vào 15/11"*).
     - Cho phép lọc theo danh mục hoặc hủy quan tâm trực tiếp ngay trên tab này.

---

## 2. Đặc Tả API Contract

### `POST /api/activities/[id]/follow`
- **Auth:** `requireAuth()`.
- **Xử lý:** Kiểm tra activity tồn tại (`publishStatus === "PUBLISHED"`). Upsert/Insert `ActivityFollow`. Nếu tạo mới thì `$inc: { followerCount: 1 }`.
- **Response `200/201`:** `{ success: true, followed: true, followerCount: 25 }`.

### `DELETE /api/activities/[id]/follow`
- **Auth:** `requireAuth()`.
- **Xử lý:** `ActivityFollow.findOneAndDelete({ studentId: authUser.id, activityId: id })`. Nếu có bản ghi bị xóa thì `$inc: { followerCount: -1 }`.
- **Response `200 OK`:** `{ success: true, followed: false, followerCount: 24 }`.

### `GET /api/activities/followed` (hoặc `GET /api/activities?tab=followed`)
- **Auth:** `requireAuth()`.
- Trả danh sách hoạt động sinh viên hiện tại đã follow, populate đầy đủ `categoryId`, `deadline`, `eventDate`, `computedStatus`, `followedAt`.

---

## 3. Tiêu Chí Chấp Thuận

- **AC-01 (`SA05`, `SA07`):** *Given* sinh viên bấm nút "Quan tâm" tại hoạt động "Học bổng Vingroup 2026", *When* chuyển sang tab **"Cơ hội đã quan tâm"**, *Then* hoạt động xuất hiện trong tab này với thông tin deadline, ngày diễn ra và số badge tab tăng lên `1`.
- **AC-02 (`SA06`):** *Given* sinh viên đang quan tâm một hoạt động, *When* bấm "Hủy quan tâm", *Then* hoạt động biến mất khỏi tab "Cơ hội đã quan tâm", `followerCount` giảm `1`, và job nhắc nhở sau đó sẽ không gửi thông báo cho sinh viên về hoạt động này nữa.
- **AC-03 (Idempotency):** *Given* sinh viên gửi `POST /follow` 2 lần liên tiếp, *Then* chỉ có 1 bản ghi `ActivityFollow` và `followerCount` chỉ tăng đúng `1`.

