# Đặc Tả Tính Năng: Tự Động Tái Sinh Lộ Trình Khi Đổi Mục Tiêu

> **Mã tính năng:** `FR-RM-08`, `FR-RM-09`, `FR-RM-14`  
> **Thuộc cụm:** `04_PERSONAL_ROADMAP`  
> **Tác nhân:** Sinh viên (Student), Hệ thống (System)  
> **Mức độ ưu tiên:** Bắt buộc (P0 - Crucial Invariant)  
> **Trạng thái:** Confirmed Business Decision  

---

## 1. Nghiệp Vụ Bất Biến

1. **Tự động kích hoạt không cần nút phụ (FR-RM-08):**
   - Khi sinh viên lưu thay đổi mục tiêu phát triển tại Hồ sơ, hệ thống tự động chạy quy trình sinh Lộ trình mới ngay lập tức. Không yêu cầu sinh viên phải tìm kiếm hoặc nhấn thêm nút "Tạo lại lộ trình".
2. **Quy trình thay thế lộ trình nguyên tử (Atomic Replacement - FR-RM-09, FR-RM-14):**
   - **Bước 1:** Kiểm tra tính hợp lệ của mục tiêu mới.
   - **Bước 2:** Lấy mẫu template lộ trình tương ứng.
   - **Bước 3:** Sinh dữ liệu lộ trình mới (kèm `goalSnapshot` lưu mục tiêu tại thời điểm sinh).
   - **Bước 4 (Transaction/Atomic Transition):**
     - Đổi trạng thái của Lộ trình hiện tại từ `ACTIVE` -> `ARCHIVED`.
     - Lưu Lộ trình mới với trạng thái `ACTIVE`.
   - **Đảm bảo tính nhất quán tuyệt đối:** Không bao giờ để xảy ra tình trạng sinh viên có 2 lộ trình cùng `ACTIVE`, hoặc không có lộ trình nào `ACTIVE` sau khi thao tác.

---

## 2. Tiêu Chí Chấp Thuận

- **AC-01:** Sinh viên đổi mục tiêu từ "Việc làm" sang "Du học". Lộ trình cũ được đưa vào lịch sử lưu trữ (`ARCHIVED`), lộ trình mới chứa các nhiệm vụ du học lập tức trở thành lộ trình chính (`ACTIVE`).
- **AC-02:** Tiến độ và các nhiệm vụ sinh viên đã tích chọn ở lộ trình cũ vẫn được giữ nguyên vẹn trong bản ghi đã lưu trữ để sinh viên có thể xem lại lịch sử phấn đấu.

