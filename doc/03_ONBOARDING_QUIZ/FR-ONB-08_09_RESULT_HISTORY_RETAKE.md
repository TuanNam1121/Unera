# Đặc Tả Tính Năng: Lịch Sử Kết Quả & Làm Lại Trắc Nghiệm (Retake)

> **Mã tính năng:** `FR-ONB-08`, `FR-ONB-09`  
> **Thuộc cụm:** `03_ONBOARDING_QUIZ`  
> **Tác nhân:** Sinh viên (Student)  

---

## 1. Nghiệp Vụ Tính Năng

1. **Lịch sử kết quả (Result History - FR-ONB-08):**
   - Sinh viên có thể vào trang cá nhân để xem lại toàn bộ các lần làm trắc nghiệm trước đây.
   - Mỗi bản ghi lịch sử hiển thị: Ngày làm bài, danh sách câu trả lời đã chọn, số điểm từng hướng đi và kết quả đề xuất.
2. **Làm lại trắc nghiệm (Retake Quiz - FR-ONB-09):**
   - Sinh viên được phép làm lại bài trắc nghiệm bất cứ khi nào nhận thấy mục tiêu hoặc sở thích của mình thay đổi.
   - **Bảo toàn lịch sử:** Lần làm mới sẽ tạo một bản ghi `QuizResult` độc lập mới, tuyệt đối không ghi đè hoặc xóa bỏ các kết quả cũ.
   - Kết quả mới nhất được đánh dấu là kết quả hiện hành (Current Active Result).

