# Tính Năng: Trình Xem Khác Biệt Dữ Liệu Trực Quan (Diff Viewer Modal)

> **Mã SRS:** `FR-ADM-14`, `FR-ADM-20`  
> **Trạng thái:** ![Hoàn thành 100%](https://img.shields.io/badge/-ĐÃ%20HOÀN%20THÀNH%20100%25-emerald)  
> **Thuộc cụm:** `15_ADMIN_CMS_AND_AUDIT`  
> **Tác nhân:** Quản trị viên (Admin)

---

## 1. Cách Thức Hoạt Động Hiện Tại (Implementation Details)

### 1.1 Giao Diện So Sánh Bên-Cạnh-Bên (Side-by-Side Diff)
- Tệp nguồn giao diện: [`src/app/admin/audit-logs/page.tsx`](file:///c:/Users/AD/OneDrive/Desktop/Project/ULIS_DMST_2026/src/app/admin/audit-logs/page.tsx).
- Khi Admin nhấn nút "Xem Diff" trên bất kỳ bản ghi kiểm toán nào:
  - Một Modal mở ra chia thành hai cột hoặc chế độ xem từng trường (Field-by-Field View):
    - **Cột Trái (Dữ liệu trước thay đổi - Before):** Nền đỏ nhạt `bg-red-50 text-red-700` thể hiện giá trị cũ đã bị thay thế hoặc xóa bỏ.
    - **Cột Phải (Dữ liệu sau thay đổi - After):** Nền xanh lục nhạt `bg-emerald-50 text-emerald-700` thể hiện giá trị mới vừa được cập nhật.

### 1.2 Làm Nổi Bật Chỉ Những Trường Thay Đổi (Smart Highlight)
- Hệ thống tự động so khớp đệ quy các trường:
  - Trường nào không đổi: Được làm mờ hoặc ẩn đi để tránh gây rối mắt.
  - Trường nào thay đổi (ví dụ: `title`, `deadline`, `status`, `options`): Được đánh dấu viền đậm và hiển thị rõ ràng chuỗi cũ -> chuỗi mới.
- Hỗ trợ xem định dạng JSON gốc nếu cần đối soát sâu dữ liệu kỹ thuật.
