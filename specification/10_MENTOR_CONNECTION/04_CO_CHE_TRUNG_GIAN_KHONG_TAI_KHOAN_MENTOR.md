# Kiến Trúc Nghiệp Vụ: Cơ Chế Điều Phối Trung Gian & Không Tài Khoản Mentor

> **Mã SRS:** `FR-MEN-10`, `FR-MEN-11`, `FR-MEN-09`  
> **Trạng thái:** ![Hoàn thành kiến trúc](https://img.shields.io/badge/-KIẾN%20TRÚC%20ĐÃ%20HOÀN%20THÀNH-emerald)  
> **Thuộc cụm:** `10_MENTOR_CONNECTION`  
> **Tác nhân:** Quản trị viên (Admin), Kiến trúc hệ thống

---

## 1. Bản Chất Nghiệp Vụ Theo SRS 1.0 (Crucial Rule)

### 1.1 Quy Định "No Mentor Account" (FR-MEN-11)
- **Tuyệt đối không cấp tài khoản đăng nhập trực tiếp cho Mentor** trong phạm vi phiên bản 1.0.
- Lý do:
  - Các Mentor là chuyên gia doanh nghiệp, cựu sinh viên thành đạt bên ngoài trường hoặc giảng viên thỉnh giảng bận rộn; việc yêu cầu họ đăng ký tài khoản, nhớ mật khẩu và tự quản lý portal lịch hẹn là rào cản lớn.
  - Ban Quản trị Đoàn - Hội hoặc Phòng Đào tạo (Admin) đóng vai trò là đầu mối kết nối chuyên nghiệp (concierge / intermediary).

### 1.2 Vai Trò Của Admin Làm Cầu Nối (FR-MEN-12)
1. Sinh viên gửi yêu cầu tư vấn trên hệ thống.
2. Admin tiếp nhận yêu cầu, liên hệ trực tiếp với Mentor qua Zalo/Email/Điện thoại để thống nhất thời gian biểu và tạo link Google Meet.
3. Admin điền thông tin xác nhận vào CMS.
4. Hệ thống tự động gửi phản hồi kèm đường dẫn họp trực tuyến tới sinh viên (FR-MEN-09).

### 1.3 Quản Lý Danh Sách Mentor (FR-MEN-10)
- Toàn bộ hồ sơ chuyên gia Mentor được Admin tạo lập, cập nhật tiểu sử, kinh nghiệm và bật/tắt trạng thái hoạt động (`isActive`) thông qua CMS quản trị.
