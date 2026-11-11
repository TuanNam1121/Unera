# Tính Năng: Đánh Giá Điểm Rule-Based & Khuyến Nghị 5 Hướng Đi (Scoring Engine)

> **Mã SRS:** `FR-ONB-05`, `FR-ONB-06`, `FR-ONB-07`, `BR-05`  
> **Trạng thái:** ![Hoàn thành](https://img.shields.io/badge/-ĐÃ%20HOÀN%20THÀNH%20100%25-emerald)  
> **Thuộc cụm:** `03_ONBOARDING_QUIZ`  
> **Tác nhân:** Hệ thống (System), Sinh viên (Student)

---

## 1. Cách Thức Hoạt Động Hiện Tại (Implementation Details)

Hệ thống tính điểm định hướng dựa trên thuật toán tích lũy trọng số (Rule-based Scoring Matrix) hoàn toàn minh bạch và nhất quán:

### 1.1 5 Nhóm Định Hướng Phát Triển
1. `study_abroad`: Du học & Săn học bổng Quốc tế.
2. `employment`: Quản trị viên Tập sự & Doanh nghiệp Toàn cầu (MNCs).
3. `research`: Nghiên cứu Khoa học & Học thuật Chuyên sâu.
4. `startup`: Khởi nghiệp & Đổi mới Sáng tạo.
5. `skills`: Phát triển Năng lực Cá nhân & Kỹ năng Toàn diện.

### 1.2 Thuật Toán Tính Điểm
- Khi nộp bài, hệ thống duyệt qua từng câu trả lời `answers[questionId] = optionId`.
- Lấy bảng trọng số `scores` của option đó từ DB và cộng dồn vào tổng điểm 5 nhóm:
  ```typescript
  directionScores[direction] += option.scores[direction] || 0;
  ```
- Sắp xếp 5 nhóm định hướng theo điểm số giảm dần để tìm `Top 1` và `Top 2`.

### 1.3 Cơ Chế Khuyến Nghị Top 1 & Top 2 (`FR-ONB-06`)
- **Top 1:** Luôn luôn được chọn và vinh danh là *"Định hướng phù hợp nhất"*.
- **Top 2:** Tự động kích hoạt là *"Định hướng tiềm năng kế tiếp"* nếu điểm số của hướng thứ 2 có độ chênh lệch không quá 25% so với Top 1:
  $$\frac{\text{Score}_{\text{Top1}} - \text{Score}_{\text{Top2}}}{\text{Score}_{\text{Top1}}} \le 0.25$$

### 1.4 Giải Thích Kết Quả & Gợi Ý Hành Động Tiếp Theo (`FR-ONB-07`)
- Mỗi hướng đi có bộ metadata chuẩn gồm:
  - Tiêu đề & Giải thích thế mạnh cá nhân.
  - 3 bước hành động cụ thể cần làm ngay (ví dụ: Thi chứng chỉ ngoại ngữ, Viết SOP, Gia nhập nhóm NCKH...).
  - Biểu đồ thanh % điểm số của toàn bộ 5 hướng đi.
- **Tự động áp dụng vào Hồ sơ & Lộ trình:** Kết quả nộp bài tự động cập nhật vào `StudentProfile.developmentGoals` và khởi tạo bản ghi `Roadmap` mới mang `status: "ACTIVE"`.
