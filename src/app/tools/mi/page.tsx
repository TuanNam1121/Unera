import type { Metadata } from "next";
import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import { MiAssessmentClient } from "@/components/tools/MiAssessmentClient";

export const metadata: Metadata = {
  title: "Trắc nghiệm Đa trí thông minh MI — Unera",
  description:
    "Đánh giá 8 loại hình trí thông minh Howard Gardner với biểu đồ Radar và phương pháp học đại học hiệu quả.",
};

export default function MiToolPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[380px] items-center justify-center gap-2 text-sm text-slate-500">
          <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
          <span>Đang tải Trắc nghiệm MI...</span>
        </div>
      }
    >
      <MiAssessmentClient />
    </Suspense>
  );
}

