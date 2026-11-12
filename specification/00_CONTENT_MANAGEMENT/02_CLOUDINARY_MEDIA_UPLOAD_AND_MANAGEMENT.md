# CM-02: Cloudinary Media Upload Gateway & Library Management (CM06–CM10)

> **Module:** `00_CONTENT_MANAGEMENT`  
> **Feature IDs:** `CM06` (Upload Media Pipeline), `CM07` (Media Library Picker), `CM08` (Cover Image Integration), `CM09` (MIME/Magic-Bytes Security & Size Guards), `CM10` (Manual Media Delete & Reference Check).  
> **Tác nhân:** Admin (`role === "ADMIN"`).

---

## 1. Luồng Upload Chuẩn 8 Bước (`CM06`)

Áp dụng thống nhất cho ảnh trong bài viết, ảnh bìa (`coverImage`) và file audio:

1. **Admin chọn Upload Image/Audio** trong `TiptapContentEditor` hoặc vùng chọn ảnh bìa (chọn file từ máy hoặc kéo-thả/paste vào Editor).
2. **Frontend gửi file đến Backend** qua `POST /api/admin/media/upload` dưới dạng `multipart/form-data` (`file`, `module`: `"orientation" | "activities" | "news" | "general"`, `kind`: `"IMAGE" | "AUDIO"`).
3. **Backend kiểm tra bảo mật 3 lớp (`requireAdmin` + Validation):**
   - Xác thực JWT Access Token hợp lệ với `role === "ADMIN"` và `status === "ACTIVE"` (`401`/`403` nếu không đủ quyền).
   - Kiểm tra dung lượng file: **Ảnh tối đa `5 MB`**, **Audio tối đa `15 MB`** (`413 Payload Too Large` hoặc `400` nếu vượt giới hạn).
   - Kiểm tra phần mở rộng, MIME header **và đọc magic bytes thực tế** từ binary buffer để chống đổi đuôi file độc hại (`400` nếu không khớp).
4. **Backend stream upload lên Cloudinary** (`src/lib/cloudinary.ts`):
   - Phân thư mục trên Cloudinary: `unera/${module}/${YYYY-MM}`.
   - Với **Image**: dùng `resource_type: "image"`, áp dụng transform tối ưu khi phân phối (`fetch_format: "auto"`, `quality: "auto"`, giới hạn chiều rộng hợp lý).
   - Với **Audio**: dùng `resource_type: "video"` (chuẩn của Cloudinary cho tệp âm thanh để hỗ trợ stream `<audio>`).
5. **Cloudinary trả về `secure_url` & metadata** (`public_id`, `format`, `bytes`, `width`, `height`, `duration`).
6. **Backend lưu bản ghi `MediaAsset`** vào collection `media_assets` với `status: "TEMP"`, `usedBy: []`, ghi `AuditLog`, và trả JSON về cho Editor:
   `{ success: true, asset: { _id, publicId, url, mediaKind, format, bytes, width, height, duration } }`.
7. **Editor chèn URL & `publicId` vào Block tương ứng** (`imageBlock` / `audioBlock`) hoặc gán vào trường `coverImage` của form.
8. **Khi Admin bấm Lưu bài viết**, MongoDB lưu `contentJson` + `coverImage` chứa URL đó, đồng thời Backend đồng bộ `MediaAsset.usedBy` chuyển asset sang trạng thái `"ATTACHED"`.

---

## 2. Quy Tắc Từng Feature ID Bổ Sung

### `CM07` — Media Library Picker (`GET /api/admin/media`)
- Ngoài upload file mới, Editor và ô Ảnh bìa có nút **"Chọn từ thư viện"** mở modal liệt kê các `MediaAsset` đã tải lên:
  - Lọc theo `mediaKind` (`IMAGE` | `AUDIO`), `module`/`folder`, `status` (`ATTACHED` | `TEMP` | `ORPHANED`), và tìm kiếm theo `originalFilename`.
  - Hiển thị thumbnail (hoặc player nghe thử với audio), kích thước, dung lượng và số bài viết đang tham chiếu (`usedBy.length`).
  - Cho phép Admin tái sử dụng ngay ảnh/audio có sẵn mà không tạo file trùng trên Cloudinary.

### `CM08` — Cover Image Integration
- Form tạo/sửa của Module 03, 04, 05 thay ô nhập link thuần đơn lẻ bằng component `<CoverImageField />`:
  - Hỗ trợ **Upload trực tiếp lên Cloudinary**, **Chọn từ Thư viện Media**, hoặc **Dán URL ngoài hợp lệ (`https://`)**.
  - Hiển thị preview ảnh bìa tỷ lệ `16:9` kèm nút xóa/thay ảnh.

### `CM09` — Định Dạng Cho Phép & Kiểm Tra Magic Bytes
| Loại (`mediaKind`) | Định dạng hỗ trợ | MIME chuẩn | Giới hạn dung lượng | Cloudinary `resource_type` |
|---|---|---|---|---|
| `IMAGE` | `.jpg`, `.jpeg`, `.png`, `.webp`, `.gif` | `image/jpeg`, `image/png`, `image/webp`, `image/gif` | Tối đa `5 MB` | `"image"` |
| `AUDIO` | `.mp3`, `.wav`, `.m4a`, `.ogg` | `audio/mpeg`, `audio/wav`, `audio/mp4`, `audio/ogg` | Tối đa `15 MB` | `"video"` |

- **Từ chối SVG upload:** Không cho phép upload `.svg` qua upload gateway (tránh rủi ro XSS từ file SVG chứa `<script>` nhúng).
- **Không lưu binary trong MongoDB:** Chỉ lưu `url` (`secure_url`), `publicId` và metadata nhẹ.

### `CM10` — Xóa Media Thủ Công (`DELETE /api/admin/media/[id]`)
- Admin có thể xóa asset khỏi Thư viện Media:
  - Nếu `asset.usedBy.length > 0` → Backend **trả `409 Conflict`** kèm danh sách tên/ID bài viết đang dùng để tránh làm gãy ảnh bài viết đang xuất bản.
  - Nếu `asset.usedBy.length === 0` → gọi `cloudinary.uploader.destroy(asset.publicId, { resource_type: asset.resourceType })`, xóa document trong `media_assets` và ghi `AuditLog`.

---

## 3. Đặc Tả API Contract (`/api/admin/media/*`)

Tất cả endpoint dưới đây đều yêu cầu `requireAdmin()`.

| Method | Endpoint | Feature ID | Mô tả |
|---|---|---|---|
| `POST` | `/api/admin/media/upload` | `CM06`, `CM08`, `CM09` | Nhận `multipart/form-data`, validate quyền + file + magic bytes, upload Cloudinary, tạo `MediaAsset` (`TEMP`) |
| `GET` | `/api/admin/media` | `CM07` | Danh sách thư viện media phân trang (`mediaKind`, `status`, `folder`, `q`, `page`, `limit`) |
| `DELETE` | `/api/admin/media/[id]` | `CM10` | Xóa asset khỏi Cloudinary + MongoDB nếu `usedBy.length === 0` (`409` nếu đang được sử dụng) |
| `POST` | `/api/admin/media/cleanup` | `CM14` | Quét và dọn các `MediaAsset` trạng thái `TEMP` quá `24h` hoặc `ORPHANED` chưa gắn vào bài nào |

---

## 4. Tiêu Chí Chấp Thuận

- **AC-01 (`CM06`, `CM09`):** Upload ảnh `.png`/`.webp` hợp lệ → file lên Cloudinary, tạo `MediaAsset` (`TEMP`), Editor nhận `url` + `publicId` và hiển thị ảnh ngay trong bài; upload file giả mạo `.exe` đổi đuôi `.png` hoặc ảnh `> 5MB` bị từ chối ở Backend trước khi chạm Cloudinary.
- **AC-02 (`CM06`, `CM09`):** Người dùng không đăng nhập (`401`) hoặc `STUDENT` (`403`) không thể gọi `/api/admin/media/upload`.
- **AC-03 (`CM07`, `CM08`):** Admin có thể mở Thư viện Media chọn lại ảnh đã upload làm ảnh bìa hoặc chèn vào nhiều bài viết khác nhau.
- **AC-04 (`CM10`):** Xóa `MediaAsset` đang gắn vào bài viết trả `409 Conflict`; xóa `MediaAsset` không còn tham chiếu sẽ xóa sạch trên cả Cloudinary lẫn MongoDB.

