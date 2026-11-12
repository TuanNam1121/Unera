/**
 * Pure client/server utilities for Module 04 (Student Activities)
 */
import {
  ACTIVITY_COMPUTED_STATUS,
  ACTIVITY_PUBLISH_STATUS,
  type ActivityComputedStatus,
  type ActivityPublishStatus,
} from "@/constants";

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
const ONE_HOUR_MS = 60 * 60 * 1000;
const ONE_DAY_MS = 24 * ONE_HOUR_MS;

function toValidDate(value?: Date | string | null): Date | null {
  if (!value) return null;
  const parsed = value instanceof Date ? value : new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export interface ActivityTimingInput {
  manualClosed?: boolean;
  openingDate?: Date | string | null;
  deadline?: Date | string | null;
  eventDate?: Date | string | null;
  eventEndDate?: Date | string | null;
}

/**
 * Tính trạng thái động theo thời gian thực của một hoạt động sinh viên (SA08).
 */
export function computeActivityStatus(
  activity: ActivityTimingInput,
  now: Date = new Date()
): ActivityComputedStatus {
  if (activity.manualClosed) {
    return ACTIVITY_COMPUTED_STATUS.CLOSED;
  }

  const nowMs = now.getTime();
  const openingDate = toValidDate(activity.openingDate);
  const deadline = toValidDate(activity.deadline);
  const eventDate = toValidDate(activity.eventDate);
  const eventEndDate = toValidDate(activity.eventEndDate);

  const terminalDates = [deadline, eventDate, eventEndDate].filter(
    (d): d is Date => d !== null
  );

  if (terminalDates.length > 0) {
    const latestTerminalMs = Math.max(...terminalDates.map((d) => d.getTime()));
    if (latestTerminalMs < nowMs) {
      return ACTIVITY_COMPUTED_STATUS.EXPIRED;
    }
  }

  if (openingDate && openingDate.getTime() > nowMs) {
    return ACTIVITY_COMPUTED_STATUS.UPCOMING_OPEN;
  }

  if (deadline) {
    const diff = deadline.getTime() - nowMs;
    if (diff >= 0 && diff <= SEVEN_DAYS_MS) {
      return ACTIVITY_COMPUTED_STATUS.CLOSING_SOON;
    }
  }

  if (eventDate) {
    const diff = eventDate.getTime() - nowMs;
    if (diff >= 0 && diff <= SEVEN_DAYS_MS) {
      return ACTIVITY_COMPUTED_STATUS.EVENT_SOON;
    }
  }

  if (deadline && deadline.getTime() < nowMs) {
    return ACTIVITY_COMPUTED_STATUS.CLOSED;
  }

  return ACTIVITY_COMPUTED_STATUS.OPEN;
}

export const ACTIVITY_COMPUTED_STATUS_META: Record<
  ActivityComputedStatus,
  {
    label: string;
    shortLabel: string;
    badgeClass: string;
    dotClass: string;
  }
> = {
  OPEN: {
    label: "Đang mở đăng ký",
    shortLabel: "Đang mở",
    badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200",
    dotClass: "bg-emerald-500",
  },
  CLOSING_SOON: {
    label: "Sắp đóng đơn",
    shortLabel: "Sắp hết hạn",
    badgeClass: "bg-rose-50 text-rose-700 border-rose-200",
    dotClass: "bg-rose-500",
  },
  EVENT_SOON: {
    label: "Sự kiện sắp diễn ra",
    shortLabel: "Sắp diễn ra",
    badgeClass: "bg-amber-50 text-amber-700 border-amber-200",
    dotClass: "bg-amber-500",
  },
  UPCOMING_OPEN: {
    label: "Sắp mở đơn",
    shortLabel: "Sắp mở",
    badgeClass: "bg-sky-50 text-sky-700 border-sky-200",
    dotClass: "bg-sky-500",
  },
  CLOSED: {
    label: "Đã đóng đăng ký",
    shortLabel: "Đã đóng",
    badgeClass: "bg-slate-100 text-slate-600 border-slate-200",
    dotClass: "bg-slate-400",
  },
  EXPIRED: {
    label: "Đã kết thúc",
    shortLabel: "Đã qua hạn",
    badgeClass: "bg-slate-100 text-slate-500 border-slate-200",
    dotClass: "bg-slate-400",
  },
};

export const ACTIVITY_PUBLISH_STATUS_META: Record<
  ActivityPublishStatus,
  {
    label: string;
    badgeClass: string;
  }
> = {
  [ACTIVITY_PUBLISH_STATUS.PUBLISHED]: {
    label: "Đã xuất bản",
    badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  [ACTIVITY_PUBLISH_STATUS.DRAFT]: {
    label: "Bản nháp",
    badgeClass: "bg-amber-50 text-amber-700 border-amber-200",
  },
  [ACTIVITY_PUBLISH_STATUS.UNPUBLISHED]: {
    label: "Đã ẩn",
    badgeClass: "bg-slate-100 text-slate-600 border-slate-200",
  },
};

export const ACTIVITY_CATEGORY_COLOR_MAP: Record<
  string,
  {
    label: string;
    pillClass: string;
    gradientClass: string;
  }
> = {
  blue: {
    label: "Xanh dương",
    pillClass: "bg-blue-50 text-blue-700 border-blue-200",
    gradientClass: "from-blue-600 via-indigo-600 to-sky-500",
  },
  emerald: {
    label: "Xanh ngọc",
    pillClass: "bg-emerald-50 text-emerald-700 border-emerald-200",
    gradientClass: "from-emerald-600 via-teal-600 to-cyan-500",
  },
  purple: {
    label: "Tím",
    pillClass: "bg-purple-50 text-purple-700 border-purple-200",
    gradientClass: "from-violet-600 via-purple-600 to-fuchsia-500",
  },
  amber: {
    label: "Vàng hổ phách",
    pillClass: "bg-amber-50 text-amber-700 border-amber-200",
    gradientClass: "from-amber-500 via-orange-500 to-rose-500",
  },
  rose: {
    label: "Hồng đỏ",
    pillClass: "bg-rose-50 text-rose-700 border-rose-200",
    gradientClass: "from-rose-600 via-pink-600 to-orange-500",
  },
  cyan: {
    label: "Xanh lơ",
    pillClass: "bg-cyan-50 text-cyan-700 border-cyan-200",
    gradientClass: "from-cyan-600 via-sky-600 to-blue-600",
  },
  indigo: {
    label: "Chàm",
    pillClass: "bg-indigo-50 text-indigo-700 border-indigo-200",
    gradientClass: "from-indigo-600 via-blue-700 to-violet-600",
  },
  teal: {
    label: "Xanh vịt",
    pillClass: "bg-teal-50 text-teal-700 border-teal-200",
    gradientClass: "from-teal-600 via-emerald-600 to-green-500",
  },
};

export function getCategoryColorClasses(colorToken?: string) {
  return (
    ACTIVITY_CATEGORY_COLOR_MAP[colorToken || "blue"] ||
    ACTIVITY_CATEGORY_COLOR_MAP.blue
  );
}

export function formatCountdownText(
  value?: Date | string | null,
  now: Date = new Date()
): { text: string; urgent: boolean; expired: boolean } | null {
  const date = toValidDate(value);
  if (!date) return null;

  const diffMs = date.getTime() - now.getTime();
  if (diffMs < 0) {
    return { text: "Đã qua hạn", urgent: false, expired: true };
  }
  if (diffMs < ONE_DAY_MS) {
    const hours = Math.max(1, Math.ceil(diffMs / ONE_HOUR_MS));
    return { text: `Còn ${hours} giờ`, urgent: true, expired: false };
  }
  const days = Math.ceil(diffMs / ONE_DAY_MS);
  return {
    text: `Còn ${days} ngày`,
    urgent: days <= 7,
    expired: false,
  };
}

export function formatVietnamDateTime(value?: Date | string | null): string {
  const date = toValidDate(value);
  if (!date) return "Chưa ấn định";
  return date.toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatVietnamDate(value?: Date | string | null): string {
  const date = toValidDate(value);
  if (!date) return "Chưa ấn định";
  return date.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function toDateTimeLocalValue(value?: Date | string | null): string {
  const date = toValidDate(value);
  if (!date) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
    date.getDate()
  )}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

