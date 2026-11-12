"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle2, Compass, Map as MapIcon, Sparkles } from "lucide-react";
import { fetchWithAuth } from "@/components/providers/AuthProvider";
import { ROADMAP_GOAL_STATUSES } from "@/constants";
import { GOAL_CATEGORY_META, calculateRoadmapProgress } from "@/lib/roadmap-utils";
import type { IRoadmapDTO } from "@/types";

export default function HomeRoadmapCard() {
  const [roadmap, setRoadmap] = useState<IRoadmapDTO | null>(null);
  const [currentAcademicYear, setCurrentAcademicYear] = useState<1 | 2 | 3 | 4 | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const res = await fetchWithAuth("/api/roadmap", { cache: "no-store" });
        if (!active) return;
        if (res.ok) {
          const data = await res.json();
          setRoadmap(data.roadmap || null);
          setCurrentAcademicYear(data.currentAcademicYear || null);
        }
      } catch {
        // Giữ fallback cho khách vãng lai hoặc khi mất kết nối nhẹ trên trang chủ
      } finally {
        if (active) setLoaded(true);
      }
    };
    load();
    return () => {
      active = false;
    };
  }, []);

  if (!loaded || !roadmap) {
    return (
      <div className="group flex h-full flex-col justify-between rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs transition hover:border-[#102C8A]/30 hover:shadow-md">
        <div>
          <div className="mb-4 flex items-center justify-between">
            <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-[#102C8A]">
              <MapIcon className="h-5 w-5" />
            </span>
            <span className="rounded-full bg-teal-50 px-3 py-1 text-xs font-semibold text-[#0D9488]">
              Gemini AI 4 Năm
            </span>
          </div>
          <h3 className="text-lg font-bold text-slate-900">
            Định hướng & Lộ trình cá nhân
          </h3>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">
            Trả lời bộ câu hỏi đánh giá định hướng động để Gemini AI phân tích
            năng lực và thiết kế lộ trình 4 năm dành riêng cho bạn.
          </p>
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-3 pt-2">
          <Link
            href="/onboarding"
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#102C8A] px-4 py-2 text-xs font-semibold text-white transition hover:bg-[#0B2066]"
          >
            <Sparkles className="h-3.5 w-3.5" />
            Khám phá định hướng
          </Link>
          <Link
            href="/roadmap"
            className="inline-flex items-center gap-1 text-xs font-semibold text-[#102C8A] hover:underline"
          >
            Xem lộ trình <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    );
  }

  const breakdown =
    roadmap.progressBreakdown || calculateRoadmapProgress(roadmap.years);
  const focusYearNumber = currentAcademicYear || 1;
  const focusYear =
    roadmap.years.find((y) => y.yearNumber === focusYearNumber) ||
    roadmap.years[0];
  const previewGoals = focusYear
    ? [...focusYear.goals]
        .sort((a, b) => a.order - b.order)
        .filter((g) => g.status !== ROADMAP_GOAL_STATUSES.SKIPPED)
        .slice(0, 3)
    : [];

  return (
    <div className="flex h-full flex-col justify-between rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs transition hover:border-[#102C8A]/35 hover:shadow-md">
      <div className="space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-0.5 text-[11px] font-semibold text-[#102C8A]">
              <Compass className="h-3 w-3" />
              {roadmap.orientationDirection}
            </span>
            <h3 className="line-clamp-1 text-lg font-bold text-slate-900">
              {roadmap.title}
            </h3>
          </div>
          <span className="shrink-0 rounded-xl bg-[#102C8A] px-2.5 py-1 text-xs font-bold text-white">
            {breakdown.progressPercent}%
          </span>
        </div>

        <div>
          <div className="mb-1.5 flex items-center justify-between text-xs text-slate-600">
            <span>
              Tiến độ chung ({breakdown.completedGoals}/
              {breakdown.countableGoals} mục tiêu)
            </span>
            <span>v{roadmap.version}</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-linear-to-r from-[#102C8A] to-[#0D9488] transition-all"
              style={{ width: `${breakdown.progressPercent}%` }}
            />
          </div>
        </div>

        {focusYear && (
          <div className="space-y-3 rounded-2xl border border-slate-100 bg-slate-50/80 p-4 sm:p-5">
            <div className="text-sm sm:text-base font-bold text-slate-800 leading-snug">
              Trọng tâm Năm {focusYear.yearNumber}: {focusYear.title}
            </div>
            {previewGoals.length === 0 ? (
              <p className="text-sm text-slate-500">
                Chưa có mục tiêu đang mở trong năm này.
              </p>
            ) : (
              <ul className="space-y-2.5">
                {previewGoals.map((goal) => {
                  const done =
                    goal.status === ROADMAP_GOAL_STATUSES.COMPLETED;
                  const cat = GOAL_CATEGORY_META[goal.category];
                  return (
                    <li
                      key={goal.id}
                      className="flex items-center justify-between gap-3 text-sm sm:text-[15px]"
                    >
                      <span
                        className={`flex min-w-0 items-center gap-2 ${
                          done
                            ? "line-through text-slate-400"
                            : "font-medium text-slate-800"
                        }`}
                      >
                        <CheckCircle2
                          className={`h-4 w-4 shrink-0 ${
                            done ? "text-emerald-600" : "text-slate-300"
                          }`}
                        />
                        <span className="truncate">{goal.title}</span>
                      </span>
                      <span
                        className={`shrink-0 rounded-full border px-2.5 py-0.5 text-xs font-medium ${cat.badgeClass}`}
                      >
                        {cat.label}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        )}
      </div>

      <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-3">
        <Link
          href="/roadmap"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-[#102C8A] hover:underline"
        >
          Mở bảng lộ trình chi tiết
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
        <Link
          href="/roadmap/history"
          className="text-xs font-medium text-slate-500 hover:text-slate-800"
        >
          Lịch sử
        </Link>
      </div>
    </div>
  );
}
