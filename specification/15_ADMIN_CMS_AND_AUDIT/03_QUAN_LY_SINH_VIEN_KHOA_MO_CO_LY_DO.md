# Tính Năng: Quản Lý Sinh Viên & Khóa/Mở Tài Khoản Bắt Buộc Lý Do (Student Account Moderation)

> **Mã SRS:** `FR-ADM-02`, `FR-AUTH-09`  
> **Trạng thái:** ![Hoàn thành 100%](https://img.shields.io/badge/-ĐÃ%20HOÀN%20THÀNH%20100%25-emerald)  
> **Thuộc cụm:** `15_ADMIN_CMS_AND_AUDIT`, `01_AUTHENTICATION`  
> **Tác nhân:** Quản trị viên (Admin)

---

## 1. Cách Thức Hoạt Động Hiện Tại (Implementation Details)

### 1.1 Giao Diện Danh Sách Sinh Viên (`/admin/students`)
- Tệp nguồn giao diện: [`src/app/admin/students/page.tsx`](file:///c:/Users/AD/OneDrive/Desktop/Project/ULIS_DMST_2026/src/app/admin/students/page.tsx).
- Bảng hiển thị thông tin sinh viên:
  - Tên, Email, Mã sinh viên, Khoa/Ngành học, Khóa (K57, K58, K59...).
  - Trạng thái tài khoản: `ACTIVE` (Huy hiệu xanh lá) hoặc `SUSPENDED` (Huy hiệu đỏ).
  - Lần đăng nhập cuối, ngày tạo tài khoản.
  - Ô tìm kiếm tức thì theo tên/email/MSSV và bộ lọc trạng thái.

### 1.2 Modal Khóa / Mở Khóa Tài Khoản Kèm Lý Do Bắt Buộc (Mandatory Reason)
- Khi Admin nhấn nút "Khóa tài khoản" hoặc "Mở khóa":
  - Modal xác nhận bật lên.
  - **Ô nhập lý do (Reason Input) là trường BẮT BUỘC** (không được để trống, tối thiểu 5 ký tự).
    *Ví dụ: "Vi phạm nội quy phát ngôn sai sự thật trên diễn đàn khoa", hoặc "Đã xác minh lại thông tin sinh viên chính chủ qua phòng CTSV"*.
  - Nút xác nhận chỉ khả dụng khi đã điền lý do hợp lệ.

### 1.3 Backend API & Chặn Truy Cập
- API Endpoint: `PATCH /api/admin/students/[id]/status` trong [`src/app/api/admin/students/[id]/status/route.ts`](file:///c:/Users/AD/OneDrive/Desktop/Project/ULIS_DMST_2026/src/app/api/admin/students/[id]/status/route.ts).
- Cập nhật trường `isActive: false` (hoặc `true`) trong bản ghi [`src/models/User.ts`](file:///c:/Users/AD/OneDrive/Desktop/Project/ULIS_DMST_2026/src/models/User.ts).
- Ghi nhận hành vi vào Nhật ký kiểm toán [`src/models/AuditLog.ts`](file:///c:/Users/AD/OneDrive/Desktop/Project/ULIS_DMST_2026/src/models/AuditLog.ts) với `action: "STATUS_CHANGE"`, lưu đầy đủ lý do Admin đã nhập.
- Khi tài khoản bị `SUSPENDED`, session sinh viên sẽ bị từ chối đăng nhập tại `src/app/api/auth/[...nextauth]/route.ts`.
