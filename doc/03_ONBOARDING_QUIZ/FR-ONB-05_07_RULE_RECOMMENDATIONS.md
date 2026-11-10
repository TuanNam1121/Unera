# Đặc Tả Tính Năng: Đánh Giá Rule-based & Đề Xuất 1 Đến 2 Hướng Đi

> **Mã tính năng:** `FR-ONB-05`, `FR-ONB-06`, `FR-ONB-07`  
> **Thuộc cụm:** `03_ONBOARDING_QUIZ`  
> **Tác nhân:** Hệ thống (System), Sinh viên (Student)  
> **Mức độ ưu tiên:** Bắt buộc (P0 - MVP)  
> **Trạng thái:** Confirmed Business Decision  

---

## 1. Cơ Chế Tính Điểm Định Hướng (Rule-based Algorithm)

Hệ thống định nghĩa danh mục các hướng phát triển:
- `study_abroad`: Du học & Học bổng quốc tế
- `multinational`: Tập đoàn đa quốc gia & Khối doanh nghiệp
- `management_trainee`: Quản trị viên tập sự
- `scientific_research`: Nghiên cứu khoa học & Học thuật

### Thuật toán chấm điểm:
1. Duyệt qua danh sách câu trả lời của sinh viên:
   $$\text{TotalScore}[D] = \sum_{q \in \text{Answers}} \text{OptionScore}[q.optionId][D]$$
   *(Trong đó $D$ là mã định hướng, $\text{OptionScore}$ là trọng số điểm cấu hình trong DB)*
2. Sắp xếp danh sách hướng đi theo tổng điểm giảm dần.
3. **Lựa chọn hướng đề xuất (FR-ONB-06 & BR-06):**
   - Đề xuất **hướng đi có điểm cao nhất** (Top 1).
   - Nếu hướng đứng thứ 2 (Top 2) có điểm chênh lệch không quá `15%` so với Top 1 hoặc thỏa mãn quy tắc cấu hình đồng hành, hệ thống sẽ đề xuất **cả 2 hướng đi** (ví dụ: *"Du học kết hợp Nghiên cứu khoa học"* hoặc *"Việc làm MNC kết hợp Quản trị viên tập sự"*).
4. **Giải thích kết quả (FR-ONB-07):**
   - Màn hình kết quả hiển thị lý do đề xuất dựa trên các câu trả lời sinh viên đã chọn (ví dụ: *"Bạn có năng lực ngoại ngữ tốt và thích môi trường học thuật chuyên sâu..."*).
   - Đưa ra danh sách các hành động cụ thể bước tiếp theo (Next Action Steps).
   - Nút liên kết: "Áp dụng định hướng này vào Lộ trình cá nhân" và "Xem các cơ hội phù hợp".

---

## 2. Tiêu Chí Chấp Thuận

- **AC-01:** Sinh viên nộp bài trắc nghiệm với điểm du học vượt trội nhận kết quả đề xuất hướng "Du học & Học bổng quốc tế" kèm lộ trình 3 bước chuẩn bị.
- **AC-02:** Thuật toán chạy hoàn toàn nội bộ thông qua mã lệnh TypeScript / MongoDB, không phụ thuộc vào kết nối bên ngoài hoặc API AI nào.
