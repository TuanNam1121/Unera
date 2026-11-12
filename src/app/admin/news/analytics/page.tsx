"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  BarChart3,
  Bookmark,
  CalendarClock,
  Eye,
  FileText,
  Loader2,
  Share2,
  Sparkles,
} from "lucide-react";
import { fetchWithAuth } from "@/components/providers/AuthProvider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { NEWS_STATUS_META } from "@/lib/news-utils";
import type { INewsAnalyticsDTO } from "@/types";

export default function AdminNewsAnalyticsPage() {
  const [analytics, setAnalytics] = useState<INewsAnalyticsDTO | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const loadAnalytics = async () => {
      try {
        const res = await fetchWithAuth("/api/admin/news/analytics", {
          cache: "no-store",
        });
        const data = await res.json();
        if (active && res.ok && data.analytics) {
          setAnalytics(data.analytics);
        }
      } finally {
        if (active) setLoading(false);
      }
    };
    void loadAnalytics();
    return () => {
      active = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-7 w-7 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="p-8 text-sm text-rose-600">
        Không thể tải báo cáo thống kê tin tức.
      </div>
    );
  }

  const { kpi, byStatus, byCategory, topViewed, topBookmarked } = analytics;
  const maxCategoryViews = Math.max(
    1,
    ...byCategory.map((c) => c.totalViews)
  );

  return (
    <div className="w-full max-w-7xl px-6 sm:px-8 py-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-blue-600" />
            <span>Thống Kê Hiệu Suất Tin Tức</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Theo dõi tổng lượt đọc, lượt lưu yêu thích, chia sẻ và mức độ tương tác theo danh mục.
          </p>
        </div>

        <Link href="/admin/news">
          <Button variant="outline" size="sm">
            Quay lại Bài viết Tin tức
          </Button>
        </Link>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="rounded-2xl border-slate-200/80 shadow-2xs bg-white">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase">
                Tổng lượt đọc
              </p>
              <p className="text-2xl font-bold text-slate-900 mt-1">
                {kpi.totalViews.toLocaleString("vi-VN")}
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {kpi.publishedArticles} bài đang xuất bản / {kpi.totalArticles} tổng
              </p>
            </div>
            <div className="h-11 w-11 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Eye className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-slate-200/80 shadow-2xs bg-white">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase">
                Tổng lượt lưu (Bookmark)
              </p>
              <p className="text-2xl font-bold text-emerald-700 mt-1">
                {kpi.totalBookmarks.toLocaleString("vi-VN")}
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Tỉ lệ lưu/đọc:{" "}
                {kpi.totalViews > 0
                  ? `${((kpi.totalBookmarks / kpi.totalViews) * 100).toFixed(1)}%`
                  : "0%"}
              </p>
            </div>
            <div className="h-11 w-11 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Bookmark className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-slate-200/80 shadow-2xs bg-white">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase">
                Tổng lượt chia sẻ
              </p>
              <p className="text-2xl font-bold text-indigo-700 mt-1">
                {kpi.totalShares.toLocaleString("vi-VN")}
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Lan tỏa liên kết tin tức
              </p>
            </div>
            <div className="h-11 w-11 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Share2 className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-slate-200/80 shadow-2xs bg-white">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase">
                Tin nổi bật &amp; Hẹn giờ
              </p>
              <p className="text-2xl font-bold text-amber-600 mt-1">
                {kpi.featuredArticles} / {kpi.scheduledArticles}
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {kpi.draftArticles} bản nháp đang biên tập
              </p>
            </div>
            <div className="h-11 w-11 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Sparkles className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Status & Category Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="rounded-2xl border-slate-200/80 shadow-2xs bg-white">
          <CardHeader className="pb-3 border-b border-slate-100">
            <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <FileText className="h-4 w-4 text-blue-600" />
              <span>Phân bố theo Trạng thái xuất bản</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5 space-y-3">
            {(["PUBLISHED", "SCHEDULED", "DRAFT", "UNPUBLISHED"] as const).map(
              (st) => {
                const count = byStatus[st] || 0;
                const pct =
                  kpi.totalArticles > 0
                    ? Math.round((count / kpi.totalArticles) * 100)
                    : 0;
                const meta = NEWS_STATUS_META[st];
                return (
                  <div key={st} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-700">
                        {meta.label}
                      </span>
                      <span className="text-slate-500">
                        {count} bài ({pct}%)
                      </span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-blue-600 transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              }
            )}
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-slate-200/80 shadow-2xs bg-white">
          <CardHeader className="pb-3 border-b border-slate-100">
            <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <CalendarClock className="h-4 w-4 text-emerald-600" />
              <span>Tương tác theo Danh mục tin tức</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5 space-y-3">
            {byCategory.map((cat) => {
              const pct = Math.round((cat.totalViews / maxCategoryViews) * 100);
              return (
                <div key={cat.categoryId} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-800">
                      {cat.name}{" "}
                      <span className="text-slate-400 font-normal">
                        ({cat.totalCount} bài)
                      </span>
                    </span>
                    <span className="text-slate-600">
                      {cat.totalViews} xem · {cat.totalBookmarks} lưu ·{" "}
                      {cat.totalShares} chia sẻ
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-emerald-500 transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>

      {/* Top Articles Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="rounded-2xl border-slate-200/80 shadow-2xs bg-white">
          <CardHeader className="pb-3 border-b border-slate-100">
            <CardTitle className="text-sm font-bold text-slate-900">
              Top Bài Viết Đọc Nhiều Nhất
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 divide-y divide-slate-100">
            {topViewed.slice(0, 6).map((item, idx) => (
              <div
                key={item._id}
                className="p-4 flex items-center justify-between gap-3"
              >
                <div className="min-w-0 flex items-center gap-3">
                  <span className="h-6 w-6 rounded-full bg-blue-50 text-blue-700 text-xs font-bold flex items-center justify-center shrink-0">
                    {idx + 1}
                  </span>
                  <div className="min-w-0">
                    <Link
                      href={`/admin/news/${item._id}/edit`}
                      className="text-xs font-bold text-slate-900 hover:text-blue-600 line-clamp-1"
                    >
                      {item.title}
                    </Link>
                    <p className="text-[11px] text-slate-400">
                      {item.categoryName}
                    </p>
                  </div>
                </div>
                <span className="text-xs font-bold text-blue-700 shrink-0">
                  {item.viewCount} lượt xem
                </span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-slate-200/80 shadow-2xs bg-white">
          <CardHeader className="pb-3 border-b border-slate-100">
            <CardTitle className="text-sm font-bold text-slate-900">
              Top Bài Viết Được Lưu Nhiều Nhất
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 divide-y divide-slate-100">
            {topBookmarked.slice(0, 6).map((item, idx) => (
              <div
                key={item._id}
                className="p-4 flex items-center justify-between gap-3"
              >
                <div className="min-w-0 flex items-center gap-3">
                  <span className="h-6 w-6 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold flex items-center justify-center shrink-0">
                    {idx + 1}
                  </span>
                  <div className="min-w-0">
                    <Link
                      href={`/admin/news/${item._id}/edit`}
                      className="text-xs font-bold text-slate-900 hover:text-blue-600 line-clamp-1"
                    >
                      {item.title}
                    </Link>
                    <p className="text-[11px] text-slate-400">
                      {item.categoryName} · {item.shareCount} chia sẻ
                    </p>
                  </div>
                </div>
                <span className="text-xs font-bold text-emerald-700 shrink-0">
                  {item.bookmarkCount} lượt lưu
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

