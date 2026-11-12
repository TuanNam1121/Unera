import { NextResponse } from "next/server";
import { Types } from "mongoose";
import { ASSESSMENT_SUBMISSION_STATUS, ROADMAP_STATUS } from "@/constants";
import { connectToDatabase } from "@/lib/db";
import { serializeAiAnalysis } from "@/lib/orientation-ai";
import {
  ensureRoadmapCollectionClean,
  serializeRoadmap,
} from "@/lib/roadmap-service";
import { academicYearToNumber } from "@/lib/roadmap-utils";
import { handleAuthError, requireAuth } from "@/lib/session";
import { AiOrientationAnalysis } from "@/models/AiOrientationAnalysis";
import { AssessmentSubmission } from "@/models/AssessmentSubmission";
import { Roadmap } from "@/models/Roadmap";
import { StudentProfile } from "@/models/StudentProfile";

/**
 * GET /api/roadmap
 * RM02, RM03, RM10: Lấy lộ trình ACTIVE duy nhất của sinh viên kèm breakdown tiến độ 4 năm & bối cảnh AI mới nhất.
 */
export async function GET(req: Request) {
  try {
    const authUser = await requireAuth(req);
    await connectToDatabase();
    await ensureRoadmapCollectionClean();

    const studentObjId = new Types.ObjectId(authUser.id);

    const [activeRoadmap, profile, latestAnalysis, latestSubmission, historyCount] =
      await Promise.all([
        Roadmap.findOne({
          studentId: studentObjId,
          status: ROADMAP_STATUS.ACTIVE,
        }).lean(),
        StudentProfile.findOne({ userId: authUser.id })
          .select("academicYear university major fullName")
          .lean(),
        AiOrientationAnalysis.findOne({ studentId: studentObjId })
          .sort({ createdAt: -1 })
          .lean(),
        AssessmentSubmission.findOne({
          studentId: studentObjId,
          status: ASSESSMENT_SUBMISSION_STATUS.SUBMITTED,
        })
          .sort({ submittedAt: -1 })
          .select("_id submittedAt")
          .lean(),
        Roadmap.countDocuments({ studentId: studentObjId }),
      ]);

    return NextResponse.json({
      success: true,
      roadmap: activeRoadmap ? serializeRoadmap(activeRoadmap) : null,
      currentAcademicYear: academicYearToNumber(profile?.academicYear),
      profileSummary: profile
        ? {
            fullName: profile.fullName,
            university: profile.university || "",
            major: profile.major || "",
            academicYear: profile.academicYear || "",
          }
        : null,
      latestAnalysis: latestAnalysis ? serializeAiAnalysis(latestAnalysis) : null,
      latestSubmissionId: latestSubmission?._id?.toString() || null,
      historyCount,
    });
  } catch (error) {
    return handleAuthError(error);
  }
}
