"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import {
  Home,
  Compass,
  Bell,
  Image as ImageIcon,
  User,
  GraduationCap,
  Newspaper,
  Wrench,
  ChevronDown,
  ChevronRight,
  ShieldCheck,
  Users,
  CalendarCheck,
  ClipboardList,
  History,
  ArrowLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type {
  IActivityCategoryDTO,
  INewsCategoryDTO,
  IOrientationCategoryDTO,
} from "@/types";

interface SubItem {
  label: string;
  href: string;
}

interface MenuItem {
  icon: React.ElementType;
  label: string;
  href: string;
  subItems?: SubItem[];
}

export function Sidebar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isAdminRoute = pathname.startsWith("/admin");

  const [orientationCategories, setOrientationCategories] = useState<
    IOrientationCategoryDTO[]
  >([]);
  const [activityCategories, setActivityCategories] = useState<
    IActivityCategoryDTO[]
  >([]);
  const [newsCategories, setNewsCategories] = useState<INewsCategoryDTO[]>([]);

  // Derived route auto-open key + per-pathname manual accordion toggles
  const routeOpenKey = useMemo(() => {
    if (isAdminRoute) {
      if (pathname.startsWith("/admin/users") || pathname.startsWith("/admin/students")) return "adminUsers";
      if (pathname.startsWith("/admin/activities")) return "adminActivities";
      if (pathname.startsWith("/admin/news")) return "adminNews";
      if (pathname.startsWith("/admin/explore")) return "adminExplore";
      if (pathname.startsWith("/admin/media")) return "adminMedia";
      if (pathname.startsWith("/admin/mentors") || pathname.startsWith("/admin/bookings")) return "adminMentors";
      if (pathname.startsWith("/admin/quiz") || pathname.startsWith("/admin/ai-prompts")) return "adminQuiz";
      return null;
    }
    if (pathname.startsWith("/explore")) return "explore";
    if (pathname.startsWith("/notifications")) return "notifications";
    if (
      pathname.startsWith("/profile") ||
      pathname.startsWith("/roadmap") ||
      pathname.startsWith("/tools/cv-builder")
    ) {
      return "profile";
    }
    if (pathname.startsWith("/activities")) return "activities";
    if (pathname.startsWith("/news")) return "news";
    if (pathname.startsWith("/tools") || pathname.startsWith("/onboarding")) return "tools";
    return null;
  }, [pathname, isAdminRoute]);

  const [manualToggles, setManualToggles] = useState<
    Record<string, Record<string, boolean>>
  >({});
  const openSections: Record<string, boolean> = {
    adminStudents: true,
    adminActivities: true,
    ...(routeOpenKey ? { [routeOpenKey]: true } : {}),
    ...(manualToggles[pathname] ?? {}),
  };

  useEffect(() => {
    let cancelled = false;

    async function loadTaxonomy() {
      try {
        const res = await fetch("/api/orientation/taxonomy", {
          cache: "no-store",
        });
        const data = await res.json();
        if (!cancelled && res.ok && Array.isArray(data.categories)) {
          setOrientationCategories(data.categories);
        }
      } catch {
        // Non-fatal fallback: keep current subitems
      }
    }

    async function loadActivityCategories() {
      try {
        const res = await fetch("/api/activities/categories", {
          cache: "no-store",
        });
        const data = await res.json();
        if (!cancelled && res.ok && Array.isArray(data.categories)) {
          setActivityCategories(data.categories);
        }
      } catch {
        // Non-fatal fallback: keep default subitems
      }
    }

    async function loadNewsCategories() {
      try {
        const res = await fetch("/api/news/categories", {
          cache: "no-store",
        });
        const data = await res.json();
        if (!cancelled && res.ok && Array.isArray(data.categories)) {
          setNewsCategories(data.categories);
        }
      } catch {
        // Non-fatal fallback: keep default subitems
      }
    }

    loadTaxonomy();
    loadActivityCategories();
    loadNewsCategories();

    const handleTaxonomyUpdated = () => {
      loadTaxonomy();
    };
    const handleActivityCategoriesUpdated = () => {
      loadActivityCategories();
    };
    const handleNewsCategoriesUpdated = () => {
      loadNewsCategories();
    };
    window.addEventListener("unera:taxonomy-updated", handleTaxonomyUpdated);
    window.addEventListener(
      "unera:activity-categories-updated",
      handleActivityCategoriesUpdated
    );
    window.addEventListener(
      "unera:news-categories-updated",
      handleNewsCategoriesUpdated
    );
    return () => {
      cancelled = true;
      window.removeEventListener(
        "unera:taxonomy-updated",
        handleTaxonomyUpdated
      );
      window.removeEventListener(
        "unera:activity-categories-updated",
        handleActivityCategoriesUpdated
      );
      window.removeEventListener(
        "unera:news-categories-updated",
        handleNewsCategoriesUpdated
      );
    };
  }, []);

  const toggleSection = (key: string) => {
    const nextValue = !openSections[key];
    setManualToggles((prev) => ({
      ...prev,
      [pathname]: {
        ...(prev[pathname] ?? {}),
        [key]: nextValue,
      },
    }));
  };

  // 1. Menu dành riêng cho Quản trị viên (Admin CMS Sidebar)
  const adminMenuItems: { key?: string; item: MenuItem }[] = [
    {
      item: { icon: ShieldCheck, label: "Tổng quan Quản trị", href: "/admin" },
    },
    {
      key: "adminUsers",
      item: {
        icon: Users,
        label: "Quản lý Người dùng",
        href: "/admin/users",
        subItems: [
          { label: "Tất cả người dùng", href: "/admin/users" },
          { label: "Sinh viên (STUDENT)", href: "/admin/users?role=STUDENT" },
          { label: "Quản trị viên (ADMIN)", href: "/admin/users?role=ADMIN" },
          { label: "Tài khoản bị khóa", href: "/admin/users?status=DISABLED" },
        ],
      },
    },
    {
      key: "adminActivities",
      item: {
        icon: GraduationCap,
        label: "Hoạt động sinh viên",
        href: "/admin/activities",
        subItems: [
          { label: "Tất cả hoạt động", href: "/admin/activities" },
          { label: "+ Tạo hoạt động mới", href: "/admin/activities/new" },
          { label: "Danh mục hoạt động", href: "/admin/activities/categories" },
          { label: "Thống kê tương tác", href: "/admin/activities/statistics" },
        ],
      },
    },
    {
      key: "adminNews",
      item: {
        icon: Newspaper,
        label: "Tin tức & Sự kiện",
        href: "/admin/news",
        subItems: [
          { label: "Tất cả tin tức", href: "/admin/news" },
          { label: "+ Viết bài mới", href: "/admin/news/new" },
          { label: "Chuyên mục tin tức", href: "/admin/news/categories" },
          { label: "Quản lý Thẻ (Tags)", href: "/admin/news/tags" },
          { label: "Thống kê đọc & Share", href: "/admin/news/analytics" },
        ],
      },
    },
    {
      key: "adminExplore",
      item: {
        icon: Compass,
        label: "Khám phá định hướng",
        href: "/admin/explore",
        subItems: [
          { label: "Bài viết định hướng", href: "/admin/explore" },
          { label: "+ Viết bài định hướng", href: "/admin/explore/new" },
          { label: "Danh mục & Chủ đề", href: "/admin/explore/taxonomy" },
        ],
      },
    },
    {
      item: {
        icon: ImageIcon,
        label: "Thư viện Media CMS",
        href: "/admin/media",
      },
    },
    {
      key: "adminMentors",
      item: {
        icon: CalendarCheck,
        label: "Cố vấn & Đặt lịch",
        href: "/admin/mentors",
        subItems: [
          { label: "Danh sách Cố vấn", href: "/admin/mentors" },
          { label: "+ Thêm Cố vấn mới", href: "/admin/mentors/new" },
          { label: "Yêu cầu tư vấn (Bookings)", href: "/admin/bookings" },
        ],
      },
    },
    {
      key: "adminQuiz",
      item: {
        icon: ClipboardList,
        label: "Định hướng & AI",
        href: "/admin/quiz",
        subItems: [
          { label: "Bộ câu hỏi & Logic", href: "/admin/quiz" },
          { label: "System Prompt Gemini", href: "/admin/ai-prompts" },
        ],
      },
    },
    {
      item: { icon: History, label: "Nhật ký Kiểm toán (Audit)", href: "/admin/audit-logs" },
    },
  ];

  const dynamicExploreSubItems: SubItem[] = useMemo(() => {
    const items: SubItem[] = [{ label: "Tất cả bài viết", href: "/explore" }];
    for (const cat of orientationCategories) {
      items.push({
        label: cat.name,
        href: `/explore?category=${cat.slug}`,
      });
      for (const topic of cat.topics || []) {
        items.push({
          label: `· ${topic.name}`,
          href: `/explore?category=${cat.slug}&topic=${topic.slug}`,
        });
      }
    }
    return items;
  }, [orientationCategories]);

  const dynamicActivitiesSubItems: SubItem[] = useMemo(() => {
    const items: SubItem[] = [
      { label: "Tất cả hoạt động", href: "/activities" },
      { label: "Hoạt động đã quan tâm", href: "/activities?tab=followed" },
    ];
    for (const cat of activityCategories) {
      items.push({
        label: cat.name,
        href: `/activities?category=${cat.slug}`,
      });
    }
    return items;
  }, [activityCategories]);

  const dynamicNewsSubItems: SubItem[] = useMemo(() => {
    const items: SubItem[] = [
      { label: "Tất cả tin tức", href: "/news" },
      { label: "Bài viết đã lưu", href: "/news/saved" },
      { label: "Lịch sử đã đọc", href: "/news/history" },
    ];
    for (const cat of newsCategories) {
      if (cat.showInSidebar === false) continue;
      items.push({
        label: cat.name,
        href: `/news?category=${cat.slug}`,
      });
    }
    return items;
  }, [newsCategories]);

  // 2. Menu dành cho Sinh viên (User Sidebar)
  const userMenuItems: { key?: string; item: MenuItem }[] = [
    {
      item: { icon: Home, label: "Trang chủ", href: "/" },
    },
    {
      key: "explore",
      item: {
        icon: Compass,
        label: "Khám phá định hướng",
        href: "/explore",
        subItems: dynamicExploreSubItems,
      },
    },
    {
      key: "notifications",
      item: {
        icon: Bell,
        label: "Thông báo",
        href: "/notifications",
        subItems: [
          { label: "Tất cả thông báo", href: "/notifications" },
          { label: "Chưa đọc", href: "/notifications?filter=unread" },
          { label: "Nhắc hạn nộp (Deadline)", href: "/notifications?type=DEADLINE_REMINDER" },
          { label: "Sự kiện sắp diễn ra", href: "/notifications?type=EVENT_REMINDER" },
          { label: "Lộ trình & Hệ thống", href: "/notifications?type=SYSTEM" },
          { label: "Cài đặt nhắc nhở", href: "/notifications/settings" },
        ],
      },
    },
    {
      key: "profile",
      item: {
        icon: User,
        label: "Hồ sơ cá nhân",
        href: "/profile",
        subItems: [
          { label: "Thông tin & Mục tiêu", href: "/profile" },
          { label: "CV chuẩn ATS", href: "/tools/cv-builder" },
          { label: "Lộ trình hóa cá nhân", href: "/roadmap" },
          { label: "Lịch sử lộ trình", href: "/roadmap/history" },
        ],
      },
    },
    {
      key: "activities",
      item: {
        icon: GraduationCap,
        label: "Hoạt động sinh viên",
        href: "/activities",
        subItems: dynamicActivitiesSubItems,
      },
    },
    {
      key: "news",
      item: {
        icon: Newspaper,
        label: "Tin tức & Cơ hội",
        href: "/news",
        subItems: dynamicNewsSubItems,
      },
    },
    {
      key: "tools",
      item: {
        icon: Wrench,
        label: "Công cụ",
        href: "/tools",
        subItems: [
          { label: "Tổng quan Công cụ", href: "/tools" },
          { label: "Trắc nghiệm Onboarding", href: "/onboarding" },
          { label: "Lịch sử định hướng AI", href: "/onboarding/history" },
          { label: "Trắc nghiệm MBTI", href: "/tools/mbti" },
          { label: "Trắc nghiệm MI", href: "/tools/mi" },
          { label: "Cách tính lương Gross - Net", href: "/tools/gross-net" },
          { label: "Cách tính thu nhập cá nhân", href: "/tools/tax" },
        ],
      },
    },
  ];

  const currentMenu = isAdminRoute ? adminMenuItems : userMenuItems;

  if (pathname.startsWith("/cv/")) {
    return null;
  }

  return (
    <aside className="sticky top-0 z-40 flex h-screen w-[250px] shrink-0 flex-col justify-between border-r border-slate-200/80 bg-white print:hidden">
      <div className="flex flex-col overflow-y-auto">
        {/* Brand Header */}
        <div className="flex flex-col px-6 pt-5 pb-4">
          <Link href={isAdminRoute ? "/admin" : "/"} className="flex items-center gap-2 group">
            <span className="text-xl font-bold tracking-tight text-slate-900 group-hover:text-blue-600 transition-colors">
              Unera <span className="text-blue-600">.</span>
            </span>
            {isAdminRoute && (
              <span className="rounded-md bg-blue-600 px-2 py-0.5 text-[10px] font-bold text-white shadow-2xs">
                ADMIN
              </span>
            )}
          </Link>
          <span className="text-[10px] tracking-wider text-slate-400 uppercase font-semibold mt-0.5">
            {isAdminRoute ? "Hệ thống Quản trị CMS" : "Định hướng tương lai"}
          </span>
        </div>

        {/* Navigation List */}
        <nav className="space-y-0.5 px-3 py-2">
          {currentMenu.map(({ key, item }) => {
            const hasSub = !!item.subItems && item.subItems.length > 0;
            const isOpen = key ? !!openSections[key] : false;
            const isActive =
              pathname === item.href ||
              (hasSub && item.subItems!.some((sub) => pathname === sub.href));
            const Icon = item.icon;

            return (
              <div key={item.label} className="flex flex-col">
                {/* Click trực tiếp vào dòng menu sẽ hiện/ẩn các mục con ngay lập tức */}
                {hasSub ? (
                  <button
                    type="button"
                    onClick={() => key && toggleSection(key)}
                    className={cn(
                      "flex items-center justify-between w-full rounded-xl px-3 py-2 text-[13px] font-medium transition-all cursor-pointer text-left",
                      isActive
                        ? "bg-blue-50/80 text-blue-700 font-semibold"
                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                    )}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className={cn("h-4 w-4 shrink-0", isActive ? "text-blue-600" : "text-slate-400")} />
                      <span>{item.label}</span>
                    </div>
                    <span className="p-0.5 text-slate-400">
                      {isOpen ? (
                        <ChevronDown className="h-3.5 w-3.5" />
                      ) : (
                        <ChevronRight className="h-3.5 w-3.5" />
                      )}
                    </span>
                  </button>
                ) : (
                  <Link
                    href={item.href}
                    className={cn(
                      "flex items-center gap-2.5 rounded-xl px-3 py-2 text-[13px] font-medium transition-all",
                      isActive
                        ? "bg-blue-600 text-white font-semibold shadow-xs"
                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                    )}
                  >
                    <Icon className={cn("h-4 w-4 shrink-0", isActive ? "text-white" : "text-slate-400")} />
                    <span>{item.label}</span>
                  </Link>
                )}

                {/* Sub Menu Items - Hiển thị ngay khi mở */}
                {hasSub && isOpen && (
                  <div className="pl-8 pr-2 py-1 space-y-0.5 border-l-2 border-blue-100 ml-4 my-0.5">
                    {item.subItems!.map((sub) => {
                      const queryString = searchParams.toString();
                      const currentFullUrl = queryString
                        ? `${pathname}?${queryString}`
                        : pathname;
                      const isSubActive = sub.href.includes("?")
                        ? currentFullUrl === sub.href
                        : pathname === sub.href && !queryString;
                      return (
                        <Link
                          key={sub.label}
                          href={sub.href}
                          className={cn(
                            "block text-[12px] py-1.5 px-2 rounded-lg transition-colors leading-snug",
                            isSubActive
                              ? "bg-blue-50 text-blue-700 font-semibold"
                              : "text-slate-500 hover:text-slate-900 hover:bg-slate-50/80"
                          )}
                        >
                          {sub.label}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>
      </div>

      {/* Bottom Footer Section */}
      <div className="p-4 border-t border-slate-100 space-y-2">
        {isAdminRoute ? (
          <Link
            href="/"
            className="flex items-center justify-center gap-2 w-full rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 py-2 px-3 text-xs font-semibold transition-all shadow-2xs"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Xem trang Người dùng</span>
          </Link>
        ) : (
          <div className="text-[11px] text-slate-400 text-center">
            Polaris · Đồng hành cùng sinh viên
          </div>
        )}
      </div>
    </aside>
  );
}

export default Sidebar;
