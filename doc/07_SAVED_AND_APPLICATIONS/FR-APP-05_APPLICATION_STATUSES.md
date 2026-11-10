# Đặc Tả Tính Năng: 7 Trạng Thái Ứng Tuyển Chuẩn Hóa

> **Mã tính năng:** `FR-APP-05`  
> **Thuộc cụm:** `07_SAVED_AND_APPLICATIONS`  
> **Căn cứ SRS:** Mục 4.7.5  
> **Trạng thái:** Confirmed  

---

## 1. Định Nghĩa 7 Trạng Thái Ứng Tuyển

Hệ thống UNERA chuẩn hóa quy trình ứng tuyển thành 7 trạng thái phục vụ hiển thị danh sách và bảng Kanban:

| STT | Mã Trạng Thái | Tên Hiển Thị (VN) | Ý Nghĩa Nghiệp Vụ | Màu Sắc Nhận Diện |
|:---:|---|---|---|---|
| 1 | `INTERESTED` | **Quan tâm** | Đang tìm hiểu thông tin, dự định ứng tuyển | Xanh dương (`blue`) |
| 2 | `PREPARING` | **Đang chuẩn bị hồ sơ** | Đang viết CV, xin thư giới thiệu, chuẩn bị tài liệu | Vàng hổ phách (`amber/yellow`) |
| 3 | `APPLIED` | **Đã nộp đơn** | Đã gửi hồ sơ qua cổng tuyển dụng / email | Tím nhạt (`purple`) |
| 4 | `INTERVIEWING` | **Đang phỏng vấn** | Đã qua vòng lọc hồ sơ, đang tham gia phỏng vấn/test | Cam (`orange`) |
| 5 | `ACCEPTED` | **Trúng tuyển / Được nhận** | Nhận offer thư mời làm việc / thông báo trúng học bổng | Xanh lục (`emerald/green`) |
| 6 | `REJECTED` | **Không trúng tuyển** | Không qua vòng hồ sơ hoặc phỏng vấn | Đỏ hồng (`rose/red`) |
| 7 | `WITHDRAWN` | **Rút hồ sơ** | Sinh viên chủ động rút đơn vì lý do cá nhân | Xám (`slate/gray`) |
