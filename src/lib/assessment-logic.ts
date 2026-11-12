import {
  ASSESSMENT_QUESTION_TYPES,
  CONDITION_MATCH_TYPES,
  CONDITION_OPERATORS,
} from "@/constants";
import type {
  AssessmentAnswersMap,
  AssessmentAnswerValue,
  IAssessmentQuestionDTO,
  IConditionalLogicDTO,
  IConditionRuleDTO,
} from "@/types";

export function isAnswerEmpty(value: AssessmentAnswerValue | undefined | null): boolean {
  if (value === undefined || value === null) return true;
  if (typeof value === "string") return value.trim().length === 0;
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === "number") return !Number.isFinite(value);
  return true;
}

function evaluateSingleRule(
  rule: IConditionRuleDTO,
  answersMap: AssessmentAnswersMap
): boolean {
  const raw = answersMap[rule.sourceQuestionId];
  if (isAnswerEmpty(raw)) return false;

  const expectedStr = String(rule.value ?? "").trim();

  switch (rule.operator) {
    case CONDITION_OPERATORS.EQUALS: {
      if (Array.isArray(raw)) {
        return raw.length === 1 && String(raw[0]).trim() === expectedStr;
      }
      return String(raw).trim() === expectedStr;
    }
    case CONDITION_OPERATORS.NOT_EQUALS: {
      if (Array.isArray(raw)) {
        return !raw.some((v) => String(v).trim() === expectedStr);
      }
      return String(raw).trim() !== expectedStr;
    }
    case CONDITION_OPERATORS.CONTAINS: {
      if (Array.isArray(raw)) {
        return raw.some((v) => String(v).trim() === expectedStr);
      }
      return String(raw).toLowerCase().includes(expectedStr.toLowerCase());
    }
    case CONDITION_OPERATORS.GREATER_THAN: {
      const numAns = Number(raw);
      const numTarget = Number(rule.value);
      return Number.isFinite(numAns) && Number.isFinite(numTarget) && numAns > numTarget;
    }
    case CONDITION_OPERATORS.LESS_THAN: {
      const numAns = Number(raw);
      const numTarget = Number(rule.value);
      return Number.isFinite(numAns) && Number.isFinite(numTarget) && numAns < numTarget;
    }
    default:
      return false;
  }
}

/**
 * Hàm thuần đánh giá câu hỏi có thỏa mãn điều kiện hiển thị hay không (PA07).
 * Dùng chung cho cả Client (<QuestionRenderer />) và Server (submit validation).
 */
export function evaluateCondition(
  question: Pick<IAssessmentQuestionDTO, "conditionalLogic">,
  answersMap: AssessmentAnswersMap
): boolean {
  const logic = question.conditionalLogic;
  if (!logic || !logic.enabled || !Array.isArray(logic.rules) || logic.rules.length === 0) {
    return true;
  }

  if (logic.matchType === CONDITION_MATCH_TYPES.ANY) {
    return logic.rules.some((rule) => evaluateSingleRule(rule, answersMap));
  }

  return logic.rules.every((rule) => evaluateSingleRule(rule, answersMap));
}

/**
 * Tính danh sách câu hỏi đang hiển thị theo đúng thứ tự `order ASC`,
 * đồng thời loại bỏ câu trả lời của câu hỏi bị ẩn khỏi tập đáp án hiệu lực.
 */
export function computeVisibleQuestions<
  T extends Pick<IAssessmentQuestionDTO, "_id" | "order" | "conditionalLogic">
>(
  questions: T[],
  answersMap: AssessmentAnswersMap
): {
  visibleQuestions: T[];
  visibleAnswersMap: AssessmentAnswersMap;
} {
  const sorted = [...questions].sort((a, b) => a.order - b.order);
  const visibleQuestions: T[] = [];
  const visibleAnswersMap: AssessmentAnswersMap = {};

  for (const q of sorted) {
    const visible = evaluateCondition(q, visibleAnswersMap);
    if (visible) {
      visibleQuestions.push(q);
      const existing = answersMap[q._id];
      if (!isAnswerEmpty(existing)) {
        visibleAnswersMap[q._id] = existing;
      }
    }
  }

  return { visibleQuestions, visibleAnswersMap };
}

export interface AnswerValidationError {
  questionId: string;
  message: string;
}

/**
 * Kiểm tra toàn bộ câu hỏi hiển thị trước khi nộp bài (PA09):
 * - Bỏ qua các câu hỏi đang ẩn do conditionalLogic
 * - Validate isRequired, minSelect/maxSelect, scale range, maxLength
 */
export function validateVisibleAnswers(
  questions: IAssessmentQuestionDTO[],
  answersMap: AssessmentAnswersMap
): {
  valid: boolean;
  visibleQuestions: IAssessmentQuestionDTO[];
  cleanedAnswers: AssessmentAnswersMap;
  errors: AnswerValidationError[];
} {
  const { visibleQuestions, visibleAnswersMap } = computeVisibleQuestions(
    questions,
    answersMap
  );
  const errors: AnswerValidationError[] = [];

  for (const q of visibleQuestions) {
    const val = visibleAnswersMap[q._id];
    const empty = isAnswerEmpty(val);

    if (q.isRequired && empty) {
      errors.push({
        questionId: q._id,
        message: `Vui lòng trả lời câu hỏi bắt buộc: "${q.questionText}"`,
      });
      continue;
    }

    if (empty) continue;

    switch (q.questionType) {
      case ASSESSMENT_QUESTION_TYPES.SINGLE_CHOICE: {
        if (typeof val !== "string") {
          errors.push({
            questionId: q._id,
            message: `Câu hỏi "${q.questionText}" chỉ cho phép chọn 1 phương án`,
          });
          break;
        }
        const trimmedVal = val.trim();
        if (!trimmedVal) {
          delete visibleAnswersMap[q._id];
          if (q.isRequired) {
            errors.push({
              questionId: q._id,
              message: `Vui lòng trả lời câu hỏi bắt buộc: "${q.questionText}"`,
            });
          }
          break;
        }
        const allowed = new Set((q.options || []).map((o) => o.value));
        const customAllowed = q.allowCustomOption !== false;
        if (allowed.size > 0 && !allowed.has(trimmedVal)) {
          if (!customAllowed) {
            errors.push({
              questionId: q._id,
              message: `Phương án đã chọn ở câu "${q.questionText}" không hợp lệ`,
            });
            break;
          }
          if (trimmedVal.length > 300) {
            errors.push({
              questionId: q._id,
              message: `Câu trả lời tự nhập ở câu "${q.questionText}" không được vượt quá 300 ký tự`,
            });
            break;
          }
        }
        visibleAnswersMap[q._id] = trimmedVal;
        break;
      }
      case ASSESSMENT_QUESTION_TYPES.MULTIPLE_CHOICE: {
        if (!Array.isArray(val)) {
          errors.push({
            questionId: q._id,
            message: `Câu hỏi "${q.questionText}" yêu cầu danh sách lựa chọn`,
          });
          break;
        }
        const uniqueVals = Array.from(
          new Set(val.map((v) => String(v).trim()).filter(Boolean))
        );
        if (uniqueVals.length === 0) {
          delete visibleAnswersMap[q._id];
          if (q.isRequired) {
            errors.push({
              questionId: q._id,
              message: `Vui lòng trả lời câu hỏi bắt buộc: "${q.questionText}"`,
            });
          }
          break;
        }
        const allowed = new Set((q.options || []).map((o) => o.value));
        const customAllowed = q.allowCustomOption !== false;
        const invalidCustom = uniqueVals.find(
          (item) =>
            allowed.size > 0 &&
            !allowed.has(item) &&
            (!customAllowed || item.length > 300)
        );
        if (invalidCustom !== undefined) {
          errors.push({
            questionId: q._id,
            message: !customAllowed
              ? `Phương án đã chọn ở câu "${q.questionText}" không hợp lệ`
              : `Mỗi ý kiến tự nhập ở câu "${q.questionText}" tối đa 300 ký tự`,
          });
          break;
        }
        const minSelect = q.multipleConfig?.minSelect;
        const maxSelect = q.multipleConfig?.maxSelect;
        if (minSelect !== undefined && uniqueVals.length < minSelect) {
          errors.push({
            questionId: q._id,
            message: `Vui lòng chọn ít nhất ${minSelect} phương án cho câu "${q.questionText}"`,
          });
        }
        if (maxSelect !== undefined && uniqueVals.length > maxSelect) {
          errors.push({
            questionId: q._id,
            message: `Chỉ được chọn tối đa ${maxSelect} phương án cho câu "${q.questionText}"`,
          });
        }
        visibleAnswersMap[q._id] = uniqueVals;
        break;
      }
      case ASSESSMENT_QUESTION_TYPES.SCALE: {
        const min = q.scaleConfig?.min ?? 1;
        const max = q.scaleConfig?.max ?? 5;
        const num = Number(val);
        if (!Number.isFinite(num) || num < min || num > max) {
          errors.push({
            questionId: q._id,
            message: `Giá trị thang đo cho câu "${q.questionText}" phải từ ${min} đến ${max}`,
          });
        }
        break;
      }
      case ASSESSMENT_QUESTION_TYPES.TEXT: {
        const maxLen = q.textConfig?.maxLength ?? 1000;
        const strVal = String(val).trim();
        if (strVal.length > maxLen) {
          errors.push({
            questionId: q._id,
            message: `Câu trả lời cho "${q.questionText}" không được vượt quá ${maxLen} ký tự`,
          });
        }
        visibleAnswersMap[q._id] = strVal;
        break;
      }
    }
  }

  return {
    valid: errors.length === 0,
    visibleQuestions,
    cleanedAnswers: visibleAnswersMap,
    errors,
  };
}

/**
 * Định dạng giá trị trả lời sang chuỗi tiếng Việt dễ đọc cho AI và lịch sử bài làm (AI01, PA10).
 */
export function formatReadableAnswer(
  question: Pick<IAssessmentQuestionDTO, "questionType" | "options" | "scaleConfig">,
  value: AssessmentAnswerValue
): string {
  if (isAnswerEmpty(value)) return "(Chưa trả lời)";

  if (
    question.questionType === ASSESSMENT_QUESTION_TYPES.SINGLE_CHOICE &&
    typeof value === "string"
  ) {
    const opt = question.options?.find((o) => o.value === value);
    return opt ? opt.label : value;
  }

  if (
    question.questionType === ASSESSMENT_QUESTION_TYPES.MULTIPLE_CHOICE &&
    Array.isArray(value)
  ) {
    const labels = value.map((v) => {
      const opt = question.options?.find((o) => o.value === v);
      return opt ? opt.label : v;
    });
    return labels.join("; ");
  }

  if (question.questionType === ASSESSMENT_QUESTION_TYPES.SCALE) {
    const min = question.scaleConfig?.min ?? 1;
    const max = question.scaleConfig?.max ?? 5;
    const minLabel = question.scaleConfig?.minLabel || "";
    const maxLabel = question.scaleConfig?.maxLabel || "";
    const extra = minLabel && maxLabel ? ` (${minLabel} -> ${maxLabel})` : "";
    return `${value}/${max} [thang ${min}-${max}${extra}]`;
  }

  return String(value).trim();
}

/**
 * Kiểm tra ràng buộc thứ tự & phát hiện chu trình đồ thị phụ thuộc bằng DFS (PA24).
 */
export function validateConditionalGraph(
  questions: Array<{
    _id: string;
    order: number;
    code?: string;
    conditionalLogic?: IConditionalLogicDTO | null;
  }>,
  candidate: {
    questionId: string;
    order: number;
    conditionalLogic?: IConditionalLogicDTO | null;
  }
): { valid: boolean; error?: string } {
  const byId = new Map(questions.map((q) => [q._id, q]));

  // Virtual merged graph
  const merged = new Map<
    string,
    { order: number; rules: IConditionRuleDTO[]; code: string }
  >();
  for (const q of questions) {
    merged.set(q._id, {
      order: q.order,
      code: q.code || q._id,
      rules:
        q.conditionalLogic?.enabled && Array.isArray(q.conditionalLogic.rules)
          ? q.conditionalLogic.rules
          : [],
    });
  }

  merged.set(candidate.questionId, {
    order: candidate.order,
    code: byId.get(candidate.questionId)?.code || "Câu hỏi hiện tại",
    rules:
      candidate.conditionalLogic?.enabled &&
      Array.isArray(candidate.conditionalLogic.rules)
        ? candidate.conditionalLogic.rules
        : [],
  });

  // 1. Self-reference & strict precedence checks for candidate + dependents
  for (const [qId, node] of merged.entries()) {
    for (const rule of node.rules) {
      if (rule.sourceQuestionId === qId) {
        return {
          valid: false,
          error: "Câu hỏi không thể tự đặt điều kiện phụ thuộc vào chính nó.",
        };
      }
      const source = merged.get(rule.sourceQuestionId);
      if (!source) {
        return {
          valid: false,
          error: "Câu hỏi nguồn trong quy tắc điều kiện không tồn tại trong bộ câu hỏi.",
        };
      }
      if (source.order >= node.order) {
        return {
          valid: false,
          error: `Câu hỏi nguồn (${source.code}) phải đứng trước câu hỏi phụ thuộc (${node.code}).`,
        };
      }
    }
  }

  // 2. DFS cycle detection (0 = unvisited, 1 = visiting, 2 = visited)
  const state = new Map<string, number>();

  function hasCycle(nodeId: string): boolean {
    const cur = state.get(nodeId) ?? 0;
    if (cur === 1) return true;
    if (cur === 2) return false;

    state.set(nodeId, 1);
    const node = merged.get(nodeId);
    if (node) {
      for (const rule of node.rules) {
        if (hasCycle(rule.sourceQuestionId)) {
          return true;
        }
      }
    }
    state.set(nodeId, 2);
    return false;
  }

  for (const nodeId of merged.keys()) {
    if (hasCycle(nodeId)) {
      return {
        valid: false,
        error:
          "Phát hiện vòng lặp phụ thuộc trong cấu hình điều kiện hiển thị (Cycle detected).",
      };
    }
  }

  return { valid: true };
}

