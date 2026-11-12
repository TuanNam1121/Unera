"use client";

import {
  AlignCenter,
  AlignLeft,
  Check,
  LayoutTemplate,
  Maximize2,
  X,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  CV_ACCENT_PALETTE,
  CV_FONT_OPTIONS,
  CV_FONT_SCALE_OPTIONS,
  CV_PADDING_OPTIONS,
  CV_STYLE_LABELS,
} from "@/constants/cv";
import { CV_TEMPLATES, getCvTemplate } from "@/lib/cv-templates";
import { useCvEditorStore } from "@/stores/useCvEditorStore";
import type {
  CvFontFamily,
  CvFontSizeScale,
  CvLocale,
  CvPagePadding,
} from "@/types/cv";

export function CvStyleControlsBar() {
  const templateId = useCvEditorStore((s) => s.templateId);
  const styleConfig = useCvEditorStore((s) => s.styleConfig);
  const locale = useCvEditorStore((s) => s.locale);
  const zoomLevel = useCvEditorStore((s) => s.zoomLevel);
  const fitMode = useCvEditorStore((s) => s.fitMode);
  const templateDrawerOpen = useCvEditorStore((s) => s.templateDrawerOpen);

  const setStyleConfig = useCvEditorStore((s) => s.setStyleConfig);
  const setLocale = useCvEditorStore((s) => s.setLocale);
  const setTemplateId = useCvEditorStore((s) => s.setTemplateId);
  const setZoomLevel = useCvEditorStore((s) => s.setZoomLevel);
  const setFitMode = useCvEditorStore((s) => s.setFitMode);
  const setTemplateDrawerOpen = useCvEditorStore(
    (s) => s.setTemplateDrawerOpen
  );

  const activeTemplate = getCvTemplate(templateId);

  return (
    <>
      <div className="border-b border-slate-200 bg-white px-3.5 py-2.5 space-y-2.5 shrink-0">
        {/* Row 1: Template, Colors, Zoom */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setTemplateDrawerOpen(true)}
              className="h-8 text-xs gap-1.5"
            >
              <LayoutTemplate className="h-3.5 w-3.5 text-blue-600" />
              <span>{activeTemplate.name}</span>
            </Button>

            {/* Accent Color Swatches */}
            <div className="flex items-center gap-1 rounded-xl border border-slate-200 px-2 py-1 bg-slate-50/80">
              {CV_ACCENT_PALETTE.map((c) => {
                const selected =
                  styleConfig.accentColor.toLowerCase() === c.hex.toLowerCase();
                return (
                  <button
                    key={c.hex}
                    type="button"
                    title={c.name}
                    onClick={() => setStyleConfig({ accentColor: c.hex })}
                    className={`h-4 w-4 rounded-full border transition-transform cursor-pointer ${
                      selected
                        ? "scale-125 border-slate-900 ring-1 ring-slate-900/30"
                        : "border-white/80 hover:scale-110"
                    }`}
                    style={{ backgroundColor: c.hex }}
                  />
                );
              })}
              <input
                type="color"
                value={styleConfig.accentColor}
                onChange={(e) => setStyleConfig({ accentColor: e.target.value })}
                title="Chọn mã màu tùy chỉnh"
                className="h-4 w-5 cursor-pointer bg-transparent border-0 p-0 ml-0.5"
              />
            </div>
          </div>

          {/* Zoom Controls */}
          <div className="flex items-center gap-1 rounded-xl border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-xs">
            <button
              type="button"
              onClick={() => setZoomLevel(zoomLevel - 0.1)}
              className="p-1 rounded-lg hover:bg-white text-slate-600 cursor-pointer"
              title="Thu nhỏ"
            >
              <ZoomOut className="h-3.5 w-3.5" />
            </button>
            <span className="w-11 text-center font-semibold text-slate-700 text-[11px]">
              {fitMode ? "Vừa" : `${Math.round(zoomLevel * 100)}%`}
            </span>
            <button
              type="button"
              onClick={() => setZoomLevel(zoomLevel + 0.1)}
              className="p-1 rounded-lg hover:bg-white text-slate-600 cursor-pointer"
              title="Phóng to"
            >
              <ZoomIn className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setFitMode(true)}
              className={`px-2 py-0.5 rounded-lg text-[11px] font-medium cursor-pointer flex items-center gap-1 ${
                fitMode
                  ? "bg-blue-600 text-white"
                  : "text-slate-600 hover:bg-white"
              }`}
              title="Vừa khung màn hình"
            >
              <Maximize2 className="h-3 w-3" />
              <span>Fit</span>
            </button>
          </div>
        </div>

        {/* Row 2: Typography, Spacing, Language, Align, Avatar */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <select
            value={styleConfig.fontFamily}
            onChange={(e) =>
              setStyleConfig({ fontFamily: e.target.value as CvFontFamily })
            }
            className="h-7 rounded-lg border border-slate-200 bg-white px-2 text-[11px] text-slate-700"
            title="Font chữ"
          >
            {CV_FONT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>

          <select
            value={styleConfig.fontSizeScale}
            onChange={(e) =>
              setStyleConfig({
                fontSizeScale: e.target.value as CvFontSizeScale,
              })
            }
            className="h-7 rounded-lg border border-slate-200 bg-white px-2 text-[11px] text-slate-700"
            title="Cỡ chữ"
          >
            {CV_FONT_SCALE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>

          <select
            value={styleConfig.pagePadding}
            onChange={(e) =>
              setStyleConfig({ pagePadding: e.target.value as CvPagePadding })
            }
            className="h-7 rounded-lg border border-slate-200 bg-white px-2 text-[11px] text-slate-700"
            title="Lề trang"
          >
            {CV_PADDING_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                Lề: {opt.label}
              </option>
            ))}
          </select>

          <select
            value={String(styleConfig.lineHeight)}
            onChange={(e) =>
              setStyleConfig({ lineHeight: Number(e.target.value) })
            }
            className="h-7 rounded-lg border border-slate-200 bg-white px-2 text-[11px] text-slate-700"
            title="Giãn dòng"
          >
            <option value="1.35">Giãn dòng 1.35</option>
            <option value="1.45">Giãn dòng 1.45</option>
            <option value="1.6">Giãn dòng 1.60</option>
          </select>

          <div className="inline-flex rounded-lg border border-slate-200 overflow-hidden bg-slate-50">
            {(["vi", "en"] as CvLocale[]).map((loc) => (
              <button
                key={loc}
                type="button"
                onClick={() => setLocale(loc)}
                className={`px-2 py-1 text-[11px] font-semibold uppercase cursor-pointer ${
                  locale === loc
                    ? "bg-blue-600 text-white"
                    : "text-slate-600 hover:bg-white"
                }`}
              >
                {loc}
              </button>
            ))}
          </div>

          <div className="inline-flex rounded-lg border border-slate-200 overflow-hidden bg-slate-50">
            <button
              type="button"
              onClick={() => setStyleConfig({ headerAlign: "left" })}
              className={`p-1 cursor-pointer ${
                styleConfig.headerAlign === "left"
                  ? "bg-blue-600 text-white"
                  : "text-slate-600 hover:bg-white"
              }`}
              title="Căn trái Header"
            >
              <AlignLeft className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setStyleConfig({ headerAlign: "center" })}
              className={`p-1 cursor-pointer ${
                styleConfig.headerAlign === "center"
                  ? "bg-blue-600 text-white"
                  : "text-slate-600 hover:bg-white"
              }`}
              title="Căn giữa Header"
            >
              <AlignCenter className="h-3.5 w-3.5" />
            </button>
          </div>

          {activeTemplate.supportsAvatar && (
            <label className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2 py-1 text-[11px] font-medium text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={styleConfig.showAvatar}
                onChange={(e) => setStyleConfig({ showAvatar: e.target.checked })}
                className="h-3.5 w-3.5 accent-blue-600"
              />
              <span>Hiện ảnh</span>
            </label>
          )}
        </div>
      </div>

      {/* Template Switcher Drawer/Modal */}
      {templateDrawerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-3xl max-h-[85vh] flex flex-col rounded-2xl bg-white border border-slate-200 shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Đổi mẫu CV (Giữ nguyên 100% nội dung)
                </h3>
                <p className="text-xs text-slate-500">
                  Chọn mẫu mới để xem trước ngay lập tức mà không mất dữ liệu đã nhập.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setTemplateDrawerOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-4 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 gap-3">
              {CV_TEMPLATES.map((tpl) => {
                const isSelected = tpl.id === templateId;
                return (
                  <button
                    key={tpl.id}
                    type="button"
                    onClick={() => {
                      setTemplateId(tpl.id, true);
                      setTemplateDrawerOpen(false);
                    }}
                    className={`rounded-xl border p-3.5 text-left transition-all cursor-pointer flex flex-col justify-between gap-2 ${
                      isSelected
                        ? "border-blue-600 bg-blue-50/50 ring-2 ring-blue-100"
                        : "border-slate-200 hover:border-blue-300 bg-white"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-bold text-slate-900">
                          {tpl.name}
                        </p>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          {tpl.description}
                        </p>
                      </div>
                      {isSelected && (
                        <span className="rounded-full bg-blue-600 text-white p-1 shrink-0">
                          <Check className="h-3 w-3" />
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      <span className="rounded bg-emerald-50 text-emerald-700 px-2 py-0.5 text-[10px] font-semibold">
                        ATS {tpl.atsScore}%
                      </span>
                      <span className="rounded bg-slate-100 text-slate-600 px-2 py-0.5 text-[10px] font-medium">
                        {CV_STYLE_LABELS[tpl.style]}
                      </span>
                      <span className="rounded bg-slate-100 text-slate-600 px-2 py-0.5 text-[10px] font-medium">
                        {tpl.layoutType === "single-column" ? "1 cột" : "2 cột"}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

