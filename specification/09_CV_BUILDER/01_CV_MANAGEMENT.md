# CV-01: Quản Lý CV (CV Management)

> **Module:** `09_CV_BUILDER`  
> **Route chính:** `/tools/cv-builder`  
> **Mục tiêu:** Cho phép sinh viên tạo mới, xem danh sách, chỉnh sửa, đổi tên, nhân bản, xóa CV và tận dụng sẵn dữ liệu từ **Hồ sơ cá nhân (`StudentProfile`)** để khởi tạo CV nhanh chỉ với 1 lần nhấn.

---

## 1. Luồng Nghiệp Vụ & Trải Nghiệm Người Dùng

```text
[Sidebar: "CV chuẩn ATS" (/tools/cv-builder)]
        │
        ├── Chưa có CV nào ──▶ Empty State + 3 nút hành động:
        │     1. "Tạo CV từ Hồ sơ cá nhân" (Pre-fill StudentProfile)
        │     2. "Chọn từ Thư viện Mẫu CV" (/tools/cv-builder/templates)
        │     3. "Tạo CV trống nhanh" (mẫu Minimalist ATS mặc định)
        │
        └── Đã có CV ──▶ Dashboard Danh sách CV (Grid 3–4 thẻ/hàng responsive)
              ├── Tìm kiếm theo tên CV / vị trí mục tiêu
              ├── Lọc theo Template / Trạng thái chia sẻ (Công khai / Riêng tư)
              └── Thao tác trên từng thẻ CV:
                    ├── Nhấn thẻ / "Chỉnh sửa" ──▶ /tools/cv-builder/[id]
                    ├── "Đổi tên" (Inline edit hoặc Modal) ──▶ PATCH /api/cv/[id]
                    ├── "Nhân bản" ──▶ POST /api/cv/[id]/duplicate
                    ├── "Tải PDF nhanh" / "Chia sẻ"
                    └── "Xóa" (Confirm Dialog) ──▶ DELETE /api/cv/[id]
```

---

## 2. Yêu Cầu Chi Tiết Từng Tính Năng

### 2.1 Tạo CV Mới (`POST /api/cv`)
1. **Modal "Tạo CV mới"** gồm các lựa chọn:
   - **Tên CV** *(bắt buộc, 2–120 ký tự)* — VD: `"CV Thực tập Marketing - 2026"`.
   - **Vị trí ứng tuyển mục tiêu** *(tùy chọn, tối đa 120 ký tự)* — VD: `"Marketing Intern"`.
   - **Ngôn ngữ hiển thị nhãn section**: Tiếng Việt (`"vi"`) hoặc Tiếng Anh (`"en"`).
   - **Mẫu CV khởi tạo (`templateId`)**: Mặc định `"ats-minimal-classic"` hoặc chọn trực tiếp từ picker rút gọn / chuyển từ `/tools/cv-builder/templates?select=...`.
   - **Toggle *"Tự động điền từ Hồ sơ cá nhân UNERA"* (`prefillFromProfile`, mặc định `true`)**:
     - Map từ `StudentProfile` + `User`:
       - `personalInfo.fullName` ← `profile.fullName || user.name`
       - `personalInfo.email` ← `user.email`
       - `personalInfo.avatarUrl` ← `profile.avatar || user.avatar || ""`
       - `summary` ← `profile.bio || ""`
       - `education[0]` ← `{ school: profile.university, major: profile.major, degree: "Cử nhân", ... }` *(chỉ tạo khi `university` hoặc `major` có dữ liệu)*
       - `skills` ← lấy đầy đủ danh sách chuỗi từ `profile.hardSkills`, `profile.softSkills` và `profile.skills` (dùng [`resolveCategorizedSkills`](file:///c:/Users/AD/OneDrive/Desktop/Project/ULIS_DMST_2026/src/lib/profile-skills.ts#L53) kết hợp đối chiếu chống trùng lặp không phân biệt hoa/thường để giữ lại mọi phần tử còn dư trong `profile.skills` vào nhóm *"Kỹ năng khác"*):
         - Nhóm **Kỹ năng chuyên môn**: toàn bộ item trong `hardSkills`
         - Nhóm **Kỹ năng mềm**: toàn bộ item trong `softSkills`
         - Nhóm **Kỹ năng khác** *(chỉ tạo khi có item dư)*: các chuỗi trong `profile.skills` chưa xuất hiện ở 2 nhóm trên
       - `achievements` ← map từng chuỗi trong `profile.achievements` (`string[]`) thành `{ id, title, year, issuer: "", description: "" }`:
         - Tự động tách gợi ý năm 4 chữ số (regex `\b(19\d{2}|20\d{2})\b`) nếu có sẵn trong chuỗi (VD: `"Giải Nhì NCKH Sinh viên 2025"` → gợi ý `year = 2025`; nếu không có thì để `year = null`).
         - Trong **Modal Tạo CV**, khi `prefillFromProfile = true` và user có thành tích/kỹ năng trong hồ sơ: hiển thị tóm tắt số lượng kỹ năng sẽ điền kèm **danh sách Thành tích cho phép sinh viên gõ/chọn nhanh thông tin `Năm` (`year`) ngay trước khi bấm Tạo CV** (hoặc bỏ trống để điền tiếp trong CV Editor). Client gửi kèm `achievementYearsOverride` (nếu có) trong payload `POST /api/cv`.
2. **Giới hạn an toàn số lượng CV:**
   - Mỗi tài khoản cho phép tối đa **30 CV** (tránh spam/tăng dung lượng DB bất thường); trả HTTP `400` với thông báo rõ ràng nếu vượt ngưỡng.

### 2.2 Xem Danh Sách & Hiển Thị Thẻ CV (`GET /api/cv`)
- Giao diện full-width (`w-full px-3 sm:px-4 lg:px-5`), hiển thị lưới thẻ `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4`.
- Mỗi thẻ **CV Card** hiển thị:
  - Thumbnail xem trước thu nhỏ (mini preview layout hoặc card đại diện màu & tên template).
  - Tên CV + vị trí mục tiêu (`targetRole`).
  - Badge tên mẫu CV (VD: `Minimalist ATS`), ngôn ngữ (`VI`/`EN`).
  - Badge trạng thái chia sẻ (`Công khai · X lượt xem` hoặc `Riêng tư`).
  - Thời gian chỉnh sửa gần nhất (relative time: `"Cập nhật 5 phút trước"`).
  - Menu hành động nhanh (`Chỉnh sửa`, `Đổi tên`, `Nhân bản`, `Chia sẻ`, `Xóa`).

### 2.3 Đặt Tên & Đổi Tên CV (`PATCH /api/cv/[id]`)
- Hỗ trợ đổi tên nhanh ngay trên danh sách (bấm icon bút chì hoặc chọn *Đổi tên* trong menu) và trực tiếp trên thanh Topbar của **CV Editor** (`/tools/cv-builder/[id]`).
- Kiểm tra Zod (`title.trim().min(2).max(120)`). Không dùng tên rỗng.

### 2.4 Nhân Bản CV (`POST /api/cv/[id]/duplicate`)
- Phục vụ nhu cầu tạo nhiều phiên bản CV cho từng công ty / vị trí ứng tuyển khác nhau mà không cần nhập lại từ đầu.
- Quy tắc Server:
  - Kiểm tra quyền sở hữu (`existing.userId.toString() === currentUser.id`) và giới hạn tối đa 30 CV.
  - Sao chép toàn bộ nội dung sections, `sectionOrder`, `hiddenSections`, `templateId`, `styleConfig`, `locale`.
  - Gán `title` mới: `"<Tên CV gốc> (Bản sao)"` (cắt gọn nếu vượt 120 ký tự).
  - **Reset trạng thái chia sẻ**: `sharing = { isPublic: false, shareSlug: null, sharedAt: null, viewCount: 0, allowPdfDownload: true }` để tránh vô tình public bản sao chưa chỉnh sửa.
  - Reset `version = 1`.

### 2.5 Xóa CV (`DELETE /api/cv/[id]`)
- Yêu cầu xác nhận qua Confirm Dialog hiển thị tên CV và cảnh báo nếu CV đó đang ở trạng thái **Công khai** (`"Đường dẫn chia sẻ /cv/... cũng sẽ ngừng hoạt động ngay lập tức."`).
- Server xác thực chủ sở hữu (`{ _id: id, userId: currentUser.id }`) trước khi xóa cứng bản ghi `CvDocument`.

---

## 3. Quy Tắc Bảo Mật & Kiểm Tra Toàn Vẹn

- **IDOR Prevention:** Mọi endpoint `/api/cv` và `/api/cv/[id]*` bắt buộc dùng `requireAuth(req)` từ [`src/lib/session.ts`](file:///c:/Users/AD/OneDrive/Desktop/Project/ULIS_DMST_2026/src/lib/session.ts) và luôn lọc truy vấn theo `userId: new Types.ObjectId(authUser.id)`. Không bao giờ nhận `userId` từ body/query.
- **Validation Error Formatting:** Trả về JSON `{ error, details }` theo chuẩn Zod để UI hiển thị lỗi cụ thể theo từng trường.

