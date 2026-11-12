/**
 * Pure client/server utilities for Module 05 (News & Editorial Hub)
 */
import { NEWS_ARTICLE_STATUS, type NewsArticleStatus } from "@/constants";
export {
  ACTIVITY_CATEGORY_COLOR_MAP as NEWS_CATEGORY_COLOR_MAP,
  getCategoryColorClasses as getNewsColorClasses,
  formatVietnamDate,
  formatVietnamDateTime,
  toDateTimeLocalValue,
} from "@/lib/activity-utils";

export const NEWS_STATUS_META: Record<
  NewsArticleStatus,
  {
    label: string;
    badgeClass: string;
    dotClass: string;
  }
> = {
  [NEWS_ARTICLE_STATUS.PUBLISHED]: {
    label: "Đã xuất bản",
    badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200",
    dotClass: "bg-emerald-500",
  },
  [NEWS_ARTICLE_STATUS.SCHEDULED]: {
    label: "Đang hẹn giờ",
    badgeClass: "bg-sky-50 text-sky-700 border-sky-200",
    dotClass: "bg-sky-500",
  },
  [NEWS_ARTICLE_STATUS.DRAFT]: {
    label: "Bản nháp",
    badgeClass: "bg-amber-50 text-amber-700 border-amber-200",
    dotClass: "bg-amber-500",
  },
  [NEWS_ARTICLE_STATUS.UNPUBLISHED]: {
    label: "Đã ẩn",
    badgeClass: "bg-slate-100 text-slate-600 border-slate-200",
    dotClass: "bg-slate-400",
  },
};

export function formatRelativeTimeVi(value?: Date | string | null): string {
  if (!value) return "";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const diffMs = Date.now() - date.getTime();
  if (diffMs < 60_000) return "Vừa đọc xong";

  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 60) return `Đọc ${minutes} phút trước`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `Đọc ${hours} giờ trước`;

  const days = Math.floor(hours / 24);
  if (days < 30) return `Đọc ${days} ngày trước`;

  return `Đọc ngày ${date.toLocaleDateString("vi-VN")}`;
}

export function computeNewsPopularScore(article: {
  viewCount?: number;
  bookmarkCount?: number;
  shareCount?: number;
}): number {
  const views = article.viewCount || 0;
  const bookmarks = article.bookmarkCount || 0;
  const shares = article.shareCount || 0;
  return views + bookmarks * 3 + shares * 2;
}

