# CV-02: CV Editor — Soạn Thảo, Validation & Kéo-Thả Section

> **Module:** `09_CV_BUILDER`  
> **Route chính:** `/tools/cv-builder/[id]`  
> **Tech Stack cốt lõi:** `React Hook Form` + `Zod` + `@dnd-kit/*` + `Zustand` + `React DayPicker` + `Lucide React`.

---

## 1. Cấu Trúc Section Chuẩn Của CV Editor

| Section Key | Nhãn tiếng Việt (`vi`) | Nhãn tiếng Anh (`en`) | Loại dữ liệu | Hỗ trợ kéo-thả |
|---|---|---|---|---|
| `personalInfo` | Thông tin cá nhân | Personal Details | Object cố định trên cùng *(luôn ở đầu CV)* | Không |
| `summary` | Mục tiêu nghề nghiệp | Professional Summary | Chuỗi đoạn văn (Rich bullet / text) | Kéo thứ tự section |
| `education` | Học vấn | Education | Mảng `EducationItem[]` | Kéo cả section & item con |
| `experience` | Kinh nghiệm làm việc | Work Experience | Mảng `ExperienceItem[]` | Kéo cả section & item con |
| `skills` | Kỹ năng | Skills | Mảng `SkillGroup[]` (nhóm *Kỹ năng chuyên môn*, *Kỹ năng mềm*, *Kỹ năng khác*) | Kéo cả section & item con |
| `projects` | Dự án | Projects | Mảng `ProjectItem[]` | Kéo cả section & item con |
| `achievements` | Thành tích & Giải thưởng | Honors & Awards | Mảng `AchievementItem[]` (`title`, **`year`**, `issuer`, `description`) | Kéo cả section & item con |
| `activities` | Hoạt động ngoại khóa | Extracurricular Activities | Mảng `ActivityItem[]` | Kéo cả section & item con |
| `certifications` | Chứng chỉ & Ngoại ngữ | Certifications & Languages | Mảng `CertificationItem[]` | Kéo cả section & item con |
| `custom` | Mục tùy chỉnh | Custom Section | Mảng `CustomSection[]` | Kéo cả section & item con |

---

## 2. Kiến Trúc Form Builder (`React Hook Form` + `Zod`)

1. **Khởi tạo & Đồng bộ State:**
   - Trang `/tools/cv-builder/[id]` fetch `GET /api/cv/[id]` và khởi tạo `useCvEditorStore.hydrate(cv)` (Zustand).
   - Form chính sử dụng `useForm<CvFormValues>({ resolver: zodResolver(cvFormSchema), mode: "onChange", defaultValues })`.
   - Sử dụng `form.watch((values) => store.syncFormValues(values))` (debounce nhẹ 80–120ms hoặc subscribe chọn lọc) để **Live Preview** cập nhật ngay khi người dùng gõ mà không ép toàn bộ tree Form Input re-render.
   - Mảng các item trong từng section quản lý qua `useFieldArray({ control, name: "education" })` (tương tự cho `experience`, `skills`, `projects`, `achievements`, `activities`, `certifications`, `customSections`).

2. **Schema Validation (`src/validations/cv.ts` — Zod v4):**
   - `personalInfo`:
     - `fullName`: `z.string().trim().min(2, "Vui lòng nhập họ tên").max(100)`
     - `jobTitle`: `z.string().trim().max(120).optional()`
     - `email`: `z.string().trim().email("Email không hợp lệ").or(z.literal(""))`
     - `phone`: `z.string().trim().max(30).optional()`
     - `location`, `website`, `linkedin`, `github`, `portfolio`: kiểm tra URL an toàn `https?://` với các trường link.
   - `achievements[]` (`AchievementItem`):
     - `title`: `z.string().trim().min(1, "Vui lòng nhập tên thành tích").max(200)`
     - `year`: `z.number().int().min(1980).max(CURRENT_YEAR + 1).nullable().optional()` *(cho phép nhập/chọn **năm bao nhiêu**, VD: `2025`, hoặc để trống nếu không muốn ghi năm lên CV)*
     - `issuer`: `z.string().trim().max(150).optional()` *(đơn vị trao / trường / cuộc thi — tùy chọn)*
     - `description`: `z.string().trim().max(500).optional()`
   - Mọi item có thời gian (`education`, `experience`, `projects`, `activities`):
     - `startDate`: `z.string().nullable().optional()` (ISO `YYYY-MM-DD` hoặc `YYYY-MM`)
     - `endDate`: `z.string().nullable().optional()`
     - `isCurrent`: `z.boolean().default(false)`
     - `.superRefine()`: nếu `!isCurrent && startDate && endDate && endDate < startDate` → báo lỗi *"Thời gian kết thúc phải lớn hơn hoặc bằng thời gian bắt đầu"*.
   - **Hiển thị lỗi ngay trên từng input & badge tổng lỗi ở header section** giúp sinh viên dễ rà soát trước khi xuất PDF.

---

## 3. Sắp Xếp Thứ Tự Bằng `dnd-kit`

### 3.1 Kéo-thả cấp Section (Section Reordering)
- Thanh điều hướng / danh sách section bên trái bọc trong `<DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleSectionDragEnd}>` và `<SortableContext items={sectionOrder} strategy={verticalListSortingStrategy}>`.
- Mỗi section card có nút tay nắm (`<GripVertical />` từ `lucide-react`) gắn `{...attributes} {...listeners}`, kèm nút **Ẩn/Hiện section** (`<Eye />` / `<EyeOff />`).
- Khi kéo xong: cập nhật ngay `sectionOrder` trong Zustand store → Live Preview đảo bố cục tức thì → kích hoạt auto-save.

### 3.2 Kéo-thả Item trong từng Section (Nested Item Reordering)
- Trong các section danh sách (`education`, `experience`, `projects`, `achievements`, `activities`, `certifications`, `skills`):
  - Dùng `DndContext` riêng cho từng danh sách item (`items={fields.map(f => f.id)}`).
  - Khi `onDragEnd`: gọi hàm `move(oldIndex, newIndex)` từ React Hook Form `useFieldArray` đồng bộ ID ổn định của RHF, sau đó cập nhật Zustand store.
- Hỗ trợ `PointerSensor` (với `activationConstraint: { distance: 6 }` để không cấn khi bấm nút thu gọn/xóa) và `KeyboardSensor` (`sortableKeyboardCoordinates`).

---

## 4. Chọn Thời Gian Chuyên Dụng (`React DayPicker`)

### Component `CvMonthDatePicker` (`src/components/cv/CvDatePicker.tsx`)
- Xây dựng trên nền `DayPicker` (`react-day-picker`) + `date-fns` (`locale: vi`):
  - Nút kích hoạt hiển thị gọn: icon `<Calendar />` (`lucide-react`) + giá trị định dạng `"MM/YYYY"` (VD: `"09/2023"`) hoặc placeholder `"Chọn thời gian"`.
  - Mở popover chứa `DayPicker` với chế độ dropdown chọn nhanh Tháng / Năm (`captionLayout="dropdown"`, dải năm từ `1990` đến `CURRENT_YEAR + 6` cho ngày tốt nghiệp dự kiến!).
  - Hỗ trợ nhập/chọn mức **Tháng/Năm** (chuẩn CV quốc tế & ATS) hoặc chọn ngày cụ thể, kèm nút **"Xóa ngày"** và tùy chọn **"Hiện tại (Present)"** cho `endDate` (khi bật `isCurrent = true`, ô `endDate` tự khóa và Preview hiển thị `"Hiện tại"` / `"Present"`).

---

## 5. UX Hỗ Trợ Soạn Thảo Nhanh & Tích Hợp Dữ Liệu

1. **Accordion đóng/mở từng item:** Mỗi item kinh nghiệm/dự án có thể thu gọn chỉ còn 1 dòng tiêu đề (`Vị trí · Công ty · Thời gian`) để giao diện gọn gàng khi CV dài.
2. **Gợi ý động từ mô tả thành tích chuẩn ATS:** Trong `experience` và `projects`, hiển thị nút gợi ý động từ hành động (*"Xây dựng...", "Tối ưu...", "Phối hợp..."*) và cho phép thêm nhiều gạch đầu dòng (`highlights[]`).
3. **Đồng bộ dữ liệu UNERA:**
   - Trong section **Kỹ năng (`skills`)**, nút *"Đồng bộ từ Hồ sơ cá nhân"*: đọc `hardSkills`, `softSkills`, `skills` từ `StudentProfile`, hợp nhất (merge) các kỹ năng mới vào đúng nhóm (*Kỹ năng chuyên môn*, *Kỹ năng mềm*, *Kỹ năng khác*) mà không làm trùng lặp hoặc mất các kỹ năng người dùng đã tự thêm trong CV.
   - Trong section **Thành tích & Giải thưởng (`achievements`)**, nút *"Nhập từ Bảng thành tích UNERA"*: đọc `StudentProfile.achievements` (`string[]`), lọc bỏ các thành tích đã có trong CV, thêm phần tử mới kèm ô nhập **Năm (`year`, VD: `2025`)** ngay trên từng dòng thành tích (kèm nút chọn nhanh năm từ dropdown `CURRENT_YEAR` lùi về `1995`) để sinh viên bổ sung mốc thời gian chính xác cho CV.
   - Trong section **Hoạt động ngoại khóa (`activities`)**, nút *"Nhập từ Hoạt động đã quan tâm"* chèn hoạt động từ Module 04 (`ActivityFollow`).
4. **Auto-save & Optimistic Locking:**
   - Tự động lưu sau `1.5 giây` ngừng gõ (`debounce`), hiển thị badge trạng thái: `Đang lưu...` / `Đã lưu lúc HH:mm` / `Lỗi kết nối - Thử lại`.
   - Kèm nút **Lưu thủ công (`Ctrl+S`)** và kiểm tra `version` để phát hiện xung đột `409 Conflict` nếu mở CV trên 2 tab song song.

