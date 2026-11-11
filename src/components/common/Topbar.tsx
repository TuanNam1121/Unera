"use client";

import { useState, useRef, useEffect } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import {
  Search,
  Bell,
  User,
  LogOut,
  ShieldCheck,
  Compass,
  ChevronDown,
  LogIn,
} from "lucide-react";

export function Topbar() {
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close dropdown on route change
  useEffect(() => {
    setDropdownOpen(false);
  }, [pathname]);

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
    if (pathname.startsWith("/admin")) return "Bảng điều khiển Quản trị";
    if (pathname.startsWith("/login")) return "Đăng nhập";
    if (pathname.startsWith("/register")) return "Đăng ký tài khoản";
    if (pathname.startsWith("/forgot-password")) return "Khôi phục mật khẩu";
    if (pathname.startsWith("/reset-password")) return "Đặt lại mật khẩu";
    return "Unera";
  };

  const user = session?.user;
  const isAdmin = (user as unknown as { role?: string })?.role === "ADMIN";

  return (
    <header className="sticky top-0 z-30 flex h-[60px] w-full items-center justify-between border-b border-slate-200/80 bg-white px-6 sm:px-8">
      {/* Left: Page Title */}
      <div className="flex items-center gap-4">
        <h1 className="text-base font-semibold text-slate-800">
          {getPageTitle()}
        </h1>
      </div>

      {/* Right: Search + Notifications + User Auth / Profile Pill */}
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

        {/* User Auth Section */}
        {status === "loading" ? (
          <div className="h-8 w-20 animate-pulse rounded-full bg-slate-100" />
        ) : user ? (
          /* Profile Pill Dropdown */
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-700 hover:border-slate-300 hover:bg-slate-50 shadow-2xs transition-all cursor-pointer"
            >
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-blue-700 font-semibold text-[11px]">
                {user.name ? user.name.charAt(0).toUpperCase() : "U"}
              </div>
              <span className="max-w-[120px] truncate text-slate-800">
                {user.name || user.email?.split("@")[0]}
              </span>
              {isAdmin && (
                <span className="rounded bg-blue-50 px-1 py-0.2 text-[10px] font-semibold text-blue-600 border border-blue-200/60">
                  Admin
                </span>
              )}
              <ChevronDown className="h-3 w-3 text-slate-400" />
            </button>

            {/* Dropdown Menu */}
            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-56 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl ring-1 ring-black/5 z-50 animate-in fade-in slide-in-from-top-1 duration-150">
                {/* User Info Header */}
                <div className="px-3 py-2 border-b border-slate-100 mb-1">
                  <p className="text-xs font-semibold text-slate-900 truncate">
                    {user.name || "Người dùng"}
                  </p>
                  <p className="text-[11px] text-slate-500 truncate">
                    {user.email}
                  </p>
                  <span className="inline-block mt-1 text-[10px] px-1.5 py-0.5 rounded-full font-medium bg-slate-100 text-slate-600">
                    {isAdmin ? "Quản trị viên" : "Sinh viên"}
                  </span>
                </div>

                {/* Menu items */}
                <Link
                  href="/profile"
                  className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  <User className="h-3.5 w-3.5 text-slate-400" />
                  <span>Hồ sơ cá nhân</span>
                </Link>

                <Link
                  href="/roadmap"
                  className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  <Compass className="h-3.5 w-3.5 text-slate-400" />
                  <span>Lộ trình của tôi</span>
                </Link>

                {isAdmin && (
                  <Link
                    href="/admin"
                    className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-blue-600 hover:bg-blue-50 transition-colors"
                  >
                    <ShieldCheck className="h-3.5 w-3.5 text-blue-500" />
                    <span>Trang quản trị (Admin)</span>
                  </Link>
                )}

                <div className="my-1 border-t border-slate-100" />

                {/* Sign Out Button (FR-AUTH-04, FR-AUTH-10) */}
                <button
                  onClick={() => signOut({ callbackUrl: "/login" })}
                  className="w-full flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50 transition-colors cursor-pointer text-left"
                >
                  <LogOut className="h-3.5 w-3.5 text-red-500" />
                  <span>Đăng xuất</span>
                </button>
              </div>
            )}
          </div>
        ) : (
          /* Visitor Login & Register Buttons */
          <div className="flex items-center gap-2">
            <Link
              href="/login"
              className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-medium text-slate-700 hover:border-slate-300 hover:bg-slate-50 shadow-2xs transition-all"
            >
              <LogIn className="h-3.5 w-3.5 text-slate-500" />
              <span>Đăng nhập</span>
            </Link>
            <Link
              href="/register"
              className="hidden sm:inline-flex rounded-full bg-blue-600 px-3.5 py-1.5 text-xs font-medium text-white hover:bg-blue-700 shadow-xs transition-all"
            >
              Đăng ký
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}

export default Topbar;
