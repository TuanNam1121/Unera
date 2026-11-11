# Đặc Tả Tính Năng: Khởi Tạo & Ràng Buộc Duy Nhất 1 Active Roadmap

> **Mã tính năng:** `FR-RM-01`, `FR-RM-02`  
> **Thuộc cụm:** `04_PERSONAL_ROADMAP`  
> **Tác nhân:** Sinh viên (Student), Hệ thống (System)  
> **Mức độ ưu tiên:** Bắt buộc (P0 - MVP Invariant)  
> **Trạng thái:** Confirmed Business Decision  

---

## 1. Nghiệp Vụ Bất Biến

1. **Khởi tạo lộ trình (FR-RM-01):**
   - Khi sinh viên hoàn thành trắc nghiệm định hướng hoặc thiết lập mục tiêu tại hồ sơ cá nhân lần đầu tiên, hệ thống đối soát mục tiêu đó với bộ thư viện `roadmap_templates` của Admin để chọn mẫu lộ trình phù hợp nhất và nhân bản (clone) thành lộ trình cá nhân của sinh viên.
2. **Ràng buộc duy nhất 1 Active Roadmap (Single Active Roadmap - FR-RM-02 & BR-07):**
   - **Mỗi sinh viên tại mọi thời điểm chỉ có tối đa 01 bản ghi `Roadmap` có `status: "ACTIVE"`.**
   - Mọi thao tác truy vấn lộ trình hiển thị mặc định trên trang chủ (`/`) hay trang lộ trình (`/roadmap`) đều truy vấn với điều kiện: `{ studentId: currentStudentId, status: "ACTIVE" }`.
   - Nếu sinh viên có nhu cầu đổi mục tiêu, lộ trình hiện hành sẽ bị lưu trữ (`ARCHIVED`) trước khi kích hoạt lộ trình mới.

---

## 2. Tiêu Chí Chấp Thuận

- **AC-01:** Sinh viên truy cập trang `/roadmap`, hệ thống luôn hiển thị đúng duy nhất 1 lộ trình đang có hiệu lực.
- **AC-02:** Kiểm tra CSDL MongoDB, không bao giờ xuất hiện 2 bản ghi cùng `studentId` mang `status: "ACTIVE"`.

