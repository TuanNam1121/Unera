"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Users,
  Briefcase,
  CalendarCheck,
  Compass,
  Newspaper,
  ArrowRight,
  ShieldCheck,
  Lock,
  Plus,
  Loader2,
  Clock,
  CheckCircle2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

interface DashboardStats {
  totalUsers?: number;
  totalAdmins?: number;
  totalStudents: number;
  activeStudents: number;
  disabledStudents: number;
  totalActivities: number;
  publishedActivities: number;
  totalActivityFollowers: number;
  totalNews?: number;
  publishedNews?: number;
  pendingBookings: number;
  totalActiveRoadmaps: number;
}

interface AuditLogItem {
  _id: string;
  adminName: string;
  adminEmail: string;
  action: string;
  targetCollection: string;
  targetTitle?: string;
  reason?: string;
  createdAt: string;
}

interface StudentItem {
  _id: string;
  name: string;
  email: string;
  status: string;
  createdAt: string;
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentLogs, setRecentLogs] = useState<AuditLogItem[]>([]);
  const [recentStudents, setRecentStudents] = useState<StudentItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        setLoading(true);
        const res = await fetch("/api/admin/dashboard/stats");
        if (res.ok) {
          const data = await res.json();
          setStats(data.stats);
          setRecentLogs(data.recentAuditLogs || []);
          setRecentStudents(data.recentStudents || []);
        }
      } catch (err) {
        console.error("Lỗi tải số liệu quản trị:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, []);

  const getActionBadge = (action: string) => {
    switch (action) {
      case "CREATE":
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">TẠO MỚI</span>;
      case "UPDATE":
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">CẬP NHẬT</span>;
      case "STATUS_CHANGE":
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">ĐỔI TRẠNG THÁI</span>;
      case "LOCK_ACCOUNT":
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-50 text-red-700 border border-red-200">KHÓA TÀI KHOẢN</span>;
      case "UNLOCK_ACCOUNT":
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">MỞ KHÓA</span>;
      default:
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">{action}</span>;
    }
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="w-full space-y-6 px-6 sm:px-8 py-6 max-w-7xl">
      {/* Top Welcome Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 p-6 text-white shadow-md">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-blue-400" />
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
              Trung Tâm Điều Hành Quản Trị (Admin CMS)
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-300">
            Giám sát vận hành hệ thống UNERA, quản lý hoạt động sinh viên và kết nối cố vấn theo thời gian thực.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            href="/admin/activities/new"
            className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white px-3.5 py-2 text-xs font-semibold shadow-xs transition-all"
          >
            <Plus className="h-4 w-4" />
            <span>Tạo hoạt động mới</span>
          </Link>
          <Link
            href="/admin/news/new"
            className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white px-3.5 py-2 text-xs font-semibold shadow-xs transition-all"
          >
            <Newspaper className="h-4 w-4" />
            <span>Viết tin tức mới</span>
          </Link>
          <Link
            href="/admin/explore"
            className="inline-flex items-center gap-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white px-3.5 py-2 text-xs font-semibold border border-white/20 backdrop-blur-xs transition-all shadow-xs"
          >
            <Compass className="h-4 w-4 text-emerald-400" />
            <span>Bài viết định hướng</span>
          </Link>
          <Link
            href="/admin/bookings"
            className="inline-flex items-center gap-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white px-3.5 py-2 text-xs font-semibold border border-white/20 backdrop-blur-xs transition-all shadow-xs"
          >
            <CalendarCheck className="h-4 w-4 text-amber-400" />
            <span>Duyệt lịch tư vấn ({stats?.pendingBookings || 0})</span>
          </Link>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {/* Total Students */}
        <Card className="rounded-2xl border-slate-200/80 shadow-xs hover:shadow-sm transition-all bg-white">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Tổng số Sinh viên
              </p>
              <p className="text-2xl font-bold text-slate-900">
                {stats?.totalStudents || 0}
              </p>
              <div className="flex items-center gap-2 text-[11px] text-slate-500">
                <span className="text-emerald-600 font-semibold flex items-center gap-0.5">
                  <CheckCircle2 className="h-3 w-3" /> {stats?.activeStudents || 0} hoạt động
                </span>
                {stats?.disabledStudents ? (
                  <span className="text-red-500 font-semibold flex items-center gap-0.5">
                    <Lock className="h-3 w-3" /> {stats.disabledStudents} bị khóa
                  </span>
                ) : null}
                {typeof stats?.totalAdmins === "number" ? (
                  <span className="text-indigo-600 font-semibold">
                    · {stats.totalAdmins} Admin
                  </span>
                ) : null}
              </div>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
              <Users className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        {/* Published Student Activities */}
        <Card className="rounded-2xl border-slate-200/80 shadow-xs hover:shadow-sm transition-all bg-white">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Hoạt động đang hiển thị
              </p>
              <p className="text-2xl font-bold text-slate-900">
                {stats?.publishedActivities || 0}
              </p>
              <p className="text-[11px] text-slate-400">
                Tổng {stats?.totalActivities || 0} hoạt động · {stats?.totalActivityFollowers || 0} lượt quan tâm
              </p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
              <Briefcase className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        {/* Pending Bookings */}
        <Card className="rounded-2xl border-slate-200/80 shadow-xs hover:shadow-sm transition-all bg-white">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Yêu cầu Mentor chờ duyệt
              </p>
              <p className="text-2xl font-bold text-amber-600">
                {stats?.pendingBookings || 0}
              </p>
              <p className="text-[11px] text-amber-700 font-medium">
                Cần phản hồi trong vòng 48h
              </p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
              <CalendarCheck className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        {/* Active Roadmaps */}
        <Card className="rounded-2xl border-slate-200/80 shadow-xs hover:shadow-sm transition-all bg-white">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Lộ trình đang kích hoạt
              </p>
              <p className="text-2xl font-bold text-indigo-600">
                {stats?.totalActiveRoadmaps || 0}
              </p>
              <p className="text-[11px] text-slate-400">
                Được cá nhân hóa theo mục tiêu
              </p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
              <Compass className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        {/* Published News */}
        <Link href="/admin/news" className="block">
          <Card className="rounded-2xl border-slate-200/80 shadow-xs hover:shadow-sm transition-all bg-white h-full">
            <CardContent className="p-5 flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Tin tức đã xuất bản
                </p>
                <p className="text-2xl font-bold text-sky-600">
                  {stats?.publishedNews || 0}
                </p>
                <p className="text-[11px] text-slate-400">
                  Tổng {stats?.totalNews || 0} bài viết tin tức
                </p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-50 text-sky-600">
                <Newspaper className="h-6 w-6" />
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Two Column Layout: Recent Registrations & Live Audit Trail */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Recent Students */}
        <Card className="rounded-2xl border-slate-200/80 shadow-xs bg-white">
          <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <CardTitle className="text-base font-bold text-slate-900">
                Sinh viên đăng ký gần đây
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">
                Tài khoản sinh viên mới gia nhập hệ thống
              </CardDescription>
            </div>
            <Link
              href="/admin/users"
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              <span>Xem tất cả</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </CardHeader>

          <CardContent className="p-0">
            <div className="divide-y divide-slate-100">
              {recentStudents.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-400 italic">
                  Chưa có tài khoản sinh viên nào.
                </div>
              ) : (
                recentStudents.map((st) => (
                  <div key={st._id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100 text-blue-700 font-bold text-xs">
                        {st.name ? st.name.charAt(0).toUpperCase() : "U"}
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-slate-900">{st.name}</p>
                        <p className="text-[11px] text-slate-500">{st.email}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          st.status === "ACTIVE"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : "bg-red-50 text-red-700 border border-red-200"
                        }`}
                      >
                        {st.status === "ACTIVE" ? "Hoạt động" : "Bị khóa"}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Right: Live Audit Trail */}
        <Card className="rounded-2xl border-slate-200/80 shadow-xs bg-white">
          <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <CardTitle className="text-base font-bold text-slate-900">
                Nhật ký kiểm toán gần đây (Audit Trail)
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">
                Lịch sử các thao tác thay đổi hệ thống của Admin
              </CardDescription>
            </div>
            <Link
              href="/admin/audit-logs"
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              <span>Tra cứu đầy đủ</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </CardHeader>

          <CardContent className="p-0">
            <div className="divide-y divide-slate-100">
              {recentLogs.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-400 italic">
                  Chưa có nhật ký kiểm toán nào được ghi nhận.
                </div>
              ) : (
                recentLogs.map((log) => (
                  <div key={log._id} className="p-4 flex items-start justify-between gap-3 hover:bg-slate-50 transition-colors">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        {getActionBadge(log.action)}
                        <span className="text-xs font-semibold text-slate-800 truncate max-w-[200px]">
                          {log.targetTitle || log.targetCollection}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 leading-tight">
                        Thực hiện bởi <span className="font-semibold text-slate-700">{log.adminName}</span>
                        {log.reason ? ` — Lý do: "${log.reason}"` : ""}
                      </p>
                    </div>
                    <span className="text-[10px] text-slate-400 whitespace-nowrap flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {new Date(log.createdAt).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

