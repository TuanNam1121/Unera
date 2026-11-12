"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  BarChart3,
  Bookmark,
  CalendarClock,
  CheckCircle2,
  Edit,
  Eye,
  FolderKanban,
  Loader2,
  Newspaper,
  Plus,
  Search,
  Share2,
  Sparkles,
  Tag,
  Trash2,
} from "lucide-react";
import { fetchWithAuth } from "@/components/providers/AuthProvider";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { NEWS_ARTICLE_STATUS } from "@/constants";
import {
  formatVietnamDateTime,
  NEWS_STATUS_META,
} from "@/lib/news-utils";
import type { INewsArticleSummary, INewsCategoryDTO } from "@/types";

interface NewsCounts {
  all: number;
  published: number;
  scheduled: number;
  draft: number;
}

function AdminNewsListContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const queryStatus = searchParams.get("status") || "";
  const queryCategory = searchParams.get("category") || "";
  const queryFeatured = searchParams.get("isFeatured") || "";
  const querySearch = searchParams.get("search") || "";
  const queryPage = Math.max(1, parseInt(searchParams.get("page") || "1", 10) || 1);

  const [searchInput, setSearchInput] = useState(querySearch);
  const [prevQuerySearch, setPrevQuerySearch] = useState(querySearch);
  if (querySearch !== prevQuerySearch) {
    setPrevQuerySearch(querySearch);
    setSearchInput(querySearch);
  }

  const [articles, setArticles] = useState<INewsArticleSummary[]>([]);
  const [categories, setCategories] = useState<INewsCategoryDTO[]>([]);
  const [counts, setCounts] = useState<NewsCounts>({
    all: 0,
    published: 0,
    scheduled: 0,
    draft: 0,
  });
  const [totalPages, setTotalPages] = useState(0);
  const [loadedKey, setLoadedKey] = useState("");
  const [refreshTick, setRefreshTick] = useState(0);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [seeding, setSeeding] = useState(false);
  const [promoting, setPromoting] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const currentKey = `${queryStatus}|${queryCategory}|${queryFeatured}|${querySearch}|${queryPage}|${refreshTick}`;
  const loading = loadedKey !== currentKey;

  const updateParams = useCallback(
    (updates: Record<string, string | null>) => {
      const next = new URLSearchParams(searchParams.toString());
      for (const [k, v] of Object.entries(updates)) {
        if (v === null || v === "") next.delete(k);
        else next.set(k, v);
      }
      if (!("page" in updates)) next.delete("page");
      const qs = next.toString();
      router.push(qs ? `/admin/news?${qs}` : "/admin/news");
    },
    [router, searchParams]
  );

  useEffect(() => {
    const trimmed = searchInput.trim();
    if (trimmed === querySearch) return;
    const t = setTimeout(() => {
      updateParams({ search: trimmed || null });
    }, 300);
    return () => clearTimeout(t);
  }, [searchInput, querySearch, updateParams]);

  useEffect(() => {
    let active = true;
    const loadArticles = async () => {
      const params = new URLSearchParams();
      if (queryStatus) params.set("status", queryStatus);
      if (queryCategory) params.set("category", queryCategory);
      if (queryFeatured) params.set("isFeatured", queryFeatured);
      if (querySearch) params.set("search", querySearch);
      params.set("page", String(queryPage));
      params.set("limit", "12");

      try {
        const res = await fetchWithAuth(`/api/admin/news?${params.toString()}`, {
          cache: "no-store",
        });
        const data = await res.json();
        if (active && res.ok) {
          setArticles(data.articles || []);
          setCategories(data.categories || []);
          if (data.counts) setCounts(data.counts);
          setTotalPages(data.pagination?.totalPages || 0);
        }
      } finally {
        if (active) setLoadedKey(currentKey);
      }
    };

    void loadArticles();
    return () => {
      active = false;
    };
  }, [
    currentKey,
    queryStatus,
    queryCategory,
    queryFeatured,
    querySearch,
    queryPage,
  ]);

  const handleToggleFeatured = async (item: INewsArticleSummary) => {
    setBusyId(item._id);
    setFeedback(null);
    try {
      const res = await fetchWithAuth(`/api/admin/news/${item._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          version: item.version,
          isFeatured: !item.isFeatured,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setFeedback(
          !item.isFeatured
            ? `Đã gắn Nổi bật cho "${item.title}"`
            : `Đã bỏ Nổi bật cho "${item.title}"`
        );
        setRefreshTick((n) => n + 1);
      } else {
        setFeedback(data.error || "Không thể cập nhật trạng thái nổi bật");
      }
    } finally {
      setBusyId(null);
    }
  };

  const handleQuickStatus = async (
    item: INewsArticleSummary,
    nextStatus: "PUBLISHED" | "UNPUBLISHED"
  ) => {
    setBusyId(item._id);
    setFeedback(null);
    try {
      const res = await fetchWithAuth(`/api/admin/news/${item._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          version: item.version,
          status: nextStatus,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setFeedback(data.message || "Đã cập nhật trạng thái xuất bản");
        setRefreshTick((n) => n + 1);
      } else {
        setFeedback(data.error || "Không thể đổi trạng thái");
      }
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (item: INewsArticleSummary) => {
    if (!window.confirm(`Xác nhận xóa vĩnh viễn bài viết "${item.title}"?`)) {
      return;
    }
    setBusyId(item._id);
    setFeedback(null);
    try {
      const res = await fetchWithAuth(`/api/admin/news/${item._id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (res.ok) {
        setFeedback(data.message || "Đã xóa bài viết tin tức");
        setRefreshTick((n) => n + 1);
      } else {
        setFeedback(data.error || "Không thể xóa bài viết");
      }
    } finally {
      setBusyId(null);
    }
  };

  const handleSeed = async () => {
    setSeeding(true);
    setFeedback(null);
    try {
      const res = await fetchWithAuth("/api/admin/news/seed", { method: "POST" });
      const data = await res.json();
      setFeedback(data.message || "Đã khởi tạo dữ liệu tin tức");
      setRefreshTick((n) => n + 1);
    } finally {
      setSeeding(false);
    }
  };

  const handlePromoteScheduled = async () => {
    setPromoting(true);
    setFeedback(null);
    try {
      const res = await fetchWithAuth("/api/admin/news/publish-scheduled", {
        method: "POST",
      });
      const data = await res.json();
      setFeedback(data.message || "Đã kiểm tra bài viết hẹn giờ");
      setRefreshTick((n) => n + 1);
    } finally {
      setPromoting(false);
    }
  };

  return (
    <div className="w-full max-w-7xl px-6 sm:px-8 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
            Quản Lý Tin Tức &amp; Biên Tập (CMS)
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Tạo bản tin Tiptap, lên lịch hẹn xuất bản, quản lý danh mục, tag và theo dõi hiệu suất đọc.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link href="/admin/news/categories">
            <Button type="button" variant="outline" size="sm" className="gap-1.5">
              <FolderKanban className="h-3.5 w-3.5" />
              <span>Danh mục</span>
            </Button>
          </Link>
          <Link href="/admin/news/tags">
            <Button type="button" variant="outline" size="sm" className="gap-1.5">
              <Tag className="h-3.5 w-3.5" />
              <span>Tags</span>
            </Button>
          </Link>
          <Link href="/admin/news/analytics">
            <Button type="button" variant="outline" size="sm" className="gap-1.5">
              <BarChart3 className="h-3.5 w-3.5" />
              <span>Thống kê</span>
            </Button>
          </Link>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={promoting}
            onClick={handlePromoteScheduled}
            className="gap-1.5"
          >
            <CalendarClock className="h-3.5 w-3.5" />
            <span>Quét bài hẹn giờ</span>
          </Button>
          {counts.all === 0 && !loading && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={seeding}
              onClick={handleSeed}
            >
              {seeding ? "Đang tạo..." : "Khởi tạo tin mẫu"}
            </Button>
          )}
          <Link href="/admin/news/new">
            <Button type="button" size="sm" className="gap-1.5">
              <Plus className="h-4 w-4" />
              <span>Viết bài mới</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="rounded-2xl border-slate-200/80 shadow-2xs bg-white">
          <CardContent className="p-4">
            <p className="text-[11px] font-semibold uppercase text-slate-400">
              Tổng bài viết
            </p>
            <p className="text-2xl font-bold text-slate-900 mt-1">{counts.all}</p>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-slate-200/80 shadow-2xs bg-white">
          <CardContent className="p-4">
            <p className="text-[11px] font-semibold uppercase text-emerald-600">
              Đã xuất bản
            </p>
            <p className="text-2xl font-bold text-emerald-700 mt-1">
              {counts.published}
            </p>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-slate-200/80 shadow-2xs bg-white">
          <CardContent className="p-4">
            <p className="text-[11px] font-semibold uppercase text-sky-600">
              Đang hẹn giờ
            </p>
            <p className="text-2xl font-bold text-sky-700 mt-1">
              {counts.scheduled}
            </p>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-slate-200/80 shadow-2xs bg-white">
          <CardContent className="p-4">
            <p className="text-[11px] font-semibold uppercase text-amber-600">
              Bản nháp
            </p>
            <p className="text-2xl font-bold text-amber-700 mt-1">
              {counts.draft}
            </p>
          </CardContent>
        </Card>
      </div>

      {feedback && (
        <div className="flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-2.5 text-xs font-medium text-blue-800">
          <CheckCircle2 className="h-4 w-4 text-blue-600 shrink-0" />
          <span>{feedback}</span>
        </div>
      )}

      {/* Filter Bar */}
      <Card className="rounded-2xl border-slate-200/80 shadow-2xs bg-white">
        <CardContent className="p-4 flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Tìm tiêu đề, tác giả, tag, nội dung..."
              className="pl-9 h-9 text-xs"
            />
          </div>

          <select
            value={queryStatus}
            onChange={(e) => updateParams({ status: e.target.value || null })}
            className="h-9 rounded-xl border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700"
          >
            <option value="">Tất cả trạng thái</option>
            <option value={NEWS_ARTICLE_STATUS.PUBLISHED}>Đã xuất bản</option>
            <option value={NEWS_ARTICLE_STATUS.SCHEDULED}>Đang hẹn giờ</option>
            <option value={NEWS_ARTICLE_STATUS.DRAFT}>Bản nháp</option>
            <option value={NEWS_ARTICLE_STATUS.UNPUBLISHED}>Đã ẩn</option>
          </select>

          <select
            value={queryCategory}
            onChange={(e) => updateParams({ category: e.target.value || null })}
            className="h-9 rounded-xl border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700"
          >
            <option value="">Tất cả danh mục</option>
            {categories.map((cat) => (
              <option key={cat._id} value={cat._id}>
                {cat.name}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={() =>
              updateParams({ isFeatured: queryFeatured === "true" ? null : "true" })
            }
            className={`inline-flex items-center gap-1.5 rounded-xl border px-3 h-9 text-xs font-semibold cursor-pointer ${
              queryFeatured === "true"
                ? "border-amber-300 bg-amber-50 text-amber-800"
                : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
            }`}
          >
            <Sparkles className="h-3.5 w-3.5 text-amber-500" />
            <span>Đang nổi bật</span>
          </button>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="rounded-2xl border-slate-200/80 shadow-2xs bg-white overflow-hidden">
        {loading ? (
          <div className="flex h-60 items-center justify-center">
            <Loader2 className="h-7 w-7 animate-spin text-blue-600" />
          </div>
        ) : articles.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <Newspaper className="h-10 w-10 text-slate-300 mx-auto" />
            <p className="text-sm font-semibold text-slate-700">
              Chưa có bài viết tin tức nào khớp bộ lọc.
            </p>
            <Link href="/admin/news/new">
              <Button size="sm">+ Tạo bài viết đầu tiên</Button>
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/90 text-[11px] font-semibold uppercase text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">Bài viết</th>
                  <th className="px-4 py-3">Danh mục</th>
                  <th className="px-4 py-3">Trạng thái</th>
                  <th className="px-4 py-3">Tương tác</th>
                  <th className="px-4 py-3 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {articles.map((item) => {
                  const statusMeta =
                    NEWS_STATUS_META[item.status] || NEWS_STATUS_META.DRAFT;
                  const isBusy = busyId === item._id;

                  return (
                    <tr
                      key={item._id}
                      className="hover:bg-slate-50/60 transition-colors"
                    >
                      <td className="px-4 py-3.5 max-w-sm">
                        <div className="space-y-1">
                          <Link
                            href={`/admin/news/${item._id}/edit`}
                            className="font-bold text-slate-900 hover:text-blue-600 line-clamp-1"
                          >
                            {item.title}
                          </Link>
                          <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-slate-400">
                            <span>{item.authorName}</span>
                            {item.tags.slice(0, 3).map((t) => (
                              <span
                                key={t}
                                className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-600"
                              >
                                #{t}
                              </span>
                            ))}
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <span className="rounded-md bg-slate-100 px-2 py-1 text-[11px] font-semibold text-slate-700">
                          {item.category?.name || item.categorySlug}
                        </span>
                      </td>

                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <div className="space-y-1">
                          <span
                            className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${statusMeta.badgeClass}`}
                          >
                            <span
                              className={`h-1.5 w-1.5 rounded-full ${statusMeta.dotClass}`}
                            />
                            {statusMeta.label}
                          </span>
                          {item.status === "SCHEDULED" && item.scheduledAt && (
                            <p className="text-[10px] text-sky-700 font-medium">
                              Đăng lúc: {formatVietnamDateTime(item.scheduledAt)}
                            </p>
                          )}
                        </div>
                      </td>

                      <td className="px-4 py-3.5 whitespace-nowrap text-slate-500">
                        <div className="flex items-center gap-3">
                          <span className="inline-flex items-center gap-1" title="Lượt xem">
                            <Eye className="h-3.5 w-3.5" /> {item.viewCount}
                          </span>
                          <span className="inline-flex items-center gap-1" title="Lượt lưu">
                            <Bookmark className="h-3.5 w-3.5" />{" "}
                            {item.bookmarkCount}
                          </span>
                          <span className="inline-flex items-center gap-1" title="Chia sẻ">
                            <Share2 className="h-3.5 w-3.5" /> {item.shareCount}
                          </span>
                        </div>
                      </td>

                      <td className="px-4 py-3.5 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            disabled={isBusy}
                            onClick={() => handleToggleFeatured(item)}
                            title={
                              item.isFeatured ? "Bỏ nổi bật" : "Đặt làm Nổi bật"
                            }
                            className={`rounded-lg border px-2 py-1.5 text-[11px] font-semibold cursor-pointer ${
                              item.isFeatured
                                ? "border-amber-300 bg-amber-50 text-amber-700"
                                : "border-slate-200 text-slate-500 hover:bg-slate-100"
                            }`}
                          >
                            <Sparkles className="h-3.5 w-3.5" />
                          </button>

                          {item.status === NEWS_ARTICLE_STATUS.PUBLISHED ? (
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              disabled={isBusy}
                              onClick={() =>
                                handleQuickStatus(
                                  item,
                                  NEWS_ARTICLE_STATUS.UNPUBLISHED
                                )
                              }
                              className="h-8 text-[11px]"
                            >
                              Ẩn bài
                            </Button>
                          ) : (
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              disabled={isBusy}
                              onClick={() =>
                                handleQuickStatus(
                                  item,
                                  NEWS_ARTICLE_STATUS.PUBLISHED
                                )
                              }
                              className="h-8 text-[11px] text-emerald-700 border-emerald-200 hover:bg-emerald-50"
                            >
                              Xuất bản
                            </Button>
                          )}

                          <Link href={`/admin/news/${item._id}/edit`}>
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              className="h-8 px-2.5"
                            >
                              <Edit className="h-3.5 w-3.5" />
                            </Button>
                          </Link>

                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            disabled={isBusy}
                            onClick={() => handleDelete(item)}
                            className="h-8 px-2.5 text-rose-600 border-rose-200 hover:bg-rose-50"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
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
            Trang {queryPage} / {totalPages}
          </span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={queryPage >= totalPages}
            onClick={() => updateParams({ page: String(queryPage + 1) })}
          >
            Trang sau
          </Button>
        </div>
      )}
    </div>
  );
}

export default function AdminNewsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-96 items-center justify-center">
          <Loader2 className="h-7 w-7 animate-spin text-blue-600" />
        </div>
      }
    >
      <AdminNewsListContent />
    </Suspense>
  );
}

