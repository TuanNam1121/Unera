# Tính Năng: Khả Dụng & Cơ Chế Bỏ Qua Trắc Nghiệm (Quiz Availability & Skip)

> **Mã SRS:** `FR-ONB-01`, `FR-ONB-02`, `BR-04`  
> **Trạng thái:** ![Hoàn thành](https://img.shields.io/badge/-ĐÃ%20HOÀN%20THÀNH%20100%25-emerald)  
> **Thuộc cụm:** `03_ONBOARDING_QUIZ`  
> **Tác nhân:** Sinh viên (Student)

---

## 1. Cách Thức Hoạt Động Hiện Tại (Implementation Details)

### 1.1 Khả Dụng Của Bài Trắc Nghiệm (`FR-ONB-01`)
- Đường dẫn trực tiếp: [`/onboarding`](file:///c:/Users/AD/OneDrive/Desktop/Project/ULIS_DMST_2026/src/app/onboarding/page.tsx).
- Có thể truy cập từ:
  - Sau khi đăng ký tài khoản thành công.
  - Khối "Hiểu mình trước khi chọn ngành" trên trang `/news`.
  - Nút "Làm lại trắc nghiệm định hướng" trên trang `/profile` và `/roadmap`.
  - Mục "Công cụ" trên Sidebar bên trái.

### 1.2 Cơ Chế Bỏ Qua Trắc Nghiệm (Skip - `FR-ONB-02`, `BR-04`)
- **Quy tắc bất biến:** Bài trắc nghiệm hoàn toàn mang tính chất **TÙY CHỌN (Optional)**.
- **Vị trí nút:** Tại góc trên bên phải thanh tiêu đề bài làm trắc nghiệm luôn hiển thị nút:
  **`Bỏ qua trắc nghiệm &rarr;`** (chuyển hướng sinh viên sang trang `/explore` hoặc `/`).
- **Xử lý hệ thống:**
  - Hành động bỏ qua không bị coi là lỗi.
  - Không chặn bất kỳ tính năng bình thường nào của hệ thống (sinh viên vẫn có thể tìm kiếm cơ hội, xem tin tức, quản lý hồ sơ).
  - Sinh viên có thể quay lại làm bài trắc nghiệm bất cứ khi nào.
