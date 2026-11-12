import type {
  CvExperienceLevel,
  CvFontFamily,
  CvFontSizeScale,
  CvIndustry,
  CvLocale,
  CvPagePadding,
  CvSectionKey,
  CvTemplateStyle,
  ICvStyleConfig,
} from "@/types/cv";

export const CV_MAX_PER_USER = 30;
export const DEFAULT_CV_TEMPLATE_ID = "ats-minimal-classic";

export const CV_DEFAULT_SECTION_ORDER: CvSectionKey[] = [
  "summary",
  "education",
  "experience",
  "projects",
  "skills",
  "achievements",
  "activities",
  "certifications",
  "custom",
];

export const CV_ALL_SECTION_KEYS = CV_DEFAULT_SECTION_ORDER;

export const CV_SECTION_LABELS: Record<
  CvLocale,
  Record<CvSectionKey | "personalInfo", string>
> = {
  vi: {
    personalInfo: "Thông tin cá nhân",
    summary: "Mục tiêu nghề nghiệp",
    education: "Học vấn",
    experience: "Kinh nghiệm làm việc",
    skills: "Kỹ năng",
    projects: "Dự án nổi bật",
    achievements: "Thành tích & Giải thưởng",
    activities: "Hoạt động ngoại khóa",
    certifications: "Chứng chỉ & Ngoại ngữ",
    custom: "Mục tùy chỉnh",
  },
  en: {
    personalInfo: "Personal Details",
    summary: "Professional Summary",
    education: "Education",
    experience: "Work Experience",
    skills: "Skills",
    projects: "Projects",
    achievements: "Honors & Awards",
    activities: "Extracurricular Activities",
    certifications: "Certifications & Languages",
    custom: "Custom Sections",
  },
};

export const CV_UI_LABELS: Record<
  CvLocale,
  {
    present: string;
    gpa: string;
    technologies: string;
    year: string;
    scoreOrLevel: string;
    credential: string;
    projectLink: string;
    dateOfBirth: string;
  }
> = {
  vi: {
    present: "Hiện tại",
    gpa: "GPA",
    technologies: "Công nghệ / Công cụ",
    year: "Năm",
    scoreOrLevel: "Điểm / Cấp độ",
    credential: "Liên kết chứng chỉ",
    projectLink: "Liên kết dự án",
    dateOfBirth: "Ngày sinh",
  },
  en: {
    present: "Present",
    gpa: "GPA",
    technologies: "Technologies",
    year: "Year",
    scoreOrLevel: "Score / Level",
    credential: "Credential",
    projectLink: "Project Link",
    dateOfBirth: "DOB",
  },
};

export const CV_ACCENT_PALETTE = [
  { name: "Xanh Navy", hex: "#1e3a8a" },
  { name: "Xanh Unera", hex: "#2563eb" },
  { name: "Xanh Ngọc", hex: "#0f766e" },
  { name: "Xám Slate", hex: "#334155" },
  { name: "Đen Cổ Điển", hex: "#111827" },
  { name: "Tím Than", hex: "#4f46e5" },
  { name: "Đỏ Đô", hex: "#991b1b" },
  { name: "Xanh Rêu", hex: "#166534" },
] as const;

export const CV_DEFAULT_STYLE_CONFIG: ICvStyleConfig = {
  accentColor: "#1e3a8a",
  fontFamily: "Inter",
  fontSizeScale: "md",
  lineHeight: 1.45,
  pagePadding: "normal",
  showAvatar: false,
  headerAlign: "left",
};

export const CV_FONT_OPTIONS: Array<{
  value: CvFontFamily;
  label: string;
  cssFamily: string;
}> = [
  {
    value: "Inter",
    label: "Inter (Hiện đại)",
    cssFamily: "var(--font-inter), Inter, sans-serif",
  },
  {
    value: "Roboto",
    label: "Roboto (Rõ nét)",
    cssFamily: "Roboto, Arial, sans-serif",
  },
  {
    value: "TimesNewRoman",
    label: "Serif (Học thuật cổ điển)",
    cssFamily: "'Times New Roman', Georgia, serif",
  },
];

export const CV_FONT_SCALE_OPTIONS: Array<{
  value: CvFontSizeScale;
  label: string;
  basePt: number;
}> = [
  { value: "sm", label: "Nhỏ (9.5pt)", basePt: 9.5 },
  { value: "md", label: "Tiêu chuẩn (10.5pt)", basePt: 10.5 },
  { value: "lg", label: "Lớn (11.5pt)", basePt: 11.5 },
];

export const CV_PADDING_OPTIONS: Array<{
  value: CvPagePadding;
  label: string;
  px: number;
  pt: number;
}> = [
  { value: "compact", label: "Gọn (28px)", px: 28, pt: 22 },
  { value: "normal", label: "Chuẩn (40px)", px: 40, pt: 30 },
  { value: "relaxed", label: "Thoáng (52px)", px: 52, pt: 38 },
];

export const CV_INDUSTRY_LABELS: Record<CvIndustry | "ALL", string> = {
  ALL: "Tất cả ngành nghề",
  BUSINESS_MARKETING: "Kinh doanh & Marketing",
  TECH_IT: "Công nghệ & IT",
  LANGUAGE_EDUCATION: "Ngôn ngữ, Sư phạm & Truyền thông",
  ACADEMIC_GENERAL: "Học thuật, Học bổng & Đa ngành",
};

export const CV_STYLE_LABELS: Record<CvTemplateStyle | "ALL", string> = {
  ALL: "Tất cả phong cách",
  MINIMALIST_ATS: "Tối giản chuẩn ATS",
  MODERN_TWO_COL: "Hiện đại 2 cột",
  CLASSIC_EXECUTIVE: "Cổ điển trang trọng",
  CREATIVE_ACCENT: "Nhấn màu sáng tạo",
};

export const CV_EXPERIENCE_LEVEL_LABELS: Record<CvExperienceLevel | "ALL", string> = {
  ALL: "Mọi cấp độ",
  STUDENT_NO_EXP: "SV năm 1–2 / Chưa có kinh nghiệm",
  INTERN_FRESHER: "Thực tập sinh / Mới tốt nghiệp",
  EXPERIENCED: "Đã đi làm / Management Trainee",
};

export const CV_ACTION_VERB_SUGGESTIONS = {
  vi: [
    "Xây dựng và tối ưu hóa...",
    "Phối hợp cùng đội ngũ đa phòng ban để...",
    "Phân tích dữ liệu và đề xuất giải pháp giúp tăng...",
    "Quản lý tiến độ và điều phối nguồn lực cho...",
    "Nghiên cứu thị trường / tài liệu chuyên sâu về...",
  ],
  en: [
    "Designed and implemented...",
    "Collaborated with cross-functional teams to...",
    "Analyzed key metrics to improve efficiency by...",
    "Led end-to-end delivery of...",
    "Researched and synthesized findings on...",
  ],
} as const;

