"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Compass } from "lucide-react";
import { ArticleCard } from "@/components/orientation/ArticleCard";
import { fetchWithAuth } from "@/components/providers/AuthProvider";
import type {
  IOrientationArticleSummary,
  IOrientationCategoryDTO,
} from "@/types";

export default function HomeExploreArticles() {
  const router = useRouter();
  const [articles, setArticles] = useState<IOrientationArticleSummary[]>([]);
  const [categories, setCategories] = useState<IOrientationCategoryDTO[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function loadExplore() {
      try {
        const [articlesRes, taxonomyRes] = await Promise.all([
          fetchWithAuth("/api/orientation/articles?limit=3&page=1", {
            cache: "no-store",
          }),
          fetch("/api/orientation/taxonomy", { cache: "no-store" }),
        ]);

        if (!active) return;

        if (articlesRes.ok) {
          const articlesData = await articlesRes.json();
          setArticles(
            Array.isArray(articlesData.articles)
              ? articlesData.articles.slice(0, 3)
              : []
          );
        }

        if (taxonomyRes.ok) {
          const taxonomyData = await taxonomyRes.json();
          setCategories(
            Array.isArray(taxonomyData.categories)
              ? taxonomyData.categories.slice(0, 3)
              : []
          );
        }
      } catch {
        // Non-fatal fallback
      } finally {
        if (active) setLoading(false);
      }
    }

    loadExplore();
    return () => {
      active = false;
    };
  }, []);

  const handleToggleLike = async (slug: string) => {
    try {
      const res = await fetchWithAuth(
        `/api/orientation/articles/${slug}/like`,
        { method: "POST" }
      );
      if (res.status === 401) {
        router.push("/login?redirect=/");
        return;
      }
      const data = await res.json();
      if (res.ok) {
        setArticles((prev) =>
          prev.map((item) =>
            item.slug === slug
              ? {
                ...item,
                isLikedByMe: data.liked,
                likeCount: data.likeCount,
              }
              : item
          )
        );
      }
    } catch {
      // Ignore network hiccup
    }
  };

  return (
      <section className="space-y-4 pt-1">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Khám phá định hướng
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Bài viết chuyên sâu về ngành học, lộ trình nghề nghiệp và kinh nghiệm du học dành cho bạn
            </p>
          </div>

          {/* Quick Links */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
            <Link
              href="/explore"
              className="rounded-full bg-blue-50 border border-blue-200 px-3.5 py-1 text-xs font-semibold text-blue-700 shadow-2xs whitespace-nowrap"
            >
              Tất cả bài viết
            </Link>
            {categories.map((cat) => (
              <Link
                key={cat._id}
                href={`/explore?category=${cat.slug}`}
                className="rounded-full bg-white border border-slate-200 px-3.5 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors whitespace-nowrap"
              >
                {cat.name}
              </Link>
            ))}
            <Link
              href="/explore"
              className="flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 ml-2 whitespace-nowrap"
            >
              <span>Xem tất cả</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[0, 1, 2].map((idx) => (
              <div
                key={idx}
                className="h-72 rounded-2xl border border-slate-200/80 bg-white animate-pulse"
              />
            ))}
          </div>
        ) : articles.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
            <Compass className="h-8 w-8 text-slate-300" />
            <p className="mt-2 text-sm font-medium text-slate-600">
              Chưa có bài viết khám phá định hướng nào được xuất bản.
            </p>
            <Link
              href="/explore"
              className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:underline"
            >
              <span>Đi tới Khám phá định hướng</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {articles.map((article) => (
              <ArticleCard
                key={article._id}
                article={article}
                onToggleLike={handleToggleLike}
              />
            ))}
          </div>
        )}
      </section>
      );
}

