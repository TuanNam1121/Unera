# Đặc Tả Tính Năng: Cấu Trúc 4 Cấp Bậc & Mẫu Lộ Trình (Templates)

> **Mã tính năng:** `FR-RM-03`, `FR-RM-04`, `FR-RM-12`, `FR-RM-15`  
> **Thuộc cụm:** `04_PERSONAL_ROADMAP`  
> **Tác nhân:** Quản trị viên (Admin), Sinh viên (Student)  

---

## 1. Cấu Trúc Khung Lộ Trình 4 Cấp Bậc (FR-RM-03)

Lộ trình được thiết kế dạng cây lồng nhau chuẩn hóa:
- **Cấp 1 - Năm học (`yearNumber`):** Đại diện cho các năm học đại học (ví dụ: Năm 1, Năm 2, Năm 3, Năm 4).
- **Cấp 2 - Học kỳ (`semesterNumber`):** Mỗi năm gồm Kỳ 1 và Kỳ 2.
- **Cấp 3 - Cột mốc (`milestones`):** Mục tiêu trọng yếu của học kỳ đó.
- **Cấp 4 - Đầu việc cụ thể (`tasks`):**
  - `id`: Định danh duy nhất của task trong roadmap.
  - `title`: Tên đầu việc (ngắn gọn, hành động cụ thể).
  - `description`: Hướng dẫn thực hiện chi tiết.
  - `completed`: Trạng thái hoàn thành (`boolean`).
  - `dueDate`: Hạn chót hoàn thành dự kiến.

---

## 2. Quản Trị Templates Lộ Trình (Admin Roadmap Templates - FR-RM-04, FR-RM-15)

1. Admin có giao diện quản lý template lộ trình (`/admin/roadmaps/templates`).
2. Admin xây dựng sẵn các bộ khung chuẩn cho từng định hướng:
   - *Template Du học bậc Thạc sĩ (Anh / Mỹ / Úc / Châu Âu)*
   - *Template Quản trị viên tập sự (FMCG / Retail / Tech)*
   - *Template Chuyên viên Công nghệ & Trải nghiệm số (Product / UI-UX)*
   - *Template Nghiên cứu sinh & Giảng dạy học thuật*
3. Mỗi template quy định danh mục nhiệm vụ cốt lõi bắt buộc của từng năm học. Khi một lộ trình được sinh mới, nó phải tuân thủ nghiêm ngặt cấu trúc của template tương ứng (FR-RM-12).
