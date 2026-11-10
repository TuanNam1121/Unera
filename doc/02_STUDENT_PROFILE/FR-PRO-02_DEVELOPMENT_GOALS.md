# Đặc Tả Tính Năng: Quản Lý Mục Tiêu Phát Triển (Trigger Tự Sinh Lộ Trình)

> **Mã tính năng:** `FR-PRO-02` (Liên kết mật thiết với `FR-RM-08`, `FR-RM-09`)  
> **Thuộc cụm:** `02_STUDENT_PROFILE`  
> **Tác nhân:** Sinh viên (Student)  
> **Mức độ ưu tiên:** Bắt buộc (P0 - MVP)  
> **Trạng thái:** Confirmed Business Decision  

---

## 1. Nghiệp Vụ Bất Biến (Crucial Invariants)

1. **5 Nhóm mục tiêu phát triển chuẩn:**
   - `studyAbroad`: Mục tiêu du học, học bổng sau đại học.
   - `employment`: Mục tiêu việc làm tại các doanh nghiệp/tập đoàn đa quốc gia.
   - `scientificResearch`: Mục tiêu nghiên cứu khoa học sinh viên, viết bài báo học thuật.
   - `startup`: Khởi nghiệp hoặc tham gia vườn ươm đổi mới sáng tạo.
   - `personalGrowth`: Nâng cao kỹ năng mềm, chứng chỉ ngoại ngữ, hoạt động cộng đồng.
2. **Kích hoạt tự động sinh Lộ trình (Automatic Roadmap Regeneration - BR-08, BR-09):**
   - **Khi sinh viên lưu thay đổi mục tiêu phát triển, hệ thống NGAY LẬP TỨC tự động sinh một Lộ trình mới.**
   - Sinh viên không cần phải ấn thêm nút "Tạo lộ trình" thủ công.
   - Lộ trình cũ đang hoạt động (`ACTIVE`) sẽ được chuyển sang trạng thái lưu trữ (`ARCHIVED`) để lưu giữ lịch sử.
   - Lộ trình mới được kích hoạt và gán làm lộ trình duy nhất có hiệu lực (`ACTIVE`).
3. **Bảo toàn khi sinh lộ trình thất bại (Generation Failure Preservation - BR-10, FR-RM-13):**
   - Nếu quá trình sinh lộ trình mới gặp sự cố (ví dụ: không tìm thấy template phù hợp hoặc lỗi tính toán), hệ thống **bắt buộc phải giữ nguyên Lộ trình hiện tại đang có**.
   - Tuyệt đối không xóa bỏ hay để sinh viên rơi vào trạng thái không có lộ trình hoạt động.

---

## 2. API Contract & Luồng Xử Lý

- **Endpoint:** `PUT /api/profile/goals`
- **Request Body (Zod Validation):**
  ```typescript
  export const updateGoalsSchema = z.object({
    studyAbroad: z.boolean().default(false),
    employment: z.boolean().default(false),
    scientificResearch: z.boolean().default(false),
    startup: z.boolean().default(false),
    personalGrowth: z.boolean().default(false),
    notes: z.string().max(1000).optional(),
  });
  ```
- **Hành vi phía Server:**
  1. Xác thực session người dùng và lấy `studentId`.
  2. Bắt đầu transaction hoặc luồng an toàn:
     - Cập nhật trường `developmentGoals` trong `StudentProfile`.
     - Tìm kiếm `RoadmapTemplate` phù hợp với nhóm mục tiêu mới chọn.
     - Khởi tạo thực thể `Roadmap` mới mang `status: "ACTIVE"`.
     - Chuyển lộ trình cũ của sinh viên sang `status: "ARCHIVED"`.
     - Lưu `goalSnapshot` vào bản ghi lộ trình mới để lưu giữ ngữ cảnh mục tiêu tại thời điểm tạo.
  3. Trả về thông tin lộ trình mới vừa sinh.

---

## 3. Tiêu Chí Chấp Thuận

- **AC-01:** Sinh viên tích chọn thêm mục tiêu "Du học" và bấm Lưu. Lộ trình của sinh viên tự động cập nhật thêm các cột mốc ôn thi IELTS, chuẩn bị bài luận và thư giới thiệu.
- **AC-02:** Số lượng lộ trình mang `status: "ACTIVE"` của sinh viên trong cơ sở dữ liệu luôn chính xác bằng `1`.
