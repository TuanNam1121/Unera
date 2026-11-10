"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { Search, Bell, User } from "lucide-react";

export function Topbar() {
  const pathname = usePathname();

  // Dynamic Title based on current route
  const getPageTitle = () => {
    if (pathname === "/") return "Trang chủ";
    if (pathname.startsWith("/news")) return "Tin tức & bài viết";
    if (pathname.startsWith("/explore")) return "Khám phá cơ hội";
    if (pathname.startsWith("/roadmap")) return "Lộ trình cá nhân";
    if (pathname.startsWith("/calendar")) return "Lịch hạn chót";
    if (pathname.startsWith("/applications")) return "Hồ sơ ứng tuyển";
    if (pathname.startsWith("/mentors")) return "Kết nối Mentor";
    if (pathname.startsWith("/tools")) return "Công cụ sinh viên";
    if (pathname.startsWith("/profile")) return "Hồ sơ cá nhân";
    if (pathname.startsWith("/notifications")) return "Thông báo";
    return "Unera";
  };

  return (
    <header className="sticky top-0 z-30 flex h-[60px] w-full items-center justify-between border-b border-slate-200/80 bg-white px-6 sm:px-8">
      {/* Left: Page Title */}
      <div className="flex items-center gap-4">
        <h1 className="text-base font-semibold text-slate-800">
          {getPageTitle()}
        </h1>
      </div>

      {/* Right: Search + Notifications + Profile Pill */}
      <div className="flex items-center gap-3">
        {/* Search Input with ⌘ K shortcut */}
        <div className="relative hidden sm:block w-72 lg:w-80">
          <Search className="absolute left-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm cơ hội, mentor, bài viết..."
            className="w-full rounded-full border border-slate-200 bg-slate-50/70 py-1.5 pl-9 pr-12 text-xs text-slate-800 placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all"
          />
          <kbd className="absolute right-3 top-1/2 -translate-y-1/2 rounded border border-slate-200 bg-white px-1.5 py-0.5 text-[10px] font-medium text-slate-400 shadow-2xs">
            ⌘ K
          </kbd>
        </div>

        {/* Notifications Icon Button */}
        <Link
          href="/notifications"
          className="relative rounded-full p-2 text-slate-500 hover:bg-slate-100 transition-colors"
          title="Thông báo"
        >
          <Bell className="h-4 w-4" />
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-blue-600 ring-2 ring-white" />
        </Link>

        {/* Profile Pill Button */}
        <Link
          href="/profile"
          className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-medium text-slate-700 hover:border-slate-300 hover:bg-slate-50 shadow-2xs transition-all"
        >
          <User className="h-3.5 w-3.5 text-slate-500" />
          <span>Hồ sơ</span>
        </Link>
      </div>
    </header>
  );
}

export default Topbar;
