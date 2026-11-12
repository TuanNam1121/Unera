"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { AlertCircle, ArrowLeft, Compass, Loader2 } from "lucide-react";
import { AdminArticleForm } from "@/components/admin/explore/AdminArticleForm";
import { fetchWithAuth } from "@/components/providers/AuthProvider";
import { buttonVariants } from "@/components/ui/button";
import type { IOrientationArticleDetail } from "@/types";

function AdminExploreEditArticleContent() {
  const params = useParams<{ id: string }>();
  const articleId = params?.id || "";

  const [article, setArticle] = useState<IOrientationArticleDetail | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!articleId) return;
    let cancelled = false;

    async function loadDetail() {
      try {
        const res = await fetchWithAuth(
          `/api/admin/orientation/articles/${articleId}`,
          { cache: "no-store" }
        );
        const data = await res.json();
        if (!cancelled) {
          if (res.ok && data.article) {
            setArticle(data.article);
          } else {
            setErrorMsg(
              data.error || "Không tìm thấy bài viết định hướng cần chỉnh sửa."
            );
          }
        }
      } catch {
        if (!cancelled) {
          setErrorMsg("Lỗi kết nối máy chủ khi tải bài viết.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadDetail();
    return () => {
      cancelled = true;
    };
  }, [articleId]);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center rounded-2xl border border-slate-200 bg-white">
        <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
      </div>
    );
  }

  if (errorMsg || !article) {
    return (
      <div className="space-y-4 rounded-2xl border border-rose-200 bg-rose-50 p-6 text-rose-800">
        <div className="flex items-center gap-2 font-semibold">
          <AlertCircle className="h-5 w-5" />
          <span>{errorMsg || "Không thể tải bài viết"}</span>
        </div>
        <Link
          href="/admin/explore"
          className={buttonVariants({ variant: "outline" })}
        >
          <ArrowLeft className="mr-1.5 h-4 w-4" />
          Quay lại danh sách bài viết
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
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
            Chỉnh sửa bài viết định hướng
          </h1>
        </div>
      </div>

      <AdminArticleForm
        mode="edit"
        articleId={articleId}
        initialArticle={article}
      />
    </div>
  );
}

export default function AdminExploreEditArticlePage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
        </div>
      }
    >
      <AdminExploreEditArticleContent />
    </Suspense>
  );
}
