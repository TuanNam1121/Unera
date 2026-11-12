# PRO-01: View My Profile & Update My Profile

> **Module:** `02_STUDENT_PROFILE`  
> **Yêu cầu:** Người dùng xem và thay đổi thông tin: Họ và tên, Năm sinh, Sinh viên năm mấy, Trường đại học (list có sẵn), Chuyên ngành (tự điền), Tiểu sử và định hướng ngắn.  
> **Tác nhân:** Student (đã đăng nhập).

---

## 1. Quy Tắc Nghiệp Vụ (Business Rules)

1. **Tự động đọc & khởi tạo (View My Profile):**
   - Khi mở `/profile`, client gọi `GET /api/profile` (hoặc Server Component load dữ liệu ban đầu).
   - Hiển thị **Profile Hero Banner** ở đầu trang (giữ phong cách gradient xanh dương hiện tại ở [`src/app/profile/page.tsx`](file:///c:/Users/AD/OneDrive/Desktop/Project/ULIS_DMST_2026/src/app/profile/page.tsx#L279-L321)): Avatar/chữ cái đầu, Họ tên, Badge năm học, Ngành · Trường ĐH, nút nhanh chuyển tới `/roadmap` và kết quả AI định hướng.
2. **Các trường có thể xem và cập nhật (Update My Profile):**
   - **Họ và tên (`fullName`):** Bắt buộc, `2–100` ký tự.
   - **Năm sinh (`birthYear`):** Số nguyên từ `1980` đến `currentYear - 15` (tùy chọn hoặc bắt buộc đồng bộ từ Bước 2 đăng ký).
   - **Sinh viên năm mấy (`academicYear`):** Select box gồm: `YEAR_1` (Năm 1), `YEAR_2` (Năm 2), `YEAR_3` (Năm 3), `YEAR_4` (Năm 4), `YEAR_5_PLUS` (Năm 5+ / Sau đại học).
   - **Trường Đại học (`university`):** **Searchable Select / Combobox** lấy từ danh sách trường ĐH chuẩn hóa (`GET /api/universities` / `src/constants/universities.ts`) thay thế `<Input>` nhập tay tự do hiện tại.
   - **Chuyên ngành (`major`):** Ô nhập tự điền (`text input`, tối đa 120 ký tự).
   - **Tiểu sử và định hướng ngắn (`bio`):** Textarea có bộ đếm ký tự, tối đa `500` ký tự.
3. **Phản hồi & Xác thực:**
   - Validate cả ở client và server bằng Zod (`updateProfileSchema`).
   - Sau khi lưu thành công (`PUT /api/profile`), cập nhật lại Header Profile Hero và hiển thị toast/alert xác nhận màu xanh ngọc (`emerald`).

---

## 2. Đặc Tả API Contract

### 2.1 `GET /api/profile`
- **Auth:** `requireAuth()` (JWT Access Token).
- **Response `200 OK`:**
  ```json
  {
    "success": true,
    "profile": {
      "userId": "...",
      "fullName": "Nguyễn Văn A",
      "birthYear": 2005,
      "academicYear": "YEAR_2",
      "university": "Trường Đại học Ngoại ngữ - ĐHQGHN (ULIS)",
      "major": "Ngôn ngữ Anh",
      "bio": "Định hướng du học Thạc sĩ Ngôn ngữ học ứng dụng...",
      "skills": ["IELTS 7.5", "Thuyết trình"],
      "hardSkills": ["IELTS 7.5", "Biên phiên dịch"],
      "softSkills": ["Thuyết trình", "Làm việc nhóm"],
      "achievements": ["Giải Nhì NCKH Sinh viên 2025"]
    },
    "user": { "id": "...", "email": "...", "role": "STUDENT", "avatar": "..." }
  }
  ```

### 2.2 `PUT /api/profile`
- **Zod Request Schema:**
  ```typescript
  const updateProfileSchema = z.object({
    fullName: z.string().trim().min(2, "Họ và tên ít nhất 2 ký tự").max(100).optional(),
    birthYear: z.coerce.number().int().min(1980).max(new Date().getFullYear() - 15).optional(),
    academicYear: z.enum(["YEAR_1", "YEAR_2", "YEAR_3", "YEAR_4", "YEAR_5_PLUS"]).optional(),
    university: z.string().trim().min(2).max(200).optional(),
    major: z.string().trim().max(120).optional(),
    bio: z.string().trim().max(500, "Tiểu sử tối đa 500 ký tự").optional(),
    skills: z.array(z.string().trim().min(1)).optional(),
    hardSkills: z.array(z.string().trim().min(1)).optional(),
    softSkills: z.array(z.string().trim().min(1)).optional(),
    achievements: z.array(z.string().trim().min(1)).optional(),
  });
  ```
- **Response `200 OK`:** `{ success: true, message: "Cập nhật hồ sơ sinh viên thành công!", profile: ... }`.

---

## 3. Tiêu Chí Chấp Thuận (Acceptance Criteria)

- **AC-01:** *Given* sinh viên truy cập `/profile`, *When* trang tải xong, *Then* hiển thị đầy đủ Họ tên, Năm sinh, Năm học, Trường ĐH, Chuyên ngành, Tiểu sử từ DB.
- **AC-02:** *Given* sinh viên thay đổi Trường ĐH từ danh sách có sẵn, sửa Chuyên ngành và Tiểu sử ngắn (<= 500 ký tự), *When* bấm "Lưu thông tin", *Then* DB cập nhật `StudentProfile` và `User.name` (nếu đổi tên), UI cập nhật Hero Card ngay lập tức.
- **AC-03:** *Given* sinh viên nhập `bio` > 500 ký tự hoặc `fullName` < 2 ký tự, *When* bấm Lưu, *Then* API trả `400 Bad Request` và UI hiển thị thông báo lỗi cụ thể.

