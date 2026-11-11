# Tính Năng: Đăng Xuất (Logout / Session Termination)

> **Mã SRS:** `FR-AUTH-04`  
> **Trạng thái:** ![Hoàn thành](https://img.shields.io/badge/-ĐÃ%20HOÀN%20THÀNH%20100%25-emerald)  
> **Thuộc cụm:** `01_AUTHENTICATION`  
> **Tác nhân:** Sinh viên (Student), Quản trị viên (Admin)

---

## 1. Cách Thức Hoạt Động Hiện Tại (Implementation Details)

### 1.1 Vị Trí Kích Hoạt
- Trên thanh điều hướng đầu trang [`src/components/common/Topbar.tsx`](file:///c:/Users/AD/OneDrive/Desktop/Project/ULIS_DMST_2026/src/components/common/Topbar.tsx):
  - Người dùng bấm vào Profile Pill ở góc phải trên.
  - Dropdown menu mở ra gồm: *Thông tin cá nhân*, *Cài đặt*, *Quản trị CMS* (nếu là Admin) và nút **"Đăng xuất"** (màu đỏ).

### 1.2 Cơ Chế Xử Lý Kỹ Thuật
- Gọi hàm `signOut({ callbackUrl: "/login" })` từ `next-auth/react`.
- **Hủy phiên:**
  1. Xóa bỏ cookie phiên làm việc `authjs.session-token` khỏi trình duyệt.
  2. Xóa state phiên trong bộ nhớ React Context (`AuthProvider.tsx`).
  3. Chuyển hướng người dùng về trang đăng nhập `/login`.
  4. Nếu cố bấm nút Back trình duyệt, Edge Middleware lập tức chặn lại và bắt đăng nhập lại do cookie phiên đã bị xóa sạch.

---

## 2. Tiêu Chí Nghiệm Thu (Acceptance Criteria)
- [x] **AC-01:** Bấm Đăng xuất &rarr; Phiên đăng nhập bị hủy bỏ ngay lập tức, chuyển hướng về trang `/login`.
- [x] **AC-02:** Kiểm tra cookies trình duyệt, cookie `authjs.session-token` bị xóa hoàn toàn.
