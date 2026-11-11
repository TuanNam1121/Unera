# Tính Năng: Bảng Theo Dõi Tiến Trình Ứng Tuyển Dạng Kanban (Application Tracker)

> **Mã SRS:** `FR-APP-04`, `FR-APP-06`, `FR-APP-07`  
> **Trạng thái:** ![Kế hoạch theo SRS](https://img.shields.io/badge/-KẾ%20HOẠCH%20THEO%20SRS-amber)  
> **Thuộc cụm:** `07_SAVED_AND_APPLICATIONS`  
> **Tác nhân:** Sinh viên (Student)

---

## 1. Hiện Trạng Triển Khai
- Schema [`src/models/Application.ts`](file:///c:/Users/AD/OneDrive/Desktop/Project/ULIS_DMST_2026/src/models/Application.ts) đã được thiết kế đầy đủ trường dữ liệu.

---

## 2. Đặc Tả Giao Diện & Nghiệp Vụ Theo SRS 1.0 (Specification)

### 2.1 Giao Diện Bảng Kanban (`/applications`)
- Cung cấp 5 cột trực quan tương ứng với các chặng ứng tuyển:
  1. **Đang Chuẩn Bị (Preparing):** Hồ sơ đang viết CV, dịch thuật, xin thư giới thiệu.
  2. **Đã Nộp Đơn (Submitted):** Đã gửi hồ sơ qua email/portal của đơn vị tổ chức, chờ phản hồi.
  3. **Phỏng Vấn (Interviewing):** Đang trong các vòng phỏng vấn 1, vòng 2 hoặc làm Case Study.
  4. **Trúng Tuyển (Accepted):** Đã nhận Offer / Học bổng thành công.
  5. **Bị Từ Chối (Rejected):** Không trúng tuyển đợt này.

### 2.2 Thao Tác Kéo Thả & Ghi Chú Cá Nhân
- Sinh viên có thể kéo thả thẻ ứng tuyển giữa các cột để đổi trạng thái.
- Mỗi thẻ ứng tuyển có ô nhập ghi chú cá nhân (ví dụ: *"Ngày 20/12 làm bài test online, link test gửi qua email"*).
- Mảng lịch sử `history: [{ status, updatedAt, note }]` tự động lưu lại mốc thời gian chuyển cột.
