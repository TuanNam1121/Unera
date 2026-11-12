"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  DndContext,
  DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  AlertCircle,
  ArrowLeft,
  Award,
  BadgeCheck,
  Briefcase,
  CheckCircle2,
  Eye,
  FileText,
  FolderGit2,
  GraduationCap,
  Layers,
  Loader2,
  Palette,
  PenLine,
  RefreshCw,
  Save,
  Share2,
  Users,
  Wrench,
} from "lucide-react";
import { useForm, type FieldErrors } from "react-hook-form";
import {
  EducationSectionEditor,
  ExperienceSectionEditor,
  PersonalInfoEditor,
  ProjectsSectionEditor,
  SummaryEditor,
} from "@/components/cv/editor/CvCoreSectionForms";
import {
  AchievementsSectionEditor,
  ActivitiesSectionEditor,
  CertificationsSectionEditor,
  CustomSectionsEditor,
  SkillsSectionEditor,
} from "@/components/cv/editor/CvExtendedSectionForms";
import { CvStyleControlsBar } from "@/components/cv/editor/CvStyleControlsBar";
import { SortableSectionCard } from "@/components/cv/editor/SortableWrappers";
import { CvPdfDownloadButton } from "@/components/cv/pdf/CvPdfDownloadButton";
import { CvA4PreviewCanvas } from "@/components/cv/preview/CvA4PreviewCanvas";
import { ShareCvModal } from "@/components/cv/ShareCvModal";
import { fetchWithAuth, useAuth } from "@/components/providers/AuthProvider";
import { Button } from "@/components/ui/button";
import { CV_SECTION_LABELS } from "@/constants/cv";
import { buildEmptyCvContent } from "@/lib/cv-format";
import { useCvEditorStore } from "@/stores/useCvEditorStore";
import type {
  CvSectionKey,
  ICvDocumentDTO,
  ICvProfilePrefillSeed,
} from "@/types/cv";
import {
  cvContentFormSchema,
  type CvContentFormValues,
} from "@/validations/cv";

const SECTION_ICON_MAP: Record<CvSectionKey, React.ReactNode> = {
  summary: <FileText className="h-4 w-4" />,
  education: <GraduationCap className="h-4 w-4" />,
  experience: <Briefcase className="h-4 w-4" />,
  skills: <Wrench className="h-4 w-4" />,
  projects: <FolderGit2 className="h-4 w-4" />,
  achievements: <Award className="h-4 w-4" />,
  activities: <Users className="h-4 w-4" />,
  certifications: <BadgeCheck className="h-4 w-4" />,
  custom: <Layers className="h-4 w-4" />,
};

function countFieldErrors(errObj: unknown): number {
  if (!errObj) return 0;
  if (typeof errObj !== "object") return 0;
  if ("message" in errObj && typeof (errObj as { message?: unknown }).message === "string") {
    return 1;
  }
  let count = 0;
  for (const val of Object.values(errObj as Record<string, unknown>)) {
    count += countFieldErrors(val);
  }
  return count;
}

export function CvEditorClient() {
  const params = useParams<{ id: string }>();
  const cvId = params?.id || "";
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [profileSeed, setProfileSeed] = useState<ICvProfilePrefillSeed | null>(
    null
  );
  const [editingTitle, setEditingTitle] = useState(false);

  const hydratedRef = useRef(false);
  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const title = useCvEditorStore((s) => s.title);
  const targetRole = useCvEditorStore((s) => s.targetRole);
  const templateId = useCvEditorStore((s) => s.templateId);
  const locale = useCvEditorStore((s) => s.locale);
  const styleConfig = useCvEditorStore((s) => s.styleConfig);
  const sectionOrder = useCvEditorStore((s) => s.sectionOrder);
  const hiddenSections = useCvEditorStore((s) => s.hiddenSections);
  const cvData = useCvEditorStore((s) => s.cvData);
  const sharing = useCvEditorStore((s) => s.sharing);
  const version = useCvEditorStore((s) => s.version);
  const isDirty = useCvEditorStore((s) => s.isDirty);
  const saveStatus = useCvEditorStore((s) => s.saveStatus);
  const saveError = useCvEditorStore((s) => s.saveError);
  const lastSavedTimeLabel = useCvEditorStore((s) => s.lastSavedTimeLabel);
  const zoomLevel = useCvEditorStore((s) => s.zoomLevel);
  const fitMode = useCvEditorStore((s) => s.fitMode);
  const activeMobileTab = useCvEditorStore((s) => s.activeMobileTab);
  const shareModalOpen = useCvEditorStore((s) => s.shareModalOpen);

  const hydrate = useCvEditorStore((s) => s.hydrate);
  const resetStore = useCvEditorStore((s) => s.reset);
  const syncFormValues = useCvEditorStore((s) => s.syncFormValues);
  const setTitle = useCvEditorStore((s) => s.setTitle);
  const setSectionOrder = useCvEditorStore((s) => s.setSectionOrder);
  const toggleHiddenSection = useCvEditorStore((s) => s.toggleHiddenSection);
  const setSharing = useCvEditorStore((s) => s.setSharing);
  const markSaving = useCvEditorStore((s) => s.markSaving);
  const markSaved = useCvEditorStore((s) => s.markSaved);
  const markSaveError = useCvEditorStore((s) => s.markSaveError);
  const setActiveMobileTab = useCvEditorStore((s) => s.setActiveMobileTab);
  const setShareModalOpen = useCvEditorStore((s) => s.setShareModalOpen);

  const form = useForm<CvContentFormValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(cvContentFormSchema) as any,
    mode: "onChange",
    defaultValues: buildEmptyCvContent(),
  });

  const {
    control,
    register,
    watch,
    setValue,
    reset: resetForm,
    handleSubmit,
    formState: { errors },
  } = form;

  const sectionSensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const loadCvDetail = useCallback(async () => {
    if (!cvId) return;
    setLoading(true);
    setLoadError(null);
    hydratedRef.current = false;
    try {
      const [cvRes, seedRes] = await Promise.all([
        fetchWithAuth(`/api/cv/${cvId}`, { cache: "no-store" }),
        fetchWithAuth("/api/cv?includeProfileSeed=1", { cache: "no-store" }),
      ]);
      const cvJson = await cvRes.json();
      if (!cvRes.ok || !cvJson.cv) {
        setLoadError(cvJson.error || "Không tìm thấy CV hoặc bạn không có quyền truy cập.");
        return;
      }

      const loadedDoc = cvJson.cv as ICvDocumentDTO;
      hydrate(loadedDoc);
      resetForm({
        personalInfo: loadedDoc.personalInfo,
        summary: loadedDoc.summary || "",
        education: loadedDoc.education || [],
        experience: loadedDoc.experience || [],
        skills: loadedDoc.skills || [],
        projects: loadedDoc.projects || [],
        achievements: loadedDoc.achievements || [],
        activities: loadedDoc.activities || [],
        certifications: loadedDoc.certifications || [],
        customSections: loadedDoc.customSections || [],
      });
      hydratedRef.current = true;

      if (seedRes.ok) {
        const seedJson = await seedRes.json();
        if (seedJson?.profileSeed) {
          setProfileSeed(seedJson.profileSeed);
        }
      }
    } catch {
      setLoadError("Lỗi kết nối máy chủ khi tải CV.");
    } finally {
      setLoading(false);
    }
  }, [cvId, hydrate, resetForm]);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace(`/login?callbackUrl=/tools/cv-builder/${cvId}`);
      return;
    }
    loadCvDetail();
    return () => {
      resetStore();
    };
  }, [authLoading, user, router, cvId, loadCvDetail, resetStore]);

  // Real-time form -> Zustand store sync for <16ms Live Preview updates
  useEffect(() => {
    const subscription = watch((values) => {
      if (!hydratedRef.current) return;
      syncFormValues(values as CvContentFormValues);
    });
    return () => subscription.unsubscribe();
  }, [watch, syncFormValues]);

  const performSave = useCallback(async () => {
    const state = useCvEditorStore.getState();
    if (!state.cvId || state.saveStatus === "saving") return;

    const parsed = cvContentFormSchema.safeParse(state.cvData);
    if (!parsed.success) {
      markSaveError("Một số mục đang có lỗi nhập liệu. Vui lòng kiểm tra các thẻ báo lỗi.");
      return;
    }

    if (state.title.trim().length < 2) {
      markSaveError("Tên CV phải có ít nhất 2 ký tự.");
      return;
    }

    markSaving();
    try {
      const res = await fetchWithAuth(`/api/cv/${state.cvId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: state.title.trim(),
          targetRole: state.targetRole,
          templateId: state.templateId,
          locale: state.locale,
          styleConfig: state.styleConfig,
          sectionOrder: state.sectionOrder,
          hiddenSections: state.hiddenSections,
          expectedVersion: state.version,
          ...parsed.data,
        }),
      });
      const data = await res.json();
      if (res.status === 409) {
        markSaveError(
          data.error || "Phát hiện xung đột phiên bản do CV đang mở ở tab khác.",
          true
        );
        return;
      }
      if (!res.ok || !data.cv) {
        markSaveError(data.error || "Không thể lưu CV.");
        return;
      }
      markSaved(data.cv as ICvDocumentDTO);
    } catch {
      markSaveError("Mất kết nối máy chủ khi lưu CV.");
    }
  }, [markSaving, markSaved, markSaveError]);

  // 1.5s Debounced Auto-save
  useEffect(() => {
    if (!hydratedRef.current || !isDirty || saveStatus === "conflict") return;
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }
    autoSaveTimerRef.current = setTimeout(() => {
      performSave();
    }, 1500);

    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, [
    isDirty,
    cvData,
    title,
    targetRole,
    templateId,
    locale,
    styleConfig,
    sectionOrder,
    hiddenSections,
    saveStatus,
    performSave,
  ]);

  // Ctrl+S / Cmd+S Manual Save Shortcut
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        handleSubmit(() => performSave())();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [handleSubmit, performSave]);

  const handleSectionDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIdx = sectionOrder.indexOf(active.id as CvSectionKey);
    const newIdx = sectionOrder.indexOf(active.id as CvSectionKey);
    if (oldIdx !== -1 && newIdx !== -1) {
      setSectionOrder(arrayMove(sectionOrder, oldIdx, newIdx));
    }
  };

  const sectionErrorCounts = useMemo(() => {
    const typedErrors = errors as FieldErrors<CvContentFormValues>;
    return {
      summary: countFieldErrors(typedErrors.summary),
      education: countFieldErrors(typedErrors.education),
      experience: countFieldErrors(typedErrors.experience),
      skills: countFieldErrors(typedErrors.skills),
      projects: countFieldErrors(typedErrors.projects),
      achievements: countFieldErrors(typedErrors.achievements),
      activities: countFieldErrors(typedErrors.activities),
      certifications: countFieldErrors(typedErrors.certifications),
      custom: countFieldErrors(typedErrors.customSections),
    } satisfies Record<CvSectionKey, number>;
  }, [errors]);

  if (authLoading || loading) {
    return (
      <div className="w-full px-4 py-6 space-y-4">
        <div className="h-14 rounded-2xl bg-white border border-slate-200 animate-pulse" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-[75vh]">
          <div className="rounded-2xl bg-white border border-slate-200 animate-pulse" />
          <div className="rounded-2xl bg-white border border-slate-200 animate-pulse" />
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="w-full max-w-xl mx-auto px-4 py-16 text-center space-y-4">
        <AlertCircle className="h-10 w-10 text-rose-500 mx-auto" />
        <h2 className="text-lg font-bold text-slate-900">{loadError}</h2>
        <Link
          href="/tools/cv-builder"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-blue-600 hover:underline"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Quay lại Danh sách CV</span>
        </Link>
      </div>
    );
  }

  const sectionLabels = CV_SECTION_LABELS[locale];
  const hiddenSet = new Set<CvSectionKey>(hiddenSections);

  const renderSectionBody = (key: CvSectionKey) => {
    const commonProps = {
      control,
      register,
      watch,
      setValue,
      errors,
      locale,
    };

    switch (key) {
      case "summary":
        return <SummaryEditor register={register} errors={errors} />;
      case "education":
        return <EducationSectionEditor {...commonProps} />;
      case "experience":
        return <ExperienceSectionEditor {...commonProps} />;
      case "skills":
        return <SkillsSectionEditor {...commonProps} profileSeed={profileSeed} />;
      case "projects":
        return <ProjectsSectionEditor {...commonProps} />;
      case "achievements":
        return (
          <AchievementsSectionEditor {...commonProps} profileSeed={profileSeed} />
        );
      case "activities":
        return <ActivitiesSectionEditor {...commonProps} />;
      case "certifications":
        return <CertificationsSectionEditor {...commonProps} />;
      case "custom":
        return <CustomSectionsEditor {...commonProps} />;
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-60px)] w-full overflow-hidden bg-[#F6F8FB]">
      {/* Editor Sticky Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 py-2.5 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <Link
            href="/tools/cv-builder"
            className="inline-flex items-center gap-1 rounded-xl border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 hover:text-slate-900 shrink-0"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Danh sách CV</span>
          </Link>

          <div className="min-w-0">
            {editingTitle ? (
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onBlur={() => setEditingTitle(false)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") setEditingTitle(false);
                }}
                maxLength={120}
                autoFocus
                className="h-8 rounded-lg border border-blue-400 px-2 text-sm font-bold text-slate-900 focus:outline-none"
              />
            ) : (
              <button
                type="button"
                onClick={() => setEditingTitle(true)}
                className="flex items-center gap-1.5 text-left group cursor-pointer"
                title="Nhấn để đổi tên CV"
              >
                <span className="text-sm font-bold text-slate-900 truncate max-w-[180px] sm:max-w-xs">
                  {title || "CV chưa đặt tên"}
                </span>
                <PenLine className="h-3.5 w-3.5 text-slate-400 group-hover:text-blue-600 shrink-0" />
              </button>
            )}
          </div>

          {/* Save Status Pill */}
          <div className="hidden md:flex items-center gap-1.5 text-xs">
            {saveStatus === "saving" ? (
              <span className="inline-flex items-center gap-1 text-blue-600 font-medium">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span>Đang lưu...</span>
              </span>
            ) : saveStatus === "conflict" ? (
              <button
                type="button"
                onClick={loadCvDetail}
                className="inline-flex items-center gap-1 rounded-full bg-amber-100 border border-amber-300 px-2.5 py-0.5 text-[11px] font-semibold text-amber-800 cursor-pointer"
              >
                <RefreshCw className="h-3 w-3" />
                <span>Xung đột phiên bản · Tải lại</span>
              </button>
            ) : saveStatus === "error" ? (
              <span
                className="inline-flex items-center gap-1 text-rose-600 font-medium"
                title={saveError || undefined}
              >
                <AlertCircle className="h-3.5 w-3.5" />
                <span>Chưa lưu</span>
              </span>
            ) : isDirty ? (
              <span className="text-slate-400">Chưa lưu thay đổi...</span>
            ) : (
              <span className="inline-flex items-center gap-1 text-emerald-700 font-medium">
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>
                  Đã lưu{lastSavedTimeLabel ? ` lúc ${lastSavedTimeLabel}` : ""}
                </span>
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={saveStatus === "saving"}
            onClick={() => handleSubmit(() => performSave())()}
            className="h-8 gap-1.5 text-xs"
            title="Lưu ngay (Ctrl+S)"
          >
            <Save className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Lưu (Ctrl+S)</span>
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShareModalOpen(true)}
            className="h-8 gap-1.5 text-xs"
          >
            <Share2 className="h-3.5 w-3.5 text-emerald-600" />
            <span className="hidden sm:inline">Chia sẻ</span>
          </Button>

          <CvPdfDownloadButton
            cv={cvData}
            templateId={templateId}
            styleConfig={styleConfig}
            sectionOrder={sectionOrder}
            hiddenSections={hiddenSections}
            locale={locale}
            targetRole={targetRole}
            title={title}
            size="sm"
            className="h-8 gap-1.5 text-xs bg-blue-600 hover:bg-blue-700 text-white"
          />
        </div>
      </div>

      {/* Save Error Banner if any */}
      {saveError && (
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-1.5 text-xs text-amber-800 flex items-center justify-between gap-2 shrink-0">
          <span>{saveError}</span>
          {saveStatus === "conflict" ? (
            <button
              type="button"
              onClick={loadCvDetail}
              className="font-bold underline cursor-pointer"
            >
              Tải lại phiên bản mới nhất (v{version})
            </button>
          ) : (
            <button
              type="button"
              onClick={() => handleSubmit(() => performSave())()}
              className="font-bold underline cursor-pointer"
            >
              Kiểm tra &amp; Thử lưu lại
            </button>
          )}
        </div>
      )}

      {/* Mobile / Tablet Tab Bar (< 1024px) */}
      <div className="flex lg:hidden border-b border-slate-200 bg-white px-3 py-1.5 gap-1 shrink-0">
        {[
          { key: "edit" as const, label: "Soạn thảo", icon: FileText },
          { key: "preview" as const, label: "Xem trước CV", icon: Eye },
          { key: "design" as const, label: "Thiết kế", icon: Palette },
        ].map((tab) => {
          const Icon = tab.icon;
          const active = activeMobileTab === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveMobileTab(tab.key)}
              className={`flex-1 flex items-center justify-center gap-1.5 rounded-xl py-1.5 text-xs font-semibold cursor-pointer ${
                active
                  ? "bg-blue-600 text-white"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Main 50/50 Split-Pane Workspace */}
      <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-2">
        {/* LEFT PANE: CV Form Editor + Section DnD */}
        <div
          className={`overflow-y-auto p-3.5 sm:p-4 space-y-3.5 border-r border-slate-200/80 ${
            activeMobileTab === "edit" ? "block" : "hidden lg:block"
          }`}
        >
          <PersonalInfoEditor register={register} errors={errors} />

          <div className="flex items-center justify-between px-1 pt-1">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Kéo thả thanh nắm (⋮⋮) để sắp xếp thứ tự section trên CV
            </p>
          </div>

          <DndContext
            sensors={sectionSensors}
            collisionDetection={closestCenter}
            onDragEnd={handleSectionDragEnd}
          >
            <SortableContext
              items={sectionOrder}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-3 pb-10">
                {sectionOrder.map((secKey) => (
                  <SortableSectionCard
                    key={secKey}
                    id={secKey}
                    title={sectionLabels[secKey]}
                    icon={SECTION_ICON_MAP[secKey]}
                    isHidden={hiddenSet.has(secKey)}
                    onToggleHidden={() => toggleHiddenSection(secKey)}
                    errorCount={sectionErrorCounts[secKey]}
                    defaultOpen={
                      secKey === "summary" ||
                      secKey === "education" ||
                      secKey === "skills" ||
                      secKey === "achievements" ||
                      secKey === "experience"
                    }
                  >
                    {renderSectionBody(secKey)}
                  </SortableSectionCard>
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </div>

        {/* RIGHT PANE: Style Controls + Live A4 Preview */}
        <div
          className={`flex flex-col min-h-0 bg-slate-200/70 ${
            activeMobileTab === "preview" || activeMobileTab === "design"
              ? "flex"
              : "hidden lg:flex"
          }`}
        >
          <div
            className={
              activeMobileTab === "preview" ? "hidden lg:block" : "block"
            }
          >
            <CvStyleControlsBar />
          </div>

          <div
            className={`flex-1 min-h-0 overflow-auto ${
              activeMobileTab === "design" ? "hidden lg:block" : "block"
            }`}
          >
            <CvA4PreviewCanvas
              cv={cvData}
              templateId={templateId}
              styleConfig={styleConfig}
              sectionOrder={sectionOrder}
              hiddenSections={hiddenSections}
              locale={locale}
              zoomLevel={zoomLevel}
              fitMode={fitMode}
              showPageBreaks={true}
            />
          </div>
        </div>
      </div>

      {/* Share Modal */}
      <ShareCvModal
        open={shareModalOpen}
        cvId={cvId}
        cvTitle={title}
        sharing={sharing}
        onClose={() => setShareModalOpen(false)}
        onUpdated={(updatedDoc) => setSharing(updatedDoc.sharing)}
      />
    </div>
  );
}

