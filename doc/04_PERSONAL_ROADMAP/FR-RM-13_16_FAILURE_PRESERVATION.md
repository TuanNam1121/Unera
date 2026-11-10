# Đặc Tả Tính Năng: Bảo Toàn Lộ Trình Khi Lỗi & Quy Định Sửa Lịch Sử

> **Mã tính năng:** `FR-RM-13`, `FR-RM-16`  
> **Thuộc cụm:** `04_PERSONAL_ROADMAP`  
> **Tác nhân:** Hệ thống (System), Sinh viên (Student)  
> **Trạng thái:** Confirmed (Bảo toàn) & TBD (Chỉnh sửa lịch sử)  

---

## 1. Nghiệp Vụ Bảo Toàn Khi Thất Bại (FR-RM-13 & BR-10)

- Nếu việc sinh lộ trình mới gặp sự cố (ví dụ: lỗi mạng, lỗi kết nối cơ sở dữ liệu, hoặc dữ liệu template bị gián đoạn):
  - **Hệ thống bắt buộc phải giữ nguyên vẹn 100% Lộ trình hiện tại đang có.**
  - Không chuyển đổi trạng thái của lộ trình hiện hành sang `ARCHIVED`.
  - Báo lỗi rõ ràng đến người dùng: *"Không thể sinh lộ trình mới vào lúc này. Lộ trình hiện tại của bạn đã được giữ nguyên vẹn an toàn."*
  - Tuyệt đối không để xảy ra kịch bản sinh viên bị mất lộ trình hoặc bị bỏ trống lộ trình sau khi thao tác thất bại.

---

## 2. Quy Định Về Chỉnh Sửa Lộ Trình Lịch Sử (FR-RM-16 & OI-01)

- **Trạng thái:** **TBD (Chưa quyết định theo SRS 1.0).**
- **Quy tắc triển khai:** Lộ trình lịch sử (`status: "ARCHIVED"`) được đặt ở chế độ **CHỈ ĐỌC (Read-only)**.
- Giao diện sinh viên chỉ hiển thị để xem lại, vô hiệu hóa các checkbox đánh dấu nhiệm vụ và không cung cấp nút chỉnh sửa nội dung trên lộ trình lịch sử cho đến khi có quyết định chính thức từ Product Owner.
