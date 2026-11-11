# Đặc Tả Tính Năng: Chống Trùng Lặp & Xử Lý Cơ Hội Không Hạn

> **Mã tính năng:** `FR-CAL-11`, `FR-CAL-12`, `FR-CAL-13`, `FR-CAL-14`  
> **Thuộc cụm:** `08_CALENDAR_AND_DEADLINES`  
> **Tác nhân:** Hệ thống (System), Sinh viên (Student)  

---

## 1. Nghiệp Vụ Bất Biến

1. **Ngăn chặn trùng lặp bản ghi lịch (FR-CAL-11):**
   - Nếu sinh viên bấm nút "Thêm vào lịch" nhiều lần liên tiếp, hệ thống sử dụng cơ chế `upsert` hoặc kiểm tra tồn tại dựa trên Unique Compound Index `{ studentId: 1, opportunityId: 1 }`.
   - Tuyệt đối không sinh ra 2 bản ghi lịch cùng theo dõi một cơ hội.
2. **Cơ hội không có hạn chót (No Deadline - FR-CAL-12):**
   - Cơ hội không có ngày hạn cụ thể (`deadline: null`) có thể xuất hiện trong danh mục "Cơ hội đang theo dõi", nhưng hệ thống không lên lịch nhắc hẹn 7/3/1 ngày.
3. **Độc lập với Danh sách Lưu (Saved Independence - FR-CAL-14):**
   - Thêm vào lịch và Lưu cơ hội là 2 thực thể độc lập. Gỡ khỏi lịch không làm mất bookmark, và bỏ lưu bookmark không làm mất lịch theo dõi.

