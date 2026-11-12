import { NextResponse } from "next/server";
import { Types } from "mongoose";
import { logAuditAction } from "@/lib/audit";
import {
  destroyCloudinaryAsset,
  isCloudinaryConfigured,
} from "@/lib/cloudinary";
import { connectToDatabase } from "@/lib/db";
import { handleAuthError, requireAdmin } from "@/lib/session";
import { MediaAsset } from "@/models/MediaAsset";

/**
 * DELETE /api/admin/media/[id]
 * Xóa MediaAsset khỏi Cloudinary + MongoDB nếu không còn bài viết nào tham chiếu (chặn 409 nếu usedBy > 0)
 */
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdmin(req);
    const { id } = await params;

    if (!Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: "Mã tài nguyên media không hợp lệ." },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const asset = await MediaAsset.findById(id).lean();
    if (!asset) {
      return NextResponse.json(
        { error: "Không tìm thấy tài nguyên media." },
        { status: 404 }
      );
    }

    if (Array.isArray(asset.usedBy) && asset.usedBy.length > 0) {
      return NextResponse.json(
        {
          error: `Không thể xóa "${asset.originalFilename}" vì đang được sử dụng trong ${asset.usedBy.length} bài viết.`,
          usedBy: asset.usedBy.map((ref) => ({
            targetCollection: ref.targetCollection,
            documentId: ref.documentId.toString(),
            role: ref.role,
          })),
        },
        { status: 409 }
      );
    }

    if (isCloudinaryConfigured()) {
      await destroyCloudinaryAsset(asset.publicId, asset.resourceType);
    }

    await MediaAsset.deleteOne({ _id: asset._id });

    await logAuditAction({
      admin: { id: admin.id, email: admin.email, name: admin.name },
      action: "DELETE",
      targetCollection: "media_assets",
      targetId: asset._id,
      targetTitle: `${asset.mediaKind}: ${asset.originalFilename}`,
      changesBefore: {
        publicId: asset.publicId,
        url: asset.url,
        status: asset.status,
      },
      req,
    });

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    return handleAuthError(error);
  }
}

