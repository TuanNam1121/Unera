# Đặc Tả Tính Năng: Chỉnh Sửa Có Ràng Buộc & Công Thức Tính Tiến Độ

> **Mã tính năng:** `FR-RM-05`, `FR-RM-06`, `FR-RM-07`  
> **Thuộc cụm:** `04_PERSONAL_ROADMAP`  
> **Tác nhân:** Sinh viên (Student)  
> **Mức độ ưu tiên:** Bắt buộc (P0 - MVP)  

---

## 1. Nghiệp Vụ Chỉnh Sửa Có Ràng Buộc (Constrained Editing - FR-RM-05, FR-RM-06)

1. **Hành động được phép thực hiện:**
   - Tích chọn hoặc bỏ tích hoàn thành một đầu việc (`completed: true / false`).
   - Đặt lại hạn chót hoàn thành (`dueDate`) phù hợp với tiến độ cá nhân.
   - Bổ sung thêm nhiệm vụ cá nhân phụ vào trong một cột mốc đã có.
2. **Hành động bị ngăn chặn (Constraints):**
   - Không được phép xóa bỏ các năm học hoặc cột mốc cốt lõi do template quy định.
   - Không được phép thay đổi cấu trúc năm học thành một cấu trúc phi chuẩn.

---

## 2. Công Thức Tính Phần Trăm Tiến Độ (Progress Formula - FR-RM-07)

Hệ thống tự động tính toán lại tiến độ hoàn thành mỗi khi có bất kỳ thay đổi nào về trạng thái nhiệm vụ:

$$\text{ProgressPercent} = \begin{cases} 0 & \text{nếu } \text{TotalTasks} = 0 \\ \operatorname{round}\left( \dfrac{\text{CompletedTasks}}{\text{TotalTasks}} \times 100 \right) & \text{nếu } \text{TotalTasks} > 0 \end{cases}$$

- **Đồng bộ tự động qua Mongoose Middleware:**
  Trong file [`src/models/Roadmap.ts`](file:///c:/Users/AD/OneDrive/Desktop/Project/ULIS_DMST_2026/src/models/Roadmap.ts), hook `pre("save")` tự động đếm tổng số task và số task hoàn thành để gán trường `progressPercent`.
- **Hiển thị trực quan trên giao diện:**
  - Hiển thị tỷ lệ phần trăm đậm nét (ví dụ: `67%`) kèm số lượng bước hoàn tất (ví dụ: `8 / 12 bước hoàn tất`).
  - Thanh tiến độ bo tròn nền xanh dương lấp đầy theo tỷ lệ phần trăm (như trong ảnh mẫu UI tham khảo).

---

## 3. Tiêu Chí Chấp Thuận

- **AC-01:** Sinh viên bấm tick vào nhiệm vụ "Nộp cover letter". Tiến độ tăng từ 67% lên 75% ngay lập tức mà không cần tải lại toàn bộ trang.
- **AC-02:** Sinh viên bấm bỏ tick, tiến độ tự động giảm tương ứng.
