import { Types } from "mongoose";
import {
  ACADEMIC_YEARS,
  AI_ANALYSIS_STATUS,
  DEFAULT_GEMINI_MODEL,
  GEMINI_MODELS,
  NOTIFICATION_CHANNELS,
  NOTIFICATION_TYPES,
  resolveAllowedGeminiModel,
  SYSTEM_PROMPT_KEYS,
  SystemPromptKey,
} from "@/constants";
import { DEFAULT_SYSTEM_PROMPTS } from "@/constants/aiPrompts";
import { formatReadableAnswer } from "@/lib/assessment-logic";
import {
  callGeminiOrientationAnalysis,
  toFriendlyGeminiError,
} from "@/lib/gemini";
import { AiOrientationAnalysis, IAiOrientationAnalysisDocument } from "@/models/AiOrientationAnalysis";
import { AssessmentQuestion } from "@/models/AssessmentQuestion";
import { AssessmentSubmission } from "@/models/AssessmentSubmission";
import { Notification } from "@/models/Notification";
import { Questionnaire } from "@/models/Questionnaire";
import { StudentProfile } from "@/models/StudentProfile";
import { ISystemPromptDocument, SystemPrompt } from "@/models/SystemPrompt";
import { User } from "@/models/User";
import type {
  IAiOrientationAnalysisDTO,
  ISystemPromptDTO,
} from "@/types";

export function serializeSystemPrompt(
  doc: Pick<
    ISystemPromptDocument,
    | "_id"
    | "key"
    | "name"
    | "promptContent"
    | "modelName"
    | "temperature"
    | "version"
    | "isActive"
    | "updatedByAdminId"
    | "createdAt"
    | "updatedAt"
  >
): ISystemPromptDTO {
  return {
    _id: String(doc._id),
    key: doc.key,
    name: doc.name,
    promptContent: doc.promptContent,
    modelName: doc.modelName,
    temperature: doc.temperature,
    version: doc.version,
    isActive: Boolean(doc.isActive),
    updatedByAdminId: doc.updatedByAdminId ? String(doc.updatedByAdminId) : undefined,
    createdAt: doc.createdAt ? new Date(doc.createdAt).toISOString() : undefined,
    updatedAt: doc.updatedAt ? new Date(doc.updatedAt).toISOString() : undefined,
  };
}

export function serializeAiAnalysis(
  doc: Pick<
    IAiOrientationAnalysisDocument,
    | "_id"
    | "studentId"
    | "submissionId"
    | "promptVersion"
    | "modelUsed"
    | "inputSnapshot"
    | "status"
    | "errorMessage"
    | "retryCount"
    | "analysisResult"
    | "customCareerOptions"
    | "regenerationOfId"
    | "createdAt"
    | "updatedAt"
  >
): IAiOrientationAnalysisDTO {
  return {
    _id: String(doc._id),
    studentId: String(doc.studentId),
    submissionId: String(doc.submissionId),
    promptVersion: doc.promptVersion,
    modelUsed: doc.modelUsed,
    inputSnapshot: doc.inputSnapshot || {},
    status: doc.status,
    errorMessage: doc.errorMessage || undefined,
    retryCount: doc.retryCount || 0,
    analysisResult: doc.analysisResult || null,
    customCareerOptions: Array.isArray(doc.customCareerOptions)
      ? doc.customCareerOptions
      : [],
    regenerationOfId: doc.regenerationOfId ? String(doc.regenerationOfId) : null,
    createdAt: new Date(doc.createdAt).toISOString(),
    updatedAt: new Date(doc.updatedAt).toISOString(),
  };
}

export async function ensureDefaultSystemPrompts(
  adminId?: Types.ObjectId | string
): Promise<void> {
  // Tự động chuẩn hóa các bản prompt cũ ngoài danh sách 2 model được phép về model mặc định
  await SystemPrompt.updateMany(
    { modelName: { $nin: [...GEMINI_MODELS] } },
    { $set: { modelName: DEFAULT_GEMINI_MODEL } }
  );

  const keys = Object.values(SYSTEM_PROMPT_KEYS);
  for (const key of keys) {
    const existingCount = await SystemPrompt.countDocuments({ key });
    if (existingCount === 0) {
      const preset = DEFAULT_SYSTEM_PROMPTS[key];
      await SystemPrompt.create({
        key: preset.key,
        name: preset.name,
        promptContent: preset.promptContent,
        modelName: preset.modelName,
        temperature: preset.temperature,
        version: 1,
        isActive: true,
        updatedByAdminId:
          adminId && Types.ObjectId.isValid(String(adminId))
            ? new Types.ObjectId(String(adminId))
            : null,
      });
    }
  }
}

export async function getActiveSystemPrompt(key: SystemPromptKey): Promise<{
  promptContent: string;
  modelName: string;
  temperature: number;
  version: number;
}> {
  const active = await SystemPrompt.findOne({ key, isActive: true })
    .sort({ version: -1 })
    .lean();

  if (active) {
    return {
      promptContent: active.promptContent,
      modelName: resolveAllowedGeminiModel(active.modelName),
      temperature: active.temperature,
      version: active.version,
    };
  }

  // Auto-seed defaults cleanly if none active/seeded yet, with direct constant fallback
  await ensureDefaultSystemPrompts().catch(() => {});
  const retryActive = await SystemPrompt.findOne({ key, isActive: true })
    .sort({ version: -1 })
    .lean();
  if (retryActive) {
    return {
      promptContent: retryActive.promptContent,
      modelName: resolveAllowedGeminiModel(retryActive.modelName),
      temperature: retryActive.temperature,
      version: retryActive.version,
    };
  }

  const fallback = DEFAULT_SYSTEM_PROMPTS[key];
  return {
    promptContent: fallback.promptContent,
    modelName: resolveAllowedGeminiModel(fallback.modelName),
    temperature: fallback.temperature,
    version: 0,
  };
}

function academicYearLabel(value?: string): string {
  const found = ACADEMIC_YEARS.find((y) => y.value === value);
  return found ? found.label : value || "Chưa xác định";
}

/**
 * Tổng hợp dữ liệu đầu vào chuẩn hóa cho Gemini AI (AI01).
 * Xử lý an toàn khi sinh viên mới đăng ký chưa có achievements, softSkills, hardSkills hay bio.
 */
export async function buildAiOrientationInput(
  studentId: string,
  submissionId: string
): Promise<{
  profileSummary: Record<string, unknown>;
  answersSummary: Array<{
    code: string;
    questionText: string;
    questionType: string;
    answerText: string;
    rawValue: unknown;
  }>;
  questionnaireTitle: string;
  promptText: string;
}> {
  const [user, profile, submission] = await Promise.all([
    User.findById(studentId).select("name email").lean(),
    StudentProfile.findOne({ userId: studentId }).lean(),
    AssessmentSubmission.findOne({
      _id: new Types.ObjectId(submissionId),
      studentId: new Types.ObjectId(studentId),
    }).lean(),
  ]);

  if (!submission) {
    throw new Error("Không tìm thấy bài khảo sát để phân tích.");
  }

  const [questionnaire, questions] = await Promise.all([
    Questionnaire.findById(submission.questionnaireId).select("title").lean(),
    AssessmentQuestion.find({ questionnaireId: submission.questionnaireId }).lean(),
  ]);

  const questionMap = new Map(questions.map((q) => [q._id.toString(), q]));

  const hardSkills = Array.isArray(profile?.hardSkills)
    ? profile.hardSkills.filter(Boolean)
    : [];
  const softSkills = Array.isArray(profile?.softSkills)
    ? profile.softSkills.filter(Boolean)
    : [];
  const achievements = Array.isArray(profile?.achievements)
    ? profile.achievements.filter(Boolean)
    : [];

  const profileSummary = {
    fullName: profile?.fullName || user?.name || "Sinh viên",
    birthYear: profile?.birthYear || null,
    academicYear: academicYearLabel(profile?.academicYear),
    academicYearCode: profile?.academicYear || null,
    university: profile?.university || "Chưa cập nhật",
    major: profile?.major || "Chưa cập nhật",
    bio: profile?.bio?.trim() || "Chưa cập nhật (sinh viên mới onboarding)",
    hardSkills,
    softSkills,
    achievements,
    hasAdditionalProfileDetails:
      hardSkills.length > 0 || softSkills.length > 0 || achievements.length > 0,
  };

  const answersSummary = (submission.answers || []).map((ans) => {
    const qDoc = questionMap.get(ans.questionId);
    const answerText = qDoc
      ? formatReadableAnswer(
          {
            questionType: qDoc.questionType,
            options: qDoc.options,
            scaleConfig: qDoc.scaleConfig,
          },
          ans.value
        )
      : Array.isArray(ans.value)
        ? ans.value.join("; ")
        : String(ans.value);

    return {
      code: ans.questionCode,
      questionText: ans.questionTextSnapshot,
      questionType: ans.questionType,
      answerText,
      rawValue: ans.value,
    };
  });

  const formattedProfileLines = [
    `- Họ tên: ${profileSummary.fullName}`,
    `- Năm sinh: ${profileSummary.birthYear ?? "Chưa cập nhật"}`,
    `- Trường đại học: ${profileSummary.university}`,
    `- Ngành học: ${profileSummary.major}`,
    `- Trình độ năm học: ${profileSummary.academicYear}`,
    `- Giới thiệu bản thân: ${profileSummary.bio}`,
    `- Kỹ năng chuyên môn đã khai báo: ${
      hardSkills.length > 0 ? hardSkills.join(", ") : "Chưa cập nhật (đang ở bước onboarding đầu tiên)"
    }`,
    `- Kỹ năng mềm đã khai báo: ${
      softSkills.length > 0 ? softSkills.join(", ") : "Chưa cập nhật (đang ở bước onboarding đầu tiên)"
    }`,
    `- Thành tích / Chứng nhận đã khai báo: ${
      achievements.length > 0 ? achievements.join(", ") : "Chưa cập nhật (đang ở bước onboarding đầu tiên)"
    }`,
  ];

  const formattedAnswerLines = answersSummary.map(
    (item, idx) =>
      `${idx + 1}. [${item.code} - ${item.questionType}] ${item.questionText}\n   -> Trả lời: ${item.answerText}`
  );

  const questionnaireTitle =
    questionnaire?.title || "Khảo sát Định hướng Cá nhân UNERA";

  const promptText = [
    `=== HỒ SƠ SINH VIÊN ===`,
    ...formattedProfileLines,
    ``,
    `=== KẾT QUẢ BÀI KHẢO SÁT: "${questionnaireTitle}" (Lần làm #${submission.attemptNumber}) ===`,
    ...formattedAnswerLines,
    ``,
    `Hãy phân tích toàn diện dữ liệu trên và trả về JSON theo đúng cấu trúc schema đã quy định.`,
  ].join("\n");

  return {
    profileSummary,
    answersSummary,
    questionnaireTitle,
    promptText,
  };
}

/**
 * Thực thi phân tích định hướng AI bằng Google Gemini (AI01–AI11).
 * Nếu lỗi/timeout: bảo toàn nguyên vẹn AssessmentSubmission và lưu AiOrientationAnalysis ở trạng thái FAILED.
 */
export async function runOrientationAnalysis(params: {
  studentId: string;
  submissionId: string;
  regenerationOfId?: string | null;
}): Promise<{
  ok: boolean;
  analysis: IAiOrientationAnalysisDTO;
  errorMessage?: string;
}> {
  const builtInput = await buildAiOrientationInput(
    params.studentId,
    params.submissionId
  );
  const promptConfig = await getActiveSystemPrompt(
    SYSTEM_PROMPT_KEYS.ORIENTATION_ANALYSIS
  );

  const analysisDoc = await AiOrientationAnalysis.create({
    studentId: new Types.ObjectId(params.studentId),
    submissionId: new Types.ObjectId(params.submissionId),
    promptVersion: promptConfig.version,
    modelUsed: promptConfig.modelName,
    inputSnapshot: {
      profileSummary: builtInput.profileSummary,
      answersSummary: builtInput.answersSummary,
      questionnaireTitle: builtInput.questionnaireTitle,
    },
    status: AI_ANALYSIS_STATUS.PROCESSING,
    retryCount: 0,
    regenerationOfId:
      params.regenerationOfId && Types.ObjectId.isValid(params.regenerationOfId)
        ? new Types.ObjectId(params.regenerationOfId)
        : null,
  });

  try {
    const aiResp = await callGeminiOrientationAnalysis({
      modelName: promptConfig.modelName,
      temperature: promptConfig.temperature,
      systemPrompt: promptConfig.promptContent,
      userPrompt: builtInput.promptText,
    });

    analysisDoc.status = AI_ANALYSIS_STATUS.COMPLETED;
    analysisDoc.analysisResult = aiResp.data;
    analysisDoc.retryCount = aiResp.retryCount;
    analysisDoc.modelUsed = aiResp.modelUsed;
    analysisDoc.errorMessage = undefined;
    await analysisDoc.save();

    // Thông báo in-app không chặn luồng chính
    const primaryDir =
      aiResp.data.orientationCompatibility.find((o) => o.isPrimaryRecommendation)
        ?.directionTitle ||
      aiResp.data.orientationCompatibility[0]?.directionTitle ||
      "Định hướng cá nhân";

    await Notification.create({
      recipientId: params.studentId,
      type: NOTIFICATION_TYPES.AI_ANALYSIS_READY,
      title: "Kết quả phân tích định hướng AI đã sẵn sàng",
      message: `Hệ thống Gemini AI đã hoàn tất phân tích với hướng đề xuất nổi bật: ${primaryDir}.`,
      link: `/onboarding/result/${params.submissionId}`,
      isRead: false,
      channel: NOTIFICATION_CHANNELS.IN_APP,
    }).catch(() => {});

    return {
      ok: true,
      analysis: serializeAiAnalysis(analysisDoc),
    };
  } catch (err) {
    const friendlyMsg = toFriendlyGeminiError(err);
    analysisDoc.status = AI_ANALYSIS_STATUS.FAILED;
    analysisDoc.errorMessage = friendlyMsg;
    await analysisDoc.save();

    return {
      ok: false,
      analysis: serializeAiAnalysis(analysisDoc),
      errorMessage: friendlyMsg,
    };
  }
}

