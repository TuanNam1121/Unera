import { NextResponse } from "next/server";
import { Types } from "mongoose";
import { CV_MAX_PER_USER } from "@/constants/cv";
import {
  buildInitialCvContent,
  getProfilePrefillSeed,
  serializeCvDocument,
  serializeCvSummary,
} from "@/lib/cv-service";
import { getCvTemplate } from "@/lib/cv-templates";
import { connectToDatabase } from "@/lib/db";
import { escapeRegexInput } from "@/lib/orientation-utils";
import { handleAuthError, requireAuth } from "@/lib/session";
import { CvDocument } from "@/models/CvDocument";
import { createCvSchema } from "@/validations/cv";

/**
 * GET /api/cv
 * Lấy danh sách CV của người dùng hiện tại + optional seed prefill từ StudentProfile
 */
export async function GET(req: Request) {
  try {
    const authUser = await requireAuth(req);
    await connectToDatabase();

    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q")?.trim() || "";
    const templateId = searchParams.get("templateId")?.trim() || "";
    const sharingFilter = searchParams.get("sharing")?.trim() || "";
    const sortParam = searchParams.get("sort")?.trim() || "updatedAt";
    const includeProfileSeed = searchParams.get("includeProfileSeed") === "1";

    const filter: Record<string, unknown> = {
      userId: new Types.ObjectId(authUser.id),
    };

    if (q) {
      const safeRegex = new RegExp(escapeRegexInput(q), "i");
      filter.$or = [
        { title: safeRegex },
        { targetRole: safeRegex },
        { "personalInfo.fullName": safeRegex },
      ];
    }

    if (templateId && templateId !== "ALL") {
      filter.templateId = templateId;
    }

    if (sharingFilter === "PUBLIC") {
      filter["sharing.isPublic"] = true;
    } else if (sharingFilter === "PRIVATE") {
      filter["sharing.isPublic"] = false;
    }

    const sortSpec: Record<string, 1 | -1> =
      sortParam === "title"
        ? { title: 1, updatedAt: -1 }
        : sortParam === "createdAt"
          ? { createdAt: -1 }
          : { updatedAt: -1 };

    const [docs, totalCount, profileSeed] = await Promise.all([
      CvDocument.find(filter).sort(sortSpec).lean(),
      CvDocument.countDocuments({ userId: new Types.ObjectId(authUser.id) }),
      includeProfileSeed ? getProfilePrefillSeed(authUser.id) : Promise.resolve(null),
    ]);

    return NextResponse.json({
      success: true,
      cvs: docs.map((doc) => serializeCvSummary(doc)),
      totalCount,
      maxAllowed: CV_MAX_PER_USER,
      ...(profileSeed ? { profileSeed } : {}),
    });
  } catch (error) {
    return handleAuthError(error);
  }
}

/**
 * POST /api/cv
 * Tạo CV mới (từ mẫu trống, template chọn sẵn hoặc pre-fill từ StudentProfile)
 */
export async function POST(req: Request) {
  try {
    const authUser = await requireAuth(req);
    await connectToDatabase();

    const body = await req.json();
    const parsed = createCvSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Dữ liệu tạo CV không hợp lệ",
          details: parsed.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const userObjId = new Types.ObjectId(authUser.id);
    const currentCount = await CvDocument.countDocuments({ userId: userObjId });
    if (currentCount >= CV_MAX_PER_USER) {
      return NextResponse.json(
        {
          error: `Mỗi tài khoản chỉ có thể lưu tối đa ${CV_MAX_PER_USER} CV. Vui lòng xóa bớt CV cũ trước khi tạo mới.`,
        },
        { status: 400 }
      );
    }

    const {
      title,
      targetRole,
      templateId,
      locale,
      prefillFromProfile,
      achievementYearsOverride,
    } = parsed.data;

    const tpl = getCvTemplate(templateId);
    const initialContent = await buildInitialCvContent({
      userId: authUser.id,
      userName: authUser.name,
      userEmail: authUser.email,
      userImage: authUser.image,
      targetRole,
      locale,
      prefillFromProfile,
      achievementYearsOverride,
    });

    const created = await CvDocument.create({
      userId: userObjId,
      title,
      targetRole: targetRole || "",
      templateId: tpl.id,
      locale,
      styleConfig: {
        ...tpl.defaultStyleConfig,
        showAvatar: tpl.supportsAvatar && Boolean(initialContent.personalInfo.avatarUrl),
      },
      sectionOrder: [...tpl.defaultSectionOrder],
      hiddenSections: [],
      personalInfo: initialContent.personalInfo,
      summary: initialContent.summary,
      education: initialContent.education,
      experience: [],
      skills: initialContent.skills,
      projects: [],
      achievements: initialContent.achievements,
      activities: [],
      certifications: [],
      customSections: [],
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
        cv: serializeCvDocument(created.toObject()),
      },
      { status: 201 }
    );
  } catch (error) {
    return handleAuthError(error);
  }
}

