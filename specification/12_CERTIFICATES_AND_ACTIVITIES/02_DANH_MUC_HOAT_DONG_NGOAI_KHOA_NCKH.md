# Tính Năng: Danh Mục Hoạt Động Ngoại Khóa & NCKH (Extracurricular & Research Catalog)

> **Mã SRS:** `FR-ACT-01`, `FR-ACT-02`, `FR-ACT-03`, `FR-ACT-04`  
> **Trạng thái:** ![Kế hoạch theo SRS](https://img.shields.io/badge/-KẾ%20HOẠCH%20THEO%20SRS-amber)  
> **Thuộc cụm:** `12_CERTIFICATES_AND_ACTIVITIES`  
> **Tác nhân:** Sinh viên (Student), Quản trị viên (Admin)

---

## 1. Hiện Trạng Triển Khai
- Hiện tại các hoạt động ngoại khóa có thể được đăng thông qua mục Cơ hội [`src/models/Opportunity.ts`](file:///c:/Users/AD/OneDrive/Desktop/Project/ULIS_DMST_2026/src/models/Opportunity.ts) phân loại `VOLUNTEER` hoặc `COMPETITION`.
- Cần chuẩn hóa giao diện danh mục hoạt động chuyên biệt tại `/activities`.

---

## 2. Đặc Tả Nghiệp Vụ Theo SRS 1.0 (Specification)

### 2.1 Danh Mục Hoạt Động Phong Trào & Khoa Học (FR-ACT-01)
- Phân nhóm hoạt động:
  1. **Nghiên cứu khoa học sinh viên (Student Research):** Hội nghị NCKH sinh viên các cấp (Cấp Khoa, Cấp Trường, Cấp ĐHQGHN, Giải thưởng Sinh viên NCKH Euréka).
  2. **Cuộc thi học thuật & Tài năng:** Hùng biện tiếng Anh/tiếng Trung/tiếng Nhật/tiếng Hàn, Cuộc thi Khởi nghiệp sáng tạo, Cuộc thi Dịch thuật trẻ.
  3. **Hoạt động Đoàn - Hội & Tình nguyện:** Chiến dịch Mùa hè xanh, Tiếp sức mùa thi, CLB Tiếng Anh, CLB Kỹ năng mềm, Hiến máu nhân đạo.
  4. **Chương trình Lãnh đạo trẻ & Giao lưu văn hóa quốc tế:** YSEALI, Jenesys, ASEAN Youth Summit.

### 2.2 Chi Tiết Quyền Lợi & Đăng Ký (FR-ACT-02, FR-ACT-03)
- Thông tin minh bạch:
  - Điểm rèn luyện quy đổi (theo quy chế rèn luyện của trường ĐH Ngoại ngữ).
  - Tiêu chuẩn xét duyệt danh hiệu "Sinh viên 5 tốt" (Đạo đức tốt, Học tập tốt, Thể lực tốt, Tình nguyện tốt, Hội nhập tốt).
  - Thời hạn đăng ký, đối tượng tham gia, đường dẫn biểu mẫu đăng ký chính thức của Ban tổ chức.
- **Lưu hoạt động (FR-ACT-04):** Sinh viên có thể bấm "Lưu hoạt động" để theo dõi và chuẩn bị thời gian tham gia.
