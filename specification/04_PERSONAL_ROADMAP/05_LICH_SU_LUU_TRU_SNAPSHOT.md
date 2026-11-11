# Tính Năng: Lưu Trữ Bản Sao Lộ Trình Cũ (Archived Roadmap & Snapshot)

> **Mã SRS:** `FR-RM-10`, `FR-RM-11`  
> **Trạng thái:** ![Hoàn thành](https://img.shields.io/badge/-ĐÃ%20HOÀN%20THÀNH%20100%25-emerald)  
> **Thuộc cụm:** `04_PERSONAL_ROADMAP`  
> **Tác nhân:** Sinh viên (Student), Hệ thống (System)

---

## 1. Cách Thức Hoạt Động Hiện Tại (Implementation Details)

### 1.1 Cơ Chế Lưu Trữ Lộ Trình (Archiving Flow)
- Mỗi khi sinh viên thay đổi mục tiêu đào tạo tại Hồ sơ cá nhân (`/profile`) hoặc làm lại trắc nghiệm định hướng (`/onboarding`):
  - Lộ trình cũ không bị xóa vĩnh viễn khỏi CSDL MongoDB mà được cập nhật trường `status = "ARCHIVED"`.
  - Giữ lại bản sao mục tiêu tại thời điểm đó (`goalSnapshot`) và toàn bộ các nhiệm vụ đã tick hoàn thành.
- **Ý nghĩa nghiệp vụ:** Giúp Nhà trường và sinh viên lưu lại dấu chân học tập, xem lại quá trình trưởng thành và thay đổi định hướng nghề nghiệp trong suốt 4 năm đại học.
