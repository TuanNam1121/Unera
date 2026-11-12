"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  AlertCircle,
  Compass,
  Lock,
  Printer,
} from "lucide-react";
import { CvPdfDownloadButton } from "@/components/cv/pdf/CvPdfDownloadButton";
import { CvA4PreviewCanvas } from "@/components/cv/preview/CvA4PreviewCanvas";
import { buttonVariants } from "@/components/ui/button";
import { Button } from "@/components/ui/button";
import type { ICvPublicViewDTO } from "@/types/cv";

export function PublicCvViewerClient() {
  const params = useParams<{ shareSlug: string }>();
  const shareSlug = params?.shareSlug || "";

  const [cv, setCv] = useState<ICvPublicViewDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!shareSlug) return;
    let cancelled = false;

    fetch(`/api/cv/public/${encodeURIComponent(shareSlug)}`, {
      cache: "no-store",
    })
      .then(async (res) => {
        const data = await res.json();
        if (cancelled) return;
        if (!res.ok || !data.cv) {
          setErrorMsg(
            data.error || "CV này hiện ở chế độ riêng tư hoặc không tồn tại."
          );
          return;
        }
        setCv(data.cv as ICvPublicViewDTO);
      })
      .catch(() => {
        if (!cancelled) {
          setErrorMsg("Không thể tải CV công khai. Vui lòng thử lại sau.");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [shareSlug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-6">
        <div className="w-full max-w-3xl h-[80vh] rounded-2xl bg-white border border-slate-200 animate-pulse" />
      </div>
    );
  }

  if (errorMsg || !cv) {
    return (
      <div className="min-h-screen bg-[#F6F8FB] flex items-center justify-center p-4">
        <div className="w-full max-w-md rounded-2xl bg-white border border-slate-200 p-7 text-center shadow-sm space-y-4">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
            {errorMsg?.includes("riêng tư") ? (
              <Lock className="h-6 w-6" />
            ) : (
              <AlertCircle className="h-6 w-6 text-rose-500" />
            )}
          </div>
          <div className="space-y-1.5">
            <h1 className="text-base font-bold text-slate-900">
              Không thể hiển thị CV
            </h1>
            <p className="text-xs sm:text-sm text-slate-500">{errorMsg}</p>
          </div>
          <Link
            href="/"
            className={buttonVariants({ variant: "outline", size: "sm" })}
          >
            Về trang chủ Unera
          </Link>
        </div>
      </div>
    );
  }

  const cvContent = {
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
  };

  return (
    <div className="min-h-screen bg-slate-200/70 print:bg-white flex flex-col">
      {/* Recruiter Toolbar */}
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur-xs px-4 sm:px-6 py-3 print:hidden">
        <div className="mx-auto max-w-5xl flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 rounded-xl bg-blue-50 border border-blue-200/70 px-2.5 py-1 text-xs font-bold text-blue-700 shrink-0"
            >
              <Compass className="h-3.5 w-3.5" />
              <span>Unera CV</span>
            </Link>
            <div className="min-w-0">
              <p className="text-sm font-bold text-slate-900 truncate">
                {cv.personalInfo.fullName || cv.title}
              </p>
              {(cv.targetRole || cv.personalInfo.jobTitle) && (
                <p className="text-xs text-slate-500 truncate">
                  {cv.targetRole || cv.personalInfo.jobTitle}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => window.print()}
              className="gap-1.5 text-xs"
            >
              <Printer className="h-3.5 w-3.5" />
              <span>In trang</span>
            </Button>

            {cv.allowPdfDownload && (
              <CvPdfDownloadButton
                cv={cvContent}
                templateId={cv.templateId}
                styleConfig={cv.styleConfig}
                sectionOrder={cv.sectionOrder}
                hiddenSections={[]}
                locale={cv.locale}
                targetRole={cv.targetRole}
                title={cv.title}
                size="sm"
                label="Tải PDF"
                className="bg-blue-600 hover:bg-blue-700 text-white text-xs gap-1.5"
              />
            )}
          </div>
        </div>
      </header>

      {/* A4 Sheet */}
      <main className="flex-1 flex justify-center py-4 sm:py-6 print:py-0">
        <CvA4PreviewCanvas
          cv={cvContent}
          templateId={cv.templateId}
          styleConfig={cv.styleConfig}
          sectionOrder={cv.sectionOrder}
          hiddenSections={[]}
          locale={cv.locale}
          zoomLevel={1}
          fitMode={true}
          showPageBreaks={false}
        />
      </main>
    </div>
  );
}

