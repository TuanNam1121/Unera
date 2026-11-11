# Đặc Tả Tính Năng: Quản Lý Hồ Sơ Ứng Tuyển, Ghi Chú & Lịch Sử Tiến Độ

> **Mã tính năng:** `FR-APP-04`, `FR-APP-06`, `FR-APP-07`  
> **Thuộc cụm:** `07_SAVED_AND_APPLICATIONS`  
> **Tác nhân:** Sinh viên (Student)  

---

## 1. Nghiệp Vụ Tính Năng

1. **Khởi tạo hồ sơ ứng tuyển cá nhân (FR-APP-04):**
   - Từ trang chi tiết cơ hội, sinh viên có thể bấm "Bắt đầu theo dõi ứng tuyển".
   - Hệ thống tạo một bản ghi `Application` liên kết với tài khoản sinh viên.
2. **Ghi chú cá nhân (Personal Notes - FR-APP-06):**
   - Sinh viên có thể nhập ghi chú riêng tư (tối đa 2,000 ký tự) cho từng hồ sơ ứng tuyển, ví dụ: *Người liên hệ HR, yêu cầu bài test vòng 2, câu hỏi cần chuẩn bị*.
   - Ghi chú hoàn toàn riêng tư, chỉ sinh viên sở hữu mới xem được.
3. **Lịch sử thay đổi trạng thái (Application History - FR-APP-07):**
   - Mỗi lần sinh viên đổi trạng thái (ví dụ từ *Đang chuẩn bị* sang *Đã nộp đơn*), hệ thống tự động đẩy một phần tử mới vào mảng `history`:
     ```typescript
     { status: "APPLIED", updatedAt: new Date(), note: "Đã gửi email lúc 10h sáng" }
     ```
   - Cho phép sinh viên xem lại dòng thời gian tiến triển của từng bộ hồ sơ.

