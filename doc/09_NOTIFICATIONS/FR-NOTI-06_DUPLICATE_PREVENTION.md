# Đặc Tả Tính Năng: Khóa Ngăn Trùng Lặp Thông Báo (Deduplication)

> **Mã tính năng:** `FR-NOTI-06`  
> **Thuộc cụm:** `09_NOTIFICATIONS`  
> **Tác nhân:** Hệ thống (System)  
> **Mức độ ưu tiên:** Bắt buộc (P0 - Crucial Invariant)  
> **Trạng thái:** Confirmed Business Decision (BR-24)  

---

## 1. Nghiệp Vụ Bất Biến

- **Vấn đề cần giải quyết:** Tác vụ quét hạn chót định kỳ (Cron scheduler) có thể chạy nhiều lần trong ngày hoặc chạy lại sau sự cố khởi động lại container. Nếu không kiểm soát chặt chẽ, sinh viên sẽ bị làm phiền bởi hàng loạt email hoặc thông báo in-app trùng lặp cho cùng một cơ hội.
- **Quy tắc ngăn chặn trùng lặp:**
  - Hệ thống định nghĩa khóa duy nhất cho mỗi sự kiện nhắc nhở:
    $$\text{DeduplicationKey} = (\text{recipientId}, \text{opportunityId}, \text{reminderOffsetDays}, \text{channel})$$
  - Cơ sở dữ liệu MongoDB áp dụng `Unique Compound Index` (có thuộc tính `sparse: true`):
    ```typescript
    NotificationSchema.index(
      { recipientId: 1, opportunityId: 1, reminderOffsetDays: 1, channel: 1 },
      { unique: true, sparse: true }
    );
    ```
  - Khi tiến trình gửi thông báo chạy, nếu phát hiện bản ghi đã tồn tại với bộ khóa trên, hệ thống bỏ qua và không gửi thêm.

---

## 2. Tiêu Chí Chấp Thuận

- **AC-01:** Tiến trình nhắc hẹn mốc 7 ngày được kích hoạt liên tiếp 3 lần trong vòng 10 phút. Sinh viên chỉ nhận đúng 01 email và 01 thông báo in-app duy nhất.
- **AC-02:** CSDL chặn mọi nỗ lực chèn bản ghi trùng lặp và ghi nhận log an toàn mà không làm sập tiến trình nền.

