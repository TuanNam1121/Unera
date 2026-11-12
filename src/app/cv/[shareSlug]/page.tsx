import type { Metadata } from "next";
import { Suspense } from "react";
import { PublicCvViewerClient } from "@/components/cv/PublicCvViewerClient";

export const metadata: Metadata = {
  title: "CV Công khai — Unera CV Builder",
  description: "Xem và tải xuống CV trực tuyến được chia sẻ từ Unera.",
};

export default function PublicCvSharePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-100 flex items-center justify-center p-6">
          <div className="w-full max-w-3xl h-[80vh] rounded-2xl bg-white border border-slate-200 animate-pulse" />
        </div>
      }
    >
      <PublicCvViewerClient />
    </Suspense>
  );
}

