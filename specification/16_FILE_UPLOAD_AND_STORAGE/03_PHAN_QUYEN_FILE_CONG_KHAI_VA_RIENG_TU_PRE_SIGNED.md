# Tính Năng: Phân Tách Lưu Trữ Công Khai/Riêng Tư & Quyền Sở Hữu (Secure File Storage)

> **Mã SRS:** `FR-FILE-06`, `FR-FILE-07`, `FR-FILE-09`, `FR-FILE-10`  
> **Trạng thái:** ![Kế hoạch theo SRS](https://img.shields.io/badge/-KẾ%20HOẠCH%20THEO%20SRS-amber)  
> **Thuộc cụm:** `16_FILE_UPLOAD_AND_STORAGE`  
> **Tác nhân:** Sinh viên (Student), Quản trị viên (Admin), Hệ thống Backend

---

## 1. Hiện Trạng Triển Khai
- Cần thiết kế phân vùng lưu trữ trên Cloud Storage (AWS S3, Google Cloud Storage hoặc MinIO nội bộ).

---

## 2. Đặc Tả Nghiệp Vụ Theo SRS 1.0 (Specification)

### 2.1 Phân Tách Lưu Trữ Công Khai & Riêng Tư (FR-FILE-07)
Hệ thống chia làm 2 vùng lưu trữ biệt lập (Storage Buckets):
1. **Public Bucket (Công Khai):**
   - Nội dung: Ảnh bìa cơ hội, ảnh bìa bài viết tin tức, logo đối tác/nhà tài trợ, ảnh đại diện công khai của cố vấn mentor.
   - Cơ chế truy cập: CDN phân phối trực tiếp qua HTTP(S), tốc độ cao, không yêu cầu xác thực phiên đăng nhập.
2. **Private Bucket (Riêng Tư & Nhạy Cảm):**
   - Nội dung: Bản thảo CV sinh viên, minh chứng chứng chỉ scan (chứa thông tin cá nhân, ngày sinh, số CCCD/hộ chiếu), tài liệu đính kèm nội bộ.
   - Cơ chế truy cập: **Chặn hoàn toàn quyền đọc công khai**. Mọi truy cập bắt buộc phải thông qua URL ký số tạm thời (Pre-signed URL) hoặc proxy stream có kiểm tra session.

### 2.2 Quyền Sở Hữu & Chống IDOR (FR-FILE-06, FR-FILE-10)
- **Metadata tệp (FR-FILE-09):** Lưu thông tin `{ fileId, originalName, mimeType, sizeBytes, ownerUserId, isPrivate, bucketPath, createdAt }`.
- **Chống IDOR (Insecure Direct Object Reference):**
  - Sinh viên chỉ được phép tải về, xem hoặc xóa các tệp do chính tài khoản của mình tải lên (`ownerUserId === session.user.id`).
  - Quản trị viên (Admin) có quyền kiểm duyệt tệp khi sinh viên đính kèm vào yêu cầu tư vấn hoặc hồ sơ xét học bổng.
- **Pre-signed URL có thời hạn (FR-FILE-10):**
  - Đường dẫn truy cập tệp riêng tư chỉ có hiệu lực tối đa trong vòng **15 phút** (900 giây).
  - Sau thời gian này, link tự động vô hiệu lực, ngăn chặn việc sao chép và phát tán liên kết ra bên ngoài.
