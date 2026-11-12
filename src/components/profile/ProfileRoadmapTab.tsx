"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Check,
  ClipboardCheck,
  Compass,
  History,
  Loader2,
  Map as MapIcon,
  Sparkles,
} from "lucide-react";
import { fetchWithAuth } from "@/components/providers/AuthProvider";
import { ROADMAP_GOAL_STATUSES, RoadmapGoalStatus } from "@/constants";
import {
  GOAL_CATEGORY_META,
  GOAL_STATUS_META,
  calculateRoadmapProgress,
  semesterLabel,
} from "@/lib/roadmap-utils";
import type { IAiOrientationAnalysisDTO, IRoadmapDTO } from "@/types";

export function ProfileRoadmapTab() {
  const [roadmap, setRoadmap] = useState<IRoadmapDTO | null>(null);
  const [currentAcademicYear, setCurrentAcademicYear] = useState<1 | 2 | 3 | 4 | null>(null);
  const [latestAnalysis, setLatestAnalysis] = useState<IAiOrientationAnalysisDTO | null>(null);
  const [latestSubmissionId, setLatestSubmissionId] = useState<string | null>(null);
  const [historyCount, setHistoryCount] = useState(0);

  const [loading, setLoading] = useState(true);
  const [busyGoalId, setBusyGoalId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await fetchWithAuth("/api/roadmap", { cache: "no-store" });
        const data = await res.json();
        if (!active) return;
        if (!res.ok) {
          setErrorMsg(data.error || "Không thể tải lộ trình cá nhân.");
          return;
        }
        setRoadmap(data.roadmap || null);
        setCurrentAcademicYear(data.currentAcademicYear || null);
        setLatestAnalysis(data.latestAnalysis || null);
        setLatestSubmissionId(data.latestSubmissionId || null);
        setHistoryCount(data.historyCount || 0);
      } catch {
        if (active) setErrorMsg("Lỗi kết nối khi tải lộ trình cá nhân.");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const handleToggleComplete = async (
    goalId: string,
    currentStatus: RoadmapGoalStatus
  ) => {
    if (!roadmap) return;
    const nextStatus =
      currentStatus === ROADMAP_GOAL_STATUSES.COMPLETED
        ? ROADMAP_GOAL_STATUSES.NOT_STARTED
        : ROADMAP_GOAL_STATUSES.COMPLETED;

    const prevRoadmap = roadmap;
    const nextYears = roadmap.years.map((y) => ({
      ...y,
      goals: y.goals.map((g) =>
        g.id === goalId
          ? {
              ...g,
              status: nextStatus,
              completedAt:
                nextStatus === ROADMAP_GOAL_STATUSES.COMPLETED
                  ? new Date().toISOString()
                  : null,
            }
          : g
      ),
    }));
    const breakdown = calculateRoadmapProgress(nextYears);
    setRoadmap({
      ...roadmap,
      years: nextYears,
      progressPercent: breakdown.progressPercent,
      progressBreakdown: breakdown,
    });

    setBusyGoalId(goalId);
    try {
      const res = await fetchWithAuth(`/api/roadmap/goals/${goalId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      const data = await res.json();
      if (!res.ok || !data.roadmap) {
        setRoadmap(prevRoadmap);
        return;
      }
      setRoadmap(data.roadmap);
    } catch {
      setRoadmap(prevRoadmap);
    } finally {
      setBusyGoalId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[240px] items-center justify-center rounded-2xl border border-slate-200 bg-white">
        <Loader2 className="h-7 w-7 animate-spin text-[#102C8A]" />
      </div>
    );
  }

  if (errorMsg) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700">
        {errorMsg}
      </div>
    );
  }

  if (!roadmap) {
    return (
      <div className="space-y-5 rounded-3xl border border-slate-200 bg-white p-6 shadow-xs">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-[#102C8A]">
            <MapIcon className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">
              Chưa có lộ trình 4 năm cá nhân hóa
            </h3>
            <p className="mt-1 text-sm text-slate-600">
              Thực hiện bài đánh giá định hướng động để hệ thống AI phân tích
              hồ sơ (kể cả khi bạn vừa đăng ký và chưa cập nhật nhiều thành tích)
              và lập kế hoạch chi tiết từ Năm 1 đến Năm 4.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/onboarding"
            className="inline-flex items-center gap-2 rounded-xl bg-[#102C8A] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#0B2066]"
          >
            <ClipboardCheck className="h-4 w-4" />
            Làm đánh giá định hướng
          </Link>
          {latestSubmissionId && (
            <Link
              href={`/onboarding/result/${latestSubmissionId}`}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Xem kết quả phân tích AI
            </Link>
          )}
          <Link
            href="/roadmap"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#0D9488] hover:underline"
          >
            Đến trang Lộ trình
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    );
  }

  const breakdown =
    roadmap.progressBreakdown || calculateRoadmapProgress(roadmap.years);

  return (
    <div className="space-y-6">
      {/* Header Summary Card */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-[#102C8A]">
                <Compass className="h-3.5 w-3.5" />
                {roadmap.orientationDirection}
              </span>
              <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700">
                v{roadmap.version}
              </span>
            </div>
            <h3 className="text-xl font-bold text-slate-900">{roadmap.title}</h3>
            {latestAnalysis?.analysisResult?.overallSummary && (
              <p className="line-clamp-2 text-xs leading-relaxed text-slate-600">
                {latestAnalysis.analysisResult.overallSummary}
              </p>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/roadmap"
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#102C8A] px-4 py-2 text-xs font-semibold text-white hover:bg-[#0B2066]"
            >
              <Sparkles className="h-3.5 w-3.5" />
              Quản lý Lộ trình đầy đủ
            </Link>
            <Link
              href="/roadmap/history"
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              <History className="h-3.5 w-3.5" />
              Lịch sử ({historyCount})
            </Link>
            <Link
              href="/onboarding/history"
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              Lịch sử khảo sát
            </Link>
          </div>
        </div>

        <div className="mt-5">
          <div className="mb-1.5 flex items-center justify-between text-xs font-semibold">
            <span className="text-slate-700">Tiến độ lộ trình 4 năm</span>
            <span className="text-[#102C8A]">
              {breakdown.progressPercent}% ({breakdown.completedGoals}/
              {breakdown.countableGoals} mục tiêu)
            </span>
          </div>
          <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-linear-to-r from-[#102C8A] to-[#0D9488] transition-all"
              style={{ width: `${breakdown.progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* 4-Year Compact List */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {[...roadmap.years]
          .sort((a, b) => a.yearNumber - b.yearNumber)
          .map((year) => {
            const yrProg = breakdown.byYear.find(
              (y) => y.yearNumber === year.yearNumber
            );
            const isCurrent = currentAcademicYear === year.yearNumber;
            const orderedGoals = [...year.goals].sort(
              (a, b) => a.order - b.order
            );

            return (
              <div
                key={year.yearNumber}
                className={`rounded-2xl border bg-white p-5 shadow-xs ${
                  isCurrent
                    ? "border-[#0D9488]/60 ring-1 ring-[#0D9488]/15"
                    : "border-slate-200"
                }`}
              >
                <div className="mb-3 flex items-center justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="rounded-md bg-[#102C8A] px-2 py-0.5 text-[11px] font-bold text-white">
                        Năm {year.yearNumber}
                      </span>
                      {isCurrent && (
                        <span className="rounded-full bg-teal-50 px-2 py-0.5 text-[10px] font-semibold text-[#0D9488]">
                          Hiện tại
                        </span>
                      )}
                    </div>
                    <h4 className="mt-1 text-sm font-bold text-slate-900">
                      {year.title}
                    </h4>
                  </div>
                  {yrProg && (
                    <span className="text-xs font-bold text-[#0D9488]">
                      {yrProg.progressPercent}%
                    </span>
                  )}
                </div>

                <div className="space-y-2">
                  {orderedGoals.map((goal) => {
                    const done =
                      goal.status === ROADMAP_GOAL_STATUSES.COMPLETED;
                    const skipped =
                      goal.status === ROADMAP_GOAL_STATUSES.SKIPPED;
                    const cat = GOAL_CATEGORY_META[goal.category];
                    const statusMeta = GOAL_STATUS_META[goal.status];

                    return (
                      <div
                        key={goal.id}
                        className={`flex items-start gap-2.5 rounded-xl border border-slate-100 bg-slate-50/70 p-2.5 ${
                          skipped ? "opacity-60" : ""
                        }`}
                      >
                        <button
                          type="button"
                          disabled={busyGoalId === goal.id}
                          onClick={() =>
                            handleToggleComplete(goal.id, goal.status)
                          }
                          aria-label={`Đánh dấu hoàn thành ${goal.title}`}
                          className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition ${
                            done
                              ? "border-emerald-600 bg-emerald-600 text-white"
                              : "border-slate-300 bg-white text-transparent hover:border-[#102C8A]"
                          }`}
                        >
                          <Check className="h-3.5 w-3.5 stroke-[2.5]" />
                        </button>

                        <div className="min-w-0 flex-1">
                          <p
                            className={`text-xs font-semibold leading-snug ${
                              done || skipped
                                ? "line-through text-slate-500"
                                : "text-slate-800"
                            }`}
                          >
                            {goal.title}
                          </p>
                          <div className="mt-1 flex flex-wrap items-center gap-1.5">
                            <span
                              className={`rounded-full border px-1.5 py-0.5 text-[10px] ${cat.badgeClass}`}
                            >
                              {cat.label}
                            </span>
                            <span className="text-[10px] text-slate-500">
                              {semesterLabel(goal.semester)}
                            </span>
                            <span
                              className={`rounded-full border px-1.5 py-0.5 text-[10px] ${statusMeta.badgeClass}`}
                            >
                              {statusMeta.label}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
      </div>
    </div>
  );
}
