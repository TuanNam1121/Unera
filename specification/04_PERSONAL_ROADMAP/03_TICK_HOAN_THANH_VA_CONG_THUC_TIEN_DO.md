# Tính Năng: Tick Hoàn Thành Nhiệm Vụ & Công Thức Tiến Độ (Task Progress Engine)

> **Mã SRS:** `FR-RM-05`, `FR-RM-06`, `FR-RM-07`  
> **Trạng thái:** ![Hoàn thành](https://img.shields.io/badge/-ĐÃ%20HOÀN%20THÀNH%20100%25-emerald)  
> **Thuộc cụm:** `04_PERSONAL_ROADMAP`  
> **Tác nhân:** Sinh viên (Student)

---

## 1. Cách Thức Hoạt Động Hiện Tại (Implementation Details)

### 1.1 Tương Tác Checkbox Với Cập Nhật Lạc Quan (Optimistic UI - `FR-RM-05, 06`)
- Khi sinh viên bấm tick vào một nhiệm vụ (ví dụ: *"Đạt GPA 3.5+ Năm 2"* hoặc *"Thi IELTS 7.5"*):
  1. Giao diện đổi ngay sang trạng thái hoàn thành (dấu tích xanh, gạch ngang tiêu đề).
  2. Phần trăm tiến độ trên Widget tổng quan tự động nhảy số ngay lập tức (ví dụ từ `25%` lên `33%`).
  3. Gửi ngầm request `PATCH /api/roadmap` `{ taskId, completed: true }`.
  4. Nếu có lỗi mạng, giao diện tự động khôi phục lại trạng thái cũ và báo lỗi.

### 1.2 Công Thức Tính Tiến Độ Tự Động (`FR-RM-07`)
- Mongoose middleware `pre("save")` trong [`src/models/Roadmap.ts`](file:///c:/Users/AD/OneDrive/Desktop/Project/ULIS_DMST_2026/src/models/Roadmap.ts) tự động duyệt toàn bộ cây năm học để đếm `completedTasks` và `totalTasks`:
  $$\text{ProgressPercent} = \begin{cases} 0 & \text{nếu } \text{TotalTasks} = 0 \\ \operatorname{round}\left( \dfrac{\text{CompletedTasks}}{\text{TotalTasks}} \times 100 \right) & \text{nếu } \text{TotalTasks} > 0 \end{cases}$$
- Đảm bảo tính toán hoàn toàn tự động ở server, sinh viên không thể gian lận hoặc can thiệp số liệu tiến độ.

### 1.3 Thêm Nhiệm Vụ Tùy Chỉnh Vào Cột Mốc
- Bấm nút **"+ Thêm việc"** trong cột mốc &rarr; Mở ô nhập nhanh &rarr; Gọi `POST /api/roadmap` lưu đầu việc mới vào CSDL.
