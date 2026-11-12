"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  BarChart3,
  CalendarClock,
  Eye,
  GraduationCap,
  Loader2,
  TrendingUp,
  Users,
} from "lucide-react";
import { fetchWithAuth } from "@/components/providers/AuthProvider";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ACTIVITY_COMPUTED_STATUS } from "@/constants";
import {
  ACTIVITY_COMPUTED_STATUS_META,
  formatVietnamDate,
  getCategoryColorClasses,
} from "@/lib/activity-utils";
import type { IActivityStatisticsDTO } from "@/types";

export default function AdminActivitiesStatisticsPage() {
  const [stats, setStats] = useState<IActivityStatisticsDTO | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function loadStats() {
      try {
        const res = await fetchWithAuth("/api/admin/activities/statistics", {
          cache: "no-store",
        });
        const data = await res.json();
        if (!cancelled && res.ok && data.statistics) {
          setStats(data.statistics);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    loadStats();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  const kpi = stats?.kpi;
  const maxStatusCount = kpi
    ? Math.max(1, ...Object.values(kpi.byComputedStatus))
    : 1;

  return (
    <div className="mx-auto w-full max-w-7xl px-6 sm:px-8 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-blue-600" />
            <h1 className="text-xl font-bold text-slate-900">
              Thống kê Hoạt động Sinh viên
            </h1>
          </div>
          <p className="text-xs text-slate-500">
            Theo dõi lượt xem, lượt quan tâm, tỷ lệ chuyển đổi và phân bố hoạt động theo danh mục / hạn chót.
          </p>
        </div>

        <Link
          href="/admin/activities"
          className={buttonVariants({
            variant: "outline",
            size: "sm",
            className: "rounded-xl self-start sm:self-auto",
          })}
        >
          <ArrowLeft className="mr-1.5 h-4 w-4" />
          Quay lại Quản trị Hoạt động
        </Link>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="rounded-2xl border-slate-200/80 bg-white shadow-xs">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Hoạt động đang mở
              </p>
              <p className="mt-1 text-2xl font-bold text-emerald-600">
                {kpi?.openActivities || 0}
              </p>
              <p className="text-[11px] text-slate-400">
                Trên tổng {kpi?.publishedActivities || 0} đã xuất bản /{" "}
                {kpi?.totalActivities || 0} bài
              </p>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
              <GraduationCap className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-slate-200/80 bg-white shadow-xs">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Tổng lượt quan tâm
              </p>
              <p className="mt-1 text-2xl font-bold text-blue-600">
                {kpi?.totalFollowers || 0}
              </p>
              <p className="text-[11px] text-slate-400">
                Sinh viên theo dõi nhắc lịch
              </p>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
              <Users className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-slate-200/80 bg-white shadow-xs">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Sắp hết hạn (≤ 7 ngày)
              </p>
              <p className="mt-1 text-2xl font-bold text-rose-600">
                {kpi?.closingWithin7Days || 0}
              </p>
              <p className="text-[11px] text-slate-400">
                Cần đẩy thông báo nhắc sinh viên
              </p>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-rose-50 text-rose-600">
              <CalendarClock className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-slate-200/80 bg-white shadow-xs">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Tổng lượt xem chi tiết
              </p>
              <p className="mt-1 text-2xl font-bold text-indigo-600">
                {kpi?.totalViews || 0}
              </p>
              <p className="text-[11px] text-slate-400">
                Tỷ lệ theo dõi trung bình{" "}
                {kpi && kpi.totalViews > 0
                  ? `${((kpi.totalFollowers / kpi.totalViews) * 100).toFixed(1)}%`
                  : "0%"}
              </p>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
              <Eye className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Status Distribution + Category Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <Card className="lg:col-span-5 rounded-2xl border-slate-200/80 bg-white shadow-xs">
          <CardHeader className="pb-3 border-b border-slate-100">
            <CardTitle className="text-sm font-bold text-slate-900">
              Phân bố theo trạng thái thời gian thực
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5 space-y-3.5">
            {Object.values(ACTIVITY_COMPUTED_STATUS).map((statusKey) => {
              const count = kpi?.byComputedStatus[statusKey] || 0;
              const meta = ACTIVITY_COMPUTED_STATUS_META[statusKey];
              const pct = Math.round((count / maxStatusCount) * 100);
              return (
                <div key={statusKey} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-700">
                      {meta.label}
                    </span>
                    <span className="font-bold text-slate-900">{count}</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${meta.dotClass}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        <Card className="lg:col-span-7 rounded-2xl border-slate-200/80 bg-white shadow-xs overflow-hidden">
          <CardHeader className="pb-3 border-b border-slate-100">
            <CardTitle className="text-sm font-bold text-slate-900">
              Thống kê theo Danh mục
            </CardTitle>
          </CardHeader>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/70 text-[11px] font-bold uppercase text-slate-500">
                  <th className="py-3 px-4">Danh mục</th>
                  <th className="py-3 px-4 text-right">Tổng bài</th>
                  <th className="py-3 px-4 text-right">Đã xuất bản</th>
                  <th className="py-3 px-4 text-right">Quan tâm</th>
                  <th className="py-3 px-4 text-right">Lượt xem</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(stats?.byCategory || []).map((cat) => {
                  const colors = getCategoryColorClasses(cat.colorToken);
                  return (
                    <tr key={cat.categoryId} className="hover:bg-slate-50/70">
                      <td className="py-3 px-4">
                        <span
                          className={`rounded-md border px-2 py-0.5 text-[11px] font-semibold ${colors.pillClass}`}
                        >
                          {cat.name}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-semibold text-slate-800">
                        {cat.totalCount}
                      </td>
                      <td className="py-3 px-4 text-right text-slate-600">
                        {cat.publishedCount}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-blue-600">
                        {cat.totalFollowers}
                      </td>
                      <td className="py-3 px-4 text-right text-slate-600">
                        {cat.totalViews}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* Top Followed & Top Viewed */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="rounded-2xl border-slate-200/80 bg-white shadow-xs">
          <CardHeader className="pb-3 border-b border-slate-100">
            <CardTitle className="flex items-center gap-2 text-sm font-bold text-slate-900">
              <TrendingUp className="h-4 w-4 text-blue-600" />
              Top hoạt động được quan tâm nhất
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 divide-y divide-slate-100">
            {(stats?.topFollowed || []).length === 0 ? (
              <p className="p-6 text-center text-xs text-slate-400">
                Chưa có dữ liệu hoạt động.
              </p>
            ) : (
              stats!.topFollowed.map((item, idx) => (
                <div
                  key={item._id}
                  className="p-4 flex items-center justify-between gap-3 hover:bg-slate-50"
                >
                  <div className="min-w-0 space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-50 text-[10px] font-bold text-blue-700">
                        {idx + 1}
                      </span>
                      <Link
                        href={`/admin/activities/${item._id}/edit`}
                        className="text-xs font-bold text-slate-900 hover:text-blue-600 truncate"
                      >
                        {item.title}
                      </Link>
                    </div>
                    <p className="text-[11px] text-slate-500 pl-7">
                      {item.categoryName} · Hạn: {formatVietnamDate(item.deadline)}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs font-bold text-blue-600">
                      {item.followerCount} quan tâm
                    </p>
                    <p className="text-[10px] text-slate-400">
                      {item.viewCount} xem · {item.conversionRate}%
                    </p>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-slate-200/80 bg-white shadow-xs">
          <CardHeader className="pb-3 border-b border-slate-100">
            <CardTitle className="flex items-center gap-2 text-sm font-bold text-slate-900">
              <Eye className="h-4 w-4 text-indigo-600" />
              Top hoạt động có nhiều lượt xem nhất
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 divide-y divide-slate-100">
            {(stats?.topViewed || []).length === 0 ? (
              <p className="p-6 text-center text-xs text-slate-400">
                Chưa có dữ liệu hoạt động.
              </p>
            ) : (
              stats!.topViewed.map((item, idx) => (
                <div
                  key={item._id}
                  className="p-4 flex items-center justify-between gap-3 hover:bg-slate-50"
                >
                  <div className="min-w-0 space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-[10px] font-bold text-indigo-700">
                        {idx + 1}
                      </span>
                      <Link
                        href={`/admin/activities/${item._id}/edit`}
                        className="text-xs font-bold text-slate-900 hover:text-blue-600 truncate"
                      >
                        {item.title}
                      </Link>
                    </div>
                    <p className="text-[11px] text-slate-500 pl-7">
                      {item.categoryName}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs font-bold text-indigo-600">
                      {item.viewCount} lượt xem
                    </p>
                    <p className="text-[10px] text-slate-400">
                      {item.followerCount} quan tâm
                    </p>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

