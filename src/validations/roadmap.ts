import { z } from "zod";
import {
  ROADMAP_GOAL_CATEGORIES,
  ROADMAP_GOAL_PRIORITIES,
  ROADMAP_GOAL_STATUSES,
} from "@/constants";

export const aiRoadmapGoalSchema = z.object({
  title: z.string().trim().min(3).max(200),
  description: z.string().trim().min(3).max(1000),
  category: z.enum([
    ROADMAP_GOAL_CATEGORIES.ACADEMIC,
    ROADMAP_GOAL_CATEGORIES.SKILL,
    ROADMAP_GOAL_CATEGORIES.CERTIFICATE,
    ROADMAP_GOAL_CATEGORIES.EXPERIENCE,
    ROADMAP_GOAL_CATEGORIES.CAREER,
  ]),
  semester: z.union([z.literal(0), z.literal(1), z.literal(2)]),
  priority: z.enum([
    ROADMAP_GOAL_PRIORITIES.HIGH,
    ROADMAP_GOAL_PRIORITIES.MEDIUM,
    ROADMAP_GOAL_PRIORITIES.LOW,
  ]),
});

export const aiRoadmapSchema = z.object({
  title: z.string().trim().min(5).max(200),
  orientationDirection: z.string().trim().min(3).max(240),
  years: z
    .array(
      z.object({
        yearNumber: z.number().int().min(1).max(4),
        title: z.string().trim().min(2).max(180),
        summary: z.string().trim().min(5).max(600),
        goals: z.array(aiRoadmapGoalSchema).min(2).max(10),
      })
    )
    .length(4)
    .refine(
      (years) => {
        const nums = new Set(years.map((y) => y.yearNumber));
        return nums.has(1) && nums.has(2) && nums.has(3) && nums.has(4);
      },
      { message: "Lộ trình bắt buộc gồm đủ 4 năm học (1, 2, 3, 4)" }
    ),
});

export type AiRoadmapValidated = z.infer<typeof aiRoadmapSchema>;

export const createRoadmapGoalSchema = z.object({
  yearNumber: z.coerce.number().int().min(1).max(4),
  title: z
    .string()
    .trim()
    .min(3, "Tiêu đề mục tiêu tối thiểu 3 ký tự")
    .max(200),
  description: z.string().trim().max(1000).optional().default(""),
  category: z
    .enum([
      ROADMAP_GOAL_CATEGORIES.ACADEMIC,
      ROADMAP_GOAL_CATEGORIES.SKILL,
      ROADMAP_GOAL_CATEGORIES.CERTIFICATE,
      ROADMAP_GOAL_CATEGORIES.EXPERIENCE,
      ROADMAP_GOAL_CATEGORIES.CAREER,
    ])
    .default(ROADMAP_GOAL_CATEGORIES.SKILL),
  semester: z
    .union([z.literal(0), z.literal(1), z.literal(2)])
    .optional()
    .default(0),
  priority: z
    .enum([
      ROADMAP_GOAL_PRIORITIES.HIGH,
      ROADMAP_GOAL_PRIORITIES.MEDIUM,
      ROADMAP_GOAL_PRIORITIES.LOW,
    ])
    .default(ROADMAP_GOAL_PRIORITIES.MEDIUM),
  dueDate: z.string().trim().nullable().optional(),
});

export const updateRoadmapGoalSchema = z.object({
  title: z
    .string()
    .trim()
    .min(3, "Tiêu đề mục tiêu tối thiểu 3 ký tự")
    .max(200)
    .optional(),
  description: z.string().trim().max(1000).optional(),
  category: z
    .enum([
      ROADMAP_GOAL_CATEGORIES.ACADEMIC,
      ROADMAP_GOAL_CATEGORIES.SKILL,
      ROADMAP_GOAL_CATEGORIES.CERTIFICATE,
      ROADMAP_GOAL_CATEGORIES.EXPERIENCE,
      ROADMAP_GOAL_CATEGORIES.CAREER,
    ])
    .optional(),
  semester: z.union([z.literal(0), z.literal(1), z.literal(2)]).optional(),
  priority: z
    .enum([
      ROADMAP_GOAL_PRIORITIES.HIGH,
      ROADMAP_GOAL_PRIORITIES.MEDIUM,
      ROADMAP_GOAL_PRIORITIES.LOW,
    ])
    .optional(),
  status: z
    .enum([
      ROADMAP_GOAL_STATUSES.NOT_STARTED,
      ROADMAP_GOAL_STATUSES.IN_PROGRESS,
      ROADMAP_GOAL_STATUSES.COMPLETED,
      ROADMAP_GOAL_STATUSES.SKIPPED,
    ])
    .optional(),
  dueDate: z.string().trim().nullable().optional(),
  targetYearNumber: z.coerce.number().int().min(1).max(4).optional(),
});

export const reorderRoadmapGoalsSchema = z.object({
  orderedGoalIds: z
    .array(z.string().trim().min(1))
    .min(1, "Danh sách mục tiêu cần sắp xếp không được trống"),
});

export const regenerateRoadmapSchema = z.object({
  analysisId: z.string().trim().optional(),
  targetDirection: z.string().trim().max(300).optional(),
  notes: z.string().trim().max(1000).optional(),
});

export const customCareerOptionSchema = z.object({
  analysisId: z.string().trim().min(1, "Thiếu mã phân tích AI"),
  title: z
    .string()
    .trim()
    .min(2, "Tên định hướng nghề nghiệp tối thiểu 2 ký tự")
    .max(180, "Tên định hướng tối đa 180 ký tự"),
  reason: z.string().trim().max(500).optional().default(""),
});

