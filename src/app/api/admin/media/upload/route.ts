import { NextResponse } from "next/server";
import { Types } from "mongoose";
import {
  ALLOWED_AUDIO_MIMES,
  ALLOWED_IMAGE_MIMES,
  CONTENT_MODULES,
  ContentModule,
  MAX_AUDIO_UPLOAD_BYTES,
  MAX_IMAGE_UPLOAD_BYTES,
  MEDIA_ASSET_STATUS,
  MEDIA_KINDS,
  MediaKind,
} from "@/constants";
import { logAuditAction } from "@/lib/audit";
import {
  isCloudinaryConfigured,
  uploadBufferToCloudinary,
} from "@/lib/cloudinary";
import {
  detectMediaMagicBytes,
  sanitizeOriginalFilename,
} from "@/lib/content/media-validation";
import { connectToDatabase } from "@/lib/db";
import { handleAuthError, requireAdmin } from "@/lib/session";
import { MediaAsset } from "@/models/MediaAsset";

const VALID_MODULES = new Set<string>(Object.values(CONTENT_MODULES));

/**
 * POST /api/admin/media/upload
 * Cổng upload ảnh / audio lên Cloudinary cho Admin CMS (kiểm tra quyền, dung lượng, MIME & magic bytes)
 */
export async function POST(req: Request) {
  try {
    const admin = await requireAdmin(req);

    if (!isCloudinaryConfigured()) {
      return NextResponse.json(
        {
          error:
            "Hệ thống lưu trữ Cloudinary chưa được cấu hình. Vui lòng kiểm tra biến môi trường CLOUDINARY_*.",
        },
        { status: 503 }
      );
    }

    const formData = await req.formData();
    const rawFile = formData.get("file");
    const rawKind = String(formData.get("kind") || "IMAGE")
      .trim()
      .toUpperCase();
    const rawModule = String(formData.get("module") || "general")
      .trim()
      .toLowerCase();

    if (!(rawFile instanceof File)) {
      return NextResponse.json(
        { error: "Vui lòng chọn tệp media hợp lệ để tải lên." },
        { status: 400 }
      );
    }

    if (rawKind !== MEDIA_KINDS.IMAGE && rawKind !== MEDIA_KINDS.AUDIO) {
      return NextResponse.json(
        { error: 'Loại media phải là "IMAGE" hoặc "AUDIO".' },
        { status: 400 }
      );
    }

    const mediaKind = rawKind as MediaKind;
    const maxBytes =
      mediaKind === MEDIA_KINDS.IMAGE
        ? MAX_IMAGE_UPLOAD_BYTES
        : MAX_AUDIO_UPLOAD_BYTES;

    if (rawFile.size <= 0) {
      return NextResponse.json(
        { error: "Tệp tải lên bị rỗng." },
        { status: 400 }
      );
    }

    if (rawFile.size > maxBytes) {
      const maxMb = Math.round(maxBytes / (1024 * 1024));
      return NextResponse.json(
        {
          error: `Dung lượng tệp vượt quá giới hạn tối đa ${maxMb}MB cho ${mediaKind === "IMAGE" ? "ảnh" : "audio"}.`,
        },
        { status: 413 }
      );
    }

    const buffer = Buffer.from(await rawFile.arrayBuffer());
    const detected = detectMediaMagicBytes(buffer);

    if (!detected || detected.mediaKind !== mediaKind) {
      return NextResponse.json(
        {
          error:
            mediaKind === MEDIA_KINDS.IMAGE
              ? "Tệp không hợp lệ. Chỉ hỗ trợ ảnh thực JPEG, PNG, WebP hoặc GIF (không chấp nhận SVG/tệp giả mạo)."
              : "Tệp âm thanh không hợp lệ. Chỉ hỗ trợ MP3, WAV, M4A hoặc OGG.",
        },
        { status: 400 }
      );
    }

    const declaredMime = rawFile.type?.toLowerCase().trim();
    if (declaredMime) {
      const allowedMimes: readonly string[] =
        mediaKind === MEDIA_KINDS.IMAGE
          ? ALLOWED_IMAGE_MIMES
          : ALLOWED_AUDIO_MIMES;
      if (!allowedMimes.includes(declaredMime)) {
        return NextResponse.json(
          { error: `Định dạng MIME "${declaredMime}" không được hỗ trợ.` },
          { status: 400 }
        );
      }
    }

    const safeModule: ContentModule = VALID_MODULES.has(rawModule)
      ? (rawModule as ContentModule)
      : CONTENT_MODULES.GENERAL;

    const now = new Date();
    const yearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const folder = `unera/${safeModule}/${yearMonth}`;
    const originalFilename = sanitizeOriginalFilename(
      rawFile.name || `upload.${detected.extension}`
    );
    const filenameBase = originalFilename.replace(/\.[^.]+$/, "") || "media";

    const uploaded = await uploadBufferToCloudinary({
      buffer,
      folder,
      resourceType: mediaKind === MEDIA_KINDS.IMAGE ? "image" : "video",
      filenameBase,
    });

    await connectToDatabase();

    const asset = await MediaAsset.create({
      publicId: uploaded.publicId,
      url: uploaded.url,
      resourceType: uploaded.resourceType,
      mediaKind,
      folder,
      originalFilename,
      mimeType: detected.mimeType,
      format: uploaded.format || detected.extension,
      bytes: uploaded.bytes || buffer.length,
      width: uploaded.width,
      height: uploaded.height,
      duration: uploaded.duration,
      status: MEDIA_ASSET_STATUS.TEMP,
      usedBy: [],
      uploadedBy: new Types.ObjectId(admin.id),
    });

    await logAuditAction({
      admin: { id: admin.id, email: admin.email, name: admin.name },
      action: "CREATE",
      targetCollection: "media_assets",
      targetId: asset._id,
      targetTitle: `${mediaKind}: ${originalFilename}`,
      changesAfter: {
        publicId: asset.publicId,
        url: asset.url,
        bytes: asset.bytes,
        folder: asset.folder,
      },
      req,
    });

    return NextResponse.json(
      {
        success: true,
        asset: {
          _id: asset._id.toString(),
          publicId: asset.publicId,
          url: asset.url,
          resourceType: asset.resourceType,
          mediaKind: asset.mediaKind,
          folder: asset.folder,
          originalFilename: asset.originalFilename,
          mimeType: asset.mimeType,
          format: asset.format,
          bytes: asset.bytes,
          width: asset.width,
          height: asset.height,
          duration: asset.duration,
          status: asset.status,
          usedBy: [],
          createdAt: asset.createdAt.toISOString(),
        },
      },
      { status: 201 }
    );
  } catch (error) {
    return handleAuthError(error);
  }
}

