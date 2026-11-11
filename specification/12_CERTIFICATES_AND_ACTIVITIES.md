# Cụm Tính Năng 12: Quản Lý Chứng Chỉ & Hoạt Động Ngoại Khóa (Certificates & Student Activities)

> **Mã SRS:** `FR-CERT-01` đến `FR-CERT-08`, `FR-ACT-01` đến `FR-ACT-07`  
> **Trạng thái:** ![Kế hoạch](https://img.shields.io/badge/-KẾ%20HOẠCH%20THEO%20SRS-amber)  
> **Tác nhân:** Sinh viên (Student), Quản trị viên (Admin)

---

## 1. Mục Tiêu & Mô Tả Nghiệp Vụ Theo SRS 1.0

### 1.1 Quản Lý Chứng Chỉ Chuẩn Hóa (`FR-CERT-01..08`)
- **Phân loại danh mục chứng chỉ:**
  1. *Chứng chỉ Ngoại ngữ:* IELTS, TOEFL, TOEIC, HSK (Tiếng Trung), JLPT (Tiếng Nhật), TOPIK (Tiếng Hàn), DELF (Tiếng Pháp)...
  2. *Chứng chỉ Nghề nghiệp:* Sư phạm / Giảng dạy (TESOL, CELTA), Biên phiên dịch, Kế toán - Tài chính (ACCA, CFA), Tin học (MOS, IC3), Quản trị dự án (PMP).
- **Tính năng cho Sinh viên (`/certificates`):**
  - Thêm mới chứng chỉ: Tên chứng chỉ, Đơn vị cấp, Ngày cấp, Ngày hết hạn, Điểm số đạt được (Band/Overall), Tải lên tệp ảnh/PDF minh chứng bằng chứng chỉ.
  - Cảnh báo chứng chỉ sắp hết hạn (trước 90 ngày).
- **Tính năng cho Admin (`/admin/certificates`):**
  - Quản lý danh mục chứng chỉ được công nhận trong hệ thống.

### 1.2 Quản Lý Hoạt Động Ngoại Khóa & Trải Nghiệm Sinh Viên (`FR-ACT-01..07`)
- **Phân loại hoạt động:**
  1. *Nghiên cứu khoa học (NCKH):* Đề tài sinh viên nghiên cứu, báo cáo hội nghị, bài báo học thuật.
  2. *Management Trainee & Thi tuyển:* Các kỳ thi tuyển dụng tài năng của các tập đoàn.
  3. *Các cuộc thi học thuật & Khởi nghiệp:* Hackathon, Case Competition, Hult Prize, SV Khởi nghiệp.
  4. *Chương trình Đại sứ sinh viên:* Đại sứ trường, Đại sứ thương hiệu đối tác.
  5. *Học bổng sinh viên:* Học bổng khuyến khích học tập, học bổng doanh nghiệp.
  6. *Hoạt động tình nguyện & Câu lạc bộ:* Ban chủ nhiệm CLB, tình nguyện viên Mùa hè xanh.
- **Tính năng cho Sinh viên (`/activities`):**
  - Lưu hồ sơ kinh nghiệm hoạt động ngoại khóa để tự động đồng bộ sang CV chuẩn ATS và Hồ sơ sinh viên.

---

## 2. Kế Hoạch Triển Khai Kỹ Thuật

1. Tạo models:
   - `src/models/Certificate.ts`
   - `src/models/StudentActivity.ts`
2. Tạo APIs:
   - `/api/certificates`
   - `/api/activities`
3. Tạo giao diện:
   - `src/app/certificates/page.tsx`
   - `src/app/activities/page.tsx`
