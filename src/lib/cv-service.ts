import crypto from "node:crypto";
import { Types } from "mongoose";
import { ACADEMIC_YEARS } from "@/constants";
import { CV_ALL_SECTION_KEYS, CV_DEFAULT_STYLE_CONFIG } from "@/constants/cv";
import { getCvTemplate } from "@/lib/cv-templates";
import { slugifyVietnamese } from "@/lib/orientation-utils";
import {
  normalizeUniqueStrings,
  resolveCategorizedSkills,
} from "@/lib/profile-skills";
import { CvDocument, ICvDocument } from "@/models/CvDocument";
import { StudentProfile } from "@/models/StudentProfile";
import { User } from "@/models/User";
import type {
  CvLocale,
  CvSectionKey,
  ICvAchievementItem,
  ICvDocumentDTO,
  ICvEducationItem,
  ICvPersonalInfo,
  ICvProfilePrefillSeed,
  ICvPublicViewDTO,
  ICvSkillGroup,
  ICvSummaryDTO,
} from "@/types/cv";
import { extractYearFromText } from "@/validations/cv";

export function makeCvItemId(prefix = "cv"): string {
  return `${prefix}-${crypto.randomBytes(5).toString("hex")}`;
}

function getAcademicYearLabel(code?: string): string {
  if (!code) return "";
  return ACADEMIC_YEARS.find((item) => item.value === code)?.label || "";
}

export function extractProfileSkillGroups(
  profile: {
    hardSkills?: string[];
    softSkills?: string[];
    skills?: string[];
  },
  locale: CvLocale = "vi"
): {
  groups: ICvSkillGroup[];
  hardSkills: string[];
  softSkills: string[];
  extraSkills: string[];
} {
  const { hardSkills, softSkills } = resolveCategorizedSkills({
    hardSkills: profile.hardSkills,
    softSkills: profile.softSkills,
    skills: profile.skills,
  });

  const combinedKnown = new Set(
    [...hardSkills, ...softSkills].map((item) => item.toLowerCase())
  );
  const rawSkills = normalizeUniqueStrings(profile.skills);
  const extraSkills = rawSkills.filter(
    (item) => !combinedKnown.has(item.toLowerCase())
  );

  const groups: ICvSkillGroup[] = [];

  if (hardSkills.length > 0) {
    groups.push({
      id: makeCvItemId("skg"),
      groupName: locale === "en" ? "Technical & Hard Skills" : "Kỹ năng chuyên môn",
      items: hardSkills.map((name) => ({
        id: makeCvItemId("sk"),
        name,
      })),
    });
  }

  if (softSkills.length > 0) {
    groups.push({
      id: makeCvItemId("skg"),
      groupName: locale === "en" ? "Soft Skills" : "Kỹ năng mềm",
      items: softSkills.map((name) => ({
        id: makeCvItemId("sk"),
        name,
      })),
    });
  }

  if (extraSkills.length > 0) {
    groups.push({
      id: makeCvItemId("skg"),
      groupName: locale === "en" ? "Additional Skills" : "Kỹ năng khác",
      items: extraSkills.map((name) => ({
        id: makeCvItemId("sk"),
        name,
      })),
    });
  }

  return { groups, hardSkills, softSkills, extraSkills };
}

export async function getProfilePrefillSeed(
  userId: string
): Promise<ICvProfilePrefillSeed> {
  const [userDoc, profileDoc] = await Promise.all([
    User.findById(userId).select("name email avatar").lean(),
    StudentProfile.findOne({ userId }).lean(),
  ]);

  const { hardSkills, softSkills, extraSkills } = extractProfileSkillGroups({
    hardSkills: profileDoc?.hardSkills,
    softSkills: profileDoc?.softSkills,
    skills: profileDoc?.skills,
  });

  const rawAchievements = normalizeUniqueStrings(profileDoc?.achievements);

  return {
    fullName: profileDoc?.fullName || userDoc?.name || "",
    email: userDoc?.email || "",
    avatarUrl: profileDoc?.avatar || userDoc?.avatar || "",
    university: profileDoc?.university || "",
    major: profileDoc?.major || "",
    academicYear: profileDoc?.academicYear || "",
    bio: profileDoc?.bio || "",
    hardSkills,
    softSkills,
    extraSkills,
    achievements: rawAchievements.map((title) => ({
      title,
      suggestedYear: extractYearFromText(title),
    })),
  };
}

export async function buildInitialCvContent(params: {
  userId: string;
  userName: string;
  userEmail: string;
  userImage?: string;
  targetRole?: string;
  locale: CvLocale;
  prefillFromProfile: boolean;
  achievementYearsOverride?: Record<string, number | null | undefined>;
}): Promise<{
  personalInfo: ICvPersonalInfo;
  summary: string;
  education: ICvEducationItem[];
  skills: ICvSkillGroup[];
  achievements: ICvAchievementItem[];
}> {
  if (!params.prefillFromProfile) {
    return {
      personalInfo: {
        fullName: params.userName || "Sinh viên Unera",
        jobTitle: params.targetRole || "",
        email: params.userEmail || "",
        phone: "",
        location: "",
        website: "",
        linkedin: "",
        github: "",
        portfolio: "",
        avatarUrl: params.userImage || "",
        dateOfBirth: "",
      },
      summary: "",
      education: [],
      skills: [],
      achievements: [],
    };
  }

  const profile = await StudentProfile.findOne({ userId: params.userId }).lean();
  const fullName = profile?.fullName || params.userName || "Sinh viên Unera";
  const yearLabel = getAcademicYearLabel(profile?.academicYear);
  const jobTitle =
    params.targetRole?.trim() ||
    [yearLabel, profile?.major].filter(Boolean).join(" · ");

  const education: ICvEducationItem[] = [];
  if (profile?.university || profile?.major) {
    education.push({
      id: makeCvItemId("edu"),
      school: profile.university || "",
      degree: params.locale === "en" ? "Bachelor" : "Cử nhân",
      major: profile.major || "",
      gpa: "",
      startDate: null,
      endDate: null,
      isCurrent: true,
      description: yearLabel ? `${yearLabel}` : "",
    });
  }

  const { groups: skills } = extractProfileSkillGroups(
    {
      hardSkills: profile?.hardSkills,
      softSkills: profile?.softSkills,
      skills: profile?.skills,
    },
    params.locale
  );

  const rawAchievements = normalizeUniqueStrings(profile?.achievements);
  const achievements: ICvAchievementItem[] = rawAchievements.map((title, index) => {
    const overrideByIndex = params.achievementYearsOverride?.[String(index)];
    const overrideByTitle = params.achievementYearsOverride?.[title];
    const resolvedYear =
      overrideByIndex !== undefined
        ? overrideByIndex
        : overrideByTitle !== undefined
          ? overrideByTitle
          : extractYearFromText(title);

    return {
      id: makeCvItemId("ach"),
      title,
      year: resolvedYear ?? null,
      issuer: "",
      description: "",
    };
  });

  return {
    personalInfo: {
      fullName,
      jobTitle,
      email: params.userEmail || "",
      phone: "",
      location: "",
      website: "",
      linkedin: "",
      github: "",
      portfolio: "",
      avatarUrl: profile?.avatar || params.userImage || "",
      dateOfBirth: profile?.birthYear ? String(profile.birthYear) : "",
    },
    summary: profile?.bio || "",
    education,
    skills,
    achievements,
  };
}

export async function generateUniqueShareSlug(title: string): Promise<string> {
  const baseSlug = slugifyVietnamese(title).slice(0, 48) || "unera-cv";
  for (let i = 0; i < 6; i++) {
    const suffix = crypto.randomBytes(3).toString("hex");
    const candidate = `${baseSlug}-${suffix}`;
    const exists = await CvDocument.exists({ "sharing.shareSlug": candidate });
    if (!exists) return candidate;
  }
  return `${baseSlug}-${Date.now().toString(36)}`;
}

function normalizeSectionOrder(order?: string[]): CvSectionKey[] {
  const validSet = new Set<string>(CV_ALL_SECTION_KEYS);
  const cleaned = (order || []).filter((key): key is CvSectionKey =>
    validSet.has(key)
  );
  const seen = new Set(cleaned);
  for (const key of CV_ALL_SECTION_KEYS) {
    if (!seen.has(key)) cleaned.push(key);
  }
  return cleaned;
}

export function serializeCvDocument(
  doc: ICvDocument | Record<string, unknown>
): ICvDocumentDTO {
  const raw = doc as Record<string, unknown> & {
    _id: unknown;
    userId: unknown;
    templateId?: string;
    styleConfig?: Record<string, unknown>;
    sharing?: Record<string, unknown>;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    lastEditedAt?: Date | string;
  };
  const tpl = getCvTemplate(raw.templateId);

  return {
    _id: String(raw._id),
    userId: String(raw.userId),
    title: String(raw.title || "CV chưa đặt tên"),
    templateId: tpl.id,
    targetRole: typeof raw.targetRole === "string" ? raw.targetRole : "",
    locale: raw.locale === "en" ? "en" : "vi",
    styleConfig: {
      accentColor:
        typeof raw.styleConfig?.accentColor === "string"
          ? raw.styleConfig.accentColor
          : tpl.defaultStyleConfig.accentColor,
      fontFamily:
        raw.styleConfig?.fontFamily === "Roboto" ||
        raw.styleConfig?.fontFamily === "TimesNewRoman"
          ? raw.styleConfig.fontFamily
          : "Inter",
      fontSizeScale:
        raw.styleConfig?.fontSizeScale === "sm" ||
        raw.styleConfig?.fontSizeScale === "lg"
          ? raw.styleConfig.fontSizeScale
          : "md",
      lineHeight:
        typeof raw.styleConfig?.lineHeight === "number"
          ? raw.styleConfig.lineHeight
          : CV_DEFAULT_STYLE_CONFIG.lineHeight,
      pagePadding:
        raw.styleConfig?.pagePadding === "compact" ||
        raw.styleConfig?.pagePadding === "relaxed"
          ? raw.styleConfig.pagePadding
          : "normal",
      showAvatar: Boolean(raw.styleConfig?.showAvatar),
      headerAlign: raw.styleConfig?.headerAlign === "center" ? "center" : "left",
    },
    sectionOrder: normalizeSectionOrder(raw.sectionOrder as string[] | undefined),
    hiddenSections: Array.isArray(raw.hiddenSections)
      ? (raw.hiddenSections.filter((k): k is CvSectionKey =>
          (CV_ALL_SECTION_KEYS as readonly string[]).includes(String(k))
        ))
      : [],
    personalInfo: (raw.personalInfo as ICvPersonalInfo) || { fullName: "" },
    summary: typeof raw.summary === "string" ? raw.summary : "",
    education: Array.isArray(raw.education) ? raw.education : [],
    experience: Array.isArray(raw.experience) ? raw.experience : [],
    skills: Array.isArray(raw.skills) ? raw.skills : [],
    projects: Array.isArray(raw.projects) ? raw.projects : [],
    achievements: Array.isArray(raw.achievements) ? raw.achievements : [],
    activities: Array.isArray(raw.activities) ? raw.activities : [],
    certifications: Array.isArray(raw.certifications) ? raw.certifications : [],
    customSections: Array.isArray(raw.customSections) ? raw.customSections : [],
    sharing: {
      isPublic: Boolean(raw.sharing?.isPublic),
      shareSlug:
        typeof raw.sharing?.shareSlug === "string" ? raw.sharing.shareSlug : null,
      sharedAt: raw.sharing?.sharedAt
        ? new Date(String(raw.sharing.sharedAt)).toISOString()
        : null,
      viewCount:
        typeof raw.sharing?.viewCount === "number" ? raw.sharing.viewCount : 0,
      allowPdfDownload:
        raw.sharing?.allowPdfDownload === undefined
          ? true
          : Boolean(raw.sharing.allowPdfDownload),
    },
    version: typeof raw.version === "number" ? raw.version : 1,
    lastEditedAt: raw.lastEditedAt
      ? new Date(String(raw.lastEditedAt)).toISOString()
      : new Date().toISOString(),
    createdAt: raw.createdAt
      ? new Date(String(raw.createdAt)).toISOString()
      : new Date().toISOString(),
    updatedAt: raw.updatedAt
      ? new Date(String(raw.updatedAt)).toISOString()
      : new Date().toISOString(),
  };
}

export function serializeCvSummary(
  doc: ICvDocument | Record<string, unknown>
): ICvSummaryDTO {
  const full = serializeCvDocument(doc);
  return {
    _id: full._id,
    title: full.title,
    templateId: full.templateId,
    targetRole: full.targetRole,
    locale: full.locale,
    styleConfig: full.styleConfig,
    sectionOrder: full.sectionOrder,
    hiddenSections: full.hiddenSections,
    personalInfo: full.personalInfo,
    summary: full.summary,
    education: full.education,
    experience: full.experience,
    skills: full.skills,
    projects: full.projects,
    achievements: full.achievements,
    activities: full.activities,
    certifications: full.certifications,
    customSections: full.customSections,
    sharing: full.sharing,
    version: full.version,
    lastEditedAt: full.lastEditedAt,
    updatedAt: full.updatedAt,
  };
}

export function serializePublicCv(
  doc: ICvDocument | Record<string, unknown>
): ICvPublicViewDTO {
  const full = serializeCvDocument(doc);
  const hiddenSet = new Set<CvSectionKey>(full.hiddenSections);

  return {
    _id: full._id,
    title: full.title,
    templateId: full.templateId,
    targetRole: full.targetRole,
    locale: full.locale,
    styleConfig: full.styleConfig,
    sectionOrder: full.sectionOrder.filter((key) => !hiddenSet.has(key)),
    personalInfo: full.personalInfo,
    summary: hiddenSet.has("summary") ? "" : full.summary,
    education: hiddenSet.has("education") ? [] : full.education,
    experience: hiddenSet.has("experience") ? [] : full.experience,
    skills: hiddenSet.has("skills") ? [] : full.skills,
    projects: hiddenSet.has("projects") ? [] : full.projects,
    achievements: hiddenSet.has("achievements") ? [] : full.achievements,
    activities: hiddenSet.has("activities") ? [] : full.activities,
    certifications: hiddenSet.has("certifications") ? [] : full.certifications,
    customSections: hiddenSet.has("custom") ? [] : full.customSections,
    allowPdfDownload: full.sharing.allowPdfDownload,
    shareSlug: full.sharing.shareSlug || "",
    updatedAt: full.updatedAt,
  };
}

export function parseCvObjectId(id: string): Types.ObjectId | null {
  if (!Types.ObjectId.isValid(id)) return null;
  return new Types.ObjectId(id);
}

