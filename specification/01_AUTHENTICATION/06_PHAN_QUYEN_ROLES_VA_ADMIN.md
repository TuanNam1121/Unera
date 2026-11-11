# Tính Năng: Phân Quyền & Quản Trị Viên Bình Đẳng (Role-Based Authorization & Multi-Admin)

> **Mã SRS:** `FR-AUTH-07`, `FR-AUTH-12`, `FR-AUTH-13`  
> **Trạng thái:** ![Hoàn thành](https://img.shields.io/badge/-ĐÃ%20HOÀN%20THÀNH%20100%25-emerald)  
> **Thuộc cụm:** `01_AUTHENTICATION`  
> **Tác nhân:** Quản trị viên (Admin), Sinh viên (Student)

---

## 1. Cách Thức Hoạt Động Hiện Tại (Implementation Details)

### 1.1 Hai Vai Trò Xác Thực Duy Nhất Trong Hệ Thống (`FR-AUTH-07`)
Hệ thống xác định chính xác 2 vai trò người dùng trong phạm vi SRS 1.0:
1. `STUDENT`: Người dùng là sinh viên đại học.
2. `ADMIN`: Quản trị viên vận hành nền tảng.
*(Lưu ý: Mentor không phải là tài khoản đăng nhập mà là hồ sơ do Admin quản trị).*

### 1.2 Quyền Hạn Admin Bình Đẳng (Equal Admin Permissions - `FR-AUTH-12, 13`)
- Hệ thống hỗ trợ nhiều tài khoản Quản trị viên cùng hoạt động độc lập.
- Tất cả các tài khoản Admin đều có quyền hạn ngang nhau, không phân cấp Super-Admin hay Sub-Admin trong phiên bản 1.0.
- Đã seed sẵn 5 tài khoản Admin vào CSDL MongoDB:
  - `admin@unera.edu.vn` (Mật khẩu: `Admin@123456`)
  - `admin.lan@unera.edu.vn` (Mật khẩu: `Admin@123456`)
  - `admin.minh@unera.edu.vn` (Mật khẩu: `Admin@123456`)
  - `quantri@ulis.edu.vn` (Mật khẩu: `Admin@123456`)
  - `emnam2k5@gmail.com` (Đăng nhập một chạm bằng Google)

### 1.3 Cơ Chế Bảo Vệ Server-Side Chặt Chẽ
- **Tệp nguồn:** [`src/lib/session.ts`](file:///c:/Users/AD/OneDrive/Desktop/Project/ULIS_DMST_2026/src/lib/session.ts)
  - Hàm `requireAdmin()`:
    ```typescript
    export async function requireAdmin() {
      const user = await requireAuth();
      if (user.role !== "ADMIN") {
        const error = new Error("Quyền truy cập bị từ chối. Chỉ dành cho Quản trị viên.");
        (error as any).status = 403;
        throw error;
      }
      return user;
    }
    ```
  - Mọi API trong `/api/admin/*` đều gọi hàm này ở dòng đầu tiên. Dù kẻ xấu có giả lập giao diện hay vượt qua frontend, server vẫn lập tức từ chối với HTTP 403.
- **Edge Middleware ([`src/middleware.ts`](file:///c:/Users/AD/OneDrive/Desktop/Project/ULIS_DMST_2026/src/middleware.ts)):** Chặn người dùng chưa đăng nhập khi truy cập đường dẫn `/admin/*` và redirect về `/login`.

---

## 2. Tiêu Chí Nghiệm Thu (Acceptance Criteria)
- [x] **AC-01:** Sinh viên đăng nhập vào hệ thống & cố tình mở `/admin` &rarr; Bị từ chối truy cập hoặc chuyển hướng.
- [x] **AC-02:** Admin đăng nhập &rarr; Topbar hiển thị huy hiệu `ADMIN`, Sidebar tự động đổi sang menu Admin CMS, truy cập `/admin` thành công.
- [x] **AC-03:** Gọi thử API `/api/admin/dashboard/stats` bằng tài khoản sinh viên &rarr; Nhận phản hồi HTTP 403 Forbidden.
