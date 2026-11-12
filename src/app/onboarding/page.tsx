"use client";

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  Compass,
  History,
  LayoutList,
  Loader2,
  Save,
  Sparkles,
} from "lucide-react";
import { QuestionRenderer } from "@/components/assessment/QuestionRenderer";
import { fetchWithAuth, useAuth } from "@/components/providers/AuthProvider";
import { ONBOARDING_STEPS } from "@/constants";
import {
  computeVisibleQuestions,
  isAnswerEmpty,
  validateVisibleAnswers,
} from "@/lib/assessment-logic";
import { cn } from "@/lib/utils";
import type {
  AssessmentAnswersMap,
  AssessmentAnswerValue,
  IAssessmentQuestionDTO,
  IQuestionnaireDTO,
} from "@/types";

function OnboardingAssessmentContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, setAuthUser, refreshUser } = useAuth();
  const fromRegister = searchParams.get("from") === "register";
  const isOnboardingStep3 =
    fromRegister || user?.onboardingStep === ONBOARDING_STEPS.QUIZ;

  const [questionnaire, setQuestionnaire] = useState<IQuestionnaireDTO | null>(
    null
  );
  const [questions, setQuestions] = useState<IAssessmentQuestionDTO[]>([]);
  const [answers, setAnswers] = useState<AssessmentAnswersMap>({});
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [submittedCount, setSubmittedCount] = useState(0);

  const [viewMode, setViewMode] = useState<"step" | "all">("step");
  const [loading, setLoading] = useState(true);
  const [savingDraft, setSavingDraft] = useState(false);
  const [lastSavedText, setLastSavedText] = useState<string | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [skipping, setSkipping] = useState(false);
  const [submitStage, setSubmitStage] = useState("");
  const [pageError, setPageError] = useState<string | null>(null);
  const [questionErrors, setQuestionErrors] = useState<Record<string, string>>({});

  const hasHydratedRef = useRef(false);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const draftAbortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    let active = true;
    async function loadAssessment() {
      try {
        const res = await fetchWithAuth("/api/assessments/active", {
          cache: "no-store",
        });
        const data = await res.json();
        if (!active) return;

        if (!res.ok) {
          setPageError(
            data.error || "Không thể tải bài trắc nghiệm định hướng."
          );
          return;
        }

        setQuestionnaire(data.questionnaire || null);
        setQuestions(Array.isArray(data.questions) ? data.questions : []);
        setSubmittedCount(Number(data.submittedCount) || 0);

        if (data.draft) {
          const restoredAnswers: AssessmentAnswersMap = {};
          for (const item of data.draft.answers || []) {
            if (item.questionId) {
              restoredAnswers[item.questionId] = item.value;
            }
          }
          setAnswers(restoredAnswers);
          setCurrentStepIndex(Number(data.draft.currentStepIndex) || 0);
          if (data.draft.lastSavedAt) {
            setLastSavedText(
              `Đã khôi phục bản nháp lúc ${new Date(
                data.draft.lastSavedAt
              ).toLocaleTimeString("vi-VN")}`
            );
          }
        }
      } catch {
        if (active) {
          setPageError("Lỗi kết nối máy chủ khi tải bài khảo sát.");
        }
      } finally {
        if (active) {
          setLoading(false);
          setTimeout(() => {
            hasHydratedRef.current = true;
          }, 50);
        }
      }
    }

    loadAssessment();
    return () => {
      active = false;
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
      draftAbortRef.current?.abort();
    };
  }, []);

  const { visibleQuestions, visibleAnswersMap } = useMemo(
    () => computeVisibleQuestions(questions, answers),
    [questions, answers]
  );

  const safeStepIndex = Math.min(
    Math.max(0, currentStepIndex),
    Math.max(0, visibleQuestions.length - 1)
  );

  const persistDraft = useCallback(
    async (nextAnswers: AssessmentAnswersMap, nextStep: number) => {
      if (!questionnaire?._id) return;
      draftAbortRef.current?.abort();
      const controller = new AbortController();
      draftAbortRef.current = controller;

      setSavingDraft(true);
      try {
        const res = await fetchWithAuth("/api/assessments/draft", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          signal: controller.signal,
          body: JSON.stringify({
            questionnaireId: questionnaire._id,
            answers: nextAnswers,
            currentStepIndex: nextStep,
          }),
        });
        if (!controller.signal.aborted && res.ok) {
          const data = await res.json();
          const savedAt = data.savedAt ? new Date(data.savedAt) : new Date();
          setLastSavedText(
            `Đã lưu tiến độ lúc ${savedAt.toLocaleTimeString("vi-VN")}`
          );
        }
      } catch {
        // Silent background save / abort error
      } finally {
        if (draftAbortRef.current === controller) {
          draftAbortRef.current = null;
          setSavingDraft(false);
        }
      }
    },
    [questionnaire]
  );

  // Auto-save debounce 1.5s khi answers hoặc step thay đổi (PA08)
  useEffect(() => {
    if (!hasHydratedRef.current || loading || submitting || !questionnaire) {
      return;
    }
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    debounceTimerRef.current = setTimeout(() => {
      persistDraft(visibleAnswersMap, safeStepIndex);
    }, 1500);

    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, [
    visibleAnswersMap,
    safeStepIndex,
    loading,
    submitting,
    questionnaire,
    persistDraft,
  ]);

  const handleAnswerChange = (questionId: string, val: AssessmentAnswerValue) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: val,
    }));
    setQuestionErrors((prev) => {
      if (!prev[questionId]) return prev;
      const next = { ...prev };
      delete next[questionId];
      return next;
    });
    setPageError(null);
  };

  const handleSkipOnboardingQuiz = async () => {
    if (skipping || submitting) return;
    setSkipping(true);
    try {
      const res = await fetchWithAuth("/api/assessments/skip", {
        method: "POST",
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.user) {
        setAuthUser(data.user);
      } else {
        await refreshUser().catch(() => {});
      }
      router.push("/");
      router.refresh();
    } catch {
      router.push("/");
    } finally {
      setSkipping(false);
    }
  };

  const handleSubmit = async () => {
    if (!questionnaire || submitting) return;
    setPageError(null);

    const validation = validateVisibleAnswers(questions, answers);
    if (!validation.valid) {
      const errMap: Record<string, string> = {};
      for (const e of validation.errors) {
        errMap[e.questionId] = e.message;
      }
      setQuestionErrors(errMap);
      setPageError(
        validation.errors[0]?.message ||
          "Vui lòng hoàn thành các câu hỏi bắt buộc đang hiển thị."
      );

      // Tự nhảy tới câu hỏi đầu tiên bị thiếu
      const firstErrId = validation.errors[0]?.questionId;
      const errIdx = visibleQuestions.findIndex((q) => q._id === firstErrId);
      if (errIdx >= 0) {
        setCurrentStepIndex(errIdx);
      }
      return;
    }

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    draftAbortRef.current?.abort();

    setSubmitting(true);
    setSubmitStage(
      "Đang lưu bài khảo sát & gọi AI Gemini phân tích định hướng cá nhân..."
    );

    try {
      const res = await fetchWithAuth("/api/assessments/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questionnaireId: questionnaire._id,
          answers: validation.cleanedAnswers,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setPageError(data.error || "Không thể nộp bài khảo sát.");
        setSubmitting(false);
        return;
      }

      await refreshUser().catch(() => {});

      const submissionId = data.submission?._id;
      if (submissionId) {
        router.push(`/onboarding/result/${submissionId}`);
      } else {
        router.push("/onboarding/history");
      }
    } catch {
      setPageError("Lỗi kết nối khi gửi bài phân tích AI. Vui lòng thử lại.");
      setSubmitting(false);
    }
  };

  const answeredCount = visibleQuestions.filter(
    (q) => !isAnswerEmpty(visibleAnswersMap[q._id])
  ).length;
  const progressPercent =
    visibleQuestions.length === 0
      ? 0
      : Math.round((answeredCount / visibleQuestions.length) * 100);

  if (loading) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center gap-3">
        <Loader2 className="h-9 w-9 animate-spin text-blue-600" />
        <p className="text-sm font-medium text-slate-600">
          Đang tải bài trắc nghiệm định hướng cá nhân...
        </p>
      </div>
    );
  }

  if (submitting) {
    return (
      <div className="flex min-h-[72vh] items-center justify-center px-4">
        <div className="max-w-md w-full rounded-3xl border border-blue-200 bg-white p-8 text-center shadow-sm space-y-4">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
            <Sparkles className="h-7 w-7 animate-pulse" />
          </div>
          <h2 className="text-lg font-bold text-slate-900">
            AI Gemini đang kiến tạo định hướng riêng cho bạn
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            {submitStage}
          </p>
          <div className="flex items-center justify-center gap-2 text-xs font-semibold text-blue-600 pt-1">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Quá trình này có thể mất 10–25 giây, vui lòng không đóng trang...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!questionnaire || visibleQuestions.length === 0) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-12">
        <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center space-y-4 shadow-xs">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
            <Compass className="h-6 w-6" />
          </div>
          <h1 className="text-xl font-bold text-slate-900">
            Chưa có bộ câu hỏi định hướng đang kích hoạt
          </h1>
          <p className="text-sm text-slate-500">
            {pageError ||
              "Quản trị viên hiện đang tạm đóng hoặc cập nhật bộ câu hỏi mới. Bạn có thể xem lại lịch sử phân tích trước đây hoặc quay về lộ trình."}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            {submittedCount > 0 && (
              <Link
                href="/onboarding/history"
                className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700"
              >
                <History className="h-4 w-4" />
                Xem lịch sử kết quả ({submittedCount})
              </Link>
            )}
            <Link
              href="/roadmap"
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              Đi tới Lộ trình cá nhân
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const currentQuestion = visibleQuestions[safeStepIndex];

  return (
    <div className="max-w-4xl mx-auto px-5 sm:px-8 py-7 space-y-6">
      {isOnboardingStep3 && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-slate-200/90 bg-white px-4 py-3 shadow-2xs">
          <div className="flex items-center flex-1 gap-2">
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                <Check className="h-3.5 w-3.5" />
              </span>
              <span className="text-xs font-medium text-emerald-700">
                Tài khoản
              </span>
            </div>
            <div className="h-px flex-1 mx-1.5 bg-emerald-200" />
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                <Check className="h-3.5 w-3.5" />
              </span>
              <span className="text-xs font-medium text-emerald-700">
                Hồ sơ sinh viên
              </span>
            </div>
            <div className="h-px flex-1 mx-1.5 bg-blue-200" />
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-[11px] font-bold text-white">
                3
              </span>
              <span className="text-xs font-semibold text-blue-700">
                Quiz định hướng (Bước 3/3)
              </span>
            </div>
          </div>

          <button
            type="button"
            disabled={skipping || submitting}
            onClick={handleSkipOnboardingQuiz}
            className="self-start sm:self-auto text-xs font-semibold text-slate-500 hover:text-slate-800 hover:underline cursor-pointer disabled:opacity-50"
          >
            {skipping ? "Đang chuyển..." : "Làm sau, vào trang chủ →"}
          </button>
        </div>
      )}

      {/* Header & Status Bar */}
      <div className="rounded-3xl border border-blue-200/70 bg-gradient-to-r from-blue-50/80 via-white to-indigo-50/70 p-6 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-full bg-blue-600 px-2.5 py-0.5 text-[11px] font-semibold text-white">
                <Sparkles className="h-3 w-3" /> Onboarding Định hướng AI
              </span>
              <span className="text-[11px] font-medium text-slate-500">
                v{questionnaire.version}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              {questionnaire.title}
            </h1>
            {questionnaire.description && (
              <p className="text-xs sm:text-sm text-slate-600">
                {questionnaire.description}
              </p>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {submittedCount > 0 && (
              <Link
                href="/onboarding/history"
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                <History className="h-3.5 w-3.5 text-blue-600" />
                Lịch sử ({submittedCount})
              </Link>
            )}
            <button
              type="button"
              onClick={() =>
                setViewMode((m) => (m === "step" ? "all" : "step"))
              }
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
            >
              <LayoutList className="h-3.5 w-3.5 text-indigo-600" />
              {viewMode === "step" ? "Xem toàn bộ" : "Chế độ từng câu"}
            </button>
          </div>
        </div>

        {/* Dynamic Progress Bar */}
        <div className="space-y-2 pt-1">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
            <span className="font-semibold text-slate-700">
              Đã hoàn thành {answeredCount} / {visibleQuestions.length} câu hỏi phù hợp ({progressPercent}%)
            </span>
            <span className="text-[11px] text-slate-500 flex items-center gap-1.5">
              {savingDraft ? (
                <>
                  <Loader2 className="h-3 w-3 animate-spin text-blue-600" />
                  Đang lưu nháp...
                </>
              ) : lastSavedText ? (
                <>
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                  {lastSavedText}
                </>
              ) : (
                "Tự động lưu tiến độ"
              )}
            </span>
          </div>
          <div className="h-2 w-full rounded-full bg-blue-100 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {pageError && (
        <div className="flex items-start gap-2.5 rounded-2xl border border-red-200 bg-red-50 p-4 text-xs sm:text-sm text-red-700">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <span>{pageError}</span>
        </div>
      )}

      {/* Question Area */}
      {viewMode === "step" ? (
        <div className="space-y-5">
          {/* Quick step indicators */}
          <div className="flex flex-wrap items-center gap-1.5">
            {visibleQuestions.map((q, idx) => {
              const answered = !isAnswerEmpty(visibleAnswersMap[q._id]);
              const hasErr = Boolean(questionErrors[q._id]);
              const isCurrent = idx === safeStepIndex;
              return (
                <button
                  key={q._id}
                  type="button"
                  onClick={() => setCurrentStepIndex(idx)}
                  className={cn(
                    "h-8 min-w-[32px] px-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer border",
                    isCurrent
                      ? "border-blue-600 bg-blue-600 text-white shadow-2xs"
                      : hasErr
                        ? "border-red-300 bg-red-50 text-red-700"
                        : answered
                          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                          : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                  )}
                >
                  {idx + 1}
                </button>
              );
            })}
          </div>

          {currentQuestion && (
            <QuestionRenderer
              key={currentQuestion._id}
              question={currentQuestion}
              questionNumber={safeStepIndex + 1}
              totalQuestions={visibleQuestions.length}
              value={visibleAnswersMap[currentQuestion._id]}
              onChange={(val) => handleAnswerChange(currentQuestion._id, val)}
              errorMessage={questionErrors[currentQuestion._id]}
              showConditionBadge
            />
          )}

          {/* Step Footer Controls */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={safeStepIndex === 0}
                onClick={() =>
                  setCurrentStepIndex((i) => Math.max(0, i - 1))
                }
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-45 cursor-pointer disabled:cursor-not-allowed"
              >
                <ArrowLeft className="h-4 w-4" />
                Câu trước
              </button>

              <button
                type="button"
                disabled={savingDraft}
                onClick={() => persistDraft(visibleAnswersMap, safeStepIndex)}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                <Save className="h-4 w-4 text-blue-600" />
                Lưu tiến độ
              </button>
            </div>

            {safeStepIndex < visibleQuestions.length - 1 ? (
              <button
                type="button"
                onClick={() =>
                  setCurrentStepIndex((i) =>
                    Math.min(visibleQuestions.length - 1, i + 1)
                  )
                }
                className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-5 py-2.5 text-xs sm:text-sm font-semibold text-white hover:bg-blue-700 shadow-xs cursor-pointer"
              >
                Tiếp theo
                <ArrowRight className="h-4 w-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-2.5 text-xs sm:text-sm font-semibold text-white hover:opacity-95 shadow-sm cursor-pointer"
              >
                <Sparkles className="h-4 w-4" />
                Hoàn thành &amp; Phân tích AI
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-5">
          {visibleQuestions.map((q, idx) => (
            <QuestionRenderer
              key={q._id}
              question={q}
              questionNumber={idx + 1}
              totalQuestions={visibleQuestions.length}
              value={visibleAnswersMap[q._id]}
              onChange={(val) => handleAnswerChange(q._id, val)}
              errorMessage={questionErrors[q._id]}
              showConditionBadge
            />
          ))}

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <button
              type="button"
              disabled={savingDraft}
              onClick={() => persistDraft(visibleAnswersMap, safeStepIndex)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
            >
              <Save className="h-4 w-4 text-blue-600" />
              Lưu tiến độ nháp
            </button>

            <button
              type="button"
              onClick={handleSubmit}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-3 text-sm font-semibold text-white hover:opacity-95 shadow-sm cursor-pointer"
            >
              <Sparkles className="h-4 w-4" />
              Hoàn thành &amp; Phân tích AI
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function OnboardingAssessmentPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[70vh] flex-col items-center justify-center gap-3">
          <Loader2 className="h-9 w-9 animate-spin text-blue-600" />
          <p className="text-sm font-medium text-slate-600">
            Đang tải bài trắc nghiệm định hướng cá nhân...
          </p>
        </div>
      }
    >
      <OnboardingAssessmentContent />
    </Suspense>
  );
}
