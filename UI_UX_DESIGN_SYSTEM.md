# UNERA — UI/UX Design System & Style Guidelines

> **Tài liệu tham chiếu chuẩn cho toàn bộ giao diện UNERA:** Định nghĩa bảng màu (Color Palette), cấu trúc bố cục (Layout Architecture), kiểu chữ (Typography), thành phần giao diện (Component Specifications) và các nguyên tắc thiết kế bất biến áp dụng cho tất cả các trang hiện tại và tương lai.

---

## 1. Triết lý Thiết kế (Design Philosophy)

Giao diện UNERA tuân thủ phong cách **Modern EdTech / Clean SaaS Portal**:
- **Trực quan & Tối giản (Clarity & Minimalism):** Tối ưu không gian biểu đạt thông tin, tránh hiệu ứng thị giác rườm rà. Nội dung học tập và cơ hội là trọng tâm.
- **Thân thiện với sinh viên (Student-centric & Welcoming):** Sử dụng các gam màu xanh dương hoàng gia (Royal Blue) kết hợp với các mảng màu pastel dịu mắt (Soft Blue, Lavender, Mint, Peach) mang lại cảm giác tin cậy, truyền cảm hứng và giảm áp lực học tập.
- **Cấu trúc phân tầng rõ ràng (Strict Hierarchy & Scannability):** Phân chia rõ Sidebar cố định, Topbar điều hướng, Hero Banner truyền động lực và các Card thông tin có thể quét nhanh bằng mắt trong 3 giây.
- **Nhất quán & Khả mở (Consistency & Scalability):** Mọi màn hình mới (Kanban, Lộ trình, Hồ sơ, CMS Admin) đều phải tái sử dụng bộ tokens và cấu trúc bố cục này.

---

## 2. Bảng Màu Hệ Thống (Color Palette & Tokens)

### 2.1 Màu Chủ đạo (Primary & Brand Colors)
Gam màu xanh dương biểu trưng cho tri thức, sự dẫn hướng và tương lai:
| Token | Hex | Tailwind Class | Ứng dụng |
|---|---|---|---|
| `primary` | `#2563EB` | `bg-blue-600` / `text-blue-600` | Nút hành động chính (Primary CTA), liên kết nổi bật, tỷ lệ hoàn thành |
| `primary-hover` | `#1D4ED8` | `bg-blue-700` | Trạng thái hover của nút bấm |
| `primary-active` | `#1E40AF` | `bg-blue-800` | Trạng thái active/pressed |
| `primary-light` | `#EFF6FF` | `bg-blue-50` / `text-blue-700` | Nền menu item đang chọn (Active sidebar item), tag "Đang chọn" |
| `brand-dot` | `#2563EB` | `text-blue-600` | Dấu chấm đặc trưng sau logo `Unera .` |

### 2.2 Màu Nền & Bề Mặt (Background & Surface)
| Token | Hex | Tailwind Class | Ứng dụng |
|---|---|---|---|
| `canvas-bg` | `#F6F8FB` | `bg-[#F6F8FB]` | Nền toàn bộ vùng nội dung (App content background) |
| `surface` | `#FFFFFF` | `bg-white` | Nền Sidebar, Topbar, Thẻ nội dung (Cards), Hộp thoại |
| `surface-secondary`| `#F8FAFC` | `bg-slate-50` | Nền ô input tìm kiếm, dropdown, header bảng |

### 2.3 Màu Đường Viền & Phân Cách (Borders & Dividers)
| Token | Hex | Tailwind Class | Ứng dụng |
|---|---|---|---|
| `border-subtle` | `#EDF2F7` | `border-slate-100` | Viền thẻ Card, viền mỏng chia cột |
| `border-default` | `#E2E8F0` | `border-slate-200` | Viền Sidebar bên phải, viền Topbar, viền ô nhập liệu |
| `border-hover` | `#CBD5E1` | `hover:border-slate-300`| Trạng thái hover của Card tương tác |

### 2.4 Bảng Màu Pastel cho Danh mục & Nhãn (Category & Tag Colors)
Mỗi danh mục cơ hội / bài viết sở hữu một bộ màu nền pastel và chữ tương phản nhẹ nhàng:
| Danh mục | Nền Tag (Bg) | Chữ Tag (Text) | Viền (Border) |
|---|---|---|---|
| **Du học & Học bổng** | `#EFF6FF` (`bg-blue-50`) | `#2563EB` (`text-blue-600`) | `#DBEAFE` (`border-blue-100`) |
| **Khối ngành / Kinh tế** | `#F3E8FF` (`bg-purple-50`)| `#7E22CE` (`text-purple-700`)| `#E9D5FF` (`border-purple-100`)|
| **Kỹ năng & CV** | `#F0F9FF` (`bg-sky-50`) | `#0284C7` (`text-sky-700`) | `#E0F2FE` (`border-sky-100`) |
| **Sau đại học** | `#EEF2FF` (`bg-indigo-50`)| `#4338CA` (`text-indigo-700`)| `#E0E7FF` (`border-indigo-100`)|
| **Nghiên cứu khoa học** | `#ECFDF5` (`bg-emerald-50`)| `#047857` (`text-emerald-700`)| `#D1FAE5` (`border-emerald-100`)|
| **Cuộc thi sinh viên** | `#FFF1F2` (`bg-rose-50`) | `#BE123C` (`text-rose-700`) | `#FFE4E6` (`border-rose-100`) |
| **Quản trị viên tập sự** | `#FFFBEB` (`bg-amber-50`) | `#B45309` (`text-amber-700`) | `#FEF3C7` (`border-amber-100`) |
| **Chương trình Đại sứ** | `#ECFEFF` (`bg-cyan-50`) | `#0E7490` (`text-cyan-700`) | `#CFFAFE` (`border-cyan-100`) |

### 2.5 Hero Banner Gradient (Đặc trưng Unera)
```css
background: linear-gradient(135deg, #DBEAFE 0%, #EFF6FF 50%, #DCEBFE 100%);
/* Hoặc Tailwind: bg-gradient-to-r from-blue-100 via-sky-50 to-blue-100 */
```

---

## 3. Kiểu Chữ (Typography Scale)

* **Font Family:** `Geist`, `Inter`, hoặc system sans-serif (`-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`).
* **Quy chuẩn hiển thị:**
  * **Logo Brand:** Cỡ 22px, `font-bold`, màu `#0F172A`, kèm dấu chấm xanh `#2563EB`. Subtitle phía dưới: `font-semibold`, 9px, `tracking-[0.15em]`, màu `#94A3B8`, in hoa toàn bộ: `ĐỊNH HƯỚNG TƯƠNG LAI`.
  * **Trang / Heading chính (Page Title / H1):** Cỡ 26px - 32px, `font-bold`, `leading-tight`, màu `#0F172A`.
  * **Section Heading (H2):** Cỡ 20px - 22px, `font-bold`, màu `#0F172A`.
  * **Card Title (H3):** Cỡ 16px - 17px, `font-semibold`, màu `#0F172A`, `leading-snug`.
  * **Body Text / Mô tả:** Cỡ 13px - 14px, `font-normal`, màu `#64748B`, `leading-relaxed`.
  * **Sub-labels / Tags / Metadata:** Cỡ 11px - 12px, `font-medium`, màu `#64748B` hoặc màu danh mục.

---

## 4. Cấu Trúc Bố Cục Toàn Khung (Layout Architecture)

Toàn bộ ứng dụng sử dụng bố cục **App Shell 2 Cột cố định**:

```text
┌────────────────────────────────────────────────────────────────────────┐
│ [Sidebar - 250px]   │ [Topbar - Chiều cao 60px]                        │
│                     │ Tiêu đề trang        [🔍 Tìm kiếm ⌘K] [🔔] [👤 Hồ sơ] │
│ Unera .             ├──────────────────────────────────────────────────┤
│ ĐỊNH HƯỚNG TƯƠNG LAI│ [Main Content Canvas - Nền #F6F8FB]             │
│                     │                                                  │
│ ⌂ Trang chủ         │  ┌────────────────────────────────────────────┐  │
│ 🔍 Tìm kiếm         │  │ Hero Banner (Nền xanh pastel + Hình cầu)   │  │
│ 🧭 Khám phá định... │  └────────────────────────────────────────────┘  │
│ 🔔 Thông báo        │                                                  │
│ 📰 Tin tức          │  ┌────────────────────────┐ ┌────────────────┐   │
│ 👤 Hồ sơ cá nhân    │  │ Lộ trình của tôi (2/3) │ │ Hạn sắp tới    │   │
│ 🎓 Hoạt động SV     │  └────────────────────────┘ └────────────────┘   │
│ 🏅 Chứng chỉ        │                                                  │
│ 🧰 Công cụ          │  ┌──────────────┐ ┌──────────────┐ ┌──────────┐  │
│                     │  │ Cơ hội 1     │ │ Cơ hội 2     │ │ Cơ hội 3 │  │
│ ...                 │  └──────────────┘ └──────────────┘ └──────────┘  │
│ Polaris · SV        │                                                  │
└────────────────────────────────────────────────────────────────────────┘
```

### 4.1 Thanh Điều Hướng Trái (Left Sidebar)
- **Chiều rộng:** `250px` cố định, nền trắng (`#FFFFFF`), đường viền phải `border-r border-slate-200/80`.
- **Phân cấp Menu:**
  - Mục cấp 1: Biểu tượng (16px), nhãn (13px), có mũi tên mở rộng nếu có menu con.
  - Trạng thái Active: `bg-blue-50 text-blue-600 font-semibold rounded-lg`.
  - Mục cấp 2 (Sub-items): Thụt lề `pl-8`, màu xám `#64748B`, cỡ chữ `12px`, hover chuyển màu `#0F172A`.
  - Chân Sidebar: Dòng chữ bản quyền mờ `Polaris · Đồng hành cùng sinh viên` (`11px text-slate-400`).

### 4.2 Thanh Tiêu Đề Trên (Top Bar)
- **Chiều cao:** `60px`, nền trắng (`#FFFFFF`), viền dưới `border-b border-slate-200/80`, gắn cố định (sticky).
- **Thành phần:**
  - Trái: Tiêu đề trang hiện tại (ví dụ: `Trang chủ` hoặc `Tin tức & bài viết`).
  - Giữa: Ô tìm kiếm bo tròn pill (`rounded-full bg-slate-50 border border-slate-200`), placeholder xám nhạt, phím tắt `⌘ K` bên phải.
  - Phải: Nút chuông thông báo bo tròn (`rounded-full p-2`), Nút tài khoản dạng pill (`border rounded-full px-3 py-1.5 flex items-center gap-1.5 text-xs font-medium text-slate-700`).

### 4.3 Vùng Nội Dung Chính (Main Content Canvas)
- **Nền:** `#F6F8FB`.
- **Khoảng đệm:** `p-6 sm:p-8 space-y-6`.
- **Khoảng cách giữa các thẻ (Gap):** `gap-5` hoặc `gap-6`.

---

## 5. Quy Chuẩn Thành Phần (Component Specifications)

### 5.1 Thẻ Nội Dung (Card Component)
- **Bán kính bo góc:** `rounded-2xl` (`16px`).
- **Nền:** `#FFFFFF`.
- **Viền:** `border border-slate-100` hoặc `border-[#E5E9F2]`.
- **Bóng đổ:** `shadow-[0_2px_8px_rgba(0,0,0,0.02)]` (rất nhẹ, tự nhiên).
- **Hover:** Tăng nhẹ độ đổ bóng `hover:shadow-md` và viền chuyển sang `hover:border-blue-200`.

### 5.2 Hero Banner
- Bo tròn `rounded-3xl` (`24px`).
- Nền dải màu chuyển nhẹ `from-[#DCEBFE] via-[#E8F1FD] to-[#D5E7FD]`.
- Nút CTA chính: Bo góc `rounded-xl`, nền xanh `#2563EB`, chữ trắng, có icon mũi tên `->`.
- Nút phụ: Nền trắng đục hoặc viền trắng `bg-white/80 text-slate-800`.
- Minh họa bên phải: Vòng tròn quỹ đạo mảnh (orbital rings) và thẻ mini nổi bật với thanh tiến độ gradient.

### 5.3 Thanh Tiến Độ (Progress Bar)
- Chiều cao: `8px`, bo tròn hoàn toàn `rounded-full`.
- Nền rãnh: `#E2E8F0` hoặc `#DBEAFE`.
- Thanh hiển thị: Xanh dương nguyên khối `#2563EB`.

### 5.4 Danh Sách Hạn Chót (Upcoming Deadlines Block)
- Khối ngày tháng: Ô hình chữ nhật đứng bo góc nhẹ, nền nhạt:
  - Số ngày: `font-bold text-lg text-blue-600`.
  - Tháng: `text-[10px] uppercase font-semibold text-slate-400` (ví dụ: `TH 11`).
- Nhãn đếm ngược: Tag dạng pill nhỏ phía bên phải `Còn 3 ngày`, `Còn 5 ngày`.

### 5.5 Bộ Lọc Ngang Dạng Pills (Filter Chips)
- Trạng thái chưa chọn: `bg-white border border-slate-200 text-slate-600 rounded-full text-xs px-4 py-1.5 hover:bg-slate-50`.
- Trạng thái đang chọn: `bg-blue-600 text-white rounded-full text-xs px-4 py-1.5 shadow-sm shadow-blue-500/20 font-medium`.

### 5.6 Nút Lưu / Đánh Dấu (Bookmark Button)
- Biểu tượng lá cờ / Bookmark icon nằm ở góc trên bên phải của card:
  - Chưa lưu: `text-slate-400 hover:text-slate-600`.
  - Đã lưu: `text-blue-600 fill-blue-600`.

---

## 6. Hướng Dẫn Áp Dụng Cho Các Tính Năng Tương Lai

1. **Trang Khám phá Cơ hội (`/explore`):**
   - Giữ nguyên bố cục Sidebar + Topbar.
   - Phần đầu trang dùng bộ lọc ngang pills cho 7 danh mục.
   - Thân trang dùng lưới 3 cột hiển thị thẻ cơ hội tương tự khối "Cơ hội nổi bật" ở trang chủ.
2. **Trang Lộ trình Phát triển (`/roadmap`):**
   - Sử dụng thẻ tiến độ tổng thể (67% - giai đoạn x/y) ở đầu trang.
   - Các năm học / kỳ học được tổ chức dạng timeline phân nhánh với check-box tròn sắc nét.
3. **Trang Ứng tuyển & Kanban (`/applications`):**
   - Các cột Kanban sử dụng nền `#F1F5F9`, các thẻ ứng tuyển màu trắng `rounded-xl border border-slate-200` với nhãn trạng thái pastel tương ứng.
4. **Trang Chi tiết Cơ hội / Bài viết:**
   - Cột trái: Nội dung chi tiết.
   - Cột phải: Khối hành động cố định gồm nút "Thêm vào lịch" (màu xanh `#2563EB`), nút "Lưu cơ hội", và thông tin hạn chót.
