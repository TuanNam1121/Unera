# Tính Năng: Thu Thập Câu Trả Lời & Nộp Bài Trắc Nghiệm (Submission Flow)

> **Mã SRS:** `FR-ONB-03`, `FR-ONB-04`  
> **Trạng thái:** ![Hoàn thành](https://img.shields.io/badge/-ĐÃ%20HOÀN%20THÀNH%20100%25-emerald)  
> **Thuộc cụm:** `03_ONBOARDING_QUIZ`  
> **Tác nhân:** Sinh viên (Student)

---

## 1. Cách Thức Hoạt Động Hiện Tại (Implementation Details)

### 1.1 Thu Thập Câu Trả Lời (Stepper Flow)
- Giao diện [`src/app/onboarding/page.tsx`](file:///c:/Users/AD/OneDrive/Desktop/Project/ULIS_DMST_2026/src/app/onboarding/page.tsx) tải danh sách câu hỏi từ `GET /api/quiz`.
- Mỗi câu hỏi hiển thị dưới dạng card lớn với các lựa chọn dạng radio box:
  - Bấm vào một phương án: Thẻ đổi sang viền xanh `border-blue-600 bg-blue-50/40`, radio bật chấm tròn xanh.
  - Lưu trạng thái vào state `answers: { [questionId]: optionId }`.
  - Nút "Tiếp tục" chỉ kích hoạt khi câu hỏi hiện tại đã được chọn đáp án.

### 1.2 Nộp Bài (`POST /api/quiz/submit`)
- **Tệp nguồn:** [`src/app/api/quiz/submit/route.ts`](file:///c:/Users/AD/OneDrive/Desktop/Project/ULIS_DMST_2026/src/app/api/quiz/submit/route.ts)
- **Kiểm tra hợp lệ phía Server (`FR-ONB-04`):**
  - Server duyệt qua toàn bộ các câu hỏi đang kích hoạt trong DB.
  - Nếu thiếu bất kỳ câu nào chưa trả lời &rarr; Trả về HTTP 400 kèm ID câu hỏi còn thiếu: *"Vui lòng trả lời đầy đủ tất cả các câu hỏi trước khi gửi bài."*
  - Nếu hợp lệ &rarr; Tiến hành thuật toán chấm điểm Rule-based.
