import mongoose, { Document, Model, Schema, Types } from "mongoose";
import {
  CV_DEFAULT_SECTION_ORDER,
  CV_DEFAULT_STYLE_CONFIG,
  DEFAULT_CV_TEMPLATE_ID,
} from "@/constants/cv";
import type {
  CvLocale,
  CvSectionKey,
  ICvAchievementItem,
  ICvActivityItem,
  ICvCertificationItem,
  ICvCustomSection,
  ICvEducationItem,
  ICvExperienceItem,
  ICvPersonalInfo,
  ICvProjectItem,
  ICvSharingConfig,
  ICvSkillGroup,
  ICvStyleConfig,
} from "@/types/cv";

export interface ICvDocument extends Document {
  userId: Types.ObjectId;
  title: string;
  templateId: string;
  targetRole?: string;
  locale: CvLocale;
  styleConfig: ICvStyleConfig;
  sectionOrder: CvSectionKey[];
  hiddenSections: CvSectionKey[];
  personalInfo: ICvPersonalInfo;
  summary: string;
  education: ICvEducationItem[];
  experience: ICvExperienceItem[];
  skills: ICvSkillGroup[];
  projects: ICvProjectItem[];
  achievements: ICvAchievementItem[];
  activities: ICvActivityItem[];
  certifications: ICvCertificationItem[];
  customSections: ICvCustomSection[];
  sharing: {
    isPublic: boolean;
    shareSlug: string | null;
    sharedAt: Date | null;
    viewCount: number;
    allowPdfDownload: boolean;
  };
  version: number;
  lastEditedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const PersonalInfoSchema = new Schema(
  {
    fullName: { type: String, required: true, trim: true },
    jobTitle: { type: String, trim: true, default: "" },
    email: { type: String, trim: true, default: "" },
    phone: { type: String, trim: true, default: "" },
    location: { type: String, trim: true, default: "" },
    website: { type: String, trim: true, default: "" },
    linkedin: { type: String, trim: true, default: "" },
    github: { type: String, trim: true, default: "" },
    portfolio: { type: String, trim: true, default: "" },
    avatarUrl: { type: String, trim: true, default: "" },
    dateOfBirth: { type: String, trim: true, default: "" },
  },
  { _id: false }
);

const EducationItemSchema = new Schema(
  {
    id: { type: String, required: true },
    school: { type: String, required: true, trim: true },
    degree: { type: String, trim: true, default: "" },
    major: { type: String, trim: true, default: "" },
    gpa: { type: String, trim: true, default: "" },
    startDate: { type: String, default: null },
    endDate: { type: String, default: null },
    isCurrent: { type: Boolean, default: false },
    description: { type: String, trim: true, default: "" },
  },
  { _id: false }
);

const ExperienceItemSchema = new Schema(
  {
    id: { type: String, required: true },
    position: { type: String, required: true, trim: true },
    company: { type: String, required: true, trim: true },
    location: { type: String, trim: true, default: "" },
    startDate: { type: String, default: null },
    endDate: { type: String, default: null },
    isCurrent: { type: Boolean, default: false },
    highlights: { type: [String], default: [] },
  },
  { _id: false }
);

const SkillItemSchema = new Schema(
  {
    id: { type: String, required: true },
    name: { type: String, required: true, trim: true },
    level: {
      type: String,
      enum: ["basic", "intermediate", "advanced", "expert"],
    },
  },
  { _id: false }
);

const SkillGroupSchema = new Schema(
  {
    id: { type: String, required: true },
    groupName: { type: String, required: true, trim: true },
    items: { type: [SkillItemSchema], default: [] },
  },
  { _id: false }
);

const ProjectItemSchema = new Schema(
  {
    id: { type: String, required: true },
    name: { type: String, required: true, trim: true },
    role: { type: String, trim: true, default: "" },
    link: { type: String, trim: true, default: "" },
    technologies: { type: String, trim: true, default: "" },
    startDate: { type: String, default: null },
    endDate: { type: String, default: null },
    isCurrent: { type: Boolean, default: false },
    highlights: { type: [String], default: [] },
  },
  { _id: false }
);

const AchievementItemSchema = new Schema(
  {
    id: { type: String, required: true },
    title: { type: String, required: true, trim: true },
    year: { type: Number, default: null },
    issuer: { type: String, trim: true, default: "" },
    description: { type: String, trim: true, default: "" },
  },
  { _id: false }
);

const ActivityItemSchema = new Schema(
  {
    id: { type: String, required: true },
    name: { type: String, required: true, trim: true },
    organization: { type: String, trim: true, default: "" },
    role: { type: String, trim: true, default: "" },
    startDate: { type: String, default: null },
    endDate: { type: String, default: null },
    isCurrent: { type: Boolean, default: false },
    description: { type: String, trim: true, default: "" },
  },
  { _id: false }
);

const CertificationItemSchema = new Schema(
  {
    id: { type: String, required: true },
    name: { type: String, required: true, trim: true },
    issuer: { type: String, trim: true, default: "" },
    issueDate: { type: String, default: null },
    credentialUrl: { type: String, trim: true, default: "" },
    scoreOrLevel: { type: String, trim: true, default: "" },
  },
  { _id: false }
);

const CustomSectionItemSchema = new Schema(
  {
    id: { type: String, required: true },
    title: { type: String, required: true, trim: true },
    subtitle: { type: String, trim: true, default: "" },
    dateText: { type: String, trim: true, default: "" },
    description: { type: String, trim: true, default: "" },
  },
  { _id: false }
);

const CustomSectionSchema = new Schema(
  {
    id: { type: String, required: true },
    sectionTitle: { type: String, required: true, trim: true },
    items: { type: [CustomSectionItemSchema], default: [] },
  },
  { _id: false }
);

const StyleConfigSchema = new Schema(
  {
    accentColor: { type: String, default: CV_DEFAULT_STYLE_CONFIG.accentColor },
    fontFamily: {
      type: String,
      enum: ["Inter", "Roboto", "TimesNewRoman"],
      default: CV_DEFAULT_STYLE_CONFIG.fontFamily,
    },
    fontSizeScale: {
      type: String,
      enum: ["sm", "md", "lg"],
      default: CV_DEFAULT_STYLE_CONFIG.fontSizeScale,
    },
    lineHeight: { type: Number, default: CV_DEFAULT_STYLE_CONFIG.lineHeight },
    pagePadding: {
      type: String,
      enum: ["compact", "normal", "relaxed"],
      default: CV_DEFAULT_STYLE_CONFIG.pagePadding,
    },
    showAvatar: { type: Boolean, default: CV_DEFAULT_STYLE_CONFIG.showAvatar },
    headerAlign: {
      type: String,
      enum: ["left", "center"],
      default: CV_DEFAULT_STYLE_CONFIG.headerAlign,
    },
  },
  { _id: false }
);

const SharingSchema = new Schema(
  {
    isPublic: { type: Boolean, default: false },
    shareSlug: { type: String, default: null },
    sharedAt: { type: Date, default: null },
    viewCount: { type: Number, default: 0, min: 0 },
    allowPdfDownload: { type: Boolean, default: true },
  },
  { _id: false }
);

const CvDocumentSchema = new Schema<ICvDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    templateId: {
      type: String,
      required: true,
      default: DEFAULT_CV_TEMPLATE_ID,
    },
    targetRole: {
      type: String,
      trim: true,
      maxlength: 120,
      default: "",
    },
    locale: {
      type: String,
      enum: ["vi", "en"],
      default: "vi",
    },
    styleConfig: {
      type: StyleConfigSchema,
      default: () => ({ ...CV_DEFAULT_STYLE_CONFIG }),
    },
    sectionOrder: {
      type: [String],
      default: () => [...CV_DEFAULT_SECTION_ORDER],
    },
    hiddenSections: {
      type: [String],
      default: () => [],
    },
    personalInfo: {
      type: PersonalInfoSchema,
      required: true,
    },
    summary: { type: String, trim: true, default: "" },
    education: { type: [EducationItemSchema], default: [] },
    experience: { type: [ExperienceItemSchema], default: [] },
    skills: { type: [SkillGroupSchema], default: [] },
    projects: { type: [ProjectItemSchema], default: [] },
    achievements: { type: [AchievementItemSchema], default: [] },
    activities: { type: [ActivityItemSchema], default: [] },
    certifications: { type: [CertificationItemSchema], default: [] },
    customSections: { type: [CustomSectionSchema], default: [] },
    sharing: {
      type: SharingSchema,
      default: () =>
        ({
          isPublic: false,
          shareSlug: null,
          sharedAt: null,
          viewCount: 0,
          allowPdfDownload: true,
        }) satisfies Omit<ICvSharingConfig, "sharedAt"> & { sharedAt: Date | null },
    },
    version: { type: Number, default: 1, min: 1 },
    lastEditedAt: { type: Date, default: () => new Date() },
  },
  {
    collection: "cv_documents",
    timestamps: true,
  }
);

CvDocumentSchema.index({ userId: 1, updatedAt: -1 });
CvDocumentSchema.index(
  { "sharing.shareSlug": 1 },
  { unique: true, sparse: true }
);

export const CvDocument: Model<ICvDocument> =
  mongoose.models.CvDocument ||
  mongoose.model<ICvDocument>("CvDocument", CvDocumentSchema);

export default CvDocument;

