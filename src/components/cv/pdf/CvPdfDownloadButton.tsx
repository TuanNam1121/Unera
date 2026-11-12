"use client";

import dynamic from "next/dynamic";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { CvPdfDownloadProps } from "@/components/cv/pdf/CvPdfDownloadClient";

const DynamicCvPdfDownload = dynamic(
  () => import("@/components/cv/pdf/CvPdfDownloadClient"),
  {
    ssr: false,
    loading: () => (
      <Button type="button" size="sm" disabled className="gap-1.5">
        <Download className="h-4 w-4" />
        <span>Tải PDF...</span>
      </Button>
    ),
  }
);

export function CvPdfDownloadButton(props: CvPdfDownloadProps) {
  return <DynamicCvPdfDownload {...props} />;
}

