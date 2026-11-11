# Tính Năng: Admin CMS Quản Trị Câu Hỏi, Phương Án & Điểm Số (Admin Quiz CMS)

> **Mã SRS:** `FR-ONB-10`, `FR-ONB-11`, `FR-ONB-12`  
> **Trạng thái:** ![Hoàn thành](https://img.shields.io/badge/-ĐÃ%20HOÀN%20THÀNH%20100%25-emerald)  
> **Thuộc cụm:** `03_ONBOARDING_QUIZ`  
> **Tác nhân:** Quản trị viên (Admin)

---

## 1. Cách Thức Hoạt Động Hiện Tại (Implementation Details)

Quản trị viên có toàn quyền cấu hình ngân hàng câu hỏi và ma trận tính điểm trực tiếp qua giao diện CMS mà không cần can thiệp mã nguồn:

### 1.1 Giao Diện Admin CMS Quản Trị Trắc Nghiệm (`/admin/quiz`)
- **Tệp nguồn:** [`src/app/admin/quiz/page.tsx`](file:///c:/Users/AD/OneDrive/Desktop/Project/ULIS_DMST_2026/src/app/admin/quiz/page.tsx)
- **Bảng Thống Kê Tổng Quan:**
  - Tổng số câu hỏi, Số câu đang hoạt động, Tổng số phương án lựa chọn có gán điểm.
  - Nút **"Khôi phục chuẩn"** để đặt lại 5 câu hỏi mặc định của hệ thống.
  - Nút **"+ Thêm câu hỏi mới"**.
- **Danh Sách & Bộ Lọc:**
  - Lọc theo Chuyên mục khảo sát (`GOAL`, `INTEREST`, `PREPARATION`, `WORK_STYLE`, `ACADEMIC`, `SKILLS`).
  - Lọc theo Trạng thái: *Đang hoạt động* vs *Đang tạm ẩn*.
  - Accordion **"Xem phương án"**: Bung mở danh sách phương án A, B, C... kèm các tag điểm số cộng trực quan theo 5 nhóm nghề nghiệp.
  - Nút chuyển đổi nhanh **"Tạm ẩn / Kích hoạt"** một chạm.

### 1.2 Modal Soạn Thảo Câu Hỏi & Phương Án Lựa Chọn Động
- Nhập tiêu đề câu hỏi, chọn chuyên mục, số thứ tự `#order`, toggle kích hoạt.
- **Quản trị phương án động:**
  - Nút **"+ Thêm phương án"** để tạo thêm lựa chọn mới (tối thiểu 2 phương án).
  - Nhập nội dung text của từng phương án.
  - **Ma trận 5 ô điểm số trực tiếp:** Nhập điểm cộng (từ 0 đến 10) tương ứng cho:
    1. *Du học* (`study_abroad`)
    2. *Việc làm MNC / MT* (`employment`)
    3. *Nghiên cứu khoa học* (`research`)
    4. *Khởi nghiệp* (`startup`)
    5. *Kỹ năng toàn diện* (`skills`)
  - Nút xóa phương án (có kiểm tra ràng buộc tối thiểu 2 lựa chọn).

### 1.3 Backend APIs
- `GET /api/admin/quiz/questions`: Admin lấy danh sách toàn bộ câu hỏi và options.
- `POST /api/admin/quiz/questions`: Tạo câu hỏi mới (ghi `AuditLog` action `CREATE`).
- `PATCH /api/admin/quiz/questions/[id]`: Cập nhật câu hỏi/options (ghi `AuditLog` action `UPDATE` hoặc `STATUS_CHANGE`).
- `DELETE /api/admin/quiz/questions/[id]`: Xóa câu hỏi (ghi `AuditLog` action `DELETE`).
- `POST /api/admin/quiz/reset-default`: Khôi phục 5 câu hỏi chuẩn.

### 1.4 Loại Trừ Hoàn Toàn AI Trong MVP (`FR-ONB-12`)
- Toàn bộ khâu sinh câu hỏi và tính điểm đều chạy theo thuật toán Rule-based. Tuyệt đối không gọi tới các API LLM của bên thứ ba, đảm bảo tính ổn định và tính giải thích được 100%.
