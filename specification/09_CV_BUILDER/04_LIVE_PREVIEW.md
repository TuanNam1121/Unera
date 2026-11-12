# CV-04: Live Preview & Tùy Biến Bố Cục Thời Gian Thực

> **Module:** `09_CV_BUILDER`  
> **Vị trí hiển thị:** Nửa phải màn hình Split-pane tại `/tools/cv-builder/[id]` (và Tab **"Xem trước"** trên Mobile/Tablet).  
> **Tech Stack cốt lõi:** `Zustand` (`useCvEditorStore`) + CSS A4 Canvas Scaling + `Lucide React`.

---

## 1. Luồng Đồng Bộ Thời Gian Thực (Zustand Architecture)

```text
[React Hook Form Inputs / dnd-kit Drag / DayPicker]
        │ (onChange / move / toggle visibility)
        ▼
[Zustand Store: useCvEditorStore]
  ├── cvData (personalInfo, summary, sections...)
  ├── templateId, sectionOrder, hiddenSections
  ├── styleConfig (accentColor, fontFamily, fontSizeScale, lineHeight, pagePadding)
  ├── uiState (zoomLevel, previewPageMode, activeTemplateDrawer)
  └── saveState (isDirty, saveStatus, version)
        │
        ├──▶ [Debounced Auto-Save 1.5s] ──▶ PATCH /api/cv/[id]
        └──▶ [Selector Subscription] ──▶ [A4 Live Preview Renderer] (< 16ms)
```

- **Tối ưu hiệu năng:** Live Preview chỉ subscribe vào các slice dữ liệu (`cvData`, `templateId`, `styleConfig`, `sectionOrder`, `hiddenSections`) trong `useCvEditorStore`, tránh re-render toàn bộ sidebar hoặc form khi chỉ đổi zoom hay trạng thái lưu.

---

## 2. Chế Độ Hiển Thị & Điều Khiển Khung Live Preview

1. **Bố cục Split-Pane Responsive:**
   - **Desktop (`xl` / `lg`):** Hai cột cạnh nhau (`50%` Editor Form bên trái có cuộn độc lập — `50%` Khung nền xám chứa trang CV khổ A4 bên phải có thanh công cụ nổi ở trên).
   - **Tablet / Mobile (`< 1024px`):** Thanh chuyển tab cố định ở đầu trang (`Soạn thảo` ↔ `Xem trước CV` ↔ `Tùy biến giao diện`).
2. **Tỷ lệ giấy A4 chuẩn (`210mm × 297mm` ≈ `794px × 1123px` ở 96 DPI):**
   - Dùng `ResizeObserver` tính tỷ lệ scale tự động (`Fit Width`) để trang A4 luôn vừa vặn trong khung xem trước bất kể độ rộng màn hình.
   - Thanh điều khiển Zoom gồm: `-`, hiển thị `%` (`50%`, `75%`, `100%`, `125%`), `+`, và nút **"Vừa khung (Fit)"**.
   - Nếu nội dung dài hơn 1 trang A4: hiển thị **vạch ngăn trang mô phỏng (`Page 1 / Page 2`)** giúp sinh viên căn chỉnh độ dài CV trước khi xuất PDF.

---

## 3. Thanh Công Cụ Tùy Biến Trực Tiếp (Live Style & Layout Controls)

Sinh viên có thể mở nhanh thanh **Thiết kế & Bố cục** ngay phía trên hoặc cạnh Live Preview để chỉnh sửa mọi thông số và thấy kết quả ngay lập tức:

| Nhóm tùy biến | Tùy chọn cụ thể | Tác động |
|---|---|---|
| **Đổi Template nhanh** | Drawer/Modal chọn 1 trong 6 mẫu CV trong `CV_TEMPLATE_MAP` | Đổi layout 1 cột ↔ 2 cột, giữ nguyên toàn bộ nội dung |
| **Màu nhấn (Accent Color)** | 8 preset màu chuyên nghiệp (Xanh Navy, Xanh Dương, Xanh Ngọc, Xám Slate, Đỏ Đô, Tím Than...) + Color Picker hex hợp lệ (`/^#[0-9a-fA-F]{6}$/`) | Áp dụng cho tiêu đề tên, đường kẻ section, thanh kỹ năng và icon |
| **Font chữ** | `Inter` (Hiện đại), `Roboto` (Rõ nét), `Times New Roman / Noto Serif` (Học thuật cổ điển) | Áp dụng đồng nhất cho cả Preview HTML & PDF Export |
| **Cỡ chữ (`fontSizeScale`)** | `Nhỏ (Compact - 9.5pt)` \| `Tiêu chuẩn (10.5pt)` \| `Lớn (11.5pt)` | Giúp co vừa CV vào 1 trang A4 hoặc tăng độ dễ đọc |
| **Khoảng cách & Lề trang** | `pagePadding`: `compact` \| `normal` \| `relaxed`; `lineHeight`: `1.35` \| `1.5` \| `1.65` | Tối ưu mật độ chữ trên trang A4 |
| **Ngôn ngữ nhãn Section (`locale`)** | `Tiếng Việt` (`HỌC VẤN`, `KINH NGHIỆM`, `Hiện tại`) ↔ `English` (`EDUCATION`, `WORK EXPERIENCE`, `Present`) | Đổi toàn bộ heading chuẩn & từ khóa ngày tháng |
| **Tùy chọn hiển thị** | Bật/tắt Avatar *(nếu mẫu hỗ trợ)*, căn lề Header (`left` / `center`), bật/tắt nhanh từng section (`hiddenSections`) | Linh hoạt ẩn các mục chưa có dữ liệu (VD: ẩn *Kinh nghiệm* với SV năm nhất). Mục *Thành tích & Giải thưởng* tự động căn hiển thị kèm thông tin **Năm (`year`)** nếu có, và *Kỹ năng* hiển thị rõ theo các nhóm lấy từ `hardSkills` / `softSkills` / `skills`. |

