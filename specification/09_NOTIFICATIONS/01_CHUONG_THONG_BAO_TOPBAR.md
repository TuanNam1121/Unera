# Tính Năng: Chuông Thông Báo & Trạng Thái Đọc Tại Topbar (In-app Notification Indicator)

> **Mã SRS:** `FR-NOTI-01`, `FR-NOTI-04`  
> **Trạng thái:** ![Hoàn thành UI](https://img.shields.io/badge/-ĐÃ%20TRIỂN%20KHAI%20UI%20TOPBAR-emerald)  
> **Thuộc cụm:** `09_NOTIFICATIONS`  
> **Tác nhân:** Sinh viên (Student), Quản trị viên (Admin)

---

## 1. Cách Thức Hoạt Động Hiện Tại (Implementation Details)

### 1.1 Vị Trí & Hiển Thị Trên Topbar
- Tệp nguồn giao diện: [`src/components/common/Topbar.tsx`](file:///c:/Users/AD/OneDrive/Desktop/Project/ULIS_DMST_2026/src/components/common/Topbar.tsx).
- Nút icon chuông `<Bell className="h-4 w-4" />` được bố trí tại thanh điều hướng trên cùng, bên cạnh thanh tìm kiếm nhanh.
- Có chấm đỏ/xanh biểu thị trạng thái có thông báo mới:
  ```tsx
  <Link
    href="/notifications"
    className="relative rounded-full p-2 text-slate-500 hover:bg-slate-100 transition-colors"
    title="Thông báo"
  >
    <Bell className="h-4 w-4" />
    <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-blue-600 ring-2 ring-white" />
  </Link>
  ```
- Nhấp vào chuông sẽ điều hướng đến trang trung tâm thông báo `/notifications`.

---

## 2. Kế Hoạch Bổ Sung Theo Chuẩn SRS 1.0 (Planned)

### 2.1 Cập Nhật Trạng Thái Đã Đọc Theo Thời Gian Thực
- Khi người dùng nhấp vào xem một thông báo cụ thể hoặc ấn "Đánh dấu tất cả đã đọc", cờ `read: true` được gửi về API và chấm xanh trên chuông biến mất.
- Polling hoặc SSE/WebSocket nhẹ để cập nhật số lượng thông báo chưa đọc mà không cần tải lại trang.

### 2.2 Tiêu Chí Nghiệp Vụ SRS
- **FR-NOTI-01**: Hệ thống cung cấp thông báo nội bộ (in-app) thông báo cho sinh viên về các sự kiện liên quan (hạn chót sắp tới, kết quả duyệt booking mentor, thay đổi lộ trình).
- **FR-NOTI-04**: Hệ thống theo dõi trạng thái đã đọc/chưa đọc cho từng bản ghi thông báo nội bộ.
