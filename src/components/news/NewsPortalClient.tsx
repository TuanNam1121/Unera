"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  Bookmark,
  Calendar,
  CheckCircle2,
  Flame,
  History,
  Loader2,
  Newspaper,
  Search,
  Sparkles,
  Tag,
  Trash2,
  X,
} from "lucide-react";
import { NewsCard } from "@/components/news/NewsCard";
import { fetchWithAuth, useAuth } from "@/components/providers/AuthProvider";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { formatRelativeTimeVi } from "@/lib/news-utils";
import type {
  INewsArticleSummary,
  INewsCategoryDTO,
  INewsReadingHistoryItem,
  INewsTagDTO,
} from "@/types";

type NewsPortalTab = "all" | "saved" | "history";

interface SavedBookmarkItem {
  _id: string;
  articleId: string;
  savedAt: string;
  isAvailable: boolean;
  article: INewsArticleSummary | null;
}

const DATE_RANGE_LABELS: Array<{ value: string; label: string }> = [
  { value: "all", label: "Mọi thời gian" },
  { value: "today", label: "Hôm nay" },
  { value: "7d", label: "7 ngày qua" },
  { value: "30d", label: "30 ngày qua" },
  { value: "90d", label: "90 ngày qua" },
];

export function NewsPortalClient({
  initialTab = "all",
}: {
  initialTab?: NewsPortalTab;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { user } = useAuth();

  const urlTabParam = searchParams.get("tab");
  const activeTab: NewsPortalTab =
    urlTabParam === "saved" || urlTabParam === "history" || urlTabParam === "all"
      ? urlTabParam
      : initialTab;

  const queryCategory = searchParams.get("category") || "";
  const queryTag = searchParams.get("tag") || "";
  const queryDateRange = searchParams.get("dateRange") || "all";
  const querySort = searchParams.get("sort") === "popular" ? "popular" : "latest";
  const querySearch = searchParams.get("search") || searchParams.get("q") || "";
  const queryPage = Math.max(1, parseInt(searchParams.get("page") || "1", 10) || 1);

  const [searchInput, setSearchInput] = useState(querySearch);
  const [prevQuerySearch, setPrevQuerySearch] = useState(querySearch);
  if (querySearch !== prevQuerySearch) {
    setPrevQuerySearch(querySearch);
    setSearchInput(querySearch);
  }

  // Feed data
  const [articles, setArticles] = useState<INewsArticleSummary[]>([]);
  const [featuredArticles, setFeaturedArticles] = useState<INewsArticleSummary[]>([]);
  const [categories, setCategories] = useState<INewsCategoryDTO[]>([]);
  const [tags, setTags] = useState<INewsTagDTO[]>([]);
  const [totalPages, setTotalPages] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [loadedFeedKey, setLoadedFeedKey] = useState("");

  // Saved articles data
  const [savedItems, setSavedItems] = useState<SavedBookmarkItem[]>([]);
  const [savedTotal, setSavedTotal] = useState(0);
  const [savedTotalPages, setSavedTotalPages] = useState(0);
  const [loadedSavedKey, setLoadedSavedKey] = useState("");

  // History data
  const [historyItems, setHistoryItems] = useState<INewsReadingHistoryItem[]>([]);
  const [historyTotal, setHistoryTotal] = useState(0);
  const [loadedHistoryKey, setLoadedHistoryKey] = useState("");

  const currentFeedKey =
    activeTab === "all"
      ? `${queryCategory}|${queryTag}|${queryDateRange}|${querySort}|${querySearch}|${queryPage}`
      : "";
  const currentSavedKey =
    activeTab === "saved" && user ? `saved|${user.id}|${queryPage}` : "";
  const currentHistoryKey =
    activeTab === "history" && user ? `history|${user.id}|${queryPage}` : "";

  const loadingFeed = activeTab === "all" && loadedFeedKey !== currentFeedKey;
  const loadingSaved =
    Boolean(user) && activeTab === "saved" && loadedSavedKey !== currentSavedKey;
  const loadingHistory =
    Boolean(user) &&
    activeTab === "history" &&
    loadedHistoryKey !== currentHistoryKey;

  const [toastText, setToastText] = useState<string | null>(null);

  const showToast = useCallback((msg: string) => {
    setToastText(msg);
    setTimeout(() => {
      setToastText((curr) => (curr === msg ? null : curr));
    }, 3200);
  }, []);

  const updateParams = useCallback(
    (updates: Record<string, string | null>, targetPath?: string) => {
      const next = new URLSearchParams(searchParams.toString());
      for (const [k, v] of Object.entries(updates)) {
        if (v === null || v === "") {
          next.delete(k);
        } else {
          next.set(k, v);
        }
      }
      if (!("page" in updates)) {
        next.delete("page");
      }
      const qs = next.toString();
      const basePath = targetPath || pathname;
      router.push(qs ? `${basePath}?${qs}` : basePath);
    },
    [pathname, router, searchParams]
  );

  const switchTab = (nextTab: NewsPortalTab) => {
    if (nextTab === "all") {
      router.push("/news");
    } else if (nextTab === "saved") {
      router.push("/news/saved");
    } else {
      router.push("/news/history");
    }
  };

  // Debounce 300ms for search input on "all" tab
  useEffect(() => {
    if (activeTab !== "all") return;
    const trimmed = searchInput.trim();
    if (trimmed === querySearch) return;
    const timer = setTimeout(() => {
      updateParams({ search: trimmed || null, q: null });
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput, querySearch, activeTab, updateParams]);

  // Fetch main feed
  useEffect(() => {
    if (activeTab !== "all") return;
    let active = true;

    const loadFeed = async () => {
      const params = new URLSearchParams();
      if (queryCategory) params.set("category", queryCategory);
      if (queryTag) params.set("tag", queryTag);
      if (queryDateRange && queryDateRange !== "all") {
        params.set("dateRange", queryDateRange);
      }
      if (querySort) params.set("sort", querySort);
      if (querySearch) params.set("search", querySearch);
      params.set("page", String(queryPage));
      params.set("limit", "12");

      try {
        const res = await fetchWithAuth(`/api/news?${params.toString()}`, {
          cache: "no-store",
        });
        const data = await res.json();
        if (active && res.ok) {
          setArticles(data.articles || []);
          setFeaturedArticles(data.featuredArticles || []);
          setCategories(data.categories || []);
          setTags(data.tags || []);
          setTotalCount(data.total || 0);
          setTotalPages(data.totalPages || 0);
        }
      } finally {
        if (active) setLoadedFeedKey(currentFeedKey);
      }
    };

    void loadFeed();
    return () => {
      active = false;
    };
  }, [
    activeTab,
    currentFeedKey,
    queryCategory,
    queryTag,
    queryDateRange,
    querySort,
    querySearch,
    queryPage,
  ]);

  // Fetch saved bookmarks
  useEffect(() => {
    if (activeTab !== "saved" || !user) return;
    let active = true;

    const loadSaved = async () => {
      try {
        const res = await fetchWithAuth(
          `/api/news/saved?page=${queryPage}&limit=12`,
          { cache: "no-store" }
        );
        const data = await res.json();
        if (active && res.ok) {
          setSavedItems(data.items || []);
          setSavedTotal(data.total || 0);
          setSavedTotalPages(data.totalPages || 0);
        }
      } finally {
        if (active) setLoadedSavedKey(currentSavedKey);
      }
    };

    void loadSaved();
    return () => {
      active = false;
    };
  }, [activeTab, currentSavedKey, queryPage, user]);

  // Fetch reading history
  useEffect(() => {
    if (activeTab !== "history" || !user) return;
    let active = true;

    const loadHistory = async () => {
      try {
        const res = await fetchWithAuth(
          `/api/news/history?page=${queryPage}&limit=12`,
          { cache: "no-store" }
        );
        const data = await res.json();
        if (active && res.ok) {
          setHistoryItems(data.items || []);
          setHistoryTotal(data.total || 0);
        }
      } finally {
        if (active) setLoadedHistoryKey(currentHistoryKey);
      }
    };

    void loadHistory();
    return () => {
      active = false;
    };
  }, [activeTab, currentHistoryKey, queryPage, user]);

  const handleToggleBookmark = async (slug: string, articleId: string) => {
    if (!user) {
      router.push(`/login?next=${encodeURIComponent(pathname)}`);
      return;
    }

    const res = await fetchWithAuth(
      `/api/news/${encodeURIComponent(slug || articleId)}/bookmark`,
      { method: "POST" }
    );

    if (res.status === 401) {
      router.push(`/login?next=${encodeURIComponent(pathname)}`);
      return;
    }

    const data = await res.json();
    if (!res.ok) {
      showToast(data.error || "Không thể cập nhật lưu bài viết");
      return;
    }

    const nextBookmarked = Boolean(data.bookmarked);
    const nextCount = Number(data.bookmarkCount ?? 0);

    setArticles((prev) =>
      prev.map((a) =>
        a._id === articleId
          ? { ...a, isBookmarkedByMe: nextBookmarked, bookmarkCount: nextCount }
          : a
      )
    );
    setFeaturedArticles((prev) =>
      prev.map((a) =>
        a._id === articleId
          ? { ...a, isBookmarkedByMe: nextBookmarked, bookmarkCount: nextCount }
          : a
      )
    );

    if (!nextBookmarked && activeTab === "saved") {
      setSavedItems((prev) => prev.filter((item) => item.articleId !== articleId));
      setSavedTotal((c) => Math.max(0, c - 1));
    }

    showToast(
      nextBookmarked
        ? "Đã lưu bài viết vào mục yêu thích"
        : "Đã bỏ lưu bài viết"
    );
  };

  const handleShareArticle = async (slug: string, title: string) => {
    const shareUrl = `${window.location.origin}/news/${slug}`;
    try {
      if (navigator.share) {
        await navigator.share({ title, url: shareUrl });
      } else if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareUrl);
      }
    } catch {
      // Clipboard fallback below
      try {
        await navigator.clipboard?.writeText(shareUrl);
      } catch {
        // Ignore clipboard errors in headless mode
      }
    }

    showToast("Đã sao chép liên kết bài viết!");

    try {
      const res = await fetch(`/api/news/${encodeURIComponent(slug)}/share`, {
        method: "POST",
      });
      const data = await res.json();
      if (res.ok && typeof data.shareCount === "number") {
        setArticles((prev) =>
          prev.map((a) =>
            a.slug === slug ? { ...a, shareCount: data.shareCount } : a
          )
        );
        setFeaturedArticles((prev) =>
          prev.map((a) =>
            a.slug === slug ? { ...a, shareCount: data.shareCount } : a
          )
        );
      }
    } catch {
      // Non-fatal
    }
  };

  const handleRemoveHistoryItem = async (articleId: string) => {
    const res = await fetchWithAuth(
      `/api/news/history?articleId=${encodeURIComponent(articleId)}`,
      { method: "DELETE" }
    );
    if (res.ok) {
      setHistoryItems((prev) => prev.filter((h) => h.articleId !== articleId));
      setHistoryTotal((c) => Math.max(0, c - 1));
      showToast("Đã xóa bài viết khỏi lịch sử đọc");
    }
  };

  const handleClearAllHistory = async () => {
    const res = await fetchWithAuth("/api/news/history", {
      method: "DELETE",
    });
    if (res.ok) {
      setHistoryItems([]);
      setHistoryTotal(0);
      showToast("Đã xóa toàn bộ lịch sử đọc");
    }
  };

  const hasActiveFilter =
    Boolean(queryCategory) ||
    Boolean(queryTag) ||
    Boolean(querySearch) ||
    queryDateRange !== "all";

  return (
    <div className="w-full px-3 sm:px-4 lg:px-5 py-4 sm:py-5 space-y-5">
      {/* Toast banner */}
      {toastText && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-semibold text-white shadow-lg">
          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          <span>{toastText}</span>
        </div>
      )}

      {/* Top Hero Header & Navigation Tabs */}
      <div className="rounded-2xl border border-slate-200/80 bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 p-6 text-white shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold text-blue-200">
              <Newspaper className="h-3.5 w-3.5" />
              <span>Cổng Tin Tức &amp; Tri Thức Sinh Viên UNERA</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Tin Tức, Học Bổng &amp; Xu Hướng Nghề Nghiệp
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl">
              Cập nhật chính sách du học, học bổng Chính phủ, kỹ năng viết CV và xu hướng ngành nghề dành riêng cho sinh viên.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 rounded-xl bg-white/10 p-1.5 backdrop-blur-xs">
            <button
              type="button"
              onClick={() => switchTab("all")}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-semibold transition-all cursor-pointer ${
                activeTab === "all"
                  ? "bg-white text-slate-900 shadow-xs"
                  : "text-slate-200 hover:bg-white/10"
              }`}
            >
              <Newspaper className="h-3.5 w-3.5" />
              <span>Tất cả tin tức</span>
            </button>
            <button
              type="button"
              onClick={() => switchTab("saved")}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-semibold transition-all cursor-pointer ${
                activeTab === "saved"
                  ? "bg-white text-slate-900 shadow-xs"
                  : "text-slate-200 hover:bg-white/10"
              }`}
            >
              <Bookmark className="h-3.5 w-3.5" />
              <span>Bài viết đã lưu</span>
            </button>
            <button
              type="button"
              onClick={() => switchTab("history")}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-semibold transition-all cursor-pointer ${
                activeTab === "history"
                  ? "bg-white text-slate-900 shadow-xs"
                  : "text-slate-200 hover:bg-white/10"
              }`}
            >
              <History className="h-3.5 w-3.5" />
              <span>Lịch sử đã đọc</span>
            </button>
          </div>
        </div>
      </div>

      {/* TAB 1: ALL NEWS */}
      {activeTab === "all" && (
        <div className="space-y-6">
          {/* Featured Strip (NEWS10) */}
          {!hasActiveFilter && queryPage === 1 && featuredArticles.length > 0 && (
            <section className="space-y-3">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-amber-500" />
                <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                  Tin Tức Nổi Bật
                </h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {featuredArticles.slice(0, 4).map((item) => (
                  <NewsCard
                    key={item._id}
                    article={item}
                    variant="featured"
                    onToggleBookmark={handleToggleBookmark}
                    onShare={handleShareArticle}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Category Navigation Pills (NEWS02) */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            <button
              type="button"
              onClick={() => updateParams({ category: null })}
              className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-semibold border transition-all cursor-pointer ${
                !queryCategory
                  ? "bg-blue-600 text-white border-blue-600 shadow-2xs"
                  : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
              }`}
            >
              Tất cả
            </button>
            {categories.map((cat) => {
              const isSelected = queryCategory.toLowerCase() === cat.slug.toLowerCase();
              return (
                <button
                  key={cat._id}
                  type="button"
                  onClick={() => updateParams({ category: cat.slug })}
                  className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-semibold border transition-all cursor-pointer ${
                    isSelected
                      ? "bg-blue-600 text-white border-blue-600 shadow-2xs"
                      : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  {cat.name}
                </button>
              );
            })}
          </div>

          {/* Search & Filters Bar (NEWS03, NEWS04, NEWS05) */}
          <Card className="rounded-2xl border-slate-200/80 shadow-2xs bg-white">
            <CardContent className="p-4 flex flex-col lg:flex-row lg:items-center gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="Tìm kiếm bài viết theo tiêu đề, từ khóa, nội dung..."
                  className="pl-9 pr-8 h-10 rounded-xl text-xs sm:text-sm"
                />
                {searchInput && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchInput("");
                      updateParams({ search: null, q: null });
                    }}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                {/* Tag Filter */}
                <div className="flex items-center gap-1.5">
                  <Tag className="h-3.5 w-3.5 text-slate-400" />
                  <select
                    aria-label="Lọc theo tag"
                    value={queryTag}
                    onChange={(e) => updateParams({ tag: e.target.value || null })}
                    className="h-9 rounded-xl border border-slate-200 bg-white px-2.5 text-xs font-medium text-slate-700 focus:border-blue-500 focus:outline-none"
                  >
                    <option value="">Tất cả tag</option>
                    {tags.map((t) => (
                      <option key={t._id} value={t.name}>
                        #{t.name} ({t.usageCount})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Date Range Filter */}
                <div className="flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-slate-400" />
                  <select
                    aria-label="Lọc theo thời gian"
                    value={queryDateRange}
                    onChange={(e) =>
                      updateParams({
                        dateRange: e.target.value === "all" ? null : e.target.value,
                      })
                    }
                    className="h-9 rounded-xl border border-slate-200 bg-white px-2.5 text-xs font-medium text-slate-700 focus:border-blue-500 focus:outline-none"
                  >
                    {DATE_RANGE_LABELS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Sort Toggle */}
                <div className="flex items-center rounded-xl border border-slate-200 p-0.5 bg-slate-50">
                  <button
                    type="button"
                    onClick={() => updateParams({ sort: "latest" })}
                    className={`rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-colors cursor-pointer ${
                      querySort === "latest"
                        ? "bg-white text-blue-700 shadow-2xs"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    Mới nhất
                  </button>
                  <button
                    type="button"
                    onClick={() => updateParams({ sort: "popular" })}
                    className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-colors cursor-pointer ${
                      querySort === "popular"
                        ? "bg-white text-rose-600 shadow-2xs"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    <Flame className="h-3.5 w-3.5" />
                    Phổ biến nhất
                  </button>
                </div>

                {hasActiveFilter && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSearchInput("");
                      router.push("/news");
                    }}
                    className="h-9 text-xs text-slate-500 hover:text-slate-800"
                  >
                    Xóa bộ lọc
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Feed Grid */}
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>
              Hiển thị <strong className="text-slate-800">{totalCount}</strong> bài viết
            </span>
          </div>

          {loadingFeed ? (
            <div className="flex h-60 items-center justify-center">
              <Loader2 className="h-7 w-7 animate-spin text-blue-600" />
            </div>
          ) : articles.length === 0 ? (
            <Card className="rounded-2xl border-slate-200/80 bg-white">
              <CardContent className="p-12 text-center space-y-3">
                <Newspaper className="h-10 w-10 text-slate-300 mx-auto" />
                <p className="text-sm font-semibold text-slate-700">
                  Không tìm thấy bài viết phù hợp với bộ lọc hiện tại.
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSearchInput("");
                    router.push("/news");
                  }}
                >
                  Xem toàn bộ tin tức
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {articles.map((item) => (
                <NewsCard
                  key={item._id}
                  article={item}
                  onToggleBookmark={handleToggleBookmark}
                  onShare={handleShareArticle}
                />
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={queryPage <= 1}
                onClick={() =>
                  updateParams({ page: String(Math.max(1, queryPage - 1)) })
                }
              >
                Trang trước
              </Button>
              <span className="text-xs font-semibold text-slate-600 px-2">
                Trang {queryPage} / {totalPages}
              </span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={queryPage >= totalPages}
                onClick={() =>
                  updateParams({ page: String(Math.min(totalPages, queryPage + 1)) })
                }
              >
                Trang sau
              </Button>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: SAVED ARTICLES (NEWS08) */}
      {activeTab === "saved" && (
        <div className="space-y-4">
          {!user ? (
            <Card className="rounded-2xl border-slate-200/80 bg-white">
              <CardContent className="p-10 text-center space-y-3">
                <Bookmark className="h-9 w-9 text-blue-500 mx-auto" />
                <h2 className="text-base font-bold text-slate-900">
                  Đăng nhập để xem danh sách bài viết đã lưu
                </h2>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Lưu lại các thông báo học bổng và cẩm nang kỹ năng quan trọng để đọc lại mọi lúc.
                </p>
                <Link href="/login?next=/news/saved">
                  <Button size="sm">Đăng nhập ngay</Button>
                </Link>
              </CardContent>
            </Card>
          ) : loadingSaved ? (
            <div className="flex h-60 items-center justify-center">
              <Loader2 className="h-7 w-7 animate-spin text-blue-600" />
            </div>
          ) : savedItems.length === 0 ? (
            <Card className="rounded-2xl border-slate-200/80 bg-white">
              <CardContent className="p-12 text-center space-y-3">
                <Bookmark className="h-10 w-10 text-slate-300 mx-auto" />
                <p className="text-sm font-semibold text-slate-700">
                  Bạn chưa lưu bài viết tin tức nào.
                </p>
                <Button size="sm" onClick={() => switchTab("all")}>
                  Khám phá tin tức ngay
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              <p className="text-xs text-slate-500">
                Tổng cộng <strong className="text-slate-800">{savedTotal}</strong> bài viết đã lưu
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {savedItems.map((bm) =>
                  bm.isAvailable && bm.article ? (
                    <NewsCard
                      key={bm._id}
                      article={bm.article}
                      onToggleBookmark={handleToggleBookmark}
                      onShare={handleShareArticle}
                    />
                  ) : (
                    <Card
                      key={bm._id}
                      className="rounded-2xl border-slate-200 bg-slate-50"
                    >
                      <CardContent className="p-5 flex flex-col justify-between h-full space-y-4">
                        <div className="space-y-2">
                          <span className="inline-flex rounded-full bg-slate-200 px-2.5 py-0.5 text-[11px] font-semibold text-slate-700">
                            Bài viết không còn khả dụng
                          </span>
                          <p className="text-xs text-slate-500">
                            Bài viết này đã bị gỡ hoặc chuyển sang trạng thái ẩn bởi quản trị viên.
                          </p>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleToggleBookmark(bm.articleId, bm.articleId)}
                        >
                          Bỏ lưu khỏi danh sách
                        </Button>
                      </CardContent>
                    </Card>
                  )
                )}
              </div>
              {savedTotalPages > 1 && (
                <div className="flex items-center justify-center gap-2 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={queryPage <= 1}
                    onClick={() => updateParams({ page: String(queryPage - 1) })}
                  >
                    Trang trước
                  </Button>
                  <span className="text-xs font-semibold text-slate-600">
                    Trang {queryPage} / {savedTotalPages}
                  </span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={queryPage >= savedTotalPages}
                    onClick={() => updateParams({ page: String(queryPage + 1) })}
                  >
                    Trang sau
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: READING HISTORY (NEWS11) */}
      {activeTab === "history" && (
        <div className="space-y-4">
          {!user ? (
            <Card className="rounded-2xl border-slate-200/80 bg-white">
              <CardContent className="p-10 text-center space-y-3">
                <History className="h-9 w-9 text-blue-500 mx-auto" />
                <h2 className="text-base font-bold text-slate-900">
                  Đăng nhập để xem lịch sử bài viết đã đọc
                </h2>
                <Link href="/login?next=/news/history">
                  <Button size="sm">Đăng nhập ngay</Button>
                </Link>
              </CardContent>
            </Card>
          ) : loadingHistory ? (
            <div className="flex h-60 items-center justify-center">
              <Loader2 className="h-7 w-7 animate-spin text-blue-600" />
            </div>
          ) : historyItems.length === 0 ? (
            <Card className="rounded-2xl border-slate-200/80 bg-white">
              <CardContent className="p-12 text-center space-y-3">
                <History className="h-10 w-10 text-slate-300 mx-auto" />
                <p className="text-sm font-semibold text-slate-700">
                  Lịch sử đọc tin tức của bạn đang trống.
                </p>
                <Button size="sm" onClick={() => switchTab("all")}>
                  Đọc tin mới ngay
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-xs text-slate-500">
                  Có <strong className="text-slate-800">{historyTotal}</strong> bài viết trong lịch sử đọc gần đây
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleClearAllHistory}
                  className="text-xs text-rose-600 border-rose-200 hover:bg-rose-50"
                >
                  <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                  Xóa lịch sử đọc
                </Button>
              </div>

              <div className="divide-y divide-slate-100 rounded-2xl border border-slate-200/80 bg-white overflow-hidden">
                {historyItems.map((entry) => (
                  <div
                    key={entry._id}
                    className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/70 transition-colors"
                  >
                    <div className="space-y-1.5 min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
                        <span className="font-semibold text-blue-600">
                          {formatRelativeTimeVi(entry.lastReadAt)}
                        </span>
                        <span>· {entry.readCount} lần đọc</span>
                        {entry.isAvailable && entry.article?.category && (
                          <span className="rounded bg-slate-100 px-2 py-0.5 font-medium text-slate-700">
                            {entry.article.category.name}
                          </span>
                        )}
                      </div>

                      {entry.isAvailable && entry.article ? (
                        <>
                          <Link
                            href={`/news/${entry.article.slug}`}
                            className="block text-sm sm:text-base font-bold text-slate-900 hover:text-blue-600 transition-colors line-clamp-1"
                          >
                            {entry.article.title}
                          </Link>
                          <p className="text-xs text-slate-500 line-clamp-1">
                            {entry.article.summary}
                          </p>
                        </>
                      ) : (
                        <p className="text-xs font-medium text-slate-400 italic">
                          Bài viết không còn khả dụng hoặc đã được quản trị viên ẩn.
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {entry.isAvailable && entry.article && (
                        <Link href={`/news/${entry.article.slug}`}>
                          <Button type="button" variant="outline" size="sm">
                            Đọc lại
                          </Button>
                        </Link>
                      )}
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveHistoryItem(entry.articleId)}
                        className="text-slate-400 hover:text-rose-600"
                        aria-label="Xóa khỏi lịch sử"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
