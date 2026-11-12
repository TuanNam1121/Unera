"use client";

import { Suspense, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  BarChart3,
  Edit3,
  ExternalLink,
  Eye,
  FolderKanban,
  GraduationCap,
  Loader2,
  Lock,
  Plus,
  Search,
  Sparkles,
  Trash2,
  Unlock,
  Users,
} from "lucide-react";
import { fetchWithAuth } from "@/components/providers/AuthProvider";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ACTIVITY_PUBLISH_STATUS } from "@/constants";
import {
  ACTIVITY_COMPUTED_STATUS_META,
  ACTIVITY_PUBLISH_STATUS_META,
  formatVietnamDate,
  getCategoryColorClasses,
} from "@/lib/activity-utils";
import { isSafeMediaUrl } from "@/lib/orientation-utils";
import type { IActivityCategoryDTO, IStudentActivitySummary } from "@/types";

function AdminActivitiesListContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const publishStatusParam = searchParams.get("publishStatus") || "";
  const categoryIdParam = searchParams.get("categoryId") || "";
  const queryQ = searchParams.get("q") || "";
  const page = Math.max(
    1,
    Number.parseInt(searchParams.get("page") || "1", 10) || 1
  );

  const [searchInput, setSearchInput] = useState(queryQ);
  const [prevQueryQ, setPrevQueryQ] = useState(queryQ);
  if (queryQ !== prevQueryQ) {
    setPrevQueryQ(queryQ);
    setSearchInput(queryQ);
  }
  const [items, setItems] = useState<IStudentActivitySummary[]>([]);
  const [categories, setCategories] = useState<IActivityCategoryDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [feedbackMsg, setFeedbackMsg] = useState<{
    type: "error" | "success";
    text: string;
  } | null>(null);
  const [reloadTick, setReloadTick] = useState(0);


  useEffect(() => {
    let cancelled = false;
    async function loadList() {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (publishStatusParam) params.set("publishStatus", publishStatusParam);
        if (categoryIdParam) params.set("categoryId", categoryIdParam);
        if (queryQ) params.set("q", queryQ);
        params.set("page", String(page));
        params.set("limit", "15");

        const res = await fetchWithAuth(
          `/api/admin/activities?${params.toString()}`,
          { cache: "no-store" }
        );
        const data = await res.json();
        if (!cancelled && res.ok) {
          setItems(Array.isArray(data.items) ? data.items : []);
          setCategories(
            Array.isArray(data.categories) ? data.categories : []
          );
          setTotal(data.pagination?.total || 0);
          setTotalPages(data.pagination?.totalPages || 0);
        }
      } catch {
        if (!cancelled) {
          setFeedbackMsg({
            type: "error",
            text: "Không thể tải danh sách hoạt động sinh viên.",
          });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    loadList();
    return () => {
      cancelled = true;
    };
  }, [publishStatusParam, categoryIdParam, queryQ, page, reloadTick]);

  const updateParams = (updates: Record<string, string | null>) => {
    const next = new URLSearchParams(searchParams.toString());
    for (const [k, v] of Object.entries(updates)) {
      if (!v) next.delete(k);
      else next.set(k, v);
    }
    if (!("page" in updates)) next.delete("page");
    const qs = next.toString();
    router.push(qs ? `/admin/activities?${qs}` : "/admin/activities");
  };

  const handleSeedSamples = async () => {
    setSeeding(true);
    setFeedbackMsg(null);
    try {
      const res = await fetchWithAuth("/api/admin/activities/seed", {
        method: "POST",
      });
      const data = await res.json();
      if (res.ok) {
        setFeedbackMsg({ type: "success", text: data.message });
        setReloadTick((t) => t + 1);
      } else {
        setFeedbackMsg({
          type: "error",
          text: data.error || "Không thể khởi tạo dữ liệu mẫu",
        });
      }
    } finally {
      setSeeding(false);
    }
  };

  const handleQuickPatch = async (
    activity: IStudentActivitySummary,
    patchBody: Record<string, unknown>,
    successLabel: string
  ) => {
    setBusyId(activity._id);
    setFeedbackMsg(null);
    try {
      const res = await fetchWithAuth(`/api/admin/activities/${activity._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...patchBody, version: activity.version }),
      });
      const data = await res.json();
      if (!res.ok) {
        const detailMessages =
          data.details && typeof data.details === "object"
            ? Object.values(data.details as Record<string, string[] | undefined>)
                .flat()
                .filter((msg): msg is string => Boolean(msg))
            : [];
        setFeedbackMsg({
          type: "error",
          text:
            detailMessages.length > 0
              ? `${data.error || "Không thể cập nhật"}: ${detailMessages.join(" · ")}`
              : data.error || "Không thể cập nhật trạng thái.",
        });
        if (res.status === 409) setReloadTick((t) => t + 1);
        return;
      }
      setFeedbackMsg({ type: "success", text: successLabel });
      setReloadTick((t) => t + 1);
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (activity: IStudentActivitySummary) => {
    const followerNote =
      activity.followerCount > 0
        ? `\n\nCảnh báo: Hoạt động này hiện có ${activity.followerCount} sinh viên đang theo dõi.`
        : "";
    if (
      !window.confirm(
        `Bạn có chắc muốn xóa vĩnh viễn hoạt động "${activity.title}"? Media không còn dùng sẽ được dọn dẹp.${followerNote}`
      )
    ) {
      return;
    }

    setBusyId(activity._id);
    setFeedbackMsg(null);
    try {
      const res = await fetchWithAuth(`/api/admin/activities/${activity._id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (res.ok) {
        setFeedbackMsg({ type: "success", text: data.message });
        setReloadTick((t) => t + 1);
      } else {
        setFeedbackMsg({
          type: "error",
          text: data.error || "Không thể xóa hoạt động.",
        });
      }
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="mx-auto w-full max-w-7xl px-6 sm:px-8 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5 text-blue-600" />
            <h1 className="text-xl font-bold text-slate-900">
              Quản trị Hoạt động Sinh viên ({total})
            </h1>
          </div>
          <p className="text-xs text-slate-500">
            Soạn thảo nội dung bằng Tiptap Block Editor, quản lý hạn chót đăng ký và theo dõi tương tác sinh viên.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            href="/admin/activities/categories"
            className={buttonVariants({
              variant: "outline",
              size: "sm",
              className: "rounded-xl",
            })}
          >
            <FolderKanban className="mr-1.5 h-4 w-4" />
            Danh mục
          </Link>
          <Link
            href="/admin/activities/statistics"
            className={buttonVariants({
              variant: "outline",
              size: "sm",
              className: "rounded-xl",
            })}
          >
            <BarChart3 className="mr-1.5 h-4 w-4" />
            Thống kê
          </Link>
          {total === 0 && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={seeding}
              onClick={handleSeedSamples}
              className="rounded-xl"
            >
              {seeding ? (
                <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="mr-1.5 h-4 w-4" />
              )}
              Nạp dữ liệu mẫu
            </Button>
          )}
          <Link
            href="/admin/activities/new"
            className={buttonVariants({
              size: "sm",
              className: "rounded-xl bg-blue-600 hover:bg-blue-700",
            })}
          >
            <Plus className="mr-1.5 h-4 w-4" />
            Tạo hoạt động mới
          </Link>
        </div>
      </div>

      {/* Filters */}
      <Card className="rounded-2xl border-slate-200/80 bg-white shadow-2xs">
        <CardContent className="p-4 flex flex-wrap items-center justify-between gap-3">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              updateParams({ q: searchInput.trim() || null });
            }}
            className="flex flex-1 min-w-[240px] max-w-md items-center gap-2"
          >
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Tìm theo tiêu đề, đơn vị tổ chức, nội dung..."
                className="pl-9 text-xs"
              />
            </div>
            <Button type="submit" size="sm" variant="outline" className="rounded-xl">
              Tìm
            </Button>
          </form>

          <div className="flex flex-wrap items-center gap-2.5">
            <select
              value={categoryIdParam}
              onChange={(e) =>
                updateParams({ categoryId: e.target.value || null })
              }
              className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700"
            >
              <option value="">Tất cả danh mục</option>
              {categories.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name}
                </option>
              ))}
            </select>

            <select
              value={publishStatusParam}
              onChange={(e) =>
                updateParams({ publishStatus: e.target.value || null })
              }
              className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700"
            >
              <option value="">Tất cả trạng thái xuất bản</option>
              <option value={ACTIVITY_PUBLISH_STATUS.PUBLISHED}>
                Đã xuất bản (PUBLISHED)
              </option>
              <option value={ACTIVITY_PUBLISH_STATUS.DRAFT}>
                Bản nháp (DRAFT)
              </option>
              <option value={ACTIVITY_PUBLISH_STATUS.UNPUBLISHED}>
                Đã ẩn (UNPUBLISHED)
              </option>
            </select>
          </div>
        </CardContent>
      </Card>

      {feedbackMsg && (
        <div
          className={`rounded-xl border px-4 py-3 text-xs font-medium ${
            feedbackMsg.type === "error"
              ? "border-red-200 bg-red-50 text-red-700"
              : "border-emerald-200 bg-emerald-50 text-emerald-700"
          }`}
        >
          {feedbackMsg.text}
        </div>
      )}

      {/* Table */}
      <Card className="rounded-2xl border-slate-200/80 bg-white shadow-xs overflow-hidden">
        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          </div>
        ) : items.length === 0 ? (
          <div className="py-16 text-center space-y-3 px-6">
            <GraduationCap className="h-10 w-10 text-slate-300 mx-auto" />
            <p className="text-sm font-semibold text-slate-700">
              Chưa có hoạt động sinh viên nào phù hợp
            </p>
            <div className="flex items-center justify-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleSeedSamples}
                disabled={seeding}
                className="rounded-xl"
              >
                Nạp 6 hoạt động mẫu
              </Button>
              <Link
                href="/admin/activities/new"
                className={buttonVariants({ size: "sm", className: "rounded-xl" })}
              >
                + Tạo hoạt động mới
              </Link>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/70 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="py-3.5 px-4">Hoạt động</th>
                  <th className="py-3.5 px-4">Danh mục &amp; Trạng thái</th>
                  <th className="py-3.5 px-4">Mốc thời gian</th>
                  <th className="py-3.5 px-4">Tương tác</th>
                  <th className="py-3.5 px-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {items.map((item) => {
                  const pubMeta =
                    ACTIVITY_PUBLISH_STATUS_META[item.publishStatus];
                  const compMeta =
                    ACTIVITY_COMPUTED_STATUS_META[item.computedStatus];
                  const catColors = getCategoryColorClasses(
                    item.category?.colorToken
                  );
                  const isBusy = busyId === item._id;

                  return (
                    <tr
                      key={item._id}
                      className="hover:bg-slate-50/70 transition-colors"
                    >
                      <td className="py-3.5 px-4 max-w-sm">
                        <div className="flex items-start gap-3">
                          <div className="relative h-12 w-16 shrink-0 overflow-hidden rounded-lg bg-slate-100 border border-slate-200/80">
                            {item.coverImage && isSafeMediaUrl(item.coverImage) ? (
                              <Image
                                src={item.coverImage}
                                alt={item.title}
                                fill
                                unoptimized
                                className="object-cover"
                              />
                            ) : (
                              <div
                                className={`h-full w-full bg-gradient-to-br ${catColors.gradientClass} flex items-center justify-center text-white`}
                              >
                                <GraduationCap className="h-4 w-4" />
                              </div>
                            )}
                          </div>
                          <div className="min-w-0 space-y-0.5">
                            <Link
                              href={`/admin/activities/${item._id}/edit`}
                              className="font-bold text-slate-900 hover:text-blue-600 line-clamp-1"
                            >
                              {item.title}
                            </Link>
                            <p className="text-[11px] text-slate-400 truncate">
                              /{item.slug} · v{item.version}
                            </p>
                            {item.organizer && (
                              <p className="text-[11px] text-slate-500 truncate">
                                {item.organizer}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 space-y-1.5">
                        {item.category && (
                          <div>
                            <span
                              className={`inline-block rounded-md border px-2 py-0.5 text-[10px] font-semibold ${catColors.pillClass}`}
                            >
                              {item.category.name}
                            </span>
                          </div>
                        )}
                        <div className="flex flex-wrap gap-1">
                          <span
                            className={`inline-block rounded-full border px-2 py-0.5 text-[10px] font-semibold ${pubMeta.badgeClass}`}
                          >
                            {pubMeta.label}
                          </span>
                          <span
                            className={`inline-block rounded-full border px-2 py-0.5 text-[10px] font-semibold ${compMeta.badgeClass}`}
                          >
                            {compMeta.shortLabel}
                          </span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-[11px] text-slate-600 space-y-1 whitespace-nowrap">
                        <p>
                          Hạn ĐK:{" "}
                          <span className="font-semibold text-slate-800">
                            {formatVietnamDate(item.deadline)}
                          </span>
                        </p>
                        <p>
                          Sự kiện:{" "}
                          <span className="font-medium">
                            {formatVietnamDate(item.eventDate)}
                          </span>
                        </p>
                      </td>

                      <td className="py-3.5 px-4 text-[11px] text-slate-600 space-y-1 whitespace-nowrap">
                        <p className="flex items-center gap-1 font-semibold text-slate-800">
                          <Users className="h-3.5 w-3.5 text-blue-500" />
                          {item.followerCount} quan tâm
                        </p>
                        <p className="flex items-center gap-1 text-slate-500">
                          <Eye className="h-3.5 w-3.5 text-slate-400" />
                          {item.viewCount} lượt xem
                        </p>
                      </td>

                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={isBusy}
                            onClick={() =>
                              handleQuickPatch(
                                item,
                                {
                                  publishStatus:
                                    item.publishStatus ===
                                    ACTIVITY_PUBLISH_STATUS.PUBLISHED
                                      ? ACTIVITY_PUBLISH_STATUS.UNPUBLISHED
                                      : ACTIVITY_PUBLISH_STATUS.PUBLISHED,
                                },
                                item.publishStatus ===
                                  ACTIVITY_PUBLISH_STATUS.PUBLISHED
                                  ? "Đã ẩn hoạt động"
                                  : "Đã xuất bản hoạt động"
                              )
                            }
                            className="h-8 rounded-lg px-2.5 text-[11px]"
                            title={
                              item.publishStatus ===
                              ACTIVITY_PUBLISH_STATUS.PUBLISHED
                                ? "Ẩn bài"
                                : "Xuất bản"
                            }
                          >
                            {item.publishStatus ===
                            ACTIVITY_PUBLISH_STATUS.PUBLISHED
                              ? "Ẩn bài"
                              : "Xuất bản"}
                          </Button>

                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={isBusy}
                            onClick={() =>
                              handleQuickPatch(
                                item,
                                { manualClosed: !item.manualClosed },
                                !item.manualClosed
                                  ? "Đã đóng đăng ký thủ công"
                                  : "Đã mở lại đăng ký"
                              )
                            }
                            className="h-8 rounded-lg px-2 text-[11px]"
                            title={
                              item.manualClosed
                                ? "Mở lại đăng ký"
                                : "Đóng đăng ký thủ công"
                            }
                          >
                            {item.manualClosed ? (
                              <Unlock className="h-3.5 w-3.5 text-emerald-600" />
                            ) : (
                              <Lock className="h-3.5 w-3.5 text-amber-600" />
                            )}
                          </Button>

                          {item.publishStatus ===
                            ACTIVITY_PUBLISH_STATUS.PUBLISHED && (
                            <Link
                              href={`/activities/${item.slug}`}
                              target="_blank"
                              className={buttonVariants({
                                variant: "outline",
                                size: "sm",
                                className: "h-8 rounded-lg px-2",
                              })}
                              title="Xem công khai"
                            >
                              <ExternalLink className="h-3.5 w-3.5" />
                            </Link>
                          )}

                          <Link
                            href={`/admin/activities/${item._id}/edit`}
                            className={buttonVariants({
                              variant: "outline",
                              size: "sm",
                              className: "h-8 rounded-lg px-2.5 text-[11px]",
                            })}
                          >
                            <Edit3 className="mr-1 h-3.5 w-3.5" />
                            Sửa
                          </Link>

                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={isBusy}
                            onClick={() => handleDelete(item)}
                            className="h-8 rounded-lg px-2 text-red-600 hover:bg-red-50 border-red-200"
                            title="Xóa hoạt động"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => updateParams({ page: String(page - 1) })}
            className="rounded-xl"
          >
            Trang trước
          </Button>
          <span className="px-3 text-xs font-semibold text-slate-600">
            Trang {page} / {totalPages}
          </span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => updateParams({ page: String(page + 1) })}
            className="rounded-xl"
          >
            Trang sau
          </Button>
        </div>
      )}
    </div>
  );
}

export default function AdminActivitiesPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-96 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      }
    >
      <AdminActivitiesListContent />
    </Suspense>
  );
}
