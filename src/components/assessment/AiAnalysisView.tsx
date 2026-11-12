"use client";

import { useState } from "react";
import {
  Award,
  BookOpen,
  Briefcase,
  CheckCircle2,
  Compass,
  Flame,
  Lightbulb,
  Loader2,
  Map as MapIcon,
  Plus,
  Sparkles,
  Trash2,
  TrendingUp,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { IAiOrientationAnalysisDTO } from "@/types";

export interface GenerateRoadmapOptionPayload {
  optionKey: string;
  targetDirection: string;
  notes?: string;
}

interface AiAnalysisViewProps {
  analysis: IAiOrientationAnalysisDTO;
  onGenerateRoadmapForOption?: (payload: GenerateRoadmapOptionPayload) => Promise<void> | void;
  generatingOptionKey?: string | null;
  onAddCustomCareer?: (payload: {
    title: string;
    reason?: string;
  }) => Promise<{ ok: boolean; optionId?: string; error?: string }>;
  onRemoveCustomCareer?: (optionId: string) => Promise<void> | void;
  addingCustomCareer?: boolean;
  removingCustomCareerId?: string | null;
}

export function AiAnalysisView({
  analysis,
  onGenerateRoadmapForOption,
  generatingOptionKey = null,
  onAddCustomCareer,
  onRemoveCustomCareer,
  addingCustomCareer = false,
  removingCustomCareerId = null,
}: AiAnalysisViewProps) {
  const result = analysis.analysisResult;
  const [customTitle, setCustomTitle] = useState("");
  const [customReason, setCustomReason] = useState("");
  const [customError, setCustomError] = useState<string | null>(null);

  if (!result) return null;

  const customCareers = Array.isArray(analysis.customCareerOptions)
    ? analysis.customCareerOptions
    : [];
  const isBusy =
    generatingOptionKey !== null ||
    addingCustomCareer ||
    removingCustomCareerId !== null;

  const handleCreateCustom = async (generateImmediately: boolean) => {
    const trimmedTitle = customTitle.trim();
    const trimmedReason = customReason.trim();
    if (trimmedTitle.length < 2) {
      setCustomError("Vui lòng nhập tên định hướng nghề nghiệp (tối thiểu 2 ký tự).");
      return;
    }
    setCustomError(null);

    if (onAddCustomCareer) {
      const saved = await onAddCustomCareer({
        title: trimmedTitle,
        reason: trimmedReason,
      });
      if (!saved.ok) {
        setCustomError(saved.error || "Không thể lưu định hướng nghề nghiệp.");
        return;
      }
      setCustomTitle("");
      setCustomReason("");

      if (generateImmediately && onGenerateRoadmapForOption) {
        await onGenerateRoadmapForOption({
          optionKey: saved.optionId ? `custom-${saved.optionId}` : "custom-new",
          targetDirection: trimmedTitle,
          notes: trimmedReason || undefined,
        });
      }
      return;
    }

    if (generateImmediately && onGenerateRoadmapForOption) {
      await onGenerateRoadmapForOption({
        optionKey: "custom-new",
        targetDirection: trimmedTitle,
        notes: trimmedReason || undefined,
      });
    }
  };

  const sortedCompat = [...result.orientationCompatibility].sort(
    (a, b) => b.compatibilityScore - a.compatibilityScore
  );

  return (
    <div className="space-y-6">
      {/* 1. Overall Summary */}
      <Card className="rounded-3xl border-blue-200/80 bg-gradient-to-br from-blue-50/70 via-white to-indigo-50/60 shadow-xs">
        <CardContent className="p-6 sm:p-7 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-600 px-3 py-1 text-xs font-semibold text-white shadow-2xs">
              <Sparkles className="h-3.5 w-3.5" />
              Phân tích Định hướng AI Gemini
            </span>
            <div className="flex items-center gap-2 text-[11px] text-slate-500">
              <span className="rounded-md bg-white border border-slate-200 px-2 py-0.5 font-mono">
                {analysis.modelUsed} · Prompt v{analysis.promptVersion}
              </span>
              <span>
                {new Date(analysis.createdAt).toLocaleString("vi-VN")}
              </span>
            </div>
          </div>

          <h2 className="text-lg sm:text-xl font-bold text-slate-900">
            Chân dung & Nhận định Tổng quan
          </h2>
          <p className="text-sm sm:text-base text-slate-700 leading-relaxed">
            {result.overallSummary}
          </p>
        </CardContent>
      </Card>

      {/* 2. Profile Evaluation Bento */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="rounded-2xl border-slate-200/90 bg-white shadow-2xs">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Flame className="h-4 w-4 text-amber-500" />
              Sở thích nổi trội
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {result.profileEvaluation.interests.map((item, i) => (
              <div
                key={i}
                className="flex items-start gap-2 rounded-xl bg-amber-50/60 border border-amber-100 px-3 py-2 text-xs text-slate-700"
              >
                <span className="text-amber-600 font-bold">•</span>
                <span>{item}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-slate-200/90 bg-white shadow-2xs">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              Điểm mạnh nền tảng
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {result.profileEvaluation.strengths.map((item, i) => (
              <div
                key={i}
                className="flex items-start gap-2 rounded-xl bg-emerald-50/60 border border-emerald-100 px-3 py-2 text-xs text-slate-700"
              >
                <span className="text-emerald-600 font-bold">✓</span>
                <span>{item}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-slate-200/90 bg-white shadow-2xs">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-blue-600" />
              Điểm cần bồi đắp
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {result.profileEvaluation.areasForImprovement.map((item, i) => (
              <div
                key={i}
                className="flex items-start gap-2 rounded-xl bg-blue-50/60 border border-blue-100 px-3 py-2 text-xs text-slate-700"
              >
                <span className="text-blue-600 font-bold">→</span>
                <span>{item}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* 3. Orientation Compatibility */}
      <Card className="rounded-3xl border-slate-200/90 bg-white shadow-xs">
        <CardHeader className="pb-3">
          <CardTitle className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
            <Compass className="h-5 w-5 text-blue-600" />
            Mức độ Tương thích theo từng Định hướng
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {sortedCompat.map((item) => (
            <div
              key={item.directionCode}
              className={cn(
                "rounded-2xl border p-4 space-y-2.5 transition-all",
                item.isPrimaryRecommendation
                  ? "border-blue-300 bg-blue-50/40 ring-1 ring-blue-200/60"
                  : "border-slate-200 bg-white"
              )}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-slate-900">
                    {item.directionTitle}
                  </h3>
                  {item.isPrimaryRecommendation && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-blue-600 px-2.5 py-0.5 text-[11px] font-semibold text-white">
                      Đề xuất phù hợp nhất
                    </span>
                  )}
                </div>
                <span
                  className={cn(
                    "text-base font-extrabold tabular-nums",
                    item.compatibilityScore >= 80
                      ? "text-emerald-600"
                      : item.compatibilityScore >= 60
                        ? "text-blue-600"
                        : "text-slate-600"
                  )}
                >
                  {item.compatibilityScore}%
                </span>
              </div>

              <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                <div
                  className={cn(
                    "h-full rounded-full transition-all duration-500",
                    item.isPrimaryRecommendation ? "bg-blue-600" : "bg-indigo-400"
                  )}
                  style={{ width: `${item.compatibilityScore}%` }}
                />
              </div>

              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                {item.reasoning}
              </p>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* 4. Career Recommendations */}
      <Card className="rounded-3xl border-slate-200/90 bg-white shadow-xs">
        <CardHeader className="pb-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <CardTitle className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-indigo-600" />
              Định hướng Nghề nghiệp &amp; Vai trò Mục tiêu Đề xuất
            </CardTitle>
            {onGenerateRoadmapForOption && (
              <span className="text-xs text-slate-500">
                Chọn 1 định hướng bên dưới để AI kiến tạo lộ trình 4 năm riêng
              </span>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {result.careerRecommendations.map((career, idx) => {
              const optionKey = `ai-${idx}`;
              const isGeneratingThis = generatingOptionKey === optionKey;
              return (
                <div
                  key={optionKey}
                  className="rounded-2xl border border-slate-200/90 bg-slate-50/40 p-5 space-y-4 flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="text-sm font-bold text-slate-900">
                          {career.title}
                        </h4>
                        <p className="text-xs text-slate-500">{career.industry}</p>
                      </div>
                      <span className="shrink-0 rounded-lg bg-indigo-50 border border-indigo-200 px-2.5 py-1 text-xs font-bold text-indigo-700 tabular-nums">
                        {career.matchScore}% khớp
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      {career.reason}
                    </p>

                    <div className="border-t border-slate-200/80 pt-3 space-y-1.5">
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                        Bước tiếp theo gợi ý
                      </p>
                      {career.nextSteps.map((step, sIdx) => (
                        <div
                          key={sIdx}
                          className="flex items-start gap-2 text-xs text-slate-700"
                        >
                          <Lightbulb className="h-3.5 w-3.5 text-amber-500 shrink-0 mt-0.5" />
                          <span>{step}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {onGenerateRoadmapForOption && (
                    <button
                      type="button"
                      disabled={isBusy}
                      onClick={() =>
                        onGenerateRoadmapForOption({
                          optionKey,
                          targetDirection: `${career.title}${career.industry ? ` (${career.industry})` : ""}`,
                          notes: [
                            career.reason ? `Lý do phù hợp: ${career.reason}` : "",
                            career.nextSteps?.length
                              ? `Bước tiếp theo ưu tiên: ${career.nextSteps.join("; ")}`
                              : "",
                          ]
                            .filter(Boolean)
                            .join(". "),
                        })
                      }
                      className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white hover:bg-blue-700 shadow-2xs transition-colors cursor-pointer disabled:opacity-55 disabled:cursor-not-allowed"
                    >
                      {isGeneratingThis ? (
                        <>
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          Đang AI tạo lộ trình...
                        </>
                      ) : (
                        <>
                          <MapIcon className="h-3.5 w-3.5" />
                          Tạo lộ trình
                        </>
                      )}
                    </button>
                  )}
                </div>
              );
            })}

            {customCareers.map((item) => {
              const optionKey = `custom-${item.id}`;
              const isGeneratingThis = generatingOptionKey === optionKey;
              const isRemovingThis = removingCustomCareerId === item.id;
              return (
                <div
                  key={optionKey}
                  className="rounded-2xl border border-indigo-200 bg-indigo-50/35 p-5 space-y-4 flex flex-col justify-between"
                >
                  <div className="space-y-2.5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1">
                        <span className="inline-flex items-center gap-1 rounded-full bg-indigo-100 px-2.5 py-0.5 text-[10px] font-bold text-indigo-700">
                          <Sparkles className="h-3 w-3" />
                          Định hướng bạn tự thêm
                        </span>
                        <h4 className="text-sm font-bold text-slate-900">
                          {item.title}
                        </h4>
                      </div>
                      {onRemoveCustomCareer && (
                        <button
                          type="button"
                          disabled={isBusy}
                          onClick={() => onRemoveCustomCareer(item.id)}
                          aria-label={`Xóa ${item.title}`}
                          className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 cursor-pointer disabled:opacity-50"
                        >
                          {isRemovingThis ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </button>
                      )}
                    </div>
                    {item.reason && (
                      <p className="text-xs text-slate-600 leading-relaxed">
                        {item.reason}
                      </p>
                    )}
                  </div>

                  {onGenerateRoadmapForOption && (
                    <button
                      type="button"
                      disabled={isBusy}
                      onClick={() =>
                        onGenerateRoadmapForOption({
                          optionKey,
                          targetDirection: item.title,
                          notes: item.reason || undefined,
                        })
                      }
                      className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-semibold text-white hover:bg-indigo-700 shadow-2xs transition-colors cursor-pointer disabled:opacity-55 disabled:cursor-not-allowed"
                    >
                      {isGeneratingThis ? (
                        <>
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          Đang AI tạo lộ trình...
                        </>
                      ) : (
                        <>
                          <MapIcon className="h-3.5 w-3.5" />
                          Tạo lộ trình
                        </>
                      )}
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          {(onAddCustomCareer || onGenerateRoadmapForOption) && (
            <div className="rounded-2xl border border-dashed border-indigo-200 bg-slate-50/70 p-4 sm:p-5 space-y-3">
              <div>
                <h4 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                  <Plus className="h-4 w-4 text-indigo-600" />
                  Thêm định hướng nghề nghiệp bạn muốn hướng tới
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Chưa thấy đúng vai trò bạn mong muốn? Nhập định hướng riêng để lưu vào danh sách và để Gemini AI tạo lộ trình 4 năm cho riêng bạn.
                </p>
              </div>

              {customError && (
                <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
                  {customError}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <input
                  type="text"
                  maxLength={180}
                  disabled={isBusy}
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  placeholder="VD: EdTech Product Manager / Giảng viên ứng dụng AI"
                  className="rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
                <input
                  type="text"
                  maxLength={500}
                  disabled={isBusy}
                  value={customReason}
                  onChange={(e) => setCustomReason(e.target.value)}
                  placeholder="Ghi chú thêm cho AI (VD: Kết hợp Ngôn ngữ Anh với UX/AI)..."
                  className="rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                {onAddCustomCareer && (
                  <button
                    type="button"
                    disabled={isBusy || customTitle.trim().length < 2}
                    onClick={() => handleCreateCustom(false)}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-indigo-200 bg-white px-4 py-2 text-xs font-semibold text-indigo-700 hover:bg-indigo-50 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {addingCustomCareer && !generatingOptionKey ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Plus className="h-3.5 w-3.5" />
                    )}
                    Thêm vào danh sách
                  </button>
                )}

                {onGenerateRoadmapForOption && (
                  <button
                    type="button"
                    disabled={isBusy || customTitle.trim().length < 2}
                    onClick={() => handleCreateCustom(true)}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:opacity-95 shadow-2xs cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {generatingOptionKey?.startsWith("custom-") &&
                    addingCustomCareer ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Sparkles className="h-3.5 w-3.5" />
                    )}
                    Thêm &amp; Tạo lộ trình AI ngay
                  </button>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 5. Learning & Skills Recommendations */}
      <Card className="rounded-3xl border-slate-200/90 bg-white shadow-xs">
        <CardHeader className="pb-3">
          <CardTitle className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-emerald-600" />
            Kỹ năng & Chứng chỉ Khuyến nghị Học tập
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-2.5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Kỹ năng chuyên môn (Hard Skills)
              </h4>
              {result.learningRecommendations.hardSkills.map((sk, idx) => (
                <div
                  key={idx}
                  className="rounded-xl border border-slate-200 p-3 space-y-1"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-slate-900">
                      {sk.name}
                    </span>
                    <span
                      className={cn(
                        "rounded-md px-2 py-0.5 text-[10px] font-bold border",
                        sk.priority === "HIGH"
                          ? "bg-rose-50 text-rose-700 border-rose-200"
                          : "bg-amber-50 text-amber-700 border-amber-200"
                      )}
                    >
                      {sk.priority === "HIGH" ? "Ưu tiên cao" : "Trung bình"}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600">{sk.reason}</p>
                </div>
              ))}
            </div>

            <div className="space-y-2.5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Kỹ năng mềm (Soft Skills)
              </h4>
              {result.learningRecommendations.softSkills.map((sk, idx) => (
                <div
                  key={idx}
                  className="rounded-xl border border-slate-200 p-3 space-y-1"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-slate-900">
                      {sk.name}
                    </span>
                    <span
                      className={cn(
                        "rounded-md px-2 py-0.5 text-[10px] font-bold border",
                        sk.priority === "HIGH"
                          ? "bg-rose-50 text-rose-700 border-rose-200"
                          : "bg-amber-50 text-amber-700 border-amber-200"
                      )}
                    >
                      {sk.priority === "HIGH" ? "Ưu tiên cao" : "Trung bình"}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600">{sk.reason}</p>
                </div>
              ))}
            </div>
          </div>

          {result.learningRecommendations.certificatesOrCourses.length > 0 && (
            <div className="border-t border-slate-100 pt-4 space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <Award className="h-3.5 w-3.5 text-amber-600" />
                Chứng chỉ & Khóa học gợi ý
              </h4>
              <div className="flex flex-wrap gap-2">
                {result.learningRecommendations.certificatesOrCourses.map(
                  (cert, idx) => (
                    <span
                      key={idx}
                      className="rounded-xl bg-amber-50/80 border border-amber-200 px-3 py-1.5 text-xs font-semibold text-amber-900"
                    >
                      {cert}
                    </span>
                  )
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

