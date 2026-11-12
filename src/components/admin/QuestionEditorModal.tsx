"use client";

import { useMemo, useState } from "react";
import {
  AlertCircle,
  Loader2,
  Plus,
  Save,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import { fetchWithAuth } from "@/components/providers/AuthProvider";
import {
  ASSESSMENT_QUESTION_TYPES,
  AssessmentQuestionType,
  CONDITION_MATCH_TYPES,
  CONDITION_OPERATORS,
  ConditionMatchType,
  ConditionOperator,
} from "@/constants";
import type {
  IAssessmentQuestionDTO,
  IConditionRuleDTO,
  IQuestionOptionDTO,
} from "@/types";

interface QuestionEditorModalProps {
  open: boolean;
  mode: "create" | "edit";
  questionnaireId: string;
  existingQuestions: IAssessmentQuestionDTO[];
  question?: IAssessmentQuestionDTO | null;
  onClose: () => void;
  onSaved: (question: IAssessmentQuestionDTO) => void;
}

const QUESTION_TYPE_LABELS: Record<AssessmentQuestionType, string> = {
  SINGLE_CHOICE: "Chọn một đáp án (Single Choice)",
  MULTIPLE_CHOICE: "Chọn nhiều đáp án (Multiple Choice)",
  SCALE: "Thang điểm mức độ (Scale)",
  TEXT: "Tự luận ngắn / dài (Text)",
};

const OPERATOR_LABELS: Record<ConditionOperator, string> = {
  EQUALS: "Bằng (=)",
  NOT_EQUALS: "Khác (!=)",
  CONTAINS: "Chứa giá trị",
  GREATER_THAN: "Lớn hơn (>)",
  LESS_THAN: "Nhỏ hơn (<)",
};

function slugifyOptionValue(input: string, fallbackIndex: number): string {
  const ascii = input
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
  return ascii || `OPT_${fallbackIndex}`;
}

export function QuestionEditorModal(props: QuestionEditorModalProps) {
  if (!props.open) return null;
  const modalKey = `${props.mode}-${props.question?._id ?? "new"}-${props.existingQuestions.length}`;
  return <QuestionEditorModalInner key={modalKey} {...props} />;
}

function QuestionEditorModalInner({
  mode,
  questionnaireId,
  existingQuestions,
  question,
  onClose,
  onSaved,
}: QuestionEditorModalProps) {
  const isEdit = mode === "edit" && Boolean(question);
  const nextNum = existingQuestions.length + 1;

  const [code, setCode] = useState(
    isEdit && question ? question.code : `Q${nextNum}`
  );
  const [questionText, setQuestionText] = useState(
    isEdit && question ? question.questionText : ""
  );
  const [description, setDescription] = useState(
    isEdit && question ? question.description || "" : ""
  );
  const [questionType, setQuestionType] = useState<AssessmentQuestionType>(
    isEdit && question
      ? question.questionType
      : ASSESSMENT_QUESTION_TYPES.SINGLE_CHOICE
  );
  const [isRequired, setIsRequired] = useState(
    isEdit && question ? question.isRequired : true
  );
  const [allowCustomOption, setAllowCustomOption] = useState(
    isEdit && question ? question.allowCustomOption !== false : true
  );

  const [options, setOptions] = useState<IQuestionOptionDTO[]>(() => {
    if (isEdit && question) {
      return question.options?.length
        ? question.options.map((o, idx) => ({ ...o, order: idx + 1 }))
        : [
            { id: "opt_1", label: "Phương án 1", value: "OPT_1", order: 1 },
            { id: "opt_2", label: "Phương án 2", value: "OPT_2", order: 2 },
          ];
    }
    return [
      { id: "opt_1", label: "Phương án A", value: "OPTION_A", order: 1 },
      { id: "opt_2", label: "Phương án B", value: "OPTION_B", order: 2 },
    ];
  });
  const [minSelect, setMinSelect] = useState<string>(
    isEdit && question?.multipleConfig?.minSelect !== undefined
      ? String(question.multipleConfig.minSelect)
      : ""
  );
  const [maxSelect, setMaxSelect] = useState<string>(
    isEdit && question?.multipleConfig?.maxSelect !== undefined
      ? String(question.multipleConfig.maxSelect)
      : ""
  );

  const [scaleMin, setScaleMin] = useState(
    isEdit && question ? question.scaleConfig?.min ?? 1 : 1
  );
  const [scaleMax, setScaleMax] = useState(
    isEdit && question ? question.scaleConfig?.max ?? 5 : 5
  );
  const [scaleStep, setScaleStep] = useState(
    isEdit && question ? question.scaleConfig?.step ?? 1 : 1
  );
  const [scaleMinLabel, setScaleMinLabel] = useState(
    isEdit && question
      ? question.scaleConfig?.minLabel ?? "Hoàn toàn không đồng ý"
      : "Hoàn toàn không tự tin"
  );
  const [scaleMaxLabel, setScaleMaxLabel] = useState(
    isEdit && question
      ? question.scaleConfig?.maxLabel ?? "Rất đồng ý"
      : "Rất tự tin"
  );

  const [textPlaceholder, setTextPlaceholder] = useState(
    isEdit && question
      ? question.textConfig?.placeholder ?? "Nhập câu trả lời của bạn..."
      : "Chia sẻ thêm mục tiêu hoặc bối cảnh cá nhân của bạn..."
  );
  const [textMaxLength, setTextMaxLength] = useState(
    isEdit && question ? question.textConfig?.maxLength ?? 1000 : 1000
  );
  const [textMultiline, setTextMultiline] = useState(
    isEdit && question ? question.textConfig?.multiline ?? true : true
  );

  const [condEnabled, setCondEnabled] = useState(
    isEdit && question ? Boolean(question.conditionalLogic?.enabled) : false
  );
  const [condMatchType, setCondMatchType] = useState<ConditionMatchType>(
    isEdit && question
      ? question.conditionalLogic?.matchType || CONDITION_MATCH_TYPES.ALL
      : CONDITION_MATCH_TYPES.ALL
  );
  const [condRules, setCondRules] = useState<IConditionRuleDTO[]>(
    isEdit && question ? question.conditionalLogic?.rules || [] : []
  );

  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const targetOrder = useMemo(() => {
    if (mode === "edit" && question) return question.order;
    const maxOrder = existingQuestions.reduce(
      (max, q) => Math.max(max, q.order),
      0
    );
    return maxOrder + 1;
  }, [mode, question, existingQuestions]);

  // Chỉ cho phép tham chiếu tới các câu hỏi đứng trước (PA24)
  const precedingQuestions = useMemo(
    () =>
      existingQuestions
        .filter((q) => q._id !== question?._id && q.order < targetOrder)
        .sort((a, b) => a.order - b.order),
    [existingQuestions, question, targetOrder]
  );

  const isChoice =
    questionType === ASSESSMENT_QUESTION_TYPES.SINGLE_CHOICE ||
    questionType === ASSESSMENT_QUESTION_TYPES.MULTIPLE_CHOICE;

  const handleAddOption = () => {
    const idx = options.length + 1;
    setOptions((prev) => [
      ...prev,
      {
        id: `opt_${Date.now()}_${idx}`,
        label: `Phương án ${idx}`,
        value: `OPTION_${idx}`,
        order: idx,
      },
    ]);
  };

  const handleUpdateOption = (
    index: number,
    field: "label" | "value",
    val: string
  ) => {
    setOptions((prev) =>
      prev.map((opt, idx) => {
        if (idx !== index) return opt;
        if (field === "label") {
          const prevAuto = slugifyOptionValue(opt.label, idx + 1);
          const shouldAutoSyncValue =
            mode === "create" &&
            (opt.value === prevAuto || opt.value.startsWith("OPTION_"));
          return {
            ...opt,
            label: val,
            value: shouldAutoSyncValue
              ? slugifyOptionValue(val, idx + 1)
              : opt.value,
          };
        }
        return { ...opt, value: val };
      })
    );
  };

  const handleRemoveOption = (index: number) => {
    if (options.length <= 2) {
      setErrorMsg("Câu hỏi lựa chọn bắt buộc phải có ít nhất 2 phương án.");
      return;
    }
    setOptions((prev) =>
      prev
        .filter((_, idx) => idx !== index)
        .map((opt, idx) => ({ ...opt, order: idx + 1 }))
    );
  };

  const handleAddConditionRule = () => {
    const firstSource = precedingQuestions[0];
    if (!firstSource) return;
    const defaultVal =
      firstSource.options?.[0]?.value ??
      (firstSource.questionType === ASSESSMENT_QUESTION_TYPES.SCALE ? 3 : "");
    setCondRules((prev) => [
      ...prev,
      {
        sourceQuestionId: firstSource._id,
        operator:
          firstSource.questionType === ASSESSMENT_QUESTION_TYPES.MULTIPLE_CHOICE
            ? CONDITION_OPERATORS.CONTAINS
            : firstSource.questionType === ASSESSMENT_QUESTION_TYPES.SCALE
              ? CONDITION_OPERATORS.GREATER_THAN
              : CONDITION_OPERATORS.EQUALS,
        value: defaultVal,
      },
    ]);
  };

  const handleUpdateRule = (
    index: number,
    patch: Partial<IConditionRuleDTO>
  ) => {
    setCondRules((prev) =>
      prev.map((rule, idx) => {
        if (idx !== index) return rule;
        const next = { ...rule, ...patch };
        if (patch.sourceQuestionId) {
          const src = precedingQuestions.find(
            (q) => q._id === patch.sourceQuestionId
          );
          if (src) {
            if (src.options && src.options.length > 0) {
              next.value = src.options[0].value;
              next.operator =
                src.questionType === ASSESSMENT_QUESTION_TYPES.MULTIPLE_CHOICE
                  ? CONDITION_OPERATORS.CONTAINS
                  : CONDITION_OPERATORS.EQUALS;
            } else if (src.questionType === ASSESSMENT_QUESTION_TYPES.SCALE) {
              next.value = src.scaleConfig?.min ?? 3;
              next.operator = CONDITION_OPERATORS.GREATER_THAN;
            } else {
              next.value = "";
            }
          }
        }
        return next;
      })
    );
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (isChoice && options.length < 2) {
      setErrorMsg("Câu hỏi lựa chọn phải có ít nhất 2 phương án trả lời.");
      return;
    }

    if (isChoice) {
      const seenValues = new Set<string>();
      for (const opt of options) {
        if (!opt.label.trim() || !opt.value.trim()) {
          setErrorMsg("Tên hiển thị và mã giá trị của phương án không được để trống.");
          return;
        }
        if (seenValues.has(opt.value.trim())) {
          setErrorMsg(
            `Mã giá trị phương án "${opt.value}" đang bị trùng lặp trong cùng câu hỏi.`
          );
          return;
        }
        seenValues.add(opt.value.trim());
      }
    }

    if (questionType === ASSESSMENT_QUESTION_TYPES.SCALE && scaleMin >= scaleMax) {
      setErrorMsg("Giá trị nhỏ nhất của thang điểm phải nhỏ hơn giá trị lớn nhất.");
      return;
    }

    if (condEnabled && condRules.length === 0) {
      setErrorMsg("Khi bật điều kiện hiển thị, cần thêm ít nhất 1 quy tắc điều kiện.");
      return;
    }

    const payload: Record<string, unknown> = {
      code: code.trim(),
      questionText: questionText.trim(),
      description: description.trim(),
      questionType,
      isRequired,
      allowCustomOption: isChoice ? allowCustomOption : false,
      order: targetOrder,
      options: isChoice
        ? options.map((opt, idx) => ({
            id: opt.id.trim() || `opt_${idx + 1}`,
            label: opt.label.trim(),
            value: opt.value.trim(),
            order: idx + 1,
          }))
        : [],
      conditionalLogic: condEnabled
        ? {
            enabled: true,
            matchType: condMatchType,
            rules: condRules.map((rule) => {
              const srcQ = precedingQuestions.find(
                (q) => q._id === rule.sourceQuestionId
              );
              const isScaleSrc =
                srcQ?.questionType === ASSESSMENT_QUESTION_TYPES.SCALE;
              return {
                sourceQuestionId: rule.sourceQuestionId,
                operator: rule.operator,
                value: isScaleSrc ? Number(rule.value) : String(rule.value),
              };
            }),
          }
        : null,
    };

    if (questionType === ASSESSMENT_QUESTION_TYPES.MULTIPLE_CHOICE) {
      const mc: { minSelect?: number; maxSelect?: number } = {};
      if (minSelect !== "") mc.minSelect = Number(minSelect);
      if (maxSelect !== "") mc.maxSelect = Number(maxSelect);
      payload.multipleConfig = mc;
    }

    if (questionType === ASSESSMENT_QUESTION_TYPES.SCALE) {
      payload.scaleConfig = {
        min: Number(scaleMin),
        max: Number(scaleMax),
        step: Number(scaleStep) || 1,
        minLabel: scaleMinLabel.trim(),
        maxLabel: scaleMaxLabel.trim(),
      };
    }

    if (questionType === ASSESSMENT_QUESTION_TYPES.TEXT) {
      payload.textConfig = {
        placeholder: textPlaceholder.trim(),
        maxLength: Number(textMaxLength) || 1000,
        multiline: textMultiline,
      };
    }

    setSaving(true);
    try {
      const endpoint =
        mode === "create"
          ? `/api/admin/questionnaires/${questionnaireId}/questions`
          : `/api/admin/questions/${question?._id}`;
      const method = mode === "create" ? "POST" : "PATCH";

      const res = await fetchWithAuth(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok || !data.question) {
        setErrorMsg(data.error || "Không thể lưu câu hỏi.");
        return;
      }
      onSaved(data.question);
    } catch {
      setErrorMsg("Lỗi kết nối máy chủ khi lưu câu hỏi.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-label={mode === "create" ? "Thêm câu hỏi mới" : "Chỉnh sửa câu hỏi"}
    >
      <div className="flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              {mode === "create"
                ? `Thêm câu hỏi mới (Vị trí #${targetOrder})`
                : `Chỉnh sửa câu hỏi ${question?.code || ""}`}
            </h2>
            <p className="text-xs text-slate-500">
              Hỗ trợ 4 định dạng câu hỏi và điều kiện phân nhánh phụ thuộc vào
              các câu hỏi đứng trước.
            </p>
          </div>
          <button
            type="button"
            disabled={saving}
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form
          onSubmit={handleSave}
          className="flex-1 space-y-5 overflow-y-auto px-6 py-5"
        >
          {errorMsg && (
            <div className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-12">
            <div className="sm:col-span-4">
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-600">
                Mã câu hỏi <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="VD: Q1_ORIENTATION"
                maxLength={60}
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 font-mono text-sm text-slate-900 outline-hidden focus:border-[#102C8A]"
                required
              />
            </div>

            <div className="sm:col-span-5">
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-600">
                Loại câu hỏi
              </label>
              <select
                value={questionType}
                onChange={(e) =>
                  setQuestionType(e.target.value as AssessmentQuestionType)
                }
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-hidden focus:border-[#102C8A]"
              >
                {Object.entries(QUESTION_TYPE_LABELS).map(([k, label]) => (
                  <option key={k} value={k}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-end pb-1 sm:col-span-3">
              <label className="flex w-full cursor-pointer items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-medium text-slate-800">
                <input
                  type="checkbox"
                  checked={isRequired}
                  onChange={(e) => setIsRequired(e.target.checked)}
                  className="h-4 w-4 rounded accent-[#102C8A]"
                />
                Bắt buộc trả lời
              </label>
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-semibold text-slate-800">
              Nội dung câu hỏi <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={questionText}
              onChange={(e) => setQuestionText(e.target.value)}
              placeholder="Ví dụ: Mục tiêu định hướng chính của bạn trong 1–2 năm tới là gì?"
              maxLength={500}
              className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 outline-hidden focus:border-[#102C8A]"
              required
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              Gợi ý / Mô tả phụ (hiển thị dưới câu hỏi)
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Giải thích ngắn giúp sinh viên trả lời chính xác hơn..."
              maxLength={500}
              className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm text-slate-900 outline-hidden focus:border-[#102C8A]"
            />
          </div>

          {/* Choice Options Builder (PA20, PA21) */}
          {isChoice && (
            <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Danh sách phương án trả lời (tối thiểu 2)
                  </h3>
                  <p className="text-xs text-slate-500">
                    Giá trị mã (Value) được dùng để đánh giá điều kiện nhánh và
                    gửi cho Gemini AI.
                  </p>
                </div>
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700">
                  <input
                    type="checkbox"
                    checked={allowCustomOption}
                    onChange={(e) => setAllowCustomOption(e.target.checked)}
                    className="h-3.5 w-3.5 rounded accent-[#102C8A]"
                  />
                  Cho phép SV tự nhập ý kiến khác
                </label>
                <button
                  type="button"
                  onClick={handleAddOption}
                  className="inline-flex items-center gap-1 rounded-xl bg-white px-3 py-1.5 text-xs font-semibold text-[#102C8A] shadow-2xs ring-1 ring-slate-200 hover:bg-blue-50"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Thêm phương án
                </button>
              </div>

              <div className="space-y-2">
                {options.map((opt, idx) => (
                  <div
                    key={opt.id}
                    className="grid grid-cols-1 gap-2 rounded-xl border border-slate-200 bg-white p-2.5 sm:grid-cols-12 sm:items-center"
                  >
                    <div className="sm:col-span-7">
                      <input
                        type="text"
                        value={opt.label}
                        onChange={(e) =>
                          handleUpdateOption(idx, "label", e.target.value)
                        }
                        placeholder="Nhãn hiển thị cho sinh viên"
                        className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-900 outline-hidden focus:border-[#102C8A]"
                      />
                    </div>
                    <div className="sm:col-span-4">
                      <input
                        type="text"
                        value={opt.value}
                        onChange={(e) =>
                          handleUpdateOption(idx, "value", e.target.value)
                        }
                        placeholder="Mã giá trị (VD: DI_LAM)"
                        className="w-full rounded-lg border border-slate-200 px-2.5 py-1.5 font-mono text-xs text-slate-700 outline-hidden focus:border-[#102C8A]"
                      />
                    </div>
                    <div className="flex justify-end sm:col-span-1">
                      <button
                        type="button"
                        disabled={options.length <= 2}
                        onClick={() => handleRemoveOption(idx)}
                        title="Xóa phương án"
                        className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 disabled:opacity-35"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {questionType === ASSESSMENT_QUESTION_TYPES.MULTIPLE_CHOICE && (
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-slate-600">
                      Số lựa chọn tối thiểu (tùy chọn)
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={20}
                      value={minSelect}
                      onChange={(e) => setMinSelect(e.target.value)}
                      placeholder="VD: 1"
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-slate-600">
                      Số lựa chọn tối đa (tùy chọn)
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={20}
                      value={maxSelect}
                      onChange={(e) => setMaxSelect(e.target.value)}
                      placeholder="VD: 3"
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Scale Config */}
          {questionType === ASSESSMENT_QUESTION_TYPES.SCALE && (
            <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
              <h3 className="text-sm font-bold text-slate-900">
                Cấu hình thang điểm (Scale)
              </h3>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-600">
                    Mức nhỏ nhất
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={9}
                    value={scaleMin}
                    onChange={(e) => setScaleMin(Number(e.target.value))}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-600">
                    Mức lớn nhất
                  </label>
                  <input
                    type="number"
                    min={2}
                    max={10}
                    value={scaleMax}
                    onChange={(e) => setScaleMax(Number(e.target.value))}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-600">
                    Bước nhảy
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={5}
                    value={scaleStep}
                    onChange={(e) => setScaleStep(Number(e.target.value))}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-600">
                    Nhãn mức thấp nhất
                  </label>
                  <input
                    type="text"
                    value={scaleMinLabel}
                    onChange={(e) => setScaleMinLabel(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-600">
                    Nhãn mức cao nhất
                  </label>
                  <input
                    type="text"
                    value={scaleMaxLabel}
                    onChange={(e) => setScaleMaxLabel(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Text Config */}
          {questionType === ASSESSMENT_QUESTION_TYPES.TEXT && (
            <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
              <h3 className="text-sm font-bold text-slate-900">
                Cấu hình câu trả lời văn bản (Text)
              </h3>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-12">
                <div className="sm:col-span-8">
                  <label className="mb-1 block text-xs font-medium text-slate-600">
                    Placeholder gợi ý
                  </label>
                  <input
                    type="text"
                    value={textPlaceholder}
                    onChange={(e) => setTextPlaceholder(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm"
                  />
                </div>
                <div className="sm:col-span-4">
                  <label className="mb-1 block text-xs font-medium text-slate-600">
                    Giới hạn ký tự tối đa
                  </label>
                  <input
                    type="number"
                    min={20}
                    max={3000}
                    value={textMaxLength}
                    onChange={(e) => setTextMaxLength(Number(e.target.value))}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm"
                  />
                </div>
              </div>
              <label className="inline-flex cursor-pointer items-center gap-2 text-xs font-medium text-slate-700">
                <input
                  type="checkbox"
                  checked={textMultiline}
                  onChange={(e) => setTextMultiline(e.target.checked)}
                  className="h-4 w-4 rounded accent-[#102C8A]"
                />
                Cho phép nhập nhiều dòng (Textarea)
              </label>
            </div>
          )}

          {/* Conditional Logic Builder (PA24) */}
          <div className="space-y-3 rounded-2xl border border-indigo-200/80 bg-indigo-50/40 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="flex items-center gap-1.5 text-sm font-bold text-slate-900">
                  <Sparkles className="h-4 w-4 text-[#102C8A]" />
                  Điều kiện hiển thị phân nhánh (Conditional Logic)
                </h3>
                <p className="text-xs text-slate-600">
                  Chỉ hiển thị câu hỏi này nếu câu trả lời ở các câu hỏi đứng
                  trước thỏa mãn quy tắc.
                </p>
              </div>
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-800">
                <input
                  type="checkbox"
                  disabled={precedingQuestions.length === 0}
                  checked={condEnabled}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    setCondEnabled(checked);
                    if (checked && condRules.length === 0) {
                      handleAddConditionRule();
                    }
                  }}
                  className="h-4 w-4 rounded accent-[#102C8A]"
                />
                Bật điều kiện
              </label>
            </div>

            {precedingQuestions.length === 0 ? (
              <p className="text-xs italic text-slate-500">
                Câu hỏi ở vị trí #1 không có câu hỏi nào đứng trước để tạo điều
                kiện phụ thuộc.
              </p>
            ) : condEnabled ? (
              <div className="space-y-3 pt-1">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-xs">
                    <span className="font-medium text-slate-700">
                      Hiển thị khi thỏa mãn:
                    </span>
                    <select
                      value={condMatchType}
                      onChange={(e) =>
                        setCondMatchType(e.target.value as ConditionMatchType)
                      }
                      className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-800"
                    >
                      <option value={CONDITION_MATCH_TYPES.ALL}>
                        Tất cả điều kiện (AND)
                      </option>
                      <option value={CONDITION_MATCH_TYPES.ANY}>
                        Ít nhất 1 điều kiện (OR)
                      </option>
                    </select>
                  </div>

                  <button
                    type="button"
                    onClick={handleAddConditionRule}
                    className="inline-flex items-center gap-1 rounded-lg bg-white px-2.5 py-1.5 text-xs font-semibold text-[#102C8A] ring-1 ring-slate-200 hover:bg-blue-50"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Thêm quy tắc
                  </button>
                </div>

                {condRules.map((rule, idx) => {
                  const srcQ = precedingQuestions.find(
                    (q) => q._id === rule.sourceQuestionId
                  );
                  const hasSrcOptions = Boolean(srcQ?.options?.length);
                  return (
                    <div
                      key={idx}
                      className="grid grid-cols-1 gap-2 rounded-xl border border-slate-200 bg-white p-3 sm:grid-cols-12 sm:items-center"
                    >
                      <div className="sm:col-span-5">
                        <label className="mb-1 block text-[10px] font-semibold uppercase text-slate-400">
                          Câu hỏi nguồn (đứng trước)
                        </label>
                        <select
                          value={rule.sourceQuestionId}
                          onChange={(e) =>
                            handleUpdateRule(idx, {
                              sourceQuestionId: e.target.value,
                            })
                          }
                          className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-900"
                        >
                          {precedingQuestions.map((pq) => (
                            <option key={pq._id} value={pq._id}>
                              #{pq.order} [{pq.code}] {pq.questionText.slice(0, 40)}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="sm:col-span-3">
                        <label className="mb-1 block text-[10px] font-semibold uppercase text-slate-400">
                          Toán tử
                        </label>
                        <select
                          value={rule.operator}
                          onChange={(e) =>
                            handleUpdateRule(idx, {
                              operator: e.target.value as ConditionOperator,
                            })
                          }
                          className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-900"
                        >
                          {Object.entries(OPERATOR_LABELS).map(([op, label]) => (
                            <option key={op} value={op}>
                              {label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="sm:col-span-3">
                        <label className="mb-1 block text-[10px] font-semibold uppercase text-slate-400">
                          Giá trị so sánh
                        </label>
                        {hasSrcOptions ? (
                          <select
                            value={String(rule.value)}
                            onChange={(e) =>
                              handleUpdateRule(idx, { value: e.target.value })
                            }
                            className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-900"
                          >
                            {srcQ!.options.map((o) => (
                              <option key={o.value} value={o.value}>
                                {o.label} ({o.value})
                              </option>
                            ))}
                          </select>
                        ) : (
                          <input
                            type={
                              srcQ?.questionType ===
                              ASSESSMENT_QUESTION_TYPES.SCALE
                                ? "number"
                                : "text"
                            }
                            value={String(rule.value)}
                            onChange={(e) =>
                              handleUpdateRule(idx, {
                                value:
                                  srcQ?.questionType ===
                                  ASSESSMENT_QUESTION_TYPES.SCALE
                                    ? Number(e.target.value)
                                    : e.target.value,
                              })
                            }
                            className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-900"
                          />
                        )}
                      </div>

                      <div className="flex justify-end pt-3 sm:col-span-1">
                        <button
                          type="button"
                          onClick={() =>
                            setCondRules((prev) =>
                              prev.filter((_, rIdx) => rIdx !== idx)
                            )
                          }
                          className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                          title="Xóa quy tắc"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : null}
          </div>

          <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-4">
            <button
              type="button"
              disabled={saving}
              onClick={onClose}
              className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-xl bg-[#102C8A] px-5 py-2 text-sm font-semibold text-white shadow-xs transition hover:bg-[#0B2066] disabled:opacity-60"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              {mode === "create" ? "Thêm câu hỏi" : "Lưu cập nhật"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

