# Cụm Tính Năng 04: Lộ Trình Phát Triển Cá Nhân Hóa (Personal Roadmap)

> **Mã Module:** `ROADMAP`  
> **Căn cứ SRS:** Mục 4.4 (FR-RM-01 đến FR-RM-16)  
> **Tác nhân:** Sinh viên (Student), Quản trị viên (Admin)  
> **Trọng tâm cốt lõi:** Lộ trình 4 cấp bậc, duy nhất 1 Active Roadmap, tự động tái sinh khi đổi mục tiêu.

---

## 1. Tổng Quan Nghiệp Vụ Cụm Tính Năng

Lộ trình phát triển là "xương sống" đồng hành cùng sinh viên trong suốt 4 năm đại học tại UNERA:
1. **Duy nhất một lộ trình hoạt động (Single Active Roadmap - FR-RM-02 & BR-07):**
   - Mỗi sinh viên **chỉ có duy nhất 01 lộ trình ở trạng thái `ACTIVE`** tại một thời điểm.
   - Không hỗ trợ chạy song song nhiều lộ trình active để tránh gây phân tâm và mất tính định hướng.
2. **Cấu trúc 4 cấp bậc chuẩn hóa (FR-RM-03):**
   - **Năm học (Academic Year):** Năm 1, Năm 2, Năm 3, Năm 4, Năm 5+.
   - **Học kỳ (Semester):** Học kỳ 1, Học kỳ 2.
   - **Cột mốc (Milestones):** Mục tiêu lớn của kỳ (ví dụ: *Nền tảng ngoại ngữ, Hoàn thành đề cương NCKH, Xây dựng Portfolio cá nhân*).
   - **Đầu việc (Tasks):** Các hành động cụ thể có thể đánh dấu hoàn thành (ví dụ: *Luyện đề Cambridge IELTS, Viết tóm tắt tài liệu tham khảo, Thiết kế 3 màn hình mẫu*).
3. **Vòng đời Tự động Tái sinh (Automatic Regeneration - FR-RM-08, 09, 14):**
   - Khi sinh viên thay đổi mục tiêu tại Hồ sơ, hệ thống lập tức tự sinh một Lộ trình mới. Lộ trình cũ được chuyển thành `ARCHIVED` (Lưu trữ lịch sử) và lưu giữ toàn bộ tiến độ đã thực hiện.
4. **Bảo toàn khi sinh thất bại (Failure-safe Preservation - FR-RM-13 & BR-10):**
   - Nếu việc sinh lộ trình mới gặp lỗi kỹ thuật, hệ thống giữ nguyên vẹn lộ trình cũ đang hoạt động.
5. **Chỉnh sửa có ràng buộc (Constrained Editing - FR-RM-05):**
   - Sinh viên được phép tích chọn hoàn thành đầu việc (`completed: true/false`), đổi hạn chót hoặc thêm ghi chú cá nhân, nhưng **không được phép phá vỡ cấu trúc khung bắt buộc** của template mà Admin đã thẩm định.

---

## 2. Kiến Trúc Dữ Liệu `roadmaps` & `roadmap_templates`

Tham chiếu [`src/models/Roadmap.ts`](file:///c:/Users/AD/OneDrive/Desktop/Project/ULIS_DMST_2026/src/models/Roadmap.ts) và [`src/models/RoadmapTemplate.ts`](file:///c:/Users/AD/OneDrive/Desktop/Project/ULIS_DMST_2026/src/models/RoadmapTemplate.ts):

```typescript
interface IRoadmap {
  _id: ObjectId;
  studentId: string;
  status: "ACTIVE" | "ARCHIVED";
  templateId?: ObjectId;
  goalSnapshot: Record<string, any>; // Lưu ảnh chụp mục tiêu tại thời điểm sinh lộ trình
  progressPercent: number;           // 0 đến 100%
  years: {
    yearNumber: number;
    semesters: {
      semesterNumber: number;
      milestones: {
        id: string;
        title: string;
        tasks: {
          id: string;
          title: string;
          description?: string;
          completed: boolean;
          dueDate?: Date;
        }[];
      }[];
    }[];
  }[];
  createdAt: Date;
  updatedAt: Date;
}
```

---

## 3. Danh Mục Các Tính Năng Chi Tiết

| Mã Tính Năng | Tên Tính Năng | File Đặc Tả |
|---|---|---|
| **FR-RM-01 & 02** | Khởi tạo & Ràng buộc Duy nhất 1 Active Roadmap | [`FR-RM-01_02_ACTIVE_ROADMAP.md`](./FR-RM-01_02_ACTIVE_ROADMAP.md) |
| **FR-RM-03 & 04** | Cấu trúc 4 cấp bậc & Templates Admin quản trị | [`FR-RM-03_04_STRUCTURE_TEMPLATES.md`](./FR-RM-03_04_STRUCTURE_TEMPLATES.md) |
| **FR-RM-05 & 07** | Chỉnh sửa có ràng buộc & Công thức tính tiến độ | [`FR-RM-05_07_TASK_PROGRESS.md`](./FR-RM-05_07_TASK_PROGRESS.md) |
| **FR-RM-08, 09, 14**| Tự động tái sinh khi đổi mục tiêu & Tính nhất quán | [`FR-RM-08_09_AUTO_REGENERATION.md`](./FR-RM-08_09_AUTO_REGENERATION.md) |
| **FR-RM-10 & 11** | Lưu trữ lịch sử lộ trình & Ảnh chụp mục tiêu (Snapshot) | [`FR-RM-10_11_HISTORY_SNAPSHOT.md`](./FR-RM-10_11_HISTORY_SNAPSHOT.md) |
| **FR-RM-13 & 16** | Bảo toàn lộ trình khi lỗi & Quy định sửa lịch sử | [`FR-RM-13_16_FAILURE_PRESERVATION.md`](./FR-RM-13_16_FAILURE_PRESERVATION.md) |
