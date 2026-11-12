# CM-03: Audio Block, YouTube Video Embed & Custom Blocks (CM11–CM13)

> **Module:** `00_CONTENT_MANAGEMENT`  
> **Feature IDs:** `CM11` (Audio Block — Upload & Allowlist Link), `CM12` (YouTube Video Embed Block), `CM13` (Custom Tiptap Blocks Extensibility).  
> **Tác nhân:** Admin (chèn/cấu hình trong Editor), Student / Visitor (phát Audio/YouTube trong trang đọc bài).

---

## 1. Quy Tắc Nghiệp Vụ Từng Feature ID

### `CM11` — Audio Block (`audioBlock`)
Hỗ trợ 2 nguồn audio cho bài viết định hướng (podcast hướng nghiệp, chia sẻ Mentor, phát âm/luyện nghe, bản thu giới thiệu sự kiện):

1. **Cách 1 — Upload File Audio lên Cloudinary (Khuyến nghị):**
   - Admin chọn tệp `.mp3`, `.wav`, `.m4a`, `.ogg` ($\le$ `15 MB`) trong Editor.
   - Đi qua đúng luồng `CM06` (`POST /api/admin/media/upload` với `kind: "AUDIO"` → Cloudinary `resource_type: "video"`).
   - Node `audioBlock` lưu `{ src, publicId, title, mimeType, sourceType: "CLOUDINARY" }`.
2. **Cách 2 — Nhúng Link Audio từ Nguồn Được Phép (External Allowlist):**
   - Admin nhập tiêu đề đoạn audio và dán URL âm thanh trực tiếp.
   - **Kiểm soát bảo mật:** Cả ở Editor và Backend Validator (`CM02`), chỉ cho phép URL sử dụng giao thức `https://` và thuộc danh sách domain cho phép (**Audio Domain Allowlist** cấu hình trong `src/constants/media.ts` / ENV `ALLOWED_AUDIO_HOSTS`, mặc định bao gồm domain CDN `res.cloudinary.com` và các host podcast/storage được phê duyệt).
   - Từ chối các URL lạ hoặc không phải `https://` với thông báo lỗi rõ ràng (`400 Bad Request`).
3. **Hiển thị trong Editor & Trang Đọc Bài:**
   - Renderer hiển thị thẻ Audio Card gọn gàng gồm tiêu đề đoạn âm thanh, nhãn nguồn và trình phát HTML5 `<audio controls preload="metadata" className="w-full" />`.
   - Khi bài viết có chứa `audioBlock` upload qua Cloudinary, `publicId` được tự động gắn vào `MediaAsset.usedBy` để đồng bộ xóa rác như ảnh.

### `CM12` — YouTube Video Embed Block (`youtubeEmbed`)
Không upload file video nặng lên Cloudinary; toàn bộ nội dung video trong bài viết sử dụng **YouTube Embed** chuẩn:

1. **Chuẩn hóa URL & Trích xuất `videoId`:**
   - Khi Admin dán link YouTube vào modal "Nhúng Video YouTube" (hỗ trợ tất cả định dạng phổ biến):
     - `https://www.youtube.com/watch?v=<VIDEO_ID>`
     - `https://youtu.be/<VIDEO_ID>`
     - `https://www.youtube.com/shorts/<VIDEO_ID>`
     - `https://www.youtube.com/embed/<VIDEO_ID>`
   - Hàm `extractYouTubeVideoId(url)` chỉ chấp nhận domain `youtube.com`, `www.youtube.com`, `m.youtube.com`, `youtube-nocookie.com`, `youtu.be` qua `https://` và `videoId` khớp regex `^[a-zA-Z0-9_-]{11}$`.
2. **Dữ liệu lưu trong `contentJson`:**
   - Node `youtubeEmbed` chỉ lưu `{ videoId, url, title? }` (nhẹ, không lưu nguyên thẻ `<iframe>` thô để ngăn chặn chèn iframe đến domain độc hại).
3. **Render an toàn ở phía User (`TiptapContentRenderer`):**
   - Tự dựng khung `<iframe>` với URL chuẩn hóa: `https://www.youtube-nocookie.com/embed/${videoId}?rel=0`, `loading="lazy"`, `allowFullScreen`, tỷ lệ `aspect-video` responsive trên cả desktop & mobile.

### `CM13` — Custom Domain Blocks (Chuẩn Mở Rộng Của Tiptap)
Thiết kế sẵn cơ chế mở rộng cho các Custom Block phục vụ nghiệp vụ UNERA:
- **`calloutBlock`:** Hộp nhấn mạnh nội dung với `variant: "info" | "tip" | "warning"` + tiêu đề ngắn + nội dung rich text bên trong (ví dụ: *"Lưu ý hồ sơ học bổng"*, *"Lời khuyên cho sinh viên năm nhất"*).
- Quy ước thêm Custom Block mới: mỗi Block phải đăng ký song song **Tiptap Node Extension** (cho Editor), **Schema/Sanitizer Entry** (trong `tiptap-schema.ts`), **Plain-text Extractor** (nếu chứa chữ), và **JSX Case** (trong `TiptapContentRenderer.tsx`).

---

## 2. Tiêu Chí Chấp Thuận

- **AC-01 (`CM11`):** Admin upload file `.mp3` $\le$ 15MB → lưu trên Cloudinary, chèn `audioBlock` vào bài, sinh viên mở bài nghe được trực tiếp qua `<audio controls>`; nếu Admin dán link audio từ domain không nằm trong allowlist → Backend từ chối lưu (`400`).
- **AC-02 (`CM12`):** Admin dán URL `youtu.be/...` hoặc `youtube.com/watch?v=...` → Editor xem trước được video, MongoDB lưu `videoId` chuẩn 11 ký tự, trang người dùng render iframe `youtube-nocookie.com` responsive 16:9; link không phải YouTube (hoặc chứa `<iframe>` HTML thô) bị chặn.
- **AC-03 (`CM13`):** Admin chèn `calloutBlock` (Tip/Warning) và `contentText` vẫn trích xuất đầy đủ nội dung văn bản bên trong Callout để tìm kiếm được.

