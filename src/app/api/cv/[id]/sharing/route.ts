import { NextResponse } from "next/server";
import { Types } from "mongoose";
import {
  generateUniqueShareSlug,
  parseCvObjectId,
  serializeCvDocument,
} from "@/lib/cv-service";
import { connectToDatabase } from "@/lib/db";
import { handleAuthError, requireAuth } from "@/lib/session";
import { CvDocument } from "@/models/CvDocument";
import { updateCvSharingSchema } from "@/validations/cv";

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * PATCH /api/cv/[id]/sharing
 * Quản lý trạng thái chia sẻ công khai, allowPdfDownload, và tái tạo shareSlug
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
    const parsed = updateCvSharingSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Dữ liệu cấu hình chia sẻ không hợp lệ",
          details: parsed.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    await connectToDatabase();
    const userObjId = new Types.ObjectId(authUser.id);
    const cv = await CvDocument.findOne({ _id: objId, userId: userObjId });

    if (!cv) {
      return NextResponse.json({ error: "Không tìm thấy CV" }, { status: 404 });
    }

    const { isPublic, allowPdfDownload, regenerateSlug } = parsed.data;

    if (typeof isPublic === "boolean") {
      cv.sharing.isPublic = isPublic;
      if (isPublic && !cv.sharing.sharedAt) {
        cv.sharing.sharedAt = new Date();
      }
    }

    if (typeof allowPdfDownload === "boolean") {
      cv.sharing.allowPdfDownload = allowPdfDownload;
    }

    if (regenerateSlug || (cv.sharing.isPublic && !cv.sharing.shareSlug)) {
      cv.sharing.shareSlug = await generateUniqueShareSlug(
        cv.personalInfo?.fullName || cv.title
      );
      if (cv.sharing.isPublic) {
        cv.sharing.sharedAt = new Date();
      }
    }

    await cv.save();

    return NextResponse.json({
      success: true,
      cv: serializeCvDocument(cv.toObject()),
    });
  } catch (error) {
    return handleAuthError(error);
  }
}

