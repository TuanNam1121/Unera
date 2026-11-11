# Tính Năng: Mục Tiêu Phát Triển & Tự Động Đồng Bộ Lộ Trình (Development Goals)

> **Mã SRS:** `FR-PRO-02`  
> **Trạng thái:** ![Hoàn thành](https://img.shields.io/badge/-ĐÃ%20HOÀN%20THÀNH%20100%25-emerald)  
> **Thuộc cụm:** `02_STUDENT_PROFILE`  
> **Tác nhân:** Sinh viên (Student), Hệ thống (System)

---

## 1. Cách Thức Hoạt Động Hiện Tại (Implementation Details)

### 1.1 Giao Diện Tab 2 (`/profile` &rarr; Tab "Mục tiêu phát triển")
- **Tệp nguồn:** [`src/app/profile/page.tsx`](file:///c:/Users/AD/OneDrive/Desktop/Project/ULIS_DMST_2026/src/app/profile/page.tsx)
- Cung cấp các hộp kiểm (checkboxes) tương ứng với 5 định hướng chiến lược:
  1. *Du học & Săn học bổng quốc tế* (`studyAbroad`)
  2. *Việc làm doanh nghiệp & Quản trị viên tập sự* (`employment`)
  3. *Nghiên cứu khoa học & Học thuật chuyên sâu* (`scientificResearch`)
  4. *Khởi nghiệp & Đổi mới sáng tạo* (`startup`)
  5. *Phát triển năng lực & Kỹ năng cá nhân toàn diện* (`personalGrowth`)
- Ô nhập ghi chú mục tiêu cá nhân (`notes`): Ví dụ: *"Mục tiêu săn học bổng Thạc sĩ Erasmus Mundus Châu Âu 2027"*.

### 1.2 Xử Lý Phía Server & Tự Động Kích Hoạt Sinh Lộ Trình (`PUT /api/profile/goals`)
- **Tệp nguồn:** [`src/app/api/profile/goals/route.ts`](file:///c:/Users/AD/OneDrive/Desktop/Project/ULIS_DMST_2026/src/app/api/profile/goals/route.ts)
- **Cơ chế hoạt động:**
  1. Lưu các mục tiêu mới vào `StudentProfile.developmentGoals`.
  2. **Cập nhật Lộ trình hoạt động (Active Roadmap Invariant):**
     - Lưu trữ (`ARCHIVED`) lộ trình hiện tại của sinh viên.
     - Khởi tạo một bản ghi `Roadmap` mới với `status: "ACTIVE"`.
     - Sao chép mục tiêu mới vào `Roadmap.goalSnapshot`.
     - Tự động sinh cấu trúc cột mốc và nhiệm vụ hành động phù hợp nhất với hướng đi mà sinh viên vừa chọn.
  3. Màn hình Lộ trình cá nhân (`/roadmap`) và Widget Dashboard (`/`) lập tức phản ánh ngay mục tiêu mới này.
