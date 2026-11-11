"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Compass,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Sparkles,
  Award,
  BookOpen,
  Briefcase,
  FlaskConical,
  Rocket,
  Flame,
  RotateCcw,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Option {
  id: string;
  text: string;
}

interface Question {
  id: string;
  question: string;
  category: string;
  order: number;
  options: Option[];
}

interface RecommendedDirection {
  direction: string;
  title: string;
  score: number;
  description: string;
  suggestedNextSteps: string[];
}

interface QuizSubmissionResult {
  message: string;
  result: {
    _id: string;
    studentId: string;
    recommendedDirections: RecommendedDirection[];
    createdAt: string;
  };
  scores: Record<string, number>;
  recommendedDirections: RecommendedDirection[];
}

const DIRECTION_ICONS: Record<string, typeof Compass> = {
  study_abroad: BookOpen,
  employment: Briefcase,
  research: FlaskConical,
  startup: Rocket,
  skills: Flame,
};

const CATEGORY_NAMES: Record<string, string> = {
  GOAL: "Mục tiêu tương lai",
  INTEREST: "Sở thích & Hứng thú",
  PREPARATION: "Kế hoạch chứng chỉ",
  WORK_STYLE: "Phong cách làm việc",
  VALUES: "Giá trị cá nhân",
  ACADEMIC: "Học thuật & Chuyên ngành",
  SKILLS: "Kỹ năng nòng cốt",
};

export default function OnboardingQuizPage() {
  const router = useRouter();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<QuizSubmissionResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchQuestions() {
      try {
        const res = await fetch("/api/quiz");
        const data = await res.json();
        if (data.questions && data.questions.length > 0) {
          setQuestions(data.questions);
        } else {
          setError("Hiện chưa có câu hỏi trắc nghiệm nào trong hệ thống.");
        }
      } catch (err) {
        console.error("Failed to load questions", err);
        setError("Không thể tải danh sách câu hỏi. Vui lòng thử lại sau.");
      } finally {
        setIsLoading(false);
      }
    }
    fetchQuestions();
  }, []);

  const currentQ = questions[currentIndex];
  const total = questions.length;
  const progressPercent = total > 0 ? Math.round(((currentIndex + 1) / total) * 100) : 0;
  const isCurrentAnswered = currentQ ? Boolean(answers[currentQ.id]) : false;
  const isAllAnswered = questions.length > 0 && questions.every((q) => Boolean(answers[q.id]));

  const handleSelectOption = (optionId: string) => {
    if (!currentQ) return;
    setAnswers((prev) => ({
      ...prev,
      [currentQ.id]: optionId,
    }));
  };

  const handleNext = () => {
    if (currentIndex < total - 1) {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  const handleSubmit = async () => {
    if (!isAllAnswered) {
      setError("Vui lòng trả lời toàn bộ các câu hỏi trước khi nhận kết quả.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/quiz/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Gửi bài trắc nghiệm thất bại");
      }

      setResult(data);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Đã có lỗi xảy ra";
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRetake = () => {
    setAnswers({});
    setCurrentIndex(0);
    setResult(null);
    setError(null);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="flex flex-col items-center gap-3">
          <div className="h-9 w-9 rounded-full border-3 border-blue-600 border-t-transparent animate-spin" />
          <p className="text-xs font-semibold text-slate-600">Đang chuẩn bị bộ câu hỏi định hướng...</p>
        </div>
      </div>
    );
  }

  // --- RESULT VIEW ---
  if (result) {
    const recommended =
      result.recommendedDirections ||
      result.result?.recommendedDirections ||
      [];
    const primary = recommended[0];
    const secondary = recommended[1];
    const PrimaryIcon = primary ? DIRECTION_ICONS[primary.direction] || Compass : Compass;
    const breakdownScores =
      result.scores || (result.result as { scores?: Record<string, number> })?.scores || {};

    return (
      <div className="min-h-screen bg-slate-50/70 py-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto space-y-6">
          {/* Header Card */}
          <div className="rounded-2xl border border-blue-100 bg-white p-7 sm:p-9 shadow-xs text-center space-y-3">
            <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-blue-50 text-blue-600 border border-blue-100 shadow-2xs">
              <Sparkles className="h-7 w-7 text-blue-600" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Hành trình của bạn đã bắt đầu!
            </h1>
            <p className="text-sm text-slate-600 max-w-xl mx-auto leading-relaxed">
              Dựa trên kết quả trắc nghiệm và đánh giá quy chuẩn, hệ thống Polaris đã phân tích điểm mạnh và đề xuất hướng đi tối ưu nhất cho bạn.
            </p>
          </div>

          {/* Top 1 Recommendation */}
          {primary && (
            <div className="rounded-2xl border border-blue-200 bg-gradient-to-br from-blue-50/90 via-sky-50/50 to-white p-7 sm:p-8 shadow-xs space-y-5">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-600 text-white text-[11px] font-bold px-3 py-1 uppercase tracking-wider shadow-2xs">
                  <Award className="h-3.5 w-3.5" />
                  Định hướng phù hợp nhất (Top 1)
                </span>
                <span className="text-xs font-bold text-blue-700 bg-white border border-blue-200 px-2.5 py-1 rounded-lg">
                  Điểm phù hợp: {primary.score}
                </span>
              </div>

              <div className="flex items-start gap-4">
                <div className="h-12 w-12 rounded-xl bg-white border border-blue-200 flex items-center justify-center shrink-0 shadow-2xs text-blue-600">
                  <PrimaryIcon className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
                    {primary.title}
                  </h2>
                  <p className="mt-1 text-sm text-slate-600 leading-relaxed">
                    {primary.description}
                  </p>
                </div>
              </div>

              {primary.suggestedNextSteps && primary.suggestedNextSteps.length > 0 && (
                <div className="pt-3 border-t border-blue-100 space-y-2">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    Các bước hành động đề xuất:
                  </p>
                  <ul className="space-y-2">
                    {primary.suggestedNextSteps.map((step, idx) => (
                      <li key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-700">
                        <CheckCircle2 className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
                        <span>{step}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Top 2 Recommendation (If any) */}
          {secondary && (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider bg-slate-100 px-2.5 py-1 rounded-md">
                  Định hướng tiềm năng kế tiếp (Top 2)
                </span>
                <span className="text-xs font-semibold text-slate-600">
                  Điểm phù hợp: {secondary.score}
                </span>
              </div>
              <h3 className="text-lg font-bold text-slate-900">{secondary.title}</h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                {secondary.description}
              </p>
            </div>
          )}

          {/* Breakdown Scores */}
          {breakdownScores && Object.keys(breakdownScores).length > 0 && (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs space-y-4">
              <h3 className="text-sm font-bold text-slate-900">
                Tổng điểm các lĩnh vực định hướng
              </h3>
              <div className="space-y-3">
                {Object.entries(breakdownScores).map(([dirKey, score]) => {
                  const labels: Record<string, string> = {
                    study_abroad: "Du học & Học bổng Quốc tế",
                    employment: "Quản trị viên Tập sự & MNC",
                    research: "Nghiên cứu Khoa học",
                    startup: "Khởi nghiệp & Sáng tạo",
                    skills: "Kỹ năng & Hoạt động Ngoại khóa",
                  };
                  const maxScore = Math.max(...Object.values(breakdownScores), 1);
                  const barWidth = Math.round((score / maxScore) * 100);

                  return (
                    <div key={dirKey} className="space-y-1">
                      <div className="flex justify-between text-xs font-medium text-slate-700">
                        <span>{labels[dirKey] || dirKey}</span>
                        <span className="font-bold text-blue-600">{score} điểm</span>
                      </div>
                      <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-600 rounded-full transition-all duration-500"
                          style={{ width: `${barWidth}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Action CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
            <button
              type="button"
              onClick={handleRetake}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-2xs transition-colors"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Làm lại bài trắc nghiệm</span>
            </button>

            <div className="w-full sm:w-auto flex items-center gap-3">
              <Link href="/explore" className="w-full sm:w-auto">
                <button
                  type="button"
                  className="w-full sm:w-auto rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-2xs transition-colors"
                >
                  Khám phá cơ hội
                </button>
              </Link>

              <Link href="/roadmap" className="w-full sm:w-auto">
                <button
                  type="button"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-2.5 text-xs font-semibold text-white shadow-sm shadow-blue-500/25 hover:bg-blue-700 transition-colors"
                >
                  <span>Xem Lộ trình của tôi</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- QUESTION STEPPER VIEW ---
  return (
    <div className="min-h-screen bg-slate-50/70 py-8 px-4 sm:px-6 lg:px-8 flex flex-col justify-between">
      {/* Top Bar: Brand, Progress, Skip */}
      <header className="max-w-3xl mx-auto w-full flex items-center justify-between pb-6 border-b border-slate-200/80">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-xl font-bold tracking-tight text-blue-600">Unera</span>
          <span className="h-4 w-px bg-slate-200" />
          <span className="text-xs font-medium text-slate-500">Định hướng nghề nghiệp</span>
        </Link>

        {/* FR-ONB-01 & FR-ONB-02: Sinh viên có thể bỏ qua trắc nghiệm bất cứ lúc nào */}
        <Link
          href="/explore"
          className="text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors px-3 py-1.5 rounded-lg hover:bg-slate-100"
          title="Bỏ qua trắc nghiệm và vào thẳng hệ thống"
        >
          Bỏ qua trắc nghiệm &rarr;
        </Link>
      </header>

      {/* Main Question Card */}
      <main className="max-w-3xl mx-auto w-full my-auto py-8">
        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-xs font-medium text-red-700">
            {error}
          </div>
        )}

        <div className="rounded-2xl border border-slate-200 bg-white p-7 sm:p-9 shadow-xs space-y-7">
          {/* Progress Indicator */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-medium text-slate-500">
              <span className="inline-flex items-center gap-1.5 rounded-md bg-blue-50 px-2 py-0.5 text-[11px] font-bold text-blue-700 uppercase tracking-wider">
                {CATEGORY_NAMES[currentQ?.category] || currentQ?.category || "Khảo sát"}
              </span>
              <span className="font-semibold text-slate-700">
                Câu hỏi {currentIndex + 1} / {total}
              </span>
            </div>
            <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-600 rounded-full transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* Question Text */}
          <div className="space-y-2">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 leading-snug">
              {currentQ?.question}
            </h2>
            <p className="text-xs text-slate-500">
              Chọn một phương án phù hợp nhất với mong muốn hiện tại của bạn.
            </p>
          </div>

          {/* Options List */}
          <div className="space-y-3">
            {currentQ?.options.map((option) => {
              const isSelected = answers[currentQ.id] === option.id;
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => handleSelectOption(option.id)}
                  className={cn(
                    "w-full text-left rounded-xl border p-4 sm:p-4.5 transition-all flex items-start gap-3.5 group",
                    isSelected
                      ? "border-blue-600 bg-blue-50/40 text-blue-950 shadow-2xs"
                      : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50 text-slate-800"
                  )}
                >
                  <div
                    className={cn(
                      "h-5 w-5 rounded-full border flex items-center justify-center shrink-0 mt-0.5 transition-colors",
                      isSelected
                        ? "border-blue-600 bg-blue-600 text-white"
                        : "border-slate-300 bg-white group-hover:border-slate-400"
                    )}
                  >
                    {isSelected && <div className="h-2 w-2 rounded-full bg-white" />}
                  </div>
                  <span className="text-xs sm:text-sm font-medium leading-relaxed">
                    {option.text}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Bottom Navigation */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            <button
              type="button"
              onClick={handleBack}
              disabled={currentIndex === 0}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold transition-colors",
                currentIndex === 0
                  ? "opacity-40 cursor-not-allowed text-slate-400"
                  : "text-slate-700 hover:bg-slate-50 shadow-2xs"
              )}
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Quay lại</span>
            </button>

            {currentIndex === total - 1 ? (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={!isAllAnswered || isSubmitting}
                className={cn(
                  "inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-2.5 text-xs font-semibold text-white shadow-sm shadow-blue-500/25 transition-all",
                  !isAllAnswered || isSubmitting
                    ? "opacity-50 cursor-not-allowed"
                    : "hover:bg-blue-700"
                )}
              >
                {isSubmitting ? (
                  <>
                    <div className="h-3.5 w-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                    <span>Đang tổng hợp kết quả...</span>
                  </>
                ) : (
                  <>
                    <span>Hoàn thành &amp; Nhận kết quả</span>
                    <Sparkles className="h-3.5 w-3.5" />
                  </>
                )}
              </button>
            ) : (
              <button
                type="button"
                onClick={handleNext}
                disabled={!isCurrentAnswered}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-5 py-2 text-xs font-semibold text-white shadow-sm shadow-blue-500/25 transition-all",
                  !isCurrentAnswered
                    ? "opacity-50 cursor-not-allowed"
                    : "hover:bg-blue-700"
                )}
              >
                <span>Tiếp tục</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>
      </main>

      {/* Footer info */}
      <footer className="max-w-3xl mx-auto w-full pt-6 text-center text-[11px] text-slate-400">
        Polaris · Bản quyền định hướng và đồng hành sinh viên ULIS DMST 2026
      </footer>
    </div>
  );
}

