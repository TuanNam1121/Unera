# Tính Năng: Quản Lý Kỹ Năng & Thành Tích Sinh Viên (Skills & Achievements)

> **Mã SRS:** `FR-PRO-03`, `FR-PRO-04`  
> **Trạng thái:** ![Hoàn thành](https://img.shields.io/badge/-ĐÃ%20HOÀN%20THÀNH%20100%25-emerald)  
> **Thuộc cụm:** `02_STUDENT_PROFILE`  
> **Tác nhân:** Sinh viên (Student)

---

## 1. Cách Thức Hoạt Động Hiện Tại (Implementation Details)

### 1.1 Quản Lý Thẻ Kỹ Năng (Tab "Kỹ năng")
- **Giao diện:** [`src/app/profile/page.tsx`](file:///c:/Users/AD/OneDrive/Desktop/Project/ULIS_DMST_2026/src/app/profile/page.tsx)
- Cho phép sinh viên tạo các tag kỹ năng mềm (Thuyết trình, Đàm phán, Làm việc nhóm) và kỹ năng cứng (IELTS 7.5, Python, Phân tích số liệu, Biên dịch).
- Thao tác: Nhập tên kỹ năng & bấm phím Enter hoặc bấm nút "Thêm"; bấm icon `x` trên tag để xóa bỏ.

### 1.2 Quản Lý Thành Tích & Giải Thưởng (Tab "Thành tích")
- Danh sách các giải thưởng NCKH, học bổng doanh nghiệp, giải thưởng cuộc thi đã đạt được trong suốt các năm học.
- Dữ liệu này tự động sẵn sàng để đổ vào mẫu CV chuẩn ATS (`/tools/cv-builder`) mà không cần sinh viên phải nhập lại nhiều lần.
