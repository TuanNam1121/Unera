"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowRight,
  Bell,
  CheckCheck,
  CheckCircle2,
  Circle,
  Loader2,
  LogIn,
  Settings,
} from "lucide-react";
import { useAuth } from "@/components/providers/AuthProvider";
import { NotificationTypeIcon } from "@/components/notifications/NotificationBellDropdown";
import { Button, buttonVariants } from "@/components/ui/button";
import { formatVietnamDateTime } from "@/lib/activity-utils";
import {
  NOTIFICATION_TYPE_META,
  formatNotificationRelativeTimeVi,
} from "@/lib/notifications-utils";
import type { INotification } from "@/types";

type TabValue = "ALL" | "UNREAD" | "DEADLINE_REMINDER" | "EVENT_REMINDER" | "SYSTEM";

function resolveActiveTab(
  filterParam: string | null,
  typeParam: string | null
): TabValue {
  if (filterParam === "unread") return "UNREAD";
  const raw = (typeParam || "").trim();
  const upper = raw.toUpperCase();
  if (upper === "DEADLINE_REMINDER" || raw === "closing" || raw === "opened") {
    return "DEADLINE_REMINDER";
  }
  if (upper === "EVENT_REMINDER" || raw === "upcoming") {
    return "EVENT_REMINDER";
  }
  if (
    upper === "SYSTEM" ||
    upper === "BOOKING_UPDATE" ||
    upper === "ROADMAP_UPDATE" ||
    upper === "AI_ANALYSIS_READY" ||
    upper === "SYSTEM_ANNOUNCEMENT" ||
    raw === "jobs"
  ) {
    return "SYSTEM";
  }
  return "ALL";
}

export function NotificationCenterClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading: authLoading } = useAuth();

  const filterParam = searchParams.get("filter");
  const typeParam = searchParams.get("type");
  const pageParam = Math.max(
    1,
    parseInt(searchParams.get("page") || "1", 10) || 1
  );

  const activeTab = resolveActiveTab(filterParam, typeParam);

  const [notifications, setNotifications] = useState<INotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loadedKey, setLoadedKey] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [markingAll, setMarkingAll] = useState(false);

  const queryKey = user
    ? `${user.id}:${activeTab}:${pageParam}`
    : "unauthenticated";
  const loadingList = Boolean(user) && loadedKey !== queryKey;

  const fetchList = useCallback(async () => {
    if (!user) return;
    const params = new URLSearchParams();
    params.set("page", String(pageParam));
    params.set("limit", "20");
    if (activeTab === "UNREAD") {
      params.set("filter", "unread");
    } else if (activeTab !== "ALL") {
      params.set("type", activeTab);
    }

    try {
      const res = await fetch(`/api/notifications?${params.toString()}`, {
        cache: "no-store",
      });
      if (!res.ok) return;
      const data = await res.json();
      setNotifications(Array.isArray(data.notifications) ? data.notifications : []);
      setUnreadCount(typeof data.unreadCount === "number" ? data.unreadCount : 0);
      setTotal(typeof data.total === "number" ? data.total : 0);
      setTotalPages(typeof data.totalPages === "number" ? data.totalPages : 0);
    } finally {
      setLoadedKey(queryKey);
    }
  }, [user, activeTab, pageParam, queryKey]);

  useEffect(() => {
    if (!authLoading && user) {
      void fetchList();
    }
  }, [authLoading, user, fetchList]);

  useEffect(() => {
    const handleSync = () => {
      if (user) void fetchList();
    };
    window.addEventListener("unera:notifications-updated", handleSync);
    return () =>
      window.removeEventListener("unera:notifications-updated", handleSync);
  }, [user, fetchList]);

  const navigateTab = (tab: TabValue, nextPage = 1) => {
    const params = new URLSearchParams();
    if (tab === "UNREAD") {
      params.set("filter", "unread");
    } else if (tab !== "ALL") {
      params.set("type", tab);
    }
    if (nextPage > 1) {
      params.set("page", String(nextPage));
    }
    const qs = params.toString();
    router.push(qs ? `/notifications?${qs}` : "/notifications");
  };

  const handleToggleRead = async (item: INotification, nextIsRead: boolean) => {
    setBusyId(item._id);
    try {
      const res = await fetch(`/api/notifications/${item._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isRead: nextIsRead }),
      });
      if (!res.ok) return;
      const data = await res.json();
      setNotifications((prev) =>
        prev.map((row) =>
          row._id === item._id
            ? {
                ...row,
                isRead: nextIsRead,
                readAt: nextIsRead ? new Date().toISOString() : null,
              }
            : row
        )
      );
      if (typeof data.unreadCount === "number") {
        setUnreadCount(data.unreadCount);
      }
      window.dispatchEvent(new CustomEvent("unera:notifications-updated"));
    } finally {
      setBusyId(null);
    }
  };

  const handleOpenNotification = async (item: INotification) => {
    if (!item.isRead) {
      await handleToggleRead(item, true);
    }
    if (item.link) {
      router.push(item.link);
    }
  };

  const handleMarkAllRead = async () => {
    if (markingAll || unreadCount === 0) return;
    setMarkingAll(true);
    try {
      const res = await fetch("/api/notifications/read-all", {
        method: "PATCH",
      });
      if (!res.ok) return;
      setUnreadCount(0);
      const nowIso = new Date().toISOString();
      setNotifications((prev) =>
        prev.map((row) => ({ ...row, isRead: true, readAt: nowIso }))
      );
      window.dispatchEvent(new CustomEvent("unera:notifications-updated"));
    } finally {
      setMarkingAll(false);
    }
  };

  if (authLoading) {
    return (
      <div className="flex min-h-[360px] items-center justify-center gap-2 text-sm text-slate-500">
        <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
        <span>Đang tải Trung tâm thông báo...</span>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-2xl py-14 px-4 text-center space-y-4">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
          <Bell className="h-7 w-7" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">
          Trung tâm Thông báo &amp; Nhắc nhở UNERA
        </h2>
        <p className="text-sm text-slate-600">
          Vui lòng đăng nhập để theo dõi nhắc nhở hạn chót học bổng, sự kiện sắp diễn ra và cập nhật lộ trình cá nhân.
        </p>
        <div className="pt-2">
          <Link
            href="/login?redirect=/notifications"
            className={buttonVariants({
              className: "rounded-xl bg-blue-600 hover:bg-blue-700 text-white gap-2",
            })}
          >
            <LogIn className="h-4 w-4" />
            <span>Đăng nhập ngay</span>
          </Link>
        </div>
      </div>
    );
  }

  const tabs: Array<{ id: TabValue; label: string; count?: number }> = [
    { id: "ALL", label: "Tất cả" },
    { id: "UNREAD", label: "Chưa đọc", count: unreadCount },
    { id: "DEADLINE_REMINDER", label: "Nhắc hạn nộp (Deadline)" },
    { id: "EVENT_REMINDER", label: "Sự kiện sắp diễn ra" },
    { id: "SYSTEM", label: "Lộ trình & Hệ thống" },
  ];

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-2xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <Bell className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-bold text-slate-900">
                Trung tâm Thông báo &amp; Nhắc lịch
              </h1>
              <p className="text-xs text-slate-500">
                Theo dõi nhắc hẹn 1 tháng, 1 tuần, 1 ngày trước hạn nộp hồ sơ &amp; ngày diễn ra sự kiện.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleMarkAllRead}
            disabled={markingAll || unreadCount === 0}
            className="rounded-xl text-xs gap-1.5 cursor-pointer"
          >
            {markingAll ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <CheckCheck className="h-3.5 w-3.5 text-blue-600" />
            )}
            <span>Đánh dấu tất cả đã đọc</span>
          </Button>
          <Link
            href="/notifications/settings"
            className={buttonVariants({
              variant: "outline",
              size: "sm",
              className: "rounded-xl text-xs gap-1.5",
            })}
          >
            <Settings className="h-3.5 w-3.5 text-slate-600" />
            <span>Cài đặt nhắc nhở</span>
          </Link>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {tabs.map((tab) => {
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => navigateTab(tab.id, 1)}
                className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all cursor-pointer border ${
                  active
                    ? "bg-blue-600 text-white border-blue-600 shadow-xs"
                    : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <span>{tab.label}</span>
                {typeof tab.count === "number" && tab.count > 0 && (
                  <span
                    className={`rounded-full px-1.5 py-0.2 text-[10px] font-bold ${
                      active
                        ? "bg-white/20 text-white"
                        : "bg-blue-100 text-blue-700"
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <span className="text-xs font-medium text-slate-500">
          Tổng <strong className="text-slate-800">{total}</strong> thông báo
        </span>
      </div>

      {/* Notifications List */}
      <div className="rounded-2xl border border-slate-200/80 bg-white shadow-2xs overflow-hidden">
        {loadingList ? (
          <div className="flex items-center justify-center gap-2 py-16 text-sm text-slate-500">
            <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
            <span>Đang tải danh sách thông báo...</span>
          </div>
        ) : notifications.length === 0 ? (
          <div className="py-16 px-6 text-center space-y-3">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
              <Bell className="h-6 w-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-800">
              Không có thông báo nào phù hợp
            </h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Hãy nhấn &ldquo;Quan tâm&rdquo; các học bổng, cuộc thi và sự kiện sinh viên để hệ thống tự động gửi nhắc lịch đúng hạn cho bạn.
            </p>
            <div className="pt-1 flex justify-center gap-2">
              <Link
                href="/activities"
                className={buttonVariants({
                  size: "sm",
                  className: "rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs",
                })}
              >
                Khám phá Hoạt động sinh viên
              </Link>
              <Link
                href="/notifications/settings"
                className={buttonVariants({
                  variant: "outline",
                  size: "sm",
                  className: "rounded-xl text-xs",
                })}
              >
                Tùy chỉnh nhắc nhở
              </Link>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {notifications.map((item) => {
              const meta =
                NOTIFICATION_TYPE_META[item.type] ||
                NOTIFICATION_TYPE_META.SYSTEM_ANNOUNCEMENT;
              const isBusy = busyId === item._id;

              return (
                <div
                  key={item._id}
                  className={`p-4 sm:p-5 flex flex-col sm:flex-row sm:items-start justify-between gap-4 transition-colors ${
                    item.isRead
                      ? "bg-white hover:bg-slate-50/70"
                      : "bg-blue-50/35 hover:bg-blue-50/60"
                  }`}
                >
                  <div className="flex items-start gap-3.5 min-w-0 flex-1">
                    <div
                      className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${meta.iconBgClass}`}
                    >
                      <NotificationTypeIcon type={item.type} className="h-5 w-5" />
                    </div>

                    <div className="min-w-0 flex-1 space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold ${meta.badgeClass}`}
                        >
                          {meta.label}
                        </span>
                        {!item.isRead && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-600">
                            <span className="h-1.5 w-1.5 rounded-full bg-blue-600" />
                            Mới
                          </span>
                        )}
                        <span
                          className="text-[11px] text-slate-400"
                          title={formatVietnamDateTime(item.createdAt)}
                        >
                          {formatNotificationRelativeTimeVi(item.createdAt)}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleOpenNotification(item)}
                        className="text-left block group cursor-pointer"
                      >
                        <h3
                          className={`text-sm leading-snug group-hover:text-blue-600 transition-colors ${
                            item.isRead
                              ? "font-medium text-slate-700"
                              : "font-bold text-slate-900"
                          }`}
                        >
                          {item.title}
                        </h3>
                      </button>

                      <p className="text-xs text-slate-600 leading-relaxed">
                        {item.message}
                      </p>
                    </div>
                  </div>

                  {/* Row Actions */}
                  <div className="flex sm:flex-col items-center sm:items-end gap-2 shrink-0 pl-13 sm:pl-0">
                    {item.link && (
                      <button
                        type="button"
                        onClick={() => handleOpenNotification(item)}
                        className="inline-flex items-center gap-1 rounded-lg bg-slate-100 hover:bg-blue-50 px-2.5 py-1.5 text-[11px] font-semibold text-slate-700 hover:text-blue-700 transition-colors cursor-pointer"
                      >
                        <span>Xem chi tiết</span>
                        <ArrowRight className="h-3 w-3" />
                      </button>
                    )}

                    <button
                      type="button"
                      disabled={isBusy}
                      onClick={() => handleToggleRead(item, !item.isRead)}
                      className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-medium text-slate-500 hover:bg-slate-100 hover:text-slate-800 disabled:opacity-50 transition-colors cursor-pointer"
                    >
                      {item.isRead ? (
                        <>
                          <Circle className="h-3 w-3 text-slate-400" />
                          <span>Đánh dấu chưa đọc</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="h-3 w-3 text-blue-600" />
                          <span>Đánh dấu đã đọc</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <p className="text-xs text-slate-500">
            Trang <strong>{pageParam}</strong> / {totalPages}
          </p>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={pageParam <= 1}
              onClick={() => navigateTab(activeTab, pageParam - 1)}
              className="rounded-xl text-xs cursor-pointer"
            >
              Trang trước
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={pageParam >= totalPages}
              onClick={() => navigateTab(activeTab, pageParam + 1)}
              className="rounded-xl text-xs cursor-pointer"
            >
              Trang sau
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

