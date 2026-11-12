import crypto from "crypto";
import { Types } from "mongoose";
import {
  AI_ANALYSIS_STATUS,
  ASSESSMENT_QUESTION_TYPES,
  ASSESSMENT_SUBMISSION_STATUS,
  CONDITION_MATCH_TYPES,
  CONDITION_OPERATORS,
  DEFAULT_GEMINI_MODEL,
  ORIENTATION_DIRECTION_CODES,
  ROADMAP_GOAL_CATEGORIES,
  ROADMAP_GOAL_PRIORITIES,
  ROADMAP_GOAL_STATUSES,
  ROADMAP_SOURCE,
  ROADMAP_STATUS,
} from "@/constants";
import { calculateRoadmapProgress } from "@/lib/roadmap-utils";
import { ensureDefaultSystemPrompts } from "@/lib/orientation-ai";
import { ensureRoadmapCollectionClean } from "@/lib/roadmap-service";
import { AiOrientationAnalysis } from "@/models/AiOrientationAnalysis";
import {
  AssessmentQuestion,
  IAssessmentQuestionDocument,
} from "@/models/AssessmentQuestion";
import {
  AssessmentSubmission,
  IAssessmentSubmissionDocument,
} from "@/models/AssessmentSubmission";
import { IQuestionnaireDocument, Questionnaire } from "@/models/Questionnaire";
import { Roadmap } from "@/models/Roadmap";
import type {
  IAiOrientationResultDTO,
  IAssessmentQuestionDTO,
  IAssessmentSubmissionDTO,
  IQuestionnaireDTO,
} from "@/types";

export function serializeQuestionnaire(
  doc: Pick<
    IQuestionnaireDocument,
    | "_id"
    | "title"
    | "description"
    | "version"
    | "isActive"
    | "isDeleted"
    | "createdByAdminId"
    | "createdAt"
    | "updatedAt"
  >,
  extras?: { questionCount?: number; submissionCount?: number }
): IQuestionnaireDTO {
  return {
    _id: String(doc._id),
    title: doc.title,
    description: doc.description || "",
    version: doc.version,
    isActive: Boolean(doc.isActive),
    isDeleted: Boolean(doc.isDeleted),
    createdByAdminId: doc.createdByAdminId ? String(doc.createdByAdminId) : undefined,
    questionCount: extras?.questionCount,
    submissionCount: extras?.submissionCount,
    createdAt: doc.createdAt ? new Date(doc.createdAt).toISOString() : undefined,
    updatedAt: doc.updatedAt ? new Date(doc.updatedAt).toISOString() : undefined,
  };
}

export function serializeQuestion(
  doc: Pick<
    IAssessmentQuestionDocument,
    | "_id"
    | "questionnaireId"
    | "code"
    | "questionText"
    | "description"
    | "questionType"
    | "isRequired"
    | "allowCustomOption"
    | "order"
    | "options"
    | "scaleConfig"
    | "textConfig"
    | "multipleConfig"
    | "conditionalLogic"
    | "createdAt"
    | "updatedAt"
  >
): IAssessmentQuestionDTO {
  const isChoice =
    doc.questionType === ASSESSMENT_QUESTION_TYPES.SINGLE_CHOICE ||
    doc.questionType === ASSESSMENT_QUESTION_TYPES.MULTIPLE_CHOICE;

  return {
    _id: String(doc._id),
    questionnaireId: String(doc.questionnaireId),
    code: doc.code,
    questionText: doc.questionText,
    description: doc.description || "",
    questionType: doc.questionType,
    isRequired: Boolean(doc.isRequired),
    allowCustomOption: isChoice ? doc.allowCustomOption !== false : false,
    order: doc.order,
    options: Array.isArray(doc.options)
      ? doc.options
          .slice()
          .sort((a, b) => a.order - b.order)
          .map((o) => ({
            id: o.id,
            label: o.label,
            value: o.value,
            order: o.order,
          }))
      : [],
    scaleConfig: doc.scaleConfig
      ? {
          min: doc.scaleConfig.min ?? 1,
          max: doc.scaleConfig.max ?? 5,
          step: doc.scaleConfig.step ?? 1,
          minLabel: doc.scaleConfig.minLabel || "Hoàn toàn không đồng ý",
          maxLabel: doc.scaleConfig.maxLabel || "Rất đồng ý",
        }
      : undefined,
    textConfig: doc.textConfig
      ? {
          placeholder: doc.textConfig.placeholder || "Nhập câu trả lời...",
          maxLength: doc.textConfig.maxLength ?? 1000,
          multiline: Boolean(doc.textConfig.multiline),
        }
      : undefined,
    multipleConfig: doc.multipleConfig
      ? {
          minSelect: doc.multipleConfig.minSelect,
          maxSelect: doc.multipleConfig.maxSelect,
        }
      : undefined,
    conditionalLogic: doc.conditionalLogic
      ? {
          enabled: Boolean(doc.conditionalLogic.enabled),
          matchType: doc.conditionalLogic.matchType,
          rules: (doc.conditionalLogic.rules || []).map((r) => ({
            sourceQuestionId: r.sourceQuestionId,
            operator: r.operator,
            value: r.value,
          })),
        }
      : null,
    createdAt: doc.createdAt ? new Date(doc.createdAt).toISOString() : undefined,
    updatedAt: doc.updatedAt ? new Date(doc.updatedAt).toISOString() : undefined,
  };
}

export function serializeSubmission(
  doc: Pick<
    IAssessmentSubmissionDocument,
    | "_id"
    | "studentId"
    | "questionnaireId"
    | "status"
    | "attemptNumber"
    | "answers"
    | "currentStepIndex"
    | "lastSavedAt"
    | "submittedAt"
    | "createdAt"
    | "updatedAt"
  >,
  questionnaireTitle?: string
): IAssessmentSubmissionDTO {
  return {
    _id: String(doc._id),
    studentId: String(doc.studentId),
    questionnaireId: String(doc.questionnaireId),
    questionnaireTitle,
    status: doc.status,
    attemptNumber: doc.attemptNumber,
    answers: (doc.answers || []).map((a) => ({
      questionId: a.questionId,
      questionCode: a.questionCode,
      questionTextSnapshot: a.questionTextSnapshot,
      questionType: a.questionType,
      value: a.value,
    })),
    currentStepIndex: doc.currentStepIndex || 0,
    lastSavedAt: doc.lastSavedAt ? new Date(doc.lastSavedAt).toISOString() : null,
    submittedAt: doc.submittedAt ? new Date(doc.submittedAt).toISOString() : null,
    createdAt: doc.createdAt ? new Date(doc.createdAt).toISOString() : undefined,
    updatedAt: doc.updatedAt ? new Date(doc.updatedAt).toISOString() : undefined,
  };
}

/**
 * Khởi tạo Bộ câu hỏi mặc định chuẩn Module 08 (đủ 4 loại + rẽ nhánh điều kiện)
 * nếu hệ thống chưa có bộ câu hỏi nào.
 */
export async function ensureDefaultQuestionnaire(
  adminId?: Types.ObjectId | string
): Promise<{
  questionnaire: IQuestionnaireDocument;
  questions: IAssessmentQuestionDocument[];
}> {
  const existing = await Questionnaire.findOne({ isDeleted: false }).sort({
    isActive: -1,
    createdAt: -1,
  });

  if (existing) {
    const questions = await AssessmentQuestion.find({
      questionnaireId: existing._id,
    }).sort({ order: 1 });
    return { questionnaire: existing, questions };
  }

  const questionnaire = await Questionnaire.create({
    title: "Khảo sát Định hướng Nghề nghiệp & Lộ trình Đại học UNERA 2026",
    description:
      "Bộ câu hỏi động tích hợp nhánh rẽ thông minh giúp AI Gemini phân tích sở thích, năng lực nền tảng và kiến tạo lộ trình 4 năm phù hợp ngay từ lần đăng ký đầu tiên.",
    version: 1,
    isActive: true,
    isDeleted: false,
    createdByAdminId:
      adminId && Types.ObjectId.isValid(String(adminId))
        ? new Types.ObjectId(String(adminId))
        : undefined,
  });

  const q1 = await AssessmentQuestion.create({
    questionnaireId: questionnaire._id,
    code: "Q1_MAIN_GOAL",
    questionText:
      "Mục tiêu ưu tiên lớn nhất của bạn trong 2–4 năm đại học là gì?",
    description:
      "Lựa chọn phản ánh mong muốn rõ nét nhất ở thời điểm hiện tại của bạn.",
    questionType: ASSESSMENT_QUESTION_TYPES.SINGLE_CHOICE,
    isRequired: true,
    order: 1,
    options: [
      {
        id: "opt_goal_abroad",
        label: "Săn học bổng Du học (Trao đổi sinh viên hoặc Thạc sĩ/Tiến sĩ quốc tế)",
        value: "STUDY_ABROAD",
        order: 1,
      },
      {
        id: "opt_goal_career",
        label: "Đi làm ngay tại doanh nghiệp / tập đoàn đa quốc gia hoặc Management Trainee",
        value: "CAREER_INDUSTRY",
        order: 2,
      },
      {
        id: "opt_goal_research",
        label: "Nghiên cứu khoa học chuyên sâu & công bố học thuật",
        value: "RESEARCH",
        order: 3,
      },
      {
        id: "opt_goal_startup",
        label: "Khởi nghiệp, xây dựng dự án đổi mới sáng tạo hoặc freelance chuyên nghiệp",
        value: "STARTUP",
        order: 4,
      },
      {
        id: "opt_goal_explore",
        label: "Chưa chốt hướng đi cụ thể — muốn khám phá thế mạnh & trải nghiệm đa dạng",
        value: "UNDECIDED",
        order: 5,
      },
    ],
    conditionalLogic: null,
  });

  const q2 = await AssessmentQuestion.create({
    questionnaireId: questionnaire._id,
    code: "Q2_ABROAD_FOCUS",
    questionText:
      "Bạn ưu tiên khu vực du học và bậc học bổng mục tiêu nào nhất?",
    description:
      "Câu hỏi rẽ nhánh hiển thị riêng khi bạn chọn định hướng Săn học bổng Du học.",
    questionType: ASSESSMENT_QUESTION_TYPES.SINGLE_CHOICE,
    isRequired: true,
    order: 2,
    options: [
      {
        id: "opt_abroad_eu_uk",
        label: "Châu Âu / Vương quốc Anh (Chevening, Erasmus+, học bổng Chính phủ)",
        value: "EUROPE_UK",
        order: 1,
      },
      {
        id: "opt_abroad_us_au",
        label: "Mỹ / Úc / Canada (Fulbright, Australia Awards, Graduate Assistantship)",
        value: "US_AU_CA",
        order: 2,
      },
      {
        id: "opt_abroad_asia",
        label: "Châu Á (Nhật Bản MEXT, Hàn Quốc GKS, Singapore, Trung Quốc CSC)",
        value: "ASIA_TOP",
        order: 3,
      },
      {
        id: "opt_abroad_exchange",
        label: "Tập trung trước vào chương trình trao đổi ngắn hạn 1–2 học kỳ",
        value: "EXCHANGE_FIRST",
        order: 4,
      },
    ],
    conditionalLogic: {
      enabled: true,
      matchType: CONDITION_MATCH_TYPES.ALL,
      rules: [
        {
          sourceQuestionId: q1._id.toString(),
          operator: CONDITION_OPERATORS.EQUALS,
          value: "STUDY_ABROAD",
        },
      ],
    },
  });

  const q3 = await AssessmentQuestion.create({
    questionnaireId: questionnaire._id,
    code: "Q3_CAREER_ENV",
    questionText: "Bạn hứng thú nhất với môi trường làm việc nào sau tốt nghiệp?",
    description:
      "Câu hỏi rẽ nhánh hiển thị riêng khi bạn chọn định hướng Đi làm ngay / Doanh nghiệp.",
    questionType: ASSESSMENT_QUESTION_TYPES.SINGLE_CHOICE,
    isRequired: true,
    order: 3,
    options: [
      {
        id: "opt_env_mnc",
        label: "Tập đoàn đa quốc gia / Chương trình Quản trị viên tập sự (MT)",
        value: "MNC_MT",
        order: 1,
      },
      {
        id: "opt_env_tech",
        label: "Công ty Công nghệ / Product / Agency sáng tạo tốc độ cao",
        value: "TECH_PRODUCT",
        order: 2,
      },
      {
        id: "opt_env_edu_gov",
        label: "Giáo dục quốc tế, Tổ chức phi chính phủ (NGO) hoặc Cơ quan đối ngoại",
        value: "EDU_NGO_DIPLOMACY",
        order: 3,
      },
    ],
    conditionalLogic: {
      enabled: true,
      matchType: CONDITION_MATCH_TYPES.ALL,
      rules: [
        {
          sourceQuestionId: q1._id.toString(),
          operator: CONDITION_OPERATORS.EQUALS,
          value: "CAREER_INDUSTRY",
        },
      ],
    },
  });

  const q4 = await AssessmentQuestion.create({
    questionnaireId: questionnaire._id,
    code: "Q4_INTEREST_DOMAINS",
    questionText:
      "Những nhóm lĩnh vực hoặc vai trò nào khiến bạn muốn tìm hiểu và thử sức nhất?",
    description: "Chọn tối thiểu 1 và tối đa 3 lĩnh vực phù hợp nhất với bạn.",
    questionType: ASSESSMENT_QUESTION_TYPES.MULTIPLE_CHOICE,
    isRequired: true,
    order: 4,
    options: [
      {
        id: "opt_dom_lang_teach",
        label: "Giảng dạy, Biên phiên dịch & Ngôn ngữ ứng dụng",
        value: "LANGUAGE_EDUCATION",
        order: 1,
      },
      {
        id: "opt_dom_mkt_comm",
        label: "Marketing, Truyền thông, Thương hiệu & Content Creative",
        value: "MARKETING_MEDIA",
        order: 2,
      },
      {
        id: "opt_dom_tech_ux",
        label: "Công nghệ, UX/UI Design, Quản lý sản phẩm (Product) & EdTech",
        value: "TECH_UX_PRODUCT",
        order: 3,
      },
      {
        id: "opt_dom_biz_hr",
        label: "Kinh doanh quốc tế, Nhân sự (HR), Tư vấn & Vận hành",
        value: "BUSINESS_HR",
        order: 4,
      },
      {
        id: "opt_dom_data_research",
        label: "Phân tích dữ liệu, Nghiên cứu xã hội & Chính sách công",
        value: "DATA_RESEARCH",
        order: 5,
      },
    ],
    multipleConfig: { minSelect: 1, maxSelect: 3 },
    conditionalLogic: null,
  });

  const q5 = await AssessmentQuestion.create({
    questionnaireId: questionnaire._id,
    code: "Q5_LANGUAGE_CONFIDENCE",
    questionText:
      "Mức độ tự tin hiện tại của bạn với năng lực ngoại ngữ (IELTS / ngoại ngữ chuyên ngành)?",
    description: "Đánh giá thực tế từ 1 (mới bắt đầu) đến 5 (sử dụng thành thạo).",
    questionType: ASSESSMENT_QUESTION_TYPES.SCALE,
    isRequired: true,
    order: 5,
    scaleConfig: {
      min: 1,
      max: 5,
      step: 1,
      minLabel: "Cần củng cố nền tảng",
      maxLabel: "Tự tin sử dụng học thuật & công việc",
    },
    conditionalLogic: null,
  });

  const q6 = await AssessmentQuestion.create({
    questionnaireId: questionnaire._id,
    code: "Q6_WORK_STYLE",
    questionText:
      "Bạn đánh giá mức độ yêu thích việc dẫn dắt đội nhóm, tổ chức hoạt động CLB/dự án như thế nào?",
    description: "Giúp AI cân đối tỷ trọng mục tiêu học thuật và trải nghiệm lãnh đạo.",
    questionType: ASSESSMENT_QUESTION_TYPES.SCALE,
    isRequired: true,
    order: 6,
    scaleConfig: {
      min: 1,
      max: 5,
      step: 1,
      minLabel: "Thích tập trung chuyên môn độc lập",
      maxLabel: "Hứng thú dẫn dắt & kết nối đội nhóm",
    },
    conditionalLogic: null,
  });

  const q7 = await AssessmentQuestion.create({
    questionnaireId: questionnaire._id,
    code: "Q7_PRIORITY_CERT",
    questionText:
      "Chứng chỉ ngoại ngữ hoặc kỹ năng cụ thể nào bạn dự định ưu tiên trong 12 tháng tới (nếu có)?",
    description: "Ví dụ: IELTS 7.5, HSK 5, Google UX Certificate, MOS Excel...",
    questionType: ASSESSMENT_QUESTION_TYPES.TEXT,
    isRequired: false,
    order: 7,
    textConfig: {
      placeholder: "Nhập tên chứng chỉ hoặc kỹ năng bạn đang nhắm tới (có thể bỏ trống)...",
      maxLength: 200,
      multiline: false,
    },
    conditionalLogic: null,
  });

  const q8 = await AssessmentQuestion.create({
    questionnaireId: questionnaire._id,
    code: "Q8_CONTEXT_NOTES",
    questionText:
      "Hãy chia sẻ ngắn gọn về sở thích, điểm mạnh tự nhận thấy hoặc băn khoăn lớn nhất của bạn lúc này",
    description:
      "Do hồ sơ ban đầu của bạn có thể chưa có đủ thành tích hoặc kỹ năng mềm, câu trả lời này giúp AI Gemini tư vấn sát với hoàn cảnh riêng của bạn.",
    questionType: ASSESSMENT_QUESTION_TYPES.TEXT,
    isRequired: true,
    order: 8,
    textConfig: {
      placeholder:
        "VD: Mình đang học năm nhất ngành Ngôn ngữ Anh, thích công nghệ/thiết kế trải nghiệm nhưng chưa từng tham gia dự án hay cuộc thi lớn nào...",
      maxLength: 1000,
      multiline: true,
    },
    conditionalLogic: null,
  });

  return {
    questionnaire,
    questions: [q1, q2, q3, q4, q5, q6, q7, q8],
  };
}

/**
 * Seed trọn bộ Module 08 cho `/api/seed` (Development):
 * - Questionnaire v1 + 8 câu hỏi
 * - System Prompts v1 (ORIENTATION_ANALYSIS & ROADMAP_GENERATION)
 * - AssessmentSubmission + AiOrientationAnalysis + 4-Year Roadmap mẫu cho tài khoản sinh viên mặc định
 */
export async function seedDefaultModule08Data(
  adminId: Types.ObjectId,
  studentId: Types.ObjectId
): Promise<{
  questionnairesCount: number;
  questionsCount: number;
  promptsCount: number;
  roadmapsCount: number;
}> {
  await ensureRoadmapCollectionClean();

  await Promise.all([
    AiOrientationAnalysis.deleteMany({ studentId }),
    AssessmentSubmission.deleteMany({ studentId }),
    Roadmap.deleteMany({}),
    AssessmentQuestion.deleteMany({}),
    Questionnaire.deleteMany({}),
  ]);

  await ensureDefaultSystemPrompts(adminId);
  const { questionnaire, questions } = await ensureDefaultQuestionnaire(adminId);

  const q1 = questions[0];
  const q2 = questions[1];
  const q4 = questions[3];
  const q5 = questions[4];
  const q6 = questions[5];
  const q7 = questions[6];
  const q8 = questions[7];

  const submission = await AssessmentSubmission.create({
    studentId,
    questionnaireId: questionnaire._id,
    status: ASSESSMENT_SUBMISSION_STATUS.SUBMITTED,
    attemptNumber: 1,
    currentStepIndex: 6,
    lastSavedAt: new Date(),
    submittedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    answers: [
      {
        questionId: q1._id.toString(),
        questionCode: q1.code,
        questionTextSnapshot: q1.questionText,
        questionType: q1.questionType,
        value: "STUDY_ABROAD",
      },
      {
        questionId: q2._id.toString(),
        questionCode: q2.code,
        questionTextSnapshot: q2.questionText,
        questionType: q2.questionType,
        value: "EUROPE_UK",
      },
      {
        questionId: q4._id.toString(),
        questionCode: q4.code,
        questionTextSnapshot: q4.questionText,
        questionType: q4.questionType,
        value: ["TECH_UX_PRODUCT", "DATA_RESEARCH"],
      },
      {
        questionId: q5._id.toString(),
        questionCode: q5.code,
        questionTextSnapshot: q5.questionText,
        questionType: q5.questionType,
        value: 4,
      },
      {
        questionId: q6._id.toString(),
        questionCode: q6.code,
        questionTextSnapshot: q6.questionText,
        questionType: q6.questionType,
        value: 4,
      },
      {
        questionId: q7._id.toString(),
        questionCode: q7.code,
        questionTextSnapshot: q7.questionText,
        questionType: q7.questionType,
        value: "IELTS 8.0 & Google UX Design Certificate",
      },
      {
        questionId: q8._id.toString(),
        questionCode: q8.code,
        questionTextSnapshot: q8.questionText,
        questionType: q8.questionType,
        value:
          "Định hướng kết hợp nền tảng Ngôn ngữ Anh với thiết kế sản phẩm số / EdTech và săn học bổng Thạc sĩ tại Châu Âu.",
      },
    ],
  });

  const sampleAnalysisResult: IAiOrientationResultDTO = {
    overallSummary:
      "Bạn sở hữu nền tảng kết hợp hiếm có giữa tư duy ngôn ngữ - giao tiếp học thuật và hứng thú mạnh mẽ với Công nghệ / UX Product. Định hướng nổi bật nhất là phát triển hồ sơ Nghiên cứu ứng dụng & Công nghệ Giáo dục (EdTech/HCI) để săn học bổng Thạc sĩ tại Châu Âu, đồng thời mở rộng cơ hội thực tập Product/UX tại các tập đoàn công nghệ.",
    profileEvaluation: {
      interests: [
        "Công nghệ giáo dục (EdTech) & Thiết kế trải nghiệm người dùng (UX/UI)",
        "Nghiên cứu định lượng và phân tích hành vi học tập",
        "Môi trường học thuật quốc tế tại Châu Âu / Vương quốc Anh",
      ],
      strengths: [
        "Nền tảng ngoại ngữ tốt (IELTS 7.5) giúp tiếp cận trực tiếp tài liệu chuyên ngành quốc tế",
        "Đã có trải nghiệm thực tế bước đầu về Figma / UI-UX và Nghiên cứu khoa học cấp Trường",
        "Tinh thần chủ động dẫn dắt và phối hợp tốt trong nhóm dự án",
      ],
      areasForImprovement: [
        "Bổ sung portfolio case study sản phẩm EdTech hoặc UX Research hoàn chỉnh có số liệu đo lường",
        "Chuẩn hóa hồ sơ bài báo khoa học hoặc bản thảo đề cương nghiên cứu (Research Proposal) cho học bổng Thạc sĩ",
        "Mở rộng kết nối Mentor quốc tế và giảng viên hướng dẫn xin thư giới thiệu học thuật",
      ],
    },
    orientationCompatibility: [
      {
        directionCode: ORIENTATION_DIRECTION_CODES.STUDY_ABROAD,
        directionTitle: "Du học & Học bổng quốc tế (Thạc sĩ HCI / EdTech)",
        compatibilityScore: 92,
        isPrimaryRecommendation: true,
        reasoning:
          "Phù hợp cao nhờ mục tiêu học bổng Châu Âu rõ ràng, nền tảng IELTS 7.5, kết hợp định hướng Nghiên cứu khoa học sẵn có.",
      },
      {
        directionCode: ORIENTATION_DIRECTION_CODES.CAREER_INDUSTRY,
        directionTitle: "Việc làm khối Công nghệ & Product / UX Design",
        compatibilityScore: 86,
        isPrimaryRecommendation: false,
        reasoning:
          "Kỹ năng Figma / UI-UX và quản lý dự án giúp bạn cạnh tranh tốt cho các vị trí UX Researcher, Product Design Intern trước khi học cao học.",
      },
      {
        directionCode: ORIENTATION_DIRECTION_CODES.RESEARCH,
        directionTitle: "Nghiên cứu khoa học liên ngành Ngôn ngữ & Công nghệ",
        compatibilityScore: 81,
        isPrimaryRecommendation: false,
        reasoning:
          "Giải NCKH cấp Trường cùng khả năng nghiên cứu định lượng là đòn bẩy tốt để theo hướng bài báo học thuật quốc tế.",
      },
      {
        directionCode: ORIENTATION_DIRECTION_CODES.STARTUP,
        directionTitle: "Khởi nghiệp & Đổi mới sáng tạo EdTech",
        compatibilityScore: 68,
        isPrimaryRecommendation: false,
        reasoning:
          "Có thể tham gia các cuộc thi ý tưởng sáng tạo sinh viên để làm dày portfolio sản phẩm, trước khi dấn thân toàn thời gian.",
      },
    ],
    careerRecommendations: [
      {
        title: "UX Researcher / Product Designer (EdTech)",
        industry: "Công nghệ Giáo dục & Phần mềm",
        matchScore: 91,
        reason:
          "Kết hợp trọn vẹn lợi thế hiểu tâm lý người học ngôn ngữ, kỹ năng nghiên cứu định lượng và công cụ thiết kế Figma.",
        nextSteps: [
          "Hoàn thiện 2 UX Case Study chuyên sâu về sản phẩm học ngoại ngữ",
          "Ứng tuyển vị trí thực tập Product / UX Intern trong kỳ hè",
        ],
      },
      {
        title: "Ứng viên Học bổng Thạc sĩ Erasmus+ / Chevening (ngành HCI / Learning Design)",
        industry: "Học thuật & Giáo dục Quốc tế",
        matchScore: 88,
        reason:
          "Các chương trình Thạc sĩ liên kết Châu Âu đánh giá rất cao ứng viên có dự án tác động giáo dục và năng lực nghiên cứu rõ ràng.",
        nextSteps: [
          "Lập danh sách 5 chương trình Thạc sĩ mục tiêu tại Châu Âu",
          "Nâng cấp bài nghiên cứu cấp Trường thành bài tham luận hội thảo quốc tế",
        ],
      },
      {
        title: "Associate Product Manager (AI & Language Products)",
        industry: "Công nghệ & Trí tuệ nhân tạo",
        matchScore: 80,
        reason:
          "Tư duy hệ thống và kỹ năng điều phối đội nhóm giúp bạn làm cầu nối giữa kỹ thuật và người dùng.",
        nextSteps: [
          "Thực hành viết PRD và đo lường chỉ số sản phẩm (Product Metrics)",
        ],
      },
    ],
    learningRecommendations: {
      hardSkills: [
        {
          name: "UX Research & Usability Testing nâng cao",
          priority: "HIGH",
          reason: "Tạo lợi thế khác biệt rõ rệt khi ứng tuyển thực tập và viết Study Plan du học.",
        },
        {
          name: "Phân tích dữ liệu nghiên cứu (SPSS / R / Python cơ bản)",
          priority: "HIGH",
          reason: "Nâng chất lượng bài báo NCKH và hồ sơ Thạc sĩ định hướng nghiên cứu.",
        },
      ],
      softSkills: [
        {
          name: "Academic Writing & Scholarship Storytelling",
          priority: "HIGH",
          reason: "Quyết định trực tiếp chất lượng Personal Statement và Statement of Purpose.",
        },
        {
          name: "Stakeholder Presentation & Product Pitching",
          priority: "MEDIUM",
          reason: "Hỗ trợ phỏng vấn học bổng và bảo vệ phương án thiết kế tại doanh nghiệp.",
        },
      ],
      certificatesOrCourses: [
        "IELTS Academic 8.0 (hoặc nâng điểm Writing >= 7.5)",
        "Google UX Design Professional Certificate (Coursera)",
        "Chứng nhận tham gia Hội thảo khoa học sinh viên quốc gia / quốc tế",
      ],
    },
  };

  const analysis = await AiOrientationAnalysis.create({
    studentId,
    submissionId: submission._id,
    promptVersion: 1,
    modelUsed: DEFAULT_GEMINI_MODEL,
    inputSnapshot: { seeded: true },
    status: AI_ANALYSIS_STATUS.COMPLETED,
    retryCount: 0,
    analysisResult: sampleAnalysisResult,
  });

  // Seed 2 versions of Roadmap so student immediately has Roadmap History (RM13, RM14)
  const v1Years = [
    {
      yearNumber: 1 as const,
      title: "Năm 1: Hòa nhập đại học & Xây nền ngoại ngữ",
      summary: "Ổn định GPA nền tảng, làm quen nghiên cứu và tham gia cộng đồng học thuật.",
      goals: [
        {
          id: crypto.randomUUID(),
          title: "Đạt GPA tích lũy Năm 1 từ 3.5/4.0 trở lên",
          description: "Ưu tiên phương pháp ghi chú khoa học và làm việc nhóm các môn đại cương.",
          category: ROADMAP_GOAL_CATEGORIES.ACADEMIC,
          semester: 0 as const,
          priority: ROADMAP_GOAL_PRIORITIES.HIGH,
          status: ROADMAP_GOAL_STATUSES.COMPLETED,
          dueDate: null,
          order: 1,
          isCustom: false,
          completedAt: new Date(Date.now() - 400 * 24 * 60 * 60 * 1000),
        },
        {
          id: crypto.randomUUID(),
          title: "Tham gia 01 CLB học thuật hoặc truyền thông tại Trường",
          description: "Rèn luyện kỹ năng phối hợp đội nhóm và giao tiếp ngoại khóa.",
          category: ROADMAP_GOAL_CATEGORIES.EXPERIENCE,
          semester: 1 as const,
          priority: ROADMAP_GOAL_PRIORITIES.MEDIUM,
          status: ROADMAP_GOAL_STATUSES.COMPLETED,
          dueDate: null,
          order: 2,
          isCustom: false,
          completedAt: new Date(Date.now() - 360 * 24 * 60 * 60 * 1000),
        },
        {
          id: crypto.randomUUID(),
          title: "Kiểm tra năng lực ngoại ngữ đầu vào & lập kế hoạch IELTS",
          description: "Xác định điểm khởi đầu 4 kỹ năng để xây lộ trình ôn luyện phù hợp.",
          category: ROADMAP_GOAL_CATEGORIES.CERTIFICATE,
          semester: 2 as const,
          priority: ROADMAP_GOAL_PRIORITIES.MEDIUM,
          status: ROADMAP_GOAL_STATUSES.COMPLETED,
          dueDate: null,
          order: 3,
          isCustom: false,
          completedAt: new Date(Date.now() - 320 * 24 * 60 * 60 * 1000),
        },
      ],
    },
    {
      yearNumber: 2 as const,
      title: "Năm 2: Khám phá chuyên ngành & Khởi đầu UX / NCKH",
      summary: "Tích lũy kỹ năng thiết kế số, tham gia đề tài NCKH đầu tay và chuẩn bị chứng chỉ.",
      goals: [
        {
          id: crypto.randomUUID(),
          title: "Hoàn thành khóa học nền tảng UX/UI Design với Figma",
          description: "Xây dựng wireframe & prototype ứng dụng hỗ trợ học tập đầu tiên.",
          category: ROADMAP_GOAL_CATEGORIES.SKILL,
          semester: 1 as const,
          priority: ROADMAP_GOAL_PRIORITIES.HIGH,
          status: ROADMAP_GOAL_STATUSES.COMPLETED,
          dueDate: null,
          order: 1,
          isCustom: false,
          completedAt: new Date(Date.now() - 200 * 24 * 60 * 60 * 1000),
        },
        {
          id: crypto.randomUUID(),
          title: "Thi chính thức IELTS đạt 7.5+",
          description: "Đạt chuẩn ngoại ngữ phục vụ trao đổi sinh viên và nộp hồ sơ học bổng.",
          category: ROADMAP_GOAL_CATEGORIES.CERTIFICATE,
          semester: 2 as const,
          priority: ROADMAP_GOAL_PRIORITIES.HIGH,
          status: ROADMAP_GOAL_STATUSES.COMPLETED,
          dueDate: null,
          order: 2,
          isCustom: false,
          completedAt: new Date(Date.now() - 150 * 24 * 60 * 60 * 1000),
        },
        {
          id: crypto.randomUUID(),
          title: "Tham gia nhóm NCKH sinh viên cấp Khoa/Trường",
          description: "Học quy trình tổng quan tài liệu, khảo sát và xử lý số liệu định lượng.",
          category: ROADMAP_GOAL_CATEGORIES.ACADEMIC,
          semester: 2 as const,
          priority: ROADMAP_GOAL_PRIORITIES.HIGH,
          status: ROADMAP_GOAL_STATUSES.COMPLETED,
          dueDate: null,
          order: 3,
          isCustom: false,
          completedAt: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000),
        },
      ],
    },
    {
      yearNumber: 3 as const,
      title: "Năm 3: Bứt phá Nghiên cứu, Portfolio & Thực tập doanh nghiệp",
      summary: "Hoàn thiện 2 UX Case Study, công bố bài NCKH và trải nghiệm thực tế tại doanh nghiệp.",
      goals: [
        {
          id: crypto.randomUUID(),
          title: "Đạt giải Nghiên cứu khoa học sinh viên cấp Trường",
          description: "Hoàn thiện đề tài ứng dụng công nghệ số trong học tập ngôn ngữ.",
          category: ROADMAP_GOAL_CATEGORIES.ACADEMIC,
          semester: 1 as const,
          priority: ROADMAP_GOAL_PRIORITIES.HIGH,
          status: ROADMAP_GOAL_STATUSES.COMPLETED,
          dueDate: null,
          order: 1,
          isCustom: false,
          completedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        },
        {
          id: crypto.randomUUID(),
          title: "Ứng tuyển Thực tập sinh UX/Product tại tập đoàn công nghệ",
          description: "Xây dựng CV chuẩn ATS + Portfolio Figma chuyên sâu về EdTech.",
          category: ROADMAP_GOAL_CATEGORIES.CAREER,
          semester: 2 as const,
          priority: ROADMAP_GOAL_PRIORITIES.HIGH,
          status: ROADMAP_GOAL_STATUSES.IN_PROGRESS,
          dueDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
          order: 2,
          isCustom: false,
          completedAt: null,
        },
        {
          id: crypto.randomUUID(),
          title: "Hoàn thành Google UX Design Certificate",
          description: "Hệ thống hóa quy trình UX Research & Usability Testing bài bản.",
          category: ROADMAP_GOAL_CATEGORIES.CERTIFICATE,
          semester: 0 as const,
          priority: ROADMAP_GOAL_PRIORITIES.MEDIUM,
          status: ROADMAP_GOAL_STATUSES.NOT_STARTED,
          dueDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
          order: 3,
          isCustom: true,
          completedAt: null,
        },
      ],
    },
    {
      yearNumber: 4 as const,
      title: "Năm 4: Khóa luận, Săn Học bổng Châu Âu & Chuyển tiếp sự nghiệp",
      summary: "Hoàn tất hồ sơ học bổng Thạc sĩ (Erasmus+/Chevening) và bảo vệ khóa luận xuất sắc.",
      goals: [
        {
          id: crypto.randomUUID(),
          title: "Chốt danh sách 5 chương trình Thạc sĩ HCI/EdTech tại Châu Âu",
          description: "Đối chiếu deadline, điều kiện GPA, chứng chỉ và học bổng toàn phần.",
          category: ROADMAP_GOAL_CATEGORIES.CAREER,
          semester: 1 as const,
          priority: ROADMAP_GOAL_PRIORITIES.HIGH,
          status: ROADMAP_GOAL_STATUSES.NOT_STARTED,
          dueDate: null,
          order: 1,
          isCustom: false,
          completedAt: null,
        },
        {
          id: crypto.randomUUID(),
          title: "Viết Statement of Purpose & Xin 02 thư giới thiệu học thuật",
          description: "Liên hệ Giảng viên hướng dẫn NCKH và Quản lý thực tập để xin LOR.",
          category: ROADMAP_GOAL_CATEGORIES.EXPERIENCE,
          semester: 1 as const,
          priority: ROADMAP_GOAL_PRIORITIES.HIGH,
          status: ROADMAP_GOAL_STATUSES.NOT_STARTED,
          dueDate: null,
          order: 2,
          isCustom: false,
          completedAt: null,
        },
        {
          id: crypto.randomUUID(),
          title: "Bảo vệ Khóa luận tốt nghiệp loại Xuất sắc",
          description: "Tích hợp kết quả nghiên cứu thực nghiệm từ sản phẩm UX đã triển khai.",
          category: ROADMAP_GOAL_CATEGORIES.ACADEMIC,
          semester: 2 as const,
          priority: ROADMAP_GOAL_PRIORITIES.HIGH,
          status: ROADMAP_GOAL_STATUSES.NOT_STARTED,
          dueDate: null,
          order: 3,
          isCustom: false,
          completedAt: null,
        },
      ],
    },
  ];

  const calc = calculateRoadmapProgress(
    v1Years.map((y) => ({
      yearNumber: y.yearNumber,
      goals: y.goals.map((g) => ({
        ...g,
        dueDate: g.dueDate ? new Date(g.dueDate).toISOString() : null,
        completedAt: g.completedAt ? new Date(g.completedAt).toISOString() : null,
      })),
    }))
  );

  await Roadmap.create({
    studentId,
    analysisId: analysis._id,
    title: "Lộ trình Du học Thạc sĩ Châu Âu & UX Product (Ngôn ngữ + Công nghệ)",
    orientationDirection: "Du học & Học bổng quốc tế (Thạc sĩ HCI / EdTech)",
    version: 1,
    status: ROADMAP_STATUS.ACTIVE,
    source: ROADMAP_SOURCE.AI_GENERATED,
    restoredFromRoadmapId: null,
    progressPercent: calc.progressPercent,
    years: v1Years,
  });

  const promptsCount = await ensureDefaultSystemPrompts().then(() => 2).catch(() => 2);

  return {
    questionnairesCount: 1,
    questionsCount: questions.length,
    promptsCount,
    roadmapsCount: 1,
  };
}

