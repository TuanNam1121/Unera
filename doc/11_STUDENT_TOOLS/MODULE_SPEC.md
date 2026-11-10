# Cụm Tính Năng 11: Bộ Công Cụ Hỗ Trợ Sinh Viên (Student Tools)

> **Mã Module:** `TOOLS`  
> **Căn cứ SRS:** Mục 4.11 (FR-TOOL-01 đến FR-TOOL-12)  
> **Tác nhân:** Sinh viên (Student)  
> **Mục tiêu:** Cung cấp bộ tiện ích thiết yếu giải quyết các bài toán chuẩn bị hồ sơ du học, xin việc, quản lý điểm số và luyện tập kỹ năng.

---

## 1. Tổng Quan Nghiệp Vụ Cụm Tính Năng

Cụm công cụ gồm 6 tiện ích cốt lõi hỗ trợ sinh viên:
1. **Trình tạo CV song ngữ & Xuất PDF chuẩn (CV Builder - FR-TOOL-01, 02, 03, 04):**
   - Hỗ trợ tạo CV theo mẫu chuẩn cấu trúc (Harvard / ATS-friendly).
   - Hỗ trợ song ngữ Tiếng Việt và Tiếng Anh (`FR-TOOL-02`).
   - Tự động điền dữ liệu từ Hồ sơ sinh viên (Học vấn, Kỹ năng, Thành tích).
   - Xuất file định dạng PDF chuẩn in ấn và nộp hồ sơ.
2. **Mẫu thư Cover Letter & Motivation Letter (FR-TOOL-05):**
   - Thư viện mẫu thư xin việc, thư bày tỏ nguyện vọng cho học bổng và vị trí thực tập.
3. **Bảng Kanban Theo Dõi Ứng Tuyển (Application Kanban - FR-TOOL-06):**
   - Trực quan hóa tiến độ các bộ hồ sơ theo 7 cột trạng thái tương ứng.
4. **Máy tính điểm GPA & Quy đổi thang điểm (FR-TOOL-07):**
   - Công cụ tính điểm trung bình tích lũy theo thang điểm 4 và thang điểm 10.
5. **Công cụ quy đổi chứng chỉ Tiếng Anh (IELTS / TOEIC - FR-TOOL-08):**
   - Bảng tra cứu và quy đổi điểm tương đương tham khảo kèm tuyên bố miễn trừ trách nhiệm pháp lý.
6. **Dự toán chi phí du học & Ngân hàng câu hỏi phỏng vấn (FR-TOOL-09, 10):**
   - Ước tính chi phí sinh hoạt & học phí theo quốc gia (Anh, Mỹ, Úc, Nhật...).
   - Ngân hàng câu hỏi phỏng vấn thử chia theo nhóm năng lực (Behavioral, Competency).
7. **Ranh giới sản phẩm (Out of Scope - FR-TOOL-11, 12):**
   - Tính năng AI CV Review và AI Career Chatbot là tiện ích mở rộng tương lai, **không nằm trong phạm vi phiên bản 1.0**.

---

## 2. Danh Mục Các Tính Năng Chi Tiết

| Mã Tính Năng | Tên Tính Năng | File Đặc Tả |
|---|---|---|
| **FR-TOOL-01 đến 04** | Trình tạo CV song ngữ & Xuất PDF chuẩn ATS | [`FR-TOOL-01_04_CV_BUILDER.md`](./FR-TOOL-01_04_CV_BUILDER.md) |
| **FR-TOOL-05** | Mẫu thư xin việc & Thư bày tỏ nguyện vọng | [`FR-TOOL-05_LETTER_TEMPLATES.md`](./FR-TOOL-05_LETTER_TEMPLATES.md) |
| **FR-TOOL-06** | Bảng Kanban theo dõi ứng tuyển trực quan | [`FR-TOOL-06_APPLICATION_KANBAN.md`](./FR-TOOL-06_APPLICATION_KANBAN.md) |
| **FR-TOOL-07 & 08** | Máy tính GPA & Bảng quy đổi điểm IELTS/TOEIC | [`FR-TOOL-07_08_CALCULATORS.md`](./FR-TOOL-07_08_CALCULATORS.md) |
| **FR-TOOL-09 & 10** | Dự toán chi phí du học & Ngân hàng câu hỏi phỏng vấn | [`FR-TOOL-09_10_ESTIMATOR_INTERVIEW.md`](./FR-TOOL-09_10_ESTIMATOR_INTERVIEW.md) |
