import type { Metadata } from "next";
import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import { MbtiAssessmentClient } from "@/components/tools/MbtiAssessmentClient";

export const metadata: Metadata = {
  title: "Trắc nghiệm MBTI — Công cụ sinh viên Unera",
  description:
    "Khám phá 1 trong 16 nhóm tính cách MBTI qua 40 câu hỏi cân bằng cùng gợi ý ngành nghề cho sinh viên.",
};

export default function MbtiToolPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[380px] items-center justify-center gap-2 text-sm text-slate-500">
          <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
          <span>Đang tải Trắc nghiệm MBTI...</span>
        </div>
      }
    >
      <MbtiAssessmentClient />
    </Suspense>
  );
}

