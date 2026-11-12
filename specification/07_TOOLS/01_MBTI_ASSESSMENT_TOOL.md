# TOOL-01: Trắc Nghiệm Tính Cách MBTI (`/tools/mbti`)

> **Module:** `07_TOOLS`  
> **Yêu cầu:** Trắc nghiệm MBTI cho sinh viên khám phá tính cách & nghề nghiệp phù hợp.  
> **Tác nhân:** Visitor (làm bài & xem kết quả ngay), Student (lưu lịch sử làm bài & xem lại).

---

## 1. Kiến Trúc & Thuật Toán Chấm Điểm MBTI

1. **4 Cặp Trục Tính Cách (Dichotomies):**
   - **E vs I:** Hướng ngoại (*Extraversion*) ↔ Hướng nội (*Introversion*)
   - **S vs N:** Giác quan (*Sensing*) ↔ Trực giác (*Intuition*)
   - **T vs F:** Lý trí (*Thinking*) ↔ Cảm xúc (*Feeling*)
   - **J vs P:** Nguyên tắc (*Judging*) ↔ Linh hoạt (*Perceiving*)
2. **Bộ Câu Hỏi Chuẩn (`src/constants/mbti.ts`):**
   - Gồm `40` hoặc `60` câu hỏi cân bằng đều cho 4 trục (VD: `10–15` câu mỗi trục `EI`, `SN`, `TF`, `JP`).
   - Mỗi câu có 2 phương án A / B (hoặc thang 5 mức từ Rất đồng ý A đến Rất đồng ý B). Mỗi câu chỉ đóng góp điểm vào 1 trục tương ứng.
3. **Thuật Toán Tính Kết Quả:**
   - Tính % nghiêng về từng cực trên mỗi cặp (VD: `E = 70%`, `I = 30%` → chọn `E`).
   - Nếu hòa `50% - 50%`, quy ước ưu tiên rõ ràng (hoặc dùng trọng số câu phân loại) và hiển thị cảnh báo cân bằng.
   - Ghép 4 chữ cái thành **1 trong 16 nhóm tính cách MBTI** (`ISTJ`, `ISFJ`, `INFJ`, `INTJ`, `ISTP`, `ISFP`, `INFP`, `INTP`, `ESTP`, `ESFP`, `ENFP`, `ENTP`, `ESTJ`, `ESFJ`, `ENFJ`, `ENTJ`).
4. **Nội Dung Hồ Sơ 16 Nhóm Tính Cách:**
   - Tên gọi tiếng Việt & Biệt danh (VD: `INTJ` — *Nhà Kiến Tạo Chiến Lược*).
   - Tóm tắt tính cách, Điểm mạnh nổi bật, Điểm cần lưu ý, Môi trường làm việc lý tưởng, **Top 5–8 ngành nghề phù hợp cho sinh viên**, và thanh tỷ lệ % của 4 cặp trục.

---

## 2. Giao Diện & Lưu Lịch Sử

- **Màn hình Làm bài:** Thanh tiến độ (`Câu 12/40`), chuyển câu mượt mà, tự động lưu tạm vào `localStorage` để tránh lỡ tải lại trang, nút Quay lại / Tiếp theo / Nộp bài.
- **Màn hình Kết quả:** Huy hiệu nhóm MBTI nổi bật, 4 thanh progress bar đối xứng (`E ↔ I`, `S ↔ N`, `T ↔ F`, `J ↔ P`), phân tích chi tiết, nút **"Làm lại bài test"** và nút **"Tích hợp sang Lộ trình / Định hướng AI"** (gợi ý dẫn sang `/onboarding`).
- **Lưu lịch sử (`POST /api/tools/results` & `GET /api/tools/results?type=MBTI`):** Nếu sinh viên đã đăng nhập, tự động lưu kết quả vào `tool_results` và hiển thị tab "Lịch sử làm bài MBTI".

---

## 3. Tiêu Chí Chấp Thuận

- **AC-01:** Hoàn thành đủ 100% câu hỏi MBTI → trả về chính xác 1 trong 16 mã MBTI kèm % 4 trục (`E+I=100%`, `S+N=100%`, `T+F=100%`, `J+P=100%`).
- **AC-02:** Bấm Nộp bài khi còn câu chưa trả lời → chặn nộp và cuộn tới câu hỏi còn thiếu.
- **AC-03:** Sinh viên đã đăng nhập sau khi nộp bài thành công → reload trang vẫn xem lại được lịch sử kết quả từ `GET /api/tools/results?type=MBTI`.

