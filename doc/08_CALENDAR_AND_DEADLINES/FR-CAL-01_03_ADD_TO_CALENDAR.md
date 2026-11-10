# Đặc Tả Tính Năng: Hành Động Tường Minh "Thêm Vào Lịch"

> **Mã tính năng:** `FR-CAL-01`, `FR-CAL-02`, `FR-CAL-03`  
> **Thuộc cụm:** `08_CALENDAR_AND_DEADLINES`  
> **Tác nhân:** Sinh viên (Student)  
> **Mức độ ưu tiên:** Bắt buộc (P0 - Crucial Invariant)  
> **Trạng thái:** Confirmed Business Decision  

---

## 1. Nghiệp Vụ Bất Biến

1. **Vị trí và nhãn nút bấm (FR-CAL-01):**
   - Trên mọi trang chi tiết cơ hội và thẻ cơ hội, hệ thống cung cấp một nút bấm được dán nhãn rõ ràng: **"Thêm vào lịch"** (Add to Calendar).
2. **Kích hoạt ghi nhận tường minh (FR-CAL-02):**
   - Chỉ khi sinh viên nhấn trực tiếp vào nút này, hệ thống mới gửi request `POST /api/calendar` để tạo hoặc kích hoạt lại bản ghi `CalendarEntry`.
   - Sau khi bấm, nút chuyển sang trạng thái: **"Đã thêm vào lịch"** (kèm icon dấu tích xanh) và thông báo toast xác nhận thời gian nhắc nhở (7, 3, 1 ngày).
3. **Tuyệt đối không tự ý thêm khi chỉ xem (FR-CAL-03 & BR-16):**
   - Việc sinh viên mở xem trang chi tiết cơ hội hoặc lướt qua danh sách tìm kiếm **KHÔNG ĐƯỢC PHÉP tự động tạo bản ghi lịch**. Sinh viên phải có toàn quyền kiểm soát danh sách theo dõi cá nhân của mình.

---

## 2. Tiêu Chí Chấp Thuận

- **AC-01:** Sinh viên mở xem 10 cơ hội khác nhau trên trang `/explore`. Kiểm tra lịch cá nhân `/calendar` hoàn toàn trống nếu sinh viên chưa từng bấm nút "Thêm vào lịch".
- **AC-02:** Sinh viên bấm "Thêm vào lịch" cho 1 cơ hội có hạn chót 18/11. Cơ hội xuất hiện ngay lập tức trên Lịch cá nhân và khối "Hạn sắp tới" ở Trang chủ.
