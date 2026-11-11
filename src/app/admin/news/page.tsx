"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Newspaper,
  Plus,
  Search,
  Filter,
  Eye,
  Trash2,
  Sparkles,
  Award,
  DollarSign,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface NewsArticleItem {
  _id: string;
  title: string;
  slug: string;
  summary: string;
  category: string;
  author: string;
  readTime: string;
  isFeatured: boolean;
  isSponsored: boolean;
  sponsorInfo?: {
    sponsorName: string;
  };
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  createdAt: string;
}

const CATEGORY_LABELS: Record<string, string> = {
  ORIENTATION: "Định hướng",
  STUDY_ABROAD: "Du học",
  DISCIPLINES: "Khối ngành",
  POSTGRAD: "Sau đại học",
  SKILLS_CV: "Kỹ năng & CV",
  SCHOLARSHIPS: "Học bổng",
  ACTIVITIES: "Hoạt động sinh viên",
  RECRUITMENT: "Tuyển dụng",
  EVENTS: "Sự kiện",
};

export default function AdminNewsPage() {
  const [articles, setArticles] = useState<NewsArticleItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("ALL");
  const [status, setStatus] = useState("ALL");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchArticles = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "10",
        ...(search && { search }),
        ...(category !== "ALL" && { category }),
        ...(status !== "ALL" && { status }),
      });

      const res = await fetch(`/api/admin/news?${params}`);
      const data = await res.json();
      if (data.articles) {
        setArticles(data.articles);
        setTotalPages(data.totalPages || 1);
        setTotal(data.total || 0);
      }
    } catch (err) {
      console.error("Failed to load articles", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchArticles();
  }, [page, category, status]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchArticles();
  };

  const handleToggleStatus = async (id: string, currentStatus: string) => {
    const nextStatus = currentStatus === "PUBLISHED" ? "DRAFT" : "PUBLISHED";
    try {
      const res = await fetch(`/api/admin/news/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      if (res.ok) {
        fetchArticles();
      }
    } catch (err) {
      console.error("Failed to toggle status", err);
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa bài viết "${title}"?`)) return;
    try {
      const res = await fetch(`/api/admin/news/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        fetchArticles();
      }
    } catch (err) {
      console.error("Failed to delete article", err);
    }
  };

  return (
    <div className="w-full px-6 sm:px-8 py-6 space-y-7">
      {/* 1. TOP HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-md">
              ADMIN CMS
            </span>
            <span className="text-xs text-slate-400">· Quản lý Nội dung</span>
          </div>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Tin tức &amp; Bài viết Thư viện
          </h1>
          <p className="mt-0.5 text-xs sm:text-sm text-slate-500">
            Quản trị các bài viết định hướng, tin tức học bổng và nội dung tài trợ của đối tác.
          </p>
        </div>

        <Link href="/admin/news/new">
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white shadow-sm shadow-blue-500/25 hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>Tạo bài viết mới</span>
          </button>
        </Link>
      </div>

      {/* 2. FILTER & SEARCH STRIP */}
      <div className="flex flex-col md:flex-row items-center gap-3">
        <form onSubmit={handleSearchSubmit} className="relative flex-1 w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm theo tiêu đề, tác giả..."
            className="w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-600 shadow-2xs"
          />
        </form>

        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto">
          {/* Category Filter */}
          <select
            value={category}
            onChange={(e) => {
              setCategory(e.target.value);
              setPage(1);
            }}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 focus:outline-none focus:border-blue-600 shadow-2xs"
          >
            <option value="ALL">Tất cả chuyên mục</option>
            <option value="ORIENTATION">Định hướng</option>
            <option value="STUDY_ABROAD">Du học</option>
            <option value="DISCIPLINES">Khối ngành</option>
            <option value="POSTGRAD">Sau đại học</option>
            <option value="SKILLS_CV">Kỹ năng &amp; CV</option>
            <option value="SCHOLARSHIPS">Học bổng</option>
            <option value="ACTIVITIES">Hoạt động sinh viên</option>
            <option value="RECRUITMENT">Tuyển dụng</option>
          </select>

          {/* Status Filter */}
          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 focus:outline-none focus:border-blue-600 shadow-2xs"
          >
            <option value="ALL">Tất cả trạng thái</option>
            <option value="PUBLISHED">Đã xuất bản</option>
            <option value="DRAFT">Bản nháp</option>
            <option value="ARCHIVED">Lưu trữ</option>
          </select>
        </div>
      </div>

      {/* 3. ARTICLES TABLE */}
      <div className="rounded-2xl border border-slate-200/90 bg-white shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/70 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <th className="px-5 py-3.5">Tiêu đề bài viết</th>
                <th className="px-4 py-3.5">Chuyên mục</th>
                <th className="px-4 py-3.5">Đặc tính</th>
                <th className="px-4 py-3.5">Trạng thái</th>
                <th className="px-4 py-3.5">Ngày tạo</th>
                <th className="px-4 py-3.5 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                    <div className="inline-flex items-center gap-2">
                      <div className="h-4 w-4 rounded-full border-2 border-blue-600 border-t-transparent animate-spin" />
                      <span>Đang tải dữ liệu bài viết...</span>
                    </div>
                  </td>
                </tr>
              ) : articles.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                    Chưa có bài viết nào phù hợp với bộ lọc.
                  </td>
                </tr>
              ) : (
                articles.map((item) => (
                  <tr key={item._id} className="hover:bg-slate-50/50 transition-colors">
                    {/* Title */}
                    <td className="px-5 py-4 max-w-sm">
                      <div className="space-y-0.5">
                        <Link
                          href={`/news/${item.slug}`}
                          target="_blank"
                          className="font-bold text-slate-900 hover:text-blue-600 transition-colors line-clamp-1"
                        >
                          {item.title}
                        </Link>
                        <p className="text-[11px] text-slate-400 line-clamp-1">
                          {item.author} · {item.readTime}
                        </p>
                      </div>
                    </td>

                    {/* Category */}
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span className="inline-block rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-700">
                        {CATEGORY_LABELS[item.category] || item.category}
                      </span>
                    </td>

                    {/* Flags: Featured / Sponsored */}
                    <td className="px-4 py-4 whitespace-nowrap space-x-1.5">
                      {item.isFeatured && (
                        <span className="inline-flex items-center gap-1 rounded-md bg-blue-50 border border-blue-200 px-2 py-0.5 text-[10px] font-bold text-blue-700">
                          <Sparkles className="h-3 w-3" /> Nổi bật
                        </span>
                      )}
                      {item.isSponsored && (
                        <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 border border-amber-200 px-2 py-0.5 text-[10px] font-bold text-amber-700">
                          <Award className="h-3 w-3" /> Tài trợ
                        </span>
                      )}
                      {!item.isFeatured && !item.isSponsored && (
                        <span className="text-[11px] text-slate-400">Tiêu chuẩn</span>
                      )}
                    </td>

                    {/* Status Toggle */}
                    <td className="px-4 py-4 whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => handleToggleStatus(item._id, item.status)}
                        className={cn(
                          "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold transition-colors",
                          item.status === "PUBLISHED"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100"
                            : "bg-slate-100 text-slate-600 border border-slate-200 hover:bg-slate-200"
                        )}
                        title="Bấm để đổi trạng thái"
                      >
                        <span
                          className={cn(
                            "h-1.5 w-1.5 rounded-full",
                            item.status === "PUBLISHED" ? "bg-emerald-500" : "bg-slate-400"
                          )}
                        />
                        <span>{item.status === "PUBLISHED" ? "Đã xuất bản" : "Bản nháp"}</span>
                      </button>
                    </td>

                    {/* Created Date */}
                    <td className="px-4 py-4 whitespace-nowrap text-[11px] text-slate-400">
                      {new Date(item.createdAt).toLocaleDateString("vi-VN")}
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-4 whitespace-nowrap text-right space-x-2">
                      <Link
                        href={`/news/${item.slug}`}
                        target="_blank"
                        className="inline-flex items-center p-1.5 text-slate-400 hover:text-blue-600 rounded-lg hover:bg-slate-100 transition-colors"
                        title="Xem bài viết"
                      >
                        <Eye className="h-4 w-4" />
                      </Link>
                      <button
                        type="button"
                        onClick={() => handleDelete(item._id, item.title)}
                        className="inline-flex items-center p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                        title="Xóa bài viết"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between border-t border-slate-100 px-5 py-3 text-xs text-slate-500">
          <span>
            Tổng số: <strong className="text-slate-800">{total}</strong> bài viết
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1 font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-40"
            >
              <ChevronLeft className="h-3.5 w-3.5" /> Trước
            </button>
            <span className="font-semibold text-slate-700">
              Trang {page} / {totalPages}
            </span>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1 font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-40"
            >
              Sau <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

