# PRO-02: Các Tab Hồ Sơ — Kỹ Năng, Bảng Thành Tích & Lộ Trình Cá Nhân

> **Module:** `02_STUDENT_PROFILE`  
> **Yêu cầu:** Trong phần hồ sơ cá nhân xem được các tab: (1) Kỹ năng chuyên môn & Kỹ năng Mềm + (2) Bảng thành tích *(đã có trong code hiện tại)* + (3) Lộ trình cá nhân.  
> **Tham chiếu code hiện tại:** [`src/app/profile/page.tsx`](file:///c:/Users/AD/OneDrive/Desktop/Project/ULIS_DMST_2026/src/app/profile/page.tsx#L710-L895).

---

## 1. Cấu Trúc Thanh Điều Hướng Tab Trên `/profile`

Gồm 4 tab rõ ràng (hỗ trợ sync query param `?tab=info|skills|achievements|roadmap`):
1. `info`: **Thông tin & Học vấn**
2. `skills`: **Kỹ năng chuyên môn & Kỹ năng mềm** (hiển thị badge tổng số kỹ năng)
3. `achievements`: **Bảng vàng thành tích** (hiển thị badge tổng số thành tích)
4. `roadmap`: **Lộ trình cá nhân** (tích hợp trực tiếp với dữ liệu `Roadmap` của Module 8)

---

## 2. Đặc Tả Từng Tab

### 2.1 Tab Kỹ Năng Chuyên Môn & Kỹ năng Mềm *(Kế thừa & Mở rộng code hiện tại)*
- **Hiện trạng ([`src/app/profile/page.tsx`](file:///c:/Users/AD/OneDrive/Desktop/Project/ULIS_DMST_2026/src/app/profile/page.tsx#L711-L808)):** Đã có giao diện thêm tag kỹ năng, nút Enter/Thêm, danh sách gợi ý nhanh (`IELTS`, `TOEIC`, `Python`, `Figma`, `Thuyết trình`, ...), nút xóa từng tag và nút "Lưu danh sách kỹ năng".
- **Nâng cấp cần làm:**
  - Phân tách giao diện thành 2 nhóm rõ ràng trong cùng tab:
    1. **Kỹ năng Chuyên môn (Hard Skills):** VD `IELTS`, `Python`, `SQL`, `Phân tích tài chính`, `Biên phiên dịch`, `Figma`... (badge màu xanh dương `bg-blue-50 text-blue-700`).
    2. **Kỹ năng Mềm (Soft Skills):** VD `Thuyết trình`, `Làm việc nhóm`, `Quản lý dự án`, `Giao tiếp đa văn hóa`, `Tư duy phản biện`... (badge màu tím/xanh ngọc `bg-indigo-50 text-indigo-700`).
  - Hỗ trợ nút chọn nhóm khi thêm mới (`Chuyên môn` | `Kỹ năng mềm`) + gợi ý nhanh theo từng nhóm.
  - Khi lưu qua `PUT /api/profile`, đồng bộ mảng `hardSkills`, `softSkills` và gộp vào `skills` để tương thích ngược toàn bộ nơi khác (AI Prompt, CV Builder).

### 2.2 Tab Bảng Thành Tích *(Kế thừa code hiện tại)*
- **Hiện trạng ([`src/app/profile/page.tsx`](file:///c:/Users/AD/OneDrive/Desktop/Project/ULIS_DMST_2026/src/app/profile/page.tsx#L811-L895)):** Đã có input nhập giải thưởng/thành tích, danh sách thẻ hiển thị biểu tượng cúp, nút xóa từng dòng, empty state và nút "Lưu bảng vàng thành tích".
- **Quy tắc bổ sung:**
  - Bảo toàn 100% tính năng thêm/xóa/lưu `achievements` hiện tại.
  - Có thể hiển thị thêm gợi ý định dạng nhập (VD: `"Giải Nhất NCKH Sinh viên 2025"`, `"Học bổng Khuyến khích học tập HK1"`), ngăn trùng lặp chuỗi hoàn toàn giống nhau và cắt khoảng trắng thừa.

### 2.3 Tab Lộ Trình Cá Nhân *(Mới trong `/profile`)*
- **Mục tiêu:** Giúp sinh viên xem nhanh toàn cảnh lộ trình phát triển cá nhân của mình ngay trong trang Hồ sơ mà không phải chuyển trang, đồng thời liên kết mượt mà sang trang quản lý chi tiết `/roadmap` (Module 8).
- **Dữ liệu hiển thị:** Gọi `GET /api/roadmap` (lộ trình `ACTIVE` duy nhất).
  - **Trường hợp 1 — Đã có lộ trình ACTIVE:**
    - Hiển thị **Thẻ Tổng quan Định hướng & Tiến độ**: Tên định hướng mục tiêu (từ AI hoặc mục tiêu đã chọn), thanh progress bar `%` hoàn thành tổng thể (`completedGoals / totalGoals`).
    - Hiển thị **Tóm tắt theo 4 năm học (Năm 1 – Năm 4)**: mỗi năm hiển thị số mục tiêu đã hoàn thành / tổng số mục tiêu, và danh sách rút gọn các mục tiêu sắp tới hoặc đang thực hiện (`IN_PROGRESS` / `NOT_STARTED`).
    - Cho phép **tick hoàn thành nhanh mục tiêu** ngay từ tab này (`PATCH /api/roadmap/goals/[goalId]/status`) hoặc bấm nút **"Mở trình quản lý Lộ trình đầy đủ →"** dẫn tới `/roadmap`.
  - **Trường hợp 2 — Chưa có lộ trình:**
    - Hiển thị Empty State thân thiện: *"Bạn chưa có lộ trình cá nhân hóa từ AI"* kèm 2 nút CTA: **"Làm Trắc nghiệm Định hướng ngay"** (`/onboarding`) và **"Xem mục Lộ trình"** (`/roadmap`).

---

## 3. Tiêu Chí Chấp Thuận (Acceptance Criteria)

- **AC-01:** *Given* sinh viên mở tab Kỹ năng, *When* thêm kỹ năng vào nhóm "Kỹ năng chuyên môn" và "Kỹ năng mềm" rồi bấm Lưu, *Then* `hardSkills`, `softSkills`, và `skills` được lưu bền vững vào `StudentProfile` và giữ nguyên sau khi reload trang.
- **AC-02:** *Given* sinh viên mở tab Bảng thành tích, *When* thêm mới hoặc xóa thành tích và lưu, *Then* thay đổi được lưu đúng vào `StudentProfile.achievements`.
- **AC-03:** *Given* sinh viên đã tạo lộ trình AI ở Module 8, *When* bấm sang tab "Lộ trình cá nhân" trong `/profile`, *Then* hiển thị chính xác tiến độ tổng thể, tóm tắt Năm 1–4 và nút điều hướng tới `/roadmap`.

