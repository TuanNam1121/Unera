# Module 02: Student Profile — Hồ Sơ Cá Nhân Sinh Viên

> **Mã Module:** `PROFILE`  
> **Trạng thái hiện tại:** Đã có [`src/app/profile/page.tsx`](file:///c:/Users/AD/OneDrive/Desktop/Project/ULIS_DMST_2026/src/app/profile/page.tsx), [`src/models/StudentProfile.ts`](file:///c:/Users/AD/OneDrive/Desktop/Project/ULIS_DMST_2026/src/models/StudentProfile.ts) và [`src/app/api/profile/route.ts`](file:///c:/Users/AD/OneDrive/Desktop/Project/ULIS_DMST_2026/src/app/api/profile/route.ts) với tab Kỹ năng & Bảng vàng thành tích — **Cần nâng cấp** thêm `birthYear`, chọn `university` từ danh sách có sẵn, phân tách/hiển thị rõ Kỹ năng chuyên môn & Kỹ năng mềm, và bổ sung tab **Lộ trình cá nhân**.  
> **Tác nhân:** Student (chủ sở hữu hồ sơ), Admin (chỉ xem quản trị nếu cần).

---

## 1. Tổng Quan Nghiệp Vụ

Trang `/profile` là trung tâm quản lý danh tính học thuật và thành tựu của sinh viên, đồng thời là nguồn dữ liệu đầu vào quan trọng cho **AI Orientation Engine (`AI01`–`AI11`)** và **Personalized Roadmap (`RM01`–`RM14`)** ở Module 8.

1. **View My Profile & Update My Profile:** Sinh viên xem và chỉnh sửa các trường thông tin cơ bản: Họ và tên, Năm sinh, Sinh viên năm mấy, Trường đại học (chọn từ danh sách chuẩn hóa), Chuyên ngành (tự điền), Tiểu sử và định hướng ngắn.
2. **Cấu trúc Tab trong Hồ sơ cá nhân (`/profile`):**
   - **Tab 1: Thông tin cá nhân & Học vấn** (`View & Update My Profile`)
   - **Tab 2: Kỹ năng chuyên môn & Kỹ năng Mềm** *(Kế thừa từ code hiện tại và chuẩn hóa phân nhóm Kỹ năng chuyên môn vs Kỹ năng mềm)*
   - **Tab 3: Bảng thành tích** *(Kế thừa từ code hiện tại — Bảng vàng thành tích & giải thưởng)*
   - **Tab 4: Lộ trình cá nhân** *(Tab mới — tích hợp trực tiếp từ `Roadmap` đang kích hoạt ở Module 8)*

---

## 2. Mở Rộng Mô Hình Dữ Liệu (`student_profiles`)

Cập nhật [`src/models/StudentProfile.ts`](file:///c:/Users/AD/OneDrive/Desktop/Project/ULIS_DMST_2026/src/models/StudentProfile.ts):

| Trường | Kiểu | Hiện có | Mới / Thay đổi | Mô tả |
|---|---|---|---|---|
| `userId` | `String` | Có | Giữ | Unique index tham chiếu `users._id` |
| `fullName` | `String` | Có | Giữ | Họ và tên sinh viên |
| `birthYear` | `Number` | Chưa | **Thêm mới** | Năm sinh (VD: `2004`) |
| `academicYear` | `String` | Có | Chuẩn enum | `YEAR_1` \| `YEAR_2` \| `YEAR_3` \| `YEAR_4` \| `YEAR_5_PLUS` |
| `university` | `String` | Có | Chuẩn hóa | Chọn từ danh sách trường ĐH có sẵn (hoặc lưu mã/tên chuẩn) |
| `major` | `String` | Có | Giữ | Chuyên ngành tự điền |
| `bio` | `String` | Có | Giữ | Tiểu sử & định hướng ngắn (tối đa 500 ký tự) |
| `skills` | `String[]` | Có | Giữ tương thích | Danh sách kỹ năng tổng hợp (tương thích ngược code cũ) |
| `hardSkills` | `String[]` | Chưa | **Thêm mới** | Danh sách Kỹ năng chuyên môn |
| `softSkills` | `String[]` | Chưa | **Thêm mới** | Danh sách Kỹ năng mềm |
| `achievements` | `String[]` | Có | Giữ / Mở rộng | Danh sách thành tích (hiện có trong code) |
| `avatar` | `String` | Có | Giữ | Ảnh đại diện |

---

## 3. Quy Tắc Bảo Mật & Toàn Vẹn

- **Chống IDOR tuyệt đối:** API `/api/profile` luôn lấy `authUser.id` từ JWT Access Token (`requireAuth()`), không chấp nhận `userId` từ client payload.
- **Đồng bộ tên sang `User`:** Khi `fullName` thay đổi trên `StudentProfile`, đồng bộ cập nhật `User.name`.
- **Liên kết AI Orientation:** Khi hồ sơ học thuật (`major`, `academicYear`, `university`, `bio`, `skills`) được cập nhật, người dùng có thể nhấn tái phân tích AI nếu muốn cập nhật định hướng ở Module 8.

---

## 4. Danh Sách Đặc Tả Chi Tiết

| Mã | Tên đặc tả | Tệp |
|---|---|---|
| `PRO-01` | Xem & Cập nhật thông tin hồ sơ sinh viên | [`01_VIEW_AND_UPDATE_PROFILE.md`](./01_VIEW_AND_UPDATE_PROFILE.md) |
| `PRO-02` | Các tab Hồ sơ: Kỹ năng, Bảng thành tích & Lộ trình cá nhân | [`02_PROFILE_TABS_SKILLS_ACHIEVEMENTS_ROADMAP.md`](./02_PROFILE_TABS_SKILLS_ACHIEVEMENTS_ROADMAP.md) |

