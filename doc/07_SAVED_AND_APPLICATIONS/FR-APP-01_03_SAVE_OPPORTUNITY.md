# Đặc Tả Tính Năng: Lưu & Bỏ Lưu Cơ Hội (Bookmark Độc Lập)

> **Mã tính năng:** `FR-APP-01`, `FR-APP-02`, `FR-APP-03`  
> **Thuộc cụm:** `07_SAVED_AND_APPLICATIONS`  
> **Tác nhân:** Sinh viên (Student)  
> **Mức độ ưu tiên:** Bắt buộc (P0 - MVP)  

---

## 1. Nghiệp Vụ Tính Năng

1. **Lưu cơ hội (Save - FR-APP-01):**
   - Sinh viên bấm biểu tượng lá cờ (Bookmark) trên thẻ cơ hội hoặc trang chi tiết.
   - Hệ thống tạo bản ghi liên kết giữa sinh viên và cơ hội trong `saved_opportunities`.
   - Trạng thái icon chuyển sang màu xanh dương lấp đầy (`fill-blue-600 text-blue-600`).
   - Hành động lưu chỉ đóng vai trò đánh dấu (bookmark) để đọc lại sau, **tuyệt đối không đưa cơ hội này vào lịch và không bật tính năng nhắc hẹn hạn chót**.
2. **Bỏ lưu (Unsave - FR-APP-02):**
   - Bấm lại vào icon bookmark đã lưu để gỡ cơ hội khỏi danh sách lưu.
   - Thao tác bỏ lưu không ảnh hưởng đến bản ghi theo dõi trong lịch (nếu sinh viên đã từng thêm vào lịch trước đó).
3. **Danh sách cơ hội đã lưu (Saved List - FR-APP-03):**
   - Trang `/saved` hoặc tab "Đã lưu" trong hồ sơ hiển thị toàn bộ các cơ hội sinh viên đã bookmark.

---

## 2. API Contract

- **Lưu:** `POST /api/saved` `{ "opportunityId": "..." }` (HTTP 200/201)
- **Bỏ lưu:** `DELETE /api/saved?opportunityId=...` (HTTP 200)
- **Danh sách:** `GET /api/saved` (Trả về mảng cơ hội đã lưu kèm thông tin populate)

