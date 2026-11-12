"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CalendarClock } from "lucide-react";
import { fetchWithAuth, useAuth } from "@/components/providers/AuthProvider";
import { ACTIVITY_COMPUTED_STATUS } from "@/constants";
import type { IStudentActivitySummary } from "@/types";

const DATE_BOX_PALETTES = [
  "bg-blue-50 border-blue-100 text-blue-600",
  "bg-purple-50 border-purple-100 text-purple-600",
  "bg-amber-50 border-amber-100 text-amber-600",
] as const;

function parseDateBadge(value?: string | Date | null): {
  day: string;
  month: string;
} {
  if (!value) return { day: "--", month: "MỚI" };
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return { day: "--", month: "MỚI" };

  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Ho_Chi_Minh",
    day: "2-digit",
    month: "2-digit",
  }).formatToParts(date);

  const day = parts.find((p) => p.type === "day")?.value || "--";
  const month = parts.find((p) => p.type === "month")?.value || "--";
  return { day, month: `TH ${Number.parseInt(month, 10) || month}` };
}

function getDeadlinePill(
  item: IStudentActivitySummary,
  nowMs: number | null
): { label: string; className: string } {
  if (
    item.computedStatus === ACTIVITY_COMPUTED_STATUS.CLOSED ||
    item.computedStatus === ACTIVITY_COMPUTED_STATUS.EXPIRED
  ) {
    return {
      label: "Đã đóng",
      className: "bg-slate-100 text-slate-500",
    };
  }

  const targetRaw = item.deadline || item.eventDate;
  if (targetRaw && nowMs !== null) {
    const targetMs = new Date(targetRaw).getTime();
    if (!Number.isNaN(targetMs)) {
      const daysLeft = Math.ceil((targetMs - nowMs) / 86_400_000);
      if (daysLeft < 0) {
        return {
          label: "Đã qua hạn",
          className: "bg-slate-100 text-slate-500",
        };
      }
      if (daysLeft === 0) {
        return {
          label: "Hôm nay",
          className: "bg-rose-50 text-rose-600 border border-rose-100",
        };
      }
      if (daysLeft <= 7) {
        return {
          label: `Còn ${daysLeft} ngày`,
          className: "bg-amber-50 text-amber-700 border border-amber-100",
        };
      }
      return {
        label: `Còn ${daysLeft} ngày`,
        className: "bg-slate-50 text-slate-600",
      };
    }
  }

  return {
    label: "Mới cập nhật",
    className: "bg-blue-50 text-blue-700",
  };
}

export default function HomeUpcomingDeadlines() {
  const { user, loading: authLoading } = useAuth();
  const [items, setItems] = useState<IStudentActivitySummary[]>([]);
  const [sourceMode, setSourceMode] = useState<"followed" | "latest">("latest");
  const [loading, setLoading] = useState(true);
  const [nowMs, setNowMs] = useState<number | null>(null);

  useEffect(() => {
    if (authLoading) return;
    let active = true;

    async function loadDeadlines() {
      setLoading(true);
      try {
        if (user) {
          const followedRes = await fetchWithAuth(
            "/api/activities/followed?limit=3&page=1",
            { cache: "no-store" }
          );
          if (followedRes.ok) {
            const followedData = await followedRes.json();
            const followedItems = Array.isArray(followedData.items)
              ? (followedData.items as IStudentActivitySummary[]).slice(0, 3)
              : [];
            if (followedItems.length > 0) {
              if (!active) return;
              setItems(followedItems);
              setSourceMode("followed");
              setNowMs(Date.now());
              return;
            }
          }
        }

        const latestRes = await fetch(
          "/api/activities?sort=newest&limit=3&page=1",
          { cache: "no-store" }
        );
        if (latestRes.ok) {
          const latestData = await latestRes.json();
          const latestItems = Array.isArray(latestData.items)
            ? (latestData.items as IStudentActivitySummary[]).slice(0, 3)
            : [];
          if (!active) return;
          setItems(latestItems);
          setSourceMode("latest");
          setNowMs(Date.now());
        }
      } catch {
        // Keep safe empty state if offline
      } finally {
        if (active) setLoading(false);
      }
    }

    loadDeadlines();
    return () => {
      active = false;
    };
  }, [authLoading, user]);

  const viewAllHref =
    sourceMode === "followed" ? "/activities?tab=followed" : "/activities";

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <h3 className="text-base font-bold text-slate-900">Hạn sắp tới</h3>
          {!loading && items.length > 0 && (
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-500">
              {sourceMode === "followed" ? "Đã quan tâm" : "Mới nhất"}
            </span>
          )}
        </div>
        <Link
          href={viewAllHref}
          className="text-xs font-medium text-blue-600 hover:text-blue-700 transition-colors"
        >
          Xem tất cả
        </Link>
      </div>

      <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-2xs divide-y divide-slate-100">
        {loading ? (
          <div className="space-y-3 py-1">
            {[0, 1, 2].map((idx) => (
              <div key={idx} className="flex items-center gap-3 py-2 animate-pulse">
                <div className="h-11 w-11 shrink-0 rounded-xl bg-slate-100" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3.5 w-3/4 rounded bg-slate-100" />
                  <div className="h-3 w-1/2 rounded bg-slate-100" />
                </div>
                <div className="h-6 w-16 shrink-0 rounded-md bg-slate-100" />
              </div>
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <CalendarClock className="h-7 w-7 text-slate-300" />
            <p className="mt-2 text-xs font-medium text-slate-500">
              Chưa có chương trình hoạt động sinh viên nào.
            </p>
            <Link
              href="/activities"
              className="mt-2 text-xs font-semibold text-blue-600 hover:underline"
            >
              Khám phá hoạt động sinh viên
            </Link>
          </div>
        ) : (
          items.map((item, idx) => {
            const badge = parseDateBadge(
              item.deadline || item.eventDate || item.publishedAt || item.createdAt
            );
            const pill = getDeadlinePill(item, nowMs);
            const palette = DATE_BOX_PALETTES[idx % DATE_BOX_PALETTES.length];
            const subtitle =
              [item.category?.name, item.organizer]
                .filter(Boolean)
                .join(" · ") || "Hoạt động sinh viên";

            return (
              <Link
                key={item._id}
                href={`/activities/${item.slug}`}
                className="group flex items-center justify-between gap-3 py-3 first:pt-1 last:pb-1 transition-colors"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <div
                    className={`flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-xl border text-center ${palette}`}
                  >
                    <span className="text-sm font-bold leading-none">
                      {badge.day}
                    </span>
                    <span className="mt-0.5 text-[9px] font-semibold uppercase text-slate-400">
                      {badge.month}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <p className="line-clamp-1 text-xs sm:text-[13px] font-bold text-slate-800 group-hover:text-blue-600 transition-colors">
                      {item.title}
                    </p>
                    <p className="line-clamp-1 text-[11px] text-slate-400">
                      {subtitle}
                    </p>
                  </div>
                </div>
                <span
                  className={`shrink-0 rounded-md px-2 py-1 text-[10px] font-medium ${pill.className}`}
                >
                  {pill.label}
                </span>
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
}

