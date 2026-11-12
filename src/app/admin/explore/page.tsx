"use client";

import { Suspense, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Compass,
  Edit3,
  ExternalLink,
  Eye,
  EyeOff,
  FolderTree,
  Heart,
  Image as ImageIcon,
  Loader2,
  MessageSquare,
  Plus,
  Search,
  Sparkles,
  Trash2,
} from "lucide-react";
import { fetchWithAuth } from "@/components/providers/AuthProvider";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { isSafeMediaUrl } from "@/lib/orientation-utils";
import { formatDate } from "@/lib/utils";
import type { IOrientationArticleSummary } from "@/types";

interface CategoryFilterOption {
  _id: string;
  name: string;
  slug: string;
}

function AdminExploreArticlesContent() {
  const [articles, setArticles] = useState<IOrientationArticleSummary[]>([]);
  const [categories, setCategories] = useState<CategoryFilterOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const [statusFilter, setStatusFilter] = useState<
    "ALL" | "PUBLISHED" | "DRAFT" | "UNPUBLISHED"
  >("ALL");
  const [categoryId, setCategoryId] = useState("");
  const [featuredOnly, setFeaturedOnly] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [refreshTick, setRefreshTick] = useState(0);
  const [counts, setCounts] = useState({
    all: 0,
    published: 0,
    draft: 0,
    unpublished: 0,
  });

  const reloadArticles = () => setRefreshTick((t) => t + 1);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const params = new URLSearchParams();
        params.set("status", statusFilter);
        params.set("page", String(page));
        params.set("limit", "12");
        if (categoryId) params.set("categoryId", categoryId);
        if (featuredOnly) params.set("featured", "true");
        if (appliedSearch) params.set("q", appliedSearch);

        const res = await fetchWithAuth(
          `/api/admin/orientation/articles?${params.toString()}`,
          { cache: "no-store" }
        );
        const data = await res.json();
        if (cancelled) return;
        if (res.ok) {
          setArticles(Array.isArray(data.articles) ? data.articles : []);
          setTotalPages(data.pagination?.totalPages || 1);
          if (data.counts) setCounts(data.counts);
        } else {
          setFeedback({
            type: "error",
            text: data.error || "Không thể tải danh sách bài viết.",
          });
        }
      } catch {
        if (!cancelled) {
          setFeedback({
            type: "error",
            text: "Lỗi kết nối khi tải danh sách bài viết.",
          });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [statusFilter, categoryId, featuredOnly, appliedSearch, page, refreshTick]);

  useEffect(() => {
    let cancelled = false;
    async function loadCategories() {
      try {
        const res = await fetchWithAuth("/api/admin/orientation/categories", {
          cache: "no-store",
        });
        const data = await res.json();
        if (!cancelled && res.ok && Array.isArray(data.categories)) {
          setCategories(data.categories);
        }
      } catch {
        // Non-fatal
      }
    }
    loadCategories();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleQuickUpdate = async (
    article: IOrientationArticleSummary,
    patch: { status?: "PUBLISHED" | "UNPUBLISHED"; isFeatured?: boolean }
  ) => {
    setBusyId(article._id);
    setFeedback(null);
    try {
      const res = await fetchWithAuth(
        `/api/admin/orientation/articles/${article._id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(patch),
        }
      );
      const data = await res.json();
      if (!res.ok) {
        setFeedback({
          type: "error",
          text: data.error || "Cập nhật bài viết thất bại.",
        });
        return;
      }
      reloadArticles();
    } catch {
      setFeedback({
        type: "error",
        text: "Không thể kết nối máy chủ khi cập nhật.",
      });
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (article: IOrientationArticleSummary) => {
    const confirmed = window.confirm(
      `Xác nhận xóa bài viết "${article.title}"?\nHệ thống sẽ xóa bình luận/lượt thích và tự động dọn Cloudinary media không còn dùng.`
    );
    if (!confirmed) return;

    setBusyId(article._id);
    setFeedback(null);
    try {
      const res = await fetchWithAuth(
        `/api/admin/orientation/articles/${article._id}`,
        { method: "DELETE" }
      );
      const data = await res.json();
      if (!res.ok) {
        setFeedback({
          type: "error",
          text: data.error || "Không thể xóa bài viết.",
        });
        return;
      }

      const deletedMediaCount = data.mediaCleanup?.deletedCloudinaryCount || 0;
      setFeedback({
        type: "success",
        text:
          deletedMediaCount > 0
            ? `Đã xóa bài viết và thu hồi ${deletedMediaCount} media không còn sử dụng trên Cloudinary.`
            : "Đã xóa bài viết thành công.",
      });
      reloadArticles();
    } catch {
      setFeedback({
        type: "error",
        text: "Lỗi kết nối khi xóa bài viết.",
      });
    } finally {
      setBusyId(null);
    }
  };

  const handleSeedSamples = async () => {
    setSeeding(true);
    setFeedback(null);
    try {
      const res = await fetchWithAuth("/api/admin/orientation/seed", {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) {
        setFeedback({
          type: "error",
          text: data.error || "Không thể khởi tạo dữ liệu mẫu.",
        });
        return;
      }
      setFeedback({
        type: "success",
        text: data.message || "Đã kiểm tra & khởi tạo bài viết mẫu Tiptap!",
      });
      reloadArticles();
    } catch {
      setFeedback({
        type: "error",
        text: "Lỗi kết nối khi khởi tạo dữ liệu mẫu.",
      });
    } finally {
      setSeeding(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-blue-600">
            <Compass className="h-4 w-4" />
            Module 00 & 03 · CMS Khám phá định hướng
          </div>
          <h1 className="mt-1 text-2xl font-bold text-slate-900">
            Quản lý Bài viết Định hướng (Tiptap CMS)
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Soạn thảo nội dung Block JSON với Tiptap v3, đồng bộ media Cloudinary và xuất bản tới sinh viên.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/admin/explore/taxonomy"
            className={buttonVariants({ variant: "outline" })}
          >
            <FolderTree className="mr-1.5 h-4 w-4" />
            Danh mục & Chủ đề
          </Link>
          <Link
            href="/admin/media"
            className={buttonVariants({ variant: "outline" })}
          >
            <ImageIcon className="mr-1.5 h-4 w-4" />
            Thư viện Media
          </Link>
          <Link
            href="/admin/explore/new"
            className={buttonVariants({
              className: "bg-blue-600 hover:bg-blue-700 text-white",
            })}
          >
            <Plus className="mr-1.5 h-4 w-4" />
            Viết bài mới
          </Link>
        </div>
      </div>

      {feedback && (
        <div
          className={`rounded-xl border px-4 py-3 text-sm ${
            feedback.type === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
              : "border-rose-200 bg-rose-50 text-rose-700"
          }`}
        >
          {feedback.text}
        </div>
      )}

      {/* Status tabs & Filters */}
      <Card className="border-slate-200 shadow-2xs">
        <CardContent className="space-y-4 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-1.5">
              {(
                [
                  { key: "ALL", label: "Tất cả", count: counts.all },
                  {
                    key: "PUBLISHED",
                    label: "Đã xuất bản",
                    count: counts.published,
                  },
                  { key: "DRAFT", label: "Bản nháp", count: counts.draft },
                  {
                    key: "UNPUBLISHED",
                    label: "Tạm ẩn",
                    count: counts.unpublished,
                  },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => {
                    setStatusFilter(tab.key);
                    setPage(1);
                  }}
                  className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                    statusFilter === tab.key
                      ? "bg-slate-900 text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {tab.label}
                  <span
                    className={`rounded-full px-1.5 py-0.5 text-[10px] ${
                      statusFilter === tab.key
                        ? "bg-white/20 text-white"
                        : "bg-white text-slate-700"
                    }`}
                  >
                    {tab.count}
                  </span>
                </button>
              ))}
            </div>

            {counts.all === 0 && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={seeding}
                onClick={handleSeedSamples}
              >
                {seeding && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
                Khởi tạo dữ liệu mẫu Tiptap
              </Button>
            )}
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-12">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                setAppliedSearch(searchInput.trim());
                setPage(1);
              }}
              className="flex gap-2 md:col-span-6"
            >
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="Tìm theo tiêu đề, tóm tắt, nội dung bài viết, thẻ..."
                  className="pl-9"
                />
              </div>
              <Button type="submit" variant="secondary">
                Tìm kiếm
              </Button>
            </form>

            <div className="md:col-span-3">
              <select
                value={categoryId}
                onChange={(e) => {
                  setCategoryId(e.target.value);
                  setPage(1);
                }}
                className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-blue-500"
              >
                <option value="">Tất cả danh mục</option>
                {categories.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 px-3 text-sm text-slate-700 md:col-span-3">
              <input
                type="checkbox"
                checked={featuredOnly}
                onChange={(e) => {
                  setFeaturedOnly(e.target.checked);
                  setPage(1);
                }}
                className="h-4 w-4 rounded border-slate-300 text-blue-600"
              />
              <span>Chỉ xem bài nổi bật</span>
            </label>
          </div>
        </CardContent>
      </Card>

      {/* Articles List */}
      {loading ? (
        <div className="flex h-48 items-center justify-center rounded-2xl border border-slate-200 bg-white">
          <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
        </div>
      ) : articles.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
          <Compass className="h-10 w-10 text-slate-300" />
          <h3 className="mt-3 text-base font-semibold text-slate-800">
            Chưa có bài viết định hướng nào khớp bộ lọc
          </h3>
          <p className="mt-1 text-sm text-slate-500">
            Tạo bài viết mới bằng Tiptap Block Editor hoặc thay đổi từ khóa tìm kiếm.
          </p>
          <Link
            href="/admin/explore/new"
            className={buttonVariants({
              className: "mt-4 bg-blue-600 text-white hover:bg-blue-700",
            })}
          >
            <Plus className="mr-1.5 h-4 w-4" />
            Viết bài mới ngay
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {articles.map((article) => {
            const hasCover =
              Boolean(article.coverImage) && isSafeMediaUrl(article.coverImage);
            const isBusy = busyId === article._id;

            return (
              <Card
                key={article._id}
                className="border-slate-200 shadow-2xs transition-colors hover:border-blue-200"
              >
                <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex min-w-0 items-start gap-4">
                    <div className="relative h-20 w-32 shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
                      {hasCover && article.coverImage ? (
                        <Image
                          src={article.coverImage}
                          alt={article.title}
                          fill
                          unoptimized
                          className="object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-slate-400">
                          <Compass className="h-6 w-6" />
                        </div>
                      )}
                    </div>

                    <div className="min-w-0 space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge
                          variant={
                            article.status === "PUBLISHED"
                              ? "default"
                              : "secondary"
                          }
                          className={
                            article.status === "PUBLISHED"
                              ? "bg-emerald-600 text-white"
                              : article.status === "DRAFT"
                              ? "bg-amber-100 text-amber-800"
                              : "bg-slate-200 text-slate-700"
                          }
                        >
                          {article.status}
                        </Badge>

                        {article.category && (
                          <span className="rounded-md bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
                            {article.category.name}
                          </span>
                        )}

                        {article.isFeatured && (
                          <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">
                            <Sparkles className="h-3 w-3" />
                            Nổi bật
                          </span>
                        )}
                      </div>

                      <Link
                        href={`/admin/explore/${article._id}/edit`}
                        className="block truncate text-base font-semibold text-slate-900 hover:text-blue-600"
                      >
                        {article.title}
                      </Link>

                      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                        <span>/explore/{article.slug}</span>
                        <span>· {article.authorName}</span>
                        <span>· {article.readTimeMinutes} phút đọc</span>
                        <span className="inline-flex items-center gap-1">
                          <Eye className="h-3.5 w-3.5" />
                          {article.viewCount}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <Heart className="h-3.5 w-3.5" />
                          {article.likeCount}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <MessageSquare className="h-3.5 w-3.5" />
                          {article.commentCount}
                        </span>
                        {article.publishedAt && (
                          <span>
                            · Xuất bản {formatDate(article.publishedAt)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Quick Actions */}
                  <div className="flex shrink-0 flex-wrap items-center gap-1.5">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={isBusy}
                      onClick={() =>
                        handleQuickUpdate(article, {
                          isFeatured: !article.isFeatured,
                        })
                      }
                      title={
                        article.isFeatured ? "Bỏ nổi bật" : "Đặt làm nổi bật"
                      }
                    >
                      <Sparkles
                        className={`h-4 w-4 ${
                          article.isFeatured
                            ? "fill-amber-400 text-amber-500"
                            : "text-slate-400"
                        }`}
                      />
                    </Button>

                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={isBusy}
                      onClick={() =>
                        handleQuickUpdate(article, {
                          status:
                            article.status === "PUBLISHED"
                              ? "UNPUBLISHED"
                              : "PUBLISHED",
                        })
                      }
                      title={
                        article.status === "PUBLISHED"
                          ? "Ẩn bài viết"
                          : "Xuất bản ngay"
                      }
                    >
                      {article.status === "PUBLISHED" ? (
                        <EyeOff className="h-4 w-4 text-slate-600" />
                      ) : (
                        <Eye className="h-4 w-4 text-emerald-600" />
                      )}
                    </Button>

                    {article.status === "PUBLISHED" && (
                      <Link
                        href={`/explore/${article.slug}`}
                        target="_blank"
                        title="Xem công khai"
                        className={buttonVariants({
                          variant: "outline",
                          size: "sm",
                        })}
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Link>
                    )}

                    <Link
                      href={`/admin/explore/${article._id}/edit`}
                      className={buttonVariants({
                        variant: "outline",
                        size: "sm",
                      })}
                    >
                      <Edit3 className="mr-1 h-4 w-4" />
                      Sửa
                    </Link>

                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={isBusy}
                      onClick={() => handleDelete(article)}
                      className="text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                      title="Xóa bài viết & thu hồi media"
                    >
                      {isBusy ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
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
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          >
            Trang sau
          </Button>
        </div>
      )}
    </div>
  );
}

export default function AdminExploreArticlesPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
        </div>
      }
    >
      <AdminExploreArticlesContent />
    </Suspense>
  );
}
