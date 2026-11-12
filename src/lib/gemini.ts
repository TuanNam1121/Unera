import { GoogleGenAI, Schema, Type } from "@google/genai";
import { ZodType } from "zod";
import {
  GEMINI_FALLBACK_MODELS,
  GeminiModel,
  resolveAllowedGeminiModel,
} from "@/constants";
import { aiOrientationResultSchema } from "@/validations/assessment";
import { aiRoadmapSchema } from "@/validations/roadmap";
import type { IAiOrientationResultDTO } from "@/types";
import type { AiRoadmapValidated } from "@/validations/roadmap";

const GEMINI_TIMEOUT_MS = 30_000;
const MAX_SAME_MODEL_RETRIES = 1;
const MODEL_RATE_LIMIT_COOLDOWN_MS = 60_000;
const RATE_LIMIT_ROUND_TRIP_DELAY_MS = 1_200;

const modelRateLimitedUntil = new Map<GeminiModel, number>();
let stickyActiveModel: GeminiModel | null = null;
let lastConfiguredPrimaryModel: GeminiModel | null = null;

export const GEMINI_ORIENTATION_RESPONSE_SCHEMA: Schema = {
  type: Type.OBJECT,
  properties: {
    overallSummary: {
      type: Type.STRING,
      description:
        "Tóm tắt tổng quan chân dung, động lực và định hướng phát triển của sinh viên (tiếng Việt, 2-4 câu).",
    },
    profileEvaluation: {
      type: Type.OBJECT,
      properties: {
        interests: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: "Từ 1 đến 6 sở thích hoặc mối quan tâm nổi trội.",
        },
        strengths: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: "Từ 1 đến 6 điểm mạnh nổi bật dựa trên câu trả lời và hồ sơ.",
        },
        areasForImprovement: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description:
            "Từ 1 đến 6 điểm cần cải thiện hoặc cần bồi đắp tiếp theo.",
        },
      },
      required: ["interests", "strengths", "areasForImprovement"],
    },
    orientationCompatibility: {
      type: Type.ARRAY,
      description:
        "Đánh giá mức độ phù hợp với tối thiểu 4 hướng định hướng phát triển.",
      items: {
        type: Type.OBJECT,
        properties: {
          directionCode: {
            type: Type.STRING,
            enum: [
              "CAREER_INDUSTRY",
              "STUDY_ABROAD",
              "RESEARCH",
              "STARTUP",
              "POSTGRAD",
            ],
          },
          directionTitle: { type: Type.STRING },
          compatibilityScore: {
            type: Type.NUMBER,
            minimum: 0,
            maximum: 100,
          },
          isPrimaryRecommendation: { type: Type.BOOLEAN },
          reasoning: { type: Type.STRING },
        },
        required: [
          "directionCode",
          "directionTitle",
          "compatibilityScore",
          "isPrimaryRecommendation",
          "reasoning",
        ],
      },
    },
    careerRecommendations: {
      type: Type.ARRAY,
      description: "Đề xuất từ 1 đến 4 vai trò nghề nghiệp hoặc lộ trình mục tiêu phù hợp.",
      items: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          industry: { type: Type.STRING },
          matchScore: {
            type: Type.NUMBER,
            minimum: 0,
            maximum: 100,
          },
          reason: { type: Type.STRING },
          nextSteps: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
          },
        },
        required: ["title", "industry", "matchScore", "reason", "nextSteps"],
      },
    },
    learningRecommendations: {
      type: Type.OBJECT,
      properties: {
        hardSkills: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              priority: { type: Type.STRING, enum: ["HIGH", "MEDIUM"] },
              reason: { type: Type.STRING },
            },
            required: ["name", "priority", "reason"],
          },
        },
        softSkills: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              priority: { type: Type.STRING, enum: ["HIGH", "MEDIUM"] },
              reason: { type: Type.STRING },
            },
            required: ["name", "priority", "reason"],
          },
        },
        certificatesOrCourses: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
        },
      },
      required: ["hardSkills", "softSkills", "certificatesOrCourses"],
    },
  },
  required: [
    "overallSummary",
    "profileEvaluation",
    "orientationCompatibility",
    "careerRecommendations",
    "learningRecommendations",
  ],
};

export const GEMINI_ROADMAP_RESPONSE_SCHEMA: Schema = {
  type: Type.OBJECT,
  properties: {
    title: {
      type: Type.STRING,
      description: "Tên lộ trình phát triển 4 năm (VD: Lộ trình Du học Thạc sĩ & Nghiên cứu Ngôn ngữ Anh).",
    },
    orientationDirection: {
      type: Type.STRING,
      description: "Định hướng mục tiêu trọng tâm (tiếng Việt ngắn gọn).",
    },
    years: {
      type: Type.ARRAY,
      description: "Danh sách bắt buộc đúng 4 năm học (yearNumber: 1, 2, 3, 4).",
      items: {
        type: Type.OBJECT,
        properties: {
          yearNumber: {
            type: Type.INTEGER,
            minimum: 1,
            maximum: 4,
          },
          title: { type: Type.STRING },
          summary: { type: Type.STRING },
          goals: {
            type: Type.ARRAY,
            description: "Từ 3 đến 8 mục tiêu cụ thể trong năm học này.",
            items: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                description: { type: Type.STRING },
                category: {
                  type: Type.STRING,
                  enum: ["ACADEMIC", "SKILL", "CERTIFICATE", "EXPERIENCE", "CAREER"],
                },
                semester: {
                  type: Type.INTEGER,
                  minimum: 0,
                  maximum: 2,
                  description: "0 = Cả năm, 1 = Học kỳ 1, 2 = Học kỳ 2",
                },
                priority: {
                  type: Type.STRING,
                  enum: ["HIGH", "MEDIUM", "LOW"],
                },
              },
              required: ["title", "description", "category", "semester", "priority"],
            },
          },
        },
        required: ["yearNumber", "title", "summary", "goals"],
      },
    },
  },
  required: ["title", "orientationDirection", "years"],
};

class GeminiControlledError extends Error {
  readonly retryable: boolean;
  constructor(message: string, retryable: boolean) {
    super(message);
    this.name = "GeminiControlledError";
    this.retryable = retryable;
  }
}

function getGeminiApiKey(): string {
  const key = process.env.GEMINI_API_KEY?.trim();
  if (!key) {
    throw new GeminiControlledError(
      "Hệ thống AI chưa được cấu hình GEMINI_API_KEY trên máy chủ. Vui lòng liên hệ quản trị viên.",
      false
    );
  }
  return key;
}

function readRawNumericCode(err: unknown): number | null {
  if (!err || typeof err !== "object") return null;
  if ("status" in err && typeof (err as { status?: unknown }).status === "number") {
    return (err as { status: number }).status;
  }
  if ("code" in err && typeof (err as { code?: unknown }).code === "number") {
    return (err as { code: number }).code;
  }
  if ("error" in err) {
    const nested = (err as { error?: unknown }).error;
    if (nested && typeof nested === "object") {
      if ("code" in nested && typeof (nested as { code?: unknown }).code === "number") {
        return (nested as { code: number }).code;
      }
      if ("status" in nested && typeof (nested as { status?: unknown }).status === "number") {
        return (nested as { status: number }).status;
      }
    }
  }
  return null;
}

function isRateLimitError(err: unknown): boolean {
  const numericCode = readRawNumericCode(err);
  if (numericCode === 429) return true;

  if (err && typeof err === "object") {
    const statusStr =
      "status" in err && typeof (err as { status?: unknown }).status === "string"
        ? (err as { status: string }).status.toUpperCase()
        : "";
    if (statusStr.includes("RESOURCE_EXHAUSTED")) return true;

    if ("error" in err) {
      const nested = (err as { error?: unknown }).error;
      if (
        nested &&
        typeof nested === "object" &&
        "status" in nested &&
        typeof (nested as { status?: unknown }).status === "string" &&
        (nested as { status: string }).status.toUpperCase().includes("RESOURCE_EXHAUSTED")
      ) {
        return true;
      }
    }
  }

  const msg = (
    err instanceof Error
      ? err.message
      : err && typeof err === "object" && "message" in err
        ? String((err as { message?: unknown }).message)
        : String(err ?? "")
  ).toLowerCase();

  return (
    msg.includes("429") ||
    msg.includes("resource_exhausted") ||
    msg.includes("resource exhausted") ||
    msg.includes("quota") ||
    msg.includes("rate limit") ||
    msg.includes("rate-limit") ||
    msg.includes("ratelimit") ||
    msg.includes("too many requests") ||
    msg.includes("requests per minute") ||
    msg.includes("tokens per minute") ||
    msg.includes("limit exceeded")
  );
}

function extractStatusCode(err: unknown): number | null {
  if (isRateLimitError(err)) return 429;
  const numericCode = readRawNumericCode(err);
  if (numericCode !== null) return numericCode;
  if (!err || typeof err !== "object") return null;
  const msg = "message" in err ? String((err as { message?: unknown }).message) : "";
  if (msg.includes("401") || msg.includes("403") || msg.toLowerCase().includes("api key")) {
    return 401;
  }
  return null;
}

function sanitizeErrorMessage(err: unknown): string {
  if (err instanceof GeminiControlledError) {
    return err.message;
  }
  const status = extractStatusCode(err);
  const rawMsg = err instanceof Error ? err.message : String(err ?? "");
  const lower = rawMsg.toLowerCase();

  if (lower.includes("abort") || lower.includes("timeout")) {
    return "Kết nối tới Gemini AI quá thời gian chờ (30s). Vui lòng thử phân tích lại.";
  }
  if (status === 429) {
    return "Cả 2 model Gemini AI (gemini-3.1-flash-lite & gemini-3.5-flash-lite) đều đang tạm chạm giới hạn lưu lượng (429 / Quota). Vui lòng chờ giây lát và thử lại.";
  }
  if (status === 401 || status === 403 || lower.includes("api_key_invalid")) {
    return "Khóa API Gemini không hợp lệ hoặc đã hết hạn. Vui lòng liên hệ quản trị viên kiểm tra cấu hình.";
  }
  if (status === 503 || lower.includes("high demand") || lower.includes("unavailable")) {
    return "Máy chủ Gemini AI đang quá tải lưu lượng tạm thời (503). Vui lòng thử lại sau giây lát.";
  }
  if (status === 404 || lower.includes("not found")) {
    return "Model Gemini được cấu hình hiện không khả dụng. Quản trị viên cần kiểm tra lại modelName trong System Prompt.";
  }
  if (lower.includes("fetch failed") || lower.includes("enotfound") || lower.includes("econn")) {
    return "Không thể kết nối mạng tới dịch vụ Google Gemini. Vui lòng thử lại sau.";
  }

  return "Quá trình phân tích bằng AI gặp sự cố tạm thời khi chuẩn hóa dữ liệu. Vui lòng thử lại.";
}

function isRetryableError(err: unknown): boolean {
  if (err instanceof GeminiControlledError) {
    return err.retryable;
  }
  const status = extractStatusCode(err);
  if (status === 401 || status === 403 || status === 400 || status === 404) {
    return false;
  }
  if (status === 429 || (status !== null && status >= 500)) {
    return true;
  }
  const msg = (err instanceof Error ? err.message : String(err ?? "")).toLowerCase();
  if (
    msg.includes("abort") ||
    msg.includes("timeout") ||
    msg.includes("fetch failed") ||
    msg.includes("econn") ||
    msg.includes("network")
  ) {
    return true;
  }
  return true;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function stripJsonCodeFence(rawText: string): string {
  const trimmed = rawText.trim();
  if (trimmed.startsWith("```")) {
    return trimmed
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```$/i, "")
      .trim();
  }
  return trimmed;
}

function clampScore(val: unknown, fallback = 50): number {
  const num = Number(val);
  if (!Number.isFinite(num)) return fallback;
  return Math.min(100, Math.max(0, Math.round(num)));
}

function trimStringList(arr: unknown, maxCount: number): string[] {
  if (!Array.isArray(arr)) return [];
  return arr
    .map((item) => (typeof item === "string" ? item.trim() : ""))
    .filter((item) => item.length > 0)
    .slice(0, maxCount);
}

function normalizeOrientationPayload(raw: unknown): unknown {
  if (!raw || typeof raw !== "object") return raw;
  const obj = raw as Record<string, unknown>;
  const pe = (obj.profileEvaluation && typeof obj.profileEvaluation === "object"
    ? obj.profileEvaluation
    : {}) as Record<string, unknown>;
  const lr = (obj.learningRecommendations && typeof obj.learningRecommendations === "object"
    ? obj.learningRecommendations
    : {}) as Record<string, unknown>;

  const compat = Array.isArray(obj.orientationCompatibility)
    ? obj.orientationCompatibility.map((item) => {
        if (!item || typeof item !== "object") return item;
        const c = item as Record<string, unknown>;
        return {
          ...c,
          directionTitle: typeof c.directionTitle === "string" ? c.directionTitle.trim() : "",
          compatibilityScore: clampScore(c.compatibilityScore, 60),
          isPrimaryRecommendation: Boolean(c.isPrimaryRecommendation),
          reasoning: typeof c.reasoning === "string" ? c.reasoning.trim() : "",
        };
      })
    : [];

  const careers = Array.isArray(obj.careerRecommendations)
    ? obj.careerRecommendations.slice(0, 4).map((item) => {
        if (!item || typeof item !== "object") return item;
        const cr = item as Record<string, unknown>;
        return {
          ...cr,
          title: typeof cr.title === "string" ? cr.title.trim() : "",
          industry: typeof cr.industry === "string" ? cr.industry.trim() : "",
          matchScore: clampScore(cr.matchScore, 70),
          reason: typeof cr.reason === "string" ? cr.reason.trim() : "",
          nextSteps: trimStringList(cr.nextSteps, 4),
        };
      })
    : [];

  const mapSkillList = (val: unknown) =>
    Array.isArray(val)
      ? val
          .map((item) => {
            if (!item || typeof item !== "object") return null;
            const s = item as Record<string, unknown>;
            const name = typeof s.name === "string" ? s.name.trim() : "";
            const reason = typeof s.reason === "string" ? s.reason.trim() : "";
            if (!name || !reason) return null;
            const priority = s.priority === "HIGH" ? "HIGH" : "MEDIUM";
            return { name, priority, reason };
          })
          .filter(Boolean)
      : [];

  return {
    overallSummary:
      typeof obj.overallSummary === "string" ? obj.overallSummary.trim() : "",
    profileEvaluation: {
      interests: trimStringList(pe.interests, 6),
      strengths: trimStringList(pe.strengths, 6),
      areasForImprovement: trimStringList(pe.areasForImprovement, 6),
    },
    orientationCompatibility: compat,
    careerRecommendations: careers,
    learningRecommendations: {
      hardSkills: mapSkillList(lr.hardSkills),
      softSkills: mapSkillList(lr.softSkills),
      certificatesOrCourses: trimStringList(lr.certificatesOrCourses, 12),
    },
  };
}

function normalizeRoadmapPayload(raw: unknown): unknown {
  if (!raw || typeof raw !== "object") return raw;
  const obj = raw as Record<string, unknown>;

  const years = Array.isArray(obj.years)
    ? obj.years
        .map((y) => {
          if (!y || typeof y !== "object") return y;
          const yr = y as Record<string, unknown>;
          const goals = Array.isArray(yr.goals)
            ? yr.goals.slice(0, 10).map((g) => {
                if (!g || typeof g !== "object") return g;
                const gl = g as Record<string, unknown>;
                const rawSem = Number(gl.semester);
                const semester = rawSem === 1 ? 1 : rawSem === 2 ? 2 : 0;
                return {
                  ...gl,
                  title: typeof gl.title === "string" ? gl.title.trim() : "",
                  description:
                    typeof gl.description === "string"
                      ? gl.description.trim()
                      : "",
                  semester,
                };
              })
            : [];

          return {
            yearNumber: Number(yr.yearNumber),
            title: typeof yr.title === "string" ? yr.title.trim() : "",
            summary: typeof yr.summary === "string" ? yr.summary.trim() : "",
            goals,
          };
        })
        .sort((a, b) => {
          const ya = (a as { yearNumber?: number })?.yearNumber ?? 0;
          const yb = (b as { yearNumber?: number })?.yearNumber ?? 0;
          return ya - yb;
        })
    : [];

  return {
    title: typeof obj.title === "string" ? obj.title.trim() : "",
    orientationDirection:
      typeof obj.orientationDirection === "string"
        ? obj.orientationDirection.trim()
        : "",
    years,
  };
}

function isModelFallbackEligible(err: unknown): boolean {
  if (isRateLimitError(err)) return true;
  const status = extractStatusCode(err);
  if (status === 429 || status === 404 || status === 503) return true;
  const msg = (err instanceof Error ? err.message : String(err ?? "")).toLowerCase();
  return (
    msg.includes("not found") ||
    msg.includes("no longer available") ||
    msg.includes("high demand") ||
    msg.includes("unavailable") ||
    msg.includes("overloaded")
  );
}

function selectCandidateModels(requestedModel: string): GeminiModel[] {
  const configured = resolveAllowedGeminiModel(requestedModel);
  if (lastConfiguredPrimaryModel !== configured) {
    lastConfiguredPrimaryModel = configured;
    stickyActiveModel = configured;
  }

  const now = Date.now();
  const preferred = stickyActiveModel ?? configured;
  const alternate =
    GEMINI_FALLBACK_MODELS.find((m) => m !== preferred) ?? preferred;

  const preferredLimitedUntil = modelRateLimitedUntil.get(preferred) ?? 0;
  const alternateLimitedUntil = modelRateLimitedUntil.get(alternate) ?? 0;

  if (preferredLimitedUntil > now && alternateLimitedUntil <= now) {
    return alternate === preferred ? [preferred] : [alternate, preferred];
  }
  if (
    preferredLimitedUntil > now &&
    alternateLimitedUntil > now &&
    alternateLimitedUntil < preferredLimitedUntil
  ) {
    return alternate === preferred ? [preferred] : [alternate, preferred];
  }

  return Array.from(new Set([preferred, alternate]));
}

async function generateStructuredJsonWithRetry<T>(params: {
  modelName: string;
  temperature: number;
  systemInstruction: string;
  userPrompt: string;
  responseSchema: Schema;
  zodSchema: ZodType<T>;
  normalize?: (raw: unknown) => unknown;
}): Promise<{ data: T; retryCount: number; modelUsed: string }> {
  const apiKey = getGeminiApiKey();
  const ai = new GoogleGenAI({ apiKey });

  const candidateModels = selectCandidateModels(params.modelName);

  let totalRetryCount = 0;
  let lastError: unknown = null;

  for (let passIdx = 0; passIdx < 2; passIdx++) {
    const modelsForPass =
      passIdx === 0 ? candidateModels : [...candidateModels].reverse();

    for (let mIdx = 0; mIdx < modelsForPass.length; mIdx++) {
      const activeModel = modelsForPass[mIdx];
      const maxAttemptsForModel = MAX_SAME_MODEL_RETRIES + 1;

      for (let attempt = 0; attempt < maxAttemptsForModel; attempt++) {
        if (passIdx > 0 || mIdx > 0 || attempt > 0) {
          totalRetryCount++;
          if (attempt > 0) {
            await sleep(900 * Math.pow(2, attempt - 1));
          }
        }

        try {
          const response = await ai.models.generateContent({
            model: activeModel,
            contents: params.userPrompt,
            config: {
              systemInstruction: params.systemInstruction,
              temperature: params.temperature,
              responseMimeType: "application/json",
              responseSchema: params.responseSchema,
              abortSignal: AbortSignal.timeout(GEMINI_TIMEOUT_MS),
              httpOptions: {
                timeout: GEMINI_TIMEOUT_MS,
              },
            },
          });

          const rawText = response.text;
          if (!rawText || !rawText.trim()) {
            throw new GeminiControlledError(
              "Gemini API trả về nội dung rỗng.",
              true
            );
          }

          let parsedJson: unknown;
          try {
            parsedJson = JSON.parse(stripJsonCodeFence(rawText));
          } catch {
            throw new GeminiControlledError(
              "Phản hồi từ Gemini không đúng định dạng JSON hợp lệ.",
              true
            );
          }

          const normalized = params.normalize ? params.normalize(parsedJson) : parsedJson;
          const validated = params.zodSchema.safeParse(normalized);
          if (!validated.success) {
            throw new GeminiControlledError(
              `Dữ liệu AI chưa đạt chuẩn cấu trúc (${validated.error.issues[0]?.message || "schema mismatch"}).`,
              true
            );
          }

          modelRateLimitedUntil.delete(activeModel);
          stickyActiveModel = activeModel;

          return {
            data: validated.data,
            retryCount: totalRetryCount,
            modelUsed: activeModel,
          };
        } catch (err) {
          lastError = err;
          const status = extractStatusCode(err);
          const rateLimited = isRateLimitError(err);

          // Khi chạm giới hạn (429/quota) hoặc model 404/503 -> chuyển ngay sang model còn lại không chờ backoff
          if (rateLimited || status === 503) {
            modelRateLimitedUntil.set(
              activeModel,
              Date.now() + MODEL_RATE_LIMIT_COOLDOWN_MS
            );
            const otherModel = GEMINI_FALLBACK_MODELS.find(
              (m) => m !== activeModel
            );
            if (otherModel) {
              stickyActiveModel = otherModel;
            }
            break;
          }
          if (status === 404) {
            break;
          }
          if (!isRetryableError(err) || attempt === maxAttemptsForModel - 1) {
            break;
          }
        }
      }

      if (!isModelFallbackEligible(lastError)) {
        const friendly = sanitizeErrorMessage(lastError);
        throw new GeminiControlledError(friendly, false);
      }
    }

    // Nếu cả 2 model đều dính 429 ở lượt đầu -> chờ ngắn 1.2s rồi đảo lại lượt thứ 2
    if (passIdx === 0 && isRateLimitError(lastError)) {
      await sleep(RATE_LIMIT_ROUND_TRIP_DELAY_MS);
      continue;
    }
    break;
  }

  const friendly = sanitizeErrorMessage(lastError);
  throw new GeminiControlledError(friendly, false);
}

export async function callGeminiOrientationAnalysis(params: {
  modelName: string;
  temperature: number;
  systemPrompt: string;
  userPrompt: string;
}): Promise<{
  data: IAiOrientationResultDTO;
  retryCount: number;
  modelUsed: string;
}> {
  return generateStructuredJsonWithRetry<IAiOrientationResultDTO>({
    modelName: params.modelName,
    temperature: params.temperature,
    systemInstruction: params.systemPrompt,
    userPrompt: params.userPrompt,
    responseSchema: GEMINI_ORIENTATION_RESPONSE_SCHEMA,
    zodSchema: aiOrientationResultSchema as ZodType<IAiOrientationResultDTO>,
    normalize: normalizeOrientationPayload,
  });
}

export async function callGeminiRoadmapGeneration(params: {
  modelName: string;
  temperature: number;
  systemPrompt: string;
  userPrompt: string;
}): Promise<{
  data: AiRoadmapValidated;
  retryCount: number;
  modelUsed: string;
}> {
  return generateStructuredJsonWithRetry<AiRoadmapValidated>({
    modelName: params.modelName,
    temperature: params.temperature,
    systemInstruction: params.systemPrompt,
    userPrompt: params.userPrompt,
    responseSchema: GEMINI_ROADMAP_RESPONSE_SCHEMA,
    zodSchema: aiRoadmapSchema as ZodType<AiRoadmapValidated>,
    normalize: normalizeRoadmapPayload,
  });
}

export function toFriendlyGeminiError(err: unknown): string {
  return sanitizeErrorMessage(err);
}

