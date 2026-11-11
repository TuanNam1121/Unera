# Tính Năng: Danh Bạ & Tìm Kiếm Cố Vấn (Mentor Directory & Search)

> **Mã SRS:** `FR-MEN-01`, `FR-MEN-02`, `FR-MEN-03`  
> **Trạng thái:** ![Kế hoạch theo SRS](https://img.shields.io/badge/-KẾ%20HOẠCH%20THEO%20SRS-amber)  
> **Thuộc cụm:** `10_MENTOR_CONNECTION`  
> **Tác nhân:** Sinh viên (Student), Khách truy cập (Guest)

---

## 1. Hiện Trạng Triển Khai
- Mô hình dữ liệu đã có: [`src/models/MentorProfile.ts`](file:///c:/Users/AD/OneDrive/Desktop/Project/ULIS_DMST_2026/src/models/MentorProfile.ts) gồm:
  - `name`: Họ tên cố vấn.
  - `avatar`: Ảnh đại diện.
  - `position`: Chức danh / Nghề nghiệp.
  - `organization`: Đơn vị công tác (Doanh nghiệp, viện nghiên cứu, trường đại học).
  - `expertise`: Mảng thẻ chuyên môn (e.g. `['Du học Mỹ', 'Biên phiên dịch', 'EdTech']`).
  - `bio`: Tiểu sử chi tiết.
  - `topics`: Các chủ đề tư vấn sẵn sàng hỗ trợ.
  - `isActive`: Trạng thái hiển thị.
- Cần xây dựng giao diện hiển thị danh bạ tại `/mentors`.

---

## 2. Đặc Tả Nghiệp Vụ Theo SRS 1.0 (Specification)

### 2.1 Giao Diện Danh Bạ Cố Vấn (`/mentors`)
- Hiển thị danh sách card thông tin cố vấn:
  - Ảnh chân dung chuyên nghiệp.
  - Họ và tên, chức danh hiện tại, tổ chức/doanh nghiệp.
  - Các huy hiệu chuyên môn (`Badges`).
  - Nút "Xem hồ sơ chi tiết" và nút "Đặt lịch tư vấn".

### 2.2 Bộ Lọc & Tìm Kiếm (FR-MEN-03)
- Tìm kiếm tức thì theo từ khóa: Tên cố vấn, lĩnh vực cố vấn.
- Bộ lọc lĩnh vực chuyên môn:
  - Du học & Học bổng quốc tế.
  - Định hướng Biên - Phiên dịch chuyên nghiệp.
  - Sư phạm & Giảng dạy ngoại ngữ.
  - Kinh doanh quốc tế, Marketing & Logistics.
  - Công nghệ & EdTech.

### 2.3 Chi Tiết Hồ Sơ Cố Vấn (FR-MEN-02)
- Khi ấn vào từng cố vấn, hiển thị modal hoặc trang chi tiết:
  - Kinh nghiệm làm việc, học vấn.
  - Các dự án / thành tích tiêu biểu.
  - Danh sách các chủ đề cố vấn có thể hỗ trợ giải đáp cho sinh viên ULIS.
