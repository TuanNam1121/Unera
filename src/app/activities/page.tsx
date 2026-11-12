"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  BellRing,
  BookmarkCheck,
  GraduationCap,
  Loader2,
  Lock,
  Search,
  Sparkles,
  X,
} from "lucide-react";
import { ActivityCard } from "@/components/activities/ActivityCard";
import { Pagination } from "@/components/common/Pagination";
import { fetchWithAuth, useAuth } from "@/components/providers/AuthProvider";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ACTIVITY_COMPUTED_STATUS } from "@/constants";
import type { IActivityCategoryDTO, IStudentActivitySummary } from "@/types";

const STATUS_FILTER_OPTIONS = [
  { value: "", label: "Tất cả trạng thái" },
  { value: ACTIVITY_COMPUTED_STATUS.OPEN, label: "Đang mở đăng ký" },
  { value: ACTIVITY_COMPUTED_STATUS.CLOSING_SOON, label: "Sắp đóng đơn (≤ 7 ngày)" },
  { value: ACTIVITY_COMPUTED_STATUS.EVENT_SOON, label: "Sự kiện sắp diễn ra" },
  { value: ACTIVITY_COMPUTED_STATUS.UPCOMING_OPEN, label: "Sắp mở đơn" },
  { value: ACTIVITY_COMPUTED_STATUS.CLOSED, label: "Đã đóng đăng ký" },
  { value: ACTIVITY_COMPUTED_STATUS.EXPIRED, label: "Đã kết thúc" },
];

const SORT_OPTIONS = [
  { value: "deadline_asc", label: "Hạn đăng ký gần nhất" },
  { value: "event_asc", label: "Sự kiện sắp diễn ra" },
  { value: "popular", label: "Nhiều người quan tâm nhất" },
  { value: "newest", label: "Mới xuất bản" },
];

function StudentActivitiesFeedContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading: authLoading } = useAuth();

  const tab = (searchParams.get("tab") || "all").toLowerCase() === "followed"
    ? "followed"
    : "all";
  const categoryParam =
    searchParams.get("category") || searchParams.get("type") || "";
  const queryQ = searchParams.get("q") || "";
  const statusParam = searchParams.get("status") || "";
  const isDomesticParam = searchParams.get("isDomestic") || "";
  const sortParam = searchParams.get("sort") || "deadline_asc";
  const page = Math.max(
    1,
    Number.parseInt(searchParams.get("page") || "1", 10) || 1
  );

  const requestKey = `${tab}|${categoryParam}|${queryQ}|${statusParam}|${isDomesticParam}|${sortParam}|${page}`;

  const [searchInput, setSearchInput] = useState(queryQ);
  const [prevQueryQ, setPrevQueryQ] = useState(queryQ);
  const [prevRequestKey, setPrevRequestKey] = useState(requestKey);
  const [categories, setCategories] = useState<IActivityCategoryDTO[]>([]);
  const [items, setItems] = useState<IStudentActivitySummary[]>([]);
  const [followedCount, setFollowedCount] = useState(0);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [requiresLogin, setRequiresLogin] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [feedbackError, setFeedbackError] = useState("");
  const [reloadTick, setReloadTick] = useState(0);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  if (queryQ !== prevQueryQ) {
    setPrevQueryQ(queryQ);
    setSearchInput(queryQ);
  }

  if (requestKey !== prevRequestKey) {
    setPrevRequestKey(requestKey);
    setLoading(true);
  }

  const updateUrlParams = useCallback(
    (updates: Record<string, string | null>) => {
      const next = new URLSearchParams(searchParams.toString());
      // Canonicalize legacy `type` alias into `category`
      if ("category" in updates) {
        next.delete("type");
      }
      for (const [key, value] of Object.entries(updates)) {
        if (!value) {
          next.delete(key);
        } else {
          next.set(key, value);
        }
      }
      if (!("page" in updates)) {
        next.delete("page");
      }
      const qs = next.toString();
      router.replace(qs ? `/activities?${qs}` : "/activities", { scroll: false });
    },
    [router, searchParams]
  );

  // Debounced live search 300ms
  useEffect(() => {
    const trimmed = searchInput.trim();
    if (trimmed === queryQ) return;

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      updateUrlParams({ q: trimmed || null });
    }, 300);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [searchInput, queryQ, updateUrlParams]);

  useEffect(() => {
    const controller = new AbortController();

    async function loadActivities() {
      if (tab === "followed" && authLoading) return;

      try {
        const params = new URLSearchParams();
        params.set("tab", tab);
        if (categoryParam) params.set("category", categoryParam);
        if (queryQ) params.set("q", queryQ);
        if (statusParam) params.set("status", statusParam);
        if (isDomesticParam) params.set("isDomestic", isDomesticParam);
        params.set("sort", sortParam);
        params.set("page", String(page));
        params.set("limit", "12");

        const res = await fetchWithAuth(`/api/activities?${params.toString()}`, {
          cache: "no-store",
          signal: controller.signal,
        });

        if (res.status === 401 && tab === "followed") {
          if (!controller.signal.aborted) {
            setRequiresLogin(true);
            setItems([]);
            setTotal(0);
            setTotalPages(0);
          }
          return;
        }

        const data = await res.json();
        if (!controller.signal.aborted && res.ok) {
          setRequiresLogin(false);
          setFeedbackError("");
          setItems(Array.isArray(data.items) ? data.items : []);
          if (Array.isArray(data.categories)) {
            setCategories(data.categories);
          }
          setFollowedCount(
            typeof data.followedCount === "number" ? data.followedCount : 0
          );
          setTotal(data.pagination?.total || 0);
          setTotalPages(data.pagination?.totalPages || 0);
        }
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") {
          return;
        }
        if (!controller.signal.aborted) {
          setFeedbackError("Không thể tải danh sách hoạt động sinh viên.");
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    void loadActivities();
    return () => {
      controller.abort();
    };
  }, [
    tab,
    categoryParam,
    queryQ,
    statusParam,
    isDomesticParam,
    sortParam,
    page,
    authLoading,
    reloadTick,
  ]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    const trimmed = searchInput.trim() || null;
    if ((trimmed || "") !== queryQ) {
      setLoading(true);
    }
    updateUrlParams({ q: trimmed });
  };

  const handleToggleFollow = async (
    activityId: string,
    currentlyFollowed: boolean
  ) => {
    if (!user) {
      router.push(
        `/login?callbackUrl=${encodeURIComponent(
          `/activities${searchParams.toString() ? `?${searchParams.toString()}` : ""}`
        )}`
      );
      return;
    }

    setTogglingId(activityId);
    setFeedbackError("");
    try {
      const res = await fetchWithAuth(`/api/activities/${activityId}/follow`, {
        method: currentlyFollowed ? "DELETE" : "POST",
      });
      const data = await res.json();
      if (!res.ok) {
        setFeedbackError(data.error || "Không thể cập nhật trạng thái quan tâm.");
        return;
      }

      if (tab === "followed" && !data.isFollowed) {
        setReloadTick((t) => t + 1);
      } else {
        setItems((prev) =>
          prev.map((item) =>
            item._id === activityId
              ? {
                  ...item,
                  isFollowedByMe: Boolean(data.isFollowed),
                  followerCount:
                    typeof data.followerCount === "number"
                      ? data.followerCount
                      : item.followerCount,
                }
              : item
          )
        );
        setFollowedCount((prev) =>
          data.isFollowed ? prev + (currentlyFollowed ? 0 : 1) : Math.max(0, prev - 1)
        );
      }
    } catch {
      setFeedbackError("Lỗi kết nối khi cập nhật trạng thái quan tâm.");
    } finally {
      setTogglingId(null);
    }
  };

  const hasActiveFilters = Boolean(
    categoryParam || queryQ || statusParam || isDomesticParam
  );

  return (
    <div className="w-full px-3 sm:px-4 lg:px-5 py-4 sm:py-5 space-y-5">
      {/* Header Banner */}
      <div className="rounded-3xl border border-blue-200/70 bg-gradient-to-br from-blue-50 via-white to-indigo-50/70 p-4 sm:p-6 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
          <div className="space-y-2 max-w-2xl">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-100/80 px-3 py-1 text-[11px] font-bold text-blue-700 uppercase tracking-wider">
              <GraduationCap className="h-3.5 w-3.5" />
              Hoạt động sinh viên &amp; Học bổng
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
              Khám phá Cuộc thi, NCKH, Học bổng &amp; Sự kiện
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Theo dõi các hoạt động sinh viên nổi bật, xem hạn chót đăng ký theo thời gian thực và nhấn{" "}
              <span className="font-semibold text-blue-700">Quan tâm</span> để lưu vào danh sách nhắc lịch cá nhân.
            </p>
          </div>

          {/* Search Form */}
          <form
            onSubmit={handleSearchSubmit}
            className="flex w-full lg:w-96 items-center gap-2"
          >
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Tìm tên cuộc thi, học bổng, đơn vị..."
                className="pl-9 pr-8 bg-white rounded-xl border-slate-200 text-xs sm:text-sm"
              />
              {searchInput && (
                <button
                  type="button"
                  aria-label="Xóa từ khóa"
                  onClick={() => {
                    if (debounceTimerRef.current) {
                      clearTimeout(debounceTimerRef.current);
                    }
                    setSearchInput("");
                    if (queryQ) {
                      setLoading(true);
                      updateUrlParams({ q: null });
                    }
                  }}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
            <Button type="submit" className="rounded-xl shrink-0">
              Tìm
            </Button>
          </form>
        </div>

        {/* Main View Tabs */}
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-slate-200/70 pt-4">
          <div className="inline-flex rounded-xl bg-slate-100 p-1">
            <button
              type="button"
              onClick={() => updateUrlParams({ tab: null })}
              className={`rounded-lg px-4 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
                tab === "all"
                  ? "bg-white text-blue-700 shadow-2xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Tất cả hoạt động
            </button>
            <button
              type="button"
              onClick={() => updateUrlParams({ tab: "followed" })}
              className={`inline-flex items-center gap-1.5 rounded-lg px-4 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
                tab === "followed"
                  ? "bg-white text-blue-700 shadow-2xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <BookmarkCheck className="h-3.5 w-3.5" />
              <span>Hoạt động đã quan tâm</span>
              <span
                className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                  tab === "followed"
                    ? "bg-blue-100 text-blue-700"
                    : "bg-slate-200 text-slate-600"
                }`}
              >
                {followedCount}
              </span>
            </button>
          </div>

          <span className="text-xs font-medium text-slate-500">
            Hiển thị <strong className="text-slate-800">{total}</strong> hoạt động
          </span>
        </div>
      </div>

      {/* Reminder Shortcut Banner on Followed Tab */}
      {tab === "followed" && !requiresLogin && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-amber-200 bg-amber-50/70 px-5 py-3.5">
          <div className="flex items-start sm:items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
              <BellRing className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900">
                Nhắc nhở tự động cho các hoạt động đã quan tâm
              </p>
              <p className="text-[11px] text-slate-600">
                Hệ thống gửi thông báo trước mốc 30 ngày, 7 ngày và 1 ngày trước hạn đóng đơn hoặc ngày diễn ra sự kiện.
              </p>
            </div>
          </div>
          <Link
            href="/notifications"
            className={buttonVariants({
              variant: "outline",
              size: "sm",
              className: "shrink-0 rounded-xl bg-white text-xs",
            })}
          >
            Xem Trung tâm Thông báo
          </Link>
        </div>
      )}

      {/* Category Pills + Filter Toolbar */}
      <div className="space-y-3">
        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <button
            type="button"
            onClick={() => updateUrlParams({ category: null })}
            className={`shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
              !categoryParam
                ? "border-blue-600 bg-blue-600 text-white shadow-2xs"
                : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
            }`}
          >
            Tất cả danh mục
          </button>
          {categories.map((cat) => {
            const active = categoryParam === cat.slug || categoryParam === cat._id;
            return (
              <button
                key={cat._id}
                type="button"
                onClick={() => updateUrlParams({ category: cat.slug })}
                className={`shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
                  active
                    ? "border-blue-600 bg-blue-600 text-white shadow-2xs"
                    : "border-slate-200 bg-white text-slate-600 hover:border-blue-200 hover:text-blue-700"
                }`}
              >
                {cat.name}
              </button>
            );
          })}
        </div>

        {/* Secondary Filter Selectors */}
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200/80 bg-white px-4 py-3 shadow-2xs">
          <div className="flex flex-wrap items-center gap-2.5">
            <select
              aria-label="Lọc theo trạng thái"
              value={statusParam}
              onChange={(e) =>
                updateUrlParams({ status: e.target.value || null })
              }
              className="rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-1.5 text-xs font-medium text-slate-700 focus:border-blue-500 focus:outline-none"
            >
              {STATUS_FILTER_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>

            <select
              aria-label="Lọc theo phạm vi"
              value={isDomesticParam}
              onChange={(e) =>
                updateUrlParams({ isDomestic: e.target.value || null })
              }
              className="rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-1.5 text-xs font-medium text-slate-700 focus:border-blue-500 focus:outline-none"
            >
              <option value="">Tất cả phạm vi</option>
              <option value="true">Trong nước</option>
              <option value="false">Quốc tế</option>
            </select>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={() => {
                  setSearchInput("");
                  router.push(tab === "followed" ? "/activities?tab=followed" : "/activities");
                }}
                className="inline-flex items-center gap-1 rounded-xl border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-500 hover:bg-slate-100 hover:text-slate-800 cursor-pointer"
              >
                <X className="h-3.5 w-3.5" />
                Xóa bộ lọc
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-medium text-slate-400">
              Sắp xếp:
            </span>
            <select
              aria-label="Sắp xếp hoạt động"
              value={sortParam}
              onChange={(e) => updateUrlParams({ sort: e.target.value })}
              className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 focus:border-blue-500 focus:outline-none"
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {feedbackError && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-medium text-red-700">
          {feedbackError}
        </div>
      )}

      {/* Results Area */}
      {requiresLogin ? (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-slate-200 bg-white py-14 px-6 text-center shadow-2xs">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 mb-3">
            <Lock className="h-6 w-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900">
            Đăng nhập để xem Hoạt động đã quan tâm
          </h3>
          <p className="mt-1 max-w-md text-xs text-slate-500">
            Lưu giữ danh sách cuộc thi, NCKH, học bổng bạn quan tâm và nhận thông báo nhắc hạn tự động trước khi đóng đơn.
          </p>
          <Link
            href="/login?callbackUrl=%2Factivities%3Ftab%3Dfollowed"
            className={buttonVariants({ className: "mt-4 rounded-xl" })}
          >
            Đăng nhập ngay
          </Link>
        </div>
      ) : loading ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-white py-14 px-6 text-center">
          <Sparkles className="h-9 w-9 text-slate-300 mb-3" />
          <h3 className="text-sm font-bold text-slate-800">
            {tab === "followed"
              ? "Bạn chưa quan tâm hoạt động nào"
              : "Không tìm thấy hoạt động sinh viên phù hợp"}
          </h3>
          <p className="mt-1 max-w-md text-xs text-slate-500">
            {tab === "followed"
              ? "Khám phá danh sách hoạt động và nhấn nút Quan tâm để theo dõi lịch nộp hồ sơ và lịch diễn ra."
              : "Thử thay đổi từ khóa tìm kiếm, danh mục hoặc trạng thái lọc."}
          </p>
          {tab === "followed" ? (
            <Button
              type="button"
              onClick={() => updateUrlParams({ tab: null })}
              className="mt-4 rounded-xl"
            >
              Khám phá tất cả hoạt động
            </Button>
          ) : null}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {items.map((activity) => (
              <ActivityCard
                key={activity._id}
                activity={activity}
                onToggleFollow={handleToggleFollow}
                togglingFollow={togglingId === activity._id}
              />
            ))}
          </div>

          <Pagination
            page={page}
            totalPages={totalPages}
            totalItems={total}
            itemLabel="hoạt động"
            onPageChange={(nextPage) =>
              updateUrlParams({ page: String(nextPage) })
            }
          />
        </>
      )}
    </div>
  );
}

export default function StudentActivitiesPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-96 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      }
    >
      <StudentActivitiesFeedContent />
    </Suspense>
  );
}
