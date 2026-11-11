# Cụm Tính Năng 03: Trắc Nghiệm Định Hướng Nghề Nghiệp (Onboarding Quiz & Career Orientation)

> **Mã SRS:** `FR-ONB-01` đến `FR-ONB-12`  
> **Trạng thái:** ![Hoàn thành](https://img.shields.io/badge/-ĐÃ%20HOÀN%20THÀNH%20100%25-emerald)  
> **Tác nhân:** Sinh viên (Student), Quản trị viên (Admin)

---

## 1. Cách Thức Hoạt Động Hiện Tại (Current Implementation)

Bài trắc nghiệm định hướng ban đầu giúp sinh viên khám phá thế mạnh và xác định từ 1 đến 2 hướng đi tiềm năng trong suốt 4 năm đại học:

### 1.1 Giao Diện Làm Bài Của Sinh Viên (`/onboarding`)
- **Tệp mã nguồn:** [`src/app/onboarding/page.tsx`](file:///c:/Users/AD/OneDrive/Desktop/Project/ULIS_DMST_2026/src/app/onboarding/page.tsx)
- **Tính năng Stepper từng bước:**
  - Hiển thị từng câu hỏi một cách trực quan, có thanh tiến độ `%` (ví dụ: `Câu 3 / 5`).
  - Badge phân loại câu hỏi: *Mục tiêu tương lai*, *Sở thích & Hứng thú*, *Kế hoạch chứng chỉ*, *Phong cách làm việc*, *Học thuật & Điểm số*.
  - Các nút điều hướng: *Quay lại*, *Tiếp tục*, *Hoàn thành & Nhận kết quả*.
- **Cơ chế Bỏ qua trắc nghiệm (`FR-ONB-01, 02`, `BR-04`):**
  - Nút **"Bỏ qua trắc nghiệm &rarr;"** ở góc trên bên phải cho phép sinh viên vào thẳng `/explore` hoặc trang chủ bất kỳ lúc nào mà không bị phạt hay chặn luồng.

### 1.2 Màn Hình Kết Quả Định Hướng (Rule-based Result View)
- Sau khi nộp bài, hệ thống hiển thị trang kết quả vinh danh:
  - **Thẻ Top 1 Khuyến nghị phù hợp nhất:** Biểu tượng nổi bật, tên hướng đi, đoạn giải thích tiềm năng và danh sách các bước hành động cụ thể.
  - **Thẻ Top 2 Khuyến nghị tiềm năng:** Tự động kích hoạt nếu điểm số của hướng thứ 2 có độ chênh lệch $\le 25\%$ so với Top 1 (`FR-ONB-06`).
  - **Biểu đồ thanh điểm 5 lĩnh vực:** Trực quan hóa điểm số cho cả 5 nhóm (`study_abroad`, `employment`, `research`, `startup`, `skills`).
  - **Nút hành động:** "Xem Lộ trình của tôi" (chuyển sang `/roadmap`), "Khám phá cơ hội" (`/explore`), và "Làm lại bài trắc nghiệm" (Retake).

### 1.3 Phân Hệ Admin CMS Quản Trị Câu Hỏi & Phương Án (`/admin/quiz`)
- **Tệp mã nguồn:** [`src/app/admin/quiz/page.tsx`](file:///c:/Users/AD/OneDrive/Desktop/Project/ULIS_DMST_2026/src/app/admin/quiz/page.tsx)
- **Quản trị toàn diện từ CMS:**
  - Thêm, sửa, xóa câu hỏi và gán số thứ tự `#order`.
  - Bật/tắt trạng thái hiển thị (`isActive`).
  - Quản trị danh sách phương án lựa chọn (A, B, C...) cho từng câu hỏi.
  - **Cấu hình ma trận điểm số:** Admin trực tiếp gán điểm cộng (0 - 10) cho từng hướng nghề nghiệp của mỗi phương án.
  - Nút **"Khôi phục chuẩn"** cho phép reset lại bộ 5 câu hỏi gốc bất cứ lúc nào.
  - Tích hợp ghi nhật ký kiểm toán vào `AuditLog` cho mọi thao tác.

### 1.4 Danh Mục APIs
- `GET /api/quiz`: Lấy danh sách câu hỏi đang kích hoạt (đã ẩn trường scores để bảo mật).
- `POST /api/quiz/submit`: Nộp bài làm, tính toán điểm, lưu vào `QuizResult`, cập nhật `StudentProfile` và sinh mới `Roadmap`.
- `GET /api/admin/quiz/questions`: Admin lấy toàn bộ câu hỏi và bảng điểm.
- `POST /api/admin/quiz/questions`: Admin tạo câu hỏi mới.
- `PATCH /api/admin/quiz/questions/[id]`: Admin sửa câu hỏi/options.
- `DELETE /api/admin/quiz/questions/[id]`: Admin xóa câu hỏi.
- `POST /api/admin/quiz/reset-default`: Admin khôi phục mặc định.

### 1.5 Ranh Giới Kỹ Thuật (Non-AI Invariant - `FR-ONB-12`)
- Không sử dụng bất kỳ API LLM/AI nào trong việc chấm điểm hay gợi ý hướng đi trong MVP 1.0, đảm bảo tính minh bạch, nhất quán và độ trễ cực thấp.
