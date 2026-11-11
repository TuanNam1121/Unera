# Cụm Tính Năng 16: Tải Lên Tệp & Lưu Trữ Minh Chứng (File Upload and File Access)

> **Mã SRS:** `FR-FILE-01` đến `FR-FILE-08`  
> **Trạng thái:** ![Kế hoạch](https://img.shields.io/badge/-KẾ%20HOẠCH%20THEO%20SRS-amber)  
> **Tác nhân:** Sinh viên (Student), Quản trị viên (Admin)

---

## 1. Mục Tiêu & Mô Tả Nghiệp Vụ Theo SRS 1.0

Cung cấp hạ tầng lưu trữ tệp tin an toàn phục vụ các nhu cầu tải lên CV, ảnh đại diện, file thông báo tuyển sinh và minh chứng chứng chỉ:

### 1.1 Ràng Buộc Kỹ Thuật Bắt Buộc (`FR-FILE-01..05`, `BR-13`)
- **Định dạng tệp được phép (Whitelist formats):**
  - Tài liệu: `PDF`, `DOC`, `DOCX`.
  - Hình ảnh: `JPG`, `JPEG`, `PNG`.
  - Mọi định dạng khác (đặc biệt là tệp thực thi `.exe`, `.bat`, `.sh`, `.js` hoặc file nén `.zip`, `.rar`) đều bị từ chối ở cả client và server.
- **Giới hạn dung lượng tối đa:** Tối đa **10 MB / tệp** (`BR-13`).
- **Kiểm tra loại tệp phía Server (MIME Type Verification):**
  - Không dựa vào đuôi file ở client, server phải xác thực magic bytes hoặc MIME type thực tế của file trước khi chấp nhận lưu trữ.

### 1.2 Quyền Truy Cập & Bảo Mật Tệp Tin (`FR-FILE-06..08`)
- **Tệp công khai:** Ảnh bìa cơ hội, avatar công khai, ảnh bài viết tin tức.
- **Tệp riêng tư:** CV của sinh viên, file minh chứng chứng chỉ cá nhân. Chỉ chính sinh viên sở hữu tệp hoặc Quản trị viên hệ thống mới có quyền truy cập hoặc tải về.

---

## 2. Kế Hoạch Triển Khai Kỹ Thuật

1. **API Upload:** `POST /api/upload`
   - Nhận `FormData` (tệp tin + mục đích sử dụng: `avatar`, `cv`, `certificate_proof`, `news_attachment`).
   - Kiểm tra định dạng và kích thước $\le 10\text{ MB}$.
   - Lưu trữ vào thư mục cục bộ an toàn (`/public/uploads` trong môi trường Dev) hoặc tích hợp Cloud Object Storage (Vercel Blob / AWS S3 / Cloudinary) trong môi trường Production.
   - Trả về đường dẫn truy cập URL an toàn.
2. **Component Tải Lên Dùng Chung (`FileUploadZone.tsx`):**
   - Hỗ trợ kéo thả file (Drag and drop).
   - Thanh tiến trình tải lên và thông báo lỗi rõ ràng nếu file vượt quá 10MB hoặc sai định dạng.
