"use client";

import { useState } from "react";
import { pdf } from "@react-pdf/renderer";
import { Download, Loader2 } from "lucide-react";
import { CvPdfDocument } from "@/components/cv/pdf/CvPdfDocument";
import { Button } from "@/components/ui/button";
import { slugifyVietnamese } from "@/lib/orientation-utils";
import type {
  CvLocale,
  CvSectionKey,
  ICvContentData,
  ICvStyleConfig,
} from "@/types/cv";

export interface CvPdfDownloadProps {
  cv: ICvContentData;
  templateId: string;
  styleConfig: ICvStyleConfig;
  sectionOrder: CvSectionKey[];
  hiddenSections: CvSectionKey[];
  locale: CvLocale;
  targetRole?: string;
  title?: string;
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm";
  label?: string;
  className?: string;
}

export default function CvPdfDownloadClient({
  cv,
  templateId,
  styleConfig,
  sectionOrder,
  hiddenSections,
  locale,
  targetRole,
  title,
  variant = "default",
  size = "sm",
  label = "Tải PDF chuẩn ATS",
  className,
}: CvPdfDownloadProps) {
  const [generating, setGenerating] = useState(false);

  const handleDownload = async () => {
    setGenerating(true);
    try {
      const blob = await pdf(
        <CvPdfDocument
          cv={cv}
          templateId={templateId}
          styleConfig={styleConfig}
          sectionOrder={sectionOrder}
          hiddenSections={hiddenSections}
          locale={locale}
        />
      ).toBlob();

      const namePart = slugifyVietnamese(cv.personalInfo.fullName || title || "unera");
      const rolePart = slugifyVietnamese(targetRole || cv.personalInfo.jobTitle || "");
      const fileName = rolePart
        ? `CV_${namePart}_${rolePart}.pdf`
        : `CV_${namePart}.pdf`;

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1500);
    } catch (err) {
      console.error("PDF export failed:", err);
      alert(
        "Không thể xuất tệp PDF lúc này. Nếu ảnh đại diện từ nguồn ngoài chặn tải, hãy thử tắt ảnh đại diện hoặc kiểm tra lại liên kết."
      );
    } finally {
      setGenerating(false);
    }
  };

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      disabled={generating}
      onClick={handleDownload}
      className={className}
    >
      {generating ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Download className="h-4 w-4" />
      )}
      <span>{generating ? "Đang tạo PDF..." : label}</span>
    </Button>
  );
}

