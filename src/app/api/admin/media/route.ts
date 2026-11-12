import { NextResponse } from "next/server";
import { MEDIA_ASSET_STATUS, MEDIA_KINDS } from "@/constants";
import { connectToDatabase } from "@/lib/db";
import { escapeRegexInput } from "@/lib/orientation-utils";
import { handleAuthError, requireAdmin } from "@/lib/session";
import { MediaAsset } from "@/models/MediaAsset";

/**
 * GET /api/admin/media
 * Thư viện Media đã upload lên Cloudinary cho Admin chọn lại hoặc quản lý
 */
export async function GET(req: Request) {
  try {
    await requireAdmin(req);
    const { searchParams } = new URL(req.url);

    const mediaKind = searchParams.get("mediaKind")?.trim().toUpperCase() || "ALL";
    const status = searchParams.get("status")?.trim().toUpperCase() || "ALL";
    const folder = searchParams.get("folder")?.trim() || "";
    const q = searchParams.get("q")?.trim() || "";

    const parsedPage = Number.parseInt(searchParams.get("page") || "1", 10);
    const parsedLimit = Number.parseInt(searchParams.get("limit") || "24", 10);
    const page = Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : 1;
    const limit =
      Number.isFinite(parsedLimit) && parsedLimit > 0
        ? Math.min(parsedLimit, 60)
        : 24;

    await connectToDatabase();

    const filter: Record<string, unknown> = {};

    if (
      mediaKind === MEDIA_KINDS.IMAGE ||
      mediaKind === MEDIA_KINDS.AUDIO
    ) {
      filter.mediaKind = mediaKind;
    }

    if (
      status === MEDIA_ASSET_STATUS.TEMP ||
      status === MEDIA_ASSET_STATUS.ATTACHED ||
      status === MEDIA_ASSET_STATUS.ORPHANED
    ) {
      filter.status = status;
    }

    if (folder) {
      filter.folder = { $regex: `^${escapeRegexInput(folder)}`, $options: "i" };
    }

    if (q) {
      const escaped = escapeRegexInput(q);
      filter.$or = [
        { originalFilename: { $regex: escaped, $options: "i" } },
        { publicId: { $regex: escaped, $options: "i" } },
      ];
    }

    const [
      total,
      assets,
      allCount,
      attachedCount,
      tempCount,
      orphanedCount,
    ] = await Promise.all([
      MediaAsset.countDocuments(filter),
      MediaAsset.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      MediaAsset.countDocuments({}),
      MediaAsset.countDocuments({ status: MEDIA_ASSET_STATUS.ATTACHED }),
      MediaAsset.countDocuments({ status: MEDIA_ASSET_STATUS.TEMP }),
      MediaAsset.countDocuments({ status: MEDIA_ASSET_STATUS.ORPHANED }),
    ]);

    return NextResponse.json({
      success: true,
      assets: assets.map((a) => ({
        ...a,
        _id: a._id.toString(),
        uploadedBy: a.uploadedBy?.toString(),
        usedBy: Array.isArray(a.usedBy)
          ? a.usedBy.map((ref) => ({
              targetCollection: ref.targetCollection,
              documentId: ref.documentId.toString(),
              role: ref.role,
            }))
          : [],
      })),
      counts: {
        all: allCount,
        attached: attachedCount,
        temp: tempCount,
        orphaned: orphanedCount,
      },
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    });
  } catch (error) {
    return handleAuthError(error);
  }
}

