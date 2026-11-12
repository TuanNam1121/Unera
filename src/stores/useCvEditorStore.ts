"use client";

import { create } from "zustand";
import {
  CV_DEFAULT_SECTION_ORDER,
  CV_DEFAULT_STYLE_CONFIG,
  DEFAULT_CV_TEMPLATE_ID,
} from "@/constants/cv";
import { buildEmptyCvContent } from "@/lib/cv-format";
import { getCvTemplate } from "@/lib/cv-templates";
import type {
  CvLocale,
  CvSectionKey,
  ICvContentData,
  ICvDocumentDTO,
  ICvSharingConfig,
  ICvStyleConfig,
} from "@/types/cv";

export type CvSaveStatus = "idle" | "saving" | "saved" | "error" | "conflict";
export type CvMobileTab = "edit" | "preview" | "design";

interface CvEditorStoreState {
  cvId: string | null;
  title: string;
  targetRole: string;
  templateId: string;
  locale: CvLocale;
  styleConfig: ICvStyleConfig;
  sectionOrder: CvSectionKey[];
  hiddenSections: CvSectionKey[];
  cvData: ICvContentData;
  sharing: ICvSharingConfig;
  version: number;
  lastEditedAt: string | null;

  // UI & Save States
  isDirty: boolean;
  saveStatus: CvSaveStatus;
  saveError: string | null;
  lastSavedTimeLabel: string | null;
  zoomLevel: number;
  fitMode: boolean;
  activeMobileTab: CvMobileTab;
  templateDrawerOpen: boolean;
  shareModalOpen: boolean;

  // Actions
  hydrate: (doc: ICvDocumentDTO) => void;
  reset: () => void;
  syncFormValues: (values: ICvContentData) => void;
  setTitle: (title: string) => void;
  setTargetRole: (targetRole: string) => void;
  setLocale: (locale: CvLocale) => void;
  setStyleConfig: (patch: Partial<ICvStyleConfig>) => void;
  setTemplateId: (templateId: string, applyTemplateDefaults?: boolean) => void;
  setSectionOrder: (order: CvSectionKey[]) => void;
  toggleHiddenSection: (key: CvSectionKey) => void;
  setSharing: (sharing: ICvSharingConfig) => void;
  markSaving: () => void;
  markSaved: (updatedDoc: ICvDocumentDTO) => void;
  markSaveError: (msg: string, isConflict?: boolean) => void;
  setZoomLevel: (zoom: number) => void;
  setFitMode: (fit: boolean) => void;
  setActiveMobileTab: (tab: CvMobileTab) => void;
  setTemplateDrawerOpen: (open: boolean) => void;
  setShareModalOpen: (open: boolean) => void;
}

const DEFAULT_SHARING: ICvSharingConfig = {
  isPublic: false,
  shareSlug: null,
  sharedAt: null,
  viewCount: 0,
  allowPdfDownload: true,
};

function formatTimeHHMM(): string {
  return new Intl.DateTimeFormat("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date());
}

export const useCvEditorStore = create<CvEditorStoreState>((set) => ({
  cvId: null,
  title: "",
  targetRole: "",
  templateId: DEFAULT_CV_TEMPLATE_ID,
  locale: "vi",
  styleConfig: { ...CV_DEFAULT_STYLE_CONFIG },
  sectionOrder: [...CV_DEFAULT_SECTION_ORDER],
  hiddenSections: [],
  cvData: buildEmptyCvContent(),
  sharing: { ...DEFAULT_SHARING },
  version: 1,
  lastEditedAt: null,

  isDirty: false,
  saveStatus: "idle",
  saveError: null,
  lastSavedTimeLabel: null,
  zoomLevel: 0.85,
  fitMode: true,
  activeMobileTab: "edit",
  templateDrawerOpen: false,
  shareModalOpen: false,

  hydrate: (doc) =>
    set({
      cvId: doc._id,
      title: doc.title,
      targetRole: doc.targetRole || "",
      templateId: doc.templateId,
      locale: doc.locale,
      styleConfig: { ...doc.styleConfig },
      sectionOrder: [...doc.sectionOrder],
      hiddenSections: [...doc.hiddenSections],
      cvData: {
        personalInfo: { ...doc.personalInfo },
        summary: doc.summary || "",
        education: [...(doc.education || [])],
        experience: [...(doc.experience || [])],
        skills: [...(doc.skills || [])],
        projects: [...(doc.projects || [])],
        achievements: [...(doc.achievements || [])],
        activities: [...(doc.activities || [])],
        certifications: [...(doc.certifications || [])],
        customSections: [...(doc.customSections || [])],
      },
      sharing: { ...doc.sharing },
      version: doc.version,
      lastEditedAt: doc.lastEditedAt,
      isDirty: false,
      saveStatus: "saved",
      saveError: null,
      lastSavedTimeLabel: formatTimeHHMM(),
    }),

  reset: () =>
    set({
      cvId: null,
      title: "",
      targetRole: "",
      templateId: DEFAULT_CV_TEMPLATE_ID,
      locale: "vi",
      styleConfig: { ...CV_DEFAULT_STYLE_CONFIG },
      sectionOrder: [...CV_DEFAULT_SECTION_ORDER],
      hiddenSections: [],
      cvData: buildEmptyCvContent(),
      sharing: { ...DEFAULT_SHARING },
      version: 1,
      lastEditedAt: null,
      isDirty: false,
      saveStatus: "idle",
      saveError: null,
      lastSavedTimeLabel: null,
    }),

  syncFormValues: (values) =>
    set({
      cvData: values,
      isDirty: true,
    }),

  setTitle: (title) => set({ title, isDirty: true }),

  setTargetRole: (targetRole) => set({ targetRole, isDirty: true }),

  setLocale: (locale) => set({ locale, isDirty: true }),

  setStyleConfig: (patch) =>
    set((state) => ({
      styleConfig: { ...state.styleConfig, ...patch },
      isDirty: true,
    })),

  setTemplateId: (templateId, applyTemplateDefaults = true) =>
    set((state) => {
      const tpl = getCvTemplate(templateId);
      if (!applyTemplateDefaults) {
        return { templateId: tpl.id, isDirty: true };
      }
      return {
        templateId: tpl.id,
        styleConfig: {
          ...state.styleConfig,
          ...tpl.defaultStyleConfig,
          showAvatar: tpl.supportsAvatar
            ? Boolean(state.cvData.personalInfo.avatarUrl) || state.styleConfig.showAvatar
            : false,
        },
        sectionOrder: [...tpl.defaultSectionOrder],
        isDirty: true,
      };
    }),

  setSectionOrder: (sectionOrder) => set({ sectionOrder, isDirty: true }),

  toggleHiddenSection: (key) =>
    set((state) => {
      const exists = state.hiddenSections.includes(key);
      const hiddenSections = exists
        ? state.hiddenSections.filter((item) => item !== key)
        : [...state.hiddenSections, key];
      return { hiddenSections, isDirty: true };
    }),

  setSharing: (sharing) => set({ sharing }),

  markSaving: () => set({ saveStatus: "saving", saveError: null }),

  markSaved: (updatedDoc) =>
    set({
      version: updatedDoc.version,
      lastEditedAt: updatedDoc.lastEditedAt,
      isDirty: false,
      saveStatus: "saved",
      saveError: null,
      lastSavedTimeLabel: formatTimeHHMM(),
    }),

  markSaveError: (msg, isConflict = false) =>
    set({
      saveStatus: isConflict ? "conflict" : "error",
      saveError: msg,
    }),

  setZoomLevel: (zoomLevel) =>
    set({
      zoomLevel: Math.min(1.25, Math.max(0.5, zoomLevel)),
      fitMode: false,
    }),

  setFitMode: (fitMode) => set({ fitMode }),

  setActiveMobileTab: (activeMobileTab) => set({ activeMobileTab }),

  setTemplateDrawerOpen: (templateDrawerOpen) => set({ templateDrawerOpen }),

  setShareModalOpen: (shareModalOpen) => set({ shareModalOpen }),
}));

