"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Search,
  Compass,
  Bell,
  Newspaper,
  User,
  GraduationCap,
  Award,
  Wrench,
  ChevronDown,
  ChevronRight,
  ShieldCheck,
  Users,
  Briefcase,
  FileText,
  CalendarCheck,
  FolderTree,
  ClipboardList,
  History,
  ArrowLeft,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

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
  const isAdminRoute = pathname.startsWith("/admin");

  // Accordion states
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    // User sections
    explore: false,
    notifications: false,
    profile: false,
    activities: false,
    certificates: false,
    tools: false,
    // Admin sections
    adminStudents: true,
    adminOpportunities: true,
    adminNews: false,
    adminMentors: false,
    adminCatalog: false,
    adminQuiz: false,
  });

  // Tự động mở menu cha nếu pathname hiện tại khớp với mục con
  useEffect(() => {
    if (isAdminRoute) {
      if (pathname.startsWith("/admin/students")) setOpenSections((prev) => ({ ...prev, adminStudents: true }));
      if (pathname.startsWith("/admin/opportunities")) setOpenSections((prev) => ({ ...prev, adminOpportunities: true }));
      if (pathname.startsWith("/admin/news")) setOpenSections((prev) => ({ ...prev, adminNews: true }));
      if (pathname.startsWith("/admin/mentors") || pathname.startsWith("/admin/bookings")) setOpenSections((prev) => ({ ...prev, adminMentors: true }));
      if (pathname.startsWith("/admin/certificates") || pathname.startsWith("/admin/activities")) setOpenSections((prev) => ({ ...prev, adminCatalog: true }));
      if (pathname.startsWith("/admin/quiz") || pathname.startsWith("/admin/roadmaps")) setOpenSections((prev) => ({ ...prev, adminQuiz: true }));
    } else {
      if (pathname.startsWith("/explore")) setOpenSections((prev) => ({ ...prev, explore: true }));
      if (pathname.startsWith("/notifications")) setOpenSections((prev) => ({ ...prev, notifications: true }));
      if (pathname.startsWith("/profile")) setOpenSections((prev) => ({ ...prev, profile: true }));
      if (pathname.startsWith("/activities")) setOpenSections((prev) => ({ ...prev, activities: true }));
      if (pathname.startsWith("/certificates")) setOpenSections((prev) => ({ ...prev, certificates: true }));
      if (pathname.startsWith("/tools")) setOpenSections((prev) => ({ ...prev, tools: true }));
    }
  }, [pathname, isAdminRoute]);

  const toggleSection = (key: string) => {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // 1. Menu dành riêng cho Quản trị viên (Admin CMS Sidebar)
  const adminMenuItems: { key?: string; item: MenuItem }[] = [
    {
      item: { icon: ShieldCheck, label: "Tổng quan Quản trị", href: "/admin" },
    },
    {
      key: "adminStudents",
      item: {
        icon: Users,
        label: "Quản lý Sinh viên",
        href: "/admin/students",
        subItems: [
          { label: "Tất cả sinh viên", href: "/admin/students" },
          { label: "Tài khoản đang hoạt động", href: "/admin/students?status=ACTIVE" },
          { label: "Tài khoản bị khóa", href: "/admin/students?status=DISABLED" },
        ],
      },
    },
    {
      key: "adminOpportunities",
      item: {
        icon: Briefcase,
        label: "Quản trị Cơ hội",
        href: "/admin/opportunities",
        subItems: [
          { label: "Tất cả cơ hội", href: "/admin/opportunities" },
          { label: "+ Thêm cơ hội mới", href: "/admin/opportunities/new" },
          { label: "Cơ hội đang mở", href: "/admin/opportunities?status=PUBLISHED" },
          { label: "Bản nháp & Chờ duyệt", href: "/admin/opportunities?status=DRAFT" },
          { label: "Cơ hội đã đóng", href: "/admin/opportunities?status=CLOSED" },
        ],
      },
    },
    {
      key: "adminNews",
      item: {
        icon: FileText,
        label: "Tin tức & Sự kiện",
        href: "/admin/news",
        subItems: [
          { label: "Danh sách bài viết", href: "/admin/news" },
          { label: "+ Đăng tin mới", href: "/admin/news/new" },
          { label: "Nội dung tài trợ", href: "/admin/news?sponsored=true" },
        ],
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
      key: "adminCatalog",
      item: {
        icon: FolderTree,
        label: "Chứng chỉ & Hoạt động",
        href: "/admin/certificates",
        subItems: [
          { label: "Danh mục Chứng chỉ", href: "/admin/certificates" },
          { label: "Hoạt động ngoại khóa", href: "/admin/activities" },
        ],
      },
    },
    {
      key: "adminQuiz",
      item: {
        icon: ClipboardList,
        label: "Trắc nghiệm & Lộ trình",
        href: "/admin/quiz",
        subItems: [
          { label: "Bộ câu hỏi trắc nghiệm", href: "/admin/quiz" },
          { label: "Mẫu lộ trình đào tạo", href: "/admin/roadmaps" },
        ],
      },
    },
    {
      item: { icon: History, label: "Nhật ký Kiểm toán (Audit)", href: "/admin/audit-logs" },
    },
  ];

  // 2. Menu dành cho Sinh viên (User Sidebar)
  const userMenuItems: { key?: string; item: MenuItem }[] = [
    {
      item: { icon: Home, label: "Trang chủ", href: "/" },
    },
    {
      item: { icon: Search, label: "Tìm kiếm", href: "/search" },
    },
    {
      key: "explore",
      item: {
        icon: Compass,
        label: "Khám phá định hướng",
        href: "/explore",
        subItems: [
          { label: "Du học", href: "/explore?category=study_abroad" },
          { label: "Khối ngành", href: "/explore?category=career_discipline" },
          { label: "· Ngôn ngữ", href: "/explore?category=career_discipline&tag=language" },
          { label: "· Kinh tế – Quản trị", href: "/explore?category=career_discipline&tag=economy" },
          { label: "· Công nghệ – Kỹ thuật", href: "/explore?category=career_discipline&tag=tech" },
          { label: "· Truyền thông", href: "/explore?category=career_discipline&tag=media" },
          { label: "· Luật", href: "/explore?category=career_discipline&tag=law" },
          { label: "· Khoa học xã hội", href: "/explore?category=career_discipline&tag=social" },
          { label: "· Du lịch – Dịch vụ", href: "/explore?category=career_discipline&tag=tourism" },
          { label: "Thạc sĩ, NCS, Tiến sĩ", href: "/explore?category=postgrad" },
        ],
      },
    },
    {
      key: "notifications",
      item: {
        icon: Bell,
        label: "Thông báo",
        href: "/notifications",
        subItems: [
          { label: "Thông báo sự kiện sắp diễn ra", href: "/notifications?type=upcoming" },
          { label: "Thông báo sự kiện mở đơn", href: "/notifications?type=opened" },
          { label: "Thông báo sự kiện sắp đóng đơn", href: "/notifications?type=closing" },
          { label: "Thông báo tuyển dụng", href: "/notifications?type=jobs" },
        ],
      },
    },
    {
      item: { icon: Newspaper, label: "Tin tức", href: "/news" },
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
        ],
      },
    },
    {
      key: "activities",
      item: {
        icon: GraduationCap,
        label: "Hoạt động sinh viên",
        href: "/activities",
        subItems: [
          { label: "NCKH", href: "/activities?type=research" },
          { label: "Management Trainee", href: "/activities?type=mt" },
          { label: "Các cuộc thi", href: "/activities?type=competitions" },
          { label: "Chương trình đại sứ", href: "/activities?type=ambassador" },
          { label: "Học bổng sinh viên", href: "/activities?type=scholarships" },
          { label: "Các sự kiện khác", href: "/activities?type=events" },
        ],
      },
    },
    {
      key: "certificates",
      item: {
        icon: Award,
        label: "Chứng chỉ",
        href: "/certificates",
        subItems: [
          { label: "Ngôn ngữ", href: "/certificates?cat=languages" },
          { label: "Nghề nghiệp", href: "/certificates?cat=career" },
          { label: "· Giáo viên", href: "/certificates?cat=teacher" },
          { label: "· Biên phiên dịch", href: "/certificates?cat=translation" },
        ],
      },
    },
    {
      key: "tools",
      item: {
        icon: Wrench,
        label: "Công cụ",
        href: "/tools",
        subItems: [
          { label: "Trắc nghiệm Onboarding", href: "/onboarding" },
          { label: "Trắc nghiệm MBTI", href: "/tools/mbti" },
          { label: "Trắc nghiệm MI", href: "/tools/mi" },
          { label: "Cách tính lương Gross - Net", href: "/tools/gross-net" },
          { label: "Cách tính thu nhập cá nhân", href: "/tools/tax" },
        ],
      },
    },
  ];

  const currentMenu = isAdminRoute ? adminMenuItems : userMenuItems;

  return (
    <aside className="sticky top-0 z-40 flex h-screen w-[250px] shrink-0 flex-col justify-between border-r border-slate-200/80 bg-white">
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
                      const isSubActive = pathname === sub.href;
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
