# Module 09: CV Builder — Trình Tạo & Quản Lý CV Chuẩn ATS (`CV-01`–`CV-05`)

> **Mã Module:** `CV_BUILDER`  
> **Trạng thái hiện tại:** [`src/components/common/Sidebar.tsx`](file:///c:/Users/AD/OneDrive/Desktop/Project/ULIS_DMST_2026/src/components/common/Sidebar.tsx#L384) đã gắn sẵn điều hướng `{ label: "CV chuẩn ATS", href: "/tools/cv-builder" }` dưới mục *Hồ sơ cá nhân*, nhưng trang `/tools/cv-builder`, các API `/api/cv/*`, model MongoDB và các thư viện chuyên dụng cho CV Builder **chưa được triển khai**.  
> **Tác nhân:** Student (quản lý, soạn thảo, tùy biến, xuất PDF & chia sẻ CV của bản thân), Public Visitor (xem CV được chia sẻ công khai tại `/cv/[shareSlug]`).

---

## 1. Phạm Vi 5 Nhóm Chức Năng Chính

| Mã | Nhóm chức năng | Route chính | Mô tả nghiệp vụ cốt lõi |
|---|---|---|---|
| `CV-01` | **CV Management** | `/tools/cv-builder` | Tạo CV mới (từ mẫu trống, từ template hoặc **Pre-fill từ `StudentProfile`**), xem danh sách CV, tìm kiếm/lọc, đặt tên / đổi tên, nhân bản (duplicate), xóa CV. |
| `CV-02` | **CV Editor** | `/tools/cv-builder/[id]` | Soạn thảo đầy đủ các nhóm thông tin (Cá nhân & Mục tiêu, Học vấn, Kinh nghiệm, Kỹ năng, Dự án, **Thành tích & Giải thưởng có trường Năm**, Hoạt động, Ngôn ngữ/Chứng chỉ, Mục tùy chỉnh); sắp xếp kéo-thả section & item; chọn mốc thời gian chuyên dụng; auto-save. |
| `CV-03` | **CV Templates** | `/tools/cv-builder/templates` *(+ drawer trong Editor)* | Thư viện mẫu CV chuẩn ATS & hiện đại; lọc theo **Ngành nghề**, **Phong cách** và **Cấp độ kinh nghiệm**; chuyển đổi mẫu ngay trong lúc soạn không làm mất dữ liệu. |
| `CV-04` | **Live Preview** | `/tools/cv-builder/[id]` (Split-pane) | Xem trước khổ A4 theo thời gian thực ngay khi gõ phím; thu phóng (`50%`–`125%`), đổi template, bảng màu nhấn, font chữ, cỡ chữ, giãn dòng và ẩn/hiện từng section. |
| `CV-05` | **Export & Sharing** | `/tools/cv-builder/[id]` & `/cv/[shareSlug]` | Xuất file PDF vector chuẩn ATS (selectable text, hỗ trợ đầy đủ dấu tiếng Việt), tạo/đóng link chia sẻ công khai, quản lý trạng thái (`PRIVATE` / `PUBLIC_LINK`), tái tạo slug bảo mật & thống kê lượt xem. |

---

## 2. Kiến Trúc Công Nghệ Bắt Buộc (Tech Stack)

| Chức năng | Công nghệ | Gói / Phiên bản đề xuất | Vai trò & Quy tắc tích hợp trong dự án |
|---|---|---|---|
| **Form Builder** | **React Hook Form** | `react-hook-form`, `@hookform/resolvers` | Quản lý form nhập liệu theo từng section & field array (`useFieldArray`) với validation không gây re-render toàn trang; đồng bộ dữ liệu hợp lệ sang Zustand store để Preview cập nhật tức thì. |
| **Validation** | **Zod** | `zod` *(đã có `^4.6.7`)* | Định nghĩa Single Source of Truth schema (`src/validations/cv.ts`) dùng chung cho cả Client (`zodResolver` trong React Hook Form) và Server (`safeParse` trong `/api/cv/*`). |
| **Drag & Drop** | **dnd-kit** | `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities` | Kéo thả sắp xếp thứ tự các **Section** (VD: đưa *Dự án* lên trước *Kinh nghiệm* với sinh viên năm 1–2) và sắp xếp các **Item** bên trong từng section (học vấn, kinh nghiệm, kỹ năng, dự án, hoạt động). Hỗ trợ bàn phím (`KeyboardSensor`) cho accessibility. |
| **State Management** | **Zustand** | `zustand` | Store tập trung (`src/stores/useCvEditorStore.ts`) lưu snapshot CV đang mở, `sectionOrder`, `styleConfig`, `templateId`, trạng thái `isDirty`/`saveStatus` (`idle`/`saving`/`saved`/`error`), Undo/Redo stack nhẹ và zoom/tab preview. |
| **PDF Export** | **React PDF** | `@react-pdf/renderer` | Render trực tiếp file **PDF vector chuẩn ATS** phía client (hoặc blob download không cần mở hộp thoại print trình duyệt), đảm bảo chữ copy được (selectable text), ngắt trang thông minh (`wrap={false}` trên block item) và nhúng font Unicode tiếng Việt (`Inter` / `Roboto`). |
| **Icons** | **Lucide** | `lucide-react` *(đã có `^1.71.0`)* | Toàn bộ icon UI trong CV Management, CV Editor toolbar, dnd-kit drag handle, badge ATS, và tùy chọn icon liên hệ trong template. |
| **Date Picker** | **React DayPicker** | `react-day-picker`, `date-fns` | Component chọn ngày/tháng học tập, làm việc, thực tập, dự án, hoạt động (`MM/YYYY` hoặc `DD/MM/YYYY`), đi kèm checkbox *"Đang làm việc / Hiện tại (`isCurrent`)"* và kiểm tra ràng buộc `endDate >= startDate`. |

> **Lưu ý tương thích Next.js 16 + React 19:**
> - `@react-pdf/renderer` sử dụng Canvas/PDF API trình duyệt nên **bắt buộc** import động với `next/dynamic(..., { ssr: false })` hoặc gọi `pdf(<CvPdfDocument ... />).toBlob()` bên trong Client Component để không lỗi khi `next build` / SSR.
> - Tương tự các route handler động trong dự án Next.js `16.4.6`, mọi Route Handler `/api/cv/[id]` và `/cv/[shareSlug]` phải `await params`.

---

## 3. Tích Hợp Liên Module Trong Hệ Sinh Thái UNERA

1. **Pre-fill thông minh từ `StudentProfile` (Module 02):**
   - Khi sinh viên tạo CV mới và bật tùy chọn *"Điền sẵn từ Hồ sơ cá nhân"*, hệ thống đọc dữ liệu từ [`StudentProfile.ts`](file:///c:/Users/AD/OneDrive/Desktop/Project/ULIS_DMST_2026/src/models/StudentProfile.ts) để tự động điền:
     - **Thông tin cơ bản & Học vấn:** `fullName`, `email`, `avatar`, `university`, `major`, `academicYear`, `bio` (gợi ý thành *Mục tiêu nghề nghiệp*).
     - **Kỹ năng (`hardSkills`, `softSkills`, `skills`):** Lấy toàn bộ danh sách `string[]` từ cả 3 trường `hardSkills`, `softSkills` và `skills` (chuẩn hóa & chống trùng lặp theo `src/lib/profile-skills.ts`), tự động phân thành các nhóm *"Kỹ năng chuyên môn"*, *"Kỹ năng mềm"* và *"Kỹ năng khác"* (nếu `skills` có phần tử chưa nằm trong 2 mảng kia).
     - **Thành tích (`achievements: string[]`):** Chuyển từng chuỗi thành tích từ Bảng thành tích sang mảng `achievements` của CV (`{ title, year, issuer, description }`); hỗ trợ tự động trích xuất năm 4 chữ số nếu có trong chuỗi gốc và cho phép sinh viên **nhập/chỉnh sửa trực tiếp thông tin năm bao nhiêu (`year`)** ngay khi tạo CV hoặc trong CV Editor.
2. **Import nhanh Hoạt động đã tham gia (Module 04):**
   - Trong section **Hoạt động ngoại khóa**, cung cấp nút *"Chọn từ Hoạt động đã quan tâm"* đọc danh sách từ `/api/activities?tab=followed` để chèn nhanh tên hoạt động, đơn vị tổ chức và thời gian vào CV.
3. **Liên kết ảnh đại diện Cloudinary (Module 00):**
   - Đối với các mẫu CV hỗ trợ ảnh chân dung (`supportsAvatar: true`), sinh viên có thể dùng lại `StudentProfile.avatar` hoặc upload ảnh mới thông qua gateway Cloudinary (`/api/admin/media/upload` không dùng cho student → bổ sung/dùng endpoint upload avatar cá nhân hoặc chọn URL an toàn được kiểm tra bởi [`isSafeMediaUrl`](file:///c:/Users/AD/OneDrive/Desktop/Project/ULIS_DMST_2026/src/lib/orientation-utils.ts#L35)).
4. **Bảo toàn dữ liệu & Cascade Delete (`AUTH-04`):**
   - Bổ sung collection `cv_documents` vào [`src/lib/user-management.ts`](file:///c:/Users/AD/OneDrive/Desktop/Project/ULIS_DMST_2026/src/lib/user-management.ts) để khi Admin xóa vĩnh viễn tài khoản người dùng, toàn bộ CV của user đó cũng bị xóa sạch.
5. **Điều hướng Sidebar & Proxy (`src/proxy.ts`):**
   - `/tools/cv-builder` và `/tools/cv-builder/*` là route yêu cầu đăng nhập (`Student` / `Admin`), **ngoại trừ** `/cv/[shareSlug]` là route xem CV chia sẻ công khai cho Visitor/Nhà tuyển dụng (không bắt buộc đăng nhập, chỉ phục vụ khi `sharing.isPublic === true`).

---

## 4. Mô Hình Dữ Liệu MongoDB (`cv_documents`)

### 4.1 Collection `cv_documents` (`src/models/CvDocument.ts`)

| Trường | Kiểu | Bắt buộc | Mô tả |
|---|---|---|---|
| `userId` | `ObjectId` | Có | Ref `users._id`, index `{ userId: 1, updatedAt: -1 }` |
| `title` | `String` | Có | Tên gợi nhớ của CV (VD: `"CV Thực tập Marketing - Unilever"`) |
| `templateId` | `String` | Có | ID template đang chọn (VD: `"ats-minimal-classic"`, `"modern-two-col"`) |
| `targetRole` | `String` | Không | Vị trí mục tiêu dùng để gợi ý tên file PDF & metadata |
| `locale` | `Enum` | Có | `"vi"` \| `"en"` — Ngôn ngữ nhãn tiêu đề section trên bản Preview & PDF |
| `styleConfig` | `Object` | Có | `{ accentColor, fontFamily, fontSizeScale, lineHeight, pagePadding, showAvatar, headerAlign }` |
| `sectionOrder` | `String[]` | Có | Mảng thứ tự section, VD: `["summary", "education", "experience", "projects", "skills", "achievements", "activities", "certifications", "custom"]` |
| `hiddenSections` | `String[]` | Có | Danh sách key các section tạm ẩn khỏi Preview & PDF nhưng vẫn giữ dữ liệu trong Editor |
| `personalInfo` | `Object` | Có | `{ fullName, jobTitle, email, phone, location, website, linkedin, github, portfolio, avatarUrl, dateOfBirth }` |
| `summary` | `String` | Không | Mục tiêu nghề nghiệp / Tóm tắt bản thân (tối đa 1500 ký tự) |
| `education` | `Array<EducationItem>` | Có | Học vấn (trường, ngành, bằng cấp, GPA, `startDate`, `endDate`, `isCurrent`, mô tả) |
| `experience` | `Array<ExperienceItem>` | Có | Kinh nghiệm làm việc / Thực tập (vị trí, công ty, địa điểm, `startDate`, `endDate`, `isCurrent`, `highlights[]`) |
| `skills` | `Array<SkillGroup>` | Có | Nhóm kỹ năng (`id`, `groupName`, `items: [{ id, name, level }]`) |
| `projects` | `Array<ProjectItem>` | Có | Dự án cá nhân / học thuật (tên, vai trò, liên kết, công nghệ, `startDate`, `endDate`, `isCurrent`, mô tả/`highlights[]`) |
| `activities` | `Array<ActivityItem>` | Có | Hoạt động ngoại khóa, CLB, tình nguyện (`name`, `organization`, `role`, `startDate`, `endDate`, `isCurrent`, mô tả) |
| `achievements` | `Array<AchievementItem>` | Có | Thành tích & Giải thưởng (`id`, `title`, **`year` (năm đạt thành tích, VD: `2025`)**, `issuer`, `description`) — có thể import từ `StudentProfile.achievements` và gắn thêm năm |
| `certifications` | `Array<CertificationItem>` | Có | Chứng chỉ & Ngoại ngữ (`name`, `issuer`, `issueDate`, `credentialUrl`, `scoreOrLevel`) |
| `customSections` | `Array<CustomSection>` | Có | Các mục tự định nghĩa thêm (VD: *Công bố khoa học*, *Người tham chiếu*) |
| `sharing` | `Object` | Có | `{ isPublic: boolean, shareSlug: string \| null, sharedAt: Date \| null, viewCount: number, allowPdfDownload: boolean }` (Sparse unique index trên `sharing.shareSlug`) |
| `version` | `Number` | Có | Optimistic locking version (`>= 1`) tránh ghi đè khi mở nhiều tab |
| `lastEditedAt` | `Date` | Có | Thời điểm chỉnh sửa nội dung gần nhất |
| `createdAt` / `updatedAt` | `Date` | Có | Mongoose timestamps |

---

## 5. Ma Trận API Endpoints Dự Kiến

| Method | Endpoint | Quyền | Chức năng |
|---|---|---|---|
| `GET` | `/api/cv` | Auth (`Student`/`Admin`) | Lấy danh sách CV của người dùng hiện tại (`q`, `templateId`, `sort`) |
| `POST` | `/api/cv` | Auth | Tạo CV mới (mẫu trống, theo `templateId`, hoặc `prefillFromProfile: true`) |
| `GET` | `/api/cv/[id]` | Owner only | Lấy chi tiết toàn bộ CV để nạp vào CV Editor |
| `PATCH` | `/api/cv/[id]` | Owner only | Lưu tự động / cập nhật nội dung, thứ tự section, `styleConfig`, `templateId`, hoặc đổi tên `title` |
| `DELETE` | `/api/cv/[id]` | Owner only | Xóa vĩnh viễn CV của bản thân |
| `POST` | `/api/cv/[id]/duplicate` | Owner only | Nhân bản CV thành bản sao mới (`title: "<Tên cũ> (Bản sao)"`, `sharing.isPublic = false`) |
| `PATCH` | `/api/cv/[id]/sharing` | Owner only | Bật/tắt chia sẻ công khai, cấu hình `allowPdfDownload`, hoặc tái tạo `shareSlug` mới |
| `GET` | `/api/cv/templates` | Public / Auth | Trả danh mục mẫu CV kèm filter `industry`, `style`, `level` |
| `GET` | `/api/cv/public/[shareSlug]` | Public (No Auth) | Lấy dữ liệu CV công khai (chỉ trả khi `sharing.isPublic === true`, tăng `viewCount` an toàn) |

---

## 6. Kế Hoạch Triển Khai Theo Giai Đoạn (Implementation Roadmap)

| Phase | Phạm vi công việc | Tệp / Hạng mục chính |
|---|---|---|
| **Phase 1: Dependencies & Foundation** | Cài đặt `react-hook-form`, `@hookform/resolvers`, `zustand`, `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities`, `react-day-picker`, `date-fns`, `@react-pdf/renderer`; chuẩn bị font tiếng Việt (`Inter`/`Roboto` `.ttf`) trong `public/fonts/` cho React PDF; khai báo type DTO (`src/types/cv.ts`) & hằng số (`src/constants/cv.ts`). | `package.json`, `public/fonts/`, `src/types/cv.ts`, `src/constants/cv.ts` |
| **Phase 2: Database, Validation & API** | Tạo Mongoose Model `CvDocument.ts`, Zod schemas `src/validations/cv.ts`, service helper `src/lib/cv-service.ts` (including Pre-fill từ `StudentProfile` & Cascade Delete hook trong `user-management.ts`), và toàn bộ API routes `/api/cv/**`. | `src/models/CvDocument.ts`, `src/validations/cv.ts`, `src/lib/cv-service.ts`, `src/app/api/cv/**` |
| **Phase 3: CV Management & Template Library** | Xây dựng trang `/tools/cv-builder` (quản lý CV: danh sách, tạo mới, pre-fill hồ sơ, rename, duplicate, delete) và `/tools/cv-builder/templates` (lọc theo ngành nghề, phong cách, cấp độ, xem trước template). | `src/app/tools/cv-builder/page.tsx`, `src/app/tools/cv-builder/templates/page.tsx`, `src/lib/cv-templates.ts` |
| **Phase 4: CV Editor, dnd-kit, DayPicker & Live Preview** | Triển khai `useCvEditorStore` (Zustand), `CvDatePicker` (`react-day-picker`), các form section dùng `React Hook Form` + `Zod`, kéo-thả sắp xếp section & item bằng `dnd-kit`, auto-save debounce và khung **Live Preview A4** đổi template/màu/font trực tiếp. | `src/stores/useCvEditorStore.ts`, `src/components/cv/**`, `src/app/tools/cv-builder/[id]/page.tsx` |
| **Phase 5: React-PDF Export & Public Sharing** | Xây dựng template PDF vector đồng bộ bằng `@react-pdf/renderer` (dynamic import `ssr: false`), modal cấu hình xuất PDF & chia sẻ link, trang xem công khai `/cv/[shareSlug]`, và cập nhật `src/proxy.ts` + liên kết trong `/profile`. | `src/components/cv/pdf/**`, `src/app/cv/[shareSlug]/page.tsx`, `src/proxy.ts` |
| **Phase 6: Static & Manual Verification** | Kiểm tra `npx eslint`, `npx tsc --noEmit`, `npm run build`, test luồng tạo → kéo thả → đổi template → xuất PDF tiếng Việt có dấu → bật/tắt link `/cv/[shareSlug]` → kiểm tra ATS text selection. | Full build & verification checklist |

---

## 7. Danh Sách Đặc Tả Chi Tiết Module 09

| Mã | Tên đặc tả | Tệp |
|---|---|---|
| `CV-01` | Quản lý danh sách CV (Tạo, Đọc, Sửa tên, Nhân bản, Xóa, Pre-fill) | [`01_CV_MANAGEMENT.md`](./01_CV_MANAGEMENT.md) |
| `CV-02` | CV Editor (React Hook Form, Zod, dnd-kit, React DayPicker, Lucide) | [`02_CV_EDITOR.md`](./02_CV_EDITOR.md) |
| `CV-03` | Thư viện Mẫu CV (Phân loại Ngành nghề, Phong cách, Cấp độ) | [`03_CV_TEMPLATES.md`](./03_CV_TEMPLATES.md) |
| `CV-04` | Live Preview & Tùy biến Giao diện (Zustand Real-time Sync, A4 Layout) | [`04_LIVE_PREVIEW.md`](./04_LIVE_PREVIEW.md) |
| `CV-05` | Xuất File PDF Vector (React PDF) & Chia sẻ Link Công khai (`/cv/[shareSlug]`) | [`05_EXPORT_AND_SHARING.md`](./05_EXPORT_AND_SHARING.md) |

