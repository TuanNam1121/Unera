"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  Calendar,
  Check,
  ClipboardCheck,
  Compass,
  Edit3,
  Eye,
  Filter,
  History,
  Loader2,
  Map as MapIcon,
  Plus,
  RefreshCw,
  Sparkles,
  Trash2,
  UserCheck,
  X,
} from "lucide-react";
import { fetchWithAuth } from "@/components/providers/AuthProvider";
import { GoalDetailDrawer } from "@/components/roadmap/GoalDetailDrawer";
import {
  GoalFormModal,
  GoalFormValues,
} from "@/components/roadmap/GoalFormModal";
import {
  AI_ANALYSIS_STATUS,
  ROADMAP_GOAL_STATUSES,
  ROADMAP_SOURCE,
  RoadmapGoalStatus,
} from "@/constants";
import {
  GOAL_CATEGORY_META,
  GOAL_PRIORITY_META,
  GOAL_STATUS_META,
  calculateRoadmapProgress,
  semesterLabel,
} from "@/lib/roadmap-utils";
import type {
  IAiOrientationAnalysisDTO,
  IRoadmapDTO,
  IRoadmapGoalDTO,
} from "@/types";

type YearFilter = "all" | 1 | 2 | 3 | 4;
type StatusFilter = "ALL" | RoadmapGoalStatus;

export default function PersonalRoadmapPage() {
  const [roadmap, setRoadmap] = useState<IRoadmapDTO | null>(null);
  const [currentAcademicYear, setCurrentAcademicYear] = useState<
    1 | 2 | 3 | 4 | null
  >(null);
  const [latestAnalysis, setLatestAnalysis] =
    useState<IAiOrientationAnalysisDTO | null>(null);
  const [latestSubmissionId, setLatestSubmissionId] = useState<string | null>(
    null
  );
  const [historyCount, setHistoryCount] = useState(0);

  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const [selectedYear, setSelectedYear] = useState<YearFilter>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");

  // Modal & Drawer states
  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [formInitialYear, setFormInitialYear] = useState<1 | 2 | 3 | 4>(1);
  const [editingGoal, setEditingGoal] = useState<IRoadmapGoalDTO | null>(null);
  const [editingOriginalYear, setEditingOriginalYear] = useState<
    1 | 2 | 3 | 4
  >(1);
  const [formBusy, setFormBusy] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerGoal, setDrawerGoal] = useState<{
    yearNumber: 1 | 2 | 3 | 4;
    goal: IRoadmapGoalDTO;
  } | null>(null);

  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [busyGoalId, setBusyGoalId] = useState<string | null>(null);

  // AI Regenerate modal state
  const [regenOpen, setRegenOpen] = useState(false);
  const [regenDirection, setRegenDirection] = useState("");
  const [regenNotes, setRegenNotes] = useState("");
  const [regenBusy, setRegenBusy] = useState(false);
  const [regenError, setRegenError] = useState<string | null>(null);

  const fetchRoadmapPayload = useCallback(async () => {
    const res = await fetchWithAuth("/api/roadmap", { cache: "no-store" });
    const data = await res.json();
    return { ok: res.ok, data };
  }, []);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const { ok, data } = await fetchRoadmapPayload();
        if (!active) return;
        if (!ok) {
          setPageError(
            data.error || "Không thể tải dữ liệu lộ trình cá nhân của bạn."
          );
          return;
        }
        setRoadmap(data.roadmap || null);
        setCurrentAcademicYear(data.currentAcademicYear || null);
        setLatestAnalysis(data.latestAnalysis || null);
        setLatestSubmissionId(data.latestSubmissionId || null);
        setHistoryCount(data.historyCount || 0);
      } catch {
        if (active) {
          setPageError("Lỗi kết nối máy chủ khi tải lộ trình cá nhân.");
        }
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [fetchRoadmapPayload]);

  const loadRoadmap = useCallback(async () => {
    setLoading(true);
    setPageError(null);
    try {
      const { ok, data } = await fetchRoadmapPayload();
      if (!ok) {
        setPageError(
          data.error || "Không thể tải dữ liệu lộ trình cá nhân của bạn."
        );
        return;
      }
      setRoadmap(data.roadmap || null);
      setCurrentAcademicYear(data.currentAcademicYear || null);
      setLatestAnalysis(data.latestAnalysis || null);
      setLatestSubmissionId(data.latestSubmissionId || null);
      setHistoryCount(data.historyCount || 0);
    } catch {
      setPageError("Lỗi kết nối máy chủ khi tải lộ trình cá nhân.");
    } finally {
      setLoading(false);
    }
  }, [fetchRoadmapPayload]);

  useEffect(() => {
    if (!toastMsg) return;
    const t = setTimeout(() => setToastMsg(null), 4500);
    return () => clearTimeout(t);
  }, [toastMsg]);

  const progress = useMemo(() => {
    if (!roadmap) return null;
    return (
      roadmap.progressBreakdown || calculateRoadmapProgress(roadmap.years)
    );
  }, [roadmap]);

  const yearProgressMap = useMemo(() => {
    const map = new Map<
      1 | 2 | 3 | 4,
      NonNullable<typeof progress>["byYear"][number]
    >();
    progress?.byYear.forEach((item) => {
      map.set(item.yearNumber, item);
    });
    return map;
  }, [progress]);

  const visibleYears = useMemo(() => {
    if (!roadmap) return [];
    const sorted = [...roadmap.years].sort(
      (a, b) => a.yearNumber - b.yearNumber
    );
    if (selectedYear === "all") return sorted;
    return sorted.filter((y) => y.yearNumber === selectedYear);
  }, [roadmap, selectedYear]);

  const applyServerRoadmap = useCallback(
    (updated: IRoadmapDTO) => {
      setRoadmap(updated);
      if (drawerGoal) {
        for (const y of updated.years) {
          const found = y.goals.find((g) => g.id === drawerGoal.goal.id);
          if (found) {
            setDrawerGoal({ yearNumber: y.yearNumber, goal: found });
            return;
          }
        }
        setDrawerOpen(false);
        setDrawerGoal(null);
      }
    },
    [drawerGoal]
  );

  // Optimistic update + API sync for goal status (RM08, RM09)
  const handleStatusChange = async (
    goalId: string,
    nextStatus: RoadmapGoalStatus
  ) => {
    if (!roadmap) return;
    const prevRoadmap = roadmap;

    // Optimistic clone
    const optimisticYears = roadmap.years.map((year) => ({
      ...year,
      goals: year.goals.map((g) =>
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
    const optimisticBreakdown = calculateRoadmapProgress(optimisticYears);
    const optimisticRoadmap: IRoadmapDTO = {
      ...roadmap,
      years: optimisticYears,
      progressPercent: optimisticBreakdown.progressPercent,
      progressBreakdown: optimisticBreakdown,
    };
    setRoadmap(optimisticRoadmap);
    if (drawerGoal?.goal.id === goalId) {
      const updatedGoal = optimisticYears
        .flatMap((y) => y.goals)
        .find((g) => g.id === goalId);
      if (updatedGoal) {
        setDrawerGoal({ ...drawerGoal, goal: updatedGoal });
      }
    }

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
        setToastMsg({
          type: "error",
          text: data.error || "Không thể cập nhật trạng thái mục tiêu.",
        });
        return;
      }
      applyServerRoadmap(data.roadmap);
    } catch {
      setRoadmap(prevRoadmap);
      setToastMsg({
        type: "error",
        text: "Mất kết nối máy chủ khi lưu trạng thái mục tiêu.",
      });
    } finally {
      setBusyGoalId(null);
    }
  };

  // RM05 + RM06 Create/Edit Goal
  const openCreateGoal = (defaultYear?: 1 | 2 | 3 | 4) => {
    const resolvedYear =
      defaultYear ??
      (selectedYear === "all" ? currentAcademicYear || 1 : selectedYear);
    setFormMode("create");
    setFormInitialYear(resolvedYear);
    setEditingGoal(null);
    setFormError(null);
    setFormOpen(true);
  };

  const openEditGoal = (goal: IRoadmapGoalDTO, yearNumber: 1 | 2 | 3 | 4) => {
    setFormMode("edit");
    setFormInitialYear(yearNumber);
    setEditingOriginalYear(yearNumber);
    setEditingGoal(goal);
    setFormError(null);
    setFormOpen(true);
  };

  const handleGoalFormSubmit = async (values: GoalFormValues) => {
    setFormBusy(true);
    setFormError(null);
    try {
      if (formMode === "create") {
        const res = await fetchWithAuth("/api/roadmap/goals", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(values),
        });
        const data = await res.json();
        if (!res.ok || !data.roadmap) {
          setFormError(data.error || "Không thể tạo mục tiêu mới.");
          return;
        }
        applyServerRoadmap(data.roadmap);
        setFormOpen(false);
        setToastMsg({
          type: "success",
          text: `Đã thêm mục tiêu vào Năm ${values.yearNumber}.`,
        });
      } else if (editingGoal) {
        const payload: Record<string, unknown> = {
          title: values.title,
          description: values.description,
          category: values.category,
          semester: values.semester,
          priority: values.priority,
          dueDate: values.dueDate,
        };
        if (values.yearNumber !== editingOriginalYear) {
          payload.targetYearNumber = values.yearNumber;
        }
        const res = await fetchWithAuth(
          `/api/roadmap/goals/${editingGoal.id}`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          }
        );
        const data = await res.json();
        if (!res.ok || !data.roadmap) {
          setFormError(data.error || "Không thể lưu thay đổi mục tiêu.");
          return;
        }
        applyServerRoadmap(data.roadmap);
        setFormOpen(false);
        setToastMsg({
          type: "success",
          text: "Đã cập nhật mục tiêu thành công.",
        });
      }
    } catch {
      setFormError("Lỗi kết nối máy chủ khi lưu mục tiêu.");
    } finally {
      setFormBusy(false);
    }
  };

  // RM07 Delete Goal
  const handleDeleteGoal = async (goalId: string) => {
    setBusyGoalId(goalId);
    try {
      const res = await fetchWithAuth(`/api/roadmap/goals/${goalId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok || !data.roadmap) {
        setToastMsg({
          type: "error",
          text: data.error || "Không thể xóa mục tiêu.",
        });
        return;
      }
      setConfirmDeleteId(null);
      setDrawerOpen(false);
      setDrawerGoal(null);
      applyServerRoadmap(data.roadmap);
      setToastMsg({
        type: "success",
        text: "Đã xóa mục tiêu khỏi lộ trình.",
      });
    } catch {
      setToastMsg({
        type: "error",
        text: "Mất kết nối máy chủ khi xóa mục tiêu.",
      });
    } finally {
      setBusyGoalId(null);
    }
  };

  // RM11 Reorder within a year
  const handleMoveGoal = async (
    yearNumber: 1 | 2 | 3 | 4,
    goalIndex: number,
    direction: "up" | "down"
  ) => {
    if (!roadmap) return;
    const yearObj = roadmap.years.find((y) => y.yearNumber === yearNumber);
    if (!yearObj) return;

    const sortedGoals = [...yearObj.goals].sort((a, b) => a.order - b.order);
    const targetIndex = direction === "up" ? goalIndex - 1 : goalIndex + 1;
    if (targetIndex < 0 || targetIndex >= sortedGoals.length) return;

    const nextGoals = [...sortedGoals];
    const [moved] = nextGoals.splice(goalIndex, 1);
    nextGoals.splice(targetIndex, 0, moved);
    const orderedGoalIds = nextGoals.map((g) => g.id);

    const prevRoadmap = roadmap;
    setRoadmap({
      ...roadmap,
      years: roadmap.years.map((y) =>
        y.yearNumber === yearNumber
          ? {
              ...y,
              goals: nextGoals.map((g, idx) => ({ ...g, order: idx + 1 })),
            }
          : y
      ),
    });

    try {
      const res = await fetchWithAuth(
        `/api/roadmap/years/${yearNumber}/reorder`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderedGoalIds }),
        }
      );
      const data = await res.json();
      if (!res.ok || !data.roadmap) {
        setRoadmap(prevRoadmap);
        setToastMsg({
          type: "error",
          text: data.error || "Không thể lưu thứ tự mục tiêu.",
        });
        return;
      }
      applyServerRoadmap(data.roadmap);
    } catch {
      setRoadmap(prevRoadmap);
      setToastMsg({
        type: "error",
        text: "Lỗi mạng khi cập nhật thứ tự mục tiêu.",
      });
    }
  };

  // RM01 / RM12 Generate or Regenerate Roadmap via Gemini AI
  const openRegenModal = () => {
    const primaryDir =
      latestAnalysis?.analysisResult?.orientationCompatibility?.find(
        (d) => d.isPrimaryRecommendation
      )?.directionTitle ||
      latestAnalysis?.analysisResult?.orientationCompatibility?.[0]
        ?.directionTitle ||
      "";
    setRegenDirection(roadmap?.orientationDirection || primaryDir);
    setRegenNotes("");
    setRegenError(null);
    setRegenOpen(true);
  };

  const handleGenerateRoadmap = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setRegenBusy(true);
    setRegenError(null);
    try {
      const res = await fetchWithAuth("/api/roadmap/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          analysisId: latestAnalysis?._id,
          targetDirection: regenDirection.trim() || undefined,
          notes: regenNotes.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.roadmap) {
        const msg =
          data.error ||
          "Không thể tái tạo lộ trình AI lúc này. Lộ trình hiện tại của bạn vẫn được giữ nguyên.";
        setRegenError(msg);
        if (!regenOpen) {
          setToastMsg({ type: "error", text: msg });
        }
        return;
      }
      setRegenOpen(false);
      setHistoryCount((c) => c + 1);
      applyServerRoadmap(data.roadmap);
      setToastMsg({
        type: "success",
        text: data.message || `Đã tạo lộ trình v${data.roadmap.version}!`,
      });
    } catch {
      const msg =
        "Lỗi kết nối máy chủ khi gọi AI. Lộ trình hiện tại vẫn được bảo toàn.";
      setRegenError(msg);
      if (!regenOpen) setToastMsg({ type: "error", text: msg });
    } finally {
      setRegenBusy(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="flex min-h-[380px] flex-col items-center justify-center rounded-3xl border border-slate-200 bg-white p-8 shadow-xs">
          <Loader2 className="h-9 w-9 animate-spin text-[#102C8A]" />
          <p className="mt-3 text-sm font-medium text-slate-600">
            Đang tải lộ trình phát triển 4 năm của bạn...
          </p>
        </div>
      </div>
    );
  }

  if (pageError) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
        <div className="rounded-3xl border border-rose-200 bg-rose-50 p-8 text-center">
          <AlertTriangle className="mx-auto h-10 w-10 text-rose-600" />
          <h1 className="mt-3 text-lg font-bold text-slate-900">
            Không thể tải lộ trình cá nhân
          </h1>
          <p className="mt-1 text-sm text-rose-700">{pageError}</p>
          <button
            type="button"
            onClick={loadRoadmap}
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#102C8A] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#0B2066]"
          >
            <RefreshCw className="h-4 w-4" />
            Thử tải lại
          </button>
        </div>
      </div>
    );
  }

  // Empty State (RM01)
  if (!roadmap) {
    const canGenerateDirectly =
      latestAnalysis?.status === AI_ANALYSIS_STATUS.COMPLETED;
    return (
      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
        {toastMsg && (
          <div
            className={`mb-5 rounded-2xl border px-4 py-3 text-sm font-medium ${
              toastMsg.type === "error"
                ? "border-rose-200 bg-rose-50 text-rose-800"
                : "border-emerald-200 bg-emerald-50 text-emerald-800"
            }`}
          >
            {toastMsg.text}
          </div>
        )}

        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="bg-linear-to-br from-[#102C8A] via-[#153AA6] to-[#0D9488] px-8 py-10 text-white">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold backdrop-blur-xs">
              <Sparkles className="h-3.5 w-3.5" />
              AI Personal Roadmap
            </div>
            <h1 className="mt-4 text-2xl font-bold sm:text-3xl">
              Bạn chưa có lộ trình phát triển 4 năm
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-blue-100">
              Hoàn thành bài đánh giá định hướng năng lực để Google Gemini AI
              phân tích hồ sơ và kiến tạo lộ trình học tập – kỹ năng – chứng
              chỉ – nghề nghiệp xuyên suốt từ Năm 1 đến Năm 4 dành riêng cho
              bạn.
            </p>
          </div>

          <div className="space-y-6 p-8">
            {canGenerateDirectly && (
              <div className="rounded-2xl border border-teal-200 bg-teal-50/70 p-5">
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                  <div>
                    <div className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-teal-800">
                      <Compass className="h-4 w-4" />
                      Đã có kết quả phân tích AI
                    </div>
                    <p className="mt-1 text-sm font-medium text-slate-800">
                      Hướng đi nổi bật:{" "}
                      <span className="font-bold text-[#102C8A]">
                        {latestAnalysis.analysisResult?.orientationCompatibility?.find(
                          (d) => d.isPrimaryRecommendation
                        )?.directionTitle ||
                          latestAnalysis.analysisResult
                            ?.orientationCompatibility?.[0]?.directionTitle ||
                          "Định hướng cá nhân hóa"}
                      </span>
                    </p>
                  </div>
                  <button
                    type="button"
                    disabled={regenBusy}
                    onClick={() => handleGenerateRoadmap()}
                    className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-[#0D9488] px-5 py-2.5 text-sm font-semibold text-white shadow-xs transition hover:bg-[#0F766E] disabled:opacity-60"
                  >
                    {regenBusy ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Sparkles className="h-4 w-4" />
                    )}
                    Sinh lộ trình AI ngay
                  </button>
                </div>
              </div>
            )}

            <div className="flex flex-wrap items-center gap-3">
              <Link
                href="/onboarding"
                className="inline-flex items-center gap-2 rounded-xl bg-[#102C8A] px-5 py-2.5 text-sm font-semibold text-white shadow-xs transition hover:bg-[#0B2066]"
              >
                <ClipboardCheck className="h-4 w-4" />
                Làm bài đánh giá định hướng
              </Link>
              {latestSubmissionId && (
                <Link
                  href={`/onboarding/result/${latestSubmissionId}`}
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  Xem kết quả phân tích gần nhất
                </Link>
              )}
              {historyCount > 0 && (
                <Link
                  href="/roadmap/history"
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  <History className="h-4 w-4" />
                  Khôi phục từ lịch sử ({historyCount})
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-8 sm:px-6">
      {toastMsg && (
        <div
          className={`flex items-center justify-between rounded-2xl border px-4 py-3 text-sm font-medium shadow-xs ${
            toastMsg.type === "error"
              ? "border-rose-200 bg-rose-50 text-rose-800"
              : "border-emerald-200 bg-emerald-50 text-emerald-800"
          }`}
        >
          <span>{toastMsg.text}</span>
          <button
            type="button"
            onClick={() => setToastMsg(null)}
            className="rounded-lg p-1 hover:bg-black/5"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Hero Header + Progress Overview */}
      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="bg-linear-to-r from-[#102C8A] via-[#173B9F] to-[#0D9488] px-6 py-7 text-white sm:px-8">
          <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-start">
            <div className="space-y-2.5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold">
                  <MapIcon className="h-3.5 w-3.5" />
                  Phiên bản v{roadmap.version}
                </span>
                <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-medium">
                  {roadmap.source === ROADMAP_SOURCE.RESTORED_FROM_HISTORY
                    ? "Khôi phục từ lịch sử"
                    : "Khởi tạo bởi Gemini AI"}
                </span>
                <span className="rounded-full bg-amber-300/20 px-3 py-1 text-xs font-semibold text-amber-100">
                  {roadmap.orientationDirection}
                </span>
              </div>
              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                {roadmap.title}
              </h1>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={() => openCreateGoal()}
                className="inline-flex items-center gap-1.5 rounded-xl bg-white px-4 py-2 text-sm font-semibold text-[#102C8A] shadow-xs transition hover:bg-blue-50"
              >
                <Plus className="h-4 w-4" />
                Thêm mục tiêu
              </button>
              <button
                type="button"
                onClick={openRegenModal}
                className="inline-flex items-center gap-1.5 rounded-xl bg-white/15 px-4 py-2 text-sm font-semibold text-white backdrop-blur-xs transition hover:bg-white/25"
              >
                <Sparkles className="h-4 w-4" />
                Tái tạo lộ trình AI
              </button>
              <Link
                href="/roadmap/history"
                className="inline-flex items-center gap-1.5 rounded-xl border border-white/25 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                <History className="h-4 w-4" />
                Lịch sử ({historyCount})
              </Link>
            </div>
          </div>
        </div>

        {/* Overall Progress Bar (RM10) */}
        {progress && (
          <div className="grid grid-cols-1 gap-5 border-t border-slate-100 bg-slate-50/70 px-6 py-5 sm:px-8 lg:grid-cols-12 lg:items-center">
            <div className="lg:col-span-7">
              <div className="mb-2 flex items-center justify-between text-sm">
                <span className="font-semibold text-slate-800">
                  Tiến độ tổng thể 4 năm
                </span>
                <span className="font-bold text-[#102C8A]">
                  {progress.progressPercent}% ({progress.completedGoals}/
                  {progress.countableGoals} mục tiêu)
                </span>
              </div>
              <div className="h-3 w-full overflow-hidden rounded-full bg-slate-200">
                <div
                  className="h-full rounded-full bg-linear-to-r from-[#102C8A] to-[#0D9488] transition-all duration-300"
                  style={{ width: `${progress.progressPercent}%` }}
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2.5 text-center lg:col-span-5">
              <div className="rounded-xl border border-slate-200 bg-white px-3 py-2">
                <div className="text-base font-bold text-emerald-600">
                  {progress.completedGoals}
                </div>
                <div className="text-[11px] font-medium text-slate-500">
                  Hoàn thành
                </div>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white px-3 py-2">
                <div className="text-base font-bold text-sky-600">
                  {progress.inProgressGoals}
                </div>
                <div className="text-[11px] font-medium text-slate-500">
                  Đang thực hiện
                </div>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white px-3 py-2">
                <div className="text-base font-bold text-slate-500">
                  {progress.skippedGoals}
                </div>
                <div className="text-[11px] font-medium text-slate-500">
                  Đã bỏ qua
                </div>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Filter Bar: Year Tabs (RM03) + Status Filter */}
      <section className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setSelectedYear("all")}
            className={`rounded-xl px-3.5 py-2 text-xs font-semibold transition sm:text-sm ${
              selectedYear === "all"
                ? "bg-[#102C8A] text-white shadow-xs"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            Tất cả (Năm 1–4)
          </button>
          {([1, 2, 3, 4] as const).map((yr) => {
            const yrProg = yearProgressMap.get(yr);
            const isCurrent = currentAcademicYear === yr;
            const active = selectedYear === yr;
            return (
              <button
                key={yr}
                type="button"
                onClick={() => setSelectedYear(yr)}
                className={`inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-semibold transition sm:text-sm ${
                  active
                    ? "bg-[#102C8A] text-white shadow-xs"
                    : isCurrent
                      ? "border border-[#0D9488]/40 bg-teal-50 text-teal-800 hover:bg-teal-100"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                <span>Năm {yr}</span>
                {isCurrent && (
                  <span
                    className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                      active
                        ? "bg-white/20 text-white"
                        : "bg-[#0D9488] text-white"
                    }`}
                  >
                    Hiện tại
                  </span>
                )}
                {yrProg && (
                  <span
                    className={`text-[11px] ${
                      active ? "text-blue-100" : "text-slate-500"
                    }`}
                  >
                    {yrProg.progressPercent}%
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-500">
            <Filter className="h-3.5 w-3.5" />
            Trạng thái:
          </span>
          {(
            [
              ["ALL", "Tất cả"],
              [ROADMAP_GOAL_STATUSES.NOT_STARTED, "Chưa bắt đầu"],
              [ROADMAP_GOAL_STATUSES.IN_PROGRESS, "Đang thực hiện"],
              [ROADMAP_GOAL_STATUSES.COMPLETED, "Hoàn thành"],
              [ROADMAP_GOAL_STATUSES.SKIPPED, "Bỏ qua"],
            ] as const
          ).map(([val, label]) => (
            <button
              key={val}
              type="button"
              onClick={() => setStatusFilter(val)}
              className={`rounded-lg px-2.5 py-1.5 text-xs font-medium transition ${
                statusFilter === val
                  ? "bg-slate-900 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </section>

      {/* Years & Goals Grid */}
      <div className="space-y-6">
        {visibleYears.map((year) => {
          const yrProg = yearProgressMap.get(year.yearNumber);
          const isCurrent = currentAcademicYear === year.yearNumber;
          const orderedGoals = [...year.goals].sort(
            (a, b) => a.order - b.order
          );
          const filteredGoals =
            statusFilter === "ALL"
              ? orderedGoals
              : orderedGoals.filter((g) => g.status === statusFilter);

          return (
            <section
              key={year.yearNumber}
              className={`overflow-hidden rounded-3xl border bg-white shadow-xs ${
                isCurrent
                  ? "border-[#0D9488]/50 ring-1 ring-[#0D9488]/20"
                  : "border-slate-200"
              }`}
            >
              <div className="flex flex-col justify-between gap-4 border-b border-slate-100 bg-slate-50/70 px-6 py-5 sm:flex-row sm:items-center">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-lg bg-[#102C8A] px-2.5 py-1 text-xs font-bold text-white">
                      Năm {year.yearNumber}
                    </span>
                    <h2 className="text-lg font-bold text-slate-900">
                      {year.title}
                    </h2>
                    {isCurrent && (
                      <span className="rounded-full bg-[#0D9488]/15 px-2.5 py-0.5 text-xs font-semibold text-[#0D9488]">
                        Giai đoạn hiện tại của bạn
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-slate-600">{year.summary}</p>
                </div>

                <div className="flex shrink-0 flex-wrap items-center gap-3">
                  {yrProg && (
                    <div className="text-right">
                      <div className="text-xs font-semibold text-slate-700">
                        {yrProg.completedGoals}/{yrProg.countableGoals} mục tiêu
                        ({yrProg.progressPercent}%)
                      </div>
                      <div className="mt-1 h-2 w-36 overflow-hidden rounded-full bg-slate-200">
                        <div
                          className="h-full rounded-full bg-[#0D9488] transition-all"
                          style={{ width: `${yrProg.progressPercent}%` }}
                        />
                      </div>
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => openCreateGoal(year.yearNumber)}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-[#102C8A] shadow-2xs transition hover:border-[#102C8A]/40 hover:bg-blue-50/60"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Thêm mục tiêu Năm {year.yearNumber}
                  </button>
                </div>
              </div>

              <div className="divide-y divide-slate-100">
                {filteredGoals.length === 0 ? (
                  <div className="px-6 py-10 text-center text-sm text-slate-500">
                    {orderedGoals.length === 0
                      ? `Chưa có mục tiêu nào trong Năm ${year.yearNumber}. Hãy bấm "Thêm mục tiêu Năm ${year.yearNumber}" để tự bổ sung.`
                      : "Không có mục tiêu nào khớp với bộ lọc trạng thái hiện tại."}
                  </div>
                ) : (
                  filteredGoals.map((goal, idx) => {
                    const catMeta = GOAL_CATEGORY_META[goal.category];
                    const prioMeta = GOAL_PRIORITY_META[goal.priority];
                    const isCompleted =
                      goal.status === ROADMAP_GOAL_STATUSES.COMPLETED;
                    const isSkipped =
                      goal.status === ROADMAP_GOAL_STATUSES.SKIPPED;
                    const isBusy = busyGoalId === goal.id;
                    const allowReorder = statusFilter === "ALL";

                    return (
                      <div
                        key={goal.id}
                        className={`flex flex-col gap-3 px-6 py-4 transition hover:bg-slate-50/80 lg:flex-row lg:items-center lg:justify-between ${
                          isSkipped ? "opacity-65" : ""
                        }`}
                      >
                        <div className="flex min-w-0 flex-1 items-start gap-3.5">
                          {/* RM08 Quick Complete Checkbox */}
                          <button
                            type="button"
                            disabled={isBusy}
                            onClick={() =>
                              handleStatusChange(
                                goal.id,
                                isCompleted
                                  ? ROADMAP_GOAL_STATUSES.NOT_STARTED
                                  : ROADMAP_GOAL_STATUSES.COMPLETED
                              )
                            }
                            aria-label={
                              isCompleted
                                ? `Bỏ đánh dấu hoàn thành ${goal.title}`
                                : `Đánh dấu hoàn thành ${goal.title}`
                            }
                            className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border-2 transition ${
                              isCompleted
                                ? "border-emerald-600 bg-emerald-600 text-white"
                                : "border-slate-300 bg-white text-transparent hover:border-[#102C8A]"
                            }`}
                          >
                            <Check className="h-4 w-4 stroke-[2.5]" />
                          </button>

                          <div className="min-w-0 flex-1 space-y-1.5">
                            <div className="flex flex-wrap items-center gap-2">
                              <button
                                type="button"
                                onClick={() => {
                                  setDrawerGoal({
                                    yearNumber: year.yearNumber,
                                    goal,
                                  });
                                  setDrawerOpen(true);
                                }}
                                className={`text-left text-sm font-semibold transition hover:text-[#102C8A] sm:text-base ${
                                  isCompleted || isSkipped
                                    ? "line-through text-slate-500"
                                    : "text-slate-900"
                                }`}
                              >
                                {goal.title}
                              </button>
                              {goal.isCustom && (
                                <span className="inline-flex items-center gap-1 rounded-full bg-teal-50 px-2 py-0.5 text-[11px] font-medium text-teal-700">
                                  <UserCheck className="h-3 w-3" />
                                  Tự thêm
                                </span>
                              )}
                            </div>

                            {goal.description && (
                              <p className="line-clamp-2 text-xs leading-relaxed text-slate-600 sm:text-sm">
                                {goal.description}
                              </p>
                            )}

                            <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                              <span
                                className={`rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${catMeta.badgeClass}`}
                              >
                                {catMeta.label}
                              </span>
                              <span
                                className={`rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${prioMeta.badgeClass}`}
                              >
                                {prioMeta.label}
                              </span>
                              <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-[11px] font-medium text-slate-600">
                                {semesterLabel(goal.semester)}
                              </span>
                              {goal.dueDate && (
                                <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-2.5 py-0.5 text-[11px] text-slate-600">
                                  <Calendar className="h-3 w-3 text-slate-400" />
                                  Hạn:{" "}
                                  {new Date(goal.dueDate).toLocaleDateString(
                                    "vi-VN"
                                  )}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Actions: 4-state status pill (RM09) + Reorder (RM11) + Detail/Edit/Delete */}
                        <div className="flex flex-wrap items-center justify-end gap-2 pl-9 lg:pl-0">
                          <select
                            aria-label={`Trạng thái mục tiêu ${goal.title}`}
                            disabled={isBusy}
                            value={goal.status}
                            onChange={(e) =>
                              handleStatusChange(
                                goal.id,
                                e.target.value as RoadmapGoalStatus
                              )
                            }
                            className={`rounded-xl border px-3 py-1.5 text-xs font-semibold outline-hidden transition ${GOAL_STATUS_META[goal.status].badgeClass}`}
                          >
                            {Object.entries(GOAL_STATUS_META).map(
                              ([statusKey, meta]) => (
                                <option key={statusKey} value={statusKey}>
                                  {meta.label}
                                </option>
                              )
                            )}
                          </select>

                          {allowReorder && (
                            <div className="inline-flex items-center rounded-xl border border-slate-200 bg-white p-0.5">
                              <button
                                type="button"
                                disabled={idx === 0 || isBusy}
                                onClick={() =>
                                  handleMoveGoal(year.yearNumber, idx, "up")
                                }
                                title="Di chuyển lên"
                                aria-label={`Đưa ${goal.title} lên`}
                                className="rounded-lg p-1.5 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 disabled:opacity-35"
                              >
                                <ArrowUp className="h-3.5 w-3.5" />
                              </button>
                              <button
                                type="button"
                                disabled={
                                  idx === filteredGoals.length - 1 || isBusy
                                }
                                onClick={() =>
                                  handleMoveGoal(year.yearNumber, idx, "down")
                                }
                                title="Di chuyển xuống"
                                aria-label={`Đưa ${goal.title} xuống`}
                                className="rounded-lg p-1.5 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 disabled:opacity-35"
                              >
                                <ArrowDown className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          )}

                          <button
                            type="button"
                            onClick={() => {
                              setDrawerGoal({
                                yearNumber: year.yearNumber,
                                goal,
                              });
                              setDrawerOpen(true);
                            }}
                            title="Xem chi tiết"
                            className="rounded-xl border border-slate-200 bg-white p-2 text-slate-600 transition hover:border-[#102C8A]/40 hover:text-[#102C8A]"
                          >
                            <Eye className="h-4 w-4" />
                          </button>

                          <button
                            type="button"
                            onClick={() => openEditGoal(goal, year.yearNumber)}
                            title="Chỉnh sửa"
                            className="rounded-xl border border-slate-200 bg-white p-2 text-slate-600 transition hover:border-[#102C8A]/40 hover:text-[#102C8A]"
                          >
                            <Edit3 className="h-4 w-4" />
                          </button>

                          {confirmDeleteId === goal.id ? (
                            <div className="inline-flex items-center gap-1 rounded-xl border border-rose-200 bg-rose-50 px-2 py-1">
                              <button
                                type="button"
                                disabled={isBusy}
                                onClick={() => handleDeleteGoal(goal.id)}
                                className="text-xs font-semibold text-rose-700 hover:underline"
                              >
                                Xóa
                              </button>
                              <span className="text-slate-300">|</span>
                              <button
                                type="button"
                                onClick={() => setConfirmDeleteId(null)}
                                className="text-xs text-slate-600 hover:underline"
                              >
                                Hủy
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteId(goal.id)}
                              title="Xóa mục tiêu"
                              className="rounded-xl border border-slate-200 bg-white p-2 text-slate-500 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </section>
          );
        })}
      </div>

      {/* Add / Edit Goal Modal (RM05, RM06) */}
      <GoalFormModal
        open={formOpen}
        mode={formMode}
        initialYearNumber={formInitialYear}
        goal={editingGoal}
        submitting={formBusy}
        errorMsg={formError}
        onClose={() => setFormOpen(false)}
        onSubmit={handleGoalFormSubmit}
      />

      {/* Goal Detail Drawer (RM04, RM07, RM09) */}
      <GoalDetailDrawer
        open={drawerOpen}
        yearNumber={drawerGoal?.yearNumber || 1}
        goal={drawerGoal?.goal || null}
        busy={drawerGoal ? busyGoalId === drawerGoal.goal.id : false}
        onClose={() => setDrawerOpen(false)}
        onStatusChange={handleStatusChange}
        onEdit={openEditGoal}
        onDelete={handleDeleteGoal}
      />

      {/* AI Regenerate Modal (RM12) */}
      {regenOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
          aria-label="Tái tạo lộ trình 4 năm bằng Gemini AI"
        >
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-[#102C8A]" />
                <h2 className="text-lg font-bold text-slate-900">
                  Tái tạo lộ trình 4 năm với Gemini AI
                </h2>
              </div>
              <button
                type="button"
                disabled={regenBusy}
                onClick={() => setRegenOpen(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleGenerateRoadmap} className="space-y-4 p-6">
              <div className="rounded-xl border border-blue-100 bg-blue-50/70 px-4 py-3 text-xs leading-relaxed text-slate-700">
                Lộ trình hiện tại (<strong>v{roadmap.version}</strong>) sẽ được
                lưu vào{" "}
                <Link
                  href="/roadmap/history"
                  className="font-semibold text-[#102C8A] underline"
                >
                  Lịch sử lộ trình
                </Link>{" "}
                nếu tái tạo thành công. Nếu AI gặp sự cố, lộ trình hiện tại của
                bạn vẫn được giữ nguyên.
              </div>

              {regenError && (
                <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                  {regenError}
                </div>
              )}

              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Hướng đi mục tiêu ưu tiên
                </label>
                <input
                  type="text"
                  value={regenDirection}
                  onChange={(e) => setRegenDirection(e.target.value)}
                  maxLength={160}
                  placeholder="Ví dụ: Đi làm doanh nghiệp (Business Analyst / EdTech) hoặc Du học Thạc sĩ..."
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 outline-hidden focus:border-[#102C8A]"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Ghi chú điều chỉnh cho AI (không bắt buộc)
                </label>
                <textarea
                  value={regenNotes}
                  onChange={(e) => setRegenNotes(e.target.value)}
                  rows={3}
                  maxLength={1000}
                  placeholder="Ví dụ: Tôi vừa đạt IELTS 6.5 và muốn tập trung thêm chứng chỉ phân tích dữ liệu, chuẩn bị thực tập từ Năm 3..."
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 outline-hidden focus:border-[#102C8A]"
                />
              </div>

              <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-4">
                <button
                  type="button"
                  disabled={regenBusy}
                  onClick={() => setRegenOpen(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Đóng
                </button>
                <button
                  type="submit"
                  disabled={regenBusy}
                  className="inline-flex items-center gap-2 rounded-xl bg-[#102C8A] px-5 py-2 text-sm font-semibold text-white shadow-xs transition hover:bg-[#0B2066] disabled:opacity-60"
                >
                  {regenBusy ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Sparkles className="h-4 w-4" />
                  )}
                  {regenBusy
                    ? "Gemini AI đang thiết kế..."
                    : "Bắt đầu tái tạo lộ trình"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
