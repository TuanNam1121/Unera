"use client";

import { useState } from "react";
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

  // Collapsible states
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    explore: false,
    notifications: false,
    profile: false,
    activities: false,
    certificates: false,
    tools: false,
  });

  const toggleSection = (key: string) => {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const menuItems: { key?: string; item: MenuItem }[] = [
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
          { label: "CV", href: "/profile/cv" },
          { label: "Thành tích", href: "/profile/achievements" },
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
          { label: "Học bổng (doanh nghiệp, trao đổi, du học)", href: "/activities?type=scholarships" },
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
          { label: "Trắc nghiệm MBTI", href: "/tools/mbti" },
          { label: "Trắc nghiệm MI", href: "/tools/mi" },
          { label: "Cách tính lương Gross-Net", href: "/tools/salary" },
          { label: "Cách tính thu nhập cá nhân", href: "/tools/tax" },
        ],
      },
    },
  ];

  return (
    <aside className="w-[250px] shrink-0 border-r border-slate-200/90 bg-white flex flex-col justify-between h-screen sticky top-0 z-40 select-none">
      {/* Top: Logo & Nav */}
      <div className="flex flex-col h-full overflow-hidden">
        {/* Brand Logo */}
        <div className="px-6 pt-5 pb-4 border-b border-slate-100/80">
          <Link href="/" className="flex flex-col">
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold tracking-tight text-slate-900">Unera</span>
              <span className="text-2xl font-black text-blue-600 leading-none">.</span>
            </div>
            <span className="text-[9px] font-semibold tracking-[0.18em] text-slate-400 uppercase -mt-0.5">
              ĐỊNH HƯỚNG TƯƠNG LAI
            </span>
          </Link>
        </div>

        {/* Scrollable Navigation List */}
        <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-0.5 scrollbar-thin scrollbar-thumb-slate-200">
          {menuItems.map(({ key, item }) => {
            const Icon = item.icon;
            const hasSub = Boolean(item.subItems && item.subItems.length > 0);
            const isOpen = key ? openSections[key] : false;
            const isActive =
              pathname === item.href ||
              (item.href !== "/" && pathname.startsWith(item.href));

            return (
              <div key={item.label} className="space-y-0.5">
                <div
                  className={cn(
                    "flex items-center justify-between px-3 py-2 rounded-lg text-[13px] font-medium transition-colors cursor-pointer",
                    isActive
                      ? "bg-blue-50 text-blue-600 font-semibold"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                  )}
                  onClick={() => {
                    if (hasSub && key) {
                      toggleSection(key);
                    }
                  }}
                >
                  <Link
                    href={item.href}
                    className="flex items-center gap-2.5 flex-1"
                    onClick={(e) => {
                      if (hasSub) {
                        e.stopPropagation();
                      }
                    }}
                  >
                    <Icon className={cn("h-4 w-4 shrink-0", isActive ? "text-blue-600" : "text-slate-400")} />
                    <span>{item.label}</span>
                  </Link>

                  {hasSub && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (key) toggleSection(key);
                      }}
                      className="p-0.5 text-slate-400 hover:text-slate-600 rounded"
                    >
                      {isOpen ? (
                        <ChevronDown className="h-3.5 w-3.5" />
                      ) : (
                        <ChevronRight className="h-3.5 w-3.5" />
                      )}
                    </button>
                  )}
                </div>

                {/* Sub Menu Items */}
                {hasSub && isOpen && (
                  <div className="pl-8 pr-2 py-1 space-y-1">
                    {item.subItems!.map((sub) => {
                      const isSubActive = pathname === sub.href;
                      return (
                        <Link
                          key={sub.label}
                          href={sub.href}
                          className={cn(
                            "block text-[12px] py-1 transition-colors leading-snug",
                            isSubActive
                              ? "text-blue-600 font-medium"
                              : "text-slate-500 hover:text-slate-900"
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

      {/* Bottom Footer Note */}
      <div className="p-4 border-t border-slate-100 text-[11px] text-slate-400">
        Polaris · Đồng hành cùng sinh viên
      </div>
    </aside>
  );
}

export default Sidebar;

