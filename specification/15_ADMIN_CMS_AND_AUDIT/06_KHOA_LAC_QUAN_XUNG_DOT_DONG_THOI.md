# Tính Năng: Khóa Lạc Quan & Ngăn Xung Đột Cập Nhật Đồng Thời (Optimistic Locking)

> **Mã SRS:** `FR-ADM-16`, `FR-ADM-17`, `FR-ADM-18`, `FR-ADM-19`  
> **Trạng thái:** ![Hoàn thành 100%](https://img.shields.io/badge/-ĐÃ%20HOÀN%20THÀNH%20100%25-emerald)  
> **Thuộc cụm:** `15_ADMIN_CMS_AND_AUDIT`, `05_06_EXPLORE_AND_SEARCH`  
> **Tác nhân:** Quản trị viên (Admin), Hệ thống Backend

---

## 1. Cách Thức Hoạt Động Hiện Tại (Implementation Details)

### 1.1 Quản Lý Phiên Bản Số Nguyên (Version Field)
- Trong mô hình [`src/models/Opportunity.ts`](file:///c:/Users/AD/OneDrive/Desktop/Project/ULIS_DMST_2026/src/models/Opportunity.ts):
  - Khai báo trường: `version: { type: Number, default: 1, required: true }`.
  - Mỗi lần tạo mới: `version = 1`.

### 1.2 Kiểm Tra Xung Đột Đồng Thời Nguyên Tử (FR-ADM-16, FR-ADM-18)
- Khi Admin gửi request sửa cơ hội: `PATCH /api/opportunities/[id]`:
  - Request body bắt buộc phải gửi kèm số phiên bản hiện tại mà Admin đang mở trên trình duyệt (`currentVersion`).
  - Phía backend thực hiện truy vấn có điều kiện:
    ```typescript
    const updated = await Opportunity.findOneAndUpdate(
      { _id: id, version: currentVersion },
      { $set: updateFields, $inc: { version: 1 } },
      { new: true }
    );
    ```
  - Nếu `updated === null`: Có nghĩa là một Admin khác đã nhanh tay lưu thay đổi trước đó và đẩy `version` lên cao hơn. Backend lập tức chặn lại và trả về mã lỗi HTTP `409 Conflict`.

### 1.3 Cảnh Báo Xung Đột & Tải Lại Dữ Liệu Mới Nhất (FR-ADM-17, FR-ADM-19)
- Khi Client nhận được mã lỗi `409`:
  - Hiển thị Dialog cảnh báo màu hổ phách: *"Dữ liệu này vừa được một quản trị viên khác cập nhật! Để tránh ghi đè làm mất thông tin, vui lòng tải lại phiên bản mới nhất."*
  - Nút **"Tải lại dữ liệu mới nhất (Reload)"** kích hoạt `GET /api/opportunities/[id]` để nạp nội dung và số version mới vào form soạn thảo, đảm bảo không ai bị mất dữ liệu ngoài ý muốn.
