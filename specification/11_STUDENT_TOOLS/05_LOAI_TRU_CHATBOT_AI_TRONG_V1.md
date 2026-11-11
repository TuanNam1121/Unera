# Nguyên Tắc Thiết Kế: Loại Trừ Tính Năng Chatbot & Review AI Trong Phiên Bản 1.0

> **Mã SRS:** `FR-TOOL-11`, `FR-TOOL-12`  
> **Trạng thái:** ![Ngoại phạm vi v1.0](https://img.shields.io/badge/-NGOẠI%20PHẠM%20VI%20V1.0-red)  
> **Thuộc cụm:** `11_STUDENT_TOOLS`  
> **Tác nhân:** Kiến trúc sư hệ thống, Nhóm phát triển

---

## 1. Quy Định Ràng Buộc Của Dự Án

### 1.1 Nội Dung Các Mã SRS Loại Trừ
- **`FR-TOOL-11` (AI CV Review):** Tính năng tự động đọc và nhận xét CV bằng mô hình ngôn ngữ lớn (LLM).
- **`FR-TOOL-12` (AI Career Chatbot):** Trợ lý ảo AI đàm thoại trực tiếp để gợi ý nghề nghiệp.

### 1.2 Lý Do Ràng Buộc Loại Trừ Trong Release 1.0
1. **Kiểm soát độ chính xác & Giảm ảo giác (Hallucination):** Việc tư vấn học bổng, định hướng việc làm và quy chế du học đòi hỏi thông tin chính xác tuyệt đối từ trường và đối tác; LLM tự do có thể tạo ra thông tin sai lệch gây tổn hại cho sinh viên.
2. **Chi phí vận hành & Token API:** Giữ hệ thống gọn nhẹ, không phát sinh chi phí duy trì API LLM bên thứ ba ngoài ngân sách.
3. **Trọng tâm sản phẩm v1.0:** Unera v1.0 tập trung giải quyết bài toán cốt lõi: Số hóa lộ trình 4 năm chuẩn khoa học, tổng hợp cơ hội có kiểm duyệt từ Admin, và kết nối người thật - việc thật (Mentor 1-1).

### 1.3 Cam Kết Triển Khai
- Không thiết kế giao diện chat bong bóng AI.
- Không tích hợp OpenAI/Gemini/Anthropic keys vào client hoặc runtime xử lý CV trong giai đoạn v1.0.
- Mọi hướng dẫn định hướng đều vận hành dựa trên hệ thống luật định hướng chuẩn hóa (Rule-based Matrix) tại cụm `03_ONBOARDING_QUIZ`.
