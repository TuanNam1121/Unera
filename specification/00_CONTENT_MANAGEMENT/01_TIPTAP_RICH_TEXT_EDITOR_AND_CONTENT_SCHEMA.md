# CM-01: Tiptap Rich-Text Block Editor, JSON Schema & Shared Renderer (CM01–CM05)

> **Module:** `00_CONTENT_MANAGEMENT`  
> **Feature IDs:** `CM01` (Shared Tiptap Editor), `CM02` (JSON AST Validation & Sanitization), `CM03` (Plain-Text Extract & Read Time), `CM04` (Shared React JSON Renderer), `CM05` (Clean-Slate Replacement).  
> **Tác nhân:** Admin (`CM01`–`CM03`), Student / Visitor (`CM04`).

---

## 1. Quy Tắc Nghiệp Vụ Từng Feature ID

### `CM01` — Shared Tiptap Block Editor (`src/components/content/TiptapContentEditor.tsx`)
- Cung cấp component Client dùng chung cho Admin CMS ở cả `/admin/explore/*`, `/admin/activities/*` và `/admin/news/*`.
- **Các Extension & Block tiêu chuẩn được kích hoạt:**
  - **Văn bản cơ bản (`StarterKit`):** Paragraph, Heading (`H2`, `H3`, `H4`), Bold, Italic, Strike, Code inline, Code Block, Blockquote, Bullet List, Ordered List, Horizontal Rule, History (Undo/Redo).
  - **Định dạng nâng cao:** Underline, Highlight, TextAlign (`left`, `center`, `right`), Link (`target="_blank" rel="noopener noreferrer nofollow"`), Table (`Table`, `TableRow`, `TableHeader`, `TableCell`).
  - **Media & Custom Blocks:**
    - `imageBlock` (Mở rộng Tiptap Image lưu `src`, `alt`, `caption`, `publicId`, `width`, `height`).
    - `audioBlock` (Custom Node cho Audio MP3/WAV/M4A/OGG upload Cloudinary hoặc external allowlist URL).
    - `youtubeEmbed` (Custom/YouTube Node nhúng video YouTube responsive 16:9).
    - `calloutBlock` (Custom Block nổi bật dạng `info` | `tip` | `warning` dùng cho lưu ý định hướng/học bổng).
- **UX Toolbar theo giao diện CMS UNERA:**
  - Sticky formatting toolbar phía trên vùng soạn thảo (tuân thủ palette Slate/Blue sạch sẽ của `UI_UX_DESIGN_SYSTEM.md`).
  - Nút chèn nhanh **Upload Ảnh**, **Chọn từ Thư viện Media**, **Chèn Audio**, **Nhúng Video YouTube**, **Chèn Callout**.
  - Hỗ trợ kéo-thả hoặc dán (paste) ảnh trực tiếp vào Editor → tự động chặn base64 thô và đẩy qua luồng `/api/admin/media/upload`.
  - Hiển thị trạng thái upload inline (loading progress) và lỗi rõ ràng nếu file vượt quá dung lượng hoặc sai định dạng.
- **Output của Editor:** Emit giá trị `onChange(jsonDoc)` là object `TiptapJSONDoc` (không emit HTML string thô làm nguồn lưu trữ chính).

### `CM02` — Structured JSON Validation & Sanitization (`src/lib/content/tiptap-schema.ts`)
- Mọi API tạo/sửa bài viết nhận `contentJson` đều phải chạy qua bộ validator đệ quy phía server:
  1. Kiểm tra root object bắt buộc có `type === "doc"` và `Array.isArray(content)` với ít nhất 1 nội dung có ý nghĩa (tránh bài viết rỗng).
  2. Giới hạn độ sâu AST (tối đa `20` tầng lồng nhau) và kích thước JSON payload hợp lý để chống DoS/document bloat.
  3. **Whitelist Node Types:** Chỉ chấp nhận `doc`, `paragraph`, `text`, `heading`, `bulletList`, `orderedList`, `listItem`, `blockquote`, `codeBlock`, `hardBreak`, `horizontalRule`, `table`, `tableRow`, `tableHeader`, `tableCell`, `image`, `audioBlock`, `youtubeEmbed`, `calloutBlock`.
  4. **Whitelist Mark Types:** Chỉ chấp nhận `bold`, `italic`, `underline`, `strike`, `code`, `highlight`, `link`, `textStyle`.
  5. **URL & Attribute Sanitization:**
     - `link.attrs.href`: Chỉ cho phép `http:`, `https:`, hoặc đường dẫn nội bộ `/` (chặn `javascript:`, `vbscript:`, `data:`).
     - `image.attrs.src`: Bắt buộc là `https:` / `http:` URL hợp lệ (chặn tuyệt đối `data:image/*` base64 để đảm bảo media không nằm trong MongoDB).
     - `audioBlock.attrs.src`: Kiểm tra theo allowlist domain (`CM11`).
     - `youtubeEmbed`: Chuẩn hóa về `videoId` 11 ký tự hợp lệ (`CM12`).

### `CM03` — Plain-Text Extraction & Reading Time (`src/lib/content/tiptap-utils.ts`)
- Để phục vụ tìm kiếm toàn văn (`q=...`) trong MongoDB và tính `readTimeMinutes` mà không cần duyệt JSON lúc query:
  - Backend tự chạy `extractPlainTextFromTiptap(contentJson)` ngay trước khi lưu DB → ghi kết quả vào `contentText`.
  - Đếm độ dài tối thiểu nội dung (VD: `contentText.trim().length >= 20`) cho validation bài viết.
  - Tính `readTimeMinutes = estimateReadTimeFromTiptap(contentJson)` dựa trên số từ của `contentText` (`~200 từ/phút`) cộng thêm thời gian quan sát ảnh/media cơ bản (tối thiểu `1 phút`).

### `CM04` — Shared Public Content Renderer (`src/components/content/TiptapContentRenderer.tsx`)
- Component React dùng chung cho toàn bộ trang đọc chi tiết ở Student UI (`/explore/[slug]`, `/activities/[slug]`, `/news/[slug]`):
  - Nhận prop `contentJson: TiptapJSONDoc`.
  - **Render thuần React JSX** bằng đệ quy theo `node.type` và `marks` — **không khởi tạo Tiptap Editor runtime** ở trang đọc bài để giảm JS bundle và cho phép render sạch cả trong Server/Client Component.
  - Tự động render:
    - Ảnh qua `next/image` (kèm `caption` và zoom/lightbox nhẹ tùy chọn).
    - Audio qua trình phát `<audio controls preload="metadata">` thiết kế đồng bộ với UI UNERA.
    - Video qua `https://www.youtube-nocookie.com/embed/{videoId}` trong khung `aspect-video rounded-2xl`.
    - Link ngoài mở tab mới với `rel="noopener noreferrer nofollow"`.
    - Heading (`H2`, `H3`, `H4`) kèm `id` anchor rõ ràng, typography thoáng dễ đọc.

### `CM05` — Clean-Slate Replacement (Loại Bỏ Code Cũ)
- Khi triển khai Module 00 vào codebase:
  - Xóa bỏ component Markdown cũ [`SafeMarkdownRenderer.tsx`](../../src/components/orientation/SafeMarkdownRenderer.tsx) và các helper parse Markdown thuần không còn sử dụng.
  - Chuẩn hóa các trường nội dung của `OrientationArticle`, `StudentActivity`, `NewsArticle` sử dụng trực tiếp `contentJson` + `contentText` (cập nhật lại các seed script tạo sẵn dữ liệu dạng Tiptap JSON hợp lệ).

---

## 2. Cấu Trúc Mẫu `contentJson` Trong MongoDB

```json
{
  "type": "doc",
  "content": [
    {
      "type": "heading",
      "attrs": { "level": 2, "textAlign": "left" },
      "content": [{ "type": "text", "text": "Tổng quan ngành Công nghệ thông tin" }]
    },
    {
      "type": "paragraph",
      "content": [
        { "type": "text", "text": "Khám phá lộ trình kỹ năng cần chuẩn bị từ năm nhất tại " },
        {
          "type": "text",
          "text": "UNERA",
          "marks": [{ "type": "bold" }]
        }
      ]
    },
    {
      "type": "image",
      "attrs": {
        "src": "https://res.cloudinary.com/<cloud>/image/upload/v1/unera/orientation/roadmap.webp",
        "alt": "Lộ trình nghề nghiệp IT",
        "caption": "Minh họa lộ trình 4 năm đại học",
        "publicId": "unera/orientation/roadmap",
        "width": 1200,
        "height": 675
      }
    },
    {
      "type": "audioBlock",
      "attrs": {
        "src": "https://res.cloudinary.com/<cloud>/video/upload/v1/unera/orientation/podcast-01.mp3",
        "publicId": "unera/orientation/podcast-01",
        "title": "Podcast chia sẻ từ Mentor Senior",
        "sourceType": "CLOUDINARY"
      }
    },
    {
      "type": "youtubeEmbed",
      "attrs": {
        "videoId": "dQw4w9WgXcQ",
        "url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        "title": "Giới thiệu chuyên ngành"
      }
    }
  ]
}
```

---

## 3. Tiêu Chí Chấp Thuận

- **AC-01 (`CM01`, `CM02`):** Admin soạn bài viết có Heading, danh sách, bảng biểu, in đậm và link trong `TiptapContentEditor` → lưu thành công `contentJson` hợp lệ vào MongoDB; payload chứa node/mark lạ hoặc `javascript:` / `data:image/png;base64` bị API từ chối với `400`.
- **AC-02 (`CM03`):** Sau khi lưu bài viết từ `contentJson`, trường `contentText` trong MongoDB chứa đúng text thuần trích xuất và `readTimeMinutes` được tự động tính toán khi Admin không nhập tay.
- **AC-03 (`CM04`):** Trang chi tiết phía người dùng render đầy đủ cấu trúc bài viết từ `contentJson` bằng JSX thuần, không dùng `dangerouslySetInnerHTML`, không load bundle editor thừa.
- **AC-04 (`CM05`):** Toàn bộ dữ liệu seed mẫu của Module 03 sử dụng cấu trúc `contentJson` + `contentText` mới và không còn tồn tại renderer Markdown cũ.

