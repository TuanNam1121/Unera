import type { Metadata } from "next";
import { Suspense } from "react";
import { CvEditorClient } from "@/components/cv/editor/CvEditorClient";

export const metadata: Metadata = {
  title: "Chỉnh sửa CV Chuẩn ATS — Unera",
  description:
    "Soạn thảo, kéo thả thứ tự mục, xem trước A4 theo thời gian thực và xuất PDF chuẩn ATS.",
};

export default function CvEditorPage() {
  return (
    <Suspense
      fallback={
        <div className="w-full p-6">
          <div className="h-[75vh] rounded-2xl bg-white border border-slate-200 animate-pulse" />
        </div>
      }
    >
      <CvEditorClient />
    </Suspense>
  );
}

