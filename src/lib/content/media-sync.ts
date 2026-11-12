import { Types } from "mongoose";
import {
  ContentTargetCollection,
  MEDIA_ASSET_STATUS,
} from "@/constants";
import {
  destroyCloudinaryAsset,
  isCloudinaryConfigured,
} from "@/lib/cloudinary";
import { extractMediaRefsFromTiptapAndCover } from "@/lib/content/tiptap-utils";
import { MediaAsset } from "@/models/MediaAsset";
import type { TiptapJSONDoc } from "@/types";

/**
 * Đồng bộ liên kết MediaAsset.usedBy khi tạo/sửa bài viết hoặc xóa block ảnh/audio khỏi bài.
 */
export async function syncContentMediaRefs(params: {
  targetCollection: ContentTargetCollection;
  documentId: Types.ObjectId | string;
  coverImage?: string | null;
  contentJson?: TiptapJSONDoc | null;
}) {
  const docObjectId =
    typeof params.documentId === "string"
      ? new Types.ObjectId(params.documentId)
      : params.documentId;

  const extracted = extractMediaRefsFromTiptapAndCover({
    coverImage: params.coverImage,
    contentJson: params.contentJson,
  });

  const publicIds = Array.from(
    new Set(extracted.map((r) => r.publicId).filter((v): v is string => Boolean(v)))
  );
  const urls = Array.from(
    new Set(extracted.map((r) => r.url).filter(Boolean))
  );

  // 1. Tìm tất cả MediaAsset khớp theo publicId hoặc url trong phiên bản hiện tại của bài
  const matchedAssets =
    publicIds.length > 0 || urls.length > 0
      ? await MediaAsset.find({
          $or: [
            ...(publicIds.length > 0 ? [{ publicId: { $in: publicIds } }] : []),
            ...(urls.length > 0 ? [{ url: { $in: urls } }] : []),
          ],
        })
      : [];

  const matchedIds = new Set(matchedAssets.map((a) => a._id.toString()));

  // Xác định role ("COVER" ưu tiên nếu vừa làm cover vừa trong bài, ngược lại "CONTENT")
  const coverUrl = params.coverImage?.trim() || "";

  // 2. Gắn tham chiếu cho các MediaAsset đang xuất hiện trong bài
  for (const asset of matchedAssets) {
    const role: "COVER" | "CONTENT" =
      coverUrl && asset.url === coverUrl ? "COVER" : "CONTENT";

    const filteredRefs = asset.usedBy.filter(
      (ref) =>
        !(
          ref.targetCollection === params.targetCollection &&
          ref.documentId.toString() === docObjectId.toString()
        )
    );

    filteredRefs.push({
      targetCollection: params.targetCollection,
      documentId: docObjectId,
      role,
    });

    asset.usedBy = filteredRefs;
    asset.status = MEDIA_ASSET_STATUS.ATTACHED;
    await asset.save();
  }

  // 3. Gỡ tham chiếu của bài này khỏi các MediaAsset từng dùng trước đây nhưng không còn trong bản mới
  const previouslyLinked = await MediaAsset.find({
    usedBy: {
      $elemMatch: {
        targetCollection: params.targetCollection,
        documentId: docObjectId,
      },
    },
  });

  for (const asset of previouslyLinked) {
    if (matchedIds.has(asset._id.toString())) continue;

    asset.usedBy = asset.usedBy.filter(
      (ref) =>
        !(
          ref.targetCollection === params.targetCollection &&
          ref.documentId.toString() === docObjectId.toString()
        )
    );

    asset.status =
      asset.usedBy.length > 0
        ? MEDIA_ASSET_STATUS.ATTACHED
        : MEDIA_ASSET_STATUS.ORPHANED;

    await asset.save();
  }
}

/**
 * Gỡ toàn bộ tham chiếu khi xóa bài viết và xóa file khỏi Cloudinary nếu không còn bài nào khác sử dụng.
 */
export async function detachAndDeleteUnusedMedia(params: {
  targetCollection: ContentTargetCollection;
  documentId: Types.ObjectId | string;
  deleteUnusedOnCloudinary?: boolean;
}): Promise<{
  detachedCount: number;
  deletedCloudinaryCount: number;
  keptSharedCount: number;
}> {
  const docObjectId =
    typeof params.documentId === "string"
      ? new Types.ObjectId(params.documentId)
      : params.documentId;

  const linkedAssets = await MediaAsset.find({
    usedBy: {
      $elemMatch: {
        targetCollection: params.targetCollection,
        documentId: docObjectId,
      },
    },
  });

  let detachedCount = 0;
  let deletedCloudinaryCount = 0;
  let keptSharedCount = 0;

  for (const asset of linkedAssets) {
    detachedCount += 1;
    asset.usedBy = asset.usedBy.filter(
      (ref) =>
        !(
          ref.targetCollection === params.targetCollection &&
          ref.documentId.toString() === docObjectId.toString()
        )
    );

    if (asset.usedBy.length > 0) {
      asset.status = MEDIA_ASSET_STATUS.ATTACHED;
      await asset.save();
      keptSharedCount += 1;
      continue;
    }

    if (params.deleteUnusedOnCloudinary !== false && isCloudinaryConfigured()) {
      try {
        await destroyCloudinaryAsset(asset.publicId, asset.resourceType);
        await MediaAsset.deleteOne({ _id: asset._id });
        deletedCloudinaryCount += 1;
        continue;
      } catch (err) {
        console.error(
          `Failed to destroy Cloudinary asset ${asset.publicId}:`,
          err
        );
      }
    }

    asset.status = MEDIA_ASSET_STATUS.ORPHANED;
    await asset.save();
  }

  return { detachedCount, deletedCloudinaryCount, keptSharedCount };
}

/**
 * Dọn rác các MediaAsset đang ORPHANED hoặc TEMP quá hạn trên Cloudinary & MongoDB.
 */
export async function cleanupOrphanedMedia(options?: {
  tempOlderThanHours?: number;
  includeOrphaned?: boolean;
}): Promise<{
  scanned: number;
  deleted: number;
  failed: number;
}> {
  const hours = options?.tempOlderThanHours ?? 24;
  const includeOrphaned = options?.includeOrphaned ?? true;
  const tempCutoff = new Date(Date.now() - hours * 60 * 60 * 1000);

  const orConditions: Record<string, unknown>[] = [
    {
      status: MEDIA_ASSET_STATUS.TEMP,
      createdAt: { $lte: tempCutoff },
      "usedBy.0": { $exists: false },
    },
  ];

  if (includeOrphaned) {
    orConditions.push({
      status: MEDIA_ASSET_STATUS.ORPHANED,
      "usedBy.0": { $exists: false },
    });
  }

  const candidates = await MediaAsset.find({ $or: orConditions }).limit(100);
  let deleted = 0;
  let failed = 0;

  const canDestroyCloudinary = isCloudinaryConfigured();

  for (const asset of candidates) {
    if (canDestroyCloudinary) {
      try {
        await destroyCloudinaryAsset(asset.publicId, asset.resourceType);
      } catch (err) {
        console.error(`Cleanup Cloudinary destroy error (${asset.publicId}):`, err);
        failed += 1;
        continue;
      }
    }
    await MediaAsset.deleteOne({ _id: asset._id });
    deleted += 1;
  }

  return {
    scanned: candidates.length,
    deleted,
    failed,
  };
}

