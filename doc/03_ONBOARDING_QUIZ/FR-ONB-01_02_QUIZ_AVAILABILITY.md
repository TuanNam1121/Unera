# Đặc Tả Tính Năng: Luồng Làm Trắc Nghiệm & Quyền Bỏ Qua (Skip)

> **Mã tính năng:** `FR-ONB-01`, `FR-ONB-02`  
> **Thuộc cụm:** `03_ONBOARDING_QUIZ`  
> **Tác nhân:** Sinh viên (Student)  
> **Mức độ ưu tiên:** Bắt buộc (P0 - MVP)  
> **Trạng thái:** Confirmed Business Decision  

---

## 1. Nghiệp Vụ Bất Biến

1. **Vị trí xuất hiện:** Bài trắc nghiệm định hướng được gợi ý ngay sau khi đăng ký tài khoản thành công (`/onboarding`) hoặc sinh viên có thể chủ động truy cập từ Menu Sidebar bất kỳ lúc nào.
2. **Quyền Bỏ Qua Tuyệt Đối (Skip Capability - FR-ONB-02 & BR-04):**
   - Màn hình trắc nghiệm luôn hiển thị một nút **"Để sau"** hoặc **"Bỏ qua bước này"** ở vị trí dễ quan sát.
   - Khi sinh viên chọn "Bỏ qua":
     - Hệ thống lập tức điều hướng sinh viên sang trang Khám phá cơ hội (`/explore`) hoặc Trang chủ (`/`).
     - Trạng thái chưa làm trắc nghiệm được ghi nhận và **KHÔNG ĐƯỢC PHÉP CHẶN** quyền truy cập vào các tính năng: xem cơ hội, lưu cơ hội, thêm vào lịch, tạo CV hoặc kết nối mentor.
     - Sinh viên không bị xem là tài khoản chưa hoàn tất kích hoạt.
   - Thẻ gợi ý "Làm bài trắc nghiệm định hướng" vẫn hiển thị nhẹ nhàng ở góc trang chủ để sinh viên có thể hoàn thành khi rảnh rỗi.

---

## 2. Tiêu Chí Chấp Thuận

- **AC-01:** Sinh viên mới tạo tài khoản, bấm nút "Bỏ qua" tại màn hình `/onboarding`. Hệ thống điều hướng thành công vào `/explore`.
- **AC-02:** Sinh viên đã bỏ qua trắc nghiệm vẫn có thể bấm "Thêm vào lịch" hoặc "Tạo CV" mà không bị chặn bởi bất kỳ modal bắt buộc nào.

