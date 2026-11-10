# Đặc Tả Tính Năng: Trình Tạo CV Song Ngữ & Xuất PDF Chuẩn ATS

> **Mã tính năng:** `FR-TOOL-01`, `FR-TOOL-02`, `FR-TOOL-03`, `FR-TOOL-04`  
> **Thuộc cụm:** `11_STUDENT_TOOLS`  
> **Tác nhân:** Sinh viên (Student)  
> **Mức độ ưu tiên:** Quan trọng (P1)  

---

## 1. Nghiệp Vụ Tính Năng

1. **Trình dựng CV trực quan (CV Builder - FR-TOOL-01):**
   - Cung cấp form nhập liệu chia khối rõ ràng:
     - Khối thông tin cá nhân (Họ tên, Tiêu đề nghề nghiệp, Email, SĐT, LinkedIn/Portfolio).
     - Khối Mục tiêu nghề nghiệp / Tóm tắt bản thân.
     - Khối Học vấn (Trường, Ngành, GPA, Niên khóa).
     - Khối Kinh nghiệm làm việc & Hoạt động ngoại khóa.
     - Khối Kỹ năng chuyên môn & Ngoại ngữ.
     - Khối Thành tích & Chứng chỉ.
   - **Tự động kéo dữ liệu (Auto-fill):** Bấm "Điền từ hồ sơ" để tự động lấy Họ tên, Kỹ năng, Thành tích từ `StudentProfile` sang CV mà không cần gõ lại.
2. **Mẫu CV Song Ngữ (Bilingual Templates - FR-TOOL-02):**
   - Hỗ trợ chuyển đổi nhanh nhãn tiêu đề giữa **Tiếng Việt** (*Kinh nghiệm làm việc, Học vấn, Kỹ năng*) và **Tiếng Anh** (*Work Experience, Education, Skills*).
   - Thiết kế chuẩn ATS (Applicant Tracking Systems): Font chữ chuẩn (Inter / Arial / Roboto), bố cục 1 hoặc 2 cột mạch lạc, không dùng các bảng biểu phức tạp gây lỗi máy quét hồ sơ.
3. **Xuất PDF chuẩn (PDF Export - FR-TOOL-03):**
   - Sử dụng thư viện kết xuất PDF chuẩn in ấn (khổ giấy A4, lề chuẩn 15mm-20mm).
   - Tên file xuất tự động: `CV_[Ho_Ten]_[Ngay_Xuat].pdf`.
4. **Quản lý bản ghi CV (FR-TOOL-04 & OI-02):**
   - Sinh viên lưu trữ bản ghi CV trong tài khoản để chỉnh sửa lại sau.
   - Số lượng phiên bản CV được phép lưu trữ hiện tại là **TBD**; trong MVP hỗ trợ lưu tối thiểu 03 bản CV khác nhau.
