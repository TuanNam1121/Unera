export type CvSectionKey =
  | "summary"
  | "education"
  | "experience"
  | "skills"
  | "projects"
  | "achievements"
  | "activities"
  | "certifications"
  | "custom";

export type CvLocale = "vi" | "en";

export type CvIndustry =
  | "BUSINESS_MARKETING"
  | "TECH_IT"
  | "LANGUAGE_EDUCATION"
  | "ACADEMIC_GENERAL";

export type CvTemplateStyle =
  | "MINIMALIST_ATS"
  | "MODERN_TWO_COL"
  | "CLASSIC_EXECUTIVE"
  | "CREATIVE_ACCENT";

export type CvExperienceLevel =
  | "STUDENT_NO_EXP"
  | "INTERN_FRESHER"
  | "EXPERIENCED";

export type CvFontFamily = "Inter" | "Roboto" | "TimesNewRoman";
export type CvFontSizeScale = "sm" | "md" | "lg";
export type CvPagePadding = "compact" | "normal" | "relaxed";
export type CvHeaderAlign = "left" | "center";
export type CvLayoutType = "single-column" | "two-column-left" | "two-column-right";

export interface ICvPersonalInfo {
  fullName: string;
  jobTitle?: string;
  email?: string;
  phone?: string;
  location?: string;
  website?: string;
  linkedin?: string;
  github?: string;
  portfolio?: string;
  avatarUrl?: string;
  dateOfBirth?: string;
}

export interface ICvEducationItem {
  id: string;
  school: string;
  degree?: string;
  major?: string;
  gpa?: string;
  startDate?: string | null;
  endDate?: string | null;
  isCurrent: boolean;
  description?: string;
}

export interface ICvExperienceItem {
  id: string;
  position: string;
  company: string;
  location?: string;
  startDate?: string | null;
  endDate?: string | null;
  isCurrent: boolean;
  highlights: string[];
}

export interface ICvSkillItem {
  id: string;
  name: string;
  level?: "basic" | "intermediate" | "advanced" | "expert";
}

export interface ICvSkillGroup {
  id: string;
  groupName: string;
  items: ICvSkillItem[];
}

export interface ICvProjectItem {
  id: string;
  name: string;
  role?: string;
  link?: string;
  technologies?: string;
  startDate?: string | null;
  endDate?: string | null;
  isCurrent: boolean;
  highlights: string[];
}

export interface ICvAchievementItem {
  id: string;
  title: string;
  year?: number | null;
  issuer?: string;
  description?: string;
}

export interface ICvActivityItem {
  id: string;
  name: string;
  organization?: string;
  role?: string;
  startDate?: string | null;
  endDate?: string | null;
  isCurrent: boolean;
  description?: string;
}

export interface ICvCertificationItem {
  id: string;
  name: string;
  issuer?: string;
  issueDate?: string | null;
  credentialUrl?: string;
  scoreOrLevel?: string;
}

export interface ICvCustomSectionItem {
  id: string;
  title: string;
  subtitle?: string;
  dateText?: string;
  description?: string;
}

export interface ICvCustomSection {
  id: string;
  sectionTitle: string;
  items: ICvCustomSectionItem[];
}

export interface ICvStyleConfig {
  accentColor: string;
  fontFamily: CvFontFamily;
  fontSizeScale: CvFontSizeScale;
  lineHeight: number;
  pagePadding: CvPagePadding;
  showAvatar: boolean;
  headerAlign: CvHeaderAlign;
}

export interface ICvSharingConfig {
  isPublic: boolean;
  shareSlug: string | null;
  sharedAt: string | null;
  viewCount: number;
  allowPdfDownload: boolean;
}

export interface ICvContentData {
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
}

export interface ICvDocumentDTO extends ICvContentData {
  _id: string;
  userId: string;
  title: string;
  templateId: string;
  targetRole?: string;
  locale: CvLocale;
  styleConfig: ICvStyleConfig;
  sectionOrder: CvSectionKey[];
  hiddenSections: CvSectionKey[];
  sharing: ICvSharingConfig;
  version: number;
  lastEditedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface ICvSummaryDTO {
  _id: string;
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
  sharing: ICvSharingConfig;
  version: number;
  lastEditedAt: string;
  updatedAt: string;
}

export interface ICvPublicViewDTO extends ICvContentData {
  _id: string;
  title: string;
  templateId: string;
  targetRole?: string;
  locale: CvLocale;
  styleConfig: ICvStyleConfig;
  sectionOrder: CvSectionKey[];
  allowPdfDownload: boolean;
  shareSlug: string;
  updatedAt: string;
}

export interface ICvTemplateDefinition {
  id: string;
  name: string;
  description: string;
  industry: CvIndustry[];
  style: CvTemplateStyle;
  experienceLevel: CvExperienceLevel[];
  atsScore: number;
  supportsAvatar: boolean;
  layoutType: CvLayoutType;
  defaultSectionOrder: CvSectionKey[];
  sidebarSections?: CvSectionKey[];
  defaultStyleConfig: {
    accentColor: string;
    fontFamily: CvFontFamily;
    fontSizeScale: CvFontSizeScale;
    lineHeight: number;
    pagePadding: CvPagePadding;
    headerAlign: CvHeaderAlign;
  };
  paletteOptions: string[];
}

export interface ICvProfilePrefillSeed {
  fullName: string;
  email: string;
  avatarUrl: string;
  university: string;
  major: string;
  academicYear: string;
  bio: string;
  hardSkills: string[];
  softSkills: string[];
  extraSkills: string[];
  achievements: Array<{
    title: string;
    suggestedYear: number | null;
  }>;
}

