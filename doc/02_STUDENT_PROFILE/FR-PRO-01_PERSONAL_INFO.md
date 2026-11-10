# Đặc Tả Tính Năng: Thông Tin Cá Nhân & Học Vấn Sinh Viên

> **Mã tính năng:** `FR-PRO-01`  
> **Thuộc cụm:** `02_STUDENT_PROFILE`  
> **Tác nhân:** Sinh viên (Student)  
> **Mức độ ưu tiên:** Bắt buộc (P0 - MVP)  

---

## 1. Mục Tiêu & Nghiệp Vụ

Cho phép sinh viên cập nhật các thông tin cơ bản phản ánh vị thế học tập của mình:
- **Trường & Ngành học:** Cung cấp thông tin trường đại học đang theo học (ví dụ: *Đại học Ngoại ngữ - ĐHQGHN*) và chuyên ngành cụ thể. Dữ liệu này được sử dụng để gợi ý bộ lọc cơ hội và đề xuất bài viết phù hợp.
- **Năm học (Academic Year):** Giá trị chuẩn hóa thuộc danh mục:
  - `YEAR_1`: Sinh viên năm thứ nhất.
  - `YEAR_2`: Sinh viên năm thứ hai.
  - `YEAR_3`: Sinh viên năm thứ ba.
  - `YEAR_4`: Sinh viên năm thứ tư.
  - `YEAR_5_PLUS`: Sinh viên năm 5 trở lên hoặc chuẩn bị tốt nghiệp.
- **Tiểu sử (Bio):** Tối đa 500 ký tự mô tả vắn tắt thế mạnh, đam mê và định hướng.

---

## 2. API Contract

- **Endpoint:** `PUT /api/profile`
- **Request Body (Zod Schema):**
  ```typescript
  export const updateProfileSchema = z.object({
    fullName: z.string().min(2, "Họ và tên tối thiểu 2 ký tự").max(100).optional(),
    university: z.string().max(150).optional(),
    major: z.string().max(150).optional(),
    academicYear: z.enum(["YEAR_1", "YEAR_2", "YEAR_3", "YEAR_4", "YEAR_5_PLUS"]).optional(),
    bio: z.string().max(500, "Tiểu sử tối đa 500 ký tự").optional(),
  });
  ```
- **Response (HTTP 200 OK):**
  ```json
  {
    "message": "Cập nhật thông tin hồ sơ thành công",
    "profile": {
      "fullName": "Nguyễn Văn Sinh Viên",
      "university": "ĐHQGHN",
      "major": "Kinh tế đối ngoại",
      "academicYear": "YEAR_3"
    }
  }
  ```
