# Tính Năng: Thông Tin Cá Nhân & Học Vấn Sinh Viên (Personal & Academic Info)

> **Mã SRS:** `FR-PRO-01`  
> **Trạng thái:** ![Hoàn thành](https://img.shields.io/badge/-ĐÃ%20HOÀN%20THÀNH%20100%25-emerald)  
> **Thuộc cụm:** `02_STUDENT_PROFILE`  
> **Tác nhân:** Sinh viên (Student)

---

## 1. Cách Thức Hoạt Động Hiện Tại (Implementation Details)

### 1.1 Giao Diện Tab 1 (`/profile` &rarr; Tab "Học vấn & Cá nhân")
- **Tệp nguồn:** [`src/app/profile/page.tsx`](file:///c:/Users/AD/OneDrive/Desktop/Project/ULIS_DMST_2026/src/app/profile/page.tsx)
- **Các trường dữ liệu sinh viên quản lý:**
  - Họ và tên (`fullName`): Bắt buộc, hiển thị trên Topbar và CV.
  - Trường Đại học (`university`): Ví dụ: *Đại học Ngoại ngữ - ĐHQGHN (ULIS)*.
  - Chuyên ngành đào tạo (`major`): Ví dụ: *Ngôn ngữ Anh*, *Kinh tế quốc tế*, *Sư phạm tiếng Trung*.
  - Khóa sinh viên / Năm học (`academicYear`): Dropdown chọn *Năm 1*, *Năm 2*, *Năm 3*, *Năm 4*, hoặc *Đã tốt nghiệp*.
  - Tiểu sử cá nhân (`bio`): Đoạn giới thiệu ngắn tối đa 500 ký tự.
  - Ảnh đại diện (`avatar`): URL ảnh đại diện hoặc avatar chữ cái viết tắt.

### 1.2 Xử Lý Phía Server (`GET /api/profile` & `PUT /api/profile`)
- **Tệp nguồn:** [`src/app/api/profile/route.ts`](file:///c:/Users/AD/OneDrive/Desktop/Project/ULIS_DMST_2026/src/app/api/profile/route.ts)
- `GET`: Tự động tìm `StudentProfile` theo `userId` của phiên hiện tại.
- `PUT`: Cập nhật các trường thông tin cá nhân và lưu vết thời gian `updatedAt`.
