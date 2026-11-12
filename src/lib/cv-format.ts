import {
  CV_FONT_OPTIONS,
  CV_FONT_SCALE_OPTIONS,
  CV_PADDING_OPTIONS,
  CV_UI_LABELS,
} from "@/constants/cv";
import type {
  CvFontFamily,
  CvFontSizeScale,
  CvLocale,
  CvPagePadding,
  ICvContentData,
} from "@/types/cv";

export function isSafeWebUrl(url?: string | null): boolean {
  if (!url) return false;
  const trimmed = url.trim();
  return trimmed.startsWith("https://") || trimmed.startsWith("http://");
}

export function formatCvMonthYear(value?: string | null): string {
  if (!value) return "";
  const trimmed = value.trim();
  const match = trimmed.match(/^(\d{4})-(\d{2})(?:-\d{2})?$/);
  if (match) {
    return `${match[2]}/${match[1]}`;
  }
  return trimmed;
}

export function formatCvDateRange(
  startDate?: string | null,
  endDate?: string | null,
  isCurrent?: boolean,
  locale: CvLocale = "vi"
): string {
  const start = formatCvMonthYear(startDate);
  const end = isCurrent
    ? CV_UI_LABELS[locale].present
    : formatCvMonthYear(endDate);

  if (start && end) return `${start} – ${end}`;
  if (start) return start;
  if (end) return end;
  return "";
}

export function getFontCssFamily(fontFamily: CvFontFamily): string {
  return (
    CV_FONT_OPTIONS.find((item) => item.value === fontFamily)?.cssFamily ||
    CV_FONT_OPTIONS[0].cssFamily
  );
}

export function getBaseFontPt(scale: CvFontSizeScale): number {
  return (
    CV_FONT_SCALE_OPTIONS.find((item) => item.value === scale)?.basePt ?? 10.5
  );
}

export function getPaddingConfig(padding: CvPagePadding): { px: number; pt: number } {
  return (
    CV_PADDING_OPTIONS.find((item) => item.value === padding) ??
    CV_PADDING_OPTIONS[1]
  );
}

export function createClientItemId(prefix = "cv"): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `${prefix}-${crypto.randomUUID().slice(0, 8)}`;
  }
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

export function buildEmptyCvContent(): ICvContentData {
  return {
    personalInfo: {
      fullName: "",
      jobTitle: "",
      email: "",
      phone: "",
      location: "",
      website: "",
      linkedin: "",
      github: "",
      portfolio: "",
      avatarUrl: "",
      dateOfBirth: "",
    },
    summary: "",
    education: [],
    experience: [],
    skills: [],
    projects: [],
    achievements: [],
    activities: [],
    certifications: [],
    customSections: [],
  };
}

export function formatRelativeTimeVi(isoDate?: string | null): string {
  if (!isoDate) return "";
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return "";
  const diffSec = Math.max(0, Math.floor((Date.now() - date.getTime()) / 1000));
  if (diffSec < 60) return "Vừa cập nhật";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin} phút trước`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr} giờ trước`;
  const diffDays = Math.floor(diffHr / 24);
  if (diffDays < 30) return `${diffDays} ngày trước`;
  return new Intl.DateTimeFormat("vi-VN", { dateStyle: "medium" }).format(date);
}

