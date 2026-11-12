"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  Check,
  Eye,
  LayoutTemplate,
  Search,
  Sparkles,
  UserCircle2,
  X,
} from "lucide-react";
import { CreateCvModal } from "@/components/cv/CreateCvModal";
import { CvA4PreviewCanvas } from "@/components/cv/preview/CvA4PreviewCanvas";
import { CvA4Renderer } from "@/components/cv/preview/CvA4Renderer";
import { fetchWithAuth, useAuth } from "@/components/providers/AuthProvider";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  CV_EXPERIENCE_LEVEL_LABELS,
  CV_INDUSTRY_LABELS,
  CV_STYLE_LABELS,
} from "@/constants/cv";
import { CV_TEMPLATES, MOCK_PREVIEW_CV } from "@/lib/cv-templates";
import type {
  CvExperienceLevel,
  CvIndustry,
  CvTemplateStyle,
  ICvDocumentDTO,
  ICvProfilePrefillSeed,
  ICvTemplateDefinition,
} from "@/types/cv";

export function CvTemplatesClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const targetCvId = searchParams.get("cvId") || "";
  const { user } = useAuth();

  const [query, setQuery] = useState("");
  const [industry, setIndustry] = useState<CvIndustry | "ALL">("ALL");
  const [style, setStyle] = useState<CvTemplateStyle | "ALL">("ALL");
  const [level, setLevel] = useState<CvExperienceLevel | "ALL">("ALL");

  const [previewTpl, setPreviewTpl] = useState<ICvTemplateDefinition | null>(
    null
  );
  const [createWithTpl, setCreateWithTpl] = useState<string | null>(null);
  const [profileSeed, setProfileSeed] = useState<ICvProfilePrefillSeed | null>(
    null
  );
  const [applyingId, setApplyingId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    fetchWithAuth("/api/cv?includeProfileSeed=1", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.profileSeed) setProfileSeed(data.profileSeed);
      })
      .catch(() => {});
  }, [user]);

  const filteredTemplates = useMemo(() => {
    const q = query.trim().toLowerCase();
    return CV_TEMPLATES.filter((tpl) => {
      if (industry !== "ALL" && !tpl.industry.includes(industry)) return false;
      if (style !== "ALL" && tpl.style !== style) return false;
      if (level !== "ALL" && !tpl.experienceLevel.includes(level)) return false;
      if (q && !`${tpl.name} ${tpl.description}`.toLowerCase().includes(q)) {
        return false;
      }
      return true;
    });
  }, [query, industry, style, level]);

  const handleUseTemplate = async (tpl: ICvTemplateDefinition) => {
    if (targetCvId) {
      setApplyingId(tpl.id);
      try {
        const res = await fetchWithAuth(`/api/cv/${targetCvId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            templateId: tpl.id,
            sectionOrder: tpl.defaultSectionOrder,
          }),
        });
        if (res.ok) {
          router.push(`/tools/cv-builder/${targetCvId}`);
          return;
        }
      } finally {
        setApplyingId(null);
      }
    }
    setCreateWithTpl(tpl.id);
  };

  return (
    <div className="w-full px-3 sm:px-4 lg:px-5 py-6 space-y-6">
      {/* Header */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Link
              href={
                targetCvId
                  ? `/tools/cv-builder/${targetCvId}`
                  : "/tools/cv-builder"
              }
              className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:underline"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>{targetCvId ? "Quay lại CV Editor" : "Danh sách CV của tôi"}</span>
            </Link>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2">
            <LayoutTemplate className="h-5 w-5 text-blue-600" />
            <span>Thư viện Mẫu CV Chuẩn ATS</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Lọc mẫu theo Ngành nghề, Phong cách và Cấp độ kinh nghiệm. Đổi mẫu bất kỳ lúc nào mà vẫn giữ nguyên toàn bộ dữ liệu CV.
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Tìm tên mẫu CV hoặc mô tả..."
              className="pl-9 h-9 text-xs"
            />
          </div>

          <select
            value={style}
            onChange={(e) => setStyle(e.target.value as CvTemplateStyle | "ALL")}
            className="h-9 rounded-xl border border-slate-200 bg-white px-3 text-xs text-slate-700"
          >
            {Object.entries(CV_STYLE_LABELS).map(([k, label]) => (
              <option key={k} value={k}>
                {label}
              </option>
            ))}
          </select>

          <select
            value={level}
            onChange={(e) =>
              setLevel(e.target.value as CvExperienceLevel | "ALL")
            }
            className="h-9 rounded-xl border border-slate-200 bg-white px-3 text-xs text-slate-700"
          >
            {Object.entries(CV_EXPERIENCE_LEVEL_LABELS).map(([k, label]) => (
              <option key={k} value={k}>
                {label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {Object.entries(CV_INDUSTRY_LABELS).map(([key, label]) => {
            const active = industry === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setIndustry(key as CvIndustry | "ALL")}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-colors cursor-pointer ${
                  active
                    ? "bg-blue-600 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Templates Grid */}
      {filteredTemplates.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center space-y-2">
          <p className="text-sm font-semibold text-slate-800">
            Không có mẫu CV nào khớp với bộ lọc
          </p>
          <button
            type="button"
            onClick={() => {
              setQuery("");
              setIndustry("ALL");
              setStyle("ALL");
              setLevel("ALL");
            }}
            className="text-xs font-semibold text-blue-600 hover:underline cursor-pointer"
          >
            Hiển thị lại tất cả mẫu
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredTemplates.map((tpl) => (
            <div
              key={tpl.id}
              className="rounded-2xl border border-slate-200/90 bg-white shadow-xs hover:shadow-md transition-all flex flex-col overflow-hidden"
            >
              <div className="relative h-64 bg-slate-100 overflow-hidden border-b border-slate-100">
                <div className="pointer-events-none origin-top-left scale-[0.34] translate-x-3 translate-y-3 shadow-sm">
                  <CvA4Renderer
                    cv={MOCK_PREVIEW_CV}
                    templateId={tpl.id}
                    styleConfig={{
                      ...tpl.defaultStyleConfig,
                      showAvatar: false,
                    }}
                    sectionOrder={tpl.defaultSectionOrder}
                    hiddenSections={[]}
                    locale="vi"
                  />
                </div>
                <div className="absolute top-2.5 right-2.5 flex flex-col items-end gap-1">
                  <Badge className="bg-emerald-600 text-white text-[10px] shadow-2xs">
                    ATS {tpl.atsScore}%
                  </Badge>
                  {tpl.supportsAvatar && (
                    <Badge className="bg-white/95 text-slate-700 border border-slate-200 text-[10px] gap-1">
                      <UserCircle2 className="h-3 w-3" />
                      Hỗ trợ ảnh
                    </Badge>
                  )}
                </div>
              </div>

              <div className="p-4 flex-1 flex flex-col justify-between gap-3">
                <div className="space-y-1.5">
                  <h3 className="text-sm font-bold text-slate-900">{tpl.name}</h3>
                  <p className="text-xs text-slate-500 line-clamp-2">
                    {tpl.description}
                  </p>
                  <div className="flex flex-wrap gap-1 pt-1">
                    <span className="rounded bg-blue-50 text-blue-700 px-2 py-0.5 text-[10px] font-medium">
                      {CV_STYLE_LABELS[tpl.style]}
                    </span>
                    <span className="rounded bg-slate-100 text-slate-600 px-2 py-0.5 text-[10px] font-medium">
                      {tpl.layoutType === "single-column" ? "1 cột" : "2 cột"}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setPreviewTpl(tpl)}
                    className="flex-1 gap-1.5 text-xs"
                  >
                    <Eye className="h-3.5 w-3.5" />
                    <span>Xem lớn</span>
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    disabled={applyingId === tpl.id}
                    onClick={() => handleUseTemplate(tpl)}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white gap-1.5 text-xs"
                  >
                    {targetCvId ? (
                      <Check className="h-3.5 w-3.5" />
                    ) : (
                      <Sparkles className="h-3.5 w-3.5" />
                    )}
                    <span>{targetCvId ? "Áp dụng mẫu" : "Dùng mẫu này"}</span>
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Large Preview Modal */}
      {previewTpl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-4xl h-[90vh] flex flex-col rounded-2xl bg-slate-100 border border-slate-200 shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3.5 bg-white border-b border-slate-200">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  {previewTpl.name} · ATS {previewTpl.atsScore}%
                </h3>
                <p className="text-xs text-slate-500">{previewTpl.description}</p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  size="sm"
                  onClick={() => {
                    const chosen = previewTpl;
                    setPreviewTpl(null);
                    handleUseTemplate(chosen);
                  }}
                  className="bg-blue-600 hover:bg-blue-700 text-white text-xs"
                >
                  Dùng mẫu này
                </Button>
                <button
                  type="button"
                  onClick={() => setPreviewTpl(null)}
                  className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-auto">
              <CvA4PreviewCanvas
                cv={MOCK_PREVIEW_CV}
                templateId={previewTpl.id}
                styleConfig={{
                  ...previewTpl.defaultStyleConfig,
                  showAvatar: false,
                }}
                sectionOrder={previewTpl.defaultSectionOrder}
                hiddenSections={[]}
                locale="vi"
                zoomLevel={0.85}
                fitMode={true}
                showPageBreaks={false}
              />
            </div>
          </div>
        </div>
      )}

      {/* Create Modal from Template */}
      <CreateCvModal
        open={Boolean(createWithTpl)}
        defaultTemplateId={createWithTpl || undefined}
        profileSeed={profileSeed}
        onClose={() => setCreateWithTpl(null)}
        onCreated={(cv: ICvDocumentDTO) => {
          setCreateWithTpl(null);
          router.push(`/tools/cv-builder/${cv._id}`);
        }}
      />

      {!user && (
        <div className="text-center text-xs text-slate-500">
          <Link href="/login?callbackUrl=/tools/cv-builder/templates" className={buttonVariants({ variant: "link", size: "sm" })}>
            Đăng nhập để lưu và đồng bộ CV từ Hồ sơ cá nhân
          </Link>
        </div>
      )}
    </div>
  );
}

