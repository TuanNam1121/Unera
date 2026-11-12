"use client";

import { useState } from "react";
import Image from "next/image";
import { FolderOpen, ImageIcon, Loader2, Trash2, Upload } from "lucide-react";
import { MediaLibraryModal } from "@/components/content/MediaLibraryModal";
import { fetchWithAuth } from "@/components/providers/AuthProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { ContentModule } from "@/constants";

interface CoverImageFieldProps {
  value: string;
  onChange: (url: string) => void;
  module: ContentModule;
  label?: string;
}

export function CoverImageField({
  value,
  onChange,
  module,
  label = "Ảnh bìa bài viết (Cloudinary / URL)",
}: CoverImageFieldProps) {
  const [uploading, setUploading] = useState(false);
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleUpload = async (file: File | undefined) => {
    if (!file) return;
    setUploading(true);
    setErrorMsg(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("kind", "IMAGE");
      formData.append("module", module);

      const res = await fetchWithAuth("/api/admin/media/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();

      if (!res.ok || !data.asset?.url) {
        setErrorMsg(data.error || "Upload ảnh bìa thất bại.");
        return;
      }

      onChange(data.asset.url);
    } catch {
      setErrorMsg("Lỗi kết nối khi upload ảnh bìa lên Cloudinary.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-2.5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <label className="text-xs font-semibold text-slate-700">
          {label}
        </label>
        <div className="flex items-center gap-2">
          <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700 hover:bg-blue-100 transition-colors">
            {uploading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Upload className="h-3.5 w-3.5" />
            )}
            <span>{uploading ? "Đang upload..." : "Upload ảnh bìa"}</span>
            <input
              type="file"
              className="hidden"
              disabled={uploading}
              accept="image/jpeg,image/png,image/webp,image/gif"
              onChange={(e) => {
                const file = e.target.files?.[0];
                e.target.value = "";
                void handleUpload(file);
              }}
            />
          </label>

          <Button
            type="button"
            size="sm"
            variant="outline"
            className="h-7 px-2.5 text-xs gap-1"
            onClick={() => setLibraryOpen(true)}
          >
            <FolderOpen className="h-3.5 w-3.5" />
            Thư viện
          </Button>
        </div>
      </div>

      <Input
        value={value}
        onChange={(e) => {
          setErrorMsg(null);
          onChange(e.target.value);
        }}
        placeholder="https://res.cloudinary.com/... hoặc tải ảnh trực tiếp"
      />

      {errorMsg && (
        <p className="text-xs font-medium text-rose-600">{errorMsg}</p>
      )}

      {value.trim() ? (
        <div className="relative aspect-video w-full overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
          <Image
            src={value.trim()}
            alt="Preview ảnh bìa"
            fill
            unoptimized
            className="object-cover"
          />
          <button
            type="button"
            onClick={() => onChange("")}
            className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-lg bg-slate-900/75 px-2.5 py-1 text-xs font-medium text-white hover:bg-rose-600 transition-colors cursor-pointer"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Gỡ ảnh
          </button>
        </div>
      ) : (
        <div className="flex aspect-video w-full flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed border-slate-200 bg-slate-50/70 text-slate-400">
          <ImageIcon className="h-6 w-6" />
          <span className="text-xs">
            Chưa có ảnh bìa (khuyến nghị 16:9, tối đa 5MB)
          </span>
        </div>
      )}

      <MediaLibraryModal
        open={libraryOpen}
        onClose={() => setLibraryOpen(false)}
        mediaKindFilter="IMAGE"
        module={module}
        title="Chọn ảnh bìa từ Thư viện Cloudinary"
        onSelect={(asset) => onChange(asset.url)}
      />
    </div>
  );
}

