# AUTH-02: Đăng Ký Tài Khoản & Luồng Hoàn Thiện Hồ Sơ (Multi-step Register)

> **Module:** `01_AUTHENTICATION`  
> **Yêu cầu liên quan:** Register gồm Email/Password/Confirm Password → Họ tên, Năm sinh, Sinh viên năm mấy, Trường ĐH (list có sẵn), Ngành học (tự điền) → Quiz định hướng. Nếu đăng nhập bằng Gmail lần đầu thì vào thẳng bước điền thông tin hồ sơ.  
> **Tác nhân:** Visitor, Newly Registered Student.

---

## 1. Luồng Nghiệp Vụ Tổng Quát

```text
[Email/Password Register (/register)]
   │  Nhập: Email, Mật khẩu, Xác nhận mật khẩu
   ▼  POST /api/auth/register -> Tạo User (isProfileCompleted: false) + Cấp JWT Cookies
   │
   ├─────────────────────────────────────────────▲
   │                                             │ (Google OAuth lần đầu tự tạo User
   ▼                                             │  rồi nhảy thẳng vào đây)
[Bước 2: Hoàn thiện thông tin (/register/complete-profile)]
   │  Nhập:
   │   - Họ và tên (text, prefill nếu có từ Google)
   │   - Năm sinh (number/select, VD: 1995..2010)
   │   - Sinh viên năm mấy (select: YEAR_1, YEAR_2, YEAR_3, YEAR_4, YEAR_5_PLUS)
   │   - Trường Đại học (Searchable Select từ danh sách trường ĐH Việt Nam có sẵn)
   │   - Ngành học (text input tự điền)
   ▼  POST /api/auth/complete-profile -> Cập nhật User + StudentProfile (isProfileCompleted: true, onboardingStep: "QUIZ")
   │
[Bước 3: Quiz Định hướng (/onboarding)]
   │  Thực hiện Trắc nghiệm định hướng (Module 08: PA01–PA12)
   │  -> Phân tích AI & Khởi tạo Lộ trình cá nhân
   ▼  Hoàn tất -> onboardingStep = "COMPLETED" -> Vào Dashboard / Trang chủ
```

---

## 2. Quy Tắc Nghiệp Vụ Chi Tiết (Business Rules)

1. **Bước 1 — Thông tin tài khoản (chỉ dành cho đăng ký bằng Email/Password):**
   - Giao diện `/register` hiển thị 3 trường chính theo đúng yêu cầu:
     1. **Địa chỉ Email** (định dạng email hợp lệ, kiểm tra trùng lặp không phân biệt hoa thường).
     2. **Mật khẩu** (tối thiểu 6 ký tự — khuyến nghị tối đa 128 ký tự).
     3. **Xác nhận lại mật khẩu** (phải khớp chính xác với mật khẩu).
   - Kèm nút **"Đăng ký nhanh với Google"**: nếu bấm vào, chạy Google OAuth; nếu là email mới → tự tạo tài khoản và chuyển thẳng sang **Bước 2**; nếu email cũ đã hoàn thiện hồ sơ → đăng nhập vào thẳng hệ thống.
   - Khi submit Bước 1 thành công: tạo `User` (tạm lấy prefix email làm `name` ban đầu, `isProfileCompleted: false`, `onboardingStep: "PROFILE"`), tạo `StudentProfile` rỗng, **cấp luôn JWT Access Token + Refresh Token** vào cookie, và chuyển hướng tới Bước 2 (`/register/complete-profile`).
2. **Bước 2 — Thông tin cá nhân & Học vấn (`/register/complete-profile`):**
   - Bắt buộc người dùng đã đăng nhập có `isProfileCompleted === false` hoàn tất bước này.
   - Các trường dữ liệu:
     - **Họ và tên** (`fullName`): Bắt buộc, 2–100 ký tự. (Tự động điền sẵn tên từ Google profile nếu đăng nhập qua Google).
     - **Năm sinh** (`birthYear`): Bắt buộc, số nguyên hợp lệ (VD từ `1985` đến `currentYear - 16`).
     - **Sinh viên năm mấy** (`academicYear`): Bắt buộc, chọn 1 trong các giá trị: `YEAR_1` (Năm 1), `YEAR_2` (Năm 2), `YEAR_3` (Năm 3), `YEAR_4` (Năm 4), `YEAR_5_PLUS` (Năm 5+ / Sau đại học).
     - **Trường Đại học** (`university`): Bắt buộc, **chọn từ 1 danh sách (list) có sẵn** lưu tại `src/constants/universities.ts` (hoặc collection `universities` seed sẵn danh sách các trường ĐH/Học viện hàng đầu Việt Nam như ĐH Ngoại ngữ - ĐHQGHN [ULIS], ĐH Công nghệ - ĐHQGHN [UET], ĐH Kinh tế - ĐHQGHN [UEB], ĐH Bách khoa Hà Nội, ĐH Kinh tế Quốc dân, ĐH Ngoại thương, ĐH Quốc gia TP.HCM, v.v. — hỗ trợ search combobox theo tên hoặc mã viết tắt, có thêm lựa chọn `"OTHER"` + nhập tên trường nếu trường của sinh viên nằm ngoài danh mục mặc định hay tùy chỉnh theo cấu hình admin).
     - **Ngành học** (`major`): Bắt buộc, ô nhập liệu **tự điền** (`2–120` ký tự).
   - Khi lưu Bước 2: cập nhật `User.name = fullName`, `User.isProfileCompleted = true`, `User.onboardingStep = "QUIZ"`, và cập nhật `StudentProfile` (`fullName`, `birthYear`, `academicYear`, `university`, `major`).
3. **Bước 3 — Quiz định hướng (`/onboarding?from=register`):**
   - Sau khi lưu Bước 2, tự động điều hướng đến trang **Quiz định hướng**.
   - Hiển thị thanh tiến trình Onboarding 3 bước (`1. Tài khoản ✓ → 2. Thông tin cá nhân ✓ → 3. Quiz định hướng`).
   - Khi sinh viên nộp bài Quiz định hướng thành công (hoặc chọn bỏ qua tạm thời nếu cho phép làm lại sau từ banner nhắc nhở), cập nhật `User.onboardingStep = "COMPLETED"`.

---

## 3. Đặc Tả UI/UX

- Tuân thủ thẻ Card trung tâm chuẩn Unera (`max-w-lg rounded-2xl border-slate-200 bg-white shadow-xl`) trên nền `#F6F8FB`.
- **Stepper Header** ở trên cùng cho thấy rõ đang ở bước `1/3`, `2/3`, hay `3/3`.
- Trường **Trường Đại học** dùng **Searchable Combobox** để sinh viên gõ tìm nhanh trong danh sách hàng chục trường đại học (ví dụ gõ `"ULIS"` hoặc `"Ngoại ngữ"` sẽ lọc ra `"Trường Đại học Ngoại ngữ - ĐHQGHN (ULIS)"`).

---

## 4. Đặc Tả API Contract

### 4.1 `POST /api/auth/register` (Bước 1)
- **Zod Request Schema:**
  ```typescript
  const registerStep1Schema = z.object({
    email: z.string().email("Địa chỉ email không hợp lệ"),
    password: z.string().min(6, "Mật khẩu phải có ít nhất 6 ký tự").max(128),
    confirmPassword: z.string().min(1, "Vui lòng xác nhận lại mật khẩu"),
  }).refine((d) => d.password === d.confirmPassword, {
    message: "Mật khẩu xác nhận không khớp",
    path: ["confirmPassword"],
  });
  ```
- **Response `201 Created`:**
  - Set JWT Access + Refresh Token cookies.
  - Body: `{ success: true, user: { id, email, role: "STUDENT", isProfileCompleted: false, onboardingStep: "PROFILE" }, nextStepUrl: "/register/complete-profile" }`.
- **Mã lỗi:** `400` (Sai định dạng/mật khẩu không khớp), `409` (Email đã tồn tại).

### 4.2 `GET /api/universities`
- Trả danh sách các trường đại học chuẩn hóa (có `code`, `name`, `shortName`, `city`) để frontend render dropdown/combobox tại Bước 2 và Trang Hồ sơ cá nhân.

### 4.3 `POST /api/auth/complete-profile` (Bước 2 — Yêu cầu đã xác thực)
- **Zod Request Schema:**
  ```typescript
  const completeProfileSchema = z.object({
    fullName: z.string().trim().min(2, "Vui lòng nhập họ và tên").max(100),
    birthYear: z.coerce.number().int().min(1980).max(new Date().getFullYear() - 15),
    academicYear: z.enum(["YEAR_1", "YEAR_2", "YEAR_3", "YEAR_4", "YEAR_5_PLUS"]),
    university: z.string().trim().min(2, "Vui lòng chọn trường đại học"),
    major: z.string().trim().min(2, "Vui lòng nhập ngành học").max(120),
  });
  ```
- **Xử lý:** Kiểm tra `university` nằm trong danh sách cho phép (trừ trường hợp cấu hình cho phép `"OTHER"`). Cập nhật `User` và `StudentProfile`.
- **Response `200 OK`:**
  `{ success: true, onboardingStep: "QUIZ", nextStepUrl: "/onboarding?from=register" }`.

---

## 5. Tiêu Chí Chấp Thuận (Acceptance Criteria)

- **AC-01 (Register Bước 1):** *Given* khách nhập email chưa tồn tại, mật khẩu và xác nhận mật khẩu khớp nhau, *When* nhấn Đăng ký, *Then* tài khoản được tạo, JWT cookies được cấp, và chuyển sang `/register/complete-profile`.
- **AC-02 (Google OAuth vào thẳng Bước 2):** *Given* người dùng bấm Đăng nhập Google với tài khoản mới, *When* Google xác thực xong, *Then* bỏ qua Bước 1 email/password và chuyển thẳng tới `/register/complete-profile` với `fullName` điền sẵn từ Google.
- **AC-03 (Chặn chưa chọn trường từ danh sách):** *Given* người dùng ở Bước 2, *When* chưa chọn Trường ĐH từ danh sách có sẵn hoặc bỏ trống Ngành học/Năm sinh, *Then* không thể lưu và hiển thị lỗi chi tiết tại từng trường.
- **AC-04 (Chuyển sang Quiz định hướng):** *Given* người dùng hoàn thành Bước 2, *When* bấm Tiếp tục, *Then* hệ thống lưu hồ sơ và chuyển ngay sang `/onboarding` (Bước 3: Quiz định hướng).

