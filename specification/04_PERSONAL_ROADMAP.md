# Cụm Tính Năng 04: Lộ Trình Phát Triển Cá Nhân Hóa (Personal Roadmap)

> **Mã SRS:** `FR-RM-01` đến `FR-RM-16`  
> **Trạng thái:** ![Hoàn thành MVP](https://img.shields.io/badge/-ĐÃ%20HOÀN%20THÀNH%20(MVP)-emerald)  
> **Tác nhân:** Sinh viên (Student), Hệ thống (System)

---

## 1. Cách Thức Hoạt Động Hiện Tại (Current Implementation)

Lộ trình cá nhân hóa là khung xương định hướng 4 năm đại học giúp sinh viên chuyển hóa mục tiêu thành các hành động cụ thể:

### 1.1 Ràng Buộc Bất Biến Duy Nhất 1 Active Roadmap (`FR-RM-01, 02`, `BR-07`)
- Mỗi sinh viên tại mọi thời điểm chỉ sở hữu tối đa **01 bản ghi `Roadmap` có `status: "ACTIVE"`**.
- Mọi truy vấn giao diện đều lọc theo `{ studentId, status: "ACTIVE" }`.
- Khi sinh viên đổi mục tiêu hoặc nộp lại trắc nghiệm, hệ thống lưu trữ bản ghi hiện tại (`status = "ARCHIVED"`) trước khi tạo bản ghi mới.

### 1.2 Giao Diện Lộ Trình Cá Nhân (`/roadmap`)
- **Tệp mã nguồn:** [`src/app/roadmap/page.tsx`](file:///c:/Users/AD/OneDrive/Desktop/Project/ULIS_DMST_2026/src/app/roadmap/page.tsx)
- **Khối Hero Progress:**
  - Tiêu đề mục tiêu (ví dụ: *"Trở thành Du học sinh Mỹ & Học bổng Toàn phần"*).
  - Tỷ lệ phần trăm hoàn thành lớn (ví dụ: `67%`), thanh tiến độ bo tròn xanh dương, số bước hoàn thành (`8 / 12 bước hoàn tất`).
- **Bộ Lọc Đa Chiều:**
  - Tab theo năm: *Tất cả 4 năm*, *Năm 1*, *Năm 2*, *Năm 3*, *Năm 4*.
  - Lọc trạng thái đầu việc: *Toàn bộ*, *Cần làm*, *Đã xong*.
- **Tương Tác Nhiệm Vụ (Task Progress - `FR-RM-05, 06, 07`):**
  - Checkbox hoàn thành nhiệm vụ với cơ chế **Cập nhật lạc quan (Optimistic UI)**: khi sinh viên tick vào một đầu việc, thanh tiến độ và số lượng bước hoàn tất tự động nhảy số ngay lập tức mà không cần tải lại trang.
  - Tích hợp thêm nhiệm vụ phụ tùy chỉnh vào từng cột mốc (Milestone).

### 1.3 Đồng Bộ Với Trang Chủ Dashboard (`/`)
- Component [`src/components/home/HomeRoadmapCard.tsx`](file:///c:/Users/AD/OneDrive/Desktop/Project/ULIS_DMST_2026/src/components/home/HomeRoadmapCard.tsx) trên trang chủ tự động tải dữ liệu lộ trình active của sinh viên, hiển thị tiến độ và nhiệm vụ tiếp theo cần làm.

### 1.4 Công Thức Tính Tiến Độ Hoàn Thành Tự Động (`FR-RM-07`)
- Được tích hợp trực tiếp qua hook `pre("save")` trong [`src/models/Roadmap.ts`](file:///c:/Users/AD/OneDrive/Desktop/Project/ULIS_DMST_2026/src/models/Roadmap.ts):
  $$\text{ProgressPercent} = \text{round}\left( \frac{\text{CompletedTasks}}{\text{TotalTasks}} \times 100 \right)$$
- Tự động đồng bộ mỗi khi sinh viên tick/bỏ tick đầu việc.

### 1.5 Backend APIs
- **`GET /api/roadmap`:** Lấy lộ trình đang kích hoạt của sinh viên. Nếu chưa có, tự động sinh lộ trình 4 năm chuẩn dựa trên mục tiêu hồ sơ.
- **`PATCH /api/roadmap`:** Cập nhật trạng thái hoàn thành (`completed: boolean`) hoặc hạn chót (`dueDate`) của một nhiệm vụ.
- **`POST /api/roadmap`:** Thêm nhiệm vụ cá nhân mới vào một cột mốc.
