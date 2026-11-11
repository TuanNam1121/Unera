# Tính Năng: Danh Mục Chứng Chỉ & Ví Chứng Chỉ Cá Nhân (Certificate Wallet)

> **Mã SRS:** `FR-CERT-01`, `FR-CERT-02`, `FR-CERT-03`, `FR-CERT-04`, `FR-CERT-05`  
> **Trạng thái:** ![Kế hoạch theo SRS](https://img.shields.io/badge/-KẾ%20HOẠCH%20THEO%20SRS-amber)  
> **Thuộc cụm:** `12_CERTIFICATES_AND_ACTIVITIES`  
> **Tác nhân:** Sinh viên (Student), Quản trị viên (Admin)

---

## 1. Hiện Trạng Triển Khai
- Trong mô hình [`src/models/StudentProfile.ts`](file:///c:/Users/AD/OneDrive/Desktop/Project/ULIS_DMST_2026/src/models/StudentProfile.ts), mảng `certifications: [{ name, issuer, issueDate, expiryDate, score }]` đã được thiết kế sẵn.
- Cần triển khai trang tra cứu danh mục chứng chỉ chuẩn tại `/certificates` và khu vực Ví chứng chỉ số trong `/profile`.

---

## 2. Đặc Tả Nghiệp Vụ Theo SRS 1.0 (Specification)

### 2.1 Danh Mục Chứng Chỉ Chuẩn Hóa (FR-CERT-01, FR-CERT-02, FR-CERT-03)
- Tổng hợp các loại chứng chỉ cần thiết cho sinh viên ULIS:
  - **Chứng chỉ Ngoại ngữ:** IELTS, TOEFL iBT, TOEIC, VSTEP B1/B2/C1, HSK/HSKK, JLPT, TOPIK, DELF/DALF.
  - **Chứng chỉ Công nghệ Thông tin:** MOS (Word, Excel, PowerPoint), IC3, Google Analytics.
  - **Chứng chỉ Nghiệp vụ Sư phạm:** Nghiệp vụ sư phạm ngoại ngữ ĐHQGHN, TESOL, TEFL, CELTA.
  - **Chứng chỉ Biên - Phiên dịch & Kinh doanh:** Chứng chỉ nghiệp vụ biên phiên dịch, chứng chỉ xuất nhập khẩu logistics.
- Mỗi chứng chỉ hiển thị:
  - Đối tượng nên thi, thời hạn giá trị (ví dụ: 2 năm đối với IELTS/TOEIC; vĩnh viễn đối với MOS).
  - Lệ phí thi tham khảo và địa điểm đăng ký thi chính thức.
  - Nguồn tài liệu ôn tập, đề thi thử miễn phí (FR-CERT-03).

### 2.2 Ví Chứng Chỉ Cá Nhân & Tải Minh Chứng (FR-CERT-04, FR-CERT-05)
- Sinh viên có thể thêm chứng chỉ của bản thân vào "Ví chứng chỉ":
  - Tên chứng chỉ, tổ chức cấp (ví dụ: *British Council, IDP, Khoa Sau Đại học ULIS*).
  - Ngày cấp, ngày hết hạn.
  - Điểm số (Overall và điểm thành phần).
  - **Minh chứng (FR-CERT-05):** Cho phép tải lên file ảnh hoặc file PDF bằng chứng (chứng chỉ scan).
- **Cảnh báo hết hạn:** Tự động hiển thị huy hiệu đỏ khi chứng chỉ còn dưới 3 tháng hoặc đã hết hạn (giúp sinh viên chủ động ôn thi lại để không bị trễ hạn nộp hồ sơ tốt nghiệp / du học).
