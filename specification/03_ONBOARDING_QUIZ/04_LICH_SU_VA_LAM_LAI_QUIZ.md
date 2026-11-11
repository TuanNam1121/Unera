# Tính Năng: Lịch Sử Kết Quả & Làm Lại Trắc Nghiệm (History & Retake)

> **Mã SRS:** `FR-ONB-08`, `FR-ONB-09`  
> **Trạng thái:** ![Hoàn thành](https://img.shields.io/badge/-ĐÃ%20HOÀN%20THÀNH%20100%25-emerald)  
> **Thuộc cụm:** `03_ONBOARDING_QUIZ`  
> **Tác nhân:** Sinh viên (Student)

---

## 1. Cách Thức Hoạt Động Hiện Tại (Implementation Details)

### 1.1 Bảo Toàn Lịch Sử Bài Làm (Result History - `FR-ONB-08`)
- **Mô hình CSDL:** [`src/models/QuizResult.ts`](file:///c:/Users/AD/OneDrive/Desktop/Project/ULIS_DMST_2026/src/models/QuizResult.ts)
  - Mỗi lần sinh viên nộp bài trắc nghiệm, hệ thống tạo một bản ghi `QuizResult` mới độc lập kèm mảng câu trả lời (`answers`), điểm số (`scores`), các hướng đề xuất (`recommendedDirections`) và thời gian `createdAt`.
  - **Quy tắc:** Kết quả mới **tuyệt đối không ghi đè hay xóa mất** kết quả cũ trong quá khứ.
- **APIs:**
  - `GET /api/quiz/latest`: Lấy kết quả trắc nghiệm gần nhất của sinh viên.
  - `GET /api/quiz/history`: Lấy toàn bộ lịch sử các lần làm trắc nghiệm trước đây để theo dõi sự dịch chuyển định hướng qua các năm học.

### 1.2 Làm Lại Trắc Nghiệm (Retake Quiz - `FR-ONB-09`)
- Trên trang kết quả `/onboarding`, sinh viên có thể bấm nút **"Làm lại bài trắc nghiệm"**:
  - Trạng thái bài làm được reset về câu hỏi số 1.
  - Sinh viên trả lời lại bộ câu hỏi với góc nhìn mới.
  - Khi nộp lại, bản ghi lịch sử mới được ghi nhận và Lộ trình cá nhân được cập nhật theo hướng đi mới.
