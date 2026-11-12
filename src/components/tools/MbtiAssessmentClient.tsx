"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  BrainCircuit,
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
import { ToolSubNav } from "@/components/tools/ToolSubNav";
import { Button } from "@/components/ui/button";
import {
  MBTI_PROFILES,
  MBTI_QUESTIONS,
  type MbtiCode,
} from "@/constants/mbti";
import {
  calculateMbtiResult,
  type MbtiComputedResult,
  validateMbtiAnswers,
} from "@/lib/tools/mbti";
import { cn } from "@/lib/utils";
import type { IToolResultDTO } from "@/types";

const DRAFT_STORAGE_KEY = "unera_tool_mbti_draft_v1";
const QUESTIONS_PER_PAGE = 10;
const TOTAL_PAGES = Math.ceil(MBTI_QUESTIONS.length / QUESTIONS_PER_PAGE);

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

export function MbtiAssessmentClient() {
  const searchParams = useSearchParams();
  const initialTabParam = searchParams.get("tab");
  const initialResultIdParam = searchParams.get("resultId");

  const { user, loading: authLoading } = useAuth();

  const [activeTab, setActiveTab] = useState<ActiveTab>(
    initialTabParam === "history" ? "history" : "test"
  );
  const [answers, setAnswers] = useState<Record<string, "A" | "B">>({});
  const [currentPage, setCurrentPage] = useState(0);
  const [flaggedMissingIds, setFlaggedMissingIds] = useState<Set<string>>(
    () => new Set()
  );
  const [submitWarning, setSubmitWarning] = useState<string | null>(null);
  const [computedResult, setComputedResult] = useState<MbtiComputedResult | null>(
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

  // Khôi phục bản nháp từ localStorage khi mount
  useEffect(() => {
    let active = true;
    Promise.resolve().then(() => {
      if (!active || typeof window === "undefined") return;
      try {
        const raw = window.localStorage.getItem(DRAFT_STORAGE_KEY);
        if (!raw) return;
        const parsed = JSON.parse(raw) as unknown;
        if (!parsed || typeof parsed !== "object") return;
        const clean: Record<string, "A" | "B"> = {};
        for (const q of MBTI_QUESTIONS) {
          const val = (parsed as Record<string, unknown>)[q.id];
          if (val === "A" || val === "B") clean[q.id] = val;
        }
        if (Object.keys(clean).length > 0) {
          setAnswers(clean);
        }
      } catch {
        // Bỏ qua nếu dữ liệu localStorage không hợp lệ
      }
    });
    return () => {
      active = false;
    };
  }, []);

  // Tải lịch sử làm bài MBTI nếu đã đăng nhập
  useEffect(() => {
    if (authLoading || !user) return;
    let active = true;
    fetchWithAuth("/api/tools/results?type=MBTI&limit=20", {
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

  // Mở thẳng 1 bản ghi lịch sử nếu có query ?resultId=...
  useEffect(() => {
    if (!initialResultIdParam || historyList.length === 0) return;
    const match = historyList.find((item) => item._id === initialResultIdParam);
    if (!match) return;
    Promise.resolve().then(() => {
      try {
        const recalculated = calculateMbtiResult(match.answers || {});
        setComputedResult(recalculated);
        setViewingHistoryMeta({ id: match._id, createdAt: match.createdAt });
        setActiveTab("test");
      } catch {
        // Fallback nếu dữ liệu cũ thiếu câu
      }
    });
  }, [initialResultIdParam, historyList]);

  const answeredCount = useMemo(
    () =>
      MBTI_QUESTIONS.filter((q) => answers[q.id] === "A" || answers[q.id] === "B")
        .length,
    [answers]
  );

  const progressPct = Math.round((answeredCount / MBTI_QUESTIONS.length) * 100);

  const pageQuestions = useMemo(() => {
    const start = currentPage * QUESTIONS_PER_PAGE;
    return MBTI_QUESTIONS.slice(start, start + QUESTIONS_PER_PAGE);
  }, [currentPage]);

  const handleSelectOption = (questionId: string, choice: "A" | "B") => {
    setAnswers((prev) => {
      const next = { ...prev, [questionId]: choice };
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
    if (submitWarning) {
      setSubmitWarning(null);
    }
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
        document.getElementById(`mbti-q-${questionId}`)?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }, 45);
    });
  };

  const handleSubmit = async () => {
    const check = validateMbtiAnswers(answers);
    if (!check.valid) {
      const missingSet = new Set(check.missingIds);
      setFlaggedMissingIds(missingSet);

      const firstMissingId = check.missingIds[0];
      const firstIdx = MBTI_QUESTIONS.findIndex((q) => q.id === firstMissingId);
      const questionNo = firstIdx >= 0 ? MBTI_QUESTIONS[firstIdx].order : 1;

      setSubmitWarning(
        `Còn ${check.missingIds.length} câu hỏi chưa được chọn. Hệ thống đã chuyển tới Câu ${questionNo} để bạn hoàn thành.`
      );

      if (firstIdx >= 0) {
        handleJumpToQuestion(firstIdx, firstMissingId);
      }
      return;
    }

    const result = calculateMbtiResult(check.normalized);
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
            toolType: "MBTI",
            answers: check.normalized,
          }),
        });
        const data = await res.json();
        if (res.ok && data.result) {
          setSaveFeedback({
            type: "success",
            text: "Đã lưu kết quả MBTI vào lịch sử tài khoản của bạn.",
          });
          setHistoryList((prev) => [data.result, ...prev]);
        } else {
          setSaveFeedback({
            type: "error",
            text: data.error || "Không thể lưu lịch sử kết quả.",
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
    try {
      const recalculated = calculateMbtiResult(item.answers || {});
      setComputedResult(recalculated);
      setViewingHistoryMeta({ id: item._id, createdAt: item.createdAt });
      setSaveFeedback(null);
      setActiveTab("test");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch {
      const code = (item.resultCode || "INTJ") as MbtiCode;
      const profile = MBTI_PROFILES[code];
      if (!profile) return;
      const storedAxes = Array.isArray(item.scoresBreakdown?.axes)
        ? (item.scoresBreakdown.axes as MbtiComputedResult["axes"])
        : [];
      setComputedResult({
        code,
        nameVi: profile.nameVi,
        summary: item.summary,
        hasBalancedAxis: Boolean(item.scoresBreakdown?.hasBalancedAxis),
        axes: storedAxes,
        profile,
      });
      setViewingHistoryMeta({ id: item._id, createdAt: item.createdAt });
      setActiveTab("test");
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleDeleteHistoryItem = async (id: string) => {
    setDeletingId(id);
    try {
      const res = await fetchWithAuth(`/api/tools/results/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setHistoryList((prev) => prev.filter((item) => item._id !== id));
        if (viewingHistoryMeta?.id === id) {
          setViewingHistoryMeta(null);
        }
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
            <BrainCircuit className="h-3.5 w-3.5" />
            <span>TOOL-01 · Trắc Nghiệm Tính Cách MBTI (40 Câu Chuẩn)</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
            Khám phá Nhóm Tính Cách MBTI & Định Hướng Nghề Nghiệp
          </h1>
          <p className="text-sm text-slate-600 leading-relaxed">
            Đánh giá xu hướng tự nhiên qua 4 cặp trục (E/I, S/N, T/F, J/P) để nhận diện điểm mạnh nổi bật,
            môi trường học tập – làm việc lý tưởng và nhóm ngành nghề phù hợp cho sinh viên.
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
            <BrainCircuit className="h-4 w-4" />
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
            <span>Lịch sử MBTI ({historyList.length})</span>
          </button>
        </div>
      </div>

      {/* Tab Lịch sử làm bài */}
      {activeTab === "history" ? (
        <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-[0_2px_8px_rgba(0,0,0,0.02)] space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Lịch sử làm bài Trắc nghiệm MBTI
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Lưu tự động mỗi khi bạn hoàn thành bài kiểm tra khi đang đăng nhập tài khoản Unera.
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
              Làm bài test mới
            </Button>
          </div>

          {!user && !authLoading ? (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-blue-100 bg-blue-50/70 p-5">
              <div className="flex items-start gap-3">
                <LogIn className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    Đăng nhập để lưu và xem lại lịch sử làm bài MBTI
                  </p>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Khách vãng lai vẫn có thể làm bài test và xem đầy đủ hồ sơ tính cách ngay lập tức.
                  </p>
                </div>
              </div>
              <Link
                href="/login?callbackUrl=/tools/mbti"
                className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700 shrink-0"
              >
                <LogIn className="h-3.5 w-3.5" />
                Đăng nhập ngay
              </Link>
            </div>
          ) : loadingHistory ? (
            <div className="flex h-40 items-center justify-center gap-2 text-sm text-slate-500">
              <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
              <span>Đang tải lịch sử MBTI...</span>
            </div>
          ) : historyList.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 p-10 text-center space-y-2">
              <p className="text-sm font-semibold text-slate-700">
                Bạn chưa có kết quả MBTI nào được lưu
              </p>
              <p className="text-xs text-slate-500">
                Hoàn thành 40 câu hỏi trắc nghiệm để khám phá mã nhóm tính cách của riêng bạn.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {historyList.map((item) => {
                const profile = MBTI_PROFILES[item.resultCode as MbtiCode];
                return (
                  <div
                    key={item._id}
                    className="rounded-2xl border border-slate-200/80 bg-slate-50/40 p-4 flex flex-col justify-between gap-4 hover:border-blue-200 hover:bg-white transition-all"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <span
                          className={cn(
                            "rounded-lg border px-2.5 py-1 text-xs font-bold tracking-wide",
                            profile?.badgeTone || "bg-blue-50 text-blue-700 border-blue-200"
                          )}
                        >
                          {item.resultCode}
                        </span>
                        <span className="text-[11px] text-slate-400">
                          {formatShortDate(item.createdAt)}
                        </span>
                      </div>
                      <h3 className="text-sm font-bold text-slate-900">
                        {profile?.nameVi || item.resultCode}
                      </h3>
                      <p className="text-xs text-slate-600 line-clamp-2">
                        {item.summary}
                      </p>
                    </div>

                    <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="text-xs"
                        onClick={() => handleOpenHistoryItem(item)}
                      >
                        Xem phân tích chi tiết
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        disabled={deletingId === item._id}
                        onClick={() => handleDeleteHistoryItem(item._id)}
                        className="text-rose-600 hover:bg-rose-50 hover:text-rose-700"
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
        /* Màn hình Kết quả MBTI */
        <div className="space-y-6">
          {viewingHistoryMeta && (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-indigo-200 bg-indigo-50/70 px-5 py-3 text-xs text-indigo-800">
              <span>
                Đang xem lại kết quả lịch sử ngày{" "}
                <strong>{formatShortDate(viewingHistoryMeta.createdAt)}</strong>.
              </span>
              <button
                type="button"
                onClick={handleResetTest}
                className="font-semibold underline hover:text-indigo-950 cursor-pointer"
              >
                Bắt đầu làm bài kiểm tra mới
              </button>
            </div>
          )}

          {savingResult && (
            <div className="flex items-center gap-2 rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-xs font-medium text-blue-700">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Đang lưu kết quả MBTI vào tài khoản của bạn...</span>
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
                  Bạn đang làm bài với tư cách khách. Đăng nhập để Unera tự động lưu lịch sử các lần test MBTI vào hồ sơ cá nhân.
                </span>
              </div>
              <Link
                href="/login?callbackUrl=/tools/mbti"
                className="inline-flex items-center gap-1.5 rounded-xl bg-amber-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-amber-700 shrink-0"
              >
                <LogIn className="h-3.5 w-3.5" />
                Đăng nhập để lưu
              </Link>
            </div>
          )}

          {/* Hero Result Summary Card */}
          <div className="rounded-3xl border border-slate-200/80 bg-white p-6 sm:p-8 shadow-[0_2px_10px_rgba(0,0,0,0.03)] grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-5 flex flex-col justify-between space-y-5">
              <div className="space-y-3">
                <span
                  className={cn(
                    "inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold",
                    computedResult.profile.badgeTone
                  )}
                >
                  {computedResult.profile.group}
                </span>

                <div className="flex items-baseline gap-3">
                  <span className="text-5xl sm:text-6xl font-extrabold tracking-tight text-blue-600">
                    {computedResult.code}
                  </span>
                  <span className="text-sm font-semibold text-slate-400">
                    {computedResult.profile.nickname}
                  </span>
                </div>

                <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
                  {computedResult.profile.nameVi}
                </h2>
                <p className="text-sm font-medium text-blue-700">
                  {computedResult.profile.tagline}
                </p>
                <p className="text-sm text-slate-600 leading-relaxed">
                  {computedResult.profile.summary}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3 pt-2">
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
                  className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white hover:bg-blue-700 transition-colors shadow-sm shadow-blue-500/20"
                >
                  <Compass className="h-4 w-4" />
                  <span>Tích hợp sang Lộ trình / Định hướng AI</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>

            {/* 4 Dichotomy Bars */}
            <div className="lg:col-span-7 space-y-4 rounded-2xl border border-slate-100 bg-slate-50/70 p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-sm font-bold text-slate-900">
                  Phân tích 4 Cặp Trục Tính Cách
                </h3>
                <span className="text-[11px] text-slate-500">
                  Tổng mỗi trục = 100%
                </span>
              </div>

              {computedResult.hasBalancedAxis && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-2.5 text-xs text-amber-900 flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                  <span>
                    Có ít nhất một trục đạt mức <strong>cân bằng 50% - 50%</strong>. Bạn sở hữu nét linh hoạt của cả hai cực trên trục đó; hệ thống sử dụng quy ước ưu tiên mặc định được chú thích bên dưới.
                  </span>
                </div>
              )}

              <div className="space-y-4">
                {computedResult.axes.map((axis) => {
                  const leftWins = axis.winnerPole === axis.leftPole;
                  return (
                    <div
                      key={axis.axis}
                      className="rounded-xl bg-white border border-slate-200/70 p-3.5 space-y-2"
                    >
                      <div className="flex items-center justify-between gap-2 text-xs">
                        <span className="font-semibold text-slate-700">
                          {axis.title}
                        </span>
                        {axis.isTie ? (
                          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-800">
                            Cân bằng 50% - 50% → Ưu tiên {axis.winnerPole}
                          </span>
                        ) : (
                          <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-blue-700">
                            Thiên về cực {axis.winnerPole}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center justify-between text-xs font-semibold">
                        <span
                          className={
                            leftWins ? "text-blue-700" : "text-slate-500"
                          }
                        >
                          {axis.leftLabel}: {axis.leftPct}% ({axis.leftCount}/10)
                        </span>
                        <span
                          className={
                            !leftWins ? "text-blue-700" : "text-slate-500"
                          }
                        >
                          {axis.rightLabel}: {axis.rightPct}% ({axis.rightCount}/10)
                        </span>
                      </div>

                      <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-slate-200">
                        <div
                          style={{ width: `${axis.leftPct}%` }}
                          className={cn(
                            "h-full transition-all",
                            leftWins ? "bg-blue-600" : "bg-blue-300"
                          )}
                        />
                        <div
                          style={{ width: `${axis.rightPct}%` }}
                          className={cn(
                            "h-full transition-all",
                            !leftWins ? "bg-indigo-600" : "bg-slate-300"
                          )}
                        />
                      </div>

                      {axis.isTie && axis.tieBreakerNote && (
                        <p className="text-[11px] text-amber-700">
                          {axis.tieBreakerNote}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Chi tiết Điểm mạnh, Điểm lưu ý, Môi trường & Ngành nghề */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            <div className="rounded-2xl border border-slate-200/80 bg-white p-5 space-y-3 shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
              <div className="flex items-center gap-2 text-emerald-700 font-semibold text-sm">
                <Sparkles className="h-4 w-4" />
                <span>Điểm mạnh nổi bật</span>
              </div>
              <ul className="space-y-2 text-xs sm:text-sm text-slate-600">
                {computedResult.profile.strengths.map((s) => (
                  <li key={s} className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span>{s}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-2xl border border-slate-200/80 bg-white p-5 space-y-3 shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
              <div className="flex items-center gap-2 text-amber-700 font-semibold text-sm">
                <AlertCircle className="h-4 w-4" />
                <span>Điểm cần rèn luyện & lưu ý</span>
              </div>
              <ul className="space-y-2 text-xs sm:text-sm text-slate-600">
                {computedResult.profile.watchouts.map((w) => (
                  <li key={w} className="flex items-start gap-2">
                    <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-amber-500 shrink-0" />
                    <span>{w}</span>
                  </li>
                ))}
              </ul>
              <div className="pt-2 border-t border-slate-100">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
                  Môi trường làm việc lý tưởng
                </p>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {computedResult.profile.idealEnvironment}
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200/80 bg-white p-5 space-y-3 shadow-[0_2px_8px_rgba(0,0,0,0.02)] md:col-span-2 lg:col-span-1">
              <div className="flex items-center gap-2 text-blue-700 font-semibold text-sm">
                <Briefcase className="h-4 w-4" />
                <span>Gợi ý Ngành nghề Phù hợp cho Sinh viên</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {computedResult.profile.suitableCareers.map((career) => (
                  <span
                    key={career}
                    className="rounded-xl border border-blue-100 bg-blue-50/70 px-3 py-1.5 text-xs font-medium text-blue-800"
                  >
                    {career}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Màn hình Làm bài Trắc nghiệm MBTI */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Main Questions Area */}
          <div className="lg:col-span-8 xl:col-span-9 space-y-5">
            {/* Progress Header Card */}
            <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_2px_8px_rgba(0,0,0,0.02)] space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-slate-800">
                  <span>
                    Tiến độ hoàn thành: {answeredCount}/{MBTI_QUESTIONS.length} câu
                  </span>
                  <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-bold text-blue-700">
                    {progressPct}%
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500">
                    Chặng {currentPage + 1}/{TOTAL_PAGES}
                  </span>
                  {answeredCount > 0 && (
                    <button
                      type="button"
                      onClick={handleResetTest}
                      className="text-xs font-medium text-rose-600 hover:underline cursor-pointer"
                    >
                      Làm lại từ đầu
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

              <p className="text-[11px] text-slate-500">
                Lựa chọn của bạn được lưu tự động trên trình duyệt để tránh mất tiến độ khi tải lại trang.
              </p>
            </div>

            {submitWarning && (
              <div className="flex items-start gap-2.5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3.5 text-xs sm:text-sm text-rose-800">
                <AlertCircle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
                <span>{submitWarning}</span>
              </div>
            )}

            {/* Question List for Current Page */}
            <div className="space-y-4">
              {pageQuestions.map((question) => {
                const selected = answers[question.id];
                const isMissing = flaggedMissingIds.has(question.id);

                return (
                  <div
                    key={question.id}
                    id={`mbti-q-${question.id}`}
                    className={cn(
                      "rounded-2xl border bg-white p-5 transition-all shadow-[0_2px_8px_rgba(0,0,0,0.02)] space-y-3",
                      isMissing
                        ? "border-rose-400 ring-2 ring-rose-100 bg-rose-50/20"
                        : selected
                          ? "border-blue-200"
                          : "border-slate-200/80"
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-blue-600">
                          Câu {question.order}/{MBTI_QUESTIONS.length}
                          {isMissing && (
                            <span className="rounded bg-rose-100 px-1.5 py-0.5 text-[10px] font-semibold text-rose-700 normal-case">
                              Chưa chọn
                            </span>
                          )}
                        </span>
                        <h3 className="text-sm sm:text-base font-semibold text-slate-900 leading-snug">
                          {question.prompt}
                        </h3>
                      </div>
                      {selected && (
                        <CheckCircle2 className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                      {(["A", "B"] as const).map((optKey) => {
                        const opt =
                          optKey === "A" ? question.optionA : question.optionB;
                        const active = selected === optKey;
                        return (
                          <button
                            key={optKey}
                            type="button"
                            onClick={() =>
                              handleSelectOption(question.id, optKey)
                            }
                            aria-pressed={active}
                            className={cn(
                              "flex items-start gap-3 rounded-xl border p-3.5 text-left text-xs sm:text-sm transition-all cursor-pointer",
                              active
                                ? "border-blue-600 bg-blue-50/80 text-slate-900 shadow-2xs ring-1 ring-blue-600"
                                : "border-slate-200 bg-slate-50/50 text-slate-700 hover:border-blue-300 hover:bg-white"
                            )}
                          >
                            <span
                              className={cn(
                                "inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-xs font-bold",
                                active
                                  ? "bg-blue-600 text-white"
                                  : "bg-white border border-slate-200 text-slate-500"
                              )}
                            >
                              {optKey}
                            </span>
                            <span className="leading-relaxed">{opt.label}</span>
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
                  <Button
                    type="button"
                    onClick={handleSubmit}
                    className="gap-1.5 bg-blue-600 hover:bg-blue-700"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    Nộp bài & Xem kết quả
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
                Bảng Câu Hỏi (1–40)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Bấm số câu để chuyển nhanh tới vị trí cần kiểm tra.
              </p>
            </div>

            <div className="grid grid-cols-5 sm:grid-cols-8 lg:grid-cols-5 gap-2">
              {MBTI_QUESTIONS.map((q, idx) => {
                const answered = answers[q.id] === "A" || answers[q.id] === "B";
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

            <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-100 text-[11px] text-slate-500">
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-xs bg-blue-600" /> Đã chọn
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-xs border border-slate-300 bg-slate-50" />{" "}
                Chưa chọn
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-xs bg-rose-200 border border-rose-400" />{" "}
                Thiếu
              </span>
            </div>

            <Button
              type="button"
              onClick={handleSubmit}
              className="w-full gap-1.5"
            >
              <CheckCircle2 className="h-4 w-4" />
              Nộp bài ({answeredCount}/{MBTI_QUESTIONS.length})
            </Button>
          </aside>
        </div>
      )}
    </div>
  );
}

