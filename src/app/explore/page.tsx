"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Search,
  Bookmark,
  CalendarPlus,
  Check,
  Building2,
  GraduationCap,
  Trophy,
  Microscope,
  Award,
  Users,
  Compass,
  ArrowRight,
  Filter,
  CheckCircle2,
} from "lucide-react";
import { OPPORTUNITY_CATEGORIES } from "@/constants";
import { cn, formatDate } from "@/lib/utils";

interface OpportunityItem {
  _id: string;
  title: string;
  description: string;
  category: string;
  location?: string;
  isDomestic: boolean;
  deadline?: string | null;
  isSponsored: boolean;
}

export default function ExplorePage() {
  const [opportunities, setOpportunities] = useState<OpportunityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [locationFilter, setLocationFilter] = useState<"all" | "domestic" | "international">("all");

  // Local state tracking saved and in-calendar IDs
  const [savedIds, setSavedIds] = useState<Record<string, boolean>>({});
  const [calendarIds, setCalendarIds] = useState<Record<string, boolean>>({});
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const categories = [
    { id: "all", label: "Tất cả cơ hội", icon: Compass },
    { ...OPPORTUNITY_CATEGORIES.STUDY_ABROAD, icon: GraduationCap },
    { ...OPPORTUNITY_CATEGORIES.MULTINATIONAL, icon: Building2 },
    { ...OPPORTUNITY_CATEGORIES.MANAGEMENT_TRAINEE, icon: Award },
    { ...OPPORTUNITY_CATEGORIES.SCIENTIFIC_RESEARCH, icon: Microscope },
    { ...OPPORTUNITY_CATEGORIES.COMPETITIONS, icon: Trophy },
    { ...OPPORTUNITY_CATEGORIES.AMBASSADOR_PROGRAMS, icon: Users },
  ];

  const fetchOpportunities = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (activeCategory !== "all") params.set("category", activeCategory);
      if (searchQuery.trim()) params.set("q", searchQuery.trim());
      if (locationFilter === "domestic") params.set("isDomestic", "true");
      if (locationFilter === "international") params.set("isDomestic", "false");

      const res = await fetch(`/api/opportunities?${params.toString()}`);
      const data = await res.json();
      if (data.items) {
        setOpportunities(data.items);
      }
    } catch {
      // Fallback empty
    } finally {
      setLoading(false);
    }
  }, [activeCategory, searchQuery, locationFilter]);

  // Fetch saved and calendar status
  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const [savedRes, calRes] = await Promise.all([
          fetch("/api/saved"),
          fetch("/api/calendar"),
        ]);
        if (savedRes.ok) {
          const savedData = await savedRes.json();
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const map: Record<string, boolean> = {};
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          savedData.saved?.forEach((s: any) => {
            const id = s.opportunityId?._id || s.opportunityId;
            if (id) map[id] = true;
          });
          setSavedIds(map);
        }
        if (calRes.ok) {
          const calData = await calRes.json();
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const map: Record<string, boolean> = {};
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          calData.entries?.forEach((e: any) => {
            const id = e.opportunityId?._id || e.opportunityId;
            if (id) map[id] = true;
          });
          setCalendarIds(map);
        }
      } catch {
        // Not signed in or offline
      }
    };
    fetchStatus();
  }, []);

  useEffect(() => {
    fetchOpportunities();
  }, [fetchOpportunities]);

  const handleToggleSave = async (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    const isSaved = savedIds[id];
    setSavedIds((prev) => ({ ...prev, [id]: !isSaved }));

    try {
      if (isSaved) {
        await fetch(`/api/saved?opportunityId=${id}`, { method: "DELETE" });
        showToast("Đã bỏ lưu cơ hội");
      } else {
        await fetch("/api/saved", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ opportunityId: id }),
        });
        showToast("Đã lưu cơ hội vào danh sách của bạn");
      }
    } catch {
      setSavedIds((prev) => ({ ...prev, [id]: isSaved }));
    }
  };

  const handleAddToCalendar = async (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    if (calendarIds[id]) {
      showToast("Cơ hội này đã có trong lịch của bạn");
      return;
    }

    setCalendarIds((prev) => ({ ...prev, [id]: true }));
    try {
      const res = await fetch("/api/calendar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ opportunityId: id }),
      });
      if (res.ok) {
        showToast("Đã thêm vào lịch! Bạn sẽ nhận thông báo hạn chót trước 7, 3 và 1 ngày.");
      }
    } catch {
      setCalendarIds((prev) => ({ ...prev, [id]: false }));
    }
  };

  return (
    <div className="w-full px-6 sm:px-8 py-6 space-y-7">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-xl bg-slate-900 text-white px-4 py-3 text-xs font-medium shadow-xl shadow-slate-900/20 border border-slate-800 animate-in fade-in slide-in-from-bottom-3 duration-200">
          <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 1. HEADER */}
      <div className="space-y-1">
        <span className="text-[11px] font-semibold tracking-wider text-blue-600 uppercase">
          TRUNG TÂM CƠ HỘI SINH VIÊN
        </span>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          Khám phá Cơ hội Phát triển
        </h1>
        <p className="text-xs sm:text-sm text-slate-500">
          Tổng hợp thông tin học bổng, thực tập, nghiên cứu khoa học và cuộc thi đã được kiểm duyệt chính thức.
        </p>
      </div>

      {/* 2. CATEGORY PILLS */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {categories.map((cat) => {
          const isSelected = activeCategory === cat.id;
          const Icon = cat.icon;
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => setActiveCategory(cat.id)}
              className={cn(
                "flex items-center gap-2 rounded-full px-4 py-2 text-xs font-medium transition-all whitespace-nowrap shadow-2xs",
                isSelected
                  ? "bg-blue-600 text-white font-semibold shadow-blue-500/20"
                  : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-50"
              )}
            >
              <Icon className={cn("h-3.5 w-3.5", isSelected ? "text-white" : "text-slate-400")} />
              <span>{cat.label}</span>
            </button>
          );
        })}
      </div>

      {/* 3. SEARCH & FILTERS BAR */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-white p-3 rounded-2xl border border-slate-200/90 shadow-2xs">
        {/* Search input */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm theo tên học bổng, tập đoàn, vị trí thực tập, kỹ năng..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50/60 py-2 pl-10 pr-4 text-xs text-slate-800 placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all"
          />
        </div>

        {/* Location selector toggle */}
        <div className="flex items-center gap-1.5 self-end sm:self-auto">
          <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1 mr-1">
            <Filter className="h-3 w-3" /> Phạm vi:
          </span>
          <button
            type="button"
            onClick={() => setLocationFilter("all")}
            className={cn(
              "rounded-lg px-2.5 py-1 text-xs font-medium transition-colors",
              locationFilter === "all"
                ? "bg-blue-50 text-blue-700 font-semibold"
                : "text-slate-500 hover:bg-slate-100"
            )}
          >
            Tất cả
          </button>
          <button
            type="button"
            onClick={() => setLocationFilter("domestic")}
            className={cn(
              "rounded-lg px-2.5 py-1 text-xs font-medium transition-colors",
              locationFilter === "domestic"
                ? "bg-blue-50 text-blue-700 font-semibold"
                : "text-slate-500 hover:bg-slate-100"
            )}
          >
            Trong nước
          </button>
          <button
            type="button"
            onClick={() => setLocationFilter("international")}
            className={cn(
              "rounded-lg px-2.5 py-1 text-xs font-medium transition-colors",
              locationFilter === "international"
                ? "bg-blue-50 text-blue-700 font-semibold"
                : "text-slate-500 hover:bg-slate-100"
            )}
          >
            Quốc tế
          </button>
        </div>
      </div>

      {/* 4. OPPORTUNITIES GRID */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="h-56 rounded-2xl border border-slate-200 bg-white p-5 animate-pulse space-y-4"
            >
              <div className="h-4 bg-slate-100 rounded w-1/3" />
              <div className="h-5 bg-slate-100 rounded w-3/4" />
              <div className="h-12 bg-slate-100 rounded" />
              <div className="h-8 bg-slate-100 rounded" />
            </div>
          ))}
        </div>
      ) : opportunities.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center space-y-3">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
            <Compass className="h-6 w-6" />
          </div>
          <h3 className="text-base font-bold text-slate-800">Không tìm thấy cơ hội phù hợp</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Hãy thử tìm với từ khóa khác hoặc chuyển sang danh mục cơ hội khác.
          </p>
          <button
            type="button"
            onClick={() => {
              setActiveCategory("all");
              setSearchQuery("");
              setLocationFilter("all");
            }}
            className="mt-2 text-xs font-semibold text-blue-600 hover:underline"
          >
            Xem toàn bộ cơ hội
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {opportunities.map((item) => {
            const isSaved = Boolean(savedIds[item._id]);
            const isInCalendar = Boolean(calendarIds[item._id]);

            return (
              <div
                key={item._id}
                className="group rounded-2xl border border-slate-200/90 bg-white p-5 shadow-2xs hover:shadow-md hover:border-blue-200 transition-all flex flex-col justify-between"
              >
                <div className="space-y-3">
                  {/* Top category & actions */}
                  <div className="flex items-center justify-between">
                    <span className="rounded-md bg-blue-50 border border-blue-100 px-2 py-0.5 text-[10px] font-bold tracking-wider text-blue-700 uppercase">
                      {item.category.replace("_", " ")}
                    </span>

                    <button
                      type="button"
                      onClick={(e) => handleToggleSave(item._id, e)}
                      className={cn(
                        "p-1.5 rounded-lg transition-colors",
                        isSaved
                          ? "text-blue-600 bg-blue-50"
                          : "text-slate-400 hover:text-blue-600 hover:bg-slate-50"
                      )}
                      title={isSaved ? "Đã lưu (Bấm để bỏ lưu)" : "Lưu cơ hội"}
                    >
                      <Bookmark className={cn("h-4 w-4", isSaved && "fill-blue-600")} />
                    </button>
                  </div>

                  {/* Title & Desc */}
                  <div>
                    <Link href={`/explore/${item._id}`}>
                      <h3 className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-1">
                        {item.title}
                      </h3>
                    </Link>
                    <p className="mt-1 text-xs text-slate-500 line-clamp-2 leading-relaxed">
                      {item.description}
                    </p>
                  </div>

                  {/* Location badge */}
                  {item.location && (
                    <p className="text-[11px] text-slate-400">
                      📍 {item.location}
                    </p>
                  )}
                </div>

                {/* Footer Actions */}
                <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  {/* Deadline */}
                  <div className="text-[11px] text-slate-500 font-medium truncate">
                    {item.deadline ? (
                      <span>Hạn: <strong className="text-slate-800">{formatDate(item.deadline)}</strong></span>
                    ) : (
                      <span className="text-slate-400">Không cố định hạn</span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {/* Add to Calendar button */}
                    <button
                      type="button"
                      onClick={(e) => handleAddToCalendar(item._id, e)}
                      disabled={isInCalendar}
                      className={cn(
                        "flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[11px] font-semibold transition-all",
                        isInCalendar
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200 cursor-default"
                          : "bg-slate-50 text-slate-700 hover:bg-blue-50 hover:text-blue-600 border border-slate-200"
                      )}
                      title={isInCalendar ? "Đã có trong lịch" : "Thêm vào lịch để nhận nhắc hẹn 7/3/1 ngày"}
                    >
                      {isInCalendar ? (
                        <>
                          <Check className="h-3 w-3" />
                          <span>Đã thêm</span>
                        </>
                      ) : (
                        <>
                          <CalendarPlus className="h-3 w-3" />
                          <span>+ Lịch</span>
                        </>
                      )}
                    </button>

                    {/* View Details link */}
                    <Link
                      href={`/explore/${item._id}`}
                      className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-400 hover:text-blue-600 hover:border-blue-200 transition-colors"
                      title="Xem chi tiết"
                    >
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
