import crypto from "crypto";
import { Types } from "mongoose";
import {
  ACADEMIC_YEARS,
  AI_ANALYSIS_STATUS,
  NOTIFICATION_CHANNELS,
  NOTIFICATION_TYPES,
  ROADMAP_GOAL_STATUSES,
  ROADMAP_SOURCE,
  ROADMAP_STATUS,
  SYSTEM_PROMPT_KEYS,
} from "@/constants";
import {
  callGeminiRoadmapGeneration,
  toFriendlyGeminiError,
} from "@/lib/gemini";
import { runWithOptionalTransaction } from "@/lib/mongo-helpers";
import { getActiveSystemPrompt } from "@/lib/orientation-ai";
import { calculateRoadmapProgress } from "@/lib/roadmap-utils";
import { AiOrientationAnalysis } from "@/models/AiOrientationAnalysis";
import { Notification } from "@/models/Notification";
import { IRoadmapDocument, IRoadmapYearSubdoc, Roadmap } from "@/models/Roadmap";
import { StudentProfile } from "@/models/StudentProfile";
import type {
  IRoadmapDTO,
  IRoadmapGoalDTO,
  IRoadmapHistorySummaryDTO,
  IRoadmapYearDTO,
} from "@/types";

let legacyRoadmapChecked = false;

/**
 * Bảo đảm gỡ bỏ các bản ghi Roadmap theo schema cũ (thiếu orientationDirection / goals)
 * để tránh xung đột với cấu trúc & partial unique index mới của Module 08.
 */
export async function ensureRoadmapCollectionClean(): Promise<void> {
  if (legacyRoadmapChecked) return;
  legacyRoadmapChecked = true;
  try {
    await Roadmap.deleteMany({ orientationDirection: { $exists: false } });
    await Roadmap.syncIndexes();
  } catch {
    // Non-fatal if collection doesn't exist yet
  }
}

export function serializeRoadmap(
  doc: Pick<
    IRoadmapDocument,
    | "_id"
    | "studentId"
    | "analysisId"
    | "title"
    | "orientationDirection"
    | "version"
    | "status"
    | "source"
    | "restoredFromRoadmapId"
    | "progressPercent"
    | "years"
    | "createdAt"
    | "updatedAt"
  >
): IRoadmapDTO {
  const years: IRoadmapYearDTO[] = (doc.years || [])
    .slice()
    .sort((a, b) => a.yearNumber - b.yearNumber)
    .map((yr) => {
      const goals: IRoadmapGoalDTO[] = (yr.goals || [])
        .slice()
        .sort((a, b) => a.order - b.order)
        .map((g) => ({
          id: g.id,
          title: g.title,
          description: g.description || "",
          category: g.category,
          semester: g.semester,
          priority: g.priority,
          status: g.status,
          dueDate: g.dueDate ? new Date(g.dueDate).toISOString() : null,
          order: g.order,
          isCustom: Boolean(g.isCustom),
          completedAt: g.completedAt ? new Date(g.completedAt).toISOString() : null,
        }));

      return {
        yearNumber: yr.yearNumber,
        title: yr.title,
        summary: yr.summary || "",
        goals,
      };
    });

  const progressBreakdown = calculateRoadmapProgress(years);

  return {
    _id: String(doc._id),
    studentId: String(doc.studentId),
    analysisId: doc.analysisId ? String(doc.analysisId) : null,
    title: doc.title,
    orientationDirection: doc.orientationDirection,
    version: doc.version,
    status: doc.status,
    source: doc.source,
    restoredFromRoadmapId: doc.restoredFromRoadmapId
      ? String(doc.restoredFromRoadmapId)
      : null,
    progressPercent: progressBreakdown.progressPercent,
    years,
    progressBreakdown,
    createdAt: new Date(doc.createdAt).toISOString(),
    updatedAt: new Date(doc.updatedAt).toISOString(),
  };
}

export function serializeRoadmapHistoryItem(
  doc: Pick<
    IRoadmapDocument,
    | "_id"
    | "title"
    | "orientationDirection"
    | "version"
    | "status"
    | "source"
    | "restoredFromRoadmapId"
    | "years"
    | "createdAt"
    | "updatedAt"
  >
): IRoadmapHistorySummaryDTO {
  const yearsForCalc = (doc.years || []).map((y) => ({
    yearNumber: y.yearNumber,
    goals: (y.goals || []).map((g) => ({
      ...g,
      dueDate: g.dueDate ? new Date(g.dueDate).toISOString() : null,
      completedAt: g.completedAt ? new Date(g.completedAt).toISOString() : null,
    })),
  }));
  const breakdown = calculateRoadmapProgress(yearsForCalc);

  return {
    _id: String(doc._id),
    title: doc.title,
    orientationDirection: doc.orientationDirection,
    version: doc.version,
    status: doc.status,
    source: doc.source,
    restoredFromRoadmapId: doc.restoredFromRoadmapId
      ? String(doc.restoredFromRoadmapId)
      : null,
    progressPercent: breakdown.progressPercent,
    totalGoals: breakdown.totalGoals,
    completedGoals: breakdown.completedGoals,
    createdAt: new Date(doc.createdAt).toISOString(),
    updatedAt: new Date(doc.updatedAt).toISOString(),
  };
}

/**
 * Sinh Lộ trình 4 năm bằng Gemini AI (RM01, RM12):
 * Bảo toàn 100% lộ trình ACTIVE hiện tại nếu Gemini API lỗi/timeout.
 */
export async function generatePersonalizedRoadmap(params: {
  studentId: string;
  analysisId?: string;
  targetDirection?: string;
  notes?: string;
}): Promise<{
  ok: boolean;
  roadmap?: IRoadmapDTO;
  errorMessage?: string;
}> {
  await ensureRoadmapCollectionClean();
  const studentObjId = new Types.ObjectId(params.studentId);

  const [profile, targetAnalysis] = await Promise.all([
    StudentProfile.findOne({ userId: params.studentId }).lean(),
    params.analysisId && Types.ObjectId.isValid(params.analysisId)
      ? AiOrientationAnalysis.findOne({
          _id: new Types.ObjectId(params.analysisId),
          studentId: studentObjId,
          status: AI_ANALYSIS_STATUS.COMPLETED,
        }).lean()
      : AiOrientationAnalysis.findOne({
          studentId: studentObjId,
          status: AI_ANALYSIS_STATUS.COMPLETED,
        })
          .sort({ createdAt: -1 })
          .lean(),
  ]);

  if (!targetAnalysis && !params.targetDirection?.trim()) {
    return {
      ok: false,
      errorMessage:
        "Bạn chưa có kết quả phân tích định hướng AI hoàn chỉnh. Vui lòng hoàn thành bài trắc nghiệm Onboarding hoặc nhập hướng mục tiêu mong muốn.",
    };
  }

  const promptConfig = await getActiveSystemPrompt(
    SYSTEM_PROMPT_KEYS.ROADMAP_GENERATION
  );

  const acYearLabel =
    ACADEMIC_YEARS.find((y) => y.value === profile?.academicYear)?.label ||
    profile?.academicYear ||
    "Chưa cập nhật";

  const userPrompt = [
    `=== HỒ SƠ SINH VIÊN ===`,
    `- Họ tên: ${profile?.fullName || "Sinh viên UNERA"}`,
    `- Trường: ${profile?.university || "Chưa cập nhật"}`,
    `- Ngành học: ${profile?.major || "Chưa cập nhật"}`,
    `- Năm học hiện tại: ${acYearLabel}`,
    `- Kỹ năng chuyên môn hiện có: ${
      profile?.hardSkills?.length ? profile.hardSkills.join(", ") : "Chưa cập nhật"
    }`,
    `- Kỹ năng mềm hiện có: ${
      profile?.softSkills?.length ? profile.softSkills.join(", ") : "Chưa cập nhật"
    }`,
    `- Thành tích hiện có: ${
      profile?.achievements?.length ? profile.achievements.join(", ") : "Chưa cập nhật"
    }`,
    ``,
    targetAnalysis?.analysisResult
      ? `=== KẾT QUẢ PHÂN TÍCH ĐỊNH HƯỚNG AI ===\n${JSON.stringify(
          targetAnalysis.analysisResult,
          null,
          2
        )}`
      : `=== ĐỊNH HƯỚNG MỤC TIÊU SINH VIÊN CHỌN ===\nChưa có phân tích AI trước đó.`,
    ``,
    params.targetDirection?.trim()
      ? `>>> YÊU CẦU ĐỊNH HƯỚNG ƯU TIÊN MỚI CỦA SINH VIÊN: ${params.targetDirection.trim()}`
      : "",
    params.notes?.trim()
      ? `>>> GHI CHÚ BỔ SUNG CỦA SINH VIÊN: ${params.notes.trim()}`
      : "",
    ``,
    `Hãy sinh lộ trình 4 năm (Year 1..4) đầy đủ, chi tiết và trả về JSON đúng schema.`,
  ]
    .filter(Boolean)
    .join("\n");

  let aiRoadmap;
  try {
    const resp = await callGeminiRoadmapGeneration({
      modelName: promptConfig.modelName,
      temperature: promptConfig.temperature,
      systemPrompt: promptConfig.promptContent,
      userPrompt,
    });
    aiRoadmap = resp.data;
  } catch (err) {
    // RM12 / AC-03: Nếu lỗi Gemini -> giữ nguyên bản ACTIVE hiện tại!
    return {
      ok: false,
      errorMessage: toFriendlyGeminiError(err),
    };
  }

  const yearsSubdocs: IRoadmapYearSubdoc[] = ([1, 2, 3, 4] as const).map(
    (yrNum) => {
      const matched = aiRoadmap.years.find((y) => y.yearNumber === yrNum)!;
      return {
        yearNumber: yrNum,
        title: matched.title,
        summary: matched.summary,
        goals: matched.goals.map((g, idx) => ({
          id: crypto.randomUUID(),
          title: g.title,
          description: g.description,
          category: g.category,
          semester: g.semester,
          priority: g.priority,
          status: ROADMAP_GOAL_STATUSES.NOT_STARTED,
          dueDate: null,
          order: idx + 1,
          isCustom: false,
          completedAt: null,
        })),
      };
    }
  );

  const prevActive = await Roadmap.findOne({
    studentId: studentObjId,
    status: ROADMAP_STATUS.ACTIVE,
  })
    .select("_id")
    .lean();

  const latestVersionDoc = await Roadmap.findOne({ studentId: studentObjId })
    .sort({ version: -1 })
    .select("version")
    .lean();
  const nextVersion = (latestVersionDoc?.version ?? 0) + 1;

  const createdRoadmap = await runWithOptionalTransaction(
    async (session) => {
      await Roadmap.updateMany(
        { studentId: studentObjId, status: ROADMAP_STATUS.ACTIVE },
        { $set: { status: ROADMAP_STATUS.ARCHIVED } },
        session ? { session } : undefined
      );

      const docs = await Roadmap.create(
        [
          {
            studentId: studentObjId,
            analysisId: targetAnalysis?._id || null,
            title: aiRoadmap.title,
            orientationDirection: aiRoadmap.orientationDirection,
            version: nextVersion,
            status: ROADMAP_STATUS.ACTIVE,
            source: ROADMAP_SOURCE.AI_GENERATED,
            restoredFromRoadmapId: null,
            progressPercent: 0,
            years: yearsSubdocs,
          },
        ],
        session ? { session } : undefined
      );
      return docs[0];
    },
    async () => {
      if (prevActive?._id) {
        await Roadmap.updateOne(
          { _id: prevActive._id },
          { $set: { status: ROADMAP_STATUS.ACTIVE } }
        );
      }
    }
  );

  await Notification.create({
    recipientId: params.studentId,
    type: NOTIFICATION_TYPES.ROADMAP_UPDATE,
    title: `Lộ trình 4 năm mới (v${createdRoadmap.version}) đã sẵn sàng`,
    message: `AI Gemini đã xây dựng "${createdRoadmap.title}" theo định hướng ${createdRoadmap.orientationDirection}.`,
    link: "/roadmap",
    isRead: false,
    channel: NOTIFICATION_CHANNELS.IN_APP,
  }).catch(() => {});

  return {
    ok: true,
    roadmap: serializeRoadmap(createdRoadmap),
  };
}

/**
 * Khôi phục một phiên bản lộ trình cũ thành phiên bản ACTIVE mới (RM14).
 * Giữ nguyên toàn bộ mục tiêu và tiến độ hoàn thành của phiên bản được chọn.
 */
export async function restoreRoadmapFromHistory(params: {
  studentId: string;
  roadmapId: string;
}): Promise<IRoadmapDTO | null> {
  await ensureRoadmapCollectionClean();
  const studentObjId = new Types.ObjectId(params.studentId);
  const target = await Roadmap.findOne({
    _id: new Types.ObjectId(params.roadmapId),
    studentId: studentObjId,
  }).lean();

  if (!target) return null;

  const prevActive = await Roadmap.findOne({
    studentId: studentObjId,
    status: ROADMAP_STATUS.ACTIVE,
  })
    .select("_id")
    .lean();

  const latestVersionDoc = await Roadmap.findOne({ studentId: studentObjId })
    .sort({ version: -1 })
    .select("version")
    .lean();
  const nextVersion = (latestVersionDoc?.version ?? 0) + 1;

  const clonedYears: IRoadmapYearSubdoc[] = (target.years || []).map((yr) => ({
    yearNumber: yr.yearNumber,
    title: yr.title,
    summary: yr.summary || "",
    goals: (yr.goals || []).map((g) => ({
      id: crypto.randomUUID(),
      title: g.title,
      description: g.description || "",
      category: g.category,
      semester: g.semester,
      priority: g.priority,
      status: g.status,
      dueDate: g.dueDate || null,
      order: g.order,
      isCustom: Boolean(g.isCustom),
      completedAt: g.completedAt || null,
    })),
  }));

  const progressBreakdown = calculateRoadmapProgress(
    clonedYears.map((y) => ({
      yearNumber: y.yearNumber,
      goals: y.goals.map((g) => ({
        ...g,
        dueDate: g.dueDate ? new Date(g.dueDate).toISOString() : null,
        completedAt: g.completedAt ? new Date(g.completedAt).toISOString() : null,
      })),
    }))
  );

  const restored = await runWithOptionalTransaction(
    async (session) => {
      await Roadmap.updateMany(
        { studentId: studentObjId, status: ROADMAP_STATUS.ACTIVE },
        { $set: { status: ROADMAP_STATUS.ARCHIVED } },
        session ? { session } : undefined
      );

      const docs = await Roadmap.create(
        [
          {
            studentId: studentObjId,
            analysisId: target.analysisId || null,
            title: target.title,
            orientationDirection: target.orientationDirection,
            version: nextVersion,
            status: ROADMAP_STATUS.ACTIVE,
            source: ROADMAP_SOURCE.RESTORED_FROM_HISTORY,
            restoredFromRoadmapId: target._id,
            progressPercent: progressBreakdown.progressPercent,
            years: clonedYears,
          },
        ],
        session ? { session } : undefined
      );
      return docs[0];
    },
    async () => {
      if (prevActive?._id) {
        await Roadmap.updateOne(
          { _id: prevActive._id },
          { $set: { status: ROADMAP_STATUS.ACTIVE } }
        );
      }
    }
  );

  return serializeRoadmap(restored);
}

