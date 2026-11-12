# MOD8-PA-A: Admin Questionnaire Builder & Conditional Logic (PA13–PA25)

> **Module:** `08_PERSONAL_ORIENTATION_AI_ROADMAP`  
> **Feature IDs:** `PA13`–`PA25`.  
> **Tác nhân:** Admin (`role === "ADMIN"`).

---

## 1. Đặc Tả Từng Feature ID (`PA13` – `PA25`)

| ID | Feature | Quy tắc nghiệp vụ & Hành vi chi tiết (`/admin/quiz`) |
|---|---|---|
| `PA13` | **Create Questionnaire** | Tạo bộ câu hỏi mới (`title`, `description`). Mặc định `isActive: false` để Admin soạn xong câu hỏi và xem trước rồi mới kích hoạt. |
| `PA14` | **Edit Questionnaire** | Chỉnh sửa tiêu đề, mô tả bộ câu hỏi. |
| `PA15` | **Delete Questionnaire** | Nếu bộ câu hỏi **chưa có** `AssessmentSubmission` nào → cho phép xóa hoặc soft-delete. Nếu **đã có** sinh viên nộp bài → bắt buộc **soft-delete** (`isDeleted: true, isActive: false`) để không làm hỏng lịch sử bài làm (`PA11`). |
| `PA16` | **Activate / Deactivate Questionnaire** | Kích hoạt 1 bộ câu hỏi (`isActive: true`) sẽ tự động tắt (`isActive: false`) các bộ câu hỏi khác (dùng MongoDB transaction hoặc `updateMany` trước khi set `true`), đảm bảo tại 1 thời điểm chỉ có **tối đa 1 bộ câu hỏi đang hoạt động**. Chặn kích hoạt nếu bộ câu hỏi có `0` câu hỏi active. Admin cũng có thể Tắt (`Deactivate`) bộ đang chạy. |
| `PA17` | **Create Question** | Thêm câu hỏi mới vào `questionnaireId` với `code`, `questionText`, `description`, `questionType`, `isRequired`, `options`/config theo loại. |
| `PA18` | **Edit Question** | Chỉnh sửa nội dung, cấu hình loại câu hỏi, phương án trả lời và điều kiện hiển thị của câu hỏi. |
| `PA19` | **Delete Question** | Xóa câu hỏi khỏi bộ câu hỏi. Kiểm tra nếu có câu hỏi khác đang đặt `conditionalLogic` phụ thuộc vào `questionId` này → cảnh báo Admin và tự động vô hiệu hóa rule phụ thuộc bị gãy. |
| `PA20` | **Manage Answer Options** | Thêm, sửa nhãn/giá trị, sắp xếp thứ tự, xóa các phương án trả lời (`options: [{ id, label, value, order }]`) cho câu hỏi `SINGLE_CHOICE` và `MULTIPLE_CHOICE` (tối thiểu 2 phương án). |
| `PA21` | **Configure Question Type** | Chọn 1 trong 4 loại: `SINGLE_CHOICE`, `MULTIPLE_CHOICE` (kèm min/max select), `SCALE` (kèm min/max/minLabel/maxLabel), `TEXT` (kèm placeholder/maxLength/multiline). Khi đổi loại câu hỏi, hiển thị form cấu hình tương ứng. |
| `PA22` | **Configure Required Question** | Bật/tắt `isRequired` cho từng câu hỏi. |
| `PA23` | **Question Ordering** | Sắp xếp thứ tự câu hỏi bằng nút Lên/Xuống hoặc kéo thả; gọi `PATCH /api/admin/questionnaires/[id]/questions/reorder` cập nhật đồng loạt `order`. |
| `PA24` | **Configure Conditional Logic** | Cho phép thiết lập điều kiện hiển thị cho câu hỏi hiện tại dựa trên **các câu hỏi đứng trước nó** (`sourceQuestion.order < currentQuestion.order`). Hỗ trợ: (1) chọn `matchType` (`ALL` / `ANY`), (2) thêm danh sách rules `[sourceQuestionId, operator, value]`. **Ràng buộc chống vòng lặp (Cycle Detection):** Backend chạy thuật toán DFS kiểm tra đồ thị phụ thuộc không có chu trình (`A -> B -> A` bị chặn với `400 Bad Request`) và câu nguồn phải có `order` nhỏ hơn! |
| `PA25` | **Preview Questionnaire** | Nút **"Xem trước (Preview)"** mở chế độ giả lập giao diện làm bài của Sinh viên ngay trên trang `/admin/quiz/[id]/preview` (dùng chính component `<QuestionRenderer />` và `evaluateCondition` thật!). Cho phép Admin test từng lựa chọn để kiểm tra câu hỏi điều kiện ẩn/hiện đúng trước khi bấm Activate (`PA16`), **không ghi dữ liệu thật** vào `assessment_submissions`. |

---

## 2. Đặc Tả API Contract (`/api/admin/questionnaires/*`)

Mọi endpoint yêu cầu `requireAdmin()` + ghi `AuditLog`.

| Method | Endpoint | Feature ID | Mô tả |
|---|---|---|---|
| `GET/POST` | `/api/admin/questionnaires` | `PA13` | Liệt kê / Tạo bộ câu hỏi |
| `GET/PATCH/DELETE` | `/api/admin/questionnaires/[id]` | `PA14`, `PA15` | Chi tiết / Sửa / Soft-delete bộ câu hỏi |
| `POST` | `/api/admin/questionnaires/[id]/activate` | `PA16` | Bật/tắt trạng thái `isActive` (`{ active: boolean }`) |
| `POST` | `/api/admin/questionnaires/[id]/questions` | `PA17`, `PA20`–`PA24` | Thêm câu hỏi mới |
| `PATCH/DELETE` | `/api/admin/questions/[questionId]` | `PA18`–`PA24` | Sửa / Xóa câu hỏi (kèm cycle detection cho conditional logic) |
| `PATCH` | `/api/admin/questionnaires/[id]/questions/reorder` | `PA23` | Nhận `{ orderedQuestionIds: string[] }` để cập nhật `order` |
| `GET` | `/api/admin/questionnaires/[id]/preview` | `PA25` | Lấy toàn bộ cấu trúc bộ câu hỏi kể cả khi `isActive === false` để preview |

---

## 3. Tiêu Chí Chấp Thuận

- **AC-01 (`PA13`–`PA16`):** Admin tạo bộ câu hỏi mới, thêm 4 câu hỏi thuộc 4 loại khác nhau, preview thành công (`PA25`), rồi bấm Kích hoạt (`PA16`) → bộ cũ tự động về `isActive: false`, bộ mới hiển thị cho sinh viên tại `/onboarding`.
- **AC-02 (`PA24` Cycle Guard):** Admin cố gán điều kiện Câu 1 phụ thuộc vào Câu 2 trong khi Câu 2 đã phụ thuộc vào Câu 1 → server trả `400 Bad Request` ngăn lưu cấu hình vòng lặp.
- **AC-03 (`PA23`):** Admin kéo thả đổi vị trí Câu 3 lên trước Câu 2 → reload trang vẫn giữ đúng thứ tự mới.

