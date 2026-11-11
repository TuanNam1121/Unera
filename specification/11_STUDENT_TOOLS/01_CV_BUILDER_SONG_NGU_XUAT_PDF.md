# Tính Năng: Trình Tạo CV Song Ngữ Chuẩn ATS & Xuất PDF (Bilingual CV Builder & PDF Export)

> **Mã SRS:** `FR-TOOL-01`, `FR-TOOL-02`, `FR-TOOL-03`, `FR-TOOL-04`  
> **Trạng thái:** ![Kế hoạch theo SRS](https://img.shields.io/badge/-KẾ%20HOẠCH%20THEO%20SRS-amber)  
> **Thuộc cụm:** `11_STUDENT_TOOLS`  
> **Tác nhân:** Sinh viên (Student)

---

## 1. Hiện Trạng Triển Khai
- Mục "Công cụ sinh viên" (`/tools`) đã được tích hợp trong hệ thống điều hướng `Topbar.tsx` và `Sidebar.tsx`.
- Cần triển khai trang trình tạo CV trực quan (`/tools/cv-builder`).

---

## 2. Đặc Tả Nghiệp Vụ Theo SRS 1.0 (Specification)

### 2.1 Mẫu CV Song Ngữ Thiết Kế Chuẩn ATS (FR-TOOL-01, FR-TOOL-02)
- Hỗ trợ 2 ngôn ngữ: **Tiếng Việt** và **Tiếng Anh** (phù hợp với đặc thù sinh viên ngoại ngữ ULIS).
- Gồm các khối nội dung chuẩn:
  1. **Thông tin cá nhân (Header):** Họ tên, chức danh hướng tới, email, số điện thoại, LinkedIn/Portfolio, địa chỉ.
  2. **Tóm tắt năng lực (Summary):** 3-4 câu đúc kết thế mạnh.
  3. **Học vấn (Education):** Trường Đại học Ngoại ngữ - ĐHQGHN, ngành học, niên khóa, GPA (nếu cao).
  4. **Kinh nghiệm làm việc / Thực tập (Experience):** Công ty, vị trí, thời gian, danh sách thành tích dạng bullet point (động từ hành động + số liệu định lượng).
  5. **Hoạt động ngoại khóa & Dự án (Activities & Projects):** CLB, tình nguyện, nghiên cứu khoa học.
  6. **Kỹ năng & Chứng chỉ (Skills & Certifications):** Ngoại ngữ (IELTS, HSK, JLPT, TOPIK), kỹ năng số (Canva, Office, SPSS, dịch thuật).

### 2.2 Trình Xem Trước & Xuất PDF (FR-TOOL-03)
- Giao diện chia đôi màn hình (Split screen):
  - Bên trái: Form nhập liệu có gợi ý cú pháp chuẩn ATS.
  - Bên phải: Bản xem trước thời gian thực (Live Preview) chuẩn khổ giấy A4.
- Nút "Tải file PDF": Sử dụng thư viện client-side hoặc server-side rendering (e.g. `@react-pdf/renderer` hoặc Puppeteer) để xuất ra file PDF vector sắc nét, văn bản có thể chọn (selectable text) để máy quét ATS đọc được, không xuất dưới dạng ảnh scan.

### 2.3 Quản Lý Bản CV (FR-TOOL-04)
- Cho phép sinh viên lưu nhiều bản CV tương ứng với các hướng đi khác nhau (ví dụ: *CV Biên dịch*, *CV Giảng dạy tiếng Anh*, *CV Marketing*).
