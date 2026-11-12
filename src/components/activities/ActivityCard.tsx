"use client";

import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Bookmark,
  BookmarkCheck,
  Building2,
  CalendarClock,
  CalendarDays,
  Eye,
  Globe2,
  Loader2,
  MapPin,
  Sparkles,
  Users,
} from "lucide-react";
import {
  ACTIVITY_COMPUTED_STATUS_META,
  formatCountdownText,
  formatVietnamDate,
  getCategoryColorClasses,
} from "@/lib/activity-utils";
import { isSafeMediaUrl } from "@/lib/orientation-utils";
import type { IStudentActivitySummary } from "@/types";

interface ActivityCardProps {
  activity: IStudentActivitySummary;
  onToggleFollow?: (activityId: string, currentlyFollowed: boolean) => void;
  togglingFollow?: boolean;
}

export function ActivityCard({
  activity,
  onToggleFollow,
  togglingFollow = false,
}: ActivityCardProps) {
  const hasValidCover =
    Boolean(activity.coverImage) && isSafeMediaUrl(activity.coverImage);
  const categoryColors = getCategoryColorClasses(activity.category?.colorToken);
  const statusMeta = ACTIVITY_COMPUTED_STATUS_META[activity.computedStatus];
  const deadlineCountdown = formatCountdownText(activity.deadline);
  const isFollowed = Boolean(activity.isFollowedByMe);

  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-2xs transition-all hover:border-blue-200 hover:shadow-md">
      {/* Cover Banner / Fallback Gradient */}
      <Link
        href={`/activities/${activity.slug}`}
        className="relative block aspect-[16/9] w-full overflow-hidden bg-slate-100"
      >
        {hasValidCover && activity.coverImage ? (
          <Image
            src={activity.coverImage}
            alt={activity.title}
            fill
            unoptimized
            className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          />
        ) : (
          <div
            className={`flex h-full w-full flex-col justify-between bg-gradient-to-br ${categoryColors.gradientClass} p-4 text-white`}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="inline-flex items-center gap-1 rounded-full bg-white/20 px-2.5 py-0.5 text-[11px] font-semibold backdrop-blur-xs">
                {activity.category?.name || "Hoạt động sinh viên"}
              </span>
            </div>
            <p className="line-clamp-2 text-sm font-bold leading-snug text-white/95">
              {activity.title}
            </p>
          </div>
        )}

        {/* Featured & Dynamic Status Badges */}
        <div className="absolute top-2.5 right-2.5 flex flex-wrap items-center justify-end gap-1.5 max-w-[85%]">
          {activity.isFeatured && (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-400/95 px-2.5 py-0.5 text-[11px] font-bold text-slate-900 shadow-xs">
              <Sparkles className="h-3 w-3" />
              Nổi bật
            </span>
          )}
          <span
            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold shadow-xs ${statusMeta.badgeClass}`}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${statusMeta.dotClass}`} />
            {statusMeta.label}
          </span>
        </div>
      </Link>

      {/* Body */}
      <div className="flex flex-1 flex-col justify-between p-4 space-y-3">
        <div className="space-y-2.5">
          {/* Category + Scope */}
          <div className="flex flex-wrap items-center gap-1.5">
            {activity.category && (
              <Link
                href={`/activities?category=${activity.category.slug}`}
                className={`rounded-md border px-2 py-0.5 text-[11px] font-semibold transition-opacity hover:opacity-90 ${categoryColors.pillClass}`}
              >
                {activity.category.name}
              </Link>
            )}
            <span className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] font-medium text-slate-600">
              <Globe2 className="h-3 w-3 text-slate-400" />
              {activity.isDomestic ? "Trong nước" : "Quốc tế"}
            </span>
          </div>

          {/* Title & Summary */}
          <div>
            <Link href={`/activities/${activity.slug}`}>
              <h3 className="line-clamp-2 text-base font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                {activity.title}
              </h3>
            </Link>
            <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-slate-500">
              {activity.summary}
            </p>
          </div>

          {/* Organizer & Location */}
          {(activity.organizer || activity.location) && (
            <div className="space-y-1 pt-1 text-[11px] text-slate-500">
              {activity.organizer && (
                <p className="flex items-center gap-1.5 truncate">
                  <Building2 className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                  <span className="truncate">{activity.organizer}</span>
                </p>
              )}
              {activity.location && (
                <p className="flex items-center gap-1.5 truncate">
                  <MapPin className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                  <span className="truncate">{activity.location}</span>
                </p>
              )}
            </div>
          )}

          {/* Timing Pills */}
          <div className="space-y-1.5 rounded-xl bg-slate-50/90 p-2.5 text-[11px]">
            {activity.deadline && (
              <div className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-1.5 font-medium text-slate-600">
                  <CalendarClock className="h-3.5 w-3.5 text-rose-500" />
                  Hạn đăng ký: {formatVietnamDate(activity.deadline)}
                </span>
                {deadlineCountdown && (
                  <span
                    className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold ${
                      deadlineCountdown.expired
                        ? "bg-slate-200/70 text-slate-500"
                        : deadlineCountdown.urgent
                        ? "bg-rose-100 text-rose-700"
                        : "bg-blue-100 text-blue-700"
                    }`}
                  >
                    {deadlineCountdown.text}
                  </span>
                )}
              </div>
            )}

            {activity.eventDate && (
              <div className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-1.5 font-medium text-slate-600">
                  <CalendarDays className="h-3.5 w-3.5 text-blue-500" />
                  Sự kiện: {formatVietnamDate(activity.eventDate)}
                </span>
              </div>
            )}

            {!activity.deadline && !activity.eventDate && (
              <div className="flex items-center gap-1.5 text-slate-500">
                <CalendarDays className="h-3.5 w-3.5 text-slate-400" />
                <span>Lịch cụ thể đang cập nhật</span>
              </div>
            )}
          </div>
        </div>

        {/* Footer: Metrics + Follow Button */}
        <div className="flex items-center justify-between gap-2 border-t border-slate-100 pt-3">
          <div className="flex items-center gap-3 text-[11px] text-slate-500">
            <span className="inline-flex items-center gap-1 font-medium">
              <Users className="h-3.5 w-3.5 text-slate-400" />
              {activity.followerCount}
            </span>
            <span className="inline-flex items-center gap-1">
              <Eye className="h-3.5 w-3.5 text-slate-400" />
              {activity.viewCount}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {onToggleFollow && (
              <button
                type="button"
                disabled={togglingFollow}
                onClick={() => onToggleFollow(activity._id, isFollowed)}
                className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[11px] font-semibold transition-all cursor-pointer disabled:opacity-60 ${
                  isFollowed
                    ? "border-blue-600 bg-blue-600 text-white hover:bg-blue-700"
                    : "border-slate-200 bg-white text-slate-700 hover:border-blue-300 hover:text-blue-600"
                }`}
              >
                {togglingFollow ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : isFollowed ? (
                  <BookmarkCheck className="h-3.5 w-3.5" />
                ) : (
                  <Bookmark className="h-3.5 w-3.5" />
                )}
                <span>{isFollowed ? "Đang quan tâm" : "Quan tâm"}</span>
              </button>
            )}

            <Link
              href={`/activities/${activity.slug}`}
              className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-2.5 py-1.5 text-[11px] font-semibold text-slate-700 hover:bg-blue-50 hover:text-blue-700 transition-colors"
            >
              <span>Chi tiết</span>
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}

