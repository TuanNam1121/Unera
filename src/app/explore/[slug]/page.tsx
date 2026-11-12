"use client";

import { Suspense, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  AlertCircle,
  ArrowLeft,
  Calendar,
  Check,
  Clock,
  Compass,
  Eye,
  Heart,
  Loader2,
  Share2,
  Sparkles,
  Tag,
} from "lucide-react";
import { TiptapContentRenderer } from "@/components/content/TiptapContentRenderer";
import { ArticleCard } from "@/components/orientation/ArticleCard";
import { ArticleComments } from "@/components/orientation/ArticleComments";
import { fetchWithAuth } from "@/components/providers/AuthProvider";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  getCategoryBannerGradient,
  isSafeMediaUrl,
} from "@/lib/orientation-utils";
import { formatDate } from "@/lib/utils";
import type {
  IOrientationArticleDetail,
  IOrientationArticleSummary,
} from "@/types";

function ExploreArticleDetailContent() {
  const router = useRouter();
  const params = useParams<{ slug: string }>();
  const slug = params?.slug || "";

  const [article, setArticle] = useState<IOrientationArticleDetail | null>(
    null
  );
  const [related, setRelated] = useState<IOrientationArticleSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [liking, setLiking] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!slug) return;
    let cancelled = false;

    async function loadArticle() {
      try {
        const res = await fetch(`/api/orientation/articles/${slug}`, {
          credentials: "include",
          cache: "no-store",
        });
        const data = await res.json();
        if (!cancelled) {
          if (res.ok && data.article) {
            setArticle(data.article);
            setRelated(
              Array.isArray(data.relatedArticles) ? data.relatedArticles : []
            );
          } else {
            setErrorMsg(
              data.error || "Không tìm thấy bài viết định hướng hoặc bài viết đã ẩn."
            );
          }
        }
      } catch {
        if (!cancelled) {
          setErrorMsg("Lỗi kết nối khi tải nội dung bài viết.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadArticle();
    return () => {
      cancelled = true;
    };
  }, [slug]);

  const handleToggleLike = async () => {
    if (!article || liking) return;
    setLiking(true);
    try {
      const res = await fetchWithAuth(
        `/api/orientation/articles/${article.slug}/like`,
        { method: "POST" }
      );
      if (res.status === 401) {
        router.push(`/login?redirect=/explore/${article.slug}`);
        return;
      }
      const data = await res.json();
      if (res.ok) {
        setArticle((prev) =>
          prev
            ? {
                ...prev,
                isLikedByMe: data.liked,
                likeCount: data.likeCount,
              }
            : prev
        );
      }
    } finally {
      setLiking(false);
    }
  };

  const handleCopyShareLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard blocked in some browsers
    }
  };

  if (loading) {
    return (
      <div className="w-full px-3 sm:px-4 lg:px-5 py-4 sm:py-5">
        <div className="flex h-72 w-full items-center justify-center rounded-2xl border border-slate-200 bg-white">
          <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
        </div>
      </div>
    );
  }

  if (errorMsg || !article) {
    return (
      <div className="w-full px-3 sm:px-4 lg:px-5 py-4 sm:py-5">
        <div className="w-full space-y-4 rounded-2xl border border-rose-200 bg-rose-50 p-5 text-rose-800">
          <div className="flex items-center gap-2 font-semibold">
            <AlertCircle className="h-5 w-5" />
            <span>{errorMsg || "Không thể hiển thị bài viết"}</span>
          </div>
          <Link
            href="/explore"
            className={buttonVariants({ variant: "outline" })}
          >
            <ArrowLeft className="mr-1.5 h-4 w-4" />
            Quay lại Khám phá định hướng
          </Link>
        </div>
      </div>
    );
  }

  const hasCover =
    Boolean(article.coverImage) && isSafeMediaUrl(article.coverImage);
  const gradientClass = getCategoryBannerGradient(
    article.category?.slug || article.slug
  );

  return (
    <div className="w-full px-3 sm:px-4 lg:px-5 py-4 sm:py-5 space-y-6">
      <div>
        <Link
          href="/explore"
          className={buttonVariants({
            variant: "ghost",
            size: "sm",
            className: "-ml-2 text-slate-600",
          })}
        >
          <ArrowLeft className="mr-1.5 h-4 w-4" />
          Quay lại Khám phá định hướng
        </Link>
      </div>

      {/* Main Article Shell */}
      <article className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xs">
        <div className="relative aspect-[16/9] md:aspect-[21/9] max-h-[440px] w-full bg-slate-100">
          {hasCover && article.coverImage ? (
            <Image
              src={article.coverImage}
              alt={article.title}
              fill
              unoptimized
              className="object-cover"
            />
          ) : (
            <div
              className={`flex h-full w-full flex-col justify-between bg-gradient-to-br ${gradientClass} p-6 text-white sm:p-8`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-xs font-medium backdrop-blur-xs">
                  <Compass className="h-3.5 w-3.5" />
                  {article.category?.name || "Định hướng Unera"}
                </span>
                {article.isFeatured && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-400/90 px-3 py-1 text-xs font-semibold text-slate-950">
                    <Sparkles className="h-3 w-3" />
                    Nổi bật
                  </span>
                )}
              </div>
              <p className="text-lg font-semibold text-white/95 sm:text-xl">
                {article.topics.map((t) => `#${t.name}`).join("  ")}
              </p>
            </div>
          )}
        </div>

        <div className="space-y-5 p-4 sm:p-6 lg:p-7">
          {/* Badges & Meta */}
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
            {article.category && (
              <Link
                href={`/explore?category=${article.category.slug}`}
                className="rounded-full bg-blue-50 px-3 py-1 font-semibold text-blue-700 hover:bg-blue-100"
              >
                {article.category.name}
              </Link>
            )}
            {article.topics.map((topic) => (
              <Link
                key={topic._id}
                href={`/explore?category=${article.category?.slug || ""}&topic=${topic.slug}`}
                className="rounded-full bg-slate-100 px-2.5 py-1 font-medium text-slate-700 hover:bg-slate-200"
              >
                {topic.name}
              </Link>
            ))}
          </div>

          <h1 className="text-2xl font-bold leading-tight text-slate-900 sm:text-4xl">
            {article.title}
          </h1>

          <div className="flex flex-wrap items-center justify-between gap-4 border-y border-slate-100 py-3.5 text-sm text-slate-500">
            <div className="flex flex-wrap items-center gap-4">
              <span className="font-medium text-slate-800">
                {article.authorName}
              </span>
              {article.publishedAt && (
                <span className="inline-flex items-center gap-1.5">
                  <Calendar className="h-4 w-4 text-slate-400" />
                  {formatDate(article.publishedAt)}
                </span>
              )}
              <span className="inline-flex items-center gap-1.5">
                <Clock className="h-4 w-4 text-slate-400" />
                {article.readTimeMinutes} phút đọc
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Eye className="h-4 w-4 text-slate-400" />
                {article.viewCount} lượt đọc
              </span>
            </div>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={liking}
                onClick={handleToggleLike}
                className={
                  article.isLikedByMe
                    ? "border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100"
                    : ""
                }
              >
                <Heart
                  className={`mr-1.5 h-4 w-4 ${
                    article.isLikedByMe ? "fill-rose-500 text-rose-500" : ""
                  }`}
                />
                {article.likeCount}
              </Button>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleCopyShareLink}
              >
                {copied ? (
                  <>
                    <Check className="mr-1.5 h-4 w-4 text-emerald-600" />
                    Đã chép link
                  </>
                ) : (
                  <>
                    <Share2 className="mr-1.5 h-4 w-4" />
                    Chia sẻ
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Summary callout */}
          <p className="rounded-2xl border-l-4 border-blue-600 bg-blue-50/50 px-5 py-4 text-base font-medium leading-relaxed text-slate-700">
            {article.summary}
          </p>

          {/* Rich Tiptap Content Renderer */}
          <TiptapContentRenderer
            contentJson={article.contentJson}
            className="pt-2"
          />

          {/* Tags */}
          {article.tags.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 border-t border-slate-100 pt-6">
              <span className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                <Tag className="h-3.5 w-3.5" />
                Từ khóa:
              </span>
              {article.tags.map((tag) => (
                <Link
                  key={tag}
                  href={`/explore?tag=${encodeURIComponent(tag)}`}
                  className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-blue-50 hover:text-blue-700"
                >
                  #{tag}
                </Link>
              ))}
            </div>
          )}
        </div>
      </article>

      {/* Comments */}
      <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-xs sm:p-6 lg:p-7">
        <ArticleComments
          slug={article.slug}
          initialCount={article.commentCount}
          onCommentCountChange={(nextCount) =>
            setArticle((prev) =>
              prev ? { ...prev, commentCount: nextCount } : prev
            )
          }
        />
      </section>

      {/* Related Articles */}
      {related.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-lg font-bold text-slate-900">
            Bài viết liên quan cùng chuyên mục
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {related.map((item) => (
              <ArticleCard key={item._id} article={item} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

export default function ExploreArticleDetailPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
        </div>
      }
    >
      <ExploreArticleDetailContent />
    </Suspense>
  );
}
