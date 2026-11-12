import { NextResponse } from "next/server";
import { Types } from "mongoose";
import { CV_MAX_PER_USER } from "@/constants/cv";
import { parseCvObjectId, serializeCvDocument } from "@/lib/cv-service";
import { connectToDatabase } from "@/lib/db";
import { handleAuthError, requireAuth } from "@/lib/session";
import { CvDocument } from "@/models/CvDocument";

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/cv/[id]/duplicate
 * Nhân bản CV (reset sharing về PRIVATE, version = 1)
 */
export async function POST(req: Request, context: RouteContext) {
  try {
    const authUser = await requireAuth(req);
    const { id } = await context.params;
    const objId = parseCvObjectId(id);

    if (!objId) {
      return NextResponse.json({ error: "Mã CV không hợp lệ" }, { status: 400 });
    }

    await connectToDatabase();
    const userObjId = new Types.ObjectId(authUser.id);

    const [source, totalCount] = await Promise.all([
      CvDocument.findOne({ _id: objId, userId: userObjId }).lean(),
      CvDocument.countDocuments({ userId: userObjId }),
    ]);

    if (!source) {
      return NextResponse.json({ error: "Không tìm thấy CV gốc" }, { status: 404 });
    }

    if (totalCount >= CV_MAX_PER_USER) {
      return NextResponse.json(
        {
          error: `Mỗi tài khoản chỉ có thể lưu tối đa ${CV_MAX_PER_USER} CV. Vui lòng xóa bớt CV cũ trước khi nhân bản.`,
        },
        { status: 400 }
      );
    }

    const suffix = " (Bản sao)";
    const baseTitle = (source.title || "CV").slice(0, 120 - suffix.length);

    const duplicated = await CvDocument.create({
      userId: userObjId,
      title: `${baseTitle}${suffix}`,
      templateId: source.templateId,
      targetRole: source.targetRole || "",
      locale: source.locale || "vi",
      styleConfig: source.styleConfig,
      sectionOrder: source.sectionOrder,
      hiddenSections: source.hiddenSections || [],
      personalInfo: source.personalInfo,
      summary: source.summary || "",
      education: source.education || [],
      experience: source.experience || [],
      skills: source.skills || [],
      projects: source.projects || [],
      achievements: source.achievements || [],
      activities: source.activities || [],
      certifications: source.certifications || [],
      customSections: source.customSections || [],
      sharing: {
        isPublic: false,
        shareSlug: null,
        sharedAt: null,
        viewCount: 0,
        allowPdfDownload: true,
      },
      version: 1,
      lastEditedAt: new Date(),
    });

    return NextResponse.json(
      {
        success: true,
        cv: serializeCvDocument(duplicated.toObject()),
      },
      { status: 201 }
    );
  } catch (error) {
    return handleAuthError(error);
  }
}

