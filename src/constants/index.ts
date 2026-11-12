/**
 * UNERA System Constants
 * Căn cứ theo SRS 1.0 và PROJECT_CONTEXT.md
 */

// Vai trò người dùng trong hệ thống
export const USER_ROLES = {
  STUDENT: "STUDENT",
  ADMIN: "ADMIN",
} as const;

export type UserRole = (typeof USER_ROLES)[keyof typeof USER_ROLES];

// Trạng thái tài khoản người dùng
export const ACCOUNT_STATUS = {
  ACTIVE: "ACTIVE",
  DISABLED: "DISABLED",
} as const;

export type AccountStatus = (typeof ACCOUNT_STATUS)[keyof typeof ACCOUNT_STATUS];

// Phương thức xác thực tài khoản
export const AUTH_PROVIDERS = {
  CREDENTIALS: "CREDENTIALS",
  GOOGLE: "GOOGLE",
} as const;

export type AuthProvider = (typeof AUTH_PROVIDERS)[keyof typeof AUTH_PROVIDERS];

// Trạng thái luồng onboarding sau đăng ký
export const ONBOARDING_STEPS = {
  PROFILE: "PROFILE",
  QUIZ: "QUIZ",
  COMPLETED: "COMPLETED",
} as const;

export type OnboardingStep = (typeof ONBOARDING_STEPS)[keyof typeof ONBOARDING_STEPS];

// Tên HttpOnly cookies cho Dual-Token JWT Auth
export const AUTH_COOKIE_NAMES = {
  ACCESS_TOKEN: "unera_access_token",
  REFRESH_TOKEN: "unera_refresh_token",
  OAUTH_STATE: "unera_oauth_state",
} as const;

// Trạng thái yêu cầu đặt lịch Mentor (Booking Request Status theo FR-MEN-07)
export const BOOKING_STATUS = {
  PENDING: { id: "PENDING", label: "Chờ xử lý" },
  APPROVED: { id: "APPROVED", label: "Đã duyệt & Xác nhận" },
  REJECTED: { id: "REJECTED", label: "Từ chối" },
  CANCELLED: { id: "CANCELLED", label: "Đã hủy" },
  COMPLETED: { id: "COMPLETED", label: "Đã hoàn thành" },
} as const;

export type BookingStatusId = keyof typeof BOOKING_STATUS;

// Trạng thái xuất bản Hoạt động sinh viên (Module 04)
export const ACTIVITY_PUBLISH_STATUS = {
  DRAFT: "DRAFT",
  PUBLISHED: "PUBLISHED",
  UNPUBLISHED: "UNPUBLISHED",
} as const;

export type ActivityPublishStatus =
  (typeof ACTIVITY_PUBLISH_STATUS)[keyof typeof ACTIVITY_PUBLISH_STATUS];

// Trạng thái động tính theo thời gian thực cho Hoạt động sinh viên (SA08)
export const ACTIVITY_COMPUTED_STATUS = {
  OPEN: "OPEN",
  CLOSING_SOON: "CLOSING_SOON",
  EVENT_SOON: "EVENT_SOON",
  UPCOMING_OPEN: "UPCOMING_OPEN",
  CLOSED: "CLOSED",
  EXPIRED: "EXPIRED",
} as const;

export type ActivityComputedStatus =
  (typeof ACTIVITY_COMPUTED_STATUS)[keyof typeof ACTIVITY_COMPUTED_STATUS];

export const ACTIVITY_CATEGORY_COLOR_TOKENS = [
  "blue",
  "emerald",
  "purple",
  "amber",
  "rose",
  "cyan",
  "indigo",
  "teal",
] as const;

export type ActivityCategoryColorToken =
  (typeof ACTIVITY_CATEGORY_COLOR_TOKENS)[number];

// Giới hạn tệp tin tải lên (File Upload Constraints theo SRS)
export const FILE_UPLOAD_CONFIG = {
  MAX_SIZE_BYTES: 10 * 1024 * 1024, // 10MB
  MAX_SIZE_MB: 10,
  ALLOWED_EXTENSIONS: ["pdf", "doc", "docx", "jpg", "jpeg", "png"],
  ALLOWED_MIME_TYPES: [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "image/jpeg",
    "image/png",
  ],
} as const;

// Khoảng thời gian nhắc hẹn hạn chót / sự kiện (Module 04 & Module 06)
export const DEADLINE_REMINDER_OFFSETS_DAYS = [30, 7, 3, 1] as const;
export const ACTIVITY_REMINDER_OFFSETS_DAYS = [30, 7, 1] as const;
export const REMINDER_OFFSETS_DAYS = ACTIVITY_REMINDER_OFFSETS_DAYS;

// Thông báo & Nhắc nhở tự động (Module 06 - OP09..OP14)
export const NOTIFICATION_TYPES = {
  DEADLINE_REMINDER: "DEADLINE_REMINDER",
  EVENT_REMINDER: "EVENT_REMINDER",
  BOOKING_UPDATE: "BOOKING_UPDATE",
  ROADMAP_UPDATE: "ROADMAP_UPDATE",
  AI_ANALYSIS_READY: "AI_ANALYSIS_READY",
  SYSTEM_ANNOUNCEMENT: "SYSTEM_ANNOUNCEMENT",
} as const;

export type NotificationTypeConst =
  (typeof NOTIFICATION_TYPES)[keyof typeof NOTIFICATION_TYPES];

export const REMINDER_TYPES = {
  DEADLINE: "DEADLINE",
  EVENT: "EVENT",
} as const;

export type ReminderTypeConst =
  (typeof REMINDER_TYPES)[keyof typeof REMINDER_TYPES];

export const NOTIFICATION_CHANNELS = {
  IN_APP: "IN_APP",
  EMAIL: "EMAIL",
} as const;

export const DEFAULT_REMINDER_SETTING = {
  enableReminders: true,
  enableDeadlineReminder: true,
  enableEventReminder: true,
  offsetsDays: [30, 7, 1] as number[],
  channels: {
    inApp: true,
    email: true,
  },
} as const;

// Năm học của sinh viên
export const ACADEMIC_YEARS = [
  { value: "YEAR_1", label: "Năm nhất" },
  { value: "YEAR_2", label: "Năm hai" },
  { value: "YEAR_3", label: "Năm ba" },
  { value: "YEAR_4", label: "Năm tư" },
  { value: "YEAR_5_PLUS", label: "Năm 5 trở lên / Tốt nghiệp" },
] as const;

// Trạng thái bài viết Khám phá định hướng (Module 03)
export const ORIENTATION_ARTICLE_STATUS = {
  DRAFT: "DRAFT",
  PUBLISHED: "PUBLISHED",
  UNPUBLISHED: "UNPUBLISHED",
} as const;

export type OrientationArticleStatus =
  (typeof ORIENTATION_ARTICLE_STATUS)[keyof typeof ORIENTATION_ARTICLE_STATUS];

// Trạng thái & Bộ lọc Tin tức (Module 05 - NEWS01..NEWS22)
export const NEWS_ARTICLE_STATUS = {
  DRAFT: "DRAFT",
  SCHEDULED: "SCHEDULED",
  PUBLISHED: "PUBLISHED",
  UNPUBLISHED: "UNPUBLISHED",
} as const;

export type NewsArticleStatus =
  (typeof NEWS_ARTICLE_STATUS)[keyof typeof NEWS_ARTICLE_STATUS];

export const NEWS_DATE_RANGES = {
  ALL: "all",
  TODAY: "today",
  LAST_7_DAYS: "7d",
  LAST_30_DAYS: "30d",
  LAST_90_DAYS: "90d",
} as const;

export type NewsDateRange =
  (typeof NEWS_DATE_RANGES)[keyof typeof NEWS_DATE_RANGES];

export const NEWS_SORT_OPTIONS = {
  LATEST: "latest",
  POPULAR: "popular",
} as const;

export type NewsSortOption =
  (typeof NEWS_SORT_OPTIONS)[keyof typeof NEWS_SORT_OPTIONS];

export const NEWS_CATEGORY_COLOR_TOKENS = [
  "blue",
  "emerald",
  "purple",
  "amber",
  "rose",
  "cyan",
  "indigo",
  "teal",
] as const;

export type NewsCategoryColorToken =
  (typeof NEWS_CATEGORY_COLOR_TOKENS)[number];

// ==============================================================================
// Content & Media Management (Module 00 - Base Layer)
// ==============================================================================

export const MEDIA_KINDS = {
  IMAGE: "IMAGE",
  AUDIO: "AUDIO",
} as const;

export type MediaKind = (typeof MEDIA_KINDS)[keyof typeof MEDIA_KINDS];

export const MEDIA_ASSET_STATUS = {
  TEMP: "TEMP",
  ATTACHED: "ATTACHED",
  ORPHANED: "ORPHANED",
} as const;

export type MediaAssetStatus =
  (typeof MEDIA_ASSET_STATUS)[keyof typeof MEDIA_ASSET_STATUS];

export const CONTENT_MODULES = {
  ORIENTATION: "orientation",
  ACTIVITIES: "activities",
  NEWS: "news",
  GENERAL: "general",
} as const;

export type ContentModule =
  (typeof CONTENT_MODULES)[keyof typeof CONTENT_MODULES];

export const CONTENT_TARGET_COLLECTIONS = {
  ORIENTATION_ARTICLES: "orientation_articles",
  STUDENT_ACTIVITIES: "student_activities",
  NEWS_ARTICLES: "news_articles",
} as const;

export type ContentTargetCollection =
  (typeof CONTENT_TARGET_COLLECTIONS)[keyof typeof CONTENT_TARGET_COLLECTIONS];

export const MAX_IMAGE_UPLOAD_BYTES = 5 * 1024 * 1024; // 5 MB
export const MAX_AUDIO_UPLOAD_BYTES = 15 * 1024 * 1024; // 15 MB

export const ALLOWED_IMAGE_MIMES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
] as const;

export const ALLOWED_AUDIO_MIMES = [
  "audio/mpeg",
  "audio/wav",
  "audio/x-wav",
  "audio/mp4",
  "audio/x-m4a",
  "audio/ogg",
] as const;

export const DEFAULT_ALLOWED_AUDIO_HOSTS = ["res.cloudinary.com"] as const;

export const YOUTUBE_ALLOWED_HOSTS = [
  "youtube.com",
  "www.youtube.com",
  "m.youtube.com",
  "youtu.be",
  "www.youtu.be",
  "youtube-nocookie.com",
  "www.youtube-nocookie.com",
] as const;

export const TIPTAP_MAX_TREE_DEPTH = 20;

export const TIPTAP_ALLOWED_NODE_TYPES = [
  "doc",
  "paragraph",
  "text",
  "heading",
  "bulletList",
  "orderedList",
  "listItem",
  "blockquote",
  "codeBlock",
  "hardBreak",
  "horizontalRule",
  "table",
  "tableRow",
  "tableHeader",
  "tableCell",
  "image",
  "audioBlock",
  "youtubeEmbed",
  "calloutBlock",
] as const;

export const TIPTAP_ALLOWED_MARK_TYPES = [
  "bold",
  "italic",
  "underline",
  "strike",
  "code",
  "highlight",
  "link",
  "textStyle",
] as const;

// ==============================================================================
// Student Tools (Module 07 - MBTI, MI, Gross-Net, PIT Tax)
// ==============================================================================

export const TOOL_TYPES = {
  MBTI: "MBTI",
  MI: "MI",
} as const;

export type ToolType = (typeof TOOL_TYPES)[keyof typeof TOOL_TYPES];

// ==============================================================================
// Personal Orientation Assessment, Gemini AI & 4-Year Roadmap (Module 08)
// ==============================================================================

export const ASSESSMENT_QUESTION_TYPES = {
  SINGLE_CHOICE: "SINGLE_CHOICE",
  MULTIPLE_CHOICE: "MULTIPLE_CHOICE",
  SCALE: "SCALE",
  TEXT: "TEXT",
} as const;

export type AssessmentQuestionType =
  (typeof ASSESSMENT_QUESTION_TYPES)[keyof typeof ASSESSMENT_QUESTION_TYPES];

export const CONDITION_MATCH_TYPES = {
  ALL: "ALL",
  ANY: "ANY",
} as const;

export type ConditionMatchType =
  (typeof CONDITION_MATCH_TYPES)[keyof typeof CONDITION_MATCH_TYPES];

export const CONDITION_OPERATORS = {
  EQUALS: "EQUALS",
  NOT_EQUALS: "NOT_EQUALS",
  CONTAINS: "CONTAINS",
  GREATER_THAN: "GREATER_THAN",
  LESS_THAN: "LESS_THAN",
} as const;

export type ConditionOperator =
  (typeof CONDITION_OPERATORS)[keyof typeof CONDITION_OPERATORS];

export const ASSESSMENT_SUBMISSION_STATUS = {
  IN_PROGRESS: "IN_PROGRESS",
  SUBMITTED: "SUBMITTED",
} as const;

export type AssessmentSubmissionStatus =
  (typeof ASSESSMENT_SUBMISSION_STATUS)[keyof typeof ASSESSMENT_SUBMISSION_STATUS];

export const SYSTEM_PROMPT_KEYS = {
  ORIENTATION_ANALYSIS: "ORIENTATION_ANALYSIS",
  ROADMAP_GENERATION: "ROADMAP_GENERATION",
} as const;

export type SystemPromptKey =
  (typeof SYSTEM_PROMPT_KEYS)[keyof typeof SYSTEM_PROMPT_KEYS];

export const GEMINI_MODELS = [
  "gemini-3.1-flash-lite",
  "gemini-3.5-flash-lite",
] as const;

export type GeminiModel = (typeof GEMINI_MODELS)[number];

export const DEFAULT_GEMINI_MODEL: GeminiModel = GEMINI_MODELS[0];

export const GEMINI_FALLBACK_MODELS: readonly GeminiModel[] = [
  "gemini-3.1-flash-lite",
  "gemini-3.5-flash-lite",
] as const;

export function resolveAllowedGeminiModel(model?: string | null): GeminiModel {
  const trimmed = model?.trim();
  if (trimmed && (GEMINI_MODELS as readonly string[]).includes(trimmed)) {
    return trimmed as GeminiModel;
  }
  return DEFAULT_GEMINI_MODEL;
}

export const AI_ANALYSIS_STATUS = {
  PROCESSING: "PROCESSING",
  COMPLETED: "COMPLETED",
  FAILED: "FAILED",
} as const;

export type AiAnalysisStatus =
  (typeof AI_ANALYSIS_STATUS)[keyof typeof AI_ANALYSIS_STATUS];

export const ORIENTATION_DIRECTION_CODES = {
  CAREER_INDUSTRY: "CAREER_INDUSTRY",
  STUDY_ABROAD: "STUDY_ABROAD",
  RESEARCH: "RESEARCH",
  STARTUP: "STARTUP",
  POSTGRAD: "POSTGRAD",
} as const;

export type OrientationDirectionCode =
  (typeof ORIENTATION_DIRECTION_CODES)[keyof typeof ORIENTATION_DIRECTION_CODES];

export const ROADMAP_STATUS = {
  ACTIVE: "ACTIVE",
  ARCHIVED: "ARCHIVED",
} as const;

export type RoadmapStatus =
  (typeof ROADMAP_STATUS)[keyof typeof ROADMAP_STATUS];

export const ROADMAP_SOURCE = {
  AI_GENERATED: "AI_GENERATED",
  RESTORED_FROM_HISTORY: "RESTORED_FROM_HISTORY",
} as const;

export type RoadmapSource =
  (typeof ROADMAP_SOURCE)[keyof typeof ROADMAP_SOURCE];

export const ROADMAP_GOAL_CATEGORIES = {
  ACADEMIC: "ACADEMIC",
  SKILL: "SKILL",
  CERTIFICATE: "CERTIFICATE",
  EXPERIENCE: "EXPERIENCE",
  CAREER: "CAREER",
} as const;

export type RoadmapGoalCategory =
  (typeof ROADMAP_GOAL_CATEGORIES)[keyof typeof ROADMAP_GOAL_CATEGORIES];

export const ROADMAP_GOAL_PRIORITIES = {
  HIGH: "HIGH",
  MEDIUM: "MEDIUM",
  LOW: "LOW",
} as const;

export type RoadmapGoalPriority =
  (typeof ROADMAP_GOAL_PRIORITIES)[keyof typeof ROADMAP_GOAL_PRIORITIES];

export const ROADMAP_GOAL_STATUSES = {
  NOT_STARTED: "NOT_STARTED",
  IN_PROGRESS: "IN_PROGRESS",
  COMPLETED: "COMPLETED",
  SKIPPED: "SKIPPED",
} as const;

export type RoadmapGoalStatus =
  (typeof ROADMAP_GOAL_STATUSES)[keyof typeof ROADMAP_GOAL_STATUSES];

