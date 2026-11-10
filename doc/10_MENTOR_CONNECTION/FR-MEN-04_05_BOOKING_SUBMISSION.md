# Đặc Tả Tính Năng: Sinh Viên Gửi Yêu Cầu Đặt Lịch Tư Vấn

> **Mã tính năng:** `FR-MEN-04`, `FR-MEN-05`  
> **Thuộc cụm:** `10_MENTOR_CONNECTION`  
> **Tác nhân:** Sinh viên (Student)  
> **Mức độ ưu tiên:** Bắt buộc (P0 - MVP)  

---

## 1. Nghiệp Vụ & Form Gửi Yêu Cầu

1. **Khởi tạo yêu cầu (FR-MEN-04):**
   - Từ trang danh bạ Mentor, sinh viên chọn một Mentor phù hợp và bấm nút **"Đặt lịch tư vấn"**.
   - Yêu cầu sinh viên phải đăng nhập tài khoản trước khi thực hiện hành động này.
2. **Thông tin bắt buộc trong form (FR-MEN-05):**
   - **Chủ đề tư vấn (`topic`):** Chọn từ danh sách chủ đề của Mentor hoặc nhập chủ đề cụ thể (tối thiểu 5 ký tự).
   - **Khung thời gian đề xuất (`preferredTime`):** Cung cấp 2 đến 3 khung giờ sinh viên có thể tham gia (ví dụ: *Tối thứ 5 từ 20h-21h hoặc Sáng thứ 7 từ 9h-10h*).
   - **Lời nhắn & Câu hỏi chi tiết (`message`):** Tối thiểu 10 ký tự, giới thiệu bản thân, mục tiêu hiện tại và các câu hỏi trọng tâm muốn Mentor giải đáp.
3. **Cơ chế xác thực (Zod Schema):**
   ```typescript
   export const createBookingRequestSchema = z.object({
     mentorId: z.string().min(1, "Vui lòng chọn Mentor"),
     topic: z.string().min(5, "Chủ đề tối thiểu 5 ký tự").max(200),
     preferredTime: z.string().min(5, "Khung thời gian tối thiểu 5 ký tự").max(200),
     message: z.string().min(10, "Lời nhắn tối thiểu 10 ký tự").max(2000),
   });
   ```
4. **Trạng thái khởi tạo:** Bản ghi được tạo trong CSDL mang trạng thái mặc định `status: "PENDING"`.
