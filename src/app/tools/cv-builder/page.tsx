import type { Metadata } from "next";
import { Suspense } from "react";
import { CvManagementClient } from "@/components/cv/CvManagementClient";

export const metadata: Metadata = {
  title: "CV Builder Chuẩn ATS — Unera",
  description:
    "Tạo, quản lý, tùy biến giao diện và xuất PDF CV chuẩn ATS đồng bộ trực tiếp với hồ sơ sinh viên Unera.",
};

export default function CvBuilderPage() {
  return (
    <Suspense
      fallback={
        <div className="w-full px-3 sm:px-4 lg:px-5 py-6">
          <div className="h-44 rounded-2xl bg-white border border-slate-200 animate-pulse" />
        </div>
      }
    >
      <CvManagementClient />
    </Suspense>
  );
}

