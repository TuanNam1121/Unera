"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock,
  Compass,
  History,
  Loader2,
  RotateCcw,
  Sparkles,
} from "lucide-react";
import { fetchWithAuth } from "@/components/providers/AuthProvider";
import { AI_ANALYSIS_STATUS } from "@/constants";
import type {
  IAiOrientationAnalysisDTO,
  IAssessmentSubmissionDTO,
} from "@/types";

interface HistoryItem {
  submission: IAssessmentSubmissionDTO;
  questionnaireTitle: string;
  questionnaireVersion: number;
  latestAnalysis: IAiOrientationAnalysisDTO | null;
}

export default function OnboardingHistoryPage() {
  const router = useRouter();
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [retaking, setRetaking] = useState(false);

  useEffect(() => {
    async function loadHistory() {
      try {
        const res = await fetchWithAuth("/api/assessments/history", {
          cache: "no-store",
        });
        const data = await res.json();
        if (res.ok && Array.isArray(data.items)) {
          setItems(data.items);
        }
      } finally {
        setLoading(false);
      }
    }
    loadHistory();
  }, []);

  const handleRetake = async () => {
    setRetaking(true);
    try {
      const res = await fetchWithAuth("/api/assessments/retake", {
        method: "POST",
      });
      if (res.ok) {
        router.push("/onboarding");
      }
    } finally {
      setRetaking(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[65vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-5 sm:px-8 py-7 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <History className="h-6 w-6 text-blue-600" />
            Lịch sử Khảo sát Định hướng
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Theo dõi tất cả các lần làm trắc nghiệm định hướng và kết quả phân tích AI Gemini của bạn
          </p>
        </div>

        <button
          type="button"
          disabled={retaking}
          onClick={handleRetake}
          className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs sm:text-sm font-semibold text-white hover:bg-blue-700 shadow-xs cursor-pointer disabled:opacity-50 self-start sm:self-auto"
        >
          {retaking ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RotateCcw className="h-4 w-4" />
          )}
          Làm lại trắc nghiệm định hướng
        </button>
      </div>

      {items.length === 0 ? (
        <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center space-y-4">
          <Compass className="h-10 w-10 text-blue-500 mx-auto" />
          <div className="space-y-1">
            <h2 className="text-base font-bold text-slate-900">
              Bạn chưa hoàn thành bài trắc nghiệm định hướng nào
            </h2>
            <p className="text-xs sm:text-sm text-slate-500">
              Thực hiện bài khảo sát để nhận phân tích từ AI Gemini và lộ trình học tập 4 năm.
            </p>
          </div>
          <Link
            href="/onboarding"
            className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white"
          >
            <Sparkles className="h-4 w-4" />
            Bắt đầu làm khảo sát ngay
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {items.map((item) => {
            const a = item.latestAnalysis;
            const primaryDir =
              a?.analysisResult?.orientationCompatibility?.find(
                (o) => o.isPrimaryRecommendation
              )?.directionTitle ||
              a?.analysisResult?.orientationCompatibility?.[0]?.directionTitle;

            return (
              <div
                key={item.submission._id}
                className="rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-lg bg-slate-900 px-2.5 py-0.5 text-xs font-bold text-white">
                      Lần #{item.submission.attemptNumber}
                    </span>

                    {a?.status === AI_ANALYSIS_STATUS.COMPLETED ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700">
                        <CheckCircle2 className="h-3 w-3" /> Phân tích AI hoàn tất
                      </span>
                    ) : a?.status === AI_ANALYSIS_STATUS.FAILED ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 border border-amber-200 px-2.5 py-0.5 text-[11px] font-semibold text-amber-700">
                        <AlertTriangle className="h-3 w-3" /> Phân tích AI gặp lỗi (có thể thử lại)
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-semibold text-slate-600">
                        <Clock className="h-3 w-3" /> Chưa hoàn tất AI
                      </span>
                    )}

                    <span className="text-xs text-slate-400">
                      {item.submission.submittedAt
                        ? new Date(item.submission.submittedAt).toLocaleString(
                            "vi-VN"
                          )
                        : ""}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-slate-900">
                    {item.questionnaireTitle}{" "}
                    <span className="text-xs font-normal text-slate-400">
                      (v{item.questionnaireVersion})
                    </span>
                  </h3>

                  {primaryDir && (
                    <p className="text-xs text-blue-700 font-medium">
                      Định hướng đề xuất chính: {primaryDir}
                    </p>
                  )}
                </div>

                <Link
                  href={`/onboarding/result/${item.submission._id}`}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50 px-4 py-2 text-xs font-semibold text-blue-700 hover:bg-blue-100 shrink-0 self-start md:self-center"
                >
                  Xem chi tiết &amp; Phân tích AI
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

