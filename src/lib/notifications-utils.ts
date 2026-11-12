/**
 * Pure client/server utilities for Module 06 (Notifications & Reminder Engine)
 */
import type { NotificationType, ReminderType } from "@/types";

const VN_TIMEZONE = "Asia/Ho_Chi_Minh";
const ONE_DAY_MS = 24 * 60 * 60 * 1000;

export interface NotificationTypeMeta {
  label: string;
  shortLabel: string;
  badgeClass: string;
  iconBgClass: string;
}

export const NOTIFICATION_TYPE_META: Record<
  NotificationType,
  NotificationTypeMeta
> = {
  DEADLINE_REMINDER: {
    label: "Nhắc hạn nộp",
    shortLabel: "Hạn nộp",
    badgeClass: "bg-rose-50 text-rose-700 border-rose-200",
    iconBgClass: "bg-rose-50 text-rose-600",
  },
  EVENT_REMINDER: {
    label: "Sự kiện sắp diễn ra",
    shortLabel: "Sự kiện",
    badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200",
    iconBgClass: "bg-emerald-50 text-emerald-600",
  },
  BOOKING_UPDATE: {
    label: "Lịch hẹn Mentor",
    shortLabel: "Mentor",
    badgeClass: "bg-sky-50 text-sky-700 border-sky-200",
    iconBgClass: "bg-sky-50 text-sky-600",
  },
  ROADMAP_UPDATE: {
    label: "Lộ trình cá nhân",
    shortLabel: "Lộ trình",
    badgeClass: "bg-indigo-50 text-indigo-700 border-indigo-200",
    iconBgClass: "bg-indigo-50 text-indigo-600",
  },
  AI_ANALYSIS_READY: {
    label: "Phân tích AI",
    shortLabel: "AI Ready",
    badgeClass: "bg-purple-50 text-purple-700 border-purple-200",
    iconBgClass: "bg-purple-50 text-purple-600",
  },
  SYSTEM_ANNOUNCEMENT: {
    label: "Thông báo hệ thống",
    shortLabel: "Hệ thống",
    badgeClass: "bg-amber-50 text-amber-700 border-amber-200",
    iconBgClass: "bg-amber-50 text-amber-600",
  },
};

export interface VietnamDateParts {
  year: number;
  month: number;
  day: number;
  hour: string;
  minute: string;
  dateKey: string; // YYYYMMDD
  displayDate: string; // dd/MM/yyyy
  displayTime: string; // HH:mm
}

export function getVietnamDateParts(dateInput: Date | string): VietnamDateParts | null {
  const date = dateInput instanceof Date ? dateInput : new Date(dateInput);
  if (Number.isNaN(date.getTime())) return null;

  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: VN_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  });

  const parts = formatter.formatToParts(date);
  const pick = (type: string) =>
    parts.find((p) => p.type === type)?.value || "00";

  const yearStr = pick("year");
  const monthStr = pick("month");
  const dayStr = pick("day");
  const hourStr = pick("hour");
  const minuteStr = pick("minute");

  return {
    year: Number.parseInt(yearStr, 10),
    month: Number.parseInt(monthStr, 10),
    day: Number.parseInt(dayStr, 10),
    hour: hourStr,
    minute: minuteStr,
    dateKey: `${yearStr}${monthStr}${dayStr}`,
    displayDate: `${dayStr}/${monthStr}/${yearStr}`,
    displayTime: `${hourStr}:${minuteStr}`,
  };
}

/**
 * Tính số ngày lịch chênh lệch theo múi giờ chuẩn Asia/Ho_Chi_Minh (UTC+7).
 */
export function differenceInVietnamCalendarDays(
  targetDateInput: Date | string,
  baseDateInput: Date | string = new Date()
): number | null {
  const target = getVietnamDateParts(targetDateInput);
  const base = getVietnamDateParts(baseDateInput);
  if (!target || !base) return null;

  const targetUtcMid = Date.UTC(target.year, target.month - 1, target.day);
  const baseUtcMid = Date.UTC(base.year, base.month - 1, base.day);
  return Math.round((targetUtcMid - baseUtcMid) / ONE_DAY_MS);
}

export function buildReminderCopy(params: {
  reminderType: ReminderType;
  offsetDays: number;
  activityTitle: string;
  targetDate: Date;
  location?: string;
}): {
  notificationType: NotificationType;
  title: string;
  message: string;
  badgeLabel: string;
  targetDateKey: string;
} {
  const { reminderType, offsetDays, activityTitle, targetDate, location } =
    params;
  const parts = getVietnamDateParts(targetDate);
  const displayDate = parts?.displayDate || "";
  const displayTime = parts?.displayTime || "08:00";
  const targetDateKey = parts?.dateKey || "";

  if (reminderType === "DEADLINE") {
    if (offsetDays === 30) {
      return {
        notificationType: "DEADLINE_REMINDER",
        title: `Còn 1 tháng tới hạn nộp: ${activityTitle}`,
        message: `Hạn chót đăng ký là ngày ${displayDate}. Hãy kiểm tra hồ sơ và chuẩn bị sớm!`,
        badgeLabel: "Nhắc hạn nộp · Trước 1 tháng",
        targetDateKey,
      };
    }
    if (offsetDays === 7) {
      return {
        notificationType: "DEADLINE_REMINDER",
        title: `Còn 1 tuần tới hạn nộp: ${activityTitle}`,
        message: `Chỉ còn 7 ngày nữa là đóng đơn vào ${displayDate}.`,
        badgeLabel: "Nhắc hạn nộp · Trước 1 tuần",
        targetDateKey,
      };
    }
    return {
      notificationType: "DEADLINE_REMINDER",
      title: `Sắp hết hạn (Ngày mai): ${activityTitle}`,
      message: `Hạn chót là ngày mai (${displayDate}). Đừng bỏ lỡ cơ hội bạn đã quan tâm!`,
      badgeLabel: "Nhắc hạn nộp · Ngày mai",
      targetDateKey,
    };
  }

  const prefixLabel =
    offsetDays === 30
      ? "Còn 1 tháng diễn ra"
      : offsetDays === 7
        ? "Còn 1 tuần diễn ra"
        : "Ngày mai diễn ra";

  return {
    notificationType: "EVENT_REMINDER",
    title: `${prefixLabel}: ${activityTitle}`,
    message: `Chương trình sẽ diễn ra vào ${displayDate} lúc ${displayTime}${
      location ? ` tại ${location}` : ""
    }.`,
    badgeLabel: `Nhắc sự kiện · ${prefixLabel}`,
    targetDateKey,
  };
}

export function formatNotificationRelativeTimeVi(
  value?: Date | string | null
): string {
  if (!value) return "";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const diffMs = Date.now() - date.getTime();
  if (diffMs < 60_000) return "Vừa xong";

  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 60) return `${minutes} phút trước`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} giờ trước`;

  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} ngày trước`;

  return date.toLocaleDateString("vi-VN");
}

export const SYSTEM_NOTIFICATION_TYPES: NotificationType[] = [
  "BOOKING_UPDATE",
  "ROADMAP_UPDATE",
  "AI_ANALYSIS_READY",
  "SYSTEM_ANNOUNCEMENT",
];

/**
 * Chuẩn hóa query `type` từ Sidebar / Notification Center thành danh sách enum Mongo.
 */
export function resolveNotificationTypeFilter(
  rawType?: string | null
): NotificationType[] | null {
  const key = (rawType || "").trim();
  if (!key || key.toUpperCase() === "ALL") return null;

  const upper = key.toUpperCase();
  if (upper === "DEADLINE_REMINDER" || key === "closing" || key === "opened") {
    return ["DEADLINE_REMINDER"];
  }
  if (upper === "EVENT_REMINDER" || key === "upcoming") {
    return ["EVENT_REMINDER"];
  }
  if (upper === "SYSTEM" || key === "jobs") {
    return SYSTEM_NOTIFICATION_TYPES;
  }
  if (
    upper === "BOOKING_UPDATE" ||
    upper === "ROADMAP_UPDATE" ||
    upper === "AI_ANALYSIS_READY" ||
    upper === "SYSTEM_ANNOUNCEMENT"
  ) {
    return [upper as NotificationType];
  }
  return null;
}

