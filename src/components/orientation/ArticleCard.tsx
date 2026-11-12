"use client";

import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Clock,
  Compass,
  Eye,
  Heart,
  MessageSquare,
  Sparkles,
} from "lucide-react";
import { getCategoryBannerGradient, isSafeMediaUrl } from "@/lib/orientation-utils";
import { formatDate } from "@/lib/utils";
import type { IOrientationArticleSummary } from "@/types";

interface ArticleCardProps {
  article: IOrientationArticleSummary;
  onToggleLike?: (slug: string) => void;
  variant?: "default" | "featured";
}

export function ArticleCard({
  article,
  onToggleLike,
  variant = "default",
}: ArticleCardProps) {
  const hasValidCover =
    Boolean(article.coverImage) && isSafeMediaUrl(article.coverImage);
  const gradientClass = getCategoryBannerGradient(
    article.category?.slug || article.slug
  );

  return (
    <article
      className={`group flex flex-col overflow-hidden rounded-2xl border bg-white transition-all hover:shadow-md ${
        variant === "featured"
          ? "border-blue-200/90 shadow-sm"
          : "border-slate-200/80 shadow-2xs hover:border-blue-200"
      }`}
    >
      {/* Cover banner / Fallback gradient */}
      <Link
        href={`/explore/${article.slug}`}
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
            className={`flex h-full w-full flex-col justify-between bg-gradient-to-br ${gradientClass} p-4 text-white`}
          >
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1 rounded-full bg-white/20 px-2.5 py-0.5 text-[11px] font-semibold backdrop-blur-xs">
                <Compass className="h-3 w-3" />
                {article.category?.name || "Khám phá định hướng"}
              </span>
            </div>
            <p className="line-clamp-2 text-sm font-bold leading-snug text-white/95">
              {article.title}
            </p>
          </div>
        )}

        {article.isFeatured && (
          <span className="absolute top-3 right-3 inline-flex items-center gap-1 rounded-full bg-amber-400/95 px-2.5 py-0.5 text-[11px] font-bold text-slate-900 shadow-xs">
            <Sparkles className="h-3 w-3" />
            Nổi bật
          </span>
        )}
      </Link>

      {/* Card Body */}
      <div className="flex flex-1 flex-col justify-between p-4 space-y-3">
        <div className="space-y-2.5">
          {/* Category & Topics */}
          <div className="flex flex-wrap items-center gap-1.5">
            {article.category && (
              <Link
                href={`/explore?category=${article.category.slug}`}
                className="rounded-md bg-blue-50 px-2 py-0.5 text-[11px] font-semibold text-blue-700 hover:bg-blue-100 transition-colors"
              >
                {article.category.name}
              </Link>
            )}
            {article.topics.slice(0, 2).map((topic) => (
              <Link
                key={topic._id}
                href={`/explore?${article.category ? `category=${article.category.slug}&` : ""}topic=${topic.slug}`}
                className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600 hover:bg-slate-200 transition-colors"
              >
                {topic.name}
              </Link>
            ))}
          </div>

          <Link href={`/explore/${article.slug}`} className="block">
            <h3 className="text-base font-bold text-slate-900 leading-snug line-clamp-2 group-hover:text-blue-600 transition-colors">
              {article.title}
            </h3>
          </Link>

          <p className="text-xs sm:text-[13px] text-slate-500 line-clamp-2 leading-relaxed">
            {article.summary}
          </p>
        </div>

        {/* Footer Meta & Engagement */}
        <div className="pt-3 border-t border-slate-100 space-y-2.5">
          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span className="truncate font-medium text-slate-600 max-w-[55%]">
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

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 text-xs text-slate-500">
              {onToggleLike ? (
                <button
                  type="button"
                  onClick={() => onToggleLike(article.slug)}
                  aria-label="Thích bài viết"
                  className={`inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium transition-colors cursor-pointer ${
                    article.isLikedByMe
                      ? "bg-rose-50 text-rose-600"
                      : "hover:bg-slate-100 text-slate-500"
                  }`}
                >
                  <Heart
                    className={`h-3.5 w-3.5 ${
                      article.isLikedByMe ? "fill-rose-500 text-rose-500" : ""
                    }`}
                  />
                  <span>{article.likeCount}</span>
                </button>
              ) : (
                <span className="inline-flex items-center gap-1">
                  <Heart className="h-3.5 w-3.5" />
                  {article.likeCount}
                </span>
              )}

              <Link
                href={`/explore/${article.slug}#comments`}
                className="inline-flex items-center gap-1 rounded-lg px-1.5 py-1 hover:bg-slate-100 transition-colors"
              >
                <MessageSquare className="h-3.5 w-3.5" />
                <span>{article.commentCount}</span>
              </Link>

              <span className="inline-flex items-center gap-1">
                <Eye className="h-3.5 w-3.5" />
                <span>{article.viewCount}</span>
              </span>
            </div>

            <Link
              href={`/explore/${article.slug}`}
              className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700"
            >
              <span>Đọc tiếp</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}

