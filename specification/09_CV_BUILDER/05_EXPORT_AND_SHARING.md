# CV-05: Xuất PDF (React PDF) & Chia Sẻ CV Công Khai

> **Module:** `09_CV_BUILDER`  
> **Routes liên quan:** `/tools/cv-builder/[id]` (Export & Share Modal) và `/cv/[shareSlug]` (Trang xem CV công khai)  
> **Tech Stack cốt lõi:** `@react-pdf/renderer` + Next.js Dynamic Route + MongoDB `sharing` config.

---

## 1. Xuất File PDF Chuẩn ATS Bằng `@react-pdf/renderer`

### 1.1 Yêu Cầu Chất Lượng File PDF
1. **PDF Vector (Selectable & Searchable Text):** Không dùng chụp ảnh canvas (`html2canvas`) vốn khiến ATS không đọc được chữ và bị mờ khi zoom. Toàn bộ nội dung được render trực tiếp bằng các primitive `<Document>`, `<Page>`, `<View>`, `<Text>`, `<Link>` của `@react-pdf/renderer`.
2. **Hỗ trợ đầy đủ dấu tiếng Việt (Unicode Fonts):**
   - Lưu bộ font tĩnh `.ttf` hỗ trợ tiếng Việt đầy đủ (`Inter-Regular.ttf`, `Inter-SemiBold.ttf`, `Inter-Bold.ttf`, `Roboto-Regular.ttf`, `Roboto-Bold.ttf`, `NotoSerif-Regular.ttf`, `NotoSerif-Bold.ttf`) tại `public/fonts/cv/`.
   - Đăng ký font qua `Font.register({ family: ..., fonts: [...] })` ở module client chuyên biệt (`src/components/cv/pdf/registerPdfFonts.ts`).
3. **Đồng bộ giao diện với Live Preview:**
   - Tạo `CvPdfDocument` (`src/components/cv/pdf/CvPdfDocument.tsx`) đọc cùng `CV_TEMPLATE_MAP[cv.templateId]`, `cv.styleConfig`, `cv.sectionOrder`, `cv.hiddenSections` và `cv.locale` để đảm bảo **"Preview thế nào — PDF xuất ra như vậy"**.
4. **Ngắt trang A4 thông minh:**
   - Kích thước trang chuẩn `size="A4"`.
   - Gắn `wrap={false}` trên từng block item (một công việc, một dự án, một bằng cấp) để không bị xé đôi một mục qua hai trang.
   - Header của section sử dụng `minPresenceAhead={40}` để tiêu đề mục không nằm trơ trọi ở cuối trang 1.
5. **Trải nghiệm tải xuống:**
   - Gọi `pdf(<CvPdfDocument cv={cvSnapshot} />).toBlob()` khi bấm **"Tải xuống PDF"**, hiển thị trạng thái loading spinner (`Đang tạo PDF...`), sau đó trigger tải tệp với tên chuẩn hóa không dấu: `CV_<HoTen>_<ViTri>.pdf` (dùng [`slugifyVietnamese`](file:///c:/Users/AD/OneDrive/Desktop/Project/ULIS_DMST_2026/src/lib/orientation-utils.ts#L5)).
   - Phải load `@react-pdf/renderer` hoàn toàn phía Client (`"use client"` / `dynamic(..., { ssr: false })`) để tránh lỗi SSR trên Next.js 16.

---

## 2. Chia Sẻ CV Qua Đường Dẫn & Quản Lý Trạng Thái Công Khai

### 2.1 Quản Lý Trạng Thái Chia Sẻ (`PATCH /api/cv/[id]/sharing`)
Trong Modal **"Chia sẻ CV"** tại CV Management hoặc CV Editor:
1. **Toggle Trạng thái Công khai (`isPublic`):**
   - `PRIVATE` (`isPublic: false` — mặc định): Chỉ chủ sở hữu đăng nhập mới xem được tại `/tools/cv-builder/[id]`. Truy cập `/cv/[shareSlug]` trả `404` / màn hình thông báo *"CV này hiện ở chế độ riêng tư hoặc không tồn tại"*.
   - `PUBLIC_LINK` (`isPublic: true`): Lần đầu bật sẽ tự động sinh `shareSlug` duy nhất thân thiện + chống đoán mò (VD: `<slug-ten-cv>-<random6chars>`), lưu `sharedAt = new Date()`.
2. **Sao chép đường dẫn công khai:**
   - Hiển thị URL đầy đủ `${origin}/cv/${shareSlug}` + nút **"Sao chép liên kết"** + nút **"Mở tab mới xem thử"**.
3. **Tùy chọn cho phép tải PDF trên trang công khai (`allowPdfDownload`):**
   - Sinh viên bật/tắt quyền cho nhà tuyển dụng hoặc người xem tải bản PDF trực tiếp từ `/cv/[shareSlug]`.
4. **Đổi đường dẫn mới / Thu hồi link cũ (`regenerateSlug: true`):**
   - Sinh `shareSlug` ngẫu nhiên mới; đường dẫn chia sẻ cũ lập tức vô hiệu (`404`) giúp kiểm soát quyền truy cập khi không muốn người từng nhận link cũ tiếp tục xem.
5. **Theo dõi lượt xem (`viewCount`):**
   - Hiển thị tổng lượt xem link công khai; tăng an toàn khi người khác (hoặc chế độ công khai) mở `/cv/[shareSlug]`.

---

## 3. Trang Xem CV Công Khai (`/cv/[shareSlug]`)

- **Public Route (`src/proxy.ts`):** Không yêu cầu đăng nhập khi truy cập `/cv/[shareSlug]` và `GET /api/cv/public/[shareSlug]`.
- **Giao diện sạch, tối ưu nhà tuyển dụng:**
  - Thanh topbar gọn: Tên ứng viên / vị trí mục tiêu, badge *"Tạo trên UNERA CV Builder"*, nút **"Tải PDF"** *(chỉ hiện khi `allowPdfDownload === true`)* và nút **"In trang (`window.print`)"**.
  - Hiển thị CV khổ A4 căn giữa dùng đúng component Renderer của Live Preview (chế độ `readOnly`), đảm bảo các link LinkedIn/GitHub/Portfolio đều được kiểm tra qua `isSafeWebUrl` và gắn `rel="noopener noreferrer nofollow"`.
- **Bảo mật dữ liệu trả về từ `GET /api/cv/public/[shareSlug]`:**
  - Chỉ trả về dữ liệu hiển thị của CV (`personalInfo`, `summary`, các section không bị ẩn trong `hiddenSections`, `templateId`, `styleConfig`, `sectionOrder`, `locale`, `sharing.allowPdfDownload`).
  - **Không bao giờ** rò rỉ `userId`, `version`, `hiddenSections` nội bộ hay danh sách CV khác của sinh viên.

