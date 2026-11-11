# Tính Năng: Ràng Buộc Bất Biến Duy Nhất 1 Active Roadmap (Single Active Roadmap)

> **Mã SRS:** `FR-RM-01`, `FR-RM-02`, `BR-07`  
> **Trạng thái:** ![Hoàn thành](https://img.shields.io/badge/-ĐÃ%20HOÀN%20THÀNH%20100%25-emerald)  
> **Thuộc cụm:** `04_PERSONAL_ROADMAP`  
> **Tác nhân:** Sinh viên (Student), Hệ thống (System)

---

## 1. Cách Thức Hoạt Động Hiện Tại (Implementation Details)

Theo nguyên tắc bất biến nghiệp vụ của SRS 1.0:
> *"Each Student has no more than one active roadmap at any given time (BR-07)."*

### 1.1 Kiểm Soát Trạng Thái Trong CSDL
- Mô hình [`src/models/Roadmap.ts`](file:///c:/Users/AD/OneDrive/Desktop/Project/ULIS_DMST_2026/src/models/Roadmap.ts) quy định trường `status: "ACTIVE" | "ARCHIVED"`.
- Khi sinh viên cập nhật mục tiêu mới tại `/profile` hoặc nộp lại trắc nghiệm tại `/onboarding`:
  ```typescript
  // 1. Lưu trữ toàn bộ lộ trình active cũ
  await Roadmap.updateMany(
    { studentId: user.id, status: "ACTIVE" },
    { $set: { status: "ARCHIVED" } }
  );

  // 2. Kích hoạt lộ trình mới
  const newRoadmap = await Roadmap.create({
    studentId: user.id,
    status: "ACTIVE",
    ...
  });
  ```
- **Kết quả:** Tuyệt đối không bao giờ xuất hiện 2 bản ghi cùng `studentId` mang `status = "ACTIVE"`.

### 1.2 Truy Vấn Hiển Thị
- API `GET /api/roadmap` luôn lọc với điều kiện: `{ studentId: user.id, status: "ACTIVE" }`.
- Nếu sinh viên chưa có lộ trình active nào, API tự động khởi tạo lộ trình 4 năm chuẩn dựa trên mục tiêu hiện có trong hồ sơ sinh viên.
