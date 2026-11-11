# Tính Năng: Tích Hợp Lịch Sử Hoạt Động Vào Hồ Sơ Cá Nhân (Activity Profile Integration)

> **Mã SRS:** `FR-ACT-05`, `FR-ACT-07`  
> **Trạng thái:** ![Đã hoàn thành Schema](https://img.shields.io/badge/-ĐÃ%20HOÀN%20THÀNH%20SCHEMA-emerald)  
> **Thuộc cụm:** `12_CERTIFICATES_AND_ACTIVITIES`, `02_STUDENT_PROFILE`  
> **Tác nhân:** Sinh viên (Student)

---

## 1. Cách Thức Hoạt Động Hiện Tại (Implementation Details)

### 1.1 Cấu Trúc CSDL Profile
- Tệp nguồn mô hình: [`src/models/StudentProfile.ts`](file:///c:/Users/AD/OneDrive/Desktop/Project/ULIS_DMST_2026/src/models/StudentProfile.ts).
- Đã sẵn sàng các mảng lưu trữ:
  - `experiences`: Lưu trữ các hoạt động ngoại khóa, vị trí ban chủ nhiệm CLB, thực tập sinh.
  - `awards`: Lưu trữ các giải thưởng, học bổng, giấy khen NCKH.
  - `certifications`: Lưu trữ chứng chỉ ngoại ngữ và chuyên môn.
- Tệp giao diện: [`src/app/profile/page.tsx`](file:///c:/Users/AD/OneDrive/Desktop/Project/ULIS_DMST_2026/src/app/profile/page.tsx).

---

## 2. Đặc Tả Nghiệp Vụ Theo SRS 1.0 (Specification)

### 2.1 Đồng Bộ 1-Chạm Từ Hoạt Động Đã Tham Gia (FR-ACT-07)
- Khi sinh viên hoàn thành một hoạt động trên hệ thống (hoặc hoạt động ngoại khóa được Đoàn trường xác nhận):
  - Có nút "Thêm vào hồ sơ của tôi" (Add to Profile).
  - Tự động điền tên hoạt động, vai trò tham gia, tổ chức và khoảng thời gian vào tab "Kinh nghiệm & Hoạt động" trong Hồ sơ cá nhân.
- Giúp sinh viên không phải nhập lại thông tin thủ công khi tạo CV sau này.

### 2.2 Xem & Quản Lý Lịch Sử Hoạt Động (FR-ACT-05)
- Tab "Lịch sử hoạt động" trong trang cá nhân:
  - Hiển thị danh sách theo dòng thời gian (Timeline) từ năm thứ 1 đến năm thứ 4.
  - Tổng số giờ tình nguyện tích lũy, tổng điểm rèn luyện ước tính.
