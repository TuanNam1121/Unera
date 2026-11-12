# CV-03: Thư Viện Mẫu CV (CV Templates)

> **Module:** `09_CV_BUILDER`  
> **Route chính:** `/tools/cv-builder/templates` (và drawer chọn mẫu trực tiếp bên trong `/tools/cv-builder/[id]`)  
> **Mục tiêu:** Cung cấp thư viện mẫu CV đa dạng, chuẩn ATS lẫn hiện đại, phân loại rõ theo **Ngành nghề**, **Phong cách** và **Cấp độ kinh nghiệm**, giúp sinh viên chọn đúng mẫu phù hợp với mục tiêu ứng tuyển và có thể đổi mẫu bất kỳ lúc nào mà **không mất dữ liệu**.

---

## 1. Hệ Thống Phân Loại Mẫu CV (Taxonomy & Filtering)

| Tiêu chí lọc | Giá trị phân loại (Enum / Filter Chips) | Mô tả sử dụng |
|---|---|---|
| **Ngành nghề (`industry`)** | `ALL` (Tất cả), `BUSINESS_MARKETING` (Kinh doanh & Marketing), `TECH_IT` (Công nghệ & IT), `LANGUAGE_EDUCATION` (Ngôn ngữ, Sư phạm & Truyền thông), `ACADEMIC_GENERAL` (Học thuật, Học bổng & Đa ngành) | Lọc mẫu có bố cục section order gợi ý phù hợp từng lĩnh vực |
| **Phong cách (`style`)** | `MINIMALIST_ATS` (Tối giản chuẩn ATS), `MODERN_TWO_COL` (Hiện đại 2 cột), `CLASSIC_EXECUTIVE` (Cổ điển trang trọng), `CREATIVE_ACCENT` (Nhấn màu sáng tạo) | Chọn hình thức trình bày phù hợp văn hóa doanh nghiệp (MNC, Startup, Học thuật) |
| **Cấp độ kinh nghiệm (`experienceLevel`)** | `STUDENT_NO_EXP` (Sinh viên năm 1–2 / Chưa có kinh nghiệm), `INTERN_FRESHER` (Thực tập sinh / Mới tốt nghiệp), `EXPERIENCED` (Đã đi làm / Management Trainee) | Khuyến nghị thứ tự section mặc định (VD: SV năm 1–2 đưa *Học vấn, Dự án, Hoạt động* lên trước *Kinh nghiệm*) |

---

## 2. Danh Sách Mẫu CV Chuẩn Đề Xuất (Catalog Khởi Tạo — 6 Mẫu)

| `templateId` | Tên mẫu | Ngành nghề | Phong cách | Cấp độ | Hỗ trợ Avatar | ATS Friendly |
|---|---|---|---|---|---|---|
| `ats-minimal-classic` | **Minimalist ATS Classic** | `ACADEMIC_GENERAL` | `MINIMALIST_ATS` | `INTERN_FRESHER` | Không | **99% (1 cột chuẩn ATS)** |
| `modern-two-col-pro` | **Modern Split Blue** | `BUSINESS_MARKETING` | `MODERN_TWO_COL` | `INTERN_FRESHER` | Có | **88% (2 cột sạch, không bảng phức tạp)** |
| `tech-engineering-clean` | **Tech & Engineering Clean** | `TECH_IT` | `MINIMALIST_ATS` | `INTERN_FRESHER` | Không | **98% (Ưu tiên Skills & Projects)** |
| `academic-scholarship-cv` | **Academic & Scholarship** | `ACADEMIC_GENERAL` | `CLASSIC_EXECUTIVE` | `STUDENT_NO_EXP` | Không | **97% (Nhấn mạnh GPA, NCKH, Giải thưởng)** |
| `language-teaching-elegance` | **Language & Education Elegance** | `LANGUAGE_EDUCATION` | `CREATIVE_ACCENT` | `STUDENT_NO_EXP` | Có | **92% (Nhấn mạnh Chứng chỉ IELTS/TESOL & Hoạt động)** |
| `executive-mt-slate` | **Corporate Management Trainee** | `BUSINESS_MARKETING` | `CLASSIC_EXECUTIVE` | `EXPERIENCED` | Có | **95% (Cân đối Leadership & Thành tích)** |

---

## 3. Kiến Trúc `CVTemplateConfig` (Tách Biệt Dữ Liệu & Giao Diện)

Mỗi template được định nghĩa thống nhất tại `src/lib/cv-templates.ts` với cấu trúc dùng chung cho **cả Live Preview (HTML/CSS)** và **React PDF (`@react-pdf/renderer`)**:

```ts
export interface CVTemplateDefinition {
  id: string;
  name: string;
  description: string;
  industry: CvIndustry[];
  style: CvTemplateStyle;
  experienceLevel: CvExperienceLevel[];
  atsScore: number; // VD: 98
  supportsAvatar: boolean;
  layoutType: "single-column" | "two-column-left" | "two-column-right";
  defaultSectionOrder: CvSectionKey[];
  sidebarSections?: CvSectionKey[]; // Dùng cho two-column (VD: ["skills", "certifications", "achievements", "activities"])
  defaultStyleConfig: {
    accentColor: string;
    fontFamily: "Inter" | "Roboto" | "TimesNewRoman";
    fontSizeScale: "sm" | "md" | "lg";
    lineHeight: number; // 1.35 | 1.5 | 1.65
    pagePadding: "compact" | "normal" | "relaxed";
    headerAlign: "left" | "center";
  };
  paletteOptions: string[]; // Danh sách mã màu khuyên dùng
}
```

### Nguyên tắc "Đổi Mẫu Không Mất Dữ Liệu" (Zero-Data-Loss Template Switching)
- Toàn bộ nội dung người dùng nhập (`personalInfo`, `summary`, `education`, `experience`, `skills`, `projects`, `achievements`, `activities`, `certifications`, `customSections`) lưu trong schema trung lập của `CvDocument`.
- Khi đổi `templateId`:
  1. Dữ liệu các section **giữ nguyên 100%**.
  2. Chỉ cập nhật `templateId` và *(tùy chọn hỏi người dùng hoặc áp dụng nếu chưa tùy chỉnh tay)* cập nhật `defaultStyleConfig` / `defaultSectionOrder` của mẫu mới.
  3. Cả component Web Live Preview lẫn React PDF Document đọc chung registry `CV_TEMPLATE_MAP[templateId]` để kết xuất đồng nhất.

---

## 4. Giao Diện Trang Thư Viện Mẫu (`/tools/cv-builder/templates`)

- Bố cục full-width (`w-full px-3 sm:px-4 lg:px-5`), thanh filter ngang gồm Search + Chips Ngành nghề + Select Phong cách + Select Cấp độ.
- Lưới hiển thị **3–4 thẻ mẫu mỗi hàng** (`grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4`).
- Mỗi thẻ template hiển thị:
  - Hình/render preview mẫu thu nhỏ với dữ liệu mẫu (mock data sinh viên ULIS/VN).
  - Badge mức độ chuẩn ATS (`ATS 98%`), badge cấp độ phù hợp, icon hỗ trợ ảnh hay không.
  - Hai nút hành động: **"Xem lớn"** (mở Preview Modal khổ A4 với dữ liệu mẫu) và **"Dùng mẫu này"** (tạo CV mới gắn `templateId` này kèm tùy chọn pre-fill `StudentProfile`, hoặc áp dụng ngay nếu đang mở từ Editor).

