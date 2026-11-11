# Tính Năng: Quản Trị Cây Lộ Trình Khung Mẫu 4 Năm (Admin Roadmap Template Management)

> **Mã SRS:** `FR-ADM-11`, `FR-RM-15`  
> **Trạng thái:** ![Đã hoàn thành Schema](https://img.shields.io/badge/-ĐÃ%20HOÀN%20THÀNH%20SCHEMA-emerald)  
> **Thuộc cụm:** `15_ADMIN_CMS_AND_AUDIT`, `04_PERSONAL_ROADMAP`  
> **Tác nhân:** Quản trị viên (Admin)

---

## 1. Cách Thức Hoạt Động Hiện Tại (Implementation Details)

### 1.1 Cấu Trúc Mô Hình CSDL Khung Mẫu
- Tệp nguồn mô hình: [`src/models/RoadmapTemplate.ts`](file:///c:/Users/AD/OneDrive/Desktop/Project/ULIS_DMST_2026/src/models/RoadmapTemplate.ts).
- Cung cấp khung mẫu 4 năm học chuẩn hóa cho các hướng đi chính:
  - Du học & Học bổng quốc tế (`STUDY_ABROAD`).
  - Biên - Phiên dịch chuyên nghiệp (`TRANSLATION`).
  - Sư phạm & Giảng dạy ngoại ngữ (`TEACHING`).
  - Kinh doanh quốc tế, Marketing & Logistics (`BUSINESS`).
  - Khởi nghiệp & Lãnh đạo (`ENTREPRENEURSHIP`).
- Cấu trúc cây phân cấp:
  - `years`: Mảng 4 năm đại học (Năm 1, Năm 2, Năm 3, Năm 4).
  - `milestones`: Các cột mốc lớn trong từng năm.
  - `tasks`: Các nhiệm vụ cụ thể cần hoàn thành (điểm GPA, chứng chỉ, bài luận, thực tập).

---

## 2. Đặc Tả Nghiệp Vụ Theo SRS 1.0 (Specification)

### 2.1 Giao Diện Admin Quản Trị Khung Mẫu (`/admin/roadmaps`)
- Cho phép Quản trị viên:
  - Chọn hướng đi nghề nghiệp để xem cây lộ trình khung mẫu.
  - Thêm, sửa, xóa hoặc sắp xếp thứ tự các cột mốc và nhiệm vụ.
  - Thiết lập thuộc tính `isMandatory` (bắt buộc) hoặc `isElective` (tùy chọn) cho từng nhiệm vụ.
  - Xem trước lộ trình sinh viên sẽ nhìn thấy sau khi hoàn thành Quiz định hướng.

### 2.2 Quy Trình Áp Dụng Thay Đổi (FR-RM-15)
- Khi Admin cập nhật khung mẫu lộ trình:
  - Khung mẫu mới sẽ được áp dụng ngay cho tất cả sinh viên mới làm Quiz hoặc chọn hướng đi sau thời điểm đó.
  - Đối với các sinh viên đã có lộ trình cá nhân đang chạy: Giữ nguyên lộ trình hiện tại của sinh viên để không làm xáo trộn tiến độ đã đánh dấu hoàn thành, trừ khi sinh viên chủ động chọn "Tạo lại lộ trình theo mục tiêu mới".
