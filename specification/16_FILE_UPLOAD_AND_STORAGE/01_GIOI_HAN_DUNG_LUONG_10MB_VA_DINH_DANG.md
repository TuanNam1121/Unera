# Tính Năng: Giới Hạn Dung Lượng Tệp 10MB & Danh Mục Định Dạng Hợp Lệ (File Constraints & Validation)

> **Mã SRS:** `FR-FILE-01`, `FR-FILE-02`, `FR-FILE-03`, `FR-FILE-05`, `FR-FILE-08`  
> **Trạng thái:** ![Kế hoạch theo SRS](https://img.shields.io/badge/-KẾ%20HOẠCH%20THEO%20SRS-amber)  
> **Thuộc cụm:** `16_FILE_UPLOAD_AND_STORAGE`  
> **Tác nhân:** Sinh viên (Student), Quản trị viên (Admin), Hệ thống Backend

---

## 1. Hiện Trạng Triển Khai
- Hiện tại hệ thống đang lưu trữ các URL ảnh và tài liệu dạng chuỗi liên kết (CDN URL / Static Path).
- Cần xây dựng API endpoint tập trung `POST /api/upload` tiếp nhận form multipart/form-data.

---

## 2. Đặc Tả Nghiệp Vụ Theo SRS 1.0 (Specification)

### 2.1 Giới Hạn Dung Lượng Tối Đa (FR-FILE-02, FR-FILE-05)
- **Giới hạn cứng:** Mỗi tệp tin tải lên **không được vượt quá 10MB** (10,485,760 bytes).
- **Kiểm tra 2 lớp:**
  - **Client-side:** Kiểm tra `file.size` ngay khi người dùng chọn tệp. Nếu vượt quá 10MB, lập tức hiển thị Toast cảnh báo: *"Dung lượng tệp vượt quá giới hạn 10MB. Vui lòng nén hoặc chọn tệp nhỏ hơn"* và chặn nút gửi.
  - **Server-side:** Middleware kiểm tra `content-length` của HTTP request và kiểm tra kích thước thực tế của stream tệp. Nếu vượt quá, trả về mã lỗi HTTP `413 Payload Too Large`.

### 2.2 Danh Mục Định Dạng Tệp Được Phép (FR-FILE-03)
- Chỉ chấp nhận các định dạng tệp thông dụng cho môi trường học tập và hồ sơ:
  - **Tài liệu văn bản:** PDF (`.pdf`), Microsoft Word (`.doc`, `.docx`).
  - **Hình ảnh:** JPEG/JPG (`.jpg`, `.jpeg`), PNG (`.png`), WebP (`.webp`).
- **Nghiêm cấm tuyệt đối:** Tất cả các loại tệp thực thi, mã nguồn hoặc script tiềm ẩn rủi ro bảo mật: `.exe`, `.bat`, `.cmd`, `.sh`, `.php`, `.js`, `.py`, `.html`, `.svg` (do rủi ro XSS nhúng mã XML).

### 2.3 Phản Hồi Lỗi Rõ Ràng (FR-FILE-08)
- Giao diện cung cấp thanh tiến trình (Upload Progress Bar 0% -> 100%).
- Nếu xảy ra lỗi mạng hoặc vi phạm quy chế định dạng, thông báo hiển thị nguyên nhân cụ thể, không dùng mã lỗi kỹ thuật chung chung.
