"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Copy,
  Edit3,
  FilePlus2,
  FileText,
  Globe,
  LayoutTemplate,
  Loader2,
  Lock,
  Pencil,
  Plus,
  Search,
  Share2,
  Sparkles,
  Trash2,
} from "lucide-react";
import { CreateCvModal } from "@/components/cv/CreateCvModal";
import { CvPdfDownloadButton } from "@/components/cv/pdf/CvPdfDownloadButton";
import { CvA4Renderer } from "@/components/cv/preview/CvA4Renderer";
import { ShareCvModal } from "@/components/cv/ShareCvModal";
import { fetchWithAuth, useAuth } from "@/components/providers/AuthProvider";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CV_MAX_PER_USER, DEFAULT_CV_TEMPLATE_ID } from "@/constants/cv";
import { formatRelativeTimeVi } from "@/lib/cv-format";
import { CV_TEMPLATES, getCvTemplate } from "@/lib/cv-templates";
import type {
  ICvDocumentDTO,
  ICvProfilePrefillSeed,
  ICvSummaryDTO,
} from "@/types/cv";

export function CvManagementClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading: authLoading } = useAuth();

  const [cvs, setCvs] = useState<ICvSummaryDTO[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [profileSeed, setProfileSeed] = useState<ICvProfilePrefillSeed | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [templateFilter, setTemplateFilter] = useState("ALL");
  const [sharingFilter, setSharingFilter] = useState("ALL");

  const initialTemplateParam = searchParams.get("createWithTemplate");
  const [createModalOpen, setCreateModalOpen] = useState(() =>
    Boolean(initialTemplateParam)
  );
  const [createDefaultTpl, setCreateDefaultTpl] = useState(
    () => initialTemplateParam || DEFAULT_CV_TEMPLATE_ID
  );
  const [shareTarget, setShareTarget] = useState<ICvSummaryDTO | null>(null);
  const [renameTarget, setRenameTarget] = useState<ICvSummaryDTO | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<ICvSummaryDTO | null>(null);
  const [actionBusyId, setActionBusyId] = useState<string | null>(null);

  const fetchCvsList = useCallback(async () => {
    const qs = new URLSearchParams({ includeProfileSeed: "1" });
    if (searchQuery.trim()) qs.set("q", searchQuery.trim());
    if (templateFilter !== "ALL") qs.set("templateId", templateFilter);
    if (sharingFilter !== "ALL") qs.set("sharing", sharingFilter);

    const res = await fetchWithAuth(`/api/cv?${qs.toString()}`, {
      cache: "no-store",
    });
    const data = await res.json();
    return { ok: res.ok, data };
  }, [searchQuery, templateFilter, sharingFilter]);

  const loadCvs = useCallback(async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const { ok, data } = await fetchCvsList();
      if (!ok) {
        setErrorMsg(data.error || "Không thể tải danh sách CV.");
        return;
      }
      setCvs(Array.isArray(data.cvs) ? data.cvs : []);
      setTotalCount(typeof data.totalCount === "number" ? data.totalCount : 0);
      if (data.profileSeed) {
        setProfileSeed(data.profileSeed);
      }
    } catch {
      setErrorMsg("Lỗi kết nối máy chủ khi tải danh sách CV.");
    } finally {
      setLoading(false);
    }
  }, [fetchCvsList]);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace("/login?callbackUrl=/tools/cv-builder");
      return;
    }
    let cancelled = false;
    fetchCvsList()
      .then(({ ok, data }) => {
        if (cancelled) return;
        if (!ok) {
          setErrorMsg(data.error || "Không thể tải danh sách CV.");
          return;
        }
        setCvs(Array.isArray(data.cvs) ? data.cvs : []);
        setTotalCount(typeof data.totalCount === "number" ? data.totalCount : 0);
        if (data.profileSeed) {
          setProfileSeed(data.profileSeed);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setErrorMsg("Lỗi kết nối máy chủ khi tải danh sách CV.");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [authLoading, user, router, fetchCvsList]);

  const handleQuickBlankCreate = async () => {
    setActionBusyId("quick-blank");
    try {
      const res = await fetchWithAuth("/api/cv", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: `CV mới ${new Date().toLocaleDateString("vi-VN")}`,
          templateId: DEFAULT_CV_TEMPLATE_ID,
          locale: "vi",
          prefillFromProfile: false,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.cv) {
        setErrorMsg(data.error || "Không thể tạo CV trống nhanh.");
        return;
      }
      router.push(`/tools/cv-builder/${data.cv._id}`);
    } catch {
      setErrorMsg("Lỗi kết nối khi tạo CV.");
    } finally {
      setActionBusyId(null);
    }
  };

  const handleDuplicate = async (cv: ICvSummaryDTO) => {
    setActionBusyId(cv._id);
    setErrorMsg(null);
    try {
      const res = await fetchWithAuth(`/api/cv/${cv._id}/duplicate`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok || !data.cv) {
        setErrorMsg(data.error || "Không thể nhân bản CV.");
        return;
      }
      await loadCvs();
    } catch {
      setErrorMsg("Lỗi kết nối khi nhân bản CV.");
    } finally {
      setActionBusyId(null);
    }
  };

  const handleConfirmRename = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!renameTarget || renameValue.trim().length < 2) return;
    setActionBusyId(renameTarget._id);
    try {
      const res = await fetchWithAuth(`/api/cv/${renameTarget._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: renameValue.trim() }),
      });
      const data = await res.json();
      if (!res.ok || !data.cv) {
        setErrorMsg(data.error || "Không thể đổi tên CV.");
        return;
      }
      setCvs((prev) =>
        prev.map((item) =>
          item._id === renameTarget._id
            ? { ...item, title: data.cv.title, updatedAt: data.cv.updatedAt }
            : item
        )
      );
      setRenameTarget(null);
    } catch {
      setErrorMsg("Lỗi kết nối khi đổi tên CV.");
    } finally {
      setActionBusyId(null);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setActionBusyId(deleteTarget._id);
    try {
      const res = await fetchWithAuth(`/api/cv/${deleteTarget._id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || "Không thể xóa CV.");
        return;
      }
      setDeleteTarget(null);
      await loadCvs();
    } catch {
      setErrorMsg("Lỗi kết nối khi xóa CV.");
    } finally {
      setActionBusyId(null);
    }
  };

  if (authLoading || (loading && cvs.length === 0 && totalCount === 0)) {
    return (
      <div className="w-full px-3 sm:px-4 lg:px-5 py-6 space-y-5">
        <div className="h-36 rounded-2xl bg-white border border-slate-200 animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-72 rounded-2xl bg-white border border-slate-200 animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full px-3 sm:px-4 lg:px-5 py-6 space-y-6">
      {/* Header Banner */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-xs flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 border border-blue-200/70 px-2.5 py-0.5 text-[11px] font-semibold text-blue-700">
            <FileText className="h-3.5 w-3.5" />
            <span>UNERA CV Builder · Chuẩn ATS</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
            Quản lý &amp; Tạo CV Chuẩn ATS
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 max-w-2xl">
            Tạo nhiều phiên bản CV theo từng vị trí ứng tuyển, tự động lấy kỹ năng &amp; thành tích từ hồ sơ cá nhân, kéo thả bố cục và xuất file PDF vector chuẩn ATS.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <span className="text-xs font-medium text-slate-500 mr-1">
            Đã dùng <strong className="text-slate-900">{totalCount}</strong>/{CV_MAX_PER_USER} CV
          </span>
          <Link
            href="/tools/cv-builder/templates"
            className={buttonVariants({
              variant: "outline",
              size: "sm",
              className: "gap-1.5",
            })}
          >
            <LayoutTemplate className="h-4 w-4" />
            <span>Thư viện Mẫu CV</span>
          </Link>
          <Button
            type="button"
            size="sm"
            onClick={() => {
              setCreateDefaultTpl(DEFAULT_CV_TEMPLATE_ID);
              setCreateModalOpen(true);
            }}
            disabled={totalCount >= CV_MAX_PER_USER}
            className="bg-blue-600 hover:bg-blue-700 text-white gap-1.5"
          >
            <Plus className="h-4 w-4" />
            <span>Tạo CV mới</span>
          </Button>
        </div>
      </div>

      {errorMsg && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-xs font-medium text-rose-700">
          {errorMsg}
        </div>
      )}

      {/* Search & Filter Toolbar */}
      {totalCount > 0 && (
        <div className="rounded-2xl border border-slate-200/80 bg-white p-3.5 shadow-xs flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm theo tên CV hoặc vị trí mục tiêu..."
              className="pl-9 h-9 text-xs"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <select
              value={templateFilter}
              onChange={(e) => setTemplateFilter(e.target.value)}
              className="h-9 rounded-xl border border-slate-200 bg-white px-3 text-xs text-slate-700 focus:border-blue-500 focus:outline-none"
            >
              <option value="ALL">Tất cả mẫu CV</option>
              {CV_TEMPLATES.map((tpl) => (
                <option key={tpl.id} value={tpl.id}>
                  {tpl.name}
                </option>
              ))}
            </select>

            <select
              value={sharingFilter}
              onChange={(e) => setSharingFilter(e.target.value)}
              className="h-9 rounded-xl border border-slate-200 bg-white px-3 text-xs text-slate-700 focus:border-blue-500 focus:outline-none"
            >
              <option value="ALL">Mọi trạng thái chia sẻ</option>
              <option value="PUBLIC">Đang công khai</option>
              <option value="PRIVATE">Riêng tư</option>
            </select>
          </div>
        </div>
      )}

      {/* Empty State or Grid */}
      {totalCount === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 sm:p-12 text-center space-y-5">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
            <FileText className="h-7 w-7" />
          </div>
          <div className="space-y-1.5 max-w-lg mx-auto">
            <h2 className="text-lg font-bold text-slate-900">
              Bạn chưa có bản CV nào trên UNERA
            </h2>
            <p className="text-xs sm:text-sm text-slate-500">
              Hãy bắt đầu bằng cách lấy sẵn thông tin học vấn, kỹ năng chuyên môn, kỹ năng mềm và thành tích từ Hồ sơ cá nhân, hoặc chọn một mẫu CV chuyên nghiệp.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Button
              type="button"
              onClick={() => {
                setCreateDefaultTpl(DEFAULT_CV_TEMPLATE_ID);
                setCreateModalOpen(true);
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white gap-2"
            >
              <Sparkles className="h-4 w-4" />
              <span>Tạo CV từ Hồ sơ cá nhân</span>
            </Button>
            <Link
              href="/tools/cv-builder/templates"
              className={buttonVariants({
                variant: "outline",
                className: "gap-2",
              })}
            >
              <LayoutTemplate className="h-4 w-4" />
              <span>Chọn từ Thư viện Mẫu CV</span>
            </Link>
            <Button
              type="button"
              variant="outline"
              disabled={actionBusyId === "quick-blank"}
              onClick={handleQuickBlankCreate}
              className="gap-2"
            >
              {actionBusyId === "quick-blank" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <FilePlus2 className="h-4 w-4" />
              )}
              <span>Tạo CV trống nhanh</span>
            </Button>
          </div>
        </div>
      ) : cvs.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center space-y-2">
          <p className="text-sm font-semibold text-slate-800">
            Không tìm thấy CV phù hợp với bộ lọc hiện tại
          </p>
          <button
            type="button"
            onClick={() => {
              setSearchQuery("");
              setTemplateFilter("ALL");
              setSharingFilter("ALL");
            }}
            className="text-xs font-semibold text-blue-600 hover:underline cursor-pointer"
          >
            Xóa bộ lọc tìm kiếm
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {cvs.map((cv) => {
            const tpl = getCvTemplate(cv.templateId);
            const isBusy = actionBusyId === cv._id;
            return (
              <div
                key={cv._id}
                className="group rounded-2xl border border-slate-200/90 bg-white shadow-xs hover:shadow-md transition-all flex flex-col overflow-hidden"
              >
                {/* Live Scaled Mini Thumbnail */}
                <Link
                  href={`/tools/cv-builder/${cv._id}`}
                  className="relative h-56 bg-slate-100/80 overflow-hidden border-b border-slate-100 block"
                >
                  <div className="pointer-events-none origin-top-left scale-[0.34] translate-x-3 translate-y-3 shadow-sm">
                    <CvA4Renderer
                      cv={{
                        personalInfo: cv.personalInfo,
                        summary: cv.summary,
                        education: cv.education,
                        experience: cv.experience,
                        skills: cv.skills,
                        projects: cv.projects,
                        achievements: cv.achievements,
                        activities: cv.activities,
                        certifications: cv.certifications,
                        customSections: cv.customSections,
                      }}
                      templateId={cv.templateId}
                      styleConfig={cv.styleConfig}
                      sectionOrder={cv.sectionOrder}
                      hiddenSections={cv.hiddenSections}
                      locale={cv.locale}
                    />
                  </div>

                  {/* Overlay Badges */}
                  <div className="absolute top-2.5 left-2.5 flex flex-wrap gap-1.5">
                    <Badge className="bg-white/95 text-slate-700 border border-slate-200 shadow-2xs text-[10px]">
                      {tpl.name}
                    </Badge>
                    <Badge className="bg-slate-900/85 text-white text-[10px] uppercase">
                      {cv.locale}
                    </Badge>
                  </div>

                  <div className="absolute inset-0 bg-blue-900/0 group-hover:bg-blue-900/10 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <span className="rounded-full bg-white px-3.5 py-1.5 text-xs font-bold text-blue-700 shadow-md flex items-center gap-1.5">
                      <Edit3 className="h-3.5 w-3.5" />
                      Mở trình soạn thảo
                    </span>
                  </div>
                </Link>

                {/* Card Body */}
                <div className="p-4 flex-1 flex flex-col justify-between gap-3">
                  <div className="space-y-1.5">
                    <div className="flex items-start justify-between gap-2">
                      <Link
                        href={`/tools/cv-builder/${cv._id}`}
                        className="text-sm font-bold text-slate-900 hover:text-blue-600 line-clamp-2 leading-snug"
                      >
                        {cv.title}
                      </Link>
                      <button
                        type="button"
                        onClick={() => {
                          setRenameTarget(cv);
                          setRenameValue(cv.title);
                        }}
                        title="Đổi tên CV"
                        className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 shrink-0 cursor-pointer"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    {cv.targetRole && (
                      <p className="text-xs text-slate-500 truncate">
                        Mục tiêu: {cv.targetRole}
                      </p>
                    )}

                    <div className="flex items-center justify-between gap-2 pt-1">
                      {cv.sharing.isPublic ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                          <Globe className="h-3 w-3" />
                          Công khai · {cv.sharing.viewCount} lượt xem
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                          <Lock className="h-3 w-3" />
                          Riêng tư
                        </span>
                      )}

                      <span className="text-[11px] text-slate-400">
                        {formatRelativeTimeVi(cv.updatedAt)}
                      </span>
                    </div>
                  </div>

                  {/* Card Actions */}
                  <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between gap-1.5">
                    <div className="flex items-center gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        disabled={isBusy}
                        onClick={() => handleDuplicate(cv)}
                        title="Nhân bản CV"
                        className="h-8 px-2 text-xs text-slate-600 hover:text-blue-700"
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </Button>

                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setShareTarget(cv)}
                        title="Chia sẻ công khai"
                        className="h-8 px-2 text-xs text-slate-600 hover:text-emerald-700"
                      >
                        <Share2 className="h-3.5 w-3.5" />
                      </Button>

                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        disabled={isBusy}
                        onClick={() => setDeleteTarget(cv)}
                        title="Xóa CV"
                        className="h-8 px-2 text-xs text-slate-500 hover:text-rose-600"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>

                    <CvPdfDownloadButton
                      cv={{
                        personalInfo: cv.personalInfo,
                        summary: cv.summary,
                        education: cv.education,
                        experience: cv.experience,
                        skills: cv.skills,
                        projects: cv.projects,
                        achievements: cv.achievements,
                        activities: cv.activities,
                        certifications: cv.certifications,
                        customSections: cv.customSections,
                      }}
                      templateId={cv.templateId}
                      styleConfig={cv.styleConfig}
                      sectionOrder={cv.sectionOrder}
                      hiddenSections={cv.hiddenSections}
                      locale={cv.locale}
                      targetRole={cv.targetRole}
                      title={cv.title}
                      variant="outline"
                      size="sm"
                      label="PDF"
                      className="h-8 px-2.5 text-xs gap-1"
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Modal */}
      <CreateCvModal
        open={createModalOpen}
        defaultTemplateId={createDefaultTpl}
        profileSeed={profileSeed}
        onClose={() => setCreateModalOpen(false)}
        onCreated={(cv: ICvDocumentDTO) => {
          setCreateModalOpen(false);
          router.push(`/tools/cv-builder/${cv._id}`);
        }}
      />

      {/* Share Modal */}
      {shareTarget && (
        <ShareCvModal
          open={Boolean(shareTarget)}
          cvId={shareTarget._id}
          cvTitle={shareTarget.title}
          sharing={shareTarget.sharing}
          onClose={() => setShareTarget(null)}
          onUpdated={(updatedCv) => {
            setCvs((prev) =>
              prev.map((item) =>
                item._id === updatedCv._id
                  ? { ...item, sharing: updatedCv.sharing }
                  : item
              )
            );
            setShareTarget((prev) =>
              prev && prev._id === updatedCv._id
                ? { ...prev, sharing: updatedCv.sharing }
                : prev
            );
          }}
        />
      )}

      {/* Rename Modal */}
      {renameTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <form
            onSubmit={handleConfirmRename}
            className="w-full max-w-md rounded-2xl bg-white border border-slate-200 p-5 shadow-2xl space-y-4"
          >
            <h3 className="text-base font-bold text-slate-900">Đổi tên CV</h3>
            <Input
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              maxLength={120}
              minLength={2}
              required
              autoFocus
            />
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setRenameTarget(null)}
              >
                Hủy
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={actionBusyId === renameTarget._id}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                Lưu tên mới
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl bg-white border border-slate-200 p-5 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-slate-900">
              Xác nhận xóa CV?
            </h3>
            <p className="text-xs sm:text-sm text-slate-600">
              Bạn sắp xóa vĩnh viễn CV{" "}
              <strong className="text-slate-900">{deleteTarget.title}</strong>.
              Hành động này không thể hoàn tác.
            </p>
            {deleteTarget.sharing.isPublic && (
              <div className="rounded-xl bg-amber-50 border border-amber-200 px-3 py-2 text-xs text-amber-800">
                CV này đang bật chia sẻ công khai. Đường dẫn{" "}
                <code>/cv/{deleteTarget.sharing.shareSlug}</code> sẽ ngừng hoạt động ngay lập tức.
              </div>
            )}
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setDeleteTarget(null)}
              >
                Giữ lại
              </Button>
              <Button
                type="button"
                size="sm"
                disabled={actionBusyId === deleteTarget._id}
                onClick={handleConfirmDelete}
                className="bg-rose-600 hover:bg-rose-700 text-white"
              >
                {actionBusyId === deleteTarget._id ? "Đang xóa..." : "Xóa vĩnh viễn"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

