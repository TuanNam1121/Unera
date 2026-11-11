# Tính Năng: Công Cụ Tính GPA & Quy Đổi Ngoại Ngữ Chuẩn ĐHQGHN (GPA & Language Converter)

> **Mã SRS:** `FR-TOOL-07`, `FR-TOOL-08`  
> **Trạng thái:** ![Kế hoạch theo SRS](https://img.shields.io/badge/-KẾ%20HOẠCH%20THEO%20SRS-amber)  
> **Thuộc cụm:** `11_STUDENT_TOOLS`  
> **Tác nhân:** Sinh viên (Student)

---

## 1. Hiện Trạng Triển Khai
- Cần triển khai công cụ tính toán tiện ích tại `/tools/calculators`.

---

## 2. Đặc Tả Nghiệp Vụ Theo SRS 1.0 (Specification)

### 2.1 Công Cụ Tính Điểm GPA Chuẩn ĐHQGHN (FR-TOOL-07)
- Quy chế đào tạo tín chỉ của Đại học Quốc gia Hà Nội:
  - Thang điểm chữ: `A+ (4.0)`, `A (3.7)`, `B+ (3.5)`, `B (3.0)`, `C+ (2.5)`, `C (2.0)`, `D+ (1.5)`, `D (1.0)`, `F (0.0)`.
  - Tính điểm trung bình học kỳ và tích lũy:
    $$\text{GPA} = \frac{\sum (\text{Điểm môn} \times \text{Số tín chỉ})}{\sum \text{Số tín chỉ}}$$
- Xếp loại học lực:
  - Xuất sắc: 3.60 - 4.00
  - Giỏi: 3.20 - 3.59
  - Khá: 2.50 - 3.19
  - Trung bình: 2.00 - 2.49
- Cho phép sinh viên nhập số tín chỉ và điểm từng môn học để tính nhanh điểm mục tiêu cần đạt trong các kỳ tới.

### 2.2 Bảng & Công Cụ Quy Đổi Chứng Chỉ Ngoại Ngữ (FR-TOOL-08)
- Bảng quy đổi tương đương theo Khung năng lực ngoại ngữ 6 bậc dùng cho Việt Nam (VSTEP) và các chứng chỉ quốc tế:
  - **Tiếng Anh:** VSTEP (B1, B2, C1), IELTS Academic (4.0 - 9.0), TOEIC (4 kỹ năng), TOEFL iBT.
  - **Tiếng Trung:** HSK 1 - HSK 6, HSKK.
  - **Tiếng Nhật:** JLPT N5 - N1.
  - **Tiếng Hàn:** TOPIK I - TOPIK II (Cấp 1 - Cấp 6).
- Tra cứu nhanh điều kiện chuẩn đầu ra ngoại ngữ của từng ngành học tại ULIS và điều kiện xét học bổng du học của các quốc gia tương ứng.
