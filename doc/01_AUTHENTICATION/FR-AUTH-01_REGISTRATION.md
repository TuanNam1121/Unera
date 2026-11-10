# Đặc Tả Tính Năng: Đăng Ký Tài Khoản Sinh Viên

> **Mã tính năng:** `FR-AUTH-01`  
> **Thuộc cụm:** `01_AUTHENTICATION`  
> **Tác nhân thực hiện:** Khách vãng lai (Visitor)  
> **Mức độ ưu tiên:** Bắt buộc (P0 - MVP)  
> **Trạng thái:** Confirmed  

---

## 1. Mục Tiêu & Nghiệp Vụ

Cho phép một người dùng chưa có tài khoản (Visitor) tạo một tài khoản Sinh viên (`STUDENT`) mới trong hệ thống bằng địa chỉ email và mật khẩu:
- **Chuẩn hóa Email:** Email phải được đưa về dạng chữ thường (`lowercase`) và xóa khoảng trắng thừa (`trim`) trước khi kiểm tra trùng lặp hoặc lưu trữ.
- **Duy nhất tuyệt đối:** Không chấp nhận 2 tài khoản sử dụng cùng một địa chỉ email (BR-01).
- **Mã hóa mật khẩu:** Mật khẩu người dùng nhập không bao giờ được lưu trữ dưới dạng văn bản thô (plain-text). Phải được băm bằng thuật toán `bcrypt` với cost factor tối thiểu là `10`.
- **Tự động gắn vai trò:** Mọi tài khoản tạo qua cổng đăng ký công khai đều tự động được gán vai trò `STUDENT`. Không cho phép client truyền vai trò (`role`) qua body request.
- **Khởi tạo dữ liệu đi kèm:** Khi tạo User thành công, hệ thống phải tự động tạo một bản ghi `StudentProfile` tương ứng chứa `userId` vừa tạo để sẵn sàng lưu trữ thông tin trường, ngành, mục tiêu và kỹ năng.

---

## 2. Giao Diện & Luồng Tương Tác Người Dùng (UI/UX)

Theo chuẩn thiết kế [`UI_UX_DESIGN_SYSTEM.md`](file:///c:/Users/AD/OneDrive/Desktop/Project/ULIS_DMST_2026/UI_UX_DESIGN_SYSTEM.md):
1. Người dùng truy cập đường dẫn `/register`.
2. Form đăng ký hiển thị trong thẻ Card bo góc `rounded-2xl`, viền nhạt `border-slate-200`, gồm:
   - Ô nhập "Họ và tên" (placeholder: *Nguyễn Văn A*)
   - Ô nhập "Địa chỉ Email" (placeholder: *sinhvien@unera.edu.vn*)
   - Ô nhập "Mật khẩu" (kèm icon ẩn/hiện mật khẩu)
   - Nút hành động chính: "Tạo tài khoản" (màu xanh dương `#2563EB`)
   - Nút phụ: "Đã có tài khoản? Đăng nhập ngay" dẫn sang `/login`.
3. Khi người dùng bấm "Tạo tài khoản":
   - Nút chuyển sang trạng thái loading với spinner quay tròn, vô hiệu hóa form chống gửi đúp (double-submit).
   - Nếu thành công: Hiển thị thông báo chào mừng và tự động chuyển hướng người dùng đến màn hình bài trắc nghiệm định hướng (`/onboarding`) hoặc trang chủ khám phá (`/explore`).
   - Nếu thất bại: Hiển thị thông báo lỗi màu đỏ có icon cảnh báo ngay trên form.

---

## 3. Đặc Tả Kỹ Thuật & Hợp Đồng API

### 3.1 Endpoint Đăng Ký
- **URL:** `POST /api/auth/register`
- **Quyền truy cập:** Public (Visitor)
- **Tiêu đề (Headers):** `Content-Type: application/json`

### 3.2 Request Schema (Zod Validation)
```typescript
export const registerSchema = z.object({
  name: z.string().min(2, "Họ và tên phải có ít nhất 2 ký tự").max(100),
  email: z.string().email("Địa chỉ email không hợp lệ"),
  password: z.string().min(6, "Mật khẩu phải có ít nhất 6 ký tự").max(128),
});
```

### 3.3 Phản Hồi Thành Công (HTTP 201 Created)
```json
{
  "message": "Đăng ký tài khoản thành công",
  "user": {
    "id": "67315a1e2f3b4c0012a9bcde",
    "name": "Nguyễn Văn Sinh Viên",
    "email": "student@unera.edu.vn",
    "role": "STUDENT"
  }
}
```

### 3.4 Phản Hồi Lỗi
| HTTP Code | Tình Huống | Cấu Trúc Response |
|---|---|---|
| **400 Bad Request** | Thiếu trường, email sai định dạng, mật khẩu ngắn | `{"error": "Dữ liệu không hợp lệ", "details": ["Mật khẩu phải có ít nhất 6 ký tự"]}` |
| **409 Conflict** | Email đã tồn tại trong hệ thống | `{"error": "Email này đã được sử dụng. Vui lòng đăng nhập hoặc sử dụng email khác."}` |
| **500 Server Error** | Lỗi kết nối CSDL MongoDB | `{"error": "Không thể tạo tài khoản. Vui lòng thử lại sau.", "details": "..."}` |

---

## 4. Tiêu Chí Chấp Thuận (Acceptance Criteria - Gherkin)

### Kịch bản 1: Đăng ký thành công với thông tin hợp lệ
- **Given:** Người dùng chưa đăng nhập và cung cấp email chưa từng tồn tại `sv.moi@unera.edu.vn`.
- **When:** Người dùng gửi yêu cầu với họ tên "Trần Thị Mai" và mật khẩu "MatKhau@123".
- **Then:** Hệ thống tạo bản ghi mới trong bảng `users` với role `STUDENT` và status `ACTIVE`.
- **And:** Mật khẩu trong DB được mã hóa bằng bcrypt, không thể đảo ngược văn bản thô.
- **And:** Một bản ghi `StudentProfile` mới được khởi tạo liên kết với `userId`.
- **And:** Trả về mã HTTP `201 Created`.

### Kịch bản 2: Báo lỗi khi email đã tồn tại
- **Given:** Trong hệ thống đã có tài khoản `student@unera.edu.vn`.
- **When:** Người dùng cố gắng đăng ký tài khoản mới với email `Student@unera.edu.vn` (khác chữ hoa thường).
- **Then:** Hệ thống phát hiện trùng lặp sau khi chuẩn hóa về chữ thường.
- **And:** Không tạo bản ghi mới nào trong CSDL.
- **And:** Trả về mã HTTP `409 Conflict` cùng thông điệp tiếng Việt rõ ràng.

### Kịch bản 3: Ngăn chặn Client tiêm nhiễm vai trò ADMIN
- **Given:** Kẻ tấn công gửi request chứa trường `role: "ADMIN"`.
- **When:** Endpoint xử lý dữ liệu.
- **Then:** Hệ thống bỏ qua giá trị client gửi và luôn gán cứng `role: "STUDENT"`.
