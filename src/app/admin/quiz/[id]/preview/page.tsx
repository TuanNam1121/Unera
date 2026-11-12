"use client";

import { Suspense, use, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Eye,
  EyeOff,
  GitBranch,
  Loader2,
  RotateCcw,
} from "lucide-react";
import { QuestionRenderer } from "@/components/assessment/QuestionRenderer";
import { fetchWithAuth } from "@/components/providers/AuthProvider";
import {
  computeVisibleQuestions,
  validateVisibleAnswers,
} from "@/lib/assessment-logic";
import type {
  AssessmentAnswersMap,
  AssessmentAnswerValue,
  IAssessmentQuestionDTO,
  IQuestionnaireDTO,
} from "@/types";

function AdminQuestionnairePreviewContent({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [questionnaire, setQuestionnaire] = useState<IQuestionnaireDTO | null>(
    null
  );
  const [questions, setQuestions] = useState<IAssessmentQuestionDTO[]>([]);
  const [answers, setAnswers] = useState<AssessmentAnswersMap>({});
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [validationResult, setValidationResult] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await fetchWithAuth(
          `/api/admin/questionnaires/${id}/preview`,
          { cache: "no-store" }
        );
        const data = await res.json();
        if (!active) return;
        if (!res.ok) {
          setErrorMsg(data.error || "Không thể tải chế độ xem trước.");
          return;
        }
        setQuestionnaire(data.questionnaire);
        setQuestions(data.questions || []);
      } catch {
        if (active) {
          setErrorMsg("Lỗi kết nối máy chủ khi tải bản xem trước.");
        }
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [id]);

  const { visibleQuestions, visibleAnswersMap } = useMemo(
    () => computeVisibleQuestions(questions, answers),
    [questions, answers]
  );

  const visibleIdSet = useMemo(
    () => new Set(visibleQuestions.map((q) => q._id)),
    [visibleQuestions]
  );

  const handleChangeAnswer = (
    questionId: string,
    value: AssessmentAnswerValue
  ) => {
    setValidationResult(null);
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const handleCheckValidation = () => {
    const check = validateVisibleAnswers(questions, answers);
    if (check.valid) {
      setValidationResult(
        `Hợp lệ! Tất cả ${visibleQuestions.length} câu hỏi đang hiển thị đều đạt điều kiện nộp bài (chế độ Preview không ghi dữ liệu vào CSDL).`
      );
    } else {
      const firstErr = check.errors[0]?.message;
      setValidationResult(
        `Chưa đạt yêu cầu nộp: ${firstErr || "Còn câu hỏi bắt buộc chưa hoàn thành."}`
      );
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-12">
        <div className="flex min-h-[320px] items-center justify-center rounded-3xl border border-slate-200 bg-white">
          <Loader2 className="h-8 w-8 animate-spin text-[#102C8A]" />
        </div>
      </div>
    );
  }

  if (errorMsg || !questionnaire) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12">
        <div className="rounded-3xl border border-rose-200 bg-rose-50 p-8 text-center">
          <AlertTriangle className="mx-auto h-10 w-10 text-rose-600" />
          <p className="mt-2 text-sm text-rose-800">
            {errorMsg || "Không tìm thấy bộ câu hỏi"}
          </p>
          <Link
            href="/admin/quiz"
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[#102C8A] px-4 py-2 text-sm font-semibold text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Quay lại Trình tạo câu hỏi
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
      {/* Top Preview Banner */}
      <div className="flex flex-col justify-between gap-4 rounded-3xl border border-indigo-200 bg-linear-to-r from-[#102C8A] to-[#0D9488] p-6 text-white sm:flex-row sm:items-center">
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold">
            <Eye className="h-3.5 w-3.5" />
            Chế độ Xem trước Admin (Preview Mode — Không lưu dữ liệu)
          </div>
          <h1 className="mt-2 text-2xl font-bold">{questionnaire.title}</h1>
          <p className="mt-1 text-sm text-blue-100">
            Thử chọn các phương án để kiểm tra câu hỏi phân nhánh ẩn/hiện theo
            thời gian thực.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => {
              setAnswers({});
              setValidationResult(null);
            }}
            className="inline-flex items-center gap-1.5 rounded-xl bg-white/15 px-4 py-2 text-sm font-semibold text-white hover:bg-white/25"
          >
            <RotateCcw className="h-4 w-4" />
            Đặt lại đáp án
          </button>
          <Link
            href="/admin/quiz"
            className="inline-flex items-center gap-1.5 rounded-xl bg-white px-4 py-2 text-sm font-semibold text-[#102C8A] hover:bg-blue-50"
          >
            <ArrowLeft className="h-4 w-4" />
            Quay lại chỉnh sửa
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left: Interactive Student Simulation */}
        <div className="space-y-4 lg:col-span-8">
          {visibleQuestions.length === 0 ? (
            <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-500">
              Bộ câu hỏi này hiện chưa có câu hỏi nào hiển thị.
            </div>
          ) : (
            visibleQuestions.map((q, idx) => (
              <QuestionRenderer
                key={q._id}
                question={q}
                questionNumber={idx + 1}
                totalQuestions={visibleQuestions.length}
                value={visibleAnswersMap[q._id]}
                onChange={(val) => handleChangeAnswer(q._id, val)}
                showConditionBadge
              />
            ))
          )}

          {visibleQuestions.length > 0 && (
            <div className="rounded-2xl border border-slate-200 bg-white p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-xs text-slate-500">
                  Đang hiển thị {visibleQuestions.length}/{questions.length} câu
                  hỏi dựa trên câu trả lời thử nghiệm của bạn.
                </p>
                <button
                  type="button"
                  onClick={handleCheckValidation}
                  className="inline-flex items-center gap-2 rounded-xl bg-[#102C8A] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#0B2066]"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Kiểm tra hợp lệ nộp bài
                </button>
              </div>
              {validationResult && (
                <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-medium text-slate-800">
                  {validationResult}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right: Live Conditional Inspector */}
        <aside className="lg:col-span-4">
          <div className="sticky top-6 rounded-3xl border border-slate-200 bg-white p-5 shadow-xs">
            <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-slate-700">
              <GitBranch className="h-4 w-4 text-[#102C8A]" />
              Trạng thái hiển thị ({visibleQuestions.length}/{questions.length})
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              Cập nhật ngay khi bạn chọn đáp án ở khung bên trái.
            </p>

            <div className="mt-4 space-y-2">
              {questions.map((q) => {
                const isVisible = visibleIdSet.has(q._id);
                const hasRule = Boolean(
                  q.conditionalLogic?.enabled &&
                    q.conditionalLogic.rules.length > 0
                );
                return (
                  <div
                    key={q._id}
                    className={`rounded-xl border p-3 text-xs transition ${
                      isVisible
                        ? "border-emerald-200 bg-emerald-50/50"
                        : "border-slate-200 bg-slate-50 opacity-70"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono font-bold text-slate-900">
                        #{q.order} [{q.code}]
                      </span>
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                          isVisible
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-slate-200 text-slate-600"
                        }`}
                      >
                        {isVisible ? (
                          <>
                            <Eye className="h-3 w-3" /> Đang hiện
                          </>
                        ) : (
                          <>
                            <EyeOff className="h-3 w-3" /> Đang ẩn
                          </>
                        )}
                      </span>
                    </div>
                    <p className="mt-1 line-clamp-1 text-slate-700">
                      {q.questionText}
                    </p>
                    {hasRule && (
                      <p className="mt-1 text-[11px] font-medium text-indigo-700">
                        Điều kiện nhánh ({q.conditionalLogic!.matchType} ·{" "}
                        {q.conditionalLogic!.rules.length} rule)
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

export default function AdminQuestionnairePreviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-5xl px-4 py-12">
          <div className="flex min-h-[320px] items-center justify-center rounded-3xl border border-slate-200 bg-white">
            <Loader2 className="h-8 w-8 animate-spin text-[#102C8A]" />
          </div>
        </div>
      }
    >
      <AdminQuestionnairePreviewContent params={params} />
    </Suspense>
  );
}

