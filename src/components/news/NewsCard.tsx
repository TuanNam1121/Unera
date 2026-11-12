"use client";

import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Bookmark,
  Clock,
  Eye,
  Newspaper,
  Share2,
  Sparkles,
} from "lucide-react";
import { getNewsColorClasses } from "@/lib/news-utils";
import { isSafeMediaUrl } from "@/lib/orientation-utils";
import { formatDate } from "@/lib/utils";
import type { INewsArticleSummary } from "@/types";

interface NewsCardProps {
  article: INewsArticleSummary;
  variant?: "default" | "featured";
  onToggleBookmark?: (slug: string, articleId: string) => void;
  onShare?: (slug: string, title: string) => void;
}

export function NewsCard({
  article,
  variant = "default",
  onToggleBookmark,
  onShare,
}: NewsCardProps) {
  const hasValidCover =
    Boolean(article.coverImage) && isSafeMediaUrl(article.coverImage);
  const colorClasses = getNewsColorClasses(article.category?.colorToken);

  return (
    <article
      className={`group flex flex-col overflow-hidden rounded-2xl border bg-white transition-all hover:shadow-md ${
        variant === "featured"
          ? "border-blue-200 shadow-sm"
          : "border-slate-200/80 shadow-2xs hover:border-blue-200"
      }`}
    >
      {/* Cover image or styled fallback */}
      <Link
        href={`/news/${article.slug}`}
        className="relative block aspect-[16/9] w-full overflow-hidden bg-slate-100"
      >
        {hasValidCover && article.coverImage ? (
          <Image
            src={article.coverImage}
            alt={article.title}
            fill
            unoptimized
            className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          />
        ) : (
          <div
            className={`flex h-full w-full flex-col justify-between bg-gradient-to-br ${colorClasses.gradientClass} p-4 text-white`}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="inline-flex items-center gap-1 rounded-full bg-white/20 px-2.5 py-0.5 text-[11px] font-semibold backdrop-blur-xs">
                <Newspaper className="h-3 w-3" />
                {article.category?.name || "Tin tức UNERA"}
              </span>
            </div>
            <p className="line-clamp-2 text-sm font-bold leading-snug text-white/95">
              {article.title}
            </p>
          </div>
        )}

        <div className="absolute top-3 right-3 flex items-center gap-1.5">
          {article.isSponsored && (
            <span className="inline-flex items-center rounded-full bg-white/95 px-2.5 py-0.5 text-[10px] font-bold text-slate-700 border border-slate-200 shadow-xs">
              Tài trợ
            </span>
          )}
          {article.isFeatured && (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-400/95 px-2.5 py-0.5 text-[11px] font-bold text-slate-900 shadow-xs">
              <Sparkles className="h-3 w-3" />
              Nổi bật
            </span>
          )}
        </div>
      </Link>

      {/* Body */}
      <div className="flex flex-1 flex-col justify-between p-4 space-y-3">
        <div className="space-y-2.5">
          <div className="flex flex-wrap items-center gap-1.5">
            {article.category && (
              <Link
                href={`/news?category=${article.category.slug}`}
                className={`rounded-md border px-2 py-0.5 text-[11px] font-semibold transition-opacity hover:opacity-90 ${colorClasses.pillClass}`}
              >
                {article.category.name}
              </Link>
            )}
            {article.tags.slice(0, 2).map((tag) => (
              <Link
                key={tag}
                href={`/news?tag=${encodeURIComponent(tag)}`}
                className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600 hover:bg-slate-200 transition-colors"
              >
                #{tag}
              </Link>
            ))}
          </div>

          <Link href={`/news/${article.slug}`} className="block">
            <h3 className="text-base font-bold text-slate-900 leading-snug line-clamp-2 group-hover:text-blue-600 transition-colors">
              {article.title}
            </h3>
          </Link>

          <p className="text-xs sm:text-[13px] text-slate-500 line-clamp-2 leading-relaxed">
            {article.summary}
          </p>
        </div>

        <div className="pt-3 border-t border-slate-100 space-y-2.5">
          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span className="truncate font-medium text-slate-600 max-w-[52%]">
              {article.authorName}
            </span>
            <div className="flex items-center gap-2 shrink-0">
              <span className="inline-flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {article.readTimeMinutes} phút
              </span>
              {article.publishedAt && (
                <span>· {formatDate(article.publishedAt)}</span>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span className="inline-flex items-center gap-1 px-1 py-0.5">
                <Eye className="h-3.5 w-3.5" />
                {article.viewCount}
              </span>

              {onToggleBookmark ? (
                <button
                  type="button"
                  onClick={() => onToggleBookmark(article.slug, article._id)}
                  aria-label="Lưu bài viết"
                  className={`inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium transition-colors cursor-pointer ${
                    article.isBookmarkedByMe
                      ? "bg-blue-50 text-blue-700"
                      : "hover:bg-slate-100 text-slate-500"
                  }`}
                >
                  <Bookmark
                    className={`h-3.5 w-3.5 ${
                      article.isBookmarkedByMe
                        ? "fill-blue-600 text-blue-600"
                        : ""
                    }`}
                  />
                  <span>{article.bookmarkCount}</span>
                </button>
              ) : (
                <span className="inline-flex items-center gap-1">
                  <Bookmark className="h-3.5 w-3.5" />
                  {article.bookmarkCount}
                </span>
              )}

              {onShare && (
                <button
                  type="button"
                  onClick={() => onShare(article.slug, article.title)}
                  aria-label="Chia sẻ bài viết"
                  className="inline-flex items-center gap-1 rounded-lg px-1.5 py-1 text-xs text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors cursor-pointer"
                >
                  <Share2 className="h-3.5 w-3.5" />
                  <span>{article.shareCount}</span>
                </button>
              )}
            </div>

            <Link
              href={`/news/${article.slug}`}
              className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700"
            >
              <span>Đọc chi tiết</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}

