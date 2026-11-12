"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Clock,
  Eye,
  History,
  Loader2,
  RotateCcw,
  Sparkles,
  X,
} from "lucide-react";
import { fetchWithAuth } from "@/components/providers/AuthProvider";
import {
  ROADMAP_GOAL_STATUSES,
  ROADMAP_SOURCE,
  ROADMAP_STATUS,
} from "@/constants";
import {
  GOAL_CATEGORY_META,
  GOAL_PRIORITY_META,
  GOAL_STATUS_META,
  semesterLabel,
} from "@/lib/roadmap-utils";
import type { IRoadmapDTO, IRoadmapHistorySummaryDTO } from "@/types";

function formatDateTimeVi(iso: string): string {
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) return iso;
  return parsed.toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function RoadmapHistoryPage() {
  const router = useRouter();
  const [versions, setVersions] = useState<IRoadmapHistorySummaryDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailRoadmap, setDetailRoadmap] = useState<IRoadmapDTO | null>(null);

  const [confirmRestoreId, setConfirmRestoreId] = useState<string | null>(null);
  const [restoringId, setRestoringId] = useState<string | null>(null);
  const [bannerMsg, setBannerMsg] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const loadHistory = useCallback(async (preferredSelectedId?: string) => {
    try {
      const res = await fetchWithAuth("/api/roadmap/history", {
        cache: "no-store",
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || "Không thể tải lịch sử lộ trình.");
        return;
      }
      const list: IRoadmapHistorySummaryDTO[] = data.versions || [];
      setVersions(list);
      if (preferredSelectedId) {
        setDetailLoading(true);
        setDetailRoadmap(null);
        setSelectedId(preferredSelectedId);
      } else if (list.length > 0) {
        setSelectedId((prev) => {
          const next = prev || list[0]._id;
          if (!prev) {
            setDetailLoading(true);
          }
          return next;
        });
      }
    } catch {
      setErrorMsg("Lỗi kết nối máy chủ khi tải lịch sử lộ trình.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await fetchWithAuth("/api/roadmap/history", {
          cache: "no-store",
        });
        const data = await res.json();
        if (!active) return;
        if (!res.ok) {
          setErrorMsg(data.error || "Không thể tải lịch sử lộ trình.");
          return;
        }
        const list: IRoadmapHistorySummaryDTO[] = data.versions || [];
        setVersions(list);
        if (list.length > 0) {
          setDetailLoading(true);
          setSelectedId(list[0]._id);
        }
      } catch {
        if (active) {
          setErrorMsg("Lỗi kết nối máy chủ khi tải lịch sử lộ trình.");
        }
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!selectedId) return;
    let active = true;
    (async () => {
      try {
        const res = await fetchWithAuth(`/api/roadmap/history/${selectedId}`, {
          cache: "no-store",
        });
        const data = await res.json();
        if (!active) return;
        if (res.ok && data.roadmap) {
          setDetailRoadmap(data.roadmap);
        }
      } catch {
        // Handled by empty detail state
      } finally {
        if (active) setDetailLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [selectedId]);

  const handleSelectVersion = (roadmapId: string) => {
    setDetailLoading(true);
    setDetailRoadmap(null);
    setSelectedId(roadmapId);
  };

  const handleRestore = async (roadmapId: string) => {
    setRestoringId(roadmapId);
    setBannerMsg(null);
    try {
      const res = await fetchWithAuth(
        `/api/roadmap/history/${roadmapId}/restore`,
        {
          method: "POST",
        }
      );
      const data = await res.json();
      if (!res.ok || !data.roadmap) {
        setBannerMsg({
          type: "error",
          text: data.error || "Không thể khôi phục lộ trình đã chọn.",
        });
        return;
      }
      setConfirmRestoreId(null);
      setBannerMsg({
        type: "success",
        text:
          data.message ||
          `Đã khôi phục thành phiên bản v${data.roadmap.version}.`,
      });
      await loadHistory(data.roadmap._id);
    } catch {
      setBannerMsg({
        type: "error",
        text: "Lỗi kết nối máy chủ khi khôi phục lộ trình.",
      });
    } finally {
      setRestoringId(null);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="flex min-h-[360px] flex-col items-center justify-center rounded-3xl border border-slate-200 bg-white">
          <Loader2 className="h-9 w-9 animate-spin text-[#102C8A]" />
          <p className="mt-3 text-sm text-slate-600">
            Đang tải lịch sử các phiên bản lộ trình...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-8 sm:px-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <Link
            href="/roadmap"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-[#102C8A] hover:underline"
          >
            <ArrowLeft className="h-4 w-4" />
            Quay lại Lộ trình hiện tại
          </Link>
          <h1 className="mt-2 flex items-center gap-2 text-2xl font-bold text-slate-900">
            <History className="h-6 w-6 text-[#102C8A]" />
            Lịch sử phiên bản Lộ trình
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Xem lại các phiên bản lộ trình đã tạo trước đây và khôi phục bản phù
            hợp nhất làm lộ trình chính thức.
          </p>
        </div>

        <button
          type="button"
          onClick={() => router.push("/roadmap")}
          className="inline-flex items-center gap-2 rounded-xl bg-[#102C8A] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0B2066]"
        >
          Về bảng lộ trình chính
        </button>
      </div>

      {bannerMsg && (
        <div
          className={`flex items-center justify-between rounded-2xl border px-4 py-3 text-sm font-medium ${
            bannerMsg.type === "error"
              ? "border-rose-200 bg-rose-50 text-rose-800"
              : "border-emerald-200 bg-emerald-50 text-emerald-800"
          }`}
        >
          <span>{bannerMsg.text}</span>
          <button
            type="button"
            onClick={() => setBannerMsg(null)}
            className="rounded-lg p-1 hover:bg-black/5"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {errorMsg ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-center text-sm text-rose-700">
          <AlertTriangle className="mx-auto mb-2 h-8 w-8 text-rose-600" />
          {errorMsg}
        </div>
      ) : versions.length === 0 ? (
        <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center">
          <History className="mx-auto h-10 w-10 text-slate-400" />
          <h2 className="mt-3 text-lg font-bold text-slate-900">
            Chưa có lịch sử phiên bản lộ trình
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Hãy hoàn thành đánh giá định hướng để AI tạo lộ trình đầu tiên cho
            bạn.
          </p>
          <Link
            href="/onboarding"
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#102C8A] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#0B2066]"
          >
            <Sparkles className="h-4 w-4" />
            Bắt đầu định hướng ngay
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Left sidebar: Version timeline */}
          <div className="space-y-3 lg:col-span-5">
            {versions.map((ver) => {
              const isSelected = selectedId === ver._id;
              const isActive = ver.status === ROADMAP_STATUS.ACTIVE;
              const isConfirming = confirmRestoreId === ver._id;
              const isRestoring = restoringId === ver._id;

              return (
                <div
                  key={ver._id}
                  className={`rounded-2xl border bg-white p-4 transition ${
                    isSelected
                      ? "border-[#102C8A] ring-2 ring-[#102C8A]/15"
                      : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <button
                      type="button"
                      onClick={() => handleSelectVersion(ver._id)}
                      className="min-w-0 flex-1 text-left"
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-lg bg-slate-900 px-2 py-0.5 text-xs font-bold text-white">
                          v{ver.version}
                        </span>
                        {isActive ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700">
                            <CheckCircle2 className="h-3 w-3" />
                            Đang dùng
                          </span>
                        ) : (
                          <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-medium text-slate-600">
                            Đã lưu trữ
                          </span>
                        )}
                        <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-medium text-[#102C8A]">
                          {ver.source === ROADMAP_SOURCE.RESTORED_FROM_HISTORY
                            ? "Khôi phục"
                            : "AI tạo mới"}
                        </span>
                      </div>

                      <h3 className="mt-2 line-clamp-2 text-sm font-bold text-slate-900">
                        {ver.title}
                      </h3>
                      <p className="mt-0.5 text-xs font-medium text-[#0D9488]">
                        {ver.orientationDirection}
                      </p>
                      <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                        <span className="inline-flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" />
                          {formatDateTimeVi(ver.createdAt)}
                        </span>
                        <span>
                          Tiến độ: {ver.completedGoals}/{ver.totalGoals} mục
                          tiêu ({ver.progressPercent}%)
                        </span>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSelectVersion(ver._id)}
                      className="rounded-xl border border-slate-200 p-2 text-slate-500 hover:text-[#102C8A]"
                      title="Xem chi tiết 4 năm"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                  </div>

                  {!isActive && (
                    <div className="mt-3 border-t border-slate-100 pt-3">
                      {isConfirming ? (
                        <div className="flex flex-col gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3">
                          <p className="text-xs font-medium text-amber-900">
                            Khôi phục bản v{ver.version} sẽ tạo phiên bản
                            ACTIVE mới từ bản sao này và lưu trữ lộ trình hiện
                            tại. Tiếp tục?
                          </p>
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              disabled={isRestoring}
                              onClick={() => setConfirmRestoreId(null)}
                              className="rounded-lg border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-700"
                            >
                              Hủy
                            </button>
                            <button
                              type="button"
                              disabled={isRestoring}
                              onClick={() => handleRestore(ver._id)}
                              className="inline-flex items-center gap-1.5 rounded-lg bg-[#102C8A] px-3 py-1 text-xs font-semibold text-white hover:bg-[#0B2066] disabled:opacity-60"
                            >
                              {isRestoring && (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              )}
                              Xác nhận khôi phục
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setConfirmRestoreId(ver._id)}
                          className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl border border-[#102C8A]/25 bg-blue-50/50 px-3 py-2 text-xs font-semibold text-[#102C8A] transition hover:bg-blue-100/70"
                        >
                          <RotateCcw className="h-3.5 w-3.5" />
                          Khôi phục lộ trình này
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Right column: Read-only 4-year inspection (RM13) */}
          <div className="lg:col-span-7">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs">
              {detailLoading ? (
                <div className="flex min-h-[300px] flex-col items-center justify-center">
                  <Loader2 className="h-7 w-7 animate-spin text-[#102C8A]" />
                  <p className="mt-2 text-sm text-slate-500">
                    Đang tải chi tiết phiên bản...
                  </p>
                </div>
              ) : !detailRoadmap ? (
                <div className="py-12 text-center text-sm text-slate-500">
                  Chọn một phiên bản bên trái để xem chi tiết cấu trúc 4 năm.
                </div>
              ) : (
                <div className="space-y-5">
                  <div className="border-b border-slate-100 pb-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="rounded-lg bg-[#102C8A] px-2.5 py-1 text-xs font-bold text-white">
                        Phiên bản v{detailRoadmap.version} · Chế độ chỉ đọc
                      </span>
                      <span className="text-xs font-semibold text-slate-600">
                        Tiến độ bản lưu: {detailRoadmap.progressPercent}%
                      </span>
                    </div>
                    <h2 className="mt-2 text-xl font-bold text-slate-900">
                      {detailRoadmap.title}
                    </h2>
                    <p className="mt-0.5 text-sm font-medium text-[#0D9488]">
                      {detailRoadmap.orientationDirection}
                    </p>
                  </div>

                  <div className="space-y-4">
                    {[...detailRoadmap.years]
                      .sort((a, b) => a.yearNumber - b.yearNumber)
                      .map((year) => (
                        <div
                          key={year.yearNumber}
                          className="rounded-2xl border border-slate-200/90 bg-slate-50/60 p-4"
                        >
                          <div className="mb-3">
                            <h3 className="text-sm font-bold text-slate-900">
                              Năm {year.yearNumber}: {year.title}
                            </h3>
                            <p className="text-xs text-slate-600">
                              {year.summary}
                            </p>
                          </div>

                          <div className="space-y-2">
                            {year.goals.length === 0 ? (
                              <p className="text-xs italic text-slate-500">
                                Không có mục tiêu trong năm này.
                              </p>
                            ) : (
                              [...year.goals]
                                .sort((a, b) => a.order - b.order)
                                .map((goal) => {
                                  const catMeta =
                                    GOAL_CATEGORY_META[goal.category];
                                  const prioMeta =
                                    GOAL_PRIORITY_META[goal.priority];
                                  const statusMeta =
                                    GOAL_STATUS_META[goal.status];
                                  const isDone =
                                    goal.status ===
                                    ROADMAP_GOAL_STATUSES.COMPLETED;

                                  return (
                                    <div
                                      key={goal.id}
                                      className="rounded-xl border border-slate-200 bg-white p-3"
                                    >
                                      <div className="flex flex-wrap items-start justify-between gap-2">
                                        <p
                                          className={`text-sm font-semibold ${
                                            isDone
                                              ? "line-through text-slate-500"
                                              : "text-slate-900"
                                          }`}
                                        >
                                          {goal.title}
                                        </p>
                                        <span
                                          className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${statusMeta.badgeClass}`}
                                        >
                                          {statusMeta.label}
                                        </span>
                                      </div>
                                      {goal.description && (
                                        <p className="mt-1 text-xs text-slate-600">
                                          {goal.description}
                                        </p>
                                      )}
                                      <div className="mt-2 flex flex-wrap gap-1.5">
                                        <span
                                          className={`rounded-full border px-2 py-0.5 text-[10px] font-medium ${catMeta.badgeClass}`}
                                        >
                                          {catMeta.label}
                                        </span>
                                        <span
                                          className={`rounded-full border px-2 py-0.5 text-[10px] font-medium ${prioMeta.badgeClass}`}
                                        >
                                          {prioMeta.label}
                                        </span>
                                        <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] text-slate-600">
                                          {semesterLabel(goal.semester)}
                                        </span>
                                      </div>
                                    </div>
                                  );
                                })
                            )}
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

