import { NextResponse } from "next/server";
import { Types } from "mongoose";
import {
  parseCvObjectId,
  serializeCvDocument,
} from "@/lib/cv-service";
import { getCvTemplate } from "@/lib/cv-templates";
import { connectToDatabase } from "@/lib/db";
import { handleAuthError, requireAuth } from "@/lib/session";
import { CvDocument } from "@/models/CvDocument";
import { updateCvSchema } from "@/validations/cv";

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/cv/[id]
 * Lấy chi tiết CV (chỉ chủ sở hữu)
 */
export async function GET(req: Request, context: RouteContext) {
  try {
    const authUser = await requireAuth(req);
    const { id } = await context.params;
    const objId = parseCvObjectId(id);

    if (!objId) {
      return NextResponse.json({ error: "Mã CV không hợp lệ" }, { status: 400 });
    }

    await connectToDatabase();
    const cv = await CvDocument.findOne({
      _id: objId,
      userId: new Types.ObjectId(authUser.id),
    }).lean();

    if (!cv) {
      return NextResponse.json({ error: "Không tìm thấy CV" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      cv: serializeCvDocument(cv),
    });
  } catch (error) {
    return handleAuthError(error);
  }
}

/**
 * PATCH /api/cv/[id]
 * Cập nhật CV (Auto-save nội dung, styleConfig, sectionOrder, đổi tên) + Optimistic Locking
 */
export async function PATCH(req: Request, context: RouteContext) {
  try {
    const authUser = await requireAuth(req);
    const { id } = await context.params;
    const objId = parseCvObjectId(id);

    if (!objId) {
      return NextResponse.json({ error: "Mã CV không hợp lệ" }, { status: 400 });
    }

    const body = await req.json();
    const parsed = updateCvSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Dữ liệu cập nhật CV không hợp lệ",
          details: parsed.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    await connectToDatabase();
    const userObjId = new Types.ObjectId(authUser.id);

    const existing = await CvDocument.findOne({
      _id: objId,
      userId: userObjId,
    }).select("version");

    if (!existing) {
      return NextResponse.json({ error: "Không tìm thấy CV" }, { status: 404 });
    }

    const { expectedVersion, ...fields } = parsed.data;

    if (
      typeof expectedVersion === "number" &&
      existing.version !== expectedVersion
    ) {
      return NextResponse.json(
        {
          error:
            "CV đã được cập nhật từ một tab hoặc phiên làm việc khác. Vui lòng tải lại phiên bản mới nhất.",
          code: "VERSION_CONFLICT",
          currentVersion: existing.version,
        },
        { status: 409 }
      );
    }

    const updateSet: Record<string, unknown> = {
      lastEditedAt: new Date(),
    };

    if (fields.title !== undefined) updateSet.title = fields.title;
    if (fields.targetRole !== undefined) updateSet.targetRole = fields.targetRole;
    if (fields.templateId !== undefined) {
      updateSet.templateId = getCvTemplate(fields.templateId).id;
    }
    if (fields.locale !== undefined) updateSet.locale = fields.locale;
    if (fields.styleConfig !== undefined) updateSet.styleConfig = fields.styleConfig;
    if (fields.sectionOrder !== undefined) updateSet.sectionOrder = fields.sectionOrder;
    if (fields.hiddenSections !== undefined) {
      updateSet.hiddenSections = fields.hiddenSections;
    }
    if (fields.personalInfo !== undefined) updateSet.personalInfo = fields.personalInfo;
    if (fields.summary !== undefined) updateSet.summary = fields.summary;
    if (fields.education !== undefined) updateSet.education = fields.education;
    if (fields.experience !== undefined) updateSet.experience = fields.experience;
    if (fields.skills !== undefined) updateSet.skills = fields.skills;
    if (fields.projects !== undefined) updateSet.projects = fields.projects;
    if (fields.achievements !== undefined) updateSet.achievements = fields.achievements;
    if (fields.activities !== undefined) updateSet.activities = fields.activities;
    if (fields.certifications !== undefined) {
      updateSet.certifications = fields.certifications;
    }
    if (fields.customSections !== undefined) {
      updateSet.customSections = fields.customSections;
    }

    const updated = await CvDocument.findOneAndUpdate(
      { _id: objId, userId: userObjId },
      {
        $set: updateSet,
        $inc: { version: 1 },
      },
      { returnDocument: "after" }
    ).lean();

    if (!updated) {
      return NextResponse.json({ error: "Không tìm thấy CV" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      cv: serializeCvDocument(updated),
    });
  } catch (error) {
    return handleAuthError(error);
  }
}

/**
 * DELETE /api/cv/[id]
 * Xóa vĩnh viễn CV của người dùng
 */
export async function DELETE(req: Request, context: RouteContext) {
  try {
    const authUser = await requireAuth(req);
    const { id } = await context.params;
    const objId = parseCvObjectId(id);

    if (!objId) {
      return NextResponse.json({ error: "Mã CV không hợp lệ" }, { status: 400 });
    }

    await connectToDatabase();
    const deleted = await CvDocument.findOneAndDelete({
      _id: objId,
      userId: new Types.ObjectId(authUser.id),
    }).lean();

    if (!deleted) {
      return NextResponse.json({ error: "Không tìm thấy CV" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      deletedId: String(deleted._id),
    });
  } catch (error) {
    return handleAuthError(error);
  }
}

