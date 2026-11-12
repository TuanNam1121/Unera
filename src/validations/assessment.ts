import { z } from "zod";
import {
  ASSESSMENT_QUESTION_TYPES,
  CONDITION_MATCH_TYPES,
  CONDITION_OPERATORS,
  GEMINI_MODELS,
  SYSTEM_PROMPT_KEYS,
} from "@/constants";

export const questionOptionSchema = z.object({
  id: z.string().trim().min(1, "Mã phương án không được trống"),
  label: z.string().trim().min(1, "Nội dung phương án không được trống").max(300),
  value: z.string().trim().min(1, "Giá trị phương án không được trống").max(120),
  order: z.number().int().min(1),
});

export const scaleConfigSchema = z.object({
  min: z.number().int().min(0).max(10).default(1),
  max: z.number().int().min(2).max(10).default(5),
  step: z.number().int().min(1).max(5).default(1),
  minLabel: z.string().trim().max(100).default("Hoàn toàn không đồng ý"),
  maxLabel: z.string().trim().max(100).default("Rất đồng ý"),
});

export const textConfigSchema = z.object({
  placeholder: z.string().trim().max(200).default("Nhập câu trả lời của bạn..."),
  maxLength: z.number().int().min(20).max(3000).default(1000),
  multiline: z.boolean().default(true),
});

export const multipleConfigSchema = z.object({
  minSelect: z.number().int().min(0).max(20).optional(),
  maxSelect: z.number().int().min(1).max(20).optional(),
});

export const conditionRuleSchema = z.object({
  sourceQuestionId: z.string().trim().min(1, "Vui lòng chọn câu hỏi nguồn"),
  operator: z.enum([
    CONDITION_OPERATORS.EQUALS,
    CONDITION_OPERATORS.NOT_EQUALS,
    CONDITION_OPERATORS.CONTAINS,
    CONDITION_OPERATORS.GREATER_THAN,
    CONDITION_OPERATORS.LESS_THAN,
  ]),
  value: z.union([z.string(), z.number()]),
});

export const conditionalLogicSchema = z
  .object({
    enabled: z.boolean().default(false),
    matchType: z
      .enum([CONDITION_MATCH_TYPES.ALL, CONDITION_MATCH_TYPES.ANY])
      .default(CONDITION_MATCH_TYPES.ALL),
    rules: z.array(conditionRuleSchema).default([]),
  })
  .nullable()
  .optional();

export const questionnaireCreateSchema = z.object({
  title: z
    .string()
    .trim()
    .min(3, "Tên bộ câu hỏi phải có ít nhất 3 ký tự")
    .max(180, "Tên bộ câu hỏi tối đa 180 ký tự"),
  description: z
    .string()
    .trim()
    .max(600, "Mô tả tối đa 600 ký tự")
    .optional()
    .default(""),
});

export const questionnaireUpdateSchema = z.object({
  title: z
    .string()
    .trim()
    .min(3, "Tên bộ câu hỏi phải có ít nhất 3 ký tự")
    .max(180, "Tên bộ câu hỏi tối đa 180 ký tự")
    .optional(),
  description: z.string().trim().max(600).optional(),
  version: z.number().int().min(1).optional(),
});

export const assessmentQuestionInputSchema = z
  .object({
    code: z
      .string()
      .trim()
      .min(1, "Mã câu hỏi không được trống")
      .max(60)
      .regex(/^[A-Za-z0-9_-]+$/, "Mã câu hỏi chỉ gồm chữ, số, _ hoặc -"),
    questionText: z
      .string()
      .trim()
      .min(5, "Nội dung câu hỏi phải có ít nhất 5 ký tự")
      .max(500),
    description: z.string().trim().max(500).optional().default(""),
    questionType: z.enum([
      ASSESSMENT_QUESTION_TYPES.SINGLE_CHOICE,
      ASSESSMENT_QUESTION_TYPES.MULTIPLE_CHOICE,
      ASSESSMENT_QUESTION_TYPES.SCALE,
      ASSESSMENT_QUESTION_TYPES.TEXT,
    ]),
    isRequired: z.boolean().default(true),
    allowCustomOption: z.boolean().optional().default(true),
    order: z.number().int().min(1).optional(),
    options: z.array(questionOptionSchema).optional().default([]),
    scaleConfig: scaleConfigSchema.optional(),
    textConfig: textConfigSchema.optional(),
    multipleConfig: multipleConfigSchema.optional(),
    conditionalLogic: conditionalLogicSchema,
  })
  .superRefine((data, ctx) => {
    if (
      data.questionType === ASSESSMENT_QUESTION_TYPES.SINGLE_CHOICE ||
      data.questionType === ASSESSMENT_QUESTION_TYPES.MULTIPLE_CHOICE
    ) {
      if (!data.options || data.options.length < 2) {
        ctx.addIssue({
          code: "custom",
          message: "Câu hỏi lựa chọn phải có ít nhất 2 phương án trả lời",
          path: ["options"],
        });
      }
      if (
        data.questionType === ASSESSMENT_QUESTION_TYPES.MULTIPLE_CHOICE &&
        data.multipleConfig?.minSelect !== undefined &&
        data.multipleConfig?.maxSelect !== undefined &&
        data.multipleConfig.minSelect > data.multipleConfig.maxSelect
      ) {
        ctx.addIssue({
          code: "custom",
          message: "Số lựa chọn tối thiểu không được lớn hơn tối đa",
          path: ["multipleConfig"],
        });
      }
    }

    if (data.questionType === ASSESSMENT_QUESTION_TYPES.SCALE && data.scaleConfig) {
      if (data.scaleConfig.min >= data.scaleConfig.max) {
        ctx.addIssue({
          code: "custom",
          message: "Giá trị tối thiểu của thang điểm phải nhỏ hơn tối đa",
          path: ["scaleConfig"],
        });
      }
    }

    if (data.conditionalLogic?.enabled && data.conditionalLogic.rules.length === 0) {
      ctx.addIssue({
        code: "custom",
        message: "Khi bật điều kiện hiển thị, cần thêm ít nhất 1 quy tắc điều kiện",
        path: ["conditionalLogic"],
      });
    }
  });

export const reorderQuestionsSchema = z.object({
  orderedQuestionIds: z
    .array(z.string().trim().min(1))
    .min(1, "Danh sách thứ tự câu hỏi không được trống"),
});

export const answerValueSchema = z.union([
  z.string(),
  z.array(z.string()),
  z.number(),
]);

export const assessmentDraftSchema = z.object({
  questionnaireId: z.string().trim().min(1).optional(),
  answers: z.record(z.string(), answerValueSchema).default({}),
  currentStepIndex: z.number().int().min(0).default(0),
});

export const assessmentSubmitSchema = z.object({
  questionnaireId: z.string().trim().min(1).optional(),
  answers: z.record(z.string(), answerValueSchema).default({}),
});

export const systemPromptCreateSchema = z.object({
  key: z.enum([
    SYSTEM_PROMPT_KEYS.ORIENTATION_ANALYSIS,
    SYSTEM_PROMPT_KEYS.ROADMAP_GENERATION,
  ]),
  name: z
    .string()
    .trim()
    .min(3, "Tên phiên bản prompt phải có ít nhất 3 ký tự")
    .max(150),
  promptContent: z
    .string()
    .trim()
    .min(30, "Nội dung System Prompt quá ngắn (tối thiểu 30 ký tự)")
    .max(12000),
  modelName: z
    .enum(GEMINI_MODELS, {
      error: "Chỉ hỗ trợ 2 model: gemini-3.1-flash-lite và gemini-3.5-flash-lite",
    })
    .default(GEMINI_MODELS[0]),
  temperature: z.number().min(0).max(1.5).default(0.35),
  activateImmediately: z.boolean().optional().default(true),
});

export const aiOrientationResultSchema = z.object({
  overallSummary: z.string().trim().min(20),
  profileEvaluation: z.object({
    interests: z.array(z.string().trim().min(1)).min(1).max(6),
    strengths: z.array(z.string().trim().min(1)).min(1).max(6),
    areasForImprovement: z.array(z.string().trim().min(1)).min(1).max(6),
  }),
  orientationCompatibility: z
    .array(
      z.object({
        directionCode: z.enum([
          "CAREER_INDUSTRY",
          "STUDY_ABROAD",
          "RESEARCH",
          "STARTUP",
          "POSTGRAD",
        ]),
        directionTitle: z.string().trim().min(2),
        compatibilityScore: z.number().min(0).max(100),
        isPrimaryRecommendation: z.boolean(),
        reasoning: z.string().trim().min(5),
      })
    )
    .min(2),
  careerRecommendations: z
    .array(
      z.object({
        title: z.string().trim().min(2),
        industry: z.string().trim().min(2),
        matchScore: z.number().min(0).max(100),
        reason: z.string().trim().min(5),
        nextSteps: z.array(z.string().trim().min(2)).min(1).max(4),
      })
    )
    .min(1)
    .max(4),
  learningRecommendations: z.object({
    hardSkills: z.array(
      z.object({
        name: z.string().trim().min(1),
        priority: z.enum(["HIGH", "MEDIUM"]),
        reason: z.string().trim().min(3),
      })
    ),
    softSkills: z.array(
      z.object({
        name: z.string().trim().min(1),
        priority: z.enum(["HIGH", "MEDIUM"]),
        reason: z.string().trim().min(3),
      })
    ),
    certificatesOrCourses: z.array(z.string().trim().min(1)),
  }),
});

export type AiOrientationResultValidated = z.infer<
  typeof aiOrientationResultSchema
>;

