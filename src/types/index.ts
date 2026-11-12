import {
  UserRole,
  AccountStatus,
  AuthProvider,
  OnboardingStep,
  ActivityPublishStatus,
  ActivityComputedStatus,
  ActivityCategoryColorToken,
  BookingStatusId,
  ToolType,
  AssessmentQuestionType,
  ConditionMatchType,
  ConditionOperator,
  AssessmentSubmissionStatus,
  SystemPromptKey,
  AiAnalysisStatus,
  OrientationDirectionCode,
  RoadmapStatus,
  RoadmapSource,
  RoadmapGoalCategory,
  RoadmapGoalPriority,
  RoadmapGoalStatus,
} from "@/constants";

// ==============================================================================
// 1. User & Profile
// ==============================================================================

export interface IUser {
  _id: string;
  name: string;
  email: string;
  password?: string;
  role: UserRole;
  avatar?: string;
  status: AccountStatus;
  authProviders?: AuthProvider[];
  googleId?: string;
  isProfileCompleted?: boolean;
  onboardingStep?: OnboardingStep;
  lastLoginAt?: Date | null;
  emailVerified?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface IDevelopmentGoals {
  studyAbroad?: boolean;
  employment?: boolean;
  scientificResearch?: boolean;
  startup?: boolean;
  personalGrowth?: boolean;
  notes?: string;
}

export interface IStudentProfile {
  _id: string;
  userId: string;
  fullName: string;
  birthYear?: number;
  avatar?: string;
  university?: string;
  major?: string;
  academicYear?: string;
  bio?: string;
  developmentGoals: IDevelopmentGoals;
  skills: string[];
  hardSkills?: string[];
  softSkills?: string[];
  achievements: string[];
  createdAt: Date;
  updatedAt: Date;
}

// ==============================================================================
// 2. Student Activities & Categories (Module 04)
// ==============================================================================

export interface IActivityCategoryDTO {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  colorToken?: ActivityCategoryColorToken | string;
  order: number;
  isActive: boolean;
  activityCount?: number;
}

export interface IStudentActivitySummary {
  _id: string;
  title: string;
  slug: string;
  summary: string;
  coverImage?: string;
  category: {
    _id: string;
    name: string;
    slug: string;
    colorToken?: string;
    icon?: string;
  } | null;
  organizer?: string;
  location?: string;
  isDomestic: boolean;
  openingDate?: string | Date | null;
  deadline?: string | Date | null;
  eventDate?: string | Date | null;
  eventEndDate?: string | Date | null;
  registrationUrl?: string;
  tags: string[];
  publishStatus: ActivityPublishStatus;
  manualClosed: boolean;
  computedStatus: ActivityComputedStatus;
  isFollowedByMe?: boolean;
  followerCount: number;
  viewCount: number;
  isFeatured: boolean;
  version: number;
  publishedAt?: string | Date | null;
  createdAt?: string | Date;
}

export interface IStudentActivityDetail extends IStudentActivitySummary {
  contentJson: TiptapJSONDoc;
  contentText?: string;
  eligibility?: string;
  requirements?: string;
  benefits?: string;
  applicationInstructions?: string;
  updatedAt?: string | Date;
  followPreferences?: {
    notifyDeadline: boolean;
    notifyEvent: boolean;
  } | null;
}

export interface IActivityStatisticsDTO {
  kpi: {
    totalActivities: number;
    publishedActivities: number;
    openActivities: number;
    closingWithin7Days: number;
    totalFollowers: number;
    totalViews: number;
    byComputedStatus: Record<ActivityComputedStatus, number>;
  };
  topFollowed: Array<{
    _id: string;
    title: string;
    slug: string;
    categoryName: string;
    followerCount: number;
    viewCount: number;
    conversionRate: number;
    computedStatus: ActivityComputedStatus;
    deadline?: string | null;
  }>;
  topViewed: Array<{
    _id: string;
    title: string;
    slug: string;
    categoryName: string;
    viewCount: number;
    followerCount: number;
    computedStatus: ActivityComputedStatus;
  }>;
  byCategory: Array<{
    categoryId: string;
    name: string;
    slug: string;
    colorToken: string;
    totalCount: number;
    publishedCount: number;
    totalFollowers: number;
    totalViews: number;
  }>;
}

// ==============================================================================
// 5. Personal Roadmap (Module 08 - 4-Year AI Roadmap & Goal CRUD)
// ==============================================================================

export interface IRoadmapGoalDTO {
  id: string;
  title: string;
  description: string;
  category: RoadmapGoalCategory;
  semester: 0 | 1 | 2;
  priority: RoadmapGoalPriority;
  status: RoadmapGoalStatus;
  dueDate: string | null;
  order: number;
  isCustom: boolean;
  completedAt: string | null;
}

export interface IRoadmapYearDTO {
  yearNumber: 1 | 2 | 3 | 4;
  title: string;
  summary: string;
  goals: IRoadmapGoalDTO[];
}

export interface IRoadmapYearProgressDTO {
  yearNumber: 1 | 2 | 3 | 4;
  totalGoals: number;
  countableGoals: number;
  completedGoals: number;
  inProgressGoals: number;
  skippedGoals: number;
  progressPercent: number;
}

export interface IRoadmapProgressBreakdownDTO {
  totalGoals: number;
  countableGoals: number;
  completedGoals: number;
  inProgressGoals: number;
  skippedGoals: number;
  progressPercent: number;
  byYear: IRoadmapYearProgressDTO[];
}

export interface IRoadmapDTO {
  _id: string;
  studentId: string;
  analysisId?: string | null;
  title: string;
  orientationDirection: string;
  version: number;
  status: RoadmapStatus;
  source: RoadmapSource;
  restoredFromRoadmapId?: string | null;
  progressPercent: number;
  years: IRoadmapYearDTO[];
  progressBreakdown?: IRoadmapProgressBreakdownDTO;
  createdAt: string;
  updatedAt: string;
}

export interface IRoadmapHistorySummaryDTO {
  _id: string;
  title: string;
  orientationDirection: string;
  version: number;
  status: RoadmapStatus;
  source: RoadmapSource;
  restoredFromRoadmapId?: string | null;
  progressPercent: number;
  totalGoals: number;
  completedGoals: number;
  createdAt: string;
  updatedAt: string;
}

// ==============================================================================
// 6. Mentor Connection
// ==============================================================================

export interface IMentorProfile {
  _id: string;
  name: string;
  avatar?: string;
  position: string;
  organization: string;
  expertise: string[];
  experience: string;
  bio: string;
  topics: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IBookingRequest {
  _id: string;
  studentId: string;
  mentorId: string | IMentorProfile;
  topic: string;
  preferredTime: string;
  message: string;
  status: BookingStatusId;
  adminResponse?: string;
  processedByAdminId?: string;
  createdAt: Date;
  updatedAt: Date;
}

// ==============================================================================
// 7. Notifications & Reminder Settings (Module 06 - OP09..OP14)
// ==============================================================================

export type NotificationType =
  | "DEADLINE_REMINDER"
  | "EVENT_REMINDER"
  | "BOOKING_UPDATE"
  | "ROADMAP_UPDATE"
  | "AI_ANALYSIS_READY"
  | "SYSTEM_ANNOUNCEMENT";
export type NotificationChannel = "IN_APP" | "EMAIL";
export type EmailDeliveryStatus = "PENDING" | "SENT" | "FAILED";
export type ReminderType = "DEADLINE" | "EVENT";

export interface INotification {
  _id: string;
  recipientId: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
  isRead: boolean;
  readAt?: string | Date | null;
  channel: NotificationChannel;
  emailDeliveryStatus?: EmailDeliveryStatus;
  activityId?: string;
  reminderType?: ReminderType;
  reminderOffsetDays?: number;
  idempotencyKey?: string;
  createdAt: string | Date;
  updatedAt?: string | Date;
}

export interface IReminderSettingDTO {
  _id?: string;
  userId: string;
  enableReminders: boolean;
  enableDeadlineReminder: boolean;
  enableEventReminder: boolean;
  offsetsDays: number[];
  channels: {
    inApp: boolean;
    email: boolean;
  };
  updatedAt?: string | Date;
}

export interface IReminderJobRunSummary {
  scannedFollows: number;
  createdCount: number;
  skippedDuplicates: number;
  emailedCount: number;
  errorsCount: number;
}

// ==============================================================================
// 8. Dynamic Orientation Assessment & AI Engine (Module 08)
// ==============================================================================

export type AssessmentAnswerValue = string | string[] | number;
export type AssessmentAnswersMap = Record<string, AssessmentAnswerValue>;

export interface IQuestionOptionDTO {
  id: string;
  label: string;
  value: string;
  order: number;
}

export interface IScaleConfigDTO {
  min: number;
  max: number;
  step: number;
  minLabel: string;
  maxLabel: string;
}

export interface ITextConfigDTO {
  placeholder: string;
  maxLength: number;
  multiline: boolean;
}

export interface IMultipleConfigDTO {
  minSelect?: number;
  maxSelect?: number;
}

export interface IConditionRuleDTO {
  sourceQuestionId: string;
  operator: ConditionOperator;
  value: string | number;
}

export interface IConditionalLogicDTO {
  enabled: boolean;
  matchType: ConditionMatchType;
  rules: IConditionRuleDTO[];
}

export interface IAssessmentQuestionDTO {
  _id: string;
  questionnaireId: string;
  code: string;
  questionText: string;
  description?: string;
  questionType: AssessmentQuestionType;
  isRequired: boolean;
  allowCustomOption?: boolean;
  order: number;
  options: IQuestionOptionDTO[];
  scaleConfig?: IScaleConfigDTO;
  textConfig?: ITextConfigDTO;
  multipleConfig?: IMultipleConfigDTO;
  conditionalLogic?: IConditionalLogicDTO | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface IQuestionnaireDTO {
  _id: string;
  title: string;
  description?: string;
  version: number;
  isActive: boolean;
  isDeleted: boolean;
  createdByAdminId?: string;
  questionCount?: number;
  submissionCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface IAssessmentSubmissionAnswerDTO {
  questionId: string;
  questionCode: string;
  questionTextSnapshot: string;
  questionType: AssessmentQuestionType;
  value: AssessmentAnswerValue;
  readableValue?: string;
}

export interface IAssessmentSubmissionDTO {
  _id: string;
  studentId: string;
  questionnaireId: string;
  questionnaireTitle?: string;
  status: AssessmentSubmissionStatus;
  attemptNumber: number;
  answers: IAssessmentSubmissionAnswerDTO[];
  currentStepIndex: number;
  lastSavedAt?: string | null;
  submittedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface ISystemPromptDTO {
  _id: string;
  key: SystemPromptKey;
  name: string;
  promptContent: string;
  modelName: string;
  temperature: number;
  version: number;
  isActive: boolean;
  updatedByAdminId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface IAiOrientationResultDTO {
  overallSummary: string;
  profileEvaluation: {
    interests: string[];
    strengths: string[];
    areasForImprovement: string[];
  };
  orientationCompatibility: Array<{
    directionCode: OrientationDirectionCode;
    directionTitle: string;
    compatibilityScore: number;
    isPrimaryRecommendation: boolean;
    reasoning: string;
  }>;
  careerRecommendations: Array<{
    title: string;
    industry: string;
    matchScore: number;
    reason: string;
    nextSteps: string[];
  }>;
  learningRecommendations: {
    hardSkills: Array<{
      name: string;
      priority: "HIGH" | "MEDIUM";
      reason: string;
    }>;
    softSkills: Array<{
      name: string;
      priority: "HIGH" | "MEDIUM";
      reason: string;
    }>;
    certificatesOrCourses: string[];
  };
}

export interface ICustomCareerOptionDTO {
  id: string;
  title: string;
  reason?: string;
  createdAt?: string;
}

export interface IAiOrientationAnalysisDTO {
  _id: string;
  studentId: string;
  submissionId: string;
  promptVersion: number;
  modelUsed: string;
  inputSnapshot?: Record<string, unknown>;
  status: AiAnalysisStatus;
  errorMessage?: string;
  retryCount: number;
  analysisResult?: IAiOrientationResultDTO | null;
  customCareerOptions?: ICustomCareerOptionDTO[];
  regenerationOfId?: string | null;
  createdAt: string;
  updatedAt: string;
}

// ==============================================================================
// 9. Content & Media Management (Module 00 - Base Layer)
// ==============================================================================

export interface TiptapJSONMark {
  type: string;
  attrs?: Record<string, unknown>;
}

export interface TiptapJSONNode {
  type: string;
  attrs?: Record<string, unknown>;
  content?: TiptapJSONNode[];
  marks?: TiptapJSONMark[];
  text?: string;
}

export interface TiptapJSONDoc {
  type: "doc";
  content: TiptapJSONNode[];
}

export interface IMediaAssetRef {
  targetCollection: "orientation_articles" | "student_activities" | "news_articles";
  documentId: string;
  role: "COVER" | "CONTENT";
}

export interface IMediaAssetDTO {
  _id: string;
  publicId: string;
  url: string;
  resourceType: "image" | "video";
  mediaKind: "IMAGE" | "AUDIO";
  folder: string;
  originalFilename: string;
  mimeType: string;
  format: string;
  bytes: number;
  width?: number;
  height?: number;
  duration?: number;
  status: "TEMP" | "ATTACHED" | "ORPHANED";
  usedBy: IMediaAssetRef[];
  createdAt?: string;
  updatedAt?: string;
}

// ==============================================================================
// 10. Orientation Explore Articles & Taxonomy (Module 03)
// ==============================================================================

export interface IOrientationTopicDTO {
  _id: string;
  categoryId: string;
  name: string;
  slug: string;
  description?: string;
  order: number;
  isActive: boolean;
}

export interface IOrientationCategoryDTO {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  order: number;
  isActive: boolean;
  topics?: IOrientationTopicDTO[];
}

export interface IOrientationArticleSummary {
  _id: string;
  title: string;
  slug: string;
  summary: string;
  coverImage?: string;
  category: {
    _id: string;
    name: string;
    slug: string;
  } | null;
  topics: {
    _id: string;
    name: string;
    slug: string;
  }[];
  tags: string[];
  status: "DRAFT" | "PUBLISHED" | "UNPUBLISHED";
  isFeatured: boolean;
  authorName: string;
  readTimeMinutes: number;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  isLikedByMe?: boolean;
  publishedAt?: string | Date | null;
  createdAt?: string | Date;
}

export interface IOrientationArticleDetail extends IOrientationArticleSummary {
  contentJson: TiptapJSONDoc;
  contentText?: string;
  updatedAt?: string | Date;
}

export interface IArticleCommentDTO {
  _id: string;
  articleId: string;
  content: string;
  parentCommentId: string | null;
  user: {
    id: string;
    name: string;
    avatar?: string;
    university?: string;
    major?: string;
  };
  isEdited: boolean;
  isOwner: boolean;
  canDelete: boolean;
  createdAt: string;
  updatedAt: string;
  replies?: IArticleCommentDTO[];
}

// ==============================================================================
// 11. News & Editorial Hub (Module 05 - NEWS01..NEWS22)
// ==============================================================================

export interface INewsCategoryDTO {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  colorToken: string;
  order: number;
  isActive: boolean;
  showInSidebar: boolean;
  articleCount?: number;
}

export interface INewsTagDTO {
  _id: string;
  name: string;
  slug: string;
  usageCount: number;
  isActive: boolean;
}

export interface INewsArticleSummary {
  _id: string;
  title: string;
  slug: string;
  summary: string;
  coverImage?: string;
  category: {
    _id: string;
    name: string;
    slug: string;
    colorToken?: string;
  } | null;
  categorySlug: string;
  tags: string[];
  authorName: string;
  readTimeMinutes: number;
  status: "DRAFT" | "SCHEDULED" | "PUBLISHED" | "UNPUBLISHED";
  scheduledAt?: string | Date | null;
  publishedAt?: string | Date | null;
  isFeatured: boolean;
  isSponsored: boolean;
  sponsorInfo?: string;
  sourceName?: string;
  sourceUrl?: string;
  viewCount: number;
  bookmarkCount: number;
  shareCount: number;
  version: number;
  createdAt?: string | Date;
  isBookmarkedByMe?: boolean;
}

export interface INewsArticleDetail extends INewsArticleSummary {
  contentJson: TiptapJSONDoc;
  contentText?: string;
  updatedAt?: string | Date;
}

export interface INewsReadingHistoryItem {
  _id: string;
  articleId: string;
  lastReadAt: string | Date;
  readCount: number;
  isAvailable: boolean;
  article: INewsArticleSummary | null;
}

export interface INewsAnalyticsDTO {
  kpi: {
    totalArticles: number;
    publishedArticles: number;
    scheduledArticles: number;
    draftArticles: number;
    unpublishedArticles: number;
    featuredArticles: number;
    totalViews: number;
    totalBookmarks: number;
    totalShares: number;
  };
  byStatus: Record<"DRAFT" | "SCHEDULED" | "PUBLISHED" | "UNPUBLISHED", number>;
  byCategory: Array<{
    categoryId: string;
    name: string;
    slug: string;
    colorToken: string;
    totalCount: number;
    publishedCount: number;
    totalViews: number;
    totalBookmarks: number;
    totalShares: number;
  }>;
  topViewed: Array<{
    _id: string;
    title: string;
    slug: string;
    categoryName: string;
    viewCount: number;
    bookmarkCount: number;
    shareCount: number;
    publishedAt?: string | Date | null;
  }>;
  topBookmarked: Array<{
    _id: string;
    title: string;
    slug: string;
    categoryName: string;
    viewCount: number;
    bookmarkCount: number;
    shareCount: number;
    publishedAt?: string | Date | null;
  }>;
  topShared: Array<{
    _id: string;
    title: string;
    slug: string;
    categoryName: string;
    viewCount: number;
    bookmarkCount: number;
    shareCount: number;
    publishedAt?: string | Date | null;
  }>;
}

// ==============================================================================
// 7. Student Tools (Module 07 - MBTI, MI, Salary, Tax)
// ==============================================================================

export interface IToolResultDTO {
  _id: string;
  userId: string;
  toolType: ToolType;
  answers: Record<string, string | number>;
  resultCode: string;
  scoresBreakdown: Record<string, unknown>;
  summary: string;
  createdAt: string;
}

export interface IToolResultsResponse {
  results: IToolResultDTO[];
  latestByType: {
    MBTI: IToolResultDTO | null;
    MI: IToolResultDTO | null;
  };
}

// ==============================================================================
// 9. CV Builder (Module 09)
// ==============================================================================
export * from "./cv";




