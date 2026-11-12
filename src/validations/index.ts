import { z } from "zod";
import {
  BOOKING_STATUS,
  ACADEMIC_YEARS,
  ACTIVITY_PUBLISH_STATUS,
  ACTIVITY_CATEGORY_COLOR_TOKENS,
} from "@/constants";
import { isPresetUniversity } from "@/constants/universities";

const academicYearValues = ACADEMIC_YEARS.map((item) => item.value) as [string, ...string[]];
const CURRENT_YEAR = new Date().getFullYear();

// 1. Auth Validations
// Bước 1 đăng ký: chỉ yêu cầu Email, Mật khẩu và Xác nhận mật khẩu
export const registerSchema = z
  .object({
    email: z.string().trim().toLowerCase().email("Địa chỉ email không hợp lệ"),
    password: z
      .string()
      .min(6, "Mật khẩu phải có ít nhất 6 ký tự")
      .max(128, "Mật khẩu không được vượt quá 128 ký tự"),
    confirmPassword: z.string().min(1, "Vui lòng xác nhận lại mật khẩu"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Mật khẩu xác nhận không khớp",
    path: ["confirmPassword"],
  });

// Dùng chung cho Bước 2 đăng ký & Cập nhật hồ sơ sinh viên
const fullNameSchema = z
  .string()
  .trim()
  .min(2, "Họ và tên phải có ít nhất 2 ký tự")
  .max(100, "Họ và tên tối đa 100 ký tự");

const birthYearSchema = z.coerce
  .number({ error: "Năm sinh không hợp lệ" })
  .int("Năm sinh phải là số nguyên")
  .min(1960, "Năm sinh không hợp lệ (từ 1960 trở lên)")
  .max(CURRENT_YEAR - 15, `Năm sinh tối đa ${CURRENT_YEAR - 15}`);

const academicYearSchema = z.enum(academicYearValues, {
  error: "Vui lòng chọn sinh viên năm mấy",
});

const universitySchema = z
  .string()
  .trim()
  .min(2, "Vui lòng chọn trường đại học")
  .refine((val) => isPresetUniversity(val), {
    message: "Vui lòng chọn trường đại học từ danh sách hệ thống",
  });

const majorSchema = z
  .string()
  .trim()
  .min(2, "Ngành học phải có ít nhất 2 ký tự")
  .max(120, "Ngành học tối đa 120 ký tự");

// Bước 2 đăng ký (hoặc ngay sau khi Google OAuth tạo tài khoản mới): Hoàn thiện hồ sơ bắt buộc
export const completeProfileSchema = z.object({
  fullName: fullNameSchema,
  birthYear: birthYearSchema,
  academicYear: academicYearSchema,
  university: universitySchema,
  major: majorSchema,
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Địa chỉ email không hợp lệ"),
  password: z.string().min(1, "Vui lòng nhập mật khẩu"),
  rememberMe: z.boolean().optional(),
});

export const forgotPasswordSchema = z.object({
  email: z.string().trim().toLowerCase().email("Địa chỉ email không hợp lệ"),
});

export const resetPasswordSchema = z
  .object({
    token: z.string().min(1, "Token không hợp lệ hoặc đã bị thiếu"),
    password: z
      .string()
      .min(6, "Mật khẩu mới phải có ít nhất 6 ký tự")
      .max(128, "Mật khẩu không được vượt quá 128 ký tự"),
    confirmPassword: z.string().min(1, "Vui lòng nhập xác nhận mật khẩu"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Mật khẩu xác nhận không khớp",
    path: ["confirmPassword"],
  });

// 2. Profile Validations
export const updateProfileSchema = z.object({
  fullName: fullNameSchema.optional(),
  birthYear: birthYearSchema.optional(),
  university: universitySchema.optional(),
  major: z.string().trim().max(120, "Ngành học tối đa 120 ký tự").optional(),
  academicYear: academicYearSchema.optional(),
  bio: z.string().trim().max(500, "Tiểu sử & định hướng ngắn tối đa 500 ký tự").optional(),
  skills: z.array(z.string().trim().min(1)).max(100).optional(),
  hardSkills: z.array(z.string().trim().min(1)).max(50, "Tối đa 50 kỹ năng chuyên môn").optional(),
  softSkills: z.array(z.string().trim().min(1)).max(50, "Tối đa 50 kỹ năng mềm").optional(),
  achievements: z.array(z.string().trim().min(1)).max(100, "Tối đa 100 thành tích").optional(),
});

// 3. Mentor Booking Validation
export const createBookingRequestSchema = z.object({
  mentorId: z.string().min(1, "Vui lòng chọn Mentor"),
  topic: z.string().min(5, "Vui lòng ghi rõ chủ đề cần tư vấn (tối thiểu 5 ký tự)"),
  preferredTime: z.string().min(5, "Vui lòng cung cấp khung thời gian phù hợp"),
  message: z.string().min(10, "Vui lòng giới thiệu và đặt câu hỏi cụ thể cho Mentor"),
});

export const updateBookingStatusSchema = z.object({
  status: z.enum(Object.keys(BOOKING_STATUS) as [string, ...string[]]),
  adminResponse: z.string().optional(),
});

// 4. Student Activities Validations (Module 04 + Module 00 Tiptap CMS)
const activitySlugSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(2, "Slug tối thiểu 2 ký tự")
  .max(120, "Slug tối đa 120 ký tự")
  .regex(
    /^[a-z0-9-]+$/,
    "Slug chỉ chứa chữ thường không dấu, số và dấu gạch ngang"
  );

const optionalNullableDateSchema = z.preprocess(
  (val) => {
    if (val === undefined) return undefined;
    if (val === null || val === "") return null;
    return val;
  },
  z
    .union([
      z.null(),
      z.date(),
      z.string().pipe(z.coerce.date()),
      z.number().pipe(z.coerce.date()),
    ])
    .optional()
);

const activityCategoryShape = {
  name: z
    .string()
    .trim()
    .min(2, "Tên danh mục hoạt động tối thiểu 2 ký tự")
    .max(80, "Tên danh mục tối đa 80 ký tự"),
  slug: activitySlugSchema.optional(),
  description: z.string().trim().max(500, "Mô tả tối đa 500 ký tự").optional(),
  icon: z.string().trim().max(40).optional(),
  colorToken: z
    .enum(ACTIVITY_CATEGORY_COLOR_TOKENS)
    .optional(),
  order: z.coerce.number().int().min(0).max(9999),
  isActive: z.boolean(),
};

export const adminActivityCategorySchema = z.object({
  ...activityCategoryShape,
  colorToken: activityCategoryShape.colorToken.default("blue"),
  order: activityCategoryShape.order.default(0),
  isActive: activityCategoryShape.isActive.default(true),
});

export const updateActivityCategorySchema = z
  .object(activityCategoryShape)
  .partial();

export const reorderActivityCategoriesSchema = z.object({
  orderedIds: z.array(z.string().trim().min(1)).min(1),
});

const studentActivityBaseShape = {
  title: z
    .string()
    .trim()
    .min(5, "Tiêu đề hoạt động tối thiểu 5 ký tự")
    .max(200, "Tiêu đề hoạt động tối đa 200 ký tự"),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .min(3, "Slug tối thiểu 3 ký tự")
    .max(240, "Slug tối đa 240 ký tự")
    .regex(/^[a-z0-9-]+$/, "Slug chỉ chứa chữ thường, số và dấu gạch ngang")
    .optional(),
  summary: z
    .string()
    .trim()
    .min(10, "Tóm tắt ngắn tối thiểu 10 ký tự")
    .max(500, "Tóm tắt ngắn tối đa 500 ký tự"),
  contentJson: z.record(z.string(), z.unknown(), {
    error: "Nội dung chi tiết Tiptap JSON không hợp lệ",
  }),
  coverImage: z.string().trim().max(1000).optional(),
  categoryId: z.string().trim().min(1, "Vui lòng chọn danh mục hoạt động"),
  organizer: z.string().trim().max(160, "Đơn vị tổ chức tối đa 160 ký tự").optional(),
  location: z.string().trim().max(160, "Địa điểm tối đa 160 ký tự").optional(),
  isDomestic: z.boolean(),
  eligibility: z.string().trim().max(1000).optional(),
  requirements: z.string().trim().max(1000).optional(),
  benefits: z.string().trim().max(1000).optional(),
  applicationInstructions: z.string().trim().max(1000).optional(),
  openingDate: optionalNullableDateSchema,
  deadline: optionalNullableDateSchema,
  eventDate: optionalNullableDateSchema,
  eventEndDate: optionalNullableDateSchema,
  registrationUrl: z
    .string()
    .trim()
    .max(1000)
    .refine(
      (val) => !val || /^https?:\/\//i.test(val),
      "Link đăng ký / nguồn phải bắt đầu bằng http:// hoặc https://"
    )
    .optional()
    .or(z.literal("")),
  tags: z.array(z.string().trim().min(1).max(60)).max(20),
  publishStatus: z.enum([
    ACTIVITY_PUBLISH_STATUS.DRAFT,
    ACTIVITY_PUBLISH_STATUS.PUBLISHED,
    ACTIVITY_PUBLISH_STATUS.UNPUBLISHED,
  ]),
  manualClosed: z.boolean(),
  isFeatured: z.boolean(),
};

function validateActivityDates(
  data: {
    openingDate?: Date | null;
    deadline?: Date | null;
    eventDate?: Date | null;
    eventEndDate?: Date | null;
  },
  ctx: z.RefinementCtx
) {
  if (data.openingDate && data.deadline && data.deadline < data.openingDate) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Hạn chót đăng ký phải lớn hơn hoặc bằng ngày mở đơn",
      path: ["deadline"],
    });
  }
  if (data.eventDate && data.eventEndDate && data.eventEndDate < data.eventDate) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Ngày kết thúc sự kiện phải lớn hơn hoặc bằng ngày bắt đầu",
      path: ["eventEndDate"],
    });
  }
}

export const adminStudentActivitySchema = z
  .object({
    ...studentActivityBaseShape,
    isDomestic: studentActivityBaseShape.isDomestic.default(true),
    tags: studentActivityBaseShape.tags.default([]),
    publishStatus: studentActivityBaseShape.publishStatus.default("DRAFT"),
    manualClosed: studentActivityBaseShape.manualClosed.default(false),
    isFeatured: studentActivityBaseShape.isFeatured.default(false),
  })
  .superRefine(validateActivityDates);

export const updateStudentActivitySchema = z
  .object(studentActivityBaseShape)
  .partial()
  .extend({
    version: z.coerce
      .number({
        message: "Yêu cầu cung cấp phiên bản dữ liệu (version) để tránh ghi đè xung đột",
      })
      .int()
      .min(1),
  })
  .superRefine(validateActivityDates);

export const followActivitySchema = z.object({
  notifyDeadline: z.boolean().optional(),
  notifyEvent: z.boolean().optional(),
});

// 7. Orientation Explore Validation (Module 03)
const orientationSlugSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(2, "Slug tối thiểu 2 ký tự")
  .max(120, "Slug tối đa 120 ký tự")
  .regex(
    /^[a-z0-9-]+$/,
    "Slug chỉ được chứa chữ thường không dấu, số và dấu gạch ngang"
  );

const orientationCategoryShape = {
  name: z
    .string()
    .trim()
    .min(2, "Tên danh mục tối thiểu 2 ký tự")
    .max(100, "Tên danh mục tối đa 100 ký tự"),
  slug: orientationSlugSchema.optional(),
  description: z.string().trim().max(500).optional(),
  icon: z.string().trim().max(50).optional(),
  order: z.coerce.number().int().min(0).max(9999),
  isActive: z.boolean(),
};

export const adminOrientationCategorySchema = z.object({
  ...orientationCategoryShape,
  order: orientationCategoryShape.order.default(0),
  isActive: orientationCategoryShape.isActive.default(true),
});

export const updateOrientationCategorySchema = z
  .object(orientationCategoryShape)
  .partial();

const orientationTopicShape = {
  categoryId: z.string().trim().min(1, "Vui lòng chọn danh mục cha"),
  name: z
    .string()
    .trim()
    .min(2, "Tên chủ đề tối thiểu 2 ký tự")
    .max(100, "Tên chủ đề tối đa 100 ký tự"),
  slug: orientationSlugSchema.optional(),
  description: z.string().trim().max(500).optional(),
  order: z.coerce.number().int().min(0).max(9999),
  isActive: z.boolean(),
};

export const adminOrientationTopicSchema = z.object({
  ...orientationTopicShape,
  order: orientationTopicShape.order.default(0),
  isActive: orientationTopicShape.isActive.default(true),
});

export const updateOrientationTopicSchema = z
  .object(orientationTopicShape)
  .partial();

export const reorderOrientationTaxonomySchema = z.object({
  kind: z.enum(["category", "topic"]),
  orderedIds: z.array(z.string().trim().min(1)).min(1),
});

const orientationArticleShape = {
  title: z
    .string()
    .trim()
    .min(5, "Tiêu đề tối thiểu 5 ký tự")
    .max(200, "Tiêu đề tối đa 200 ký tự"),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .min(3, "Slug tối thiểu 3 ký tự")
    .max(240, "Slug tối đa 240 ký tự")
    .regex(
      /^[a-z0-9-]+$/,
      "Slug chỉ chứa chữ thường, số và dấu gạch ngang"
    )
    .optional(),
  summary: z
    .string()
    .trim()
    .min(10, "Tóm tắt tối thiểu 10 ký tự")
    .max(500, "Tóm tắt tối đa 500 ký tự"),
  contentJson: z.record(z.string(), z.unknown(), {
    error: "Nội dung bài viết Tiptap JSON không hợp lệ",
  }),
  coverImage: z.string().trim().max(1000).optional(),
  categoryId: z.string().trim().min(1, "Vui lòng chọn danh mục"),
  topicIds: z.array(z.string().trim()),
  tags: z.array(z.string().trim().min(1).max(60)).max(20),
  status: z.enum(["DRAFT", "PUBLISHED", "UNPUBLISHED"]),
  isFeatured: z.boolean(),
  readTimeMinutes: z.coerce.number().int().min(1).max(120).optional(),
  authorName: z.string().trim().min(2).max(120).optional(),
};

export const adminOrientationArticleSchema = z.object({
  ...orientationArticleShape,
  topicIds: orientationArticleShape.topicIds.default([]),
  tags: orientationArticleShape.tags.default([]),
  status: orientationArticleShape.status.default("DRAFT"),
  isFeatured: orientationArticleShape.isFeatured.default(false),
});

export const updateOrientationArticleSchema = z
  .object(orientationArticleShape)
  .partial();

export const createArticleCommentSchema = z.object({
  content: z
    .string()
    .trim()
    .min(1, "Vui lòng nhập nội dung bình luận")
    .max(1000, "Bình luận tối đa 1000 ký tự"),
  parentCommentId: z.string().trim().nullable().optional(),
});

export const updateArticleCommentSchema = z.object({
  content: z
    .string()
    .trim()
    .min(1, "Vui lòng nhập nội dung bình luận")
    .max(1000, "Bình luận tối đa 1000 ký tự"),
});

// ==============================================================================
// News & Editorial Hub Validations (Module 05 - NEWS01..NEWS22)
// ==============================================================================

const newsSlugSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(2, "Slug tối thiểu 2 ký tự")
  .max(240, "Slug tối đa 240 ký tự")
  .regex(/^[a-z0-9-]+$/, "Slug chỉ chứa chữ thường, số và dấu gạch ngang");

const newsCategoryColorEnum = z.enum([
  "blue",
  "emerald",
  "purple",
  "amber",
  "rose",
  "cyan",
  "indigo",
  "teal",
]);

const newsCategoryShape = {
  name: z
    .string()
    .trim()
    .min(2, "Tên danh mục tối thiểu 2 ký tự")
    .max(80, "Tên danh mục tối đa 80 ký tự"),
  slug: newsSlugSchema.optional(),
  description: z.string().trim().max(400).optional(),
  colorToken: newsCategoryColorEnum.optional(),
  order: z.coerce.number().int().min(0).max(9999),
  isActive: z.boolean(),
  showInSidebar: z.boolean(),
};

export const adminNewsCategorySchema = z.object({
  ...newsCategoryShape,
  colorToken: newsCategoryColorEnum.default("blue"),
  order: newsCategoryShape.order.default(0),
  isActive: newsCategoryShape.isActive.default(true),
  showInSidebar: newsCategoryShape.showInSidebar.default(true),
});

export const updateNewsCategorySchema = z.object(newsCategoryShape).partial();

export const reorderNewsCategoriesSchema = z.object({
  orderedIds: z.array(z.string().trim().min(1)).min(1),
});

const newsTagShape = {
  name: z
    .string()
    .trim()
    .min(1, "Tên tag tối thiểu 1 ký tự")
    .max(60, "Tên tag tối đa 60 ký tự"),
  slug: newsSlugSchema.optional(),
  isActive: z.boolean(),
};

export const adminNewsTagSchema = z.object({
  ...newsTagShape,
  isActive: newsTagShape.isActive.default(true),
});

export const updateNewsTagSchema = z
  .object({
    ...newsTagShape,
    mergeTargetId: z.string().trim().optional(),
  })
  .partial();

const optionalNewsUrl = z
  .union([
    z
      .string()
      .trim()
      .max(1000)
      .refine(
        (v) => v === "" || /^https?:\/\//i.test(v),
        "URL nguồn trích dẫn phải bắt đầu bằng http:// hoặc https://"
      ),
    z.literal(""),
  ])
  .optional();

const newsArticleShape = {
  title: z
    .string()
    .trim()
    .min(5, "Tiêu đề tối thiểu 5 ký tự")
    .max(220, "Tiêu đề tối đa 220 ký tự"),
  slug: newsSlugSchema.optional(),
  summary: z
    .string()
    .trim()
    .min(10, "Tóm tắt tối thiểu 10 ký tự")
    .max(600, "Tóm tắt tối đa 600 ký tự"),
  contentJson: z.record(z.string(), z.unknown(), {
    error: "Nội dung bài viết Tiptap JSON không hợp lệ",
  }),
  coverImage: z.string().trim().max(1000).optional(),
  categoryId: z.string().trim().min(1, "Vui lòng chọn danh mục tin tức"),
  tags: z.array(z.string().trim().min(1).max(60)).max(20),
  authorName: z.string().trim().min(2).max(120).optional(),
  readTimeMinutes: z.coerce.number().int().min(1).max(120).optional(),
  status: z.enum(["DRAFT", "SCHEDULED", "PUBLISHED", "UNPUBLISHED"]),
  scheduledAt: optionalNullableDateSchema,
  isFeatured: z.boolean(),
  isSponsored: z.boolean(),
  sponsorInfo: z.string().trim().max(300).optional(),
  sourceName: z.string().trim().max(150).optional(),
  sourceUrl: optionalNewsUrl,
};

export const adminNewsArticleSchema = z
  .object({
    ...newsArticleShape,
    tags: newsArticleShape.tags.default([]),
    status: newsArticleShape.status.default("DRAFT"),
    isFeatured: newsArticleShape.isFeatured.default(false),
    isSponsored: newsArticleShape.isSponsored.default(false),
  })
  .superRefine((data, ctx) => {
    if (data.status === "SCHEDULED") {
      if (!data.scheduledAt) {
        ctx.addIssue({
          code: "custom",
          message: "Vui lòng chọn thời gian hẹn xuất bản cho bài viết lên lịch",
          path: ["scheduledAt"],
        });
      } else if (data.scheduledAt.getTime() <= Date.now()) {
        ctx.addIssue({
          code: "custom",
          message: "Thời gian hẹn xuất bản phải ở tương lai",
          path: ["scheduledAt"],
        });
      }
    }
  });

export const updateNewsArticleSchema = z
  .object(newsArticleShape)
  .partial()
  .extend({
    version: z.coerce
      .number()
      .int()
      .min(1, "Thiếu thông tin phiên bản (version) để đồng bộ cập nhật"),
  })
  .superRefine((data, ctx) => {
    if (data.status === "SCHEDULED" && data.scheduledAt !== undefined) {
      if (!data.scheduledAt) {
        ctx.addIssue({
          code: "custom",
          message: "Vui lòng chọn thời gian hẹn xuất bản cho bài viết lên lịch",
          path: ["scheduledAt"],
        });
      } else if (data.scheduledAt.getTime() <= Date.now()) {
        ctx.addIssue({
          code: "custom",
          message: "Thời gian hẹn xuất bản phải ở tương lai",
          path: ["scheduledAt"],
        });
      }
    }
  });

// ==============================================================================
// Notifications & Reminder Settings Validations (Module 06 - OP09..OP14)
// ==============================================================================

export const updateNotificationReadSchema = z.object({
  isRead: z.boolean({
    error: "Trạng thái đọc (isRead) phải là boolean",
  }),
});

export const reminderSettingSchema = z.object({
  enableReminders: z.boolean(),
  enableDeadlineReminder: z.boolean(),
  enableEventReminder: z.boolean(),
  offsetsDays: z
    .array(
      z
        .number()
        .int()
        .refine(
          (val) => val === 30 || val === 7 || val === 1,
          "Mốc nhắc chỉ hỗ trợ 30 ngày, 7 ngày hoặc 1 ngày"
        )
    )
    .max(3)
    .transform((arr) =>
      Array.from(new Set(arr)).sort((a, b) => b - a)
    ),
  channels: z.object({
    inApp: z.boolean(),
    email: z.boolean(),
  }),
});

// ==============================================================================
// Student Tools Validations (Module 07 - MBTI & MI History)
// ==============================================================================

export const createToolResultSchema = z.object({
  toolType: z.enum(["MBTI", "MI"], {
    error: "Loại công cụ chỉ hỗ trợ MBTI hoặc MI",
  }),
  answers: z.record(
    z.string(),
    z.union([z.string(), z.number()]),
    {
      error: "Dữ liệu câu trả lời không hợp lệ",
    }
  ),
});




