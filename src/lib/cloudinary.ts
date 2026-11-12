import { v2 as cloudinary } from "cloudinary";

export function isCloudinaryConfigured(): boolean {
  return Boolean(
    process.env.CLOUDINARY_CLOUD_NAME?.trim() &&
      process.env.CLOUDINARY_API_KEY?.trim() &&
      process.env.CLOUDINARY_API_SECRET?.trim()
  );
}

export function getConfiguredCloudinary() {
  if (!isCloudinaryConfigured()) {
    throw new Error(
      "Cloudinary chưa được cấu hình (thiếu CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY hoặc CLOUDINARY_API_SECRET)."
    );
  }

  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME!.trim(),
    api_key: process.env.CLOUDINARY_API_KEY!.trim(),
    api_secret: process.env.CLOUDINARY_API_SECRET!.trim(),
    secure: true,
  });

  return cloudinary;
}

export interface CloudinaryUploadResult {
  publicId: string;
  url: string;
  resourceType: "image" | "video";
  format: string;
  bytes: number;
  width?: number;
  height?: number;
  duration?: number;
}

export async function uploadBufferToCloudinary(params: {
  buffer: Buffer;
  folder: string;
  resourceType: "image" | "video";
  filenameBase?: string;
}): Promise<CloudinaryUploadResult> {
  const client = getConfiguredCloudinary();

  return new Promise((resolve, reject) => {
    const uploadStream = client.uploader.upload_stream(
      {
        folder: params.folder,
        resource_type: params.resourceType,
        use_filename: Boolean(params.filenameBase),
        unique_filename: true,
        filename_override: params.filenameBase,
        ...(params.resourceType === "image"
          ? {
              transformation: [
                {
                  width: 1920,
                  crop: "limit",
                  quality: "auto",
                  fetch_format: "auto",
                },
              ],
            }
          : {}),
      },
      (error, result) => {
        if (error || !result) {
          reject(error || new Error("Upload lên Cloudinary thất bại."));
          return;
        }
        resolve({
          publicId: result.public_id,
          url: result.secure_url,
          resourceType: params.resourceType,
          format: result.format || "",
          bytes: result.bytes || params.buffer.length,
          width: typeof result.width === "number" ? result.width : undefined,
          height: typeof result.height === "number" ? result.height : undefined,
          duration:
            typeof result.duration === "number" ? result.duration : undefined,
        });
      }
    );

    uploadStream.end(params.buffer);
  });
}

export async function destroyCloudinaryAsset(
  publicId: string,
  resourceType: "image" | "video"
): Promise<{ deleted: boolean; notFound: boolean }> {
  const client = getConfiguredCloudinary();
  const res = await client.uploader.destroy(publicId, {
    resource_type: resourceType,
    invalidate: true,
  });

  const status = typeof res?.result === "string" ? res.result : "";
  return {
    deleted: status === "ok" || status === "not found",
    notFound: status === "not found",
  };
}

