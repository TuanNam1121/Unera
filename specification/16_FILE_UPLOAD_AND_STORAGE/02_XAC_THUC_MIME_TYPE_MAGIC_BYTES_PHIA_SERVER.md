# Tính Năng: Xác Thực Định Dạng Kép Qua Magic Bytes Phía Server (Deep MIME Type Validation)

> **Mã SRS:** `FR-FILE-04`  
> **Trạng thái:** ![Kế hoạch theo SRS](https://img.shields.io/badge/-KẾ%20HOẠCH%20THEO%20SRS-amber)  
> **Thuộc cụm:** `16_FILE_UPLOAD_AND_STORAGE`  
> **Tác nhân:** Hệ thống Backend, Đội ngũ Bảo mật

---

## 1. Bản Chất Rủi Ro An Ninh

- Kẻ tấn công có thể đổi tên tệp mã độc nguy hiểm (ví dụ: `shell.php` hoặc `malware.exe`) thành đuôi mở rộng giả tạo như `shell.php.pdf` hoặc `avatar.png` nhằm qua mặt các bộ lọc kiểm tra đuôi mở rộng cơ bản.
- Do đó, việc chỉ kiểm tra phần mở rộng tệp (`file.name.endsWith('.pdf')`) hoặc header `Content-Type` do trình duyệt gửi lên là **hoàn toàn không an toàn**.

---

## 2. Đặc Tả Nghiệp Vụ Theo SRS 1.0 (Specification)

### 2.1 Cơ Chế Đọc Magic Bytes (File Signatures)
- Khi tệp tải lên tới Backend, server đọc các byte đầu tiên (Buffer Header) của tệp tin để xác thực chữ ký số nhị phân thực sự:
  - **PDF:** Bắt đầu bằng 4 byte hex: `%PDF` (`25 50 44 46`).
  - **PNG:** Bắt đầu bằng 8 byte hex: `89 50 4E 47 0D 0A 1A 0A`.
  - **JPEG/JPG:** Bắt đầu bằng 3 byte hex: `FF D8 FF`.
  - **DOCX / Office Open XML:** Bắt đầu bằng chữ ký nén PK zip `50 4B 03 04`.
- Sử dụng thư viện chuyên dụng như `file-type` để quét nội dung stream thực tế.

### 2.2 Xử Lý Vi Phạm
- Nếu phần mở rộng hiển thị là `.pdf` nhưng Magic Bytes chỉ ra là file thực thi hoặc script:
  - Hệ thống lập tức hủy luồng tải tệp (abort stream).
  - Trả về mã lỗi HTTP `400 Bad Request` kèm thông báo: *"Tệp tin bị hỏng hoặc định dạng thực tế không hợp lệ."*
  - Ghi cảnh báo bảo mật vào hệ thống giám sát.
