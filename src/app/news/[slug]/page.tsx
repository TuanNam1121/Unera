"use client";

import { useEffect, useState, Suspense } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Bookmark,
  Share2,
  Calendar,
  Clock,
  User,
  Sparkles,
  Award,
  ArrowRight,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface NewsArticleDetail {
  _id: string;
  title: string;
  slug: string;
  summary: string;
  content: string;
  category: string;
  author: string;
  readTime: string;
  isFeatured: boolean;
  isSponsored: boolean;
  sponsorInfo?: {
    sponsorName: string;
    sponsorLogoUrl?: string;
    targetUrl?: string;
  };
  publishedAt: string;
}

function ArticleDetailContent() {
  const params = useParams();
  const slug = params?.slug as string;
  const router = useRouter();

  const [article, setArticle] = useState<NewsArticleDetail | null>(null);
  const [related, setRelated] = useState<NewsArticleDetail[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isBookmarked, setIsBookmarked] = useState(false);

  useEffect(() => {
    async function loadArticle() {
      if (!slug) return;
      try {
        const res = await fetch(`/api/news/${slug}`);
        const data = await res.json();
        if (data.article) {
          setArticle(data.article);
          setRelated(data.relatedArticles || []);
        }
      } catch (err) {
        console.error("Failed to load article detail", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadArticle();
  }, [slug]);

  if (isLoading) {
    return (
      <div className="w-full min-h-[60vh] flex items-center justify-center p-6">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 rounded-full border-3 border-blue-600 border-t-transparent animate-spin" />
          <p className="text-xs font-semibold text-slate-600">Đang tải bài viết...</p>
        </div>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="w-full min-h-[50vh] flex flex-col items-center justify-center p-6 text-center space-y-3">
        <h2 className="text-lg font-bold text-slate-900">Không tìm thấy bài viết</h2>
        <p className="text-xs text-slate-500">Bài viết có thể đã bị gỡ hoặc đường dẫn không chính xác.</p>
        <Link href="/news">
          <button
            type="button"
            className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700 transition-colors"
          >
            Quay lại Thư viện tin tức
          </button>
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full px-6 sm:px-8 py-6 space-y-8 max-w-4xl mx-auto">
      {/* 1. TOP NAV & ACTIONS */}
      <div className="flex items-center justify-between">
        <Link
          href="/news"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Quay lại Thư viện</span>
        </Link>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsBookmarked(!isBookmarked)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold transition-colors shadow-2xs",
              isBookmarked
                ? "border-blue-600 bg-blue-50 text-blue-700"
                : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
            )}
          >
            <Bookmark className="h-3.5 w-3.5" />
            <span>{isBookmarked ? "Đã lưu" : "Lưu bài viết"}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              if (navigator.share) {
                navigator.share({ title: article.title, url: window.location.href });
              } else {
                navigator.clipboard.writeText(window.location.href);
                alert("Đã sao chép liên kết bài viết!");
              }
            }}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs"
          >
            <Share2 className="h-3.5 w-3.5 text-slate-500" />
            <span>Chia sẻ</span>
          </button>
        </div>
      </div>

      {/* 2. ARTICLE HEADER */}
      <div className="space-y-4">
        {/* Category & Badges */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-blue-700 bg-blue-50 border border-blue-100 px-2.5 py-0.5 rounded-md">
            {article.category}
          </span>

          {article.isFeatured && (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-md">
              <Sparkles className="h-3 w-3" /> Nổi bật
            </span>
          )}

          {/* FR-NEWS-06: Sponsored Content Labeling */}
          {article.isSponsored && (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md">
              <Award className="h-3 w-3" /> Được tài trợ
            </span>
          )}
        </div>

        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
          {article.title}
        </h1>

        {/* Metadata */}
        <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 pt-1 border-b border-slate-100 pb-4">
          <span className="inline-flex items-center gap-1.5 text-slate-600 font-semibold">
            <User className="h-3.5 w-3.5 text-slate-400" />
            {article.author}
          </span>
          <span>·</span>
          <span className="inline-flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5" />
            {article.readTime}
          </span>
          <span>·</span>
          <span className="inline-flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5" />
            {new Date(article.publishedAt || Date.now()).toLocaleDateString("vi-VN")}
          </span>
        </div>
      </div>

      {/* FR-NEWS-06: Sponsored Banner if applicable */}
      {article.isSponsored && article.sponsorInfo?.sponsorName && (
        <div className="rounded-2xl border border-amber-200 bg-gradient-to-r from-amber-50/80 to-amber-50/30 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
              <Award className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-amber-900">
                Nội dung hợp tác cùng {article.sponsorInfo.sponsorName}
              </p>
              <p className="text-[11px] text-amber-700">
                Thông tin được kiểm duyệt và đồng hành phát triển cùng nền tảng Polaris
              </p>
            </div>
          </div>
          {article.sponsorInfo.targetUrl && (
            <a
              href={article.sponsorInfo.targetUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-900 hover:text-amber-950 underline self-start sm:self-auto"
            >
              <span>Tìm hiểu thêm</span>
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          )}
        </div>
      )}

      {/* 3. LEAD / SUMMARY */}
      <div className="rounded-2xl border-l-4 border-blue-600 bg-blue-50/40 p-5 text-sm sm:text-base font-medium text-slate-700 leading-relaxed italic">
        {article.summary}
      </div>

      {/* 4. MAIN CONTENT */}
      <article className="prose prose-slate max-w-none text-xs sm:text-sm leading-relaxed text-slate-800 space-y-4 whitespace-pre-line">
        {article.content}
      </article>

      {/* 5. RELATED ARTICLES */}
      {related.length > 0 && (
        <div className="border-t border-slate-200 pt-8 space-y-4">
          <h3 className="text-base font-bold text-slate-900">Bài viết cùng chuyên mục</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {related.map((item) => (
              <Link
                key={item._id}
                href={`/news/${item.slug}`}
                className="group rounded-2xl border border-slate-200/90 bg-white p-4 shadow-2xs hover:border-blue-200 transition-all flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <span className="text-[10px] font-bold text-blue-600 uppercase">
                    {item.category}
                  </span>
                  <h4 className="text-xs font-bold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-2">
                    {item.title}
                  </h4>
                  <p className="text-[11px] text-slate-500 line-clamp-2">
                    {item.summary}
                  </p>
                </div>
                <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                  <span>{item.readTime}</span>
                  <ArrowRight className="h-3.5 w-3.5 text-slate-300 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function ArticleDetailPage() {
  return (
    <Suspense
      fallback={
        <div className="w-full min-h-[60vh] flex items-center justify-center p-6">
          <div className="h-8 w-8 rounded-full border-3 border-blue-600 border-t-transparent animate-spin" />
        </div>
      }
    >
      <ArticleDetailContent />
    </Suspense>
  );
}
