# Cụm Tính Năng 03: Trắc Nghiệm Định Hướng Nghề Nghiệp (Onboarding Quiz & Career Orientation)

> **Mã Module:** `ONBOARDING`  
> **Căn cứ SRS:** Mục 4.3 (FR-ONB-01 đến FR-ONB-12)  
> **Tác nhân:** Sinh viên (Student), Quản trị viên (Admin)  
> **Phương pháp tiếp cận:** Chấm điểm dựa trên bộ quy tắc (Rule-based Scoring), không phụ thuộc AI trong MVP.

---

## 1. Tổng Quan Nghiệp Vụ Cụm Tính Năng

Bài trắc nghiệm định hướng ban đầu giúp sinh viên khám phá điểm mạnh, sở thích và xác định từ 1 đến 2 hướng đi tiềm năng trong suốt 4 năm đại học:
1. **Tính chất tùy chọn (Optional - FR-ONB-02 & BR-04):**
   - Sinh viên **có quyền bỏ qua (Skip)** bài trắc nghiệm bất kỳ lúc nào để vào thẳng trang chủ hoặc khám phá cơ hội.
   - Việc bỏ qua **tuyệt đối không bị coi là lỗi** và không được phép chặn bất kỳ tính năng bình thường nào của hệ thống.
   - Sinh viên có thể quay lại làm bài trắc nghiệm bất cứ khi nào qua menu bên trái hoặc trang cá nhân.
2. **Cơ chế đánh giá Rule-based (FR-ONB-05 & BR-05):**
   - Mỗi câu trả lời mang một trọng số điểm cộng cho các hướng phát triển (ví dụ: Du học, Việc làm MNC, Nghiên cứu khoa học, Quản trị viên tập sự).
   - Hệ thống tổng hợp điểm theo công thức cấu hình và đề xuất **1 hoặc 2 hướng đi có điểm số phù hợp nhất** kèm giải thích chi tiết.
   - **Loại trừ AI trong MVP (FR-ONB-12):** Không sử dụng AI/LLM để sinh kết quả nhằm đảm bảo tính minh bạch, nhất quán và độ ổn định cao.
3. **Lịch sử & Làm lại trắc nghiệm (Retake - FR-ONB-08, FR-ONB-09):**
   - Lưu trữ toàn bộ các lần làm bài trước đó.
   - Khi sinh viên làm lại trắc nghiệm, kết quả mới không xóa đè kết quả cũ mà tạo một bản ghi lịch sử mới.

---

## 2. Mô Hình Dữ Liệu `quiz_questions` & `quiz_results`

```typescript
// Bộ câu hỏi (Admin quản trị)
interface IQuizQuestion {
  _id: ObjectId;
  question: string;
  category: string;
  order: number;
  isActive: boolean;
  options: {
    id: string;
    text: string;
    scores: Record<string, number>; // ví dụ: { study_abroad: 3, mnc: 1 }
  }[];
}

// Kết quả làm bài của sinh viên
interface IQuizResult {
  _id: ObjectId;
  studentId: string;
  answers: Record<string, string>; // { [questionId]: optionId }
  recommendedDirections: {
    direction: string;
    score: number;
    description: string;
    suggestedNextSteps: string[];
  }[];
  createdAt: Date;
}
```

---

## 3. Danh Mục Các Tính Năng Chi Tiết

| Mã Tính Năng | Tên Tính Năng | Trọng Tâm Nghiệp Vụ | File Đặc Tả |
|---|---|---|---|
| **FR-ONB-01 & 02** | Khả dụng & Cơ chế Bỏ qua trắc nghiệm | Nút Skip, không chặn luồng truy cập | [`FR-ONB-01_02_QUIZ_AVAILABILITY.md`](./FR-ONB-01_02_QUIZ_AVAILABILITY.md) |
| **FR-ONB-03 & 04** | Thu thập câu trả lời & Nộp bài | Kiểm tra câu trả lời, lưu bài làm | [`FR-ONB-03_04_QUIZ_SUBMISSION.md`](./FR-ONB-03_04_QUIZ_SUBMISSION.md) |
| **FR-ONB-05 & 07** | Đánh giá Rule-based & Đề xuất hướng đi | Công thức chấm điểm, gợi ý 1-2 hướng | [`FR-ONB-05_07_RULE_RECOMMENDATIONS.md`](./FR-ONB-05_07_RULE_RECOMMENDATIONS.md) |
| **FR-ONB-08 & 09** | Lịch sử kết quả & Làm lại bài | Giữ lịch sử lần làm trước, cho phép retake | [`FR-ONB-08_09_RESULT_HISTORY_RETAKE.md`](./FR-ONB-08_09_RESULT_HISTORY_RETAKE.md) |
| **FR-ONB-10 & 12** | Quản lý câu hỏi & Phương án (Admin CMS) | Admin cấu hình câu hỏi, options, điểm số & loại trừ AI | [`FR-ONB-10_12_ADMIN_QUIZ_MGMT.md`](./FR-ONB-10_12_ADMIN_QUIZ_MGMT.md) |

