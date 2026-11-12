"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { AdminNewsForm } from "@/components/admin/news/AdminNewsForm";
import { fetchWithAuth } from "@/components/providers/AuthProvider";
import { Button } from "@/components/ui/button";
import type { INewsArticleDetail } from "@/types";

function AdminEditNewsContent() {
  const params = useParams<{ id: string }>();
  const id = params?.id || "";

  const [article, setArticle] = useState<INewsArticleDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    let active = true;

    const loadArticle = async () => {
      try {
        const res = await fetchWithAuth(`/api/admin/news/${id}`, {
          cache: "no-store",
        });
        const data = await res.json();
        if (!active) return;

        if (!res.ok || !data.article) {
          setErrorMsg(data.error || "Không tìm thấy bài viết tin tức.");
        } else {
          setArticle(data.article);
        }
      } catch {
        if (active) setErrorMsg("Lỗi kết nối khi tải bài viết.");
      } finally {
        if (active) setLoading(false);
      }
    };

    void loadArticle();
    return () => {
      active = false;
    };
  }, [id]);

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-7 w-7 animate-spin text-blue-600" />
      </div>
    );
  }

  if (errorMsg || !article) {
    return (
      <div className="max-w-xl py-12 space-y-4">
        <p className="text-sm font-semibold text-rose-600">
          {errorMsg || "Không tìm thấy bài viết"}
        </p>
        <Link href="/admin/news">
          <Button variant="outline" size="sm">
            Quay lại danh sách tin tức
          </Button>
        </Link>
      </div>
    );
  }

  return <AdminNewsForm mode="edit" articleId={id} initialArticle={article} />;
}

export default function AdminEditNewsPage() {
  return (
    <div className="w-full px-6 sm:px-8 py-6">
      <Suspense
        fallback={
          <div className="flex h-96 items-center justify-center">
            <Loader2 className="h-7 w-7 animate-spin text-blue-600" />
          </div>
        }
      >
        <AdminEditNewsContent />
      </Suspense>
    </div>
  );
}

