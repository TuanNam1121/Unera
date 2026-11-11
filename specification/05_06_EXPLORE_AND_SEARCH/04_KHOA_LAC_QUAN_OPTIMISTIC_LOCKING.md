# Tính Năng: Khóa Lạc Quan Kiểm Soát Xung Đột Đồng Thời (Optimistic Concurrency Locking)

> **Mã SRS:** `FR-OPP-11`, `UI-08`  
> **Trạng thái:** ![Hoàn thành](https://img.shields.io/badge/-ĐÃ%20HOÀN%20THÀNH%20100%25-emerald)  
> **Thuộc cụm:** `05_06_EXPLORE_AND_SEARCH`  
> **Tác nhân:** Quản trị viên (Admin), Hệ thống (System)

---

## 1. Cách Thức Hoạt Động Hiện Tại (Implementation Details)

Nhằm tránh hiện tượng 2 Quản trị viên cùng sửa một cơ hội và người sửa sau vô tình ghi đè mất thông tin của người sửa trước:

### 1.1 Quản Lý Phiên Bản (`version: number`)
- Bảng [`src/models/Opportunity.ts`](file:///c:/Users/AD/OneDrive/Desktop/Project/ULIS_DMST_2026/src/models/Opportunity.ts) có trường `version: { type: Number, default: 1 }`.
- Khi cơ hội được tạo mới &rarr; `version = 1`.

### 1.2 Kiểm Soát Xung Đột Phía Server (`PATCH /api/opportunities/[id]`)
- Khi Admin mở form sửa cơ hội, client lưu giữ giá trị `currentVersion` (ví dụ `version: 3`).
- Khi Admin bấm "Lưu cập nhật", client gửi kèm `version: 3` lên server.
- Server thực hiện câu lệnh cập nhật có điều kiện:
  ```typescript
  const updated = await Opportunity.findOneAndUpdate(
    { _id: id, version: clientVersion },
    { $set: updateData, $inc: { version: 1 } },
    { new: true }
  );
  ```
- **Xử lý xung đột:**
  - Nếu `updated === null` (nghĩa là đã có Admin khác lưu trước đó khiến version trong DB tăng lên 4):
  - Server lập tức trả về **HTTP 409 Conflict**: *"Dữ liệu cơ hội đã bị thay đổi bởi quản trị viên khác. Vui lòng tải lại trang để xem thông tin mới nhất."*
  - Giao diện Admin CMS hiển thị thông báo cảnh báo và cung cấp nút "Tải lại dữ liệu mới nhất" (`UI-08`).
