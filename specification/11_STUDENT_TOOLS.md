# Cụm Tính Năng 11: Bộ Công Cụ Sinh Viên (Student Tools)

> **Mã SRS:** `FR-TOOL-01` đến `FR-TOOL-06`  
> **Trạng thái:** ![Kế hoạch](https://img.shields.io/badge/-KẾ%20HOẠCH%20THEO%20SRS-amber)  
> **Tác nhân:** Sinh viên (Student)

---

## 1. Mục Tiêu & Mô Tả Nghiệp Vụ Theo SRS 1.0

Cung cấp các công cụ tiện ích hỗ trợ sinh viên trong quá trình chuẩn bị hồ sơ ứng tuyển và tính toán tài chính cá nhân khi đi làm:

### 1.1 Công Cụ Tạo CV Chuẩn ATS (`/tools/cv-builder` - `FR-TOOL-01`)
- **Mục đích:** Cho phép sinh viên tạo CV chuyên nghiệp, chuẩn form ATS (Applicant Tracking System) dễ đọc cho nhà tuyển dụng quốc tế và trong nước.
- **Tính năng:**
  - Tự động điền trước (pre-fill) dữ liệu từ `StudentProfile` (Họ tên, Trường, Ngành, Kỹ năng, Thành tích).
  - Chọn mẫu giao diện CV tinh gọn (Clean Minimalist / Academic / Professional).
  - Xuất file định dạng PDF chuẩn in ấn.
- **Ranh giới:** Không tích hợp AI sinh nội dung CV trong MVP 1.0.

### 1.2 Công Cụ Tính Lương Gross - Net (`/tools/gross-net` - `FR-TOOL-03`)
- **Mục đích:** Giúp sinh viên mới tốt nghiệp hoặc đi thực tập hiểu rõ cơ cấu tiền lương thực nhận (Net) so với lương thỏa thuận (Gross).
- **Công thức quy chuẩn Việt Nam:**
  - Bảo hiểm xã hội (BHXH): 8%
  - Bảo hiểm y tế (BHYT): 1.5%
  - Bảo hiểm thất nghiệp (BHTN): 1%
  - Mức giảm trừ gia cảnh bản thân: 11,000,000 VNĐ/tháng
  - Mức giảm trừ người phụ thuộc: 4,400,000 VNĐ/người/tháng.
- **Giao diện:** Bảng tính 2 chiều (Gross &rarr; Net và Net &rarr; Gross) kèm bảng giải trình chi tiết từng khoản khấu trừ.

### 1.3 Công Cụ Tính Thuế Thu Nhập Cá Nhân (`/tools/tax` - `FR-TOOL-04`)
- **Mục đích:** Tính toán số tiền thuế TNCN phải nộp dựa trên biểu thuế lũy tiến từng phần (từ 5% đến 35%) theo luật thuế hiện hành tại Việt Nam.

### 1.4 Trắc Nghiệm Tính Cách & Đa Trí Thông Minh (`/tools/mbti`, `/tools/mi` - `FR-TOOL-05, 06`)
- Cung cấp bộ câu hỏi khảo sát tính cách MBTI và Thuyết Đa trí thông minh (Howard Gardner) giúp sinh viên tự thấu hiểu bản thân ngoài phạm vi bài trắc nghiệm Onboarding chính.

---

## 2. Kế Hoạch Triển Khai Kỹ Thuật

1. Tạo thư mục trang:
   - `src/app/tools/cv-builder/page.tsx`
   - `src/app/tools/gross-net/page.tsx`
   - `src/app/tools/tax/page.tsx`
2. Tạo thư viện tiện ích tính toán tài chính: `src/lib/calculators/salary.ts` và `src/lib/calculators/tax.ts`.
