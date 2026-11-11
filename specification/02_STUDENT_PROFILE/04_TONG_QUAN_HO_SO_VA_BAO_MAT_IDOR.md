# Tính Năng: Tổng Quan Hồ Sơ & Bảo Mật Quyền Sở Hữu (Profile Overview & IDOR Prevention)

> **Mã SRS:** `FR-PRO-05`, `FR-PRO-06`  
> **Trạng thái:** ![Hoàn thành](https://img.shields.io/badge/-ĐÃ%20HOÀN%20THÀNH%20100%25-emerald)  
> **Thuộc cụm:** `02_STUDENT_PROFILE`  
> **Tác nhân:** Sinh viên (Student)

---

## 1. Cách Thức Hoạt Động Hiện Tại (Implementation Details)

### 1.1 Khối Header Tổng Quan Hồ Sơ
- **Vị trí:** Đầu trang [`src/app/profile/page.tsx`](file:///c:/Users/AD/OneDrive/Desktop/Project/ULIS_DMST_2026/src/app/profile/page.tsx)
- Hiển thị Avatar lớn, Họ tên đầy đủ, Email trường, Chuyên ngành đào tạo và Khóa sinh viên.
- Huy hiệu trạng thái tài khoản: `Sinh viên chính thức · Đang hoạt động`.
- Nút truy cập nhanh: "Xem Lộ trình của tôi" & "Làm lại trắc nghiệm định hướng".

### 1.2 Cơ Chế Bảo Vệ Quyền Sở Hữu Tuyệt Đối (Anti-IDOR Security - `FR-PRO-06`)
- Trong các endpoint [`src/app/api/profile/route.ts`](file:///c:/Users/AD/OneDrive/Desktop/Project/ULIS_DMST_2026/src/app/api/profile/route.ts):
  - Mọi thao tác truy vấn và cập nhật đều sử dụng `user.id` giải mã từ phiên `await requireAuth()`.
  - Server **tuyệt đối không chấp nhận bất kỳ tham số `userId` hay `studentId` nào từ client truyền lên**.
  - Ngăn chặn 100% việc sinh viên này sửa đổi hoặc đọc lén hồ sơ của sinh viên khác bằng cách đổi ID trong URL hoặc HTTP request.
