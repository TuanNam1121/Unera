# MOD8-PA-S: Trắc Nghiệm Định Hướng Cá Nhân Cho Sinh Viên (PA01–PA12)

> **Module:** `08_PERSONAL_ORIENTATION_AI_ROADMAP`  
> **Feature IDs:** `PA01`–`PA12`.  
> **Tác nhân:** Student (đã đăng nhập).

---

## 1. Đặc Tả Từng Feature ID (`PA01` – `PA12`)

| ID | Feature | Quy tắc nghiệp vụ & Hành vi chi tiết |
|---|---|---|
| `PA01` | **View Questionnaire** | Khi mở `/onboarding` (hoặc `/assessment`), gọi `GET /api/assessments/active` lấy bộ câu hỏi có `isActive === true` kèm danh sách `questions` sắp xếp theo `order ASC`. Nếu sinh viên đang có bản làm dở (`status === "IN_PROGRESS"`), nạp sẵn các câu trả lời đã lưu để làm tiếp. |
| `PA02` | **Dynamic Question Rendering** | Component `<QuestionRenderer />` đọc `questionType` của từng câu hỏi để render đúng UI control tương ứng (`SINGLE_CHOICE`, `MULTIPLE_CHOICE`, `SCALE`, `TEXT`) kèm nhãn `(Bắt buộc)` nếu `isRequired === true`. |
| `PA03` | **Single Choice Answer** | Hiển thị danh sách thẻ radio-card; chỉ chọn được 1 `option.value` (bấm lại phương án khác sẽ thay thế lựa chọn cũ). |
| `PA04` | **Multiple Choice Answer** | Hiển thị checkbox-card; cho phép chọn nhiều `option.value` dạng `string[]`. Kiểm tra ràng buộc `multipleConfig.minSelect` và `maxSelect` nếu Admin có cấu hình. |
| `PA05` | **Scale Answer** | Hiển thị thang chọn số trực quan (VD: 1 → 5) kèm nhãn 2 đầu (`minLabel`: *"Hoàn toàn không đồng ý"*, `maxLabel`: *"Rất đồng ý"*). Lưu giá trị số nguyên. |
| `PA06` | **Text Answer** | Hiển thị `<input>` (1 dòng) hoặc `<textarea>` (nhiều dòng theo `textConfig.multiline`) kèm placeholder và bộ đếm ký tự (`maxLength`, mặc định `1000`). |
| `PA07` | **Conditional Questions** | Đánh giá hàm thuần `evaluateCondition(question, answersMap)` dùng chung cho cả Client & Server! Nếu câu hỏi có `conditionalLogic.enabled === true`: kiểm tra câu trả lời của các `sourceQuestionId` theo `operator` (`EQUALS`, `NOT_EQUALS`, `CONTAINS`, `GREATER_THAN`, `LESS_THAN`) và `matchType` (`ALL`/`ANY`). Nếu điều kiện **SAI**: ẩn câu hỏi khỏi luồng hiện tại và **tự động bỏ qua không tính vào `isRequired`**, đồng thời xóa tạm giá trị câu trả lời ẩn khỏi payload khi submit. |
| `PA08` | **Save Assessment Progress** | Tự động lưu nháp (auto-save debounce 1.5s khi người dùng chọn đáp án hoặc bấm nút **"Lưu tiến độ"**) qua `PUT /api/assessments/draft` lưu `AssessmentSubmission` trạng thái `IN_PROGRESS`. Khi quay lại trang sau khi đóng trình duyệt, khôi phục đúng tiến độ và vị trí câu hỏi. |
| `PA09` | **Submit Assessment** | Bấm **"Hoàn thành & Phân tích AI"**: (1) Server tải bộ câu hỏi active và chạy lại `evaluateCondition` để xác định tập **câu hỏi hiển thị**; (2) Validate toàn bộ câu hỏi hiển thị có `isRequired === true` đều có đáp án hợp lệ; (3) Chuyển `AssessmentSubmission.status = "SUBMITTED"`, lưu snapshot nội dung câu hỏi; (4) Đánh dấu `User.onboardingStep = "COMPLETED"`; (5) Kích hoạt **AI Orientation Engine (`AI01`–`AI09`)** và **Roadmap Generation (`RM01`)**. |
| `PA10` | **Assessment Result** | Trang `/onboarding/result/[submissionId]` (hoặc tab kết quả) hiển thị kết quả tổng hợp: Tóm tắt câu trả lời chính + **Phân tích định hướng từ AI Gemini** (`AI04`–`AI07`: điểm mạnh, điểm cần cải thiện, mức độ tương thích %, ngành nghề đề xuất, kỹ năng cần học) + nút xem/tạo Lộ trình 4 năm. |
| `PA11` | **Assessment History** | Trang `/onboarding/history` liệt kê toàn bộ các lần đã nộp bài (`status === "SUBMITTED"`), hiển thị lần làm thứ mấy, ngày nộp, tên bộ câu hỏi, trạng thái phân tích AI (`COMPLETED` / `FAILED`), và nút xem lại chi tiết kết quả cũ (`PA10`). |
| `PA12` | **Retake Assessment** | Nút **"Làm lại trắc nghiệm định hướng"**: tạo phiên `IN_PROGRESS` mới với `attemptNumber = previousMaxAttempt + 1` (không ghi đè bài cũ để bảo toàn `PA11`). |

---

## 2. Đặc Tả API Contract (`/api/assessments/*`)

Tất cả endpoint yêu cầu `requireAuth()`.

| Method | Endpoint | Feature ID | Mô tả |
|---|---|---|---|
| `GET` | `/api/assessments/active` | `PA01`, `PA08` | Lấy bộ câu hỏi đang kích hoạt + bản nháp `IN_PROGRESS` hiện tại (nếu có) |
| `PUT` | `/api/assessments/draft` | `PA08` | Lưu nháp `answers` và `currentStepIndex` |
| `POST` | `/api/assessments/submit` | `PA09` | Validate conditional + required, nộp bài (`SUBMITTED`) và kích hoạt AI (`AI01`–`AI09`) |
| `GET` | `/api/assessments/history` | `PA11` | Danh sách lịch sử các lần đã nộp kèm trạng thái AI |
| `GET` | `/api/assessments/results/[submissionId]` | `PA10` | Chi tiết bài nộp + kết quả phân tích AI tương ứng (kiểm tra `studentId === authUser.id`) |
| `POST` | `/api/assessments/retake` | `PA12` | Khởi tạo attempt mới sạch hoặc reset draft mới |

---

## 3. Tiêu Chí Chấp Thuận (Acceptance Criteria)

- **AC-01 (`PA02`–`PA06`):** Sinh viên làm bộ câu hỏi gồm đủ 4 loại (`SINGLE_CHOICE`, `MULTIPLE_CHOICE`, `SCALE` 1–5, `TEXT`) → UI render đúng từng loại và submit lưu đủ 4 định dạng đáp án.
- **AC-02 (`PA07` Conditional):** *Given* Câu 2 có điều kiện chỉ hiện khi Câu 1 = `"Du học"`, *When* sinh viên chọn `"Đi làm ngay"` ở Câu 1, *Then* Câu 2 bị ẩn ngay lập tức và hệ thống không báo lỗi thiếu câu trả lời bắt buộc cho Câu 2 khi nộp bài.
- **AC-03 (`PA08` Save Progress):** *Given* sinh viên trả lời 3/8 câu rồi đóng tab, *When* mở lại `/onboarding`, *Then* 3 câu đã trả lời được khôi phục nguyên vẹn.
- **AC-04 (`PA11`, `PA12`):** *Given* sinh viên làm lại lần 2 và nộp thành công, *Then* trang Lịch sử hiển thị cả Lần 1 và Lần 2 độc lập.

