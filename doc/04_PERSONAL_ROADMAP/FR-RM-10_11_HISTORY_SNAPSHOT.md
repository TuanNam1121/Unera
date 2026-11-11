# Đặc Tả Tính Năng: Lịch Sử Lộ Trình & Ảnh Chụp Mục Tiêu (Snapshot)

> **Mã tính năng:** `FR-RM-10`, `FR-RM-11`  
> **Thuộc cụm:** `04_PERSONAL_ROADMAP`  
> **Tác nhân:** Sinh viên (Student)  

---

## 1. Nghiệp Vụ Tính Năng

1. **Lịch sử Lộ trình (Roadmap History - FR-RM-10):**
   - Sinh viên có thể truy cập tab "Lịch sử lộ trình" trên trang `/roadmap`.
   - Danh sách hiển thị các lộ trình đã được lưu trữ trong quá khứ, ghi rõ: Thời gian bắt đầu, thời gian lưu trữ, tỷ lệ phần trăm đã đạt được tại thời điểm đổi mục tiêu.
2. **Ảnh chụp mục tiêu (Goal Snapshot - FR-RM-11):**
   - Mỗi bản ghi lộ trình (kể cả active và archived) đều mang theo trường `goalSnapshot` lưu giữ chính xác các lựa chọn mục tiêu mà sinh viên đã chọn tại thời điểm sinh lộ trình đó.
   - Giúp sinh viên và người hướng dẫn (nếu có) hiểu rõ bối cảnh và lý do tại sao lộ trình lịch sử lại được cấu trúc như vậy.

