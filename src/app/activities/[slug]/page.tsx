"use client";

import { Suspense, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Bell,
  Bookmark,
  BookmarkCheck,
  Building2,
  CalendarCheck,
  CalendarClock,
  CalendarDays,
  CheckCircle2,
  ExternalLink,
  Eye,
  Globe2,
  Loader2,
  MapPin,
  Sparkles,
  Tag,
  Users,
} from "lucide-react";
import { ActivityCard } from "@/components/activities/ActivityCard";
import { TiptapContentRenderer } from "@/components/content/TiptapContentRenderer";
import { fetchWithAuth, useAuth } from "@/components/providers/AuthProvider";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ACTIVITY_COMPUTED_STATUS } from "@/constants";
import {
  ACTIVITY_COMPUTED_STATUS_META,
  formatCountdownText,
  formatVietnamDateTime,
  getCategoryColorClasses,
} from "@/lib/activity-utils";
import { isSafeMediaUrl } from "@/lib/orientation-utils";
import type { IStudentActivityDetail, IStudentActivitySummary } from "@/types";

function ActivityDetailContent() {
  const params = useParams<{ slug: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const slug = params?.slug || "";

  const [activity, setActivity] = useState<IStudentActivityDetail | null>(null);
  const [relatedActivities, setRelatedActivities] = useState<
    IStudentActivitySummary[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [notFoundError, setNotFoundError] = useState(false);
  const [togglingFollow, setTogglingFollow] = useState(false);
  const [savingPref, setSavingPref] = useState(false);
  const [togglingRelatedId, setTogglingRelatedId] = useState<string | null>(null);
  const [feedbackMsg, setFeedbackMsg] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadDetail() {
      if (!slug) return;
      setLoading(true);
      setNotFoundError(false);

      try {
        const res = await fetchWithAuth(
          `/api/activities/${encodeURIComponent(slug)}`,
          { cache: "no-store" }
        );
        if (res.status === 404) {
          if (!cancelled) setNotFoundError(true);
          return;
        }
        const data = await res.json();
        if (!cancelled && res.ok && data.activity) {
          setActivity(data.activity);
          setRelatedActivities(
            Array.isArray(data.relatedActivities) ? data.relatedActivities : []
          );
        } else if (!cancelled) {
          setNotFoundError(true);
        }
      } catch {
        if (!cancelled) setNotFoundError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadDetail();
    return () => {
      cancelled = true;
    };
  }, [slug]);

  const handleToggleFollow = async () => {
    if (!activity) return;
    if (!user) {
      router.push(
        `/login?callbackUrl=${encodeURIComponent(`/activities/${activity.slug}`)}`
      );
      return;
    }

    const currentlyFollowed = Boolean(activity.isFollowedByMe);
    setTogglingFollow(true);
    setFeedbackMsg("");

    try {
      const res = await fetchWithAuth(`/api/activities/${activity._id}/follow`, {
        method: currentlyFollowed ? "DELETE" : "POST",
      });
      const data = await res.json();
      if (res.ok) {
        setActivity((prev) =>
          prev
            ? {
                ...prev,
                isFollowedByMe: Boolean(data.isFollowed),
                followerCount:
                  typeof data.followerCount === "number"
                    ? data.followerCount
                    : prev.followerCount,
                followPreferences: data.isFollowed
                  ? data.followPreferences || {
                      notifyDeadline: true,
                      notifyEvent: true,
                    }
                  : null,
              }
            : null
        );
      } else {
        setFeedbackMsg(data.error || "Không thể cập nhật trạng thái quan tâm");
      }
    } catch {
      setFeedbackMsg("Lỗi kết nối máy chủ.");
    } finally {
      setTogglingFollow(false);
    }
  };

  const handleTogglePreference = async (
    key: "notifyDeadline" | "notifyEvent"
  ) => {
    if (!activity || !activity.isFollowedByMe || !activity.followPreferences) {
      return;
    }
    const nextValue = !activity.followPreferences[key];
    setSavingPref(true);
    try {
      const res = await fetchWithAuth(`/api/activities/${activity._id}/follow`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [key]: nextValue }),
      });
      const data = await res.json();
      if (res.ok && data.followPreferences) {
        setActivity((prev) =>
          prev ? { ...prev, followPreferences: data.followPreferences } : null
        );
      }
    } finally {
      setSavingPref(false);
    }
  };

  const handleToggleRelatedFollow = async (
    relatedId: string,
    currentlyFollowed: boolean
  ) => {
    if (!user) {
      router.push(
        `/login?callbackUrl=${encodeURIComponent(`/activities/${slug}`)}`
      );
      return;
    }
    setTogglingRelatedId(relatedId);
    try {
      const res = await fetchWithAuth(`/api/activities/${relatedId}/follow`, {
        method: currentlyFollowed ? "DELETE" : "POST",
      });
      const data = await res.json();
      if (res.ok) {
        setRelatedActivities((prev) =>
          prev.map((item) =>
            item._id === relatedId
              ? {
                  ...item,
                  isFollowedByMe: Boolean(data.isFollowed),
                  followerCount:
                    typeof data.followerCount === "number"
                      ? data.followerCount
                      : item.followerCount,
                }
              : item
          )
        );
      }
    } finally {
      setTogglingRelatedId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (notFoundError || !activity) {
    return (
      <div className="w-full px-3 sm:px-4 lg:px-5 py-16 text-center space-y-4">
        <h1 className="text-2xl font-bold text-slate-900">
          Không tìm thấy hoạt động sinh viên
        </h1>
        <p className="text-sm text-slate-500">
          Hoạt động này có thể đã được ẩn hoặc đường dẫn không còn tồn tại.
        </p>
        <Link href="/activities" className={buttonVariants({ className: "rounded-xl" })}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Quay lại Hoạt động sinh viên
        </Link>
      </div>
    );
  }

  const statusMeta = ACTIVITY_COMPUTED_STATUS_META[activity.computedStatus];
  const categoryColors = getCategoryColorClasses(activity.category?.colorToken);
  const deadlineCountdown = formatCountdownText(activity.deadline);
  const eventCountdown = formatCountdownText(activity.eventDate);
  const isClosedOrExpired =
    activity.computedStatus === ACTIVITY_COMPUTED_STATUS.CLOSED ||
    activity.computedStatus === ACTIVITY_COMPUTED_STATUS.EXPIRED;
  const hasValidCover =
    Boolean(activity.coverImage) && isSafeMediaUrl(activity.coverImage);

  const highlightBlocks = [
    { label: "Đối tượng tham gia", value: activity.eligibility },
    { label: "Yêu cầu hồ sơ / điều kiện", value: activity.requirements },
    { label: "Quyền lợi / Giải thưởng", value: activity.benefits },
    { label: "Hướng dẫn đăng ký", value: activity.applicationInstructions },
  ].filter((item) => Boolean(item.value && item.value.trim()));

  return (
    <div className="w-full px-3 sm:px-4 lg:px-5 py-4 sm:py-5 space-y-6">
      {/* Breadcrumb */}
      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
        <Link
          href="/activities"
          className="inline-flex items-center gap-1 font-medium hover:text-blue-600"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Hoạt động sinh viên
        </Link>
        {activity.category && (
          <>
            <span>/</span>
            <Link
              href={`/activities?category=${activity.category.slug}`}
              className="font-medium hover:text-blue-600"
            >
              {activity.category.name}
            </Link>
          </>
        )}
        <span>/</span>
        <span className="font-semibold text-slate-700 truncate max-w-[260px] sm:max-w-[460px] lg:max-w-none">
          {activity.title}
        </span>
      </div>

      {/* Main 2-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left Main Article Column */}
        <div className="lg:col-span-8 xl:col-span-9 space-y-5">
          <div className="rounded-3xl border border-slate-200/90 bg-white overflow-hidden shadow-xs">
            {hasValidCover && activity.coverImage && (
              <div className="relative aspect-[16/9] md:aspect-[21/9] max-h-[420px] w-full bg-slate-100">
                <Image
                  src={activity.coverImage}
                  alt={activity.title}
                  fill
                  unoptimized
                  className="object-cover"
                />
              </div>
            )}

            <div className="p-4 sm:p-6 lg:p-7 space-y-5">
              {/* Top Badges */}
              <div className="flex flex-wrap items-center gap-2">
                {activity.category && (
                  <Link
                    href={`/activities?category=${activity.category.slug}`}
                    className={`rounded-full border px-3 py-1 text-xs font-semibold ${categoryColors.pillClass}`}
                  >
                    {activity.category.name}
                  </Link>
                )}

                <span
                  className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${statusMeta.badgeClass}`}
                >
                  <span
                    className={`h-2 w-2 rounded-full ${statusMeta.dotClass}`}
                  />
                  {statusMeta.label}
                </span>

                <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600">
                  <Globe2 className="h-3.5 w-3.5 text-slate-400" />
                  {activity.isDomestic ? "Trong nước" : "Quốc tế"}
                </span>

                {activity.isFeatured && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-800">
                    <Sparkles className="h-3.5 w-3.5" />
                    Nổi bật
                  </span>
                )}
              </div>

              {/* Title & Lead Summary */}
              <div className="space-y-3">
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 leading-snug">
                  {activity.title}
                </h1>
                <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
                  {activity.summary}
                </p>
              </div>

              {/* Metadata Strip */}
              <div className="flex flex-wrap items-center gap-x-5 gap-y-2 border-y border-slate-100 py-3 text-xs text-slate-500">
                {activity.organizer && (
                  <span className="inline-flex items-center gap-1.5 font-medium text-slate-700">
                    <Building2 className="h-4 w-4 text-blue-500" />
                    {activity.organizer}
                  </span>
                )}
                {activity.location && (
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin className="h-4 w-4 text-slate-400" />
                    {activity.location}
                  </span>
                )}
                <span className="inline-flex items-center gap-1.5">
                  <Users className="h-4 w-4 text-slate-400" />
                  {activity.followerCount} lượt quan tâm
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Eye className="h-4 w-4 text-slate-400" />
                  {activity.viewCount} lượt xem
                </span>
              </div>

              {/* Structured Summary Cards (if provided) */}
              {highlightBlocks.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {highlightBlocks.map((block) => (
                    <div
                      key={block.label}
                      className="rounded-2xl border border-slate-200/80 bg-slate-50/70 p-4 space-y-1"
                    >
                      <p className="text-[11px] font-bold uppercase tracking-wider text-blue-700">
                        {block.label}
                      </p>
                      <p className="text-xs leading-relaxed text-slate-700 whitespace-pre-line">
                        {block.value}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {/* Rich Tiptap Content Body */}
              <div className="pt-2">
                <TiptapContentRenderer contentJson={activity.contentJson} />
              </div>

              {/* Tags */}
              {activity.tags && activity.tags.length > 0 && (
                <div className="flex flex-wrap items-center gap-2 border-t border-slate-100 pt-5">
                  <Tag className="h-4 w-4 text-slate-400" />
                  {activity.tags.map((tag) => (
                    <Link
                      key={tag}
                      href={`/activities?q=${encodeURIComponent(tag)}`}
                      className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600 hover:bg-blue-50 hover:text-blue-700 transition-colors"
                    >
                      #{tag}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Sticky Action & Timeline Column */}
        <div className="lg:col-span-4 xl:col-span-3 space-y-5 lg:sticky lg:top-20">
          <Card className="rounded-3xl border-slate-200/90 shadow-xs bg-white">
            <CardContent className="p-4 sm:p-5 space-y-4">
              <div className="space-y-2.5">
                <Button
                  type="button"
                  disabled={togglingFollow}
                  onClick={handleToggleFollow}
                  className={`w-full rounded-xl py-5 text-sm font-bold shadow-xs ${
                    activity.isFollowedByMe
                      ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                      : "bg-blue-600 hover:bg-blue-700 text-white"
                  }`}
                >
                  {togglingFollow ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : activity.isFollowedByMe ? (
                    <BookmarkCheck className="mr-2 h-4 w-4" />
                  ) : (
                    <Bookmark className="mr-2 h-4 w-4" />
                  )}
                  {activity.isFollowedByMe
                    ? `Đang quan tâm (${activity.followerCount})`
                    : `Quan tâm hoạt động (${activity.followerCount})`}
                </Button>

                {activity.registrationUrl &&
                  isSafeMediaUrl(activity.registrationUrl) && (
                    <a
                      href={activity.registrationUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={buttonVariants({
                        variant: "outline",
                        className:
                          "w-full rounded-xl py-5 text-xs font-semibold justify-center",
                      })}
                    >
                      <ExternalLink className="mr-2 h-4 w-4" />
                      {isClosedOrExpired
                        ? "Xem trang thông tin gốc"
                        : "Đi tới cổng đăng ký chính thức"}
                    </a>
                  )}
              </div>

              {feedbackMsg && (
                <p className="text-xs font-medium text-red-600">{feedbackMsg}</p>
              )}

              {/* Reminder preferences when followed */}
              {activity.isFollowedByMe && activity.followPreferences && (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4 space-y-2.5">
                  <div className="flex items-center gap-2 text-xs font-bold text-emerald-800">
                    <Bell className="h-4 w-4" />
                    <span>Nhắc nhở tự động cho bạn</span>
                  </div>
                  <label className="flex items-center justify-between gap-2 text-xs text-slate-700 cursor-pointer">
                    <span>Nhắc trước hạn chót (30 / 7 / 1 ngày)</span>
                    <input
                      type="checkbox"
                      disabled={savingPref}
                      checked={activity.followPreferences.notifyDeadline}
                      onChange={() => handleTogglePreference("notifyDeadline")}
                      className="h-4 w-4 rounded border-slate-300 text-blue-600"
                    />
                  </label>
                  <label className="flex items-center justify-between gap-2 text-xs text-slate-700 cursor-pointer">
                    <span>Nhắc trước ngày diễn ra sự kiện</span>
                    <input
                      type="checkbox"
                      disabled={savingPref}
                      checked={activity.followPreferences.notifyEvent}
                      onChange={() => handleTogglePreference("notifyEvent")}
                      className="h-4 w-4 rounded border-slate-300 text-blue-600"
                    />
                  </label>
                  <Link
                    href="/activities?tab=followed"
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 hover:underline pt-1"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Xem tất cả hoạt động đã quan tâm
                  </Link>
                </div>
              )}

              {/* Timeline Card */}
              <div className="space-y-3 border-t border-slate-100 pt-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Mốc thời gian quan trọng
                </h3>

                <div className="space-y-3 text-xs">
                  {activity.openingDate && (
                    <div className="flex items-start gap-2.5">
                      <CalendarCheck className="h-4 w-4 shrink-0 text-emerald-600 mt-0.5" />
                      <div>
                        <p className="font-semibold text-slate-800">
                          Ngày mở đơn
                        </p>
                        <p className="text-slate-500">
                          {formatVietnamDateTime(activity.openingDate)}
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="flex items-start gap-2.5">
                    <CalendarClock className="h-4 w-4 shrink-0 text-rose-500 mt-0.5" />
                    <div className="flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-semibold text-slate-800">
                          Hạn chót đăng ký
                        </p>
                        {deadlineCountdown && (
                          <span
                            className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${
                              deadlineCountdown.expired
                                ? "bg-slate-100 text-slate-500"
                                : deadlineCountdown.urgent
                                ? "bg-rose-100 text-rose-700"
                                : "bg-blue-100 text-blue-700"
                            }`}
                          >
                            {deadlineCountdown.text}
                          </span>
                        )}
                      </div>
                      <p className="text-slate-500">
                        {formatVietnamDateTime(activity.deadline)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <CalendarDays className="h-4 w-4 shrink-0 text-blue-600 mt-0.5" />
                    <div className="flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-semibold text-slate-800">
                          Thời gian diễn ra sự kiện
                        </p>
                        {eventCountdown && !eventCountdown.expired && (
                          <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-800">
                            {eventCountdown.text}
                          </span>
                        )}
                      </div>
                      <p className="text-slate-500">
                        {formatVietnamDateTime(activity.eventDate)}
                      </p>
                      {activity.eventEndDate && (
                        <p className="text-[11px] text-slate-400">
                          Đến: {formatVietnamDateTime(activity.eventEndDate)}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Related Activities */}
      {relatedActivities.length > 0 && (
        <section className="space-y-4 border-t border-slate-200/80 pt-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900">
              Hoạt động liên quan cùng danh mục
            </h2>
            <Link
              href={
                activity.category
                  ? `/activities?category=${activity.category.slug}`
                  : "/activities"
              }
              className="text-xs font-semibold text-blue-600 hover:underline"
            >
              Xem thêm
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {relatedActivities.map((rel) => (
              <ActivityCard
                key={rel._id}
                activity={rel}
                onToggleFollow={handleToggleRelatedFollow}
                togglingFollow={togglingRelatedId === rel._id}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

export default function StudentActivityDetailPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-96 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      }
    >
      <ActivityDetailContent />
    </Suspense>
  );
}

