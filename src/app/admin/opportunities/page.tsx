"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Briefcase,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  Archive,
  Eye,
  Loader2,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  ShieldAlert,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface OpportunityItem {
  _id: string;
  title: string;
  category: string;
  status: string;
  version: number;
  deadline?: string;
  isSponsored: boolean;
  sourceName?: string;
  updatedAt: string;
}

function AdminOpportunitiesContent() {
  const searchParams = useSearchParams();
  const initialStatus = searchParams.get("status") || "ALL";

  const [opportunities, setOpportunities] = useState<OpportunityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState(initialStatus);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const fetchOpportunities = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: "10",
        search,
      });
      if (statusFilter !== "ALL") {
        queryParams.set("status", statusFilter);
      }

      const res = await fetch(`/api/opportunities?${queryParams.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setOpportunities(data.data || []);
        setTotalPages(data.pagination?.totalPages || 1);
        setTotalCount(data.pagination?.total || 0);
      }
    } catch (err) {
      console.error("Lỗi tải cơ hội:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOpportunities();
  }, [page, statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchOpportunities();
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PUBLISHED":
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">Đang mở (Published)</span>;
      case "DRAFT":
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">Bản nháp (Draft)</span>;
      case "CLOSED":
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">Đã đóng (Closed)</span>;
      case "ARCHIVED":
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-purple-50 text-purple-700 border border-purple-200">Lưu trữ (Archived)</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700">{status}</span>;
    }
  };

  return (
    <div className="w-full space-y-6 px-6 sm:px-8 py-6 max-w-7xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <Briefcase className="h-6 w-6 text-blue-600" />
            <span>Quản Trị Cơ Hội &amp; Học Bổng ({totalCount})</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Kiểm soát vòng đời tin đăng, cơ chế Khóa Lạc Quan (Optimistic Locking) và nhãn tài trợ
          </p>
        </div>

        <Link
          href="/admin/opportunities/new"
          className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 text-xs font-semibold shadow-xs transition-all w-fit"
        >
          <Plus className="h-4 w-4" />
          <span>Thêm cơ hội mới</span>
        </Link>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Status Filters */}
        <div className="flex items-center gap-1 rounded-xl bg-slate-100 p-1 overflow-x-auto">
          {["ALL", "PUBLISHED", "DRAFT", "CLOSED", "ARCHIVED"].map((st) => (
            <button
              key={st}
              onClick={() => {
                setStatusFilter(st);
                setPage(1);
              }}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                statusFilter === st ? "bg-white text-slate-900 shadow-2xs" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              {st === "ALL"
                ? "Tất cả"
                : st === "PUBLISHED"
                ? "Đang mở"
                : st === "DRAFT"
                ? "Bản nháp"
                : st === "CLOSED"
                ? "Đã đóng"
                : "Lưu trữ"}
            </button>
          ))}
        </div>

        {/* Search */}
        <form onSubmit={handleSearchSubmit} className="flex gap-2 w-full md:w-80">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm theo tiêu đề cơ hội..."
              className="pl-9 rounded-xl border-slate-200 text-xs sm:text-sm"
            />
          </div>
          <Button type="submit" size="sm" className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs">
            Tìm
          </Button>
        </form>
      </div>

      {/* Table Card */}
      <Card className="rounded-2xl border-slate-200/80 shadow-xs bg-white overflow-hidden">
        <CardContent className="p-0">
          {loading ? (
            <div className="flex h-64 items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
          ) : opportunities.length === 0 ? (
            <div className="p-12 text-center text-xs sm:text-sm text-slate-400 italic">
              Không tìm thấy cơ hội nào. Hãy nhấn &quot;Thêm cơ hội mới&quot; để tạo bài đăng đầu tiên.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200/80 text-slate-500 font-semibold uppercase text-[11px] tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Tiêu đề cơ hội</th>
                    <th className="py-3 px-4">Danh mục</th>
                    <th className="py-3 px-4">Hạn nộp</th>
                    <th className="py-3 px-4">Phiên bản (Locking)</th>
                    <th className="py-3 px-4">Trạng thái</th>
                    <th className="py-3 px-4 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {opportunities.map((item) => (
                    <tr key={item._id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4 max-w-xs">
                        <div className="space-y-0.5">
                          <p className="font-semibold text-slate-900 text-xs sm:text-sm line-clamp-1">{item.title}</p>
                          <div className="flex items-center gap-2">
                            {item.isSponsored && (
                              <span className="rounded bg-amber-50 px-1.5 py-0.2 text-[10px] font-bold text-amber-700 border border-amber-200">
                                Tài trợ
                              </span>
                            )}
                            <span className="text-[11px] text-slate-400">{item.sourceName || "Unera"}</span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="rounded-md bg-slate-100 px-2 py-0.5 font-medium text-slate-700 text-[11px]">
                          {item.category}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-slate-600 text-[11px]">
                        {item.deadline ? new Date(item.deadline).toLocaleDateString("vi-VN") : "Không thời hạn"}
                      </td>

                      <td className="py-3.5 px-4 text-slate-600">
                        <span className="font-mono text-slate-700 font-semibold bg-slate-100 px-1.5 py-0.5 rounded text-[11px]">
                          v{item.version || 1}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        {getStatusBadge(item.status)}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <Link
                          href={`/explore`}
                          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-700 transition-all shadow-2xs"
                        >
                          <Eye className="h-3.5 w-3.5 text-slate-500" />
                          <span>Xem</span>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3 bg-slate-50/50">
              <span className="text-xs text-slate-500">
                Trang {page} / {totalPages}
              </span>
              <div className="flex items-center gap-1.5">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="h-8 rounded-lg text-xs"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="h-8 rounded-lg text-xs"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function AdminOpportunitiesPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-96 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      }
    >
      <AdminOpportunitiesContent />
    </Suspense>
  );
}
