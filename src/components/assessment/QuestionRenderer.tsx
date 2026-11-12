"use client";

import { useRef, useState } from "react";
import { CheckCircle2, Circle, PenLine, Plus, Sparkles, X } from "lucide-react";
import { ASSESSMENT_QUESTION_TYPES } from "@/constants";
import { cn } from "@/lib/utils";
import type { AssessmentAnswerValue, IAssessmentQuestionDTO } from "@/types";

interface QuestionRendererProps {
  question: IAssessmentQuestionDTO;
  questionNumber: number;
  totalQuestions: number;
  value: AssessmentAnswerValue | undefined;
  onChange: (value: AssessmentAnswerValue) => void;
  errorMessage?: string;
  disabled?: boolean;
  showConditionBadge?: boolean;
}

export function QuestionRenderer({
  question,
  questionNumber,
  totalQuestions,
  value,
  onChange,
  errorMessage,
  disabled = false,
  showConditionBadge = false,
}: QuestionRendererProps) {
  const [singleCustomActive, setSingleCustomActive] = useState(false);
  const [multiCustomDraft, setMultiCustomDraft] = useState("");
  const singleCustomInputRef = useRef<HTMLInputElement | null>(null);

  const isConditional = Boolean(
    question.conditionalLogic?.enabled &&
      question.conditionalLogic.rules.length > 0
  );

  const renderControl = () => {
    switch (question.questionType) {
      case ASSESSMENT_QUESTION_TYPES.SINGLE_CHOICE: {
        const selected = typeof value === "string" ? value : "";
        const presetValues = new Set((question.options || []).map((o) => o.value));
        const customAllowed = question.allowCustomOption !== false;
        const isCustomValue = selected !== "" && !presetValues.has(selected);
        const showCustomBox =
          customAllowed &&
          (isCustomValue || (singleCustomActive && selected === ""));

        return (
          <div className="space-y-2.5">
            {(question.options || []).map((opt, idx) => {
              const isSelected = selected === opt.value;
              return (
                <button
                  key={opt.id || opt.value}
                  type="button"
                  disabled={disabled}
                  onClick={() => {
                    setSingleCustomActive(false);
                    onChange(opt.value);
                  }}
                  className={cn(
                    "w-full flex items-center gap-3.5 rounded-2xl border p-4 text-left transition-all cursor-pointer disabled:cursor-not-allowed",
                    isSelected
                      ? "border-blue-600 bg-blue-50/70 ring-1 ring-blue-600/20 shadow-2xs"
                      : "border-slate-200 bg-white hover:border-blue-300 hover:bg-slate-50/70"
                  )}
                >
                  <span
                    className={cn(
                      "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs font-bold transition-colors",
                      isSelected
                        ? "border-blue-600 bg-blue-600 text-white"
                        : "border-slate-300 bg-slate-50 text-slate-500"
                    )}
                  >
                    {String.fromCharCode(65 + idx)}
                  </span>
                  <span
                    className={cn(
                      "flex-1 text-sm leading-relaxed",
                      isSelected
                        ? "font-semibold text-blue-950"
                        : "font-medium text-slate-700"
                    )}
                  >
                    {opt.label}
                  </span>
                  {isSelected ? (
                    <CheckCircle2 className="h-5 w-5 shrink-0 text-blue-600" />
                  ) : (
                    <Circle className="h-5 w-5 shrink-0 text-slate-300" />
                  )}
                </button>
              );
            })}

            {customAllowed && (
              <div
                className={cn(
                  "rounded-2xl border p-4 transition-all",
                  showCustomBox
                    ? "border-blue-600 bg-blue-50/60 ring-1 ring-blue-600/20"
                    : "border-dashed border-slate-300 bg-slate-50/40 hover:border-blue-300"
                )}
              >
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => {
                    setSingleCustomActive(true);
                    if (presetValues.has(selected)) {
                      onChange("");
                    }
                    setTimeout(() => singleCustomInputRef.current?.focus(), 20);
                  }}
                  className="flex w-full items-center gap-3 text-left cursor-pointer disabled:cursor-not-allowed"
                >
                  <span
                    className={cn(
                      "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs font-bold",
                      showCustomBox
                        ? "border-blue-600 bg-blue-600 text-white"
                        : "border-slate-300 bg-white text-slate-500"
                    )}
                  >
                    <PenLine className="h-3.5 w-3.5" />
                  </span>
                  <span
                    className={cn(
                      "flex-1 text-sm",
                      showCustomBox
                        ? "font-semibold text-blue-950"
                        : "font-medium text-slate-700"
                    )}
                  >
                    Ý kiến khác (tự viết câu trả lời của bạn)
                  </span>
                  {isCustomValue ? (
                    <CheckCircle2 className="h-5 w-5 shrink-0 text-blue-600" />
                  ) : (
                    <Circle className="h-5 w-5 shrink-0 text-slate-300" />
                  )}
                </button>

                {showCustomBox && (
                  <div className="mt-3 pl-9">
                    <input
                      ref={singleCustomInputRef}
                      type="text"
                      disabled={disabled}
                      maxLength={300}
                      value={isCustomValue ? selected : ""}
                      onChange={(e) => onChange(e.target.value)}
                      placeholder="Nhập lựa chọn hoặc định hướng riêng của bạn..."
                      className="w-full rounded-xl border border-blue-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        );
      }

      case ASSESSMENT_QUESTION_TYPES.MULTIPLE_CHOICE: {
        const selectedList = Array.isArray(value) ? value : [];
        const minSel = question.multipleConfig?.minSelect;
        const maxSel = question.multipleConfig?.maxSelect;
        const presetValues = new Set((question.options || []).map((o) => o.value));
        const customEntries = selectedList.filter((v) => !presetValues.has(v));
        const customAllowed = question.allowCustomOption !== false;
        const isAtMaxLimit =
          maxSel !== undefined && selectedList.length >= maxSel;

        const handleToggle = (optVal: string) => {
          if (selectedList.includes(optVal)) {
            onChange(selectedList.filter((v) => v !== optVal));
          } else {
            if (isAtMaxLimit) {
              return;
            }
            onChange([...selectedList, optVal]);
          }
        };

        const handleAddCustomOption = () => {
          const trimmed = multiCustomDraft.trim();
          if (!trimmed || disabled || isAtMaxLimit) return;

          const matchedPreset = (question.options || []).find(
            (o) =>
              o.value.toLowerCase() === trimmed.toLowerCase() ||
              o.label.toLowerCase() === trimmed.toLowerCase()
          );
          const valueToAdd = matchedPreset ? matchedPreset.value : trimmed;

          if (
            selectedList.some(
              (item) => item.toLowerCase() === valueToAdd.toLowerCase()
            )
          ) {
            setMultiCustomDraft("");
            return;
          }

          onChange([...selectedList, valueToAdd]);
          setMultiCustomDraft("");
        };

        return (
          <div className="space-y-3">
            {(minSel !== undefined || maxSel !== undefined) && (
              <div className="flex items-center justify-between text-xs text-slate-500 bg-slate-50 border border-slate-200/70 rounded-xl px-3.5 py-2">
                <span>
                  {minSel !== undefined && maxSel !== undefined
                    ? `Chọn từ ${minSel} đến ${maxSel} phương án`
                    : maxSel !== undefined
                      ? `Chọn tối đa ${maxSel} phương án`
                      : `Chọn tối thiểu ${minSel} phương án`}
                </span>
                <span className="font-semibold text-blue-600">
                  Đã chọn: {selectedList.length}
                  {maxSel !== undefined ? ` / ${maxSel}` : ""}
                </span>
              </div>
            )}

            <div className="space-y-2.5">
              {(question.options || []).map((opt) => {
                const isSelected = selectedList.includes(opt.value);
                const isBlockedByMax = !isSelected && isAtMaxLimit;

                return (
                  <button
                    key={opt.id || opt.value}
                    type="button"
                    disabled={disabled || isBlockedByMax}
                    onClick={() => handleToggle(opt.value)}
                    className={cn(
                      "w-full flex items-center gap-3.5 rounded-2xl border p-4 text-left transition-all cursor-pointer disabled:opacity-55 disabled:cursor-not-allowed",
                      isSelected
                        ? "border-indigo-600 bg-indigo-50/70 ring-1 ring-indigo-600/20 shadow-2xs"
                        : "border-slate-200 bg-white hover:border-indigo-300 hover:bg-slate-50/70"
                    )}
                  >
                    <span
                      className={cn(
                        "flex h-5 w-5 shrink-0 items-center justify-center rounded-md border text-[11px] font-bold transition-colors",
                        isSelected
                          ? "border-indigo-600 bg-indigo-600 text-white"
                          : "border-slate-300 bg-white"
                      )}
                    >
                      {isSelected ? "✓" : ""}
                    </span>
                    <span
                      className={cn(
                        "flex-1 text-sm leading-relaxed",
                        isSelected
                          ? "font-semibold text-indigo-950"
                          : "font-medium text-slate-700"
                      )}
                    >
                      {opt.label}
                    </span>
                  </button>
                );
              })}
            </div>

            {customAllowed && (
              <div className="rounded-2xl border border-dashed border-indigo-200 bg-indigo-50/30 p-4 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-900">
                    <PenLine className="h-3.5 w-3.5 text-indigo-600" />
                    Thêm câu trả lời tự viết của bạn (nếu chưa có ở trên)
                  </span>
                  {customEntries.length > 0 && (
                    <span className="text-[11px] font-semibold text-indigo-600">
                      {customEntries.length} ý kiến đã thêm
                    </span>
                  )}
                </div>

                {customEntries.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {customEntries.map((entry) => (
                      <span
                        key={entry}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-indigo-300 bg-white px-3 py-1.5 text-xs font-semibold text-indigo-950 shadow-2xs"
                      >
                        <span className="rounded bg-indigo-100 px-1.5 py-0.5 text-[10px] font-bold text-indigo-700">
                          Tự nhập
                        </span>
                        <span>{entry}</span>
                        <button
                          type="button"
                          disabled={disabled}
                          onClick={() => handleToggle(entry)}
                          aria-label={`Xóa "${entry}"`}
                          className="ml-0.5 rounded-full p-0.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 cursor-pointer"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}

                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    disabled={disabled || isAtMaxLimit}
                    maxLength={300}
                    value={multiCustomDraft}
                    onChange={(e) => setMultiCustomDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddCustomOption();
                      }
                    }}
                    placeholder={
                      isAtMaxLimit
                        ? "Đã đạt số lượng lựa chọn tối đa"
                        : "Nhập thêm sở thích, kỹ năng hoặc định hướng khác..."
                    }
                    className="flex-1 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 disabled:bg-slate-100 disabled:text-slate-400"
                  />
                  <button
                    type="button"
                    disabled={
                      disabled || isAtMaxLimit || !multiCustomDraft.trim()
                    }
                    onClick={handleAddCustomOption}
                    className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-semibold text-white hover:bg-indigo-700 disabled:opacity-45 cursor-pointer disabled:cursor-not-allowed shrink-0"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Thêm vào lựa chọn
                  </button>
                </div>
              </div>
            )}
          </div>
        );
      }

      case ASSESSMENT_QUESTION_TYPES.SCALE: {
        const min = question.scaleConfig?.min ?? 1;
        const max = question.scaleConfig?.max ?? 5;
        const step = Math.max(1, question.scaleConfig?.step ?? 1);
        const minLabel = question.scaleConfig?.minLabel || "Thấp";
        const maxLabel = question.scaleConfig?.maxLabel || "Cao";

        const points: number[] = [];
        for (let p = min; p <= max; p += step) {
          points.push(p);
        }

        const currentNum =
          typeof value === "number"
            ? value
            : typeof value === "string" && value.trim() !== ""
              ? Number(value)
              : null;

        return (
          <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-5 space-y-4">
            <div className="grid grid-cols-5 sm:flex sm:items-center sm:justify-between gap-2.5">
              {points.map((pt) => {
                const isSelected = currentNum === pt;
                return (
                  <button
                    key={pt}
                    type="button"
                    disabled={disabled}
                    onClick={() => onChange(pt)}
                    className={cn(
                      "flex-1 h-12 rounded-xl border text-base font-bold transition-all cursor-pointer disabled:cursor-not-allowed",
                      isSelected
                        ? "border-blue-600 bg-blue-600 text-white shadow-sm shadow-blue-500/25 scale-[1.03]"
                        : "border-slate-200 bg-white text-slate-700 hover:border-blue-300 hover:bg-blue-50/40"
                    )}
                  >
                    {pt}
                  </button>
                );
              })}
            </div>
            <div className="flex items-center justify-between gap-4 text-xs text-slate-500 pt-1">
              <span className="font-medium text-left">
                {min}: {minLabel}
              </span>
              <span className="font-medium text-right">
                {max}: {maxLabel}
              </span>
            </div>
          </div>
        );
      }

      case ASSESSMENT_QUESTION_TYPES.TEXT: {
        const strVal = typeof value === "string" ? value : "";
        const maxLen = question.textConfig?.maxLength ?? 1000;
        const placeholder =
          question.textConfig?.placeholder || "Nhập câu trả lời của bạn...";
        const multiline = question.textConfig?.multiline !== false;

        return (
          <div className="space-y-2">
            {multiline ? (
              <textarea
                rows={4}
                disabled={disabled}
                maxLength={maxLen}
                value={strVal}
                placeholder={placeholder}
                onChange={(e) => onChange(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-800 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:opacity-60"
              />
            ) : (
              <input
                type="text"
                disabled={disabled}
                maxLength={maxLen}
                value={strVal}
                placeholder={placeholder}
                onChange={(e) => onChange(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:opacity-60"
              />
            )}
            <div className="flex items-center justify-between text-[11px] text-slate-400 px-1">
              <span>{multiline ? "Có thể trình bày nhiều dòng" : "Câu trả lời ngắn"}</span>
              <span
                className={cn(
                  "font-medium tabular-nums",
                  strVal.length >= maxLen * 0.9 ? "text-amber-600" : "text-slate-400"
                )}
              >
                {strVal.length} / {maxLen} ký tự
              </span>
            </div>
          </div>
        );
      }
    }
  };

  return (
    <div
      className={cn(
        "rounded-3xl border bg-white p-6 sm:p-7 shadow-xs transition-all space-y-5",
        errorMessage ? "border-red-300 ring-1 ring-red-200" : "border-slate-200/90"
      )}
    >
      <div className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-700">
              Câu {questionNumber} / {totalQuestions}
            </span>
            {question.isRequired ? (
              <span className="inline-flex items-center rounded-lg bg-rose-50 border border-rose-200/80 px-2 py-0.5 text-[11px] font-semibold text-rose-700">
                Bắt buộc
              </span>
            ) : (
              <span className="inline-flex items-center rounded-lg bg-slate-50 border border-slate-200 px-2 py-0.5 text-[11px] font-medium text-slate-500">
                Tùy chọn
              </span>
            )}
            {showConditionBadge && isConditional && (
              <span className="inline-flex items-center gap-1 rounded-lg bg-purple-50 border border-purple-200 px-2 py-0.5 text-[11px] font-semibold text-purple-700">
                <Sparkles className="h-3 w-3" /> Câu hỏi rẽ nhánh
              </span>
            )}
          </div>
          <span className="text-[11px] font-mono text-slate-400">{question.code}</span>
        </div>

        <h3 className="text-base sm:text-lg font-bold text-slate-900 leading-snug">
          {question.questionText}
        </h3>
        {question.description && (
          <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
            {question.description}
          </p>
        )}
      </div>

      {renderControl()}

      {errorMessage && (
        <p className="text-xs font-medium text-red-600 bg-red-50 border border-red-200 rounded-xl px-3.5 py-2">
          {errorMessage}
        </p>
      )}
    </div>
  );
}

