# Đặc Tả Tính Năng: Danh Bạ Hồ Sơ Mentor & Tìm Kiếm Chuyên Gia

> **Mã tính năng:** `FR-MEN-01`, `FR-MEN-02`, `FR-MEN-03`, `FR-MEN-10`  
> **Thuộc cụm:** `10_MENTOR_CONNECTION`  
> **Tác nhân:** Sinh viên (Student), Quản trị viên (Admin)  

---

## 1. Nghiệp Vụ Tính Năng

1. **Danh bạ Mentor (Mentor Directory - FR-MEN-01, 02):**
   - Trang `/mentors` hiển thị danh bạ các Mentor uy tín đã được Admin thẩm định hồ sơ kỹ lưỡng.
   - Mỗi thẻ Mentor hiển thị:
     - Ảnh chân dung chuyên nghiệp (`avatar`).
     - Họ tên, Chức vụ hiện tại, Tổ chức/Doanh nghiệp đang công tác.
     - Các thẻ chuyên môn (`expertise`: ví dụ *Học bổng du học Anh, UI/UX Design, Management Trainee*).
     - Số năm kinh nghiệm làm việc và đoạn giới thiệu ngắn gọn.
     - Danh sách các chủ đề sẵn sàng hỗ trợ (`topics`).
2. **Tìm kiếm & Lọc Mentor (FR-MEN-03):**
   - Tìm kiếm theo tên chuyên gia hoặc từ khóa lĩnh vực.
   - Lọc theo chuyên ngành và chủ đề tư vấn.
3. **Quản lý hồ sơ Mentor bởi Admin (FR-MEN-10):**
   - Chỉ Admin mới có quyền tạo mới, chỉnh sửa hoặc ẩn/hiện (`isActive`) hồ sơ Mentor trong hệ thống.

