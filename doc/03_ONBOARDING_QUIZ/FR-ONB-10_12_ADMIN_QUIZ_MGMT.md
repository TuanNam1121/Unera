# Đặc Tả Tính Năng: Admin Quản Trị Trắc Nghiệm & Loại Trừ AI

> **Mã tính năng:** `FR-ONB-10`, `FR-ONB-11`, `FR-ONB-12`  
> **Thuộc cụm:** `03_ONBOARDING_QUIZ`  
> **Tác nhân:** Quản trị viên (Admin)  
> **Trọng tâm:** Quản trị nội dung & Phạm vi ranh giới sản phẩm  

---

## 1. Nghiệp Vụ Quản Trị Của Admin

1. **Quản trị bộ câu hỏi & Lựa chọn (FR-ONB-10):**
   - Admin có giao diện CMS chuyên dụng (`/admin/quiz`) để:
     - Thêm mới, chỉnh sửa, xóa mềm (soft-delete / deactivate) các câu hỏi.
     - Thiết lập thứ tự hiển thị câu hỏi (`order`).
     - Định nghĩa các phương án trả lời cho từng câu.
2. **Cấu hình trọng số điểm (Scoring Configuration - FR-ONB-11):**
   - Với mỗi phương án trả lời, Admin có thể gán điểm số cộng cho từng định hướng (ví dụ: Chọn *"Thích làm việc ở môi trường quốc tế"* -> Cộng 3 điểm cho `multinational`, 2 điểm cho `study_abroad`).
   - Cung cấp tính năng kiểm thử nhanh (Test Scoring Simulator) cho phép Admin xem trước kết quả gợi ý với các bộ câu trả lời giả lập.
3. **Loại trừ AI trong MVP (AI Extension Exclusion - FR-ONB-12):**
   - SRS 1.0 xác định rõ ràng: **AI-based recommendation không thuộc phạm vi của phiên bản 1.0**.
   - Nhà phát triển không tự ý tích hợp OpenAI, Claude hay Gemini API vào luồng trắc nghiệm trừ khi có tài liệu PRD bổ sung được phê duyệt.
