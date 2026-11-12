"use client";

import { Suspense } from "react";
import Link from "next/link";
import { ArrowLeft, Compass, Loader2 } from "lucide-react";
import { AdminArticleForm } from "@/components/admin/explore/AdminArticleForm";
import { buttonVariants } from "@/components/ui/button";

export default function AdminExploreNewArticlePage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-1">
          <Link
            href="/admin/explore"
            className={buttonVariants({
              variant: "ghost",
              size: "sm",
              className: "-ml-2 text-slate-600",
            })}
          >
            <ArrowLeft className="mr-1.5 h-4 w-4" />
            Quay lại danh sách bài viết
          </Link>
          <div className="flex items-center gap-2">
            <Compass className="h-5 w-5 text-blue-600" />
            <h1 className="text-2xl font-bold text-slate-900">
              Viết bài Khám phá định hướng mới
            </h1>
          </div>
        </div>
      </div>

      <Suspense
        fallback={
          <div className="flex h-64 items-center justify-center rounded-2xl border border-slate-200 bg-white">
            <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
          </div>
        }
      >
        <AdminArticleForm mode="create" />
      </Suspense>
    </div>
  );
}
