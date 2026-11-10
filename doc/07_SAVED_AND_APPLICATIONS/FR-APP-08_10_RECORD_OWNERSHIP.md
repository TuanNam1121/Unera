# Đặc Tả Tính Năng: Quyền Sở Hữu, Giới Hạn Xác Thực Ngoài & Độc Lập Với Lịch

> **Mã tính năng:** `FR-APP-08`, `FR-APP-09`, `FR-APP-10`  
> **Thuộc cụm:** `07_SAVED_AND_APPLICATIONS`  
> **Tác nhân:** Sinh viên (Student), Hệ thống (System)  
> **Mức độ ưu tiên:** Bắt buộc (P0 - Security & Business Guardrail)  

---

## 1. Nghiệp Vụ Bất Biến

1. **Bảo vệ quyền sở hữu tuyệt đối (FR-APP-08):**
   - Sinh viên chỉ có thể xem, tạo, sửa và xóa các bản ghi ứng tuyển của chính mình.
   - Backend luôn lấy `studentId` từ phiên JWT được ký bảo mật của người dùng hiện tại.
2. **Giới hạn xác thực ngoài (External Verification Limitation - FR-APP-09 & BR-38):**
   - Trạng thái ứng tuyển là **thông tin tự quản lý mang tính cá nhân của sinh viên**.
   - Hệ thống **tuyệt đối không được mô tả hoặc cam kết rằng trạng thái này đã được xác thực chính thức bởi đơn vị tổ chức** trừ khi có tích hợp API riêng được phê duyệt.
3. **Tách biệt hoàn toàn giữa Danh sách lưu và Lịch (FR-APP-10):**
   - Lưu cơ hội không tự động đưa vào lịch.
   - Thêm vào lịch không tự động tạo thẻ ứng tuyển.
   - Các hành động này độc lập hoàn toàn với nhau về mặt dữ liệu và trải nghiệm người dùng.
