# Cụm Tính Năng 07: Cơ Hội Đã Lưu & Theo Dõi Tiến Trình Ứng Tuyển (Saved Opportunities & Application Tracking)

> **Mã SRS:** `FR-APP-01` đến `FR-APP-10`  
> **Trạng thái:** ![Đã có API & Model](https://img.shields.io/badge/-ĐÃ%20CÓ%20API%20%26%20MODEL-blue) *(Cần hoàn thiện giao diện Kanban sinh viên)*  
> **Tác nhân:** Sinh viên (Student)

---

## 1. Cách Thức Hoạt Động Hiện Tại (Current Implementation)

### 1.1 Cơ Hội Đã Lưu (Saved Opportunities)
- **Đã hoàn thành:**
  - Nút Bookmark trên các thẻ cơ hội tại `/explore` và bài viết tại `/news`.
  - Nút "Bài viết đã lưu" / "Cơ hội đã lưu" trên thanh tiêu đề.
  - **Mô hình dữ liệu:** [`src/models/SavedOpportunity.ts`](file:///c:/Users/AD/OneDrive/Desktop/Project/ULIS_DMST_2026/src/models/SavedOpportunity.ts) (`studentId`, `opportunityId`, `createdAt`).
  - **API:**
    - `GET /api/saved`: Lấy danh sách cơ hội sinh viên đã lưu.
    - `POST /api/saved`: Thêm cơ hội vào danh sách lưu.
    - `DELETE /api/saved`: Hủy lưu cơ hội.

### 1.2 Mô Hình Theo Dõi Ứng Tuyển (Application Tracking - `FR-APP-03..07`)
- **Đã hoàn thành Schema:** [`src/models/Application.ts`](file:///c:/Users/AD/OneDrive/Desktop/Project/ULIS_DMST_2026/src/models/Application.ts)
  - Vòng đời trạng thái ứng tuyển:
    1. `SAVED`: Cơ hội đã lưu.
    2. `PREPARING`: Đang chuẩn bị hồ sơ.
    3. `SUBMITTED`: Đã nộp hồ sơ.
    4. `INTERVIEWING`: Đang trong vòng phỏng vấn.
    5. `ACCEPTED`: Đã trúng tuyển / Nhận học bổng.
    6. `REJECTED`: Bị từ chối.
    7. `WITHDRAWN`: Chủ động rút hồ sơ.
  - Mảng lịch sử kiểm toán `history: [{ status, updatedAt, note }]` ghi nhận toàn bộ các bước chuyển đổi trạng thái của sinh viên.

---

## 2. Kế Hoạch Triển Khai Tiếp Theo (Upcoming Implementation)

Dựa trên yêu cầu của SRS 1.0, tính năng cần tiếp tục bổ sung:
1. **Giao diện Bảng Theo Dõi Ứng Tuyển (`/applications`):**
   - Xây dựng bảng Kanban hoặc danh sách theo 5 cột trạng thái: *Đang chuẩn bị*, *Đã nộp đơn*, *Phỏng vấn*, *Kết quả (Đậu/Trượt)*.
   - Thao tác kéo thả hoặc bấm nút chuyển trạng thái một cách mượt mà.
   - Hộp thoại ghi chú cá nhân (ví dụ: *"Ngày 15/12 phỏng vấn vòng 2 với Giám đốc Nhân sự"*).
2. **APIs Bổ Sung:**
   - `GET /api/applications`: Lấy danh sách hồ sơ ứng tuyển của sinh viên.
   - `POST /api/applications`: Tạo hồ sơ ứng tuyển từ một cơ hội.
   - `PATCH /api/applications/[id]`: Cập nhật trạng thái và ghi chú.
