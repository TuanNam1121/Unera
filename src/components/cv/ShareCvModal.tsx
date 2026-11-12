"use client";

import { useState } from "react";
import {
  Check,
  Copy,
  Eye,
  ExternalLink,
  Globe,
  Loader2,
  Lock,
  RefreshCw,
  X,
} from "lucide-react";
import { fetchWithAuth } from "@/components/providers/AuthProvider";
import { Button } from "@/components/ui/button";
import type { ICvDocumentDTO, ICvSharingConfig } from "@/types/cv";

interface ShareCvModalProps {
  open: boolean;
  cvId: string;
  cvTitle: string;
  sharing: ICvSharingConfig;
  onClose: () => void;
  onUpdated: (cv: ICvDocumentDTO) => void;
}

export function ShareCvModal({
  open,
  cvId,
  cvTitle,
  sharing,
  onClose,
  onUpdated,
}: ShareCvModalProps) {
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!open) return null;

  const origin =
    typeof window !== "undefined" ? window.location.origin : "";
  const shareUrl = sharing.shareSlug
    ? `${origin}/cv/${sharing.shareSlug}`
    : "";

  const updateSharing = async (payload: {
    isPublic?: boolean;
    allowPdfDownload?: boolean;
    regenerateSlug?: boolean;
  }) => {
    setSaving(true);
    setErrorMsg(null);
    try {
      const res = await fetchWithAuth(`/api/cv/${cvId}/sharing`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok || !data.cv) {
        setErrorMsg(data.error || "Không thể cập nhật trạng thái chia sẻ.");
        return;
      }
      onUpdated(data.cv as ICvDocumentDTO);
    } catch {
      setErrorMsg("Lỗi kết nối khi cập nhật chia sẻ CV.");
    } finally {
      setSaving(false);
    }
  };

  const handleCopy = async () => {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setErrorMsg("Không thể sao chép vào clipboard.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white border border-slate-200 shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Chia sẻ CV công khai
            </h3>
            <p className="text-xs text-slate-500 mt-0.5 truncate max-w-sm">
              {cvTitle}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {errorMsg && (
            <div className="rounded-xl bg-rose-50 border border-rose-200 px-3 py-2 text-xs text-rose-700">
              {errorMsg}
            </div>
          )}

          {/* Public Toggle */}
          <div className="flex items-center justify-between gap-4 rounded-xl border border-slate-200 p-3.5 bg-slate-50/70">
            <div className="flex items-start gap-3">
              <div
                className={`mt-0.5 rounded-lg p-2 ${
                  sharing.isPublic
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-slate-200 text-slate-600"
                }`}
              >
                {sharing.isPublic ? (
                  <Globe className="h-4 w-4" />
                ) : (
                  <Lock className="h-4 w-4" />
                )}
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">
                  {sharing.isPublic
                    ? "Đang bật chia sẻ bằng liên kết"
                    : "Chế độ riêng tư"}
                </p>
                <p className="text-xs text-slate-500 mt-0.5">
                  {sharing.isPublic
                    ? "Bất kỳ nhà tuyển dụng hoặc mentor nào có liên kết đều có thể xem CV."
                    : "Chỉ mình bạn có thể xem và chỉnh sửa CV này."}
                </p>
              </div>
            </div>

            <Button
              type="button"
              size="sm"
              disabled={saving}
              onClick={() => updateSharing({ isPublic: !sharing.isPublic })}
              className={
                sharing.isPublic
                  ? "bg-slate-800 hover:bg-slate-900 text-white shrink-0"
                  : "bg-blue-600 hover:bg-blue-700 text-white shrink-0"
              }
            >
              {saving ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : sharing.isPublic ? (
                "Tắt chia sẻ"
              ) : (
                "Bật công khai"
              )}
            </Button>
          </div>

          {sharing.isPublic && shareUrl && (
            <>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">
                  Đường dẫn chia sẻ CV
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={shareUrl}
                    className="flex-1 h-9 rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs text-slate-700 font-mono"
                  />
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={handleCopy}
                    className="gap-1.5 shrink-0"
                  >
                    {copied ? (
                      <>
                        <Check className="h-3.5 w-3.5 text-emerald-600" />
                        <span>Đã chép</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5" />
                        <span>Sao chép</span>
                      </>
                    )}
                  </Button>
                  <a
                    href={shareUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex h-9 items-center justify-center rounded-xl border border-slate-200 px-2.5 text-slate-600 hover:bg-slate-50 hover:text-blue-600"
                    title="Mở tab mới xem thử"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </div>
              </div>

              <div className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 px-3.5 py-2.5">
                <div>
                  <p className="text-xs font-semibold text-slate-800">
                    Cho phép người xem tải file PDF
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Hiện nút Tải PDF trực tiếp trên trang xem CV công khai
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={sharing.allowPdfDownload}
                  disabled={saving}
                  onChange={(e) =>
                    updateSharing({ allowPdfDownload: e.target.checked })
                  }
                  className="h-4 w-4 rounded border-slate-300 text-blue-600 accent-blue-600 cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between pt-1 text-xs text-slate-500">
                <span className="inline-flex items-center gap-1.5">
                  <Eye className="h-3.5 w-3.5 text-slate-400" />
                  Tổng lượt xem công khai:{" "}
                  <strong className="text-slate-800">{sharing.viewCount}</strong>
                </span>

                <button
                  type="button"
                  disabled={saving}
                  onClick={() => updateSharing({ regenerateSlug: true })}
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-700 hover:text-amber-800 cursor-pointer"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  <span>Đổi link mới (thu hồi link cũ)</span>
                </button>
              </div>
            </>
          )}
        </div>

        <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 flex justify-end">
          <Button type="button" variant="outline" size="sm" onClick={onClose}>
            Đóng
          </Button>
        </div>
      </div>
    </div>
  );
}

