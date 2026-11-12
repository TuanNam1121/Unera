"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Award,
  BookOpen,
  Briefcase,
  CheckCircle2,
  Compass,
  History,
  Info,
  Loader2,
  LogIn,
  RotateCcw,
  Sparkles,
  Trash2,
} from "lucide-react";
import { fetchWithAuth, useAuth } from "@/components/providers/AuthProvider";
import { MiRadarChart } from "@/components/tools/MiRadarChart";
import { ToolSubNav } from "@/components/tools/ToolSubNav";
import { Button } from "@/components/ui/button";
import {
  MI_LIKERT_OPTIONS,
  MI_PROFILES,
  MI_QUESTIONS,
  type MiCategoryKey,
} from "@/constants/mi";
import {
  calculateMiResult,
  type MiComputedResult,
  validateMiAnswers,
} from "@/lib/tools/mi";
import { cn } from "@/lib/utils";
import type { IToolResultDTO } from "@/types";

const DRAFT_STORAGE_KEY = "unera_tool_mi_draft_v1";
const QUESTIONS_PER_PAGE = 10;
const TOTAL_PAGES = Math.ceil(MI_QUESTIONS.length / QUESTIONS_PER_PAGE);

type ActiveTab = "test" | "history";

function formatShortDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Ho_Chi_Minh",
  }).format(date);
}

export function MiAssessmentClient() {
  const searchParams = useSearchParams();
  const initialTabParam = searchParams.get("tab");
  const initialResultIdParam = searchParams.get("resultId");

  const { user, loading: authLoading } = useAuth();

  const [activeTab, setActiveTab] = useState<ActiveTab>(
    initialTabParam === "history" ? "history" : "test"
  );
  const [answers, setAnswers] = useState<Record<string, 1 | 2 | 3 | 4 | 5>>({});
  const [currentPage, setCurrentPage] = useState(0);
  const [flaggedMissingIds, setFlaggedMissingIds] = useState<Set<string>>(
    () => new Set()
  );
  const [submitWarning, setSubmitWarning] = useState<string | null>(null);
  const [computedResult, setComputedResult] = useState<MiComputedResult | null>(
    null
  );
  const [viewingHistoryMeta, setViewingHistoryMeta] = useState<{
    id: string;
    createdAt: string;
  } | null>(null);

  const [savingResult, setSavingResult] = useState(false);
  const [saveFeedback, setSaveFeedback] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const [rawHistoryList, setHistoryList] = useState<IToolResultDTO[]>([]);
  const [loadedUserId, setLoadedUserId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const historyList = useMemo(
    () => (user ? rawHistoryList : []),
    [user, rawHistoryList]
  );
  const loadingHistory = Boolean(user) && loadedUserId !== user?.id;

  useEffect(() => {
    let active = true;
    Promise.resolve().then(() => {
      if (!active || typeof window === "undefined") return;
      try {
        const raw = window.localStorage.getItem(DRAFT_STORAGE_KEY);
        if (!raw) return;
        const parsed = JSON.parse(raw) as unknown;
        if (!parsed || typeof parsed !== "object") return;
        const clean: Record<string, 1 | 2 | 3 | 4 | 5> = {};
        for (const q of MI_QUESTIONS) {
          const val = Number((parsed as Record<string, unknown>)[q.id]);
          if (Number.isInteger(val) && val >= 1 && val <= 5) {
            clean[q.id] = val as 1 | 2 | 3 | 4 | 5;
          }
        }
        if (Object.keys(clean).length > 0) {
          setAnswers(clean);
        }
      } catch {
        // Bỏ qua lỗi đọc nháp
      }
    });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (authLoading || !user) return;
    let active = true;
    fetchWithAuth("/api/tools/results?type=MI&limit=20", {
      cache: "no-store",
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!active) return;
        if (data && Array.isArray(data.results)) {
          setHistoryList(data.results);
        }
        setLoadedUserId(user.id);
      })
      .catch(() => {
        if (active) setLoadedUserId(user.id);
      });

    return () => {
      active = false;
    };
  }, [authLoading, user]);

  useEffect(() => {
    if (!initialResultIdParam || historyList.length === 0) return;
    const match = historyList.find((item) => item._id === initialResultIdParam);
    if (!match) return;
    Promise.resolve().then(() => {
      try {
        const recalculated = calculateMiResult(match.answers || {});
        setComputedResult(recalculated);
        setViewingHistoryMeta({ id: match._id, createdAt: match.createdAt });
        setActiveTab("test");
      } catch {
        // Bỏ qua nếu dữ liệu không tương thích
      }
    });
  }, [initialResultIdParam, historyList]);

  const answeredCount = useMemo(
    () =>
      MI_QUESTIONS.filter((q) => {
        const v = answers[q.id];
        return Number.isInteger(v) && v >= 1 && v <= 5;
      }).length,
    [answers]
  );

  const progressPct = Math.round((answeredCount / MI_QUESTIONS.length) * 100);

  const pageQuestions = useMemo(() => {
    const start = currentPage * QUESTIONS_PER_PAGE;
    return MI_QUESTIONS.slice(start, start + QUESTIONS_PER_PAGE);
  }, [currentPage]);

  const handleSelectLikert = (questionId: string, value: 1 | 2 | 3 | 4 | 5) => {
    setAnswers((prev) => {
      const next = { ...prev, [questionId]: value };
      if (typeof window !== "undefined") {
        try {
          window.localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(next));
        } catch {
          // Bỏ qua lỗi quota
        }
      }
      return next;
    });

    if (flaggedMissingIds.has(questionId)) {
      setFlaggedMissingIds((prev) => {
        const next = new Set(prev);
        next.delete(questionId);
        return next;
      });
    }
    if (submitWarning) setSubmitWarning(null);
  };

  const handleResetTest = () => {
    setAnswers({});
    setCurrentPage(0);
    setComputedResult(null);
    setViewingHistoryMeta(null);
    setFlaggedMissingIds(new Set());
    setSubmitWarning(null);
    setSaveFeedback(null);
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(DRAFT_STORAGE_KEY);
    }
  };

  const handleJumpToQuestion = (questionIndex: number, questionId: string) => {
    const targetPage = Math.floor(questionIndex / QUESTIONS_PER_PAGE);
    setCurrentPage(targetPage);
    requestAnimationFrame(() => {
      setTimeout(() => {
        document.getElementById(`mi-q-${questionId}`)?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }, 45);
    });
  };

  const handleSubmit = async () => {
    const check = validateMiAnswers(answers);
    if (!check.valid) {
      setFlaggedMissingIds(new Set(check.missingIds));
      const firstMissingId = check.missingIds[0];
      const firstIdx = MI_QUESTIONS.findIndex((q) => q.id === firstMissingId);
      const questionNo = firstIdx >= 0 ? MI_QUESTIONS[firstIdx].order : 1;

      setSubmitWarning(
        `Còn ${check.missingIds.length} phát biểu chưa chọn mức độ (1–5). Vui lòng hoàn thành Phát biểu ${questionNo}.`
      );
      if (firstIdx >= 0) {
        handleJumpToQuestion(firstIdx, firstMissingId);
      }
      return;
    }

    const result = calculateMiResult(check.normalized);
    setComputedResult(result);
    setViewingHistoryMeta(null);
    setSubmitWarning(null);
    setFlaggedMissingIds(new Set());

    if (typeof window !== "undefined") {
      window.localStorage.removeItem(DRAFT_STORAGE_KEY);
    }
    window.scrollTo({ top: 0, behavior: "smooth" });

    if (user) {
      setSavingResult(true);
      setSaveFeedback(null);
      try {
        const res = await fetchWithAuth("/api/tools/results", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            toolType: "MI",
            answers: check.normalized,
          }),
        });
        const data = await res.json();
        if (res.ok && data.result) {
          setSaveFeedback({
            type: "success",
            text: "Đã lưu kết quả Đa trí thông minh MI vào lịch sử tài khoản.",
          });
          setHistoryList((prev) => [data.result, ...prev]);
        } else {
          setSaveFeedback({
            type: "error",
            text: data.error || "Không thể lưu lịch sử kết quả MI.",
          });
        }
      } catch {
        setSaveFeedback({
          type: "error",
          text: "Lỗi kết nối khi lưu lịch sử kết quả.",
        });
      } finally {
        setSavingResult(false);
      }
    }
  };

  const handleOpenHistoryItem = (item: IToolResultDTO) => {
    const recalculated = calculateMiResult(item.answers || {});
    setComputedResult(recalculated);
    setViewingHistoryMeta({ id: item._id, createdAt: item.createdAt });
    setSaveFeedback(null);
    setActiveTab("test");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDeleteHistoryItem = async (id: string) => {
    setDeletingId(id);
    try {
      const res = await fetchWithAuth(`/api/tools/results/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setHistoryList((prev) => prev.filter((item) => item._id !== id));
        if (viewingHistoryMeta?.id === id) setViewingHistoryMeta(null);
      }
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="w-full px-6 sm:px-8 py-6 space-y-6">
      <ToolSubNav />

      {/* Header & Tabs */}
      <div className="rounded-3xl bg-gradient-to-r from-[#DCEBFE] via-[#E8F1FD] to-[#D5E7FD] p-6 sm:p-8 flex flex-col lg:flex-row lg:items-center justify-between gap-5 border border-blue-100">
        <div className="space-y-2 max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/85 px-3 py-1 text-xs font-semibold text-blue-700 border border-blue-200/80">
            <Sparkles className="h-3.5 w-3.5" />
            <span>TOOL-02 · Đa Trí Thông Minh Howard Gardner (8 Nhóm · 40 Câu)</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
            Trắc Nghiệm Đa Trí Thông Minh (MI)
          </h1>
          <p className="text-sm text-slate-600 leading-relaxed">
            Đo lường 8 loại hình trí thông minh của bạn theo thang 0–100%, nhận diện Top 3 năng lực vượt trội nhất
            cùng phương pháp học đại học và nhóm ngành nghề tối ưu.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab("test")}
            className={cn(
              "inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold transition-all cursor-pointer",
              activeTab === "test"
                ? "bg-blue-600 text-white shadow-sm shadow-blue-500/20"
                : "bg-white/90 text-slate-700 border border-slate-200 hover:bg-white"
            )}
          >
            <Sparkles className="h-4 w-4" />
            <span>{computedResult ? "Kết quả & Bài test" : "Làm bài trắc nghiệm"}</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("history")}
            className={cn(
              "inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold transition-all cursor-pointer",
              activeTab === "history"
                ? "bg-blue-600 text-white shadow-sm shadow-blue-500/20"
                : "bg-white/90 text-slate-700 border border-slate-200 hover:bg-white"
            )}
          >
            <History className="h-4 w-4" />
            <span>Lịch sử MI ({historyList.length})</span>
          </button>
        </div>
      </div>

      {/* History Tab */}
      {activeTab === "history" ? (
        <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-[0_2px_8px_rgba(0,0,0,0.02)] space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Lịch sử kết quả Đa trí thông minh (MI)
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Theo dõi sự thay đổi và phát triển các chỉ số trí thông minh của bạn qua từng học kỳ.
              </p>
            </div>
            <Button
              type="button"
              size="sm"
              onClick={() => {
                setActiveTab("test");
                if (computedResult) handleResetTest();
              }}
            >
              Làm bài test MI mới
            </Button>
          </div>

          {!user && !authLoading ? (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-blue-100 bg-blue-50/70 p-5">
              <div className="flex items-start gap-3">
                <LogIn className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    Đăng nhập để lưu và theo dõi lịch sử kết quả MI
                  </p>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Bạn vẫn có thể thực hiện trắc nghiệm MI và xem biểu đồ Radar ngay cả khi chưa đăng nhập.
                  </p>
                </div>
              </div>
              <Link
                href="/login?callbackUrl=/tools/mi"
                className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700 shrink-0"
              >
                <LogIn className="h-3.5 w-3.5" />
                Đăng nhập ngay
              </Link>
            </div>
          ) : loadingHistory ? (
            <div className="flex h-40 items-center justify-center gap-2 text-sm text-slate-500">
              <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
              <span>Đang tải lịch sử MI...</span>
            </div>
          ) : historyList.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 p-10 text-center space-y-2">
              <p className="text-sm font-semibold text-slate-700">
                Bạn chưa có kết quả trắc nghiệm MI nào được lưu
              </p>
              <p className="text-xs text-slate-500">
                Hoàn thành 40 phát biểu để xem biểu đồ Radar và Top 3 trí thông minh nổi trội.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {historyList.map((item) => {
                const topMeta = MI_PROFILES[item.resultCode as MiCategoryKey];
                return (
                  <div
                    key={item._id}
                    className="rounded-2xl border border-slate-200/80 bg-slate-50/40 p-4 flex flex-col justify-between gap-4 hover:border-blue-200 hover:bg-white transition-all"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <span
                          className={cn(
                            "rounded-lg border px-2.5 py-1 text-[11px] font-bold",
                            topMeta?.badgeClass || "bg-blue-50 text-blue-700 border-blue-200"
                          )}
                        >
                          #1 {topMeta?.shortLabel || item.resultCode}
                        </span>
                        <span className="text-[11px] text-slate-400">
                          {formatShortDate(item.createdAt)}
                        </span>
                      </div>
                      <h3 className="text-sm font-bold text-slate-900">
                        {topMeta?.nameVi || item.resultCode}
                      </h3>
                      <p className="text-xs text-slate-600">{item.summary}</p>
                    </div>

                    <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="text-xs"
                        onClick={() => handleOpenHistoryItem(item)}
                      >
                        Xem biểu đồ & Top 3
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        disabled={deletingId === item._id}
                        onClick={() => handleDeleteHistoryItem(item._id)}
                        className="text-rose-600 hover:bg-rose-50"
                        title="Xóa kết quả này"
                      >
                        {deletingId === item._id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="h-3.5 w-3.5" />
                        )}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : computedResult ? (
        /* Màn hình Kết quả MI + Radar Chart + Top 3 */
        <div className="space-y-6">
          {viewingHistoryMeta && (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-indigo-200 bg-indigo-50/70 px-5 py-3 text-xs text-indigo-800">
              <span>
                Đang xem lại kết quả MI lưu ngày{" "}
                <strong>{formatShortDate(viewingHistoryMeta.createdAt)}</strong>.
              </span>
              <button
                type="button"
                onClick={handleResetTest}
                className="font-semibold underline hover:text-indigo-950 cursor-pointer"
              >
                Bắt đầu làm bài test mới
              </button>
            </div>
          )}

          {savingResult && (
            <div className="flex items-center gap-2 rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-xs font-medium text-blue-700">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Đang lưu kết quả MI vào tài khoản...</span>
            </div>
          )}

          {saveFeedback && (
            <div
              className={cn(
                "flex items-center gap-2 rounded-2xl border px-4 py-3 text-xs font-medium",
                saveFeedback.type === "success"
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                  : "border-rose-200 bg-rose-50 text-rose-700"
              )}
            >
              {saveFeedback.type === "success" ? (
                <CheckCircle2 className="h-4 w-4 shrink-0" />
              ) : (
                <AlertCircle className="h-4 w-4 shrink-0" />
              )}
              <span>{saveFeedback.text}</span>
            </div>
          )}

          {!user && !authLoading && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-amber-200 bg-amber-50/80 px-5 py-3.5">
              <div className="flex items-start gap-2.5 text-xs text-amber-900">
                <Info className="h-4 w-4 shrink-0 mt-0.5 text-amber-600" />
                <span>
                  Đăng nhập để lưu lại kết quả Đa trí thông minh vào hồ sơ và so sánh qua từng giai đoạn đại học.
                </span>
              </div>
              <Link
                href="/login?callbackUrl=/tools/mi"
                className="inline-flex items-center gap-1.5 rounded-xl bg-amber-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-amber-700 shrink-0"
              >
                <LogIn className="h-3.5 w-3.5" />
                Đăng nhập để lưu
              </Link>
            </div>
          )}

          {/* Biểu đồ Radar + Bảng xếp hạng 8 nhóm */}
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 rounded-3xl border border-slate-200/80 bg-white p-6 sm:p-8 shadow-[0_2px_10px_rgba(0,0,0,0.03)]">
            <div className="xl:col-span-5 flex flex-col items-center justify-between space-y-4">
              <div className="w-full flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    Biểu đồ Đa Trí Thông Minh
                  </h2>
                  <p className="text-xs text-slate-500">
                    Thang điểm chuẩn hóa 0–100% cho cả 8 nhóm năng lực
                  </p>
                </div>
                <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                  Top 1: {computedResult.top3[0]?.percentage}%
                </span>
              </div>

              <MiRadarChart items={computedResult.ranked} />

              <div className="w-full flex flex-wrap items-center gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleResetTest}
                  className="gap-1.5"
                >
                  <RotateCcw className="h-4 w-4" />
                  Làm lại bài test
                </Button>
                <Link
                  href="/onboarding"
                  className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white hover:bg-blue-700 transition-colors"
                >
                  <Compass className="h-4 w-4" />
                  <span>Tích hợp sang Định hướng AI</span>
                </Link>
              </div>
            </div>

            {/* Horizontal Bar Ranking 1..8 */}
            <div className="xl:col-span-7 space-y-3 rounded-2xl border border-slate-100 bg-slate-50/70 p-5">
              <h3 className="text-sm font-bold text-slate-900">
                Xếp hạng Chi tiết 8 Loại Trí Thông Minh
              </h3>
              <div className="space-y-3">
                {computedResult.ranked.map((item) => (
                  <div
                    key={item.category}
                    className="rounded-xl bg-white border border-slate-200/70 p-3 space-y-1.5"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                      <div className="flex items-center gap-2">
                        <span
                          className={cn(
                            "inline-flex h-5 w-5 items-center justify-center rounded-md text-[11px] font-bold",
                            item.rank <= 3
                              ? "bg-blue-600 text-white"
                              : "bg-slate-100 text-slate-600"
                          )}
                        >
                          {item.rank}
                        </span>
                        <span className="font-semibold text-slate-900">
                          {item.nameVi}
                        </span>
                        <span className="text-[11px] text-slate-400">
                          ({item.englishTag})
                        </span>
                        {item.rank <= 3 && (
                          <span className="rounded-full bg-amber-50 border border-amber-200 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
                            Top 3
                          </span>
                        )}
                      </div>
                      <span className="font-bold text-slate-900 tabular-nums">
                        {item.percentage}% ({item.rawScore}/{item.maxScore})
                      </span>
                    </div>
                    <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
                      <div
                        style={{
                          width: `${item.percentage}%`,
                          backgroundColor: item.colorHex,
                        }}
                        className="h-full rounded-full transition-all duration-500"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Top 3 Trí thông minh nổi trội */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Award className="h-5 w-5 text-blue-600" />
              <h2 className="text-lg font-bold text-slate-900">
                Top 3 Trí Thông Minh Vượt Trội Nhất Của Bạn
              </h2>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              {computedResult.top3.map((item) => (
                <div
                  key={item.category}
                  className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_2px_8px_rgba(0,0,0,0.02)] flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={cn(
                          "rounded-full border px-2.5 py-0.5 text-[11px] font-bold",
                          item.badgeClass
                        )}
                      >
                        Hạng #{item.rank} · {item.englishTag}
                      </span>
                      <span
                        className="text-lg font-extrabold tabular-nums"
                        style={{ color: item.colorHex }}
                      >
                        {item.percentage}%
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-slate-900">
                      {item.nameVi}
                    </h3>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      {item.meta.description}
                    </p>

                    <div className="space-y-1.5 pt-1">
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                        Đặc điểm nhận diện
                      </p>
                      <ul className="space-y-1 text-xs text-slate-600">
                        {item.meta.indicators.map((ind) => (
                          <li key={ind} className="flex items-start gap-1.5">
                            <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-blue-500 shrink-0" />
                            <span>{ind}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="space-y-1.5 pt-1 border-t border-slate-100">
                      <p className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-emerald-700">
                        <BookOpen className="h-3.5 w-3.5" />
                        Phương pháp học hiệu quả nhất
                      </p>
                      <ul className="space-y-1 text-xs text-slate-600">
                        {item.meta.studyMethods.map((method) => (
                          <li key={method} className="flex items-start gap-1.5">
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0 mt-0.5" />
                            <span>{method}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="space-y-1.5 pt-2 border-t border-slate-100">
                    <p className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-blue-700">
                      <Briefcase className="h-3.5 w-3.5" />
                      Nhóm ngành nghề / Vị trí phù hợp
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {item.meta.suitableCareers.map((c) => (
                        <span
                          key={c}
                          className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-medium text-slate-700"
                        >
                          {c}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        /* Màn hình Làm bài MI */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-8 xl:col-span-9 space-y-5">
            {/* Progress & Scale Legend */}
            <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_2px_8px_rgba(0,0,0,0.02)] space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-slate-800">
                  <span>
                    Đã đánh giá: {answeredCount}/{MI_QUESTIONS.length} phát biểu
                  </span>
                  <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-bold text-blue-700">
                    {progressPct}%
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-slate-500">
                    Chặng {currentPage + 1}/{TOTAL_PAGES}
                  </span>
                  {answeredCount > 0 && (
                    <button
                      type="button"
                      onClick={handleResetTest}
                      className="text-xs font-medium text-rose-600 hover:underline cursor-pointer"
                    >
                      Xóa lựa chọn
                    </button>
                  )}
                </div>
              </div>

              <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                <div
                  style={{ width: `${progressPct}%` }}
                  className="h-full rounded-full bg-blue-600 transition-all duration-300"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] text-slate-600">
                <span className="font-semibold text-slate-700">Thang Likert:</span>
                {MI_LIKERT_OPTIONS.map((opt) => (
                  <span
                    key={opt.value}
                    className="rounded-md bg-slate-100 px-2 py-0.5"
                  >
                    <strong>{opt.shortLabel}</strong> = {opt.label}
                  </span>
                ))}
              </div>
            </div>

            {submitWarning && (
              <div className="flex items-start gap-2.5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3.5 text-xs sm:text-sm text-rose-800">
                <AlertCircle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
                <span>{submitWarning}</span>
              </div>
            )}

            {/* Statements */}
            <div className="space-y-3.5">
              {pageQuestions.map((q) => {
                const selected = answers[q.id];
                const isMissing = flaggedMissingIds.has(q.id);

                return (
                  <div
                    key={q.id}
                    id={`mi-q-${q.id}`}
                    className={cn(
                      "rounded-2xl border bg-white p-5 transition-all shadow-[0_2px_8px_rgba(0,0,0,0.02)] space-y-3",
                      isMissing
                        ? "border-rose-400 ring-2 ring-rose-100 bg-rose-50/20"
                        : selected
                          ? "border-blue-200"
                          : "border-slate-200/80"
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1">
                        <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-blue-600">
                          Phát biểu {q.order}/{MI_QUESTIONS.length}
                          {isMissing && (
                            <span className="rounded bg-rose-100 px-1.5 py-0.5 text-[10px] font-semibold text-rose-700 normal-case">
                              Chưa đánh giá
                            </span>
                          )}
                        </span>
                        <p className="text-sm sm:text-base font-medium text-slate-900">
                          {q.statement}
                        </p>
                      </div>
                      {selected && (
                        <CheckCircle2 className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
                      )}
                    </div>

                    <div className="grid grid-cols-5 gap-2">
                      {MI_LIKERT_OPTIONS.map((opt) => {
                        const active = selected === opt.value;
                        return (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => handleSelectLikert(q.id, opt.value)}
                            aria-pressed={active}
                            title={opt.label}
                            className={cn(
                              "flex flex-col items-center justify-center rounded-xl border px-2 py-2.5 text-center transition-all cursor-pointer",
                              active
                                ? "border-blue-600 bg-blue-600 text-white shadow-2xs"
                                : "border-slate-200 bg-slate-50/60 text-slate-700 hover:border-blue-300 hover:bg-white"
                            )}
                          >
                            <span className="text-sm font-bold">{opt.shortLabel}</span>
                            <span
                              className={cn(
                                "hidden sm:block text-[10px] mt-0.5 leading-tight",
                                active ? "text-blue-100" : "text-slate-500"
                              )}
                            >
                              {opt.label}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Bottom Controls */}
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200/80 bg-white p-4">
              <Button
                type="button"
                variant="outline"
                disabled={currentPage === 0}
                onClick={() => {
                  setCurrentPage((p) => Math.max(0, p - 1));
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                className="gap-1.5"
              >
                <ArrowLeft className="h-4 w-4" />
                Quay lại
              </Button>

              <div className="flex items-center gap-2">
                {currentPage < TOTAL_PAGES - 1 ? (
                  <Button
                    type="button"
                    onClick={() => {
                      setCurrentPage((p) => Math.min(TOTAL_PAGES - 1, p + 1));
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                    className="gap-1.5"
                  >
                    Tiếp theo
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                ) : (
                  <Button type="button" onClick={handleSubmit} className="gap-1.5">
                    <CheckCircle2 className="h-4 w-4" />
                    Nộp bài & Xem biểu đồ MI
                  </Button>
                )}
                {currentPage < TOTAL_PAGES - 1 && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleSubmit}
                    className="gap-1.5 border-blue-200 text-blue-700 hover:bg-blue-50"
                  >
                    Nộp bài
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Right Question Palette */}
          <aside className="lg:col-span-4 xl:col-span-3 lg:sticky lg:top-20 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_2px_8px_rgba(0,0,0,0.02)] space-y-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Bảng Phát Biểu (1–40)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Bấm số câu để di chuyển nhanh đến phát biểu tương ứng.
              </p>
            </div>

            <div className="grid grid-cols-5 sm:grid-cols-8 lg:grid-cols-5 gap-2">
              {MI_QUESTIONS.map((q, idx) => {
                const answered =
                  Number.isInteger(answers[q.id]) &&
                  answers[q.id] >= 1 &&
                  answers[q.id] <= 5;
                const missing = flaggedMissingIds.has(q.id);
                const onThisPage =
                  Math.floor(idx / QUESTIONS_PER_PAGE) === currentPage;

                return (
                  <button
                    key={q.id}
                    type="button"
                    onClick={() => handleJumpToQuestion(idx, q.id)}
                    className={cn(
                      "h-8 rounded-lg text-xs font-semibold transition-all cursor-pointer",
                      missing
                        ? "bg-rose-100 border border-rose-400 text-rose-700"
                        : answered
                          ? "bg-blue-600 text-white"
                          : onThisPage
                            ? "border-2 border-blue-400 bg-blue-50 text-blue-700"
                            : "border border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100"
                    )}
                  >
                    {q.order}
                  </button>
                );
              })}
            </div>

            <Button
              type="button"
              onClick={handleSubmit}
              className="w-full gap-1.5"
            >
              <CheckCircle2 className="h-4 w-4" />
              Nộp bài ({answeredCount}/{MI_QUESTIONS.length})
            </Button>
          </aside>
        </div>
      )}
    </div>
  );
}

