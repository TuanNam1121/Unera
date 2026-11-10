# Đặc Tả Tính Năng: Bảng Kanban Theo Dõi Ứng Tuyển Trực Quan

> **Mã tính năng:** `FR-TOOL-06`  
> **Thuộc cụm:** `11_STUDENT_TOOLS` (Liên kết với `07_SAVED_AND_APPLICATIONS`)  
> **Tác nhân:** Sinh viên (Student)  
> **Mức độ ưu tiên:** Quan trọng (P1)  

---

## 1. Nghiệp Vụ & Giao Diện Bảng Kanban

1. **Bố cục 7 cột chuẩn hóa:**
   Bảng Kanban tại `/applications/kanban` chia thành 7 làn cột tương ứng với 7 trạng thái của `FR-APP-05`:
   - Cột 1: **Quan tâm** (`INTERESTED`)
   - Cột 2: **Đang chuẩn bị hồ sơ** (`PREPARING`)
   - Cột 3: **Đã nộp đơn** (`APPLIED`)
   - Cột 4: **Đang phỏng vấn** (`INTERVIEWING`)
   - Cột 5: **Trúng tuyển / Được nhận** (`ACCEPTED`)
   - Cột 6: **Không trúng tuyển** (`REJECTED`)
   - Cột 7: **Rút hồ sơ** (`WITHDRAWN`)
2. **Thẻ ứng tuyển (Kanban Card):**
   - Tên cơ hội (kèm liên kết mở nhanh chi tiết).
   - Danh mục cơ hội (nhãn pastel chuẩn màu).
   - Hạn nộp đơn & Đếm ngược ngày.
   - Ghi chú cá nhân ngắn (nếu có).
3. **Thao tác chuyển trạng thái:**
   - Kéo-thả (Drag & Drop) mượt mà giữa các cột, hoặc bấm menu 3 chấm trên thẻ để chọn "Chuyển sang...".
   - Khi chuyển trạng thái, hệ thống tự động ghi nhật ký lịch sử kèm thời gian thay đổi.
