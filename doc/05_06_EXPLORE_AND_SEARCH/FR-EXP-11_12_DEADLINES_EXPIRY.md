# Đặc Tả Tính Năng: Cơ Hội Không Hạn Chót & Xử Lý Hết Hạn

> **Mã tính năng:** `FR-EXP-11`, `FR-EXP-12`  
> **Thuộc cụm:** `05_06_EXPLORE_AND_SEARCH`  
> **Tác nhân:** Hệ thống (System), Quản trị viên (Admin)  
> **Trạng thái:** Confirmed Business Decision  

---

## 1. Cơ Hội Không Có Hạn Chót Cố Định (Optional Deadline - FR-EXP-11 & BR-15)

- Một số chương trình thực tập, học bổng mở quanh năm hoặc các câu lạc bộ tuyển thành viên liên tục có thể không có ngày hạn chót cụ thể (`deadline: null`).
- **Hành vi hệ thống:**
  - Hiển thị trên giao diện với nhãn: *"Tuyển dụng liên tục"* hoặc *"Không cố định hạn nộp"*.
  - Sinh viên vẫn có thể bấm "Lưu cơ hội" hoặc "Thêm vào lịch" để ghi nhận vào danh sách theo dõi của mình.
  - **Quy tắc bất biến:** Cơ hội không có hạn chót **TUYỆT ĐỐI KHÔNG KÍCH HOẠT THÔNG BÁO NHẮC HẸN 7, 3, 1 NGÀY** (FR-EXP-11).

---

## 2. Xử Lý Cơ Hội Hết Hạn (Expired Opportunities - FR-EXP-12)

- Khi thời gian hiện tại vượt quá `deadline`:
  - Cơ hội tự động được hiển thị với nhãn cảnh báo *"Đã hết hạn nộp đơn"*.
  - Nút "Thêm vào lịch" bị vô hiệu hóa để ngăn chặn sinh viên tạo mới các bản ghi theo dõi không còn giá trị.
  - Hệ thống hỗ trợ tác vụ tự động (Cron job) hoặc Admin thủ công chuyển trạng thái các cơ hội hết hạn sang `CLOSED` để tránh gây nhầm lẫn trên trang Khám phá.

