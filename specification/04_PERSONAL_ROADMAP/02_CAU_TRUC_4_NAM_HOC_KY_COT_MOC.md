# Tính Năng: Cấu Trúc Lộ Trình 4 Năm, Học Kỳ & Cột Mốc (Roadmap Hierarchy)

> **Mã SRS:** `FR-RM-03`, `FR-RM-04`  
> **Trạng thái:** ![Hoàn thành](https://img.shields.io/badge/-ĐÃ%20HOÀN%20THÀNH%20100%25-emerald)  
> **Thuộc cụm:** `04_PERSONAL_ROADMAP`  
> **Tác nhân:** Sinh viên (Student)

---

## 1. Cách Thức Hoạt Động Hiện Tại (Implementation Details)

### 1.1 Cấu Trúc Cây Phân Cấp 4 Tầng (Hierarchical Tree Structure)
Lộ trình được tổ chức chặt chẽ theo 4 cấp bậc:
```
Năm học (Year: 1, 2, 3, 4)
 └── Học kỳ (Semester: 1, 2)
      └── Cột mốc (Milestone: Mục tiêu giai đoạn)
           └── Nhiệm vụ (Task: Việc cần làm cụ thể)
```

- **Mô hình Schema trong `Roadmap.ts`:**
  - `yearNumber`: 1, 2, 3, 4.
  - `semesters`: mảng học kỳ `[1, 2]`.
  - `milestones`: mảng cột mốc `{ id, title, tasks }`.
  - `tasks`: mảng đầu việc `{ id, title, description, completed, dueDate }`.

### 1.2 Hiển Thị Trên Giao Diện (`/roadmap`)
- **Tệp nguồn:** [`src/app/roadmap/page.tsx`](file:///c:/Users/AD/OneDrive/Desktop/Project/ULIS_DMST_2026/src/app/roadmap/page.tsx)
- Tab chuyển đổi năm học: *Tất cả 4 năm*, *Năm 1*, *Năm 2*, *Năm 3*, *Năm 4*.
- Mỗi năm được chia thành lưới 2 cột tương ứng với Học kỳ 1 và Học kỳ 2.
- Trong từng học kỳ, các Cột mốc hiển thị rõ số lượng việc đã hoàn tất (ví dụ: `2/3 hoàn tất`) kèm biểu tượng lá cờ.
