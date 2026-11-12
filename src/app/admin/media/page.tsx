"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  Compass,
  FolderOpen,
  Headphones,
  Image as ImageIcon,
  Loader2,
  Search,
  Sparkles,
  Trash2,
  Upload,
} from "lucide-react";
import { fetchWithAuth } from "@/components/providers/AuthProvider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { formatFileBytes } from "@/lib/content/media-validation";
import type { IMediaAssetDTO } from "@/types";

export default function AdminMediaLibraryPage() {
  const [assets, setAssets] = useState<IMediaAssetDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [cleaning, setCleaning] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const [kindFilter, setKindFilter] = useState<"ALL" | "IMAGE" | "AUDIO">("ALL");
  const [statusFilter, setStatusFilter] = useState<
    "ALL" | "ATTACHED" | "TEMP" | "ORPHANED"
  >("ALL");
  const [searchInput, setSearchInput] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [counts, setCounts] = useState({
    all: 0,
    attached: 0,
    temp: 0,
    orphaned: 0,
  });

  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const fetchMediaPayload = useCallback(async () => {
    const params = new URLSearchParams({ page: String(page), limit: "24" });
    if (kindFilter !== "ALL") params.set("mediaKind", kindFilter);
    if (statusFilter !== "ALL") params.set("status", statusFilter);
    if (appliedSearch) params.set("q", appliedSearch);

    const res = await fetchWithAuth(`/api/admin/media?${params.toString()}`, {
      cache: "no-store",
    });
    const data = await res.json();
    return { ok: res.ok, data };
  }, [page, kindFilter, statusFilter, appliedSearch]);

  const loadMedia = useCallback(async () => {
    try {
      const { ok, data } = await fetchMediaPayload();
      if (ok && data.success) {
        setAssets(data.assets || []);
        if (data.counts) setCounts(data.counts);
        setTotalPages(data.pagination?.totalPages || 1);
      } else {
        setFeedback({
          type: "error",
          text: data.error || "Không thể tải thư viện media.",
        });
      }
    } catch {
      setFeedback({
        type: "error",
        text: "Lỗi kết nối khi tải thư viện media.",
      });
    } finally {
      setLoading(false);
    }
  }, [fetchMediaPayload]);

  useEffect(() => {
    let active = true;
    fetchMediaPayload()
      .then(({ ok, data }) => {
        if (!active) return;
        if (ok && data.success) {
          setAssets(data.assets || []);
          if (data.counts) setCounts(data.counts);
          setTotalPages(data.pagination?.totalPages || 1);
        } else {
          setFeedback({
            type: "error",
            text: data.error || "Không thể tải thư viện media.",
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
  }, [fetchMediaPayload]);

  const handleUploadFile = async (file: File | undefined) => {
    if (!file) return;
    const isAudio =
      file.type.startsWith("audio/") ||
      /\.(mp3|wav|m4a|ogg)$/i.test(file.name);

    setUploading(true);
    setFeedback(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("kind", isAudio ? "AUDIO" : "IMAGE");
      formData.append("module", "general");

      const res = await fetchWithAuth("/api/admin/media/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();

      if (!res.ok) {
        setFeedback({
          type: "error",
          text: data.error || "Upload tệp thất bại.",
        });
        return;
      }

      await loadMedia();
      setFeedback({
        type: "success",
        text: `Đã upload "${data.asset.originalFilename}" lên Cloudinary.`,
      });
    } catch {
      setFeedback({
        type: "error",
        text: "Lỗi kết nối khi upload lên Cloudinary.",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteAsset = async (asset: IMediaAssetDTO) => {
    setBusyId(asset._id);
    setFeedback(null);
    try {
      const res = await fetchWithAuth(`/api/admin/media/${asset._id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) {
        setFeedback({
          type: "error",
          text: data.error || "Không thể xóa tài nguyên media.",
        });
        return;
      }
      await loadMedia();
      setFeedback({
        type: "success",
        text: `Đã xóa "${asset.originalFilename}" khỏi Cloudinary.`,
      });
    } catch {
      setFeedback({ type: "error", text: "Lỗi kết nối khi xóa media." });
    } finally {
      setBusyId(null);
    }
  };

  const handleCleanupOrphans = async () => {
    setCleaning(true);
    setFeedback(null);
    try {
      const res = await fetchWithAuth("/api/admin/media/cleanup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tempOlderThanHours: 24, includeOrphaned: true }),
      });
      const data = await res.json();
      if (!res.ok) {
        setFeedback({
          type: "error",
          text: data.error || "Không thể chạy dọn rác media.",
        });
        return;
      }
      await loadMedia();
      setFeedback({
        type: "success",
        text: `Đã quét ${data.scanned} tệp mồ côi/quá hạn và xóa ${data.deleted} tệp khỏi Cloudinary.`,
      });
    } catch {
      setFeedback({
        type: "error",
        text: "Lỗi kết nối khi dọn rác Cloudinary.",
      });
    } finally {
      setCleaning(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Link
              href="/admin"
              className="inline-flex items-center gap-1 hover:text-blue-600"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Admin Dashboard
            </Link>
            <span>/</span>
            <span className="font-medium text-slate-700">
              Thư viện Media Cloudinary
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Content Management — Thư viện Media Cloudinary
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Quản lý tập trung ảnh &amp; audio trên Cloudinary dùng chung cho tất cả module bài viết (Khám phá định hướng, Hoạt động, Tin tức).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Link href="/admin/explore">
            <Button variant="outline" size="sm" className="gap-1.5 rounded-xl">
              <Compass className="h-4 w-4 text-blue-600" />
              Bài viết định hướng
            </Button>
          </Link>

          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={cleaning}
            onClick={handleCleanupOrphans}
            className="gap-1.5 rounded-xl border-amber-200 text-amber-700 hover:bg-amber-50"
          >
            {cleaning ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            Dọn rác Media ({counts.orphaned})
          </Button>

          <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl bg-blue-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-blue-700 transition-colors">
            {uploading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Upload className="h-4 w-4" />
            )}
            <span>{uploading ? "Đang upload..." : "Upload Ảnh / Audio"}</span>
            <input
              type="file"
              className="hidden"
              disabled={uploading}
              accept="image/jpeg,image/png,image/webp,image/gif,audio/mpeg,audio/wav,audio/mp4,audio/ogg,.mp3,.wav,.m4a,.ogg"
              onChange={(e) => {
                const file = e.target.files?.[0];
                e.target.value = "";
                void handleUploadFile(file);
              }}
            />
          </label>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <Card className="border-slate-200">
          <CardContent className="p-4">
            <p className="text-xs font-medium text-slate-500">Tổng tài nguyên</p>
            <p className="mt-1 text-2xl font-bold text-slate-900">{counts.all}</p>
          </CardContent>
        </Card>
        <Card className="border-emerald-200 bg-emerald-50/40">
          <CardContent className="p-4">
            <p className="text-xs font-medium text-emerald-700">Đang gắn bài viết</p>
            <p className="mt-1 text-2xl font-bold text-emerald-700">
              {counts.attached}
            </p>
          </CardContent>
        </Card>
        <Card className="border-slate-200">
          <CardContent className="p-4">
            <p className="text-xs font-medium text-slate-500">Tạm (chưa lưu bài)</p>
            <p className="mt-1 text-2xl font-bold text-slate-800">{counts.temp}</p>
          </CardContent>
        </Card>
        <Card className="border-amber-200 bg-amber-50/40">
          <CardContent className="p-4">
            <p className="text-xs font-medium text-amber-700">Mồ côi (sẵn sàng dọn)</p>
            <p className="mt-1 text-2xl font-bold text-amber-700">
              {counts.orphaned}
            </p>
          </CardContent>
        </Card>
      </div>

      {feedback && (
        <div
          className={`rounded-xl border px-4 py-2.5 text-sm font-medium ${
            feedback.type === "error"
              ? "border-rose-200 bg-rose-50 text-rose-700"
              : "border-emerald-200 bg-emerald-50 text-emerald-700"
          }`}
        >
          {feedback.text}
        </div>
      )}

      {/* Filter Bar */}
      <Card className="border-slate-200">
        <CardContent className="p-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            {(["ALL", "IMAGE", "AUDIO"] as const).map((k) => (
              <Button
                key={k}
                type="button"
                size="sm"
                variant={kindFilter === k ? "default" : "outline"}
                onClick={() => {
                  setKindFilter(k);
                  setPage(1);
                }}
              >
                {k === "ALL" ? "Tất cả loại" : k === "IMAGE" ? "Ảnh" : "Audio"}
              </Button>
            ))}

            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(
                  e.target.value as "ALL" | "ATTACHED" | "TEMP" | "ORPHANED"
                );
                setPage(1);
              }}
              className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700"
            >
              <option value="ALL">Mọi trạng thái</option>
              <option value="ATTACHED">Đang gắn bài (ATTACHED)</option>
              <option value="TEMP">Tạm (TEMP)</option>
              <option value="ORPHANED">Mồ côi (ORPHANED)</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    setAppliedSearch(searchInput.trim());
                    setPage(1);
                  }
                }}
                placeholder="Tìm tên tệp hoặc publicId..."
                className="w-60 pl-9 h-9 text-xs"
              />
            </div>
            <Button
              type="button"
              size="sm"
              onClick={() => {
                setAppliedSearch(searchInput.trim());
                setPage(1);
              }}
            >
              Tìm kiếm
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Asset Grid */}
      {loading ? (
        <div className="flex min-h-[260px] items-center justify-center gap-2 text-sm text-slate-500">
          <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
          <span>Đang tải thư viện media...</span>
        </div>
      ) : assets.length === 0 ? (
        <Card className="border-slate-200">
          <CardContent className="flex min-h-[260px] flex-col items-center justify-center gap-2 text-center">
            <FolderOpen className="h-10 w-10 text-slate-300" />
            <p className="text-sm font-semibold text-slate-700">
              Chưa có tài nguyên media nào khớp bộ lọc.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {assets.map((asset) => (
            <Card
              key={asset._id}
              className="overflow-hidden border-slate-200 flex flex-col"
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

                <Badge className="absolute left-2 top-2 text-[10px]">
                  {asset.mediaKind === "IMAGE" ? (
                    <ImageIcon className="mr-1 h-3 w-3" />
                  ) : (
                    <Headphones className="mr-1 h-3 w-3" />
                  )}
                  {asset.format.toUpperCase()}
                </Badge>
              </div>

              <CardContent className="flex-1 p-3.5 flex flex-col justify-between gap-2.5">
                <div className="space-y-1">
                  <p
                    className="truncate text-xs font-bold text-slate-900"
                    title={asset.originalFilename}
                  >
                    {asset.originalFilename}
                  </p>
                  <p className="text-[11px] text-slate-500">
                    {formatFileBytes(asset.bytes)} • {asset.folder}
                  </p>
                  <p className="text-[11px] font-medium text-slate-600">
                    Trạng thái:{" "}
                    <span
                      className={
                        asset.status === "ATTACHED"
                          ? "text-emerald-700"
                          : asset.status === "ORPHANED"
                          ? "text-amber-700"
                          : "text-slate-600"
                      }
                    >
                      {asset.status} ({asset.usedBy.length} liên kết)
                    </span>
                  </p>
                </div>

                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={busyId === asset._id || asset.usedBy.length > 0}
                  onClick={() => handleDeleteAsset(asset)}
                  className="w-full h-8 text-xs text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                >
                  {busyId === asset._id ? (
                    <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                  )}
                  {asset.usedBy.length > 0
                    ? "Đang gắn bài viết"
                    : "Xóa khỏi Cloudinary"}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
          >
            Trang trước
          </Button>
          <span className="text-xs font-medium text-slate-600">
            Trang {page} / {totalPages}
          </span>
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Trang sau
          </Button>
        </div>
      )}
    </div>
  );
}

