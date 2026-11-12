import type { Metadata } from "next";
import { Suspense } from "react";
import { CvTemplatesClient } from "@/components/cv/CvTemplatesClient";

export const metadata: Metadata = {
  title: "Thư viện Mẫu CV Chuẩn ATS — Unera",
  description:
    "Khám phá mẫu CV phân loại theo ngành nghề, phong cách thiết kế và cấp độ kinh nghiệm dành cho sinh viên.",
};

export default function CvTemplatesPage() {
  return (
    <Suspense
      fallback={
        <div className="w-full px-3 sm:px-4 lg:px-5 py-6">
          <div className="h-44 rounded-2xl bg-white border border-slate-200 animate-pulse" />
        </div>
      }
    >
      <CvTemplatesClient />
    </Suspense>
  );
}

