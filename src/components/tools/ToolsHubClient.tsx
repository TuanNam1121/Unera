"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BrainCircuit,
  Calculator,
  History,
  Loader2,
  LogIn,
  ReceiptText,
  Sparkles,
  Trash2,
} from "lucide-react";
import { fetchWithAuth, useAuth } from "@/components/providers/AuthProvider";
import { ToolSubNav } from "@/components/tools/ToolSubNav";
import { Button } from "@/components/ui/button";
import { MBTI_PROFILES, type MbtiCode } from "@/constants/mbti";
import { MI_PROFILES, type MiCategoryKey } from "@/constants/mi";
import type { MbtiAxisBreakdown } from "@/lib/tools/mbti";
import { cn } from "@/lib/utils";
import type { IToolResultDTO, IToolResultsResponse } from "@/types";

const TOOL_CARDS = [
  {
    code: "TOOL-01",
    title: "Trắc nghiệm MBTI",
    href: "/tools/mbti",
    icon: BrainCircuit,
    badge: "40 câu · Lưu lịch sử",
    accentClass: "bg-indigo-50 text-indigo-700 border-indigo-200",
    description:
      "Phân tích 4 cặp trục tính cách (E/I, S/N, T/F, J/P) để xác định 1 trong 16 nhóm MBTI, điểm mạnh nổi bật và ngành nghề phù hợp cho sinh viên.",
  },
  {
    code: "TOOL-02",
    title: "Trắc nghiệm Đa trí thông minh MI",
    href: "/tools/mi",
    icon: Sparkles,
    badge: "8 chỉ số · Biểu đồ Radar",
    accentClass: "bg-blue-50 text-blue-700 border-blue-200",
    description:
      "Đánh giá 8 loại hình trí thông minh Howard Gardner theo thang 0–100%, nổi bật Top 3 vượt trội cùng phương pháp học tập đại học tối ưu.",
  },
  {
    code: "TOOL-03",
    title: "Tính lương Gross ↔ Net",
    href: "/tools/gross-net",
    icon: Calculator,
    badge: "2 chiều · Chuẩn Vùng I–IV",
    accentClass: "bg-emerald-50 text-emerald-700 border-emerald-200",
    description:
      "Quy đổi chính xác Gross → Net và Net → Gross theo Nghị định 73 & 74/2024, có xét trần đóng BHXH/BHYT/BHTN và chi phí doanh nghiệp.",
  },
  {
    code: "TOOL-04",
    title: "Tính Thuế Thu nhập Cá nhân",
    href: "/tools/tax",
    icon: ReceiptText,
    badge: "Biểu thuế 7 bậc",
    accentClass: "bg-amber-50 text-amber-700 border-amber-200",
    description:
      "Bóc tách chi tiết từng bậc thuế lũy tiến từng phần (5% → 35%), giảm trừ gia cảnh, người phụ thuộc và ước tính thuế theo tháng hoặc năm.",
  },
] as const;

function formatDateTimeVi(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Ho_Chi_Minh",
  }).format(date);
}

export function ToolsHubClient() {
  const { user, loading: authLoading } = useAuth();
  const [rawResults, setResults] = useState<IToolResultDTO[]>([]);
  const [rawLatestMbti, setLatestMbti] = useState<IToolResultDTO | null>(null);
  const [rawLatestMi, setLatestMi] = useState<IToolResultDTO | null>(null);
  const [loadedUserId, setLoadedUserId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const results = user ? rawResults : [];
  const latestMbti = user ? rawLatestMbti : null;
  const latestMi = user ? rawLatestMi : null;
  const loadingResults = Boolean(user) && loadedUserId !== user?.id;

  useEffect(() => {
    if (authLoading || !user) return;
    let active = true;
    fetchWithAuth("/api/tools/results?limit=12", {
      cache: "no-store",
    })
      .then((res) => (res.ok ? (res.json() as Promise<IToolResultsResponse>) : null))
      .then((data) => {
        if (!active) return;
        if (data) {
          setResults(Array.isArray(data.results) ? data.results : []);
          setLatestMbti(data.latestByType?.MBTI || null);
          setLatestMi(data.latestByType?.MI || null);
        }
        setLoadedUserId(user.id);
      })
      .catch(() => {
        if (active) setLoadedUserId(user.id);
      });

    return () => {
      active = false;
    };
  }, [authLoading, user]);

  const handleDeleteResult = async (id: string) => {
    setDeletingId(id);
    try {
      const res = await fetchWithAuth(`/api/tools/results/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        const refreshRes = await fetchWithAuth("/api/tools/results?limit=12", {
          cache: "no-store",
        });
        if (refreshRes.ok) {
          const data = (await refreshRes.json()) as IToolResultsResponse;
          setResults(Array.isArray(data.results) ? data.results : []);
          setLatestMbti(data.latestByType?.MBTI || null);
          setLatestMi(data.latestByType?.MI || null);
        } else {
          setResults((prev) => prev.filter((item) => item._id !== id));
        }
      }
    } finally {
      setDeletingId(null);
    }
  };

  const latestMbtiProfile = latestMbti
    ? MBTI_PROFILES[latestMbti.resultCode as MbtiCode]
    : null;
  const latestMbtiAxes: MbtiAxisBreakdown[] = Array.isArray(
    latestMbti?.scoresBreakdown?.axes
  )
    ? (latestMbti?.scoresBreakdown?.axes as MbtiAxisBreakdown[])
    : [];

  const latestMiRanked = Array.isArray(latestMi?.scoresBreakdown?.ranked)
    ? (latestMi.scoresBreakdown.ranked as Array<{
        category: MiCategoryKey;
        nameVi: string;
        shortLabel: string;
        percentage: number;
        rank: number;
      }>)
    : [];

  return (
    <div className="w-full px-6 sm:px-8 py-6 space-y-6">
      <ToolSubNav />

      {/* Hero Banner */}
      <section className="rounded-3xl bg-gradient-to-r from-[#DCEBFE] via-[#E8F1FD] to-[#D5E7FD] p-6 sm:p-8 border border-blue-100 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="space-y-3 max-w-3xl">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/85 px-3 py-1 text-xs font-semibold text-blue-700 border border-blue-200/80">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Bộ Công Cụ Khám Phá Bản Thân & Tính Thu Nhập Cho Sinh Viên</span>
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
            Trung Tâm Công Cụ Sinh Viên Unera
          </h1>
          <p className="text-sm text-slate-600 leading-relaxed">
            Hiểu rõ tính cách và năng lực cốt lõi qua trắc nghiệm MBTI & Đa trí thông minh (MI),
            đồng thời tính toán minh bạch lương Gross ↔ Net và Thuế TNCN trước khi bước vào kỳ thực tập hay công việc đầu tiên.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <Link
            href="/tools/mbti"
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white hover:bg-blue-700 shadow-sm shadow-blue-500/20"
          >
            <span>Làm test MBTI ngay</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
          <Link
            href="/tools/gross-net"
            className="inline-flex items-center gap-2 rounded-xl bg-white/90 border border-slate-200 px-4 py-2.5 text-xs font-semibold text-slate-800 hover:bg-white"
          >
            <span>Tính lương Gross - Net</span>
          </Link>
        </div>
      </section>

      {/* 4 Tool Cards */}
      <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
        {TOOL_CARDS.map((tool) => {
          const Icon = tool.icon;
          return (
            <Link
              key={tool.code}
              href={tool.href}
              className="group rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_2px_8px_rgba(0,0,0,0.02)] hover:shadow-md hover:border-blue-200 transition-all flex flex-col justify-between gap-4"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="h-10 w-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors">
                    <Icon className="h-5 w-5" />
                  </div>
                  <span
                    className={cn(
                      "rounded-full border px-2.5 py-0.5 text-[10px] font-semibold",
                      tool.accentClass
                    )}
                  >
                    {tool.badge}
                  </span>
                </div>

                <div>
                  <h2 className="text-base font-bold text-slate-900 group-hover:text-blue-700 transition-colors">
                    {tool.title}
                  </h2>
                  <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                    {tool.description}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs font-semibold text-blue-600">
                <span>Mở công cụ</span>
                <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </Link>
          );
        })}
      </section>

      {/* Kết quả MBTI & MI gần nhất của sinh viên */}
      <section className="space-y-4">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <History className="h-5 w-5 text-blue-600" />
            <h2 className="text-lg font-bold text-slate-900">
              Hồ Sơ Kết Quả Trắc Nghiệm Gần Nhất Của Bạn
            </h2>
          </div>
        </div>

        {!user && !authLoading ? (
          <div className="rounded-2xl border border-blue-100 bg-white p-6 shadow-[0_2px_8px_rgba(0,0,0,0.02)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-slate-900">
                Đăng nhập để lưu & theo dõi kết quả MBTI, MI theo thời gian
              </h3>
              <p className="text-xs text-slate-600">
                Cả 4 công cụ đều hoạt động đầy đủ cho khách trải nghiệm. Khi đăng nhập bằng tài khoản sinh viên, Unera sẽ lưu tự động lịch sử bài làm của bạn.
              </p>
            </div>
            <Link
              href="/login?callbackUrl=/tools"
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white hover:bg-blue-700 shrink-0"
            >
              <LogIn className="h-4 w-4" />
              <span>Đăng nhập</span>
            </Link>
          </div>
        ) : loadingResults ? (
          <div className="rounded-2xl border border-slate-200/80 bg-white p-10 flex items-center justify-center gap-2 text-sm text-slate-500">
            <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
            <span>Đang tải kết quả trắc nghiệm gần nhất...</span>
          </div>
        ) : (
          <div className="space-y-5">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {/* Latest MBTI Snapshot */}
              <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_2px_8px_rgba(0,0,0,0.02)] flex flex-col justify-between gap-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <BrainCircuit className="h-4 w-4 text-indigo-600" />
                    <h3 className="text-sm font-bold text-slate-900">
                      Kết quả MBTI gần nhất
                    </h3>
                  </div>
                  <Link
                    href="/tools/mbti"
                    className="text-xs font-semibold text-blue-600 hover:underline"
                  >
                    {latestMbti ? "Làm lại / Chi tiết" : "Làm bài ngay"}
                  </Link>
                </div>

                {latestMbti && latestMbtiProfile ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-baseline gap-2.5">
                        <span className="text-3xl font-extrabold text-blue-600">
                          {latestMbti.resultCode}
                        </span>
                        <span className="text-sm font-bold text-slate-900">
                          {latestMbtiProfile.nameVi}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-400">
                        {formatDateTimeVi(latestMbti.createdAt)}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600">
                      {latestMbtiProfile.tagline}
                    </p>
                    {latestMbtiAxes.length > 0 && (
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                        {latestMbtiAxes.map((a) => (
                          <div
                            key={a.axis}
                            className="rounded-xl border border-slate-100 bg-slate-50 px-2.5 py-2 text-center"
                          >
                            <p className="text-[10px] font-semibold text-slate-400">
                              {a.leftPole} / {a.rightPole}
                            </p>
                            <p className="text-xs font-bold text-slate-800 mt-0.5">
                              {a.winnerPole} (
                              {a.winnerPole === a.leftPole ? a.leftPct : a.rightPct}
                              %)
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="pt-1">
                      <Link
                        href={`/tools/mbti?resultId=${latestMbti._id}`}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:underline"
                      >
                        Xem đầy đủ hồ sơ {latestMbti.resultCode}
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                    </div>
                  </div>
                ) : (
                  <div className="py-6 text-center space-y-2">
                    <p className="text-xs text-slate-500">
                      Bạn chưa hoàn thành bài trắc nghiệm MBTI nào.
                    </p>
                    <Link
                      href="/tools/mbti"
                      className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-blue-700"
                    >
                      Khám phá MBTI ngay
                    </Link>
                  </div>
                )}
              </div>

              {/* Latest MI Snapshot */}
              <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_2px_8px_rgba(0,0,0,0.02)] flex flex-col justify-between gap-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-blue-600" />
                    <h3 className="text-sm font-bold text-slate-900">
                      Kết quả Đa trí thông minh (MI) gần nhất
                    </h3>
                  </div>
                  <Link
                    href="/tools/mi"
                    className="text-xs font-semibold text-blue-600 hover:underline"
                  >
                    {latestMi ? "Làm lại / Chi tiết" : "Làm bài ngay"}
                  </Link>
                </div>

                {latestMi ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-bold text-slate-900">
                        Top 1:{" "}
                        {MI_PROFILES[latestMi.resultCode as MiCategoryKey]?.nameVi ||
                          latestMi.resultCode}
                      </span>
                      <span className="text-[11px] text-slate-400">
                        {formatDateTimeVi(latestMi.createdAt)}
                      </span>
                    </div>

                    {latestMiRanked.length > 0 ? (
                      <div className="space-y-2">
                        {latestMiRanked.slice(0, 3).map((item) => (
                          <div key={item.category} className="space-y-1">
                            <div className="flex items-center justify-between text-xs">
                              <span className="font-medium text-slate-700">
                                #{item.rank} {item.nameVi}
                              </span>
                              <span className="font-bold text-blue-700 tabular-nums">
                                {item.percentage}%
                              </span>
                            </div>
                            <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                              <div
                                style={{ width: `${item.percentage}%` }}
                                className="h-full rounded-full bg-blue-600"
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-600">{latestMi.summary}</p>
                    )}

                    <div className="pt-1">
                      <Link
                        href={`/tools/mi?resultId=${latestMi._id}`}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:underline"
                      >
                        Xem biểu đồ Radar & Top 3 chi tiết
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                    </div>
                  </div>
                ) : (
                  <div className="py-6 text-center space-y-2">
                    <p className="text-xs text-slate-500">
                      Bạn chưa hoàn thành bài trắc nghiệm Đa trí thông minh (MI).
                    </p>
                    <Link
                      href="/tools/mi"
                      className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-blue-700"
                    >
                      Khám phá 8 trí thông minh
                    </Link>
                  </div>
                )}
              </div>
            </div>

            {/* Lịch sử gần đây */}
            {results.length > 0 && (
              <div className="rounded-2xl border border-slate-200/80 bg-white overflow-hidden shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
                <div className="border-b border-slate-100 px-5 py-3.5 flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-900">
                    Lịch sử các lần thực hiện gần đây
                  </h3>
                  <span className="text-xs text-slate-500">
                    {results.length} bản ghi gần nhất
                  </span>
                </div>
                <div className="divide-y divide-slate-100">
                  {results.map((item) => (
                    <div
                      key={item._id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-3 hover:bg-slate-50/70"
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span
                            className={cn(
                              "rounded-md border px-2 py-0.5 text-[10px] font-bold",
                              item.toolType === "MBTI"
                                ? "bg-indigo-50 text-indigo-700 border-indigo-200"
                                : "bg-blue-50 text-blue-700 border-blue-200"
                            )}
                          >
                            {item.toolType}
                          </span>
                          <span className="text-xs font-bold text-slate-900">
                            {item.toolType === "MBTI"
                              ? item.resultCode
                              : MI_PROFILES[item.resultCode as MiCategoryKey]
                                  ?.shortLabel || item.resultCode}
                          </span>
                          <span className="text-[11px] text-slate-400">
                            · {formatDateTimeVi(item.createdAt)}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600">{item.summary}</p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <Link
                          href={
                            item.toolType === "MBTI"
                              ? `/tools/mbti?resultId=${item._id}`
                              : `/tools/mi?resultId=${item._id}`
                          }
                          className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                        >
                          Xem lại
                        </Link>
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          disabled={deletingId === item._id}
                          onClick={() => handleDeleteResult(item._id)}
                          className="text-rose-600 hover:bg-rose-50"
                          title="Xóa bản ghi"
                        >
                          {deletingId === item._id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Trash2 className="h-3.5 w-3.5" />
                          )}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
}

