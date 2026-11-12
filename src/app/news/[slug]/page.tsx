"use client";

import { Suspense, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Bookmark,
  Calendar,
  CheckCircle2,
  Clock,
  ExternalLink,
  Eye,
  Info,
  Loader2,
  Share2,
  Sparkles,
  User,
} from "lucide-react";
import { TiptapContentRenderer } from "@/components/content/TiptapContentRenderer";
import { NewsCard } from "@/components/news/NewsCard";
import { fetchWithAuth, useAuth } from "@/components/providers/AuthProvider";
import { Button } from "@/components/ui/button";
import { formatVietnamDate, getNewsColorClasses } from "@/lib/news-utils";
import { isSafeMediaUrl } from "@/lib/orientation-utils";
import type { INewsArticleDetail, INewsArticleSummary } from "@/types";

function NewsDetailContent() {
  const params = useParams<{ slug: string }>();
  const slug = params?.slug || "";
  const router = useRouter();
  const { user } = useAuth();

  const [article, setArticle] = useState<INewsArticleDetail | null>(null);
  const [relatedArticles, setRelatedArticles] = useState<INewsArticleSummary[]>([]);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [bookmarkBusy, setBookmarkBusy] = useState(false);
  const [toastText, setToastText] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastText(msg);
    setTimeout(() => {
      setToastText((curr) => (curr === msg ? null : curr));
    }, 3200);
  };

  useEffect(() => {
    if (!slug) return;
    let active = true;

    const loadDetail = async () => {
      try {
        const res = await fetchWithAuth(`/api/news/${encodeURIComponent(slug)}`, {
          cache: "no-store",
        });
        const data = await res.json();
        if (!active) return;

        if (!res.ok || !data.article) {
          setErrorMsg(data.error || "Không tìm thấy bài viết tin tức");
        } else {
          setArticle(data.article);
          setRelatedArticles(data.relatedArticles || []);
          setIsBookmarked(Boolean(data.isBookmarked));
        }
      } catch {
        if (active) setErrorMsg("Lỗi kết nối khi tải bài viết");
      } finally {
        if (active) setLoading(false);
      }
    };

    void loadDetail();
    return () => {
      active = false;
    };
  }, [slug]);

  const handleToggleBookmark = async (targetSlug?: string, targetId?: string) => {
    if (!user) {
      router.push(`/login?next=${encodeURIComponent(`/news/${slug}`)}`);
      return;
    }

    const useSlug = targetSlug || article?.slug || slug;
    if (!useSlug) return;

    const isMain = !targetId || targetId === article?._id;
    if (isMain) setBookmarkBusy(true);

    try {
      const res = await fetchWithAuth(
        `/api/news/${encodeURIComponent(useSlug)}/bookmark`,
        { method: "POST" }
      );
      if (res.status === 401) {
        router.push(`/login?next=${encodeURIComponent(`/news/${slug}`)}`);
        return;
      }
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || "Không thể lưu bài viết");
        return;
      }

      if (isMain) {
        setIsBookmarked(Boolean(data.bookmarked));
        setArticle((prev) =>
          prev ? { ...prev, bookmarkCount: data.bookmarkCount } : prev
        );
      } else {
        setRelatedArticles((prev) =>
          prev.map((rel) =>
            rel._id === targetId
              ? {
                  ...rel,
                  isBookmarkedByMe: Boolean(data.bookmarked),
                  bookmarkCount: data.bookmarkCount,
                }
              : rel
          )
        );
      }

      showToast(
        data.bookmarked
          ? "Đã lưu bài viết vào mục yêu thích"
          : "Đã bỏ lưu bài viết"
      );
    } finally {
      if (isMain) setBookmarkBusy(false);
    }
  };

  const handleShare = async (targetSlug?: string, targetTitle?: string) => {
    const useSlug = targetSlug || article?.slug || slug;
    const useTitle = targetTitle || article?.title || "Tin tức UNERA";
    const shareUrl = `${window.location.origin}/news/${useSlug}`;

    try {
      if (navigator.share) {
        await navigator.share({ title: useTitle, url: shareUrl });
      } else if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareUrl);
      }
    } catch {
      try {
        await navigator.clipboard?.writeText(shareUrl);
      } catch {
        // Ignore
      }
    }

    showToast("Đã sao chép liên kết bài viết!");

    try {
      const res = await fetch(`/api/news/${encodeURIComponent(useSlug)}/share`, {
        method: "POST",
      });
      const data = await res.json();
      if (res.ok && typeof data.shareCount === "number") {
        if (!targetSlug || targetSlug === article?.slug) {
          setArticle((prev) =>
            prev ? { ...prev, shareCount: data.shareCount } : prev
          );
        } else {
          setRelatedArticles((prev) =>
            prev.map((rel) =>
              rel.slug === targetSlug
                ? { ...rel, shareCount: data.shareCount }
                : rel
            )
          );
        }
      }
    } catch {
      // Non-fatal
    }
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-7 w-7 animate-spin text-blue-600" />
      </div>
    );
  }

  if (errorMsg || !article) {
    return (
      <div className="w-full px-3 sm:px-4 lg:px-5 py-16 text-center space-y-4">
        <h1 className="text-xl font-bold text-slate-900">
          {errorMsg || "Không tìm thấy bài viết"}
        </h1>
        <Link href="/news">
          <Button variant="outline">Quay lại trang Tin tức</Button>
        </Link>
      </div>
    );
  }

  const colorClasses = getNewsColorClasses(article.category?.colorToken);
  const hasValidCover =
    Boolean(article.coverImage) && isSafeMediaUrl(article.coverImage);

  return (
    <div className="w-full px-3 sm:px-4 lg:px-5 py-4 sm:py-5 space-y-6">
      {toastText && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-semibold text-white shadow-lg">
          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          <span>{toastText}</span>
        </div>
      )}

      {/* Breadcrumb */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/news"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-blue-600 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Quay lại danh sách Tin tức</span>
        </Link>

        {article.category && (
          <Link
            href={`/news?category=${article.category.slug}`}
            className={`rounded-full border px-3 py-1 text-xs font-semibold ${colorClasses.pillClass}`}
          >
            {article.category.name}
          </Link>
        )}
      </div>

      {/* Article Header */}
      <article className="rounded-3xl border border-slate-200/80 bg-white overflow-hidden shadow-xs">
        {hasValidCover && article.coverImage && (
          <div className="relative aspect-[21/9] max-h-[440px] w-full bg-slate-100">
            <Image
              src={article.coverImage}
              alt={article.title}
              fill
              unoptimized
              className="object-cover"
            />
          </div>
        )}

        <div className="p-4 sm:p-6 lg:p-7 space-y-5">
          {/* Badges & Sponsored notice */}
          <div className="flex flex-wrap items-center gap-2">
            {article.isFeatured && (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-800">
                <Sparkles className="h-3.5 w-3.5" />
                Nổi bật
              </span>
            )}
            {article.isSponsored && (
              <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 border border-indigo-200 px-3 py-1 text-xs font-semibold text-indigo-700">
                <Info className="h-3.5 w-3.5" />
                Nội dung tài trợ / Đối tác
              </span>
            )}
            {article.tags.map((tag) => (
              <Link
                key={tag}
                href={`/news?tag=${encodeURIComponent(tag)}`}
                className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600 hover:bg-slate-200 transition-colors"
              >
                #{tag}
              </Link>
            ))}
          </div>

          {article.isSponsored && article.sponsorInfo && (
            <div className="rounded-xl border border-indigo-200 bg-indigo-50/70 px-4 py-3 text-xs text-indigo-900">
              <strong className="font-semibold">Thông tin minh bạch:</strong>{" "}
              {article.sponsorInfo}
            </div>
          )}

          <div className="space-y-3">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 leading-tight tracking-tight">
              {article.title}
            </h1>
            <p className="text-sm sm:text-base text-slate-600 leading-relaxed font-medium">
              {article.summary}
            </p>
          </div>

          {/* Meta & Actions */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-y border-slate-100 py-4">
            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
              <span className="inline-flex items-center gap-1.5 font-semibold text-slate-800">
                <User className="h-4 w-4 text-slate-400" />
                {article.authorName}
              </span>
              {article.publishedAt && (
                <span className="inline-flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-slate-400" />
                  {formatVietnamDate(article.publishedAt)}
                </span>
              )}
              <span className="inline-flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-slate-400" />
                {article.readTimeMinutes} phút đọc
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Eye className="h-3.5 w-3.5 text-slate-400" />
                {article.viewCount} lượt xem
              </span>
            </div>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                size="sm"
                variant={isBookmarked ? "default" : "outline"}
                disabled={bookmarkBusy}
                onClick={() => handleToggleBookmark()}
                className="gap-1.5"
              >
                <Bookmark
                  className={`h-4 w-4 ${isBookmarked ? "fill-white" : ""}`}
                />
                <span>
                  {isBookmarked ? "Đã lưu" : "Lưu bài"} ({article.bookmarkCount})
                </span>
              </Button>

              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => handleShare()}
                className="gap-1.5"
              >
                <Share2 className="h-4 w-4" />
                <span>Chia sẻ ({article.shareCount})</span>
              </Button>
            </div>
          </div>

          {/* Rich Tiptap Content (Module 00) */}
          <div className="prose-container">
            <TiptapContentRenderer contentJson={article.contentJson} />
          </div>

          {/* Source attribution */}
          {(article.sourceName || article.sourceUrl) && (
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-600 flex flex-wrap items-center justify-between gap-2">
              <span>
                <strong>Nguồn tham khảo:</strong>{" "}
                {article.sourceName || article.sourceUrl}
              </span>
              {article.sourceUrl && (
                <a
                  href={article.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 font-semibold text-blue-600 hover:underline"
                >
                  <span>Xem nguồn gốc</span>
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              )}
            </div>
          )}
        </div>
      </article>

      {/* Related Articles (NEWS09) */}
      {relatedArticles.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-lg font-bold text-slate-900">
            Bài Viết Liên Quan
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {relatedArticles.slice(0, 4).map((rel) => (
              <NewsCard
                key={rel._id}
                article={rel}
                onToggleBookmark={(relSlug, relId) =>
                  handleToggleBookmark(relSlug, relId)
                }
                onShare={(relSlug, relTitle) => handleShare(relSlug, relTitle)}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

export default function NewsDetailPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-96 items-center justify-center">
          <Loader2 className="h-7 w-7 animate-spin text-blue-600" />
        </div>
      }
    >
      <NewsDetailContent />
    </Suspense>
  );
}
