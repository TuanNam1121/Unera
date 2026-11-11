# Tính Năng: Nhật Ký Kiểm Toán Bất Biến Append-only (Audit Trail & Logging)

> **Mã SRS:** `FR-ADM-14`, `FR-ADM-20`  
> **Trạng thái:** ![Hoàn thành 100%](https://img.shields.io/badge/-ĐÃ%20HOÀN%20THÀNH%20100%25-emerald)  
> **Thuộc cụm:** `15_ADMIN_CMS_AND_AUDIT`  
> **Tác nhân:** Quản trị viên (Admin), Hệ thống Backend

---

## 1. Cách Thức Hoạt Động Hiện Tại (Implementation Details)

### 1.1 Nguyên Tắc Thiết Kế Bất Biến (Append-only & Tamper-resistant)
- Tệp nguồn mô hình: [`src/models/AuditLog.ts`](file:///c:/Users/AD/OneDrive/Desktop/Project/ULIS_DMST_2026/src/models/AuditLog.ts).
- Hàm phụ trợ ghi log: [`src/lib/audit.ts`](file:///c:/Users/AD/OneDrive/Desktop/Project/ULIS_DMST_2026/src/lib/audit.ts).
- **Quy tắc tuyệt đối:** Bản ghi kiểm toán **chỉ được phép ghi thêm (INSERT/APPEND)**, hệ thống **không có bất kỳ API nào cho phép sửa (UPDATE) hoặc xóa (DELETE)** bảng nhật ký này.
- Mọi thao tác quản trị trên hệ thống đều được tự động lưu vết:
  - Tạo/sửa/đổi trạng thái Cơ hội (`opportunities`).
  - Tạo/sửa/xóa Bài viết (`news`).
  - Duyệt/từ chối lịch hẹn Mentor (`bookings`).
  - Sửa câu hỏi/đáp án/khôi phục mặc định Quiz (`quiz`).
  - Khóa/mở tài khoản Sinh viên (`students`).

### 1.2 Metadata Ghi Nhận Chi Tiết (FR-ADM-20)
Mỗi bản ghi `AuditLog` lưu trữ đầy đủ:
- `adminId`: ID của Quản trị viên thực hiện thao tác.
- `adminEmail`, `adminName`: Danh tính người thao tác.
- `action`: `CREATE` | `UPDATE` | `DELETE` | `STATUS_CHANGE` | `RESET_DEFAULT`.
- `targetCollection`: Tên bộ sưu tập bị tác động (`opportunities`, `news`, `bookings`, `students`, `quiz`).
- `targetId`: ID của tài liệu bị tác động.
- `targetTitle`: Tiêu đề hoặc tên đối tượng để dễ tra cứu.
- `changesBefore`: Trạng thái dữ liệu trước khi thay đổi (JSON object).
- `changesAfter`: Trạng thái dữ liệu sau khi thay đổi (JSON object).
- `reason`: Lý do thao tác (nếu có).
- `ipAddress`: Địa chỉ IP của Admin khi gửi request.
- `userAgent`: Trình duyệt và hệ điều hành của máy thao tác.
- `createdAt`: Dấu thời gian chính xác (ISO 8601).

### 1.3 Giao Diện Xem Nhật Ký (`/admin/audit-logs`)
- Tệp nguồn: [`src/app/admin/audit-logs/page.tsx`](file:///c:/Users/AD/OneDrive/Desktop/Project/ULIS_DMST_2026/src/app/admin/audit-logs/page.tsx).
- Cho phép Admin lọc theo: Hành động, Bộ sưu tập, Ngày thao tác, Email người thực hiện.
- Cột thao tác có nút "Xem chi tiết khác biệt (Diff)" mở trình so sánh trực quan.
