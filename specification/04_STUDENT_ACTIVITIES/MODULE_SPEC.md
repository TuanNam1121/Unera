# Module 04: Hoạt Động Sinh Viên (Student Activities — SA01 đến SA19)

> **Mã Module:** `STUDENT_ACTIVITIES`  
> **Yêu cầu liên quan:** `SA01`–`SA19` (NCKH, Học bổng, Thực tập, Cuộc thi, Hội thảo..., có Deadline & Ngày diễn ra, nút Quan tâm, Tab Cơ hội đã quan tâm, Nhắc nhở trước mốc 1 tháng / 1 tuần / sắp đến ngày diễn ra, Admin CMS & Thống kê).  
> **Trạng thái hiện tại:** Route `/activities` chưa tồn tại trong `src/app`. Cần xây dựng mới `/activities` (kế thừa/chuyển hóa khái niệm dữ liệu từ `Opportunity` sang `StudentActivity` chuyên biệt có `deadline` + `eventDate` + `ActivityFollow`).  
> **Tác nhân:** Student (`SA01`–`SA12`), Admin (`SA13`–`SA19`).

---

## 1. Tổng Quan Nghiệp Vụ & Liên Thông Hệ Thống

1. **Đối tượng nội dung:** Các chương trình dành cho sinh viên: **NCKH**, **Chương trình học bổng**, **Chương trình thực tập**, **Cuộc thi**, **Hội thảo**, **Management Trainee**, **Đại sứ sinh viên**...
2. **2 Mốc Thời Gian Quan Trọng Trên Mỗi Hoạt Động:**
   - **`deadline` (Hạn chót đăng ký/nộp hồ sơ):** Phục vụ nhắc nhở `SA09` / `OP09` (trước **1 tháng [30 ngày]**, **1 tuần [7 ngày]**, **1 ngày**).
   - **`eventDate` (Ngày diễn ra chương trình / sự kiện):** Phục vụ nhắc nhở `SA10` / `OP10` (trước **1 tháng [30 ngày]**, **1 tuần [7 ngày]**, **1 ngày / sắp diễn ra**).
3. **Luồng Quan Tâm (`Follow`) & Tab "Cơ hội đã quan tâm":**
   - Sinh viên bấm nút **"Quan tâm"** (`SA05`) tại danh sách hoặc trang chi tiết → Lưu vào `activity_follows` và tăng `followerCount`.
   - Giao diện `/activities` có tab riêng **"Cơ hội đã quan tâm"** (`SA07`) để sinh viên theo dõi tất cả chương trình đã follow cùng bộ đếm ngược deadline/ngày diễn ra.
   - Khi hủy quan tâm (`SA06`), xóa khỏi danh sách quan tâm và ngừng các nhắc nhở tương lai cho hoạt động đó (giữ nguyên lịch sử thông báo đã gửi trước đó).

---

## 2. Mô Hình Dữ Liệu (MongoDB / Mongoose)

### 2.1 `activity_categories` (`SA02`, `SA17`)
| Trường | Kiểu | Bắt buộc | Mô tả |
|---|---|---|---|
| `name` | `String` | Có | VD: `"NCKH"`, `"Học bổng"`, `"Thực tập"`, `"Cuộc thi"`, `"Hội thảo"` |
| `slug` | `String` | Có | Unique slug (`nckh`, `hoc-bong`, `thuc-tap`, `cuoc-thi`, `hoi-thao`) |
| `description` | `String` | Không | Mô tả danh mục |
| `colorToken` | `String` | Không | Màu pastel badge chuẩn UI (`blue`, `emerald`, `purple`, `rose`, `amber`, `cyan`) |
| `order` | `Number` | Có | Thứ tự hiển thị trên Sidebar/Filter |
| `isActive` | `Boolean` | Có | Mặc định `true` |

### 2.2 `student_activities` (`SA01`–`SA04`, `SA08`, `SA13`–`SA18`)
| Trường | Kiểu | Bắt buộc | Mô tả |
|---|---|---|---|
| `title` | `String` | Có | Tên hoạt động / chương trình (text index) |
| `slug` | `String` | Có | Unique slug |
| `summary` | `String` | Có | Mô tả ngắn |
| `description` | `String` | Có | Chi tiết thể lệ, quyền lợi, điều kiện, hướng dẫn tham gia |
| `categoryId` | `ObjectId` | Có | Ref `activity_categories._id`, index |
| `organizer` | `String` | Không | Đơn vị tổ chức / Cấp học bổng |
| `location` | `String` | Không | Địa điểm / Hình thức (Online / Hà Nội / TP.HCM / Quốc tế) |
| `isDomestic` | `Boolean` | Có | Trong nước (`true`) / Quốc tế (`false`) |
| `openingDate` | `Date` | Không | Ngày mở đơn |
| `deadline` | `Date` | Không | Hạn chót nộp đơn (`SA18`), index |
| `eventDate` | `Date` | Không | Ngày diễn ra chương trình (`SA18`), index |
| `eventEndDate` | `Date` | Không | Ngày kết thúc sự kiện (tùy chọn) |
| `registrationUrl` | `String` | Không | Link đăng ký ngoài hoặc nguồn chính thức |
| `sourceName` | `String` | Không | Tên nguồn kiểm chứng |
| `coverImage` | `String` | Không | Ảnh bìa |
| `publishStatus` | `Enum` | Có | `"DRAFT"` \| `"PUBLISHED"` \| `"UNPUBLISHED"` (`SA16`) |
| `manualClosed` | `Boolean` | Có | Admin chủ động đóng sớm (`SA08`) |
| `followerCount` | `Number` | Có | Số lượt quan tâm (`SA19`), mặc định `0` |
| `viewCount` | `Number` | Có | Lượt xem chi tiết, mặc định `0` |
| `version` | `Number` | Có | Optimistic locking version khi Admin sửa (`SA14`) |
| `updatedByAdminId` | `ObjectId` | Không | Admin chỉnh sửa gần nhất |

### 2.3 `activity_follows` (`SA05`–`SA07`, `SA19`)
| Trường | Kiểu | Bắt buộc | Mô tả |
|---|---|---|---|
| `studentId` | `ObjectId` | Có | Ref `users._id`, index |
| `activityId` | `ObjectId` | Có | Ref `student_activities._id`, index |
| `followedAt` | `Date` | Có | Thời điểm bấm Quan tâm |
| `notifyDeadline` | `Boolean` | Có | Mặc định `true` |
| `notifyEvent` | `Boolean` | Có | Mặc định `true` |
- **Unique Compound Index:** `{ studentId: 1, activityId: 1 }`.

---

## 3. Danh Sách Đặc Tả Chi Tiết

| Mã | Tính năng bao phủ | Tệp |
|---|---|---|
| `ACT-01` | `SA01`, `SA02`, `SA03`, `SA04`, `SA08` (Listing, Categories, Search/Filter, Detail, Status) | [`01_STUDENT_ACTIVITY_DISCOVERY_AND_DETAIL.md`](./01_STUDENT_ACTIVITY_DISCOVERY_AND_DETAIL.md) |
| `ACT-02` | `SA05`, `SA06`, `SA07` (Follow, Unfollow, Tab Cơ hội đã quan tâm) | [`02_STUDENT_FOLLOW_AND_FOLLOWED_TAB.md`](./02_STUDENT_FOLLOW_AND_FOLLOWED_TAB.md) |
| `ACT-03` | `SA09`, `SA10`, `SA11`, `SA12` (Nhắc nhở Deadline/Event & Liên kết Thông báo) | [`03_ACTIVITY_REMINDERS_AND_NOTIFICATIONS.md`](./03_ACTIVITY_REMINDERS_AND_NOTIFICATIONS.md) |
| `ACT-04` | `SA13`–`SA19` (Admin CMS, Category, Deadline/Event & Statistics) | [`04_ADMIN_ACTIVITY_CMS_AND_STATISTICS.md`](./04_ADMIN_ACTIVITY_CMS_AND_STATISTICS.md) |

