"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Compass,
  Loader2,
  Search,
  Sparkles,
  Tag,
  X,
} from "lucide-react";
import { ArticleCard } from "@/components/orientation/ArticleCard";
import { fetchWithAuth } from "@/components/providers/AuthProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type {
  IOrientationArticleSummary,
  IOrientationCategoryDTO,
} from "@/types";

function ExploreFeedContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const categorySlug = searchParams.get("category") || "";
  const topicSlug = searchParams.get("topic") || "";
  const tagFilter = searchParams.get("tag") || "";
  const queryQ = searchParams.get("q") || "";
  const sort = searchParams.get("sort") || "latest";
  const page = Math.max(1, Number.parseInt(searchParams.get("page") || "1", 10) || 1);

  const [searchInput, setSearchInput] = useState(queryQ);
  const [taxonomy, setTaxonomy] = useState<IOrientationCategoryDTO[]>([]);
  const [articles, setArticles] = useState<IOrientationArticleSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    let cancelled = false;
    async function loadTaxonomy() {
      try {
        const res = await fetch("/api/orientation/taxonomy", {
          cache: "no-store",
        });
        const data = await res.json();
        if (!cancelled && res.ok && Array.isArray(data.categories)) {
          setTaxonomy(data.categories);
        }
      } catch {
        // Non-fatal
      }
    }
    loadTaxonomy();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadArticles() {
      try {
        const params = new URLSearchParams();
        if (categorySlug) params.set("category", categorySlug);
        if (topicSlug) params.set("topic", topicSlug);
        if (tagFilter) params.set("tag", tagFilter);
        if (queryQ) params.set("q", queryQ);
        if (sort) params.set("sort", sort);
        params.set("page", String(page));
        params.set("limit", "12");

        const res = await fetch(
          `/api/orientation/articles?${params.toString()}`,
          {
            credentials: "include",
            cache: "no-store",
          }
        );
        const data = await res.json();
        if (!cancelled && res.ok) {
          setArticles(Array.isArray(data.articles) ? data.articles : []);
          setTotal(data.pagination?.total || 0);
          setTotalPages(data.pagination?.totalPages || 1);
        }
      } catch {
        // Keep UI safe
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadArticles();
    return () => {
      cancelled = true;
    };
  }, [categorySlug, topicSlug, tagFilter, queryQ, sort, page]);

  const updateUrlParams = (
    updates: Record<string, string | null>,
    resetPage = true
  ) => {
    const next = new URLSearchParams(searchParams.toString());
    for (const [k, v] of Object.entries(updates)) {
      if (!v) next.delete(k);
      else next.set(k, v);
    }
    if (resetPage) next.delete("page");
    const qs = next.toString();
    router.push(qs ? `/explore?${qs}` : "/explore");
  };

  const activeCategory = useMemo(
    () => taxonomy.find((c) => c.slug === categorySlug) || null,
    [taxonomy, categorySlug]
  );

  const visibleTopics = useMemo(() => {
    if (activeCategory) return activeCategory.topics || [];
    return [];
  }, [activeCategory]);

  const isDefaultOverview =
    !categorySlug && !topicSlug && !tagFilter && !queryQ && page === 1 && sort === "latest";

  const featuredArticles = useMemo(
    () => (isDefaultOverview ? articles.filter((a) => a.isFeatured).slice(0, 4) : []),
    [articles, isDefaultOverview]
  );

  const regularArticles = useMemo(() => {
    if (featuredArticles.length === 0) return articles;
    const featuredIds = new Set(featuredArticles.map((f) => f._id));
    return articles.filter((a) => !featuredIds.has(a._id));
  }, [articles, featuredArticles]);

  const handleToggleLike = async (slug: string) => {
    try {
      const res = await fetchWithAuth(
        `/api/orientation/articles/${slug}/like`,
        { method: "POST" }
      );
      if (res.status === 401) {
        router.push("/login?redirect=/explore");
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
    <div className="w-full px-3 sm:px-4 lg:px-5 py-4 sm:py-5 space-y-6">
      {/* Hero Banner */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-700 via-indigo-700 to-slate-900 p-5 text-white shadow-lg sm:p-7">
        <div className="max-w-4xl space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold backdrop-blur-xs">
            <Compass className="h-3.5 w-3.5 text-sky-300" />
            Unera Orientation Hub
          </div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Khám phá Định hướng Học tập, Ngành nghề & Du học
          </h1>
          <p className="text-sm leading-relaxed text-blue-100 sm:text-base">
            Kho bài viết chuyên sâu, lộ trình phát triển 4 năm đại học, kinh nghiệm săn học bổng chính phủ và góc nhìn thực tế từ chuyên gia.
          </p>
        </div>

        {/* Search + Sort Bar */}
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              updateUrlParams({ q: searchInput.trim() || null });
            }}
            className="flex flex-1 gap-2"
          >
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Tìm bài viết theo ngành học, học bổng, kỹ năng..."
                className="h-11 border-0 bg-white pl-10 text-slate-900 placeholder:text-slate-400 shadow-sm"
              />
            </div>
            <Button
              type="submit"
              className="h-11 bg-sky-500 px-5 font-semibold text-white hover:bg-sky-400"
            >
              Tìm kiếm
            </Button>
          </form>

          <select
            value={sort}
            onChange={(e) => updateUrlParams({ sort: e.target.value })}
            aria-label="Sắp xếp bài viết"
            className="h-11 rounded-lg border border-white/20 bg-white/10 px-3.5 text-sm font-medium text-white backdrop-blur-xs outline-none [&>option]:text-slate-900"
          >
            <option value="latest">Mới nhất</option>
            <option value="popular">Đọc nhiều nhất</option>
            <option value="most_liked">Yêu thích nhiều nhất</option>
          </select>
        </div>
      </section>

      {/* Taxonomy Filter Pills */}
      <section className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() =>
              updateUrlParams({ category: null, topic: null, tag: null })
            }
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              !categorySlug
                ? "bg-blue-600 text-white shadow-xs"
                : "border border-slate-200 bg-white text-slate-700 hover:border-blue-300"
            }`}
          >
            Tất cả danh mục
          </button>

          {taxonomy.map((cat) => {
            const active = categorySlug === cat.slug;
            return (
              <button
                key={cat._id}
                type="button"
                onClick={() =>
                  updateUrlParams({
                    category: active ? null : cat.slug,
                    topic: null,
                  })
                }
                className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                  active
                    ? "bg-blue-600 text-white shadow-xs"
                    : "border border-slate-200 bg-white text-slate-700 hover:border-blue-300"
                }`}
              >
                {cat.name}
              </button>
            );
          })}
        </div>

        {visibleTopics.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 rounded-2xl border border-slate-200/80 bg-slate-50/70 px-3.5 py-2.5">
            <span className="mr-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Chủ đề:
            </span>
            <button
              type="button"
              onClick={() => updateUrlParams({ topic: null })}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                !topicSlug
                  ? "bg-slate-900 text-white"
                  : "bg-white text-slate-600 hover:bg-slate-200/60"
              }`}
            >
              Tất cả
            </button>
            {visibleTopics.map((topic) => {
              const active = topicSlug === topic.slug;
              return (
                <button
                  key={topic._id}
                  type="button"
                  onClick={() =>
                    updateUrlParams({ topic: active ? null : topic.slug })
                  }
                  className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                    active
                      ? "bg-slate-900 text-white"
                      : "bg-white text-slate-600 hover:bg-slate-200/60"
                  }`}
                >
                  {topic.name}
                </button>
              );
            })}
          </div>
        )}

        {(tagFilter || queryQ) && (
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600">
            <span>Đang lọc ({total} kết quả):</span>
            {queryQ && (
              <button
                type="button"
                onClick={() => {
                  setSearchInput("");
                  updateUrlParams({ q: null });
                }}
                className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-1 font-medium text-blue-700 hover:bg-blue-100"
              >
                Từ khóa: “{queryQ}”
                <X className="h-3 w-3" />
              </button>
            )}
            {tagFilter && (
              <button
                type="button"
                onClick={() => updateUrlParams({ tag: null })}
                className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2.5 py-1 font-medium text-indigo-700 hover:bg-indigo-100"
              >
                <Tag className="h-3 w-3" />#{tagFilter}
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
        )}
      </section>

      {/* Content */}
      {loading ? (
        <div className="flex h-60 items-center justify-center rounded-2xl border border-slate-200 bg-white">
          <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
        </div>
      ) : articles.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
          <Compass className="h-10 w-10 text-slate-300" />
          <h3 className="mt-3 text-base font-semibold text-slate-800">
            Không tìm thấy bài viết phù hợp
          </h3>
          <p className="mt-1 text-sm text-slate-500">
            Thử đổi danh mục hoặc từ khóa tìm kiếm để xem thêm bài viết định hướng khác.
          </p>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setSearchInput("");
              router.push("/explore");
            }}
            className="mt-4"
          >
            Xem tất cả bài viết
          </Button>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Featured Spotlight */}
          {featuredArticles.length > 0 && (
            <section className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                <Sparkles className="h-4 w-4 text-amber-500" />
                Bài viết Tiêu điểm
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {featuredArticles.map((article) => (
                  <ArticleCard
                    key={article._id}
                    article={article}
                    variant="featured"
                    onToggleLike={handleToggleLike}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Regular Feed */}
          {regularArticles.length > 0 && (
            <section className="space-y-3">
              <div className="flex items-center justify-between text-sm font-semibold text-slate-900">
                <span>
                  {activeCategory
                    ? `Bài viết thuộc ${activeCategory.name}`
                    : "Tất cả bài viết định hướng"}
                </span>
                <span className="text-xs font-normal text-slate-500">
                  {total} bài viết
                </span>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {regularArticles.map((article) => (
                  <ArticleCard
                    key={article._id}
                    article={article}
                    onToggleLike={handleToggleLike}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() =>
                  updateUrlParams({ page: String(Math.max(1, page - 1)) }, false)
                }
              >
                Trang trước
              </Button>
              <span className="px-3 text-sm text-slate-600">
                Trang {page} / {totalPages}
              </span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() =>
                  updateUrlParams(
                    { page: String(Math.min(totalPages, page + 1)) },
                    false
                  )
                }
              >
                Trang sau
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function ExplorePage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
        </div>
      }
    >
      <ExploreFeedContent />
    </Suspense>
  );
}
