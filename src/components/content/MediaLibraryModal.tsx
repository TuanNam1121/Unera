"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import {
  CheckCircle2,
  FolderOpen,
  Headphones,
  Image as ImageIcon,
  Loader2,
  Search,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { fetchWithAuth } from "@/components/providers/AuthProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { ContentModule, MediaKind } from "@/constants";
import { formatFileBytes } from "@/lib/content/media-validation";
import type { IMediaAssetDTO } from "@/types";

interface MediaLibraryModalProps {
  open: boolean;
  onClose: () => void;
  onSelect: (asset: IMediaAssetDTO) => void;
  mediaKindFilter?: MediaKind | "ALL";
  module?: ContentModule;
  title?: string;
}

export function MediaLibraryModal({
  open,
  onClose,
  onSelect,
  mediaKindFilter = "ALL",
  module = "general",
  title = "Thư viện Media Cloudinary",
}: MediaLibraryModalProps) {
  const [assets, setAssets] = useState<IMediaAssetDTO[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [kindFilter, setKindFilter] = useState<MediaKind | "ALL">(
    mediaKindFilter
  );
  const [searchInput, setSearchInput] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const fetchMediaList = useCallback(async () => {
    const params = new URLSearchParams({ page: "1", limit: "30" });
    if (kindFilter !== "ALL") params.set("mediaKind", kindFilter);
    if (appliedSearch) params.set("q", appliedSearch);

    const res = await fetchWithAuth(`/api/admin/media?${params.toString()}`, {
      cache: "no-store",
    });
    const data = await res.json();
    return { ok: res.ok, data };
  }, [kindFilter, appliedSearch]);

  useEffect(() => {
    if (!open) return;
    let active = true;
    Promise.resolve()
      .then(() => {
        if (active) setLoading(true);
        return fetchMediaList();
      })
      .then(({ ok, data }) => {
        if (!active) return;
        if (ok && data.success) {
          setAssets(data.assets || []);
          setFeedback(null);
        } else {
          setFeedback({
            type: "error",
            text: data.error || "Không thể tải danh sách media.",
          });
        }
      })
      .catch(() => {
        if (active) {
          setFeedback({
            type: "error",
            text: "Lỗi kết nối khi tải thư viện media.",
          });
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [open, fetchMediaList]);

  if (!open) return null;

  const handleUploadNew = async (file: File | undefined) => {
    if (!file) return;
    const isAudio =
      file.type.startsWith("audio/") ||
      /\.(mp3|wav|m4a|ogg)$/i.test(file.name);
    const kind: MediaKind =
      mediaKindFilter !== "ALL"
        ? mediaKindFilter
        : isAudio
        ? "AUDIO"
        : "IMAGE";

    setUploading(true);
    setFeedback(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("kind", kind);
      formData.append("module", module);

      const res = await fetchWithAuth("/api/admin/media/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok || !data.asset) {
        setFeedback({
          type: "error",
          text: data.error || "Upload tệp thất bại.",
        });
        return;
      }

      setAssets((prev) => [data.asset, ...prev]);
      setFeedback({
        type: "success",
        text: `Đã tải lên "${data.asset.originalFilename}".`,
      });
    } catch {
      setFeedback({
        type: "error",
        text: "Lỗi kết nối khi tải tệp lên Cloudinary.",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteAsset = async (asset: IMediaAssetDTO) => {
    setDeletingId(asset._id);
    setFeedback(null);
    try {
      const res = await fetchWithAuth(`/api/admin/media/${asset._id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) {
        setFeedback({
          type: "error",
          text: data.error || "Không thể xóa tài nguyên này.",
        });
        return;
      }
      setAssets((prev) => prev.filter((a) => a._id !== asset._id));
      setFeedback({
        type: "success",
        text: `Đã xóa "${asset.originalFilename}" khỏi Cloudinary.`,
      });
    } catch {
      setFeedback({ type: "error", text: "Lỗi kết nối khi xóa media." });
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
      <div className="flex max-h-[88vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <div className="flex items-center gap-2.5">
            <FolderOpen className="h-5 w-5 text-blue-600" />
            <div>
              <h3 className="text-base font-bold text-slate-900">{title}</h3>
              <p className="text-xs text-slate-500">
                Chọn tài nguyên đã lưu trên Cloudinary hoặc tải tệp mới.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 bg-slate-50/70 px-5 py-3">
          <div className="flex flex-wrap items-center gap-2">
            {mediaKindFilter === "ALL" && (
              <div className="inline-flex rounded-xl border border-slate-200 bg-white p-0.5 text-xs">
                {(["ALL", "IMAGE", "AUDIO"] as const).map((k) => (
                  <button
                    key={k}
                    type="button"
                    onClick={() => setKindFilter(k)}
                    className={`rounded-lg px-2.5 py-1 font-medium cursor-pointer ${
                      kindFilter === k
                        ? "bg-slate-900 text-white"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    {k === "ALL" ? "Tất cả" : k === "IMAGE" ? "Ảnh" : "Audio"}
                  </button>
                ))}
              </div>
            )}

            <div className="flex items-center gap-1.5">
              <div className="relative">
                <Search className="pointer-events-none absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
                <Input
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      setAppliedSearch(searchInput.trim());
                    }
                  }}
                  placeholder="Tìm theo tên tệp..."
                  className="h-8 w-48 pl-8 text-xs bg-white"
                />
              </div>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="h-8 text-xs"
                onClick={() => setAppliedSearch(searchInput.trim())}
              >
                Lọc
              </Button>
            </div>
          </div>

          <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl bg-blue-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 transition-colors">
            {uploading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Upload className="h-3.5 w-3.5" />
            )}
            <span>{uploading ? "Đang tải lên..." : "Tải tệp mới"}</span>
            <input
              type="file"
              className="hidden"
              disabled={uploading}
              accept={
                mediaKindFilter === "AUDIO"
                  ? "audio/mpeg,audio/wav,audio/mp4,audio/ogg,.mp3,.wav,.m4a,.ogg"
                  : mediaKindFilter === "IMAGE"
                  ? "image/jpeg,image/png,image/webp,image/gif"
                  : "image/jpeg,image/png,image/webp,image/gif,audio/mpeg,audio/wav,audio/mp4,audio/ogg,.mp3,.wav,.m4a,.ogg"
              }
              onChange={(e) => {
                const file = e.target.files?.[0];
                e.target.value = "";
                void handleUploadNew(file);
              }}
            />
          </label>
        </div>

        {feedback && (
          <div
            className={`mx-5 mt-3 rounded-xl border px-3.5 py-2 text-xs font-medium ${
              feedback.type === "error"
                ? "border-rose-200 bg-rose-50 text-rose-700"
                : "border-emerald-200 bg-emerald-50 text-emerald-700"
            }`}
          >
            {feedback.text}
          </div>
        )}

        {/* Asset Grid */}
        <div className="flex-1 overflow-y-auto p-5">
          {loading ? (
            <div className="flex h-48 items-center justify-center gap-2 text-sm text-slate-500">
              <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
              <span>Đang tải thư viện media...</span>
            </div>
          ) : assets.length === 0 ? (
            <div className="flex h-48 flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-slate-200 text-center">
              <ImageIcon className="h-8 w-8 text-slate-300" />
              <p className="text-sm font-medium text-slate-600">
                Chưa có tệp media phù hợp trong thư viện.
              </p>
              <p className="text-xs text-slate-400">
                Hãy bấm &ldquo;Tải tệp mới&rdquo; để upload lên Cloudinary.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {assets.map((asset) => (
                <div
                  key={asset._id}
                  className="group flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white transition-all hover:border-blue-300 hover:shadow-sm"
                >
                  <div className="relative aspect-video w-full bg-slate-100">
                    {asset.mediaKind === "IMAGE" ? (
                      <Image
                        src={asset.url}
                        alt={asset.originalFilename}
                        fill
                        unoptimized
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex h-full flex-col items-center justify-center gap-2 bg-gradient-to-br from-blue-50 to-indigo-50 p-3">
                        <Headphones className="h-7 w-7 text-blue-600" />
                        <audio
                          controls
                          preload="metadata"
                          src={asset.url}
                          className="h-8 w-full"
                        />
                      </div>
                    )}
                    <span
                      className={`absolute left-2 top-2 rounded-md px-2 py-0.5 text-[10px] font-bold shadow-xs ${
                        asset.status === "ATTACHED"
                          ? "bg-emerald-600 text-white"
                          : asset.status === "ORPHANED"
                          ? "bg-amber-500 text-white"
                          : "bg-slate-700 text-white"
                      }`}
                    >
                      {asset.status === "ATTACHED"
                        ? `Đang dùng (${asset.usedBy.length})`
                        : asset.status === "ORPHANED"
                        ? "Chưa gắn"
                        : "Tạm"}
                    </span>
                  </div>

                  <div className="flex flex-1 flex-col justify-between p-3 space-y-2.5">
                    <div>
                      <p
                        className="truncate text-xs font-semibold text-slate-800"
                        title={asset.originalFilename}
                      >
                        {asset.originalFilename}
                      </p>
                      <p className="mt-0.5 text-[11px] text-slate-500">
                        {asset.format.toUpperCase()} •{" "}
                        {formatFileBytes(asset.bytes)}
                        {asset.width && asset.height
                          ? ` • ${asset.width}x${asset.height}`
                          : ""}
                      </p>
                    </div>

                    <div className="flex items-center justify-between gap-2 pt-1">
                      <Button
                        type="button"
                        size="sm"
                        className="h-8 flex-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-xs gap-1"
                        onClick={() => {
                          onSelect(asset);
                          onClose();
                        }}
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Chọn sử dụng
                      </Button>

                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={
                          deletingId === asset._id || asset.usedBy.length > 0
                        }
                        title={
                          asset.usedBy.length > 0
                            ? "Đang được dùng trong bài viết"
                            : "Xóa khỏi Cloudinary"
                        }
                        className="h-8 px-2 text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                        onClick={() => handleDeleteAsset(asset)}
                      >
                        {deletingId === asset._id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="h-3.5 w-3.5" />
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
