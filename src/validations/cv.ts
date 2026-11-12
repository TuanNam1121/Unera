import { z } from "zod";
import {
  CV_ALL_SECTION_KEYS,
  DEFAULT_CV_TEMPLATE_ID,
} from "@/constants/cv";
import { isSafeMediaUrl } from "@/lib/orientation-utils";

const CURRENT_YEAR = new Date().getFullYear();

export const cvSafeWebUrlSchema = z
  .string()
  .trim()
  .max(400, "Đường dẫn tối đa 400 ký tự")
  .refine(
    (val) => {
      if (!val) return true;
      return (
        val.startsWith("https://") ||
        val.startsWith("http://")
      );
    },
    { message: "Liên kết phải bắt đầu bằng http:// hoặc https://" }
  );

export const cvAvatarUrlSchema = z
  .string()
  .trim()
  .max(500)
  .refine((val) => isSafeMediaUrl(val), {
    message: "URL ảnh đại diện không hợp lệ",
  });

export const cvDateValueSchema = z
  .string()
  .trim()
  .regex(/^(\d{4}-\d{2}(-\d{2})?)?$/, "Định dạng ngày không hợp lệ (YYYY-MM)")
  .nullable()
  .optional();

function validateDateRange(
  data: { startDate?: string | null; endDate?: string | null; isCurrent?: boolean },
  ctx: z.RefinementCtx
) {
  if (data.isCurrent || !data.startDate || !data.endDate) return;
  const start = data.startDate.slice(0, 7);
  const end = data.endDate.slice(0, 7);
  if (end < start) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Thời gian kết thúc phải lớn hơn hoặc bằng thời gian bắt đầu",
      path: ["endDate"],
    });
  }
}

export const cvSectionKeySchema = z.enum(
  CV_ALL_SECTION_KEYS as [string, ...string[]] as [
    "summary",
    "education",
    "experience",
    "skills",
    "projects",
    "achievements",
    "activities",
    "certifications",
    "custom",
  ]
);

export const cvPersonalInfoSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, "Vui lòng nhập họ tên (ít nhất 2 ký tự)")
    .max(100, "Họ tên tối đa 100 ký tự"),
  jobTitle: z.string().trim().max(120).optional().default(""),
  email: z
    .string()
    .trim()
    .email("Email không hợp lệ")
    .or(z.literal(""))
    .optional()
    .default(""),
  phone: z.string().trim().max(30).optional().default(""),
  location: z.string().trim().max(150).optional().default(""),
  website: cvSafeWebUrlSchema.optional().default(""),
  linkedin: cvSafeWebUrlSchema.optional().default(""),
  github: cvSafeWebUrlSchema.optional().default(""),
  portfolio: cvSafeWebUrlSchema.optional().default(""),
  avatarUrl: cvAvatarUrlSchema.optional().default(""),
  dateOfBirth: z.string().trim().max(30).optional().default(""),
});

export const cvEducationItemSchema = z
  .object({
    id: z.string().min(1),
    school: z
      .string()
      .trim()
      .min(1, "Vui lòng nhập tên trường")
      .max(160),
    degree: z.string().trim().max(100).optional().default(""),
    major: z.string().trim().max(140).optional().default(""),
    gpa: z.string().trim().max(40).optional().default(""),
    startDate: cvDateValueSchema.default(null),
    endDate: cvDateValueSchema.default(null),
    isCurrent: z.boolean().default(false),
    description: z.string().trim().max(800).optional().default(""),
  })
  .superRefine(validateDateRange);

export const cvExperienceItemSchema = z
  .object({
    id: z.string().min(1),
    position: z
      .string()
      .trim()
      .min(1, "Vui lòng nhập chức danh / vị trí")
      .max(140),
    company: z
      .string()
      .trim()
      .min(1, "Vui lòng nhập tên công ty / tổ chức")
      .max(140),
    location: z.string().trim().max(120).optional().default(""),
    startDate: cvDateValueSchema.default(null),
    endDate: cvDateValueSchema.default(null),
    isCurrent: z.boolean().default(false),
    highlights: z.array(z.string().trim().max(500)).max(15).default([]),
  })
  .superRefine(validateDateRange);

export const cvSkillItemSchema = z.object({
  id: z.string().min(1),
  name: z.string().trim().min(1, "Tên kỹ năng không được trống").max(100),
  level: z.enum(["basic", "intermediate", "advanced", "expert"]).optional(),
});

export const cvSkillGroupSchema = z.object({
  id: z.string().min(1),
  groupName: z
    .string()
    .trim()
    .min(1, "Tên nhóm kỹ năng không được trống")
    .max(80),
  items: z.array(cvSkillItemSchema).max(60).default([]),
});

export const cvProjectItemSchema = z
  .object({
    id: z.string().min(1),
    name: z.string().trim().min(1, "Vui lòng nhập tên dự án").max(160),
    role: z.string().trim().max(100).optional().default(""),
    link: cvSafeWebUrlSchema.optional().default(""),
    technologies: z.string().trim().max(240).optional().default(""),
    startDate: cvDateValueSchema.default(null),
    endDate: cvDateValueSchema.default(null),
    isCurrent: z.boolean().default(false),
    highlights: z.array(z.string().trim().max(500)).max(15).default([]),
  })
  .superRefine(validateDateRange);

export const cvAchievementYearSchema = z
  .number()
  .int("Năm phải là số nguyên")
  .min(1980, "Năm hợp lệ từ 1980 trở đi")
  .max(CURRENT_YEAR + 1, `Năm tối đa ${CURRENT_YEAR + 1}`)
  .nullable()
  .optional();

export const cvAchievementItemSchema = z.object({
  id: z.string().min(1),
  title: z
    .string()
    .trim()
    .min(1, "Vui lòng nhập tên thành tích / giải thưởng")
    .max(200),
  year: cvAchievementYearSchema.default(null),
  issuer: z.string().trim().max(150).optional().default(""),
  description: z.string().trim().max(500).optional().default(""),
});

export const cvActivityItemSchema = z
  .object({
    id: z.string().min(1),
    name: z
      .string()
      .trim()
      .min(1, "Vui lòng nhập tên hoạt động / CLB")
      .max(160),
    organization: z.string().trim().max(150).optional().default(""),
    role: z.string().trim().max(120).optional().default(""),
    startDate: cvDateValueSchema.default(null),
    endDate: cvDateValueSchema.default(null),
    isCurrent: z.boolean().default(false),
    description: z.string().trim().max(600).optional().default(""),
  })
  .superRefine(validateDateRange);

export const cvCertificationItemSchema = z.object({
  id: z.string().min(1),
  name: z
    .string()
    .trim()
    .min(1, "Vui lòng nhập tên chứng chỉ / ngoại ngữ")
    .max(160),
  issuer: z.string().trim().max(150).optional().default(""),
  issueDate: cvDateValueSchema.default(null),
  credentialUrl: cvSafeWebUrlSchema.optional().default(""),
  scoreOrLevel: z.string().trim().max(80).optional().default(""),
});

export const cvCustomSectionItemSchema = z.object({
  id: z.string().min(1),
  title: z.string().trim().min(1, "Vui lòng nhập tiêu đề mục").max(160),
  subtitle: z.string().trim().max(150).optional().default(""),
  dateText: z.string().trim().max(80).optional().default(""),
  description: z.string().trim().max(600).optional().default(""),
});

export const cvCustomSectionSchema = z.object({
  id: z.string().min(1),
  sectionTitle: z
    .string()
    .trim()
    .min(1, "Vui lòng nhập tiêu đề nhóm mục")
    .max(100),
  items: z.array(cvCustomSectionItemSchema).max(30).default([]),
});

export const cvStyleConfigSchema = z.object({
  accentColor: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, "Mã màu hex không hợp lệ (VD: #1e3a8a)"),
  fontFamily: z.enum(["Inter", "Roboto", "TimesNewRoman"]),
  fontSizeScale: z.enum(["sm", "md", "lg"]),
  lineHeight: z.number().min(1.2).max(1.9),
  pagePadding: z.enum(["compact", "normal", "relaxed"]),
  showAvatar: z.boolean(),
  headerAlign: z.enum(["left", "center"]),
});

export const cvContentFormSchema = z.object({
  personalInfo: cvPersonalInfoSchema,
  summary: z.string().trim().max(1500, "Mục tiêu tối đa 1500 ký tự").default(""),
  education: z.array(cvEducationItemSchema).max(20).default([]),
  experience: z.array(cvExperienceItemSchema).max(25).default([]),
  skills: z.array(cvSkillGroupSchema).max(20).default([]),
  projects: z.array(cvProjectItemSchema).max(25).default([]),
  achievements: z.array(cvAchievementItemSchema).max(40).default([]),
  activities: z.array(cvActivityItemSchema).max(30).default([]),
  certifications: z.array(cvCertificationItemSchema).max(30).default([]),
  customSections: z.array(cvCustomSectionSchema).max(10).default([]),
});

export type CvContentFormValues = z.infer<typeof cvContentFormSchema>;

export const createCvSchema = z.object({
  title: z
    .string()
    .trim()
    .min(2, "Tên CV phải có ít nhất 2 ký tự")
    .max(120, "Tên CV tối đa 120 ký tự"),
  targetRole: z
    .string()
    .trim()
    .max(120, "Vị trí mục tiêu tối đa 120 ký tự")
    .optional()
    .default(""),
  templateId: z.string().trim().min(1).max(80).default(DEFAULT_CV_TEMPLATE_ID),
  locale: z.enum(["vi", "en"]).default("vi"),
  prefillFromProfile: z.boolean().default(true),
  achievementYearsOverride: z
    .record(z.string(), cvAchievementYearSchema)
    .optional(),
});

export const updateCvSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(2, "Tên CV phải có ít nhất 2 ký tự")
      .max(120, "Tên CV tối đa 120 ký tự")
      .optional(),
    targetRole: z.string().trim().max(120).optional(),
    templateId: z.string().trim().min(1).max(80).optional(),
    locale: z.enum(["vi", "en"]).optional(),
    styleConfig: cvStyleConfigSchema.optional(),
    sectionOrder: z.array(cvSectionKeySchema).min(1).max(15).optional(),
    hiddenSections: z.array(cvSectionKeySchema).max(15).optional(),
    expectedVersion: z.number().int().min(1).optional(),
  })
  .merge(cvContentFormSchema.partial());

export const updateCvSharingSchema = z.object({
  isPublic: z.boolean().optional(),
  allowPdfDownload: z.boolean().optional(),
  regenerateSlug: z.boolean().optional(),
});

export function extractYearFromText(text: string): number | null {
  const matches = text.match(/\b(19\d{2}|20\d{2})\b/g);
  if (!matches || matches.length === 0) return null;
  const parsed = Number(matches[matches.length - 1]);
  if (Number.isNaN(parsed) || parsed < 1980 || parsed > CURRENT_YEAR + 1) {
    return null;
  }
  return parsed;
}

