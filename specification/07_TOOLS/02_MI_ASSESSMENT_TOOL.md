# TOOL-02: Trắc Nghiệm Đa Trí Thông Minh MI (`/tools/mi`)

> **Module:** `07_TOOLS`  
> **Yêu cầu:** Trắc nghiệm MI (Multiple Intelligences — Học thuyết Đa trí thông minh của Howard Gardner).  
> **Tác nhân:** Visitor, Student.

---

## 1. 8 Nhóm Trí Thông Minh Chuẩn & Bộ Câu Hỏi (`src/constants/mi.ts`)

1. **8 Loại Trí Thông Minh:**
   1. `LINGUISTIC` — Trí thông minh Ngôn ngữ (*Word Smart*)
   2. `LOGICAL_MATHEMATICAL` — Trí thông minh Logic – Toán học (*Number/Reasoning Smart*)
   3. `VISUAL_SPATIAL` — Trí thông minh Không gian – Thị giác (*Picture Smart*)
   4. `MUSICAL` — Trí thông minh Âm nhạc (*Music Smart*)
   5. `BODILY_KINESTHETIC` — Trí thông minh Vận động Cơ thể (*Body Smart*)
   6. `INTERPERSONAL` — Trí thông minh Tương tác – Giao tiếp (*People Smart*)
   7. `INTRAPERSONAL` — Trí thông minh Nội tâm (*Self Smart*)
   8. `NATURALIST` — Trí thông minh Thiên nhiên (*Nature Smart*)
2. **Cấu trúc Bộ câu hỏi:**
   - Gồm `40` hoặc `48` phát biểu (mỗi nhóm 5–6 phát biểu).
   - Người dùng đánh giá mức độ đúng với bản thân theo thang điểm Likert **1 đến 5** (`1 = Hoàn toàn không đúng` ... `5 = Hoàn toàn đúng`).
3. **Thuật Toán Chấm Điểm:**
   - Điểm mỗi nhóm = `(Tổng điểm các câu thuộc nhóm / Điểm tối đa nhóm) * 100` (quy đổi thang `0–100%`).
   - Xếp hạng 8 nhóm từ cao xuống thấp, làm nổi bật **Top 3 trí thông minh vượt trội nhất**.

---

## 2. Giao Diện Kết Quả & Biểu Đồ

- **Biểu đồ trực quan:** Biểu đồ Radar Chart hoặc Horizontal Bar Chart (SVG/Recharts/CSS thuần chuẩn `UI_UX_DESIGN_SYSTEM.md`) so sánh 8 chỉ số trí thông minh.
- **Thẻ Top 3 Trí thông minh nổi trội:** Hiển thị đặc điểm nhận diện, phương pháp học tập hiệu quả nhất (cho sinh viên đại học), và nhóm ngành nghề/vị trí công việc phù hợp.
- **Lưu lịch sử (`POST /api/tools/results` với `toolType: "MI"`):** Tự động lưu nếu người dùng đã đăng nhập và hiển thị danh sách kết quả cũ để theo dõi sự phát triển bản thân theo thời gian.

---

## 3. Tiêu Chí Chấp Thuận

- **AC-01:** Sinh viên hoàn thành tất cả phát biểu thang 1–5 → hệ thống tính đúng điểm `0–100%` cho cả 8 nhóm trí thông minh và xếp hạng Top 3 chính xác.
- **AC-02:** Khi bấm nộp bài thiếu câu trả lời → hiển thị cảnh báo các câu chưa chọn.
- **AC-03:** Kết quả được lưu vào `tool_results` cho sinh viên đã đăng nhập và xem lại được từ lịch sử.

