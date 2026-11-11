# Tính Năng: Danh Bạ Cộng Đồng CLB Ngoại Ngữ Chế Độ Tra Cứu (Community Directory - Read-only)

> **Mã SRS:** `FR-COM-01`, `FR-COM-02`, `FR-COM-03`, `FR-COM-04`, `FR-COM-05`, `FR-COM-06`  
> **Trạng thái:** ![Kế hoạch theo SRS](https://img.shields.io/badge/-KẾ%20HOẠCH%20THEO%20SRS-amber)  
> **Thuộc cụm:** `13_14_COMMUNITY_AND_NEWS`  
> **Tác nhân:** Sinh viên (Student), Khách truy cập (Guest), Quản trị viên (Admin)

---

## 1. Hiện Trạng Triển Khai
- Cần triển khai trang hiển thị danh bạ các CLB và cộng đồng sinh viên tại `/community`.

---

## 2. Đặc Tả Nghiệp Vụ Theo SRS 1.0 (Specification)

### 2.1 Danh Mục & Chi Tiết Cộng Đồng (FR-COM-01, FR-COM-02, FR-COM-03)
- Hiển thị danh sách các Câu lạc bộ, Đội, Nhóm chính thức trực thuộc Đoàn trường, Hội Sinh viên hoặc các Khoa tại ULIS:
  - **CLB Học thuật & Ngoại ngữ:** CLB Tiếng Anh (EC), CLB Tiếng Trung, CLB Tiếng Nhật, CLB Tiếng Hàn, CLB Tiếng Pháp, CLB Tiếng Đức, v.v.
  - **CLB Kỹ năng & Nghệ thuật:** CLB Tranh biện, CLB Nhiếp ảnh, CLB Khiêu vũ, CLB Âm nhạc.
  - **CLB Thể thao:** Cầu lông, Bóng rổ, Bóng đá.
  - **Đội Tình nguyện & Dự án Xã hội.**
- Chi tiết mỗi CLB gồm: Logo, Năm thành lập, Slogan, Ban chủ nhiệm, Kênh Fanpage chính thức, và Lịch tuyển thành viên (Gen) mới hàng năm.

### 2.2 Nguyên Tắc Nghiệp Vụ: Quyền Truy Cập Read-Only (FR-COM-05, FR-COM-06)
- **Quyền đọc tra cứu (Read-only):** Sinh viên chỉ xem thông tin để tìm kiếm câu lạc bộ phù hợp với định hướng và sở thích.
- **Tuyệt đối không có tính năng đăng bài tự do (FR-COM-06):** Sinh viên không thể tự do đăng status, bình luận tự do hay biến hệ thống thành mạng xã hội (Social Media). Mọi thông tin CLB đều do Ban Quản trị kiểm duyệt và cập nhật (FR-COM-04) nhằm đảm bảo môi trường thông tin học thuật chuẩn mực, an toàn và chính thống.
