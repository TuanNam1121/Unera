"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Bell,
  Calendar,
  CalendarCheck,
  CheckCheck,
  Clock,
  Compass,
  Loader2,
  Megaphone,
  Settings,
  Sparkles,
} from "lucide-react";
import {
  NOTIFICATION_TYPE_META,
  formatNotificationRelativeTimeVi,
} from "@/lib/notifications-utils";
import type { INotification, NotificationType } from "@/types";

export function NotificationTypeIcon({
  type,
  className = "h-4 w-4",
}: {
  type: NotificationType;
  className?: string;
}) {
  switch (type) {
    case "DEADLINE_REMINDER":
      return <Clock className={className} />;
    case "EVENT_REMINDER":
      return <Calendar className={className} />;
    case "BOOKING_UPDATE":
      return <CalendarCheck className={className} />;
    case "ROADMAP_UPDATE":
      return <Compass className={className} />;
    case "AI_ANALYSIS_READY":
      return <Sparkles className={className} />;
    default:
      return <Megaphone className={className} />;
  }
}

export function NotificationBellDropdown({
  isAuthenticated,
}: {
  isAuthenticated: boolean;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);

  const [openPathname, setOpenPathname] = useState<string | null>(null);
  const isOpen = openPathname === pathname;

  const [unreadCount, setUnreadCount] = useState(0);
  const [recentItems, setRecentItems] = useState<INotification[]>([]);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [markingAll, setMarkingAll] = useState(false);

  const fetchUnreadCount = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const res = await fetch("/api/notifications/unread-count", {
        cache: "no-store",
      });
      if (!res.ok) return;
      const data = await res.json();
      if (typeof data.unreadCount === "number") {
        setUnreadCount(data.unreadCount);
      }
    } catch {
      // Non-fatal network error
    }
  }, [isAuthenticated]);

  const fetchPreview = useCallback(async () => {
    if (!isAuthenticated) return;
    setLoadingPreview(true);
    try {
      const res = await fetch("/api/notifications?limit=5", {
        cache: "no-store",
      });
      if (!res.ok) return;
      const data = await res.json();
      if (Array.isArray(data.notifications)) {
        setRecentItems(data.notifications);
      }
      if (typeof data.unreadCount === "number") {
        setUnreadCount(data.unreadCount);
      }
    } catch {
      // Non-fatal network error
    } finally {
      setLoadingPreview(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) return;
    let cancelled = false;

    async function loadInitial() {
      try {
        const res = await fetch("/api/notifications/unread-count", {
          cache: "no-store",
        });
        if (!res.ok || cancelled) return;
        const data = await res.json();
        if (!cancelled && typeof data.unreadCount === "number") {
          setUnreadCount(data.unreadCount);
        }
      } catch {
        // Ignore
      }
    }

    loadInitial();

    const interval = window.setInterval(() => {
      if (document.visibilityState === "visible") {
        fetchUnreadCount();
      }
    }, 60_000);

    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        fetchUnreadCount();
      }
    };

    const handleCustomSync = () => {
      fetchUnreadCount();
      if (openPathname === pathname) {
        fetchPreview();
      }
    };

    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("unera:notifications-updated", handleCustomSync);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener(
        "unera:notifications-updated",
        handleCustomSync
      );
    };
  }, [
    isAuthenticated,
    fetchUnreadCount,
    fetchPreview,
    openPathname,
    pathname,
  ]);

  // Outside click closes dropdown
  useEffect(() => {
    function onDocMouseDown(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpenPathname(null);
      }
    }
    document.addEventListener("mousedown", onDocMouseDown);
    return () => document.removeEventListener("mousedown", onDocMouseDown);
  }, []);

  if (!isAuthenticated) {
    return (
      <Link
        href="/login?redirect=/notifications"
        className="relative rounded-full p-2 text-slate-500 hover:bg-slate-100 transition-colors"
        title="Đăng nhập để xem thông báo"
        aria-label="Đăng nhập để xem thông báo"
      >
        <Bell className="h-4 w-4" />
      </Link>
    );
  }

  const handleToggleOpen = () => {
    if (isOpen) {
      setOpenPathname(null);
      return;
    }
    setOpenPathname(pathname);
    void fetchPreview();
  };

  const handleMarkAllRead = async () => {
    if (markingAll || unreadCount === 0) return;
    setMarkingAll(true);
    try {
      const res = await fetch("/api/notifications/read-all", {
        method: "PATCH",
      });
      if (res.ok) {
        setUnreadCount(0);
        setRecentItems((prev) =>
          prev.map((item) => ({ ...item, isRead: true }))
        );
        window.dispatchEvent(new CustomEvent("unera:notifications-updated"));
      }
    } finally {
      setMarkingAll(false);
    }
  };

  const handleItemClick = async (item: INotification) => {
    setOpenPathname(null);
    if (!item.isRead) {
      setUnreadCount((c) => Math.max(0, c - 1));
      setRecentItems((prev) =>
        prev.map((row) =>
          row._id === item._id ? { ...row, isRead: true } : row
        )
      );
      try {
        const res = await fetch(`/api/notifications/${item._id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ isRead: true }),
        });
        if (res.ok) {
          const data = await res.json();
          if (typeof data.unreadCount === "number") {
            setUnreadCount(data.unreadCount);
          }
        }
        window.dispatchEvent(new CustomEvent("unera:notifications-updated"));
      } catch {
        // Non-fatal
      }
    }
    router.push(item.link || "/notifications");
  };

  const badgeLabel = unreadCount > 9 ? "9+" : String(unreadCount);

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={handleToggleOpen}
        aria-label="Thông báo"
        aria-expanded={isOpen}
        title="Thông báo"
        className="relative rounded-full p-2 text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span
            data-testid="notification-unread-badge"
            className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full bg-blue-600 text-[10px] font-bold text-white ring-2 ring-white leading-none"
          >
            {badgeLabel}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl border border-slate-200 bg-white shadow-xl ring-1 ring-black/5 z-50 overflow-hidden animate-in fade-in slide-in-from-top-1 duration-150">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 bg-slate-50/70">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-900">
                Thông báo
              </span>
              {unreadCount > 0 && (
                <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-700">
                  {unreadCount} chưa đọc
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={handleMarkAllRead}
              disabled={markingAll || unreadCount === 0}
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 hover:text-blue-700 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              <CheckCheck className="h-3.5 w-3.5" />
              <span>Đọc tất cả</span>
            </button>
          </div>

          {/* Preview Body */}
          <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
            {loadingPreview ? (
              <div className="flex items-center justify-center gap-2 py-8 text-xs text-slate-500">
                <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                <span>Đang tải thông báo...</span>
              </div>
            ) : recentItems.length === 0 ? (
              <div className="py-10 px-4 text-center space-y-1.5">
                <Bell className="h-6 w-6 mx-auto text-slate-300" />
                <p className="text-xs font-medium text-slate-600">
                  Bạn chưa có thông báo nào
                </p>
                <p className="text-[11px] text-slate-400">
                  Nhắc nhở hạn nộp & sự kiện từ các hoạt động đã quan tâm sẽ hiển thị tại đây.
                </p>
              </div>
            ) : (
              recentItems.map((item) => {
                const meta =
                  NOTIFICATION_TYPE_META[item.type] ||
                  NOTIFICATION_TYPE_META.SYSTEM_ANNOUNCEMENT;
                return (
                  <button
                    key={item._id}
                    type="button"
                    onClick={() => handleItemClick(item)}
                    className={`w-full text-left px-4 py-3 flex items-start gap-3 transition-colors cursor-pointer ${
                      item.isRead
                        ? "bg-white hover:bg-slate-50"
                        : "bg-blue-50/40 hover:bg-blue-50/70"
                    }`}
                  >
                    <div
                      className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${meta.iconBgClass}`}
                    >
                      <NotificationTypeIcon type={item.type} className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex items-start justify-between gap-2">
                        <p
                          className={`text-xs leading-snug line-clamp-2 ${
                            item.isRead
                              ? "font-medium text-slate-700"
                              : "font-semibold text-slate-900"
                          }`}
                        >
                          {item.title}
                        </p>
                        {!item.isRead && (
                          <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-blue-600" />
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 line-clamp-2">
                        {item.message}
                      </p>
                      <p className="text-[10px] font-medium text-slate-400">
                        {formatNotificationRelativeTimeVi(item.createdAt)}
                      </p>
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* Footer Links */}
          <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/70 px-4 py-2.5 text-xs">
            <Link
              href="/notifications"
              onClick={() => setOpenPathname(null)}
              className="font-semibold text-blue-600 hover:text-blue-700"
            >
              Xem tất cả thông báo
            </Link>
            <Link
              href="/notifications/settings"
              onClick={() => setOpenPathname(null)}
              className="inline-flex items-center gap-1 text-slate-500 hover:text-slate-800 font-medium"
            >
              <Settings className="h-3.5 w-3.5" />
              <span>Cài đặt</span>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

