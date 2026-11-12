"use client";

import { Suspense, use, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  ClipboardCheck,
  History,
  Loader2,
  Map as MapIcon,
  RefreshCw,
  RotateCcw,
  Sparkles,
} from "lucide-react";
import {
  AiAnalysisView,
  type GenerateRoadmapOptionPayload,
} from "@/components/assessment/AiAnalysisView";
import { fetchWithAuth } from "@/components/providers/AuthProvider";
import { AI_ANALYSIS_STATUS } from "@/constants";
import type {
  IAiOrientationAnalysisDTO,
  IAssessmentSubmissionDTO,
} from "@/types";

function OnboardingResultContent({
  params,
}: {
  params: Promise<{ submissionId: string }>;
}) {
  const { submissionId } = use(params);
  const router = useRouter();

  const [submission, setSubmission] = useState<IAssessmentSubmissionDTO | null>(
    null
  );
  const [latestAnalysis, setLatestAnalysis] =
    useState<IAiOrientationAnalysisDTO | null>(null);
  const [activeRoadmap, setActiveRoadmap] = useState<{
    _id: string;
    title: string;
    orientationDirection: string;
    version: number;
    progressPercent: number;
  } | null>(null);

  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [actionBusy, setActionBusy] = useState<
    "retry" | "regenerate" | "retake" | "roadmap" | null
  >(null);
  const [generatingOptionKey, setGeneratingOptionKey] = useState<string | null>(
    null
  );
  const [addingCustomCareer, setAddingCustomCareer] = useState(false);
  const [removingCustomCareerId, setRemovingCustomCareerId] = useState<
    string | null
  >(null);
  const [actionNotice, setActionNotice] = useState<string | null>(null);
  const [showAnswers, setShowAnswers] = useState(false);

  const fetchResultPayload = useCallback(async () => {
    const res = await fetchWithAuth(`/api/assessments/results/${submissionId}`, {
      cache: "no-store",
    });
    const data = await res.json();
    return { ok: res.ok, data };
  }, [submissionId]);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const { ok, data } = await fetchResultPayload();
        if (!active) return;
        if (!ok) {
          setErrorMsg(data.error || "Không tìm thấy kết quả bài khảo sát.");
          return;
        }
        setSubmission(data.submission || null);
        setLatestAnalysis(data.latestAnalysis || null);
        setActiveRoadmap(data.activeRoadmap || null);
      } catch {
        if (active) {
          setErrorMsg("Lỗi kết nối máy chủ khi tải kết quả phân tích.");
        }
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [fetchResultPayload]);

  const loadData = useCallback(async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const { ok, data } = await fetchResultPayload();
      if (!ok) {
        setErrorMsg(data.error || "Không tìm thấy kết quả bài khảo sát.");
        return;
      }
      setSubmission(data.submission || null);
      setLatestAnalysis(data.latestAnalysis || null);
      setActiveRoadmap(data.activeRoadmap || null);
    } catch {
      setErrorMsg("Lỗi kết nối máy chủ khi tải kết quả phân tích.");
    } finally {
      setLoading(false);
    }
  }, [fetchResultPayload]);

  const handleRetryAnalyze = async () => {
    setActionBusy("retry");
    setActionNotice(null);
    try {
      const res = await fetchWithAuth("/api/ai/orientation/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          submissionId,
          generateRoadmapIfMissing: true,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.analysis) setLatestAnalysis(data.analysis);
        setActionNotice(data.error || "Phân tích lại thất bại. Vui lòng thử lại.");
        return;
      }
      setActionNotice("Đã hoàn tất phân tích AI Gemini!");
      await loadData();
    } catch {
      setActionNotice("Lỗi kết nối khi gọi lại Gemini AI.");
    } finally {
      setActionBusy(null);
    }
  };

  const handleRegenerateWithLatestProfile = async () => {
    setActionBusy("regenerate");
    setActionNotice(null);
    try {
      const res = await fetchWithAuth("/api/ai/orientation/regenerate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ submissionId }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.analysis) setLatestAnalysis(data.analysis);
        setActionNotice(data.error || "Tái phân tích AI thất bại.");
        return;
      }
      setActionNotice(
        "Đã cập nhật phân tích định hướng AI mới nhất dựa trên hồ sơ cập nhật của bạn."
      );
      await loadData();
    } catch {
      setActionNotice("Lỗi kết nối khi tái phân tích định hướng.");
    } finally {
      setActionBusy(null);
    }
  };

  const handleGenerateRoadmapFromHere = async () => {
    if (!latestAnalysis?._id) return;
    setActionBusy("roadmap");
    setActionNotice(null);
    try {
      const res = await fetchWithAuth("/api/roadmap/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ analysisId: latestAnalysis._id }),
      });
      const data = await res.json();
      if (!res.ok) {
        setActionNotice(data.error || "Không thể sinh lộ trình 4 năm lúc này.");
        return;
      }
      router.push("/roadmap");
    } catch {
      setActionNotice("Lỗi kết nối khi tạo lộ trình 4 năm.");
    } finally {
      setActionBusy(null);
    }
  };

  const handleGenerateRoadmapForOption = async (
    payload: GenerateRoadmapOptionPayload
  ) => {
    if (!latestAnalysis?._id) return;
    setGeneratingOptionKey(payload.optionKey);
    setActionBusy("roadmap");
    setActionNotice(
      `Đang gọi Gemini AI kiến tạo lộ trình 4 năm riêng cho định hướng "${payload.targetDirection}"...`
    );
    try {
      const res = await fetchWithAuth("/api/roadmap/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          analysisId: latestAnalysis._id,
          targetDirection: payload.targetDirection,
          notes: payload.notes,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setActionNotice(
          data.error || "Không thể sinh lộ trình cho định hướng này lúc này."
        );
        return;
      }
      router.push("/roadmap");
    } catch {
      setActionNotice("Lỗi kết nối khi gọi Gemini AI tạo lộ trình.");
    } finally {
      setGeneratingOptionKey(null);
      setActionBusy(null);
    }
  };

  const handleAddCustomCareer = async (payload: {
    title: string;
    reason?: string;
  }): Promise<{ ok: boolean; optionId?: string; error?: string }> => {
    if (!latestAnalysis?._id) {
      return { ok: false, error: "Chưa có dữ liệu phân tích." };
    }
    setAddingCustomCareer(true);
    setActionNotice(null);
    try {
      const res = await fetchWithAuth("/api/ai/orientation/custom-career", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          analysisId: latestAnalysis._id,
          title: payload.title,
          reason: payload.reason,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        return {
          ok: false,
          error: data.error || "Không thể thêm định hướng nghề nghiệp.",
        };
      }
      setLatestAnalysis((prev) =>
        prev
          ? {
              ...prev,
              customCareerOptions: data.customCareerOptions || prev.customCareerOptions,
            }
          : prev
      );
      setActionNotice(`Đã thêm định hướng "${payload.title}" vào danh sách.`);
      return { ok: true, optionId: data.option?.id };
    } catch {
      return { ok: false, error: "Lỗi kết nối khi lưu định hướng nghề nghiệp." };
    } finally {
      setAddingCustomCareer(false);
    }
  };

  const handleRemoveCustomCareer = async (optionId: string) => {
    if (!latestAnalysis?._id) return;
    setRemovingCustomCareerId(optionId);
    try {
      const res = await fetchWithAuth(
        `/api/ai/orientation/custom-career?analysisId=${encodeURIComponent(
          latestAnalysis._id
        )}&optionId=${encodeURIComponent(optionId)}`,
        { method: "DELETE" }
      );
      const data = await res.json();
      if (res.ok) {
        setLatestAnalysis((prev) =>
          prev
            ? {
                ...prev,
                customCareerOptions: data.customCareerOptions || [],
              }
            : prev
        );
      }
    } finally {
      setRemovingCustomCareerId(null);
    }
  };

  const handleRetake = async () => {
    setActionBusy("retake");
    try {
      const res = await fetchWithAuth("/api/assessments/retake", {
        method: "POST",
      });
      if (res.ok) {
        router.push("/onboarding");
      }
    } finally {
      setActionBusy(null);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <p className="text-sm text-slate-500">Đang tải kết quả phân tích...</p>
      </div>
    );
  }

  if (errorMsg || !submission) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-12">
        <div className="rounded-3xl border border-red-200 bg-white p-8 text-center space-y-4">
          <AlertTriangle className="h-10 w-10 text-red-500 mx-auto" />
          <h1 className="text-lg font-bold text-slate-900">
            {errorMsg || "Không tìm thấy bài đánh giá"}
          </h1>
          <Link
            href="/onboarding"
            className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Quay về Trắc nghiệm Định hướng
          </Link>
        </div>
      </div>
    );
  }

  const isCompleted =
    latestAnalysis?.status === AI_ANALYSIS_STATUS.COMPLETED &&
    Boolean(latestAnalysis.analysisResult);

  return (
    <div className="max-w-5xl mx-auto px-5 sm:px-8 py-7 space-y-6">
      {/* Top Action Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-3xl border border-slate-200/90 bg-white p-6 shadow-2xs">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 font-semibold text-emerald-700">
              <ClipboardCheck className="h-3.5 w-3.5" />
              Đã nộp bài · Lần #{submission.attemptNumber}
            </span>
            <span className="text-slate-400">
              {submission.submittedAt
                ? new Date(submission.submittedAt).toLocaleString("vi-VN")
                : ""}
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
            {submission.questionnaireTitle || "Kết quả Định hướng Cá nhân"}
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            href="/onboarding/history"
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
          >
            <History className="h-3.5 w-3.5" />
            Lịch sử bài làm
          </Link>

          <button
            type="button"
            disabled={actionBusy !== null}
            onClick={handleRetake}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer disabled:opacity-50"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Làm lại khảo sát
          </button>

          {isCompleted && (
            <button
              type="button"
              disabled={actionBusy !== null}
              onClick={handleRegenerateWithLatestProfile}
              className="inline-flex items-center gap-1.5 rounded-xl border border-indigo-200 bg-indigo-50 px-3.5 py-2 text-xs font-semibold text-indigo-700 hover:bg-indigo-100 cursor-pointer disabled:opacity-50"
            >
              {actionBusy === "regenerate" ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <RefreshCw className="h-3.5 w-3.5" />
              )}
              Phân tích lại theo hồ sơ mới
            </button>
          )}

          {activeRoadmap ? (
            <Link
              href="/roadmap"
              className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700 shadow-xs"
            >
              <MapIcon className="h-3.5 w-3.5" />
              Xem Lộ trình 4 năm (v{activeRoadmap.version})
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          ) : (
            isCompleted && (
              <button
                type="button"
                disabled={actionBusy !== null}
                onClick={handleGenerateRoadmapFromHere}
                className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700 shadow-xs cursor-pointer disabled:opacity-50"
              >
                {actionBusy === "roadmap" ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Sparkles className="h-3.5 w-3.5" />
                )}
                Sinh Lộ trình 4 năm AI
              </button>
            )
          )}
        </div>
      </div>

      {actionNotice && (
        <div className="rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-xs sm:text-sm text-blue-800">
          {actionNotice}
        </div>
      )}

      {/* AI Error Fallback State (AI10) */}
      {!isCompleted && (
        <div className="rounded-3xl border border-amber-200 bg-amber-50/70 p-6 sm:p-8 space-y-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-6 w-6 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-1.5">
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                Bài khảo sát của bạn đã được lưu an toàn — Cần phân tích AI lại
              </h2>
              <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                {latestAnalysis?.errorMessage ||
                  "Quá trình kết nối Gemini AI trước đó chưa hoàn tất. Toàn bộ câu trả lời của bạn vẫn được bảo toàn nguyên vẹn."}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-1">
            <button
              type="button"
              disabled={actionBusy !== null}
              onClick={handleRetryAnalyze}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-xs sm:text-sm font-semibold text-white hover:bg-blue-700 shadow-xs cursor-pointer disabled:opacity-50"
            >
              {actionBusy === "retry" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4" />
              )}
              Thử phân tích lại với Gemini AI
            </button>
          </div>
        </div>
      )}

      {/* AI Analysis Detailed View */}
      {isCompleted && latestAnalysis && (
        <AiAnalysisView
          analysis={latestAnalysis}
          onGenerateRoadmapForOption={handleGenerateRoadmapForOption}
          generatingOptionKey={generatingOptionKey}
          onAddCustomCareer={handleAddCustomCareer}
          onRemoveCustomCareer={handleRemoveCustomCareer}
          addingCustomCareer={addingCustomCareer}
          removingCustomCareerId={removingCustomCareerId}
        />
      )}

      {/* Collapsible Submitted Answers Snapshot (PA10) */}
      <div className="rounded-3xl border border-slate-200/90 bg-white shadow-2xs overflow-hidden">
        <button
          type="button"
          onClick={() => setShowAnswers((s) => !s)}
          className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-slate-50/70 transition-colors cursor-pointer"
        >
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Xem lại câu trả lời bạn đã nộp ({submission.answers.length} câu)
            </h3>
            <p className="text-xs text-slate-500">
              Dữ liệu gốc được lưu snapshot tại thời điểm nộp bài
            </p>
          </div>
          {showAnswers ? (
            <ChevronUp className="h-5 w-5 text-slate-500" />
          ) : (
            <ChevronDown className="h-5 w-5 text-slate-500" />
          )}
        </button>

        {showAnswers && (
          <div className="border-t border-slate-100 divide-y divide-slate-100 px-6 py-2">
            {submission.answers.map((ans, idx) => (
              <div key={ans.questionId || idx} className="py-3.5 space-y-1">
                <div className="flex items-center gap-2 text-[11px] text-slate-400">
                  <span className="font-bold text-slate-600">#{idx + 1}</span>
                  <span className="font-mono">{ans.questionCode}</span>
                  <span>·</span>
                  <span>{ans.questionType}</span>
                </div>
                <p className="text-xs sm:text-sm font-semibold text-slate-800">
                  {ans.questionTextSnapshot}
                </p>
                <p className="text-xs sm:text-sm text-blue-700 font-medium bg-blue-50/60 rounded-xl px-3 py-2 inline-block">
                  {ans.readableValue ||
                    (Array.isArray(ans.value)
                      ? ans.value.join("; ")
                      : String(ans.value))}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function OnboardingResultPage({
  params,
}: {
  params: Promise<{ submissionId: string }>;
}) {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-4xl px-4 py-16">
          <div className="flex min-h-[320px] items-center justify-center rounded-3xl border border-slate-200 bg-white">
            <Loader2 className="h-8 w-8 animate-spin text-[#102C8A]" />
          </div>
        </div>
      }
    >
      <OnboardingResultContent params={params} />
    </Suspense>
  );
}

