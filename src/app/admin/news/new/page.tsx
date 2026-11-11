"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Sparkles,
  Award,
  Send,
  FileText,
  DollarSign,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function AdminNewArticlePage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("ORIENTATION");
  const [summary, setSummary] = useState("");
  const [content, setContent] = useState("");
  const [author, setAuthor] = useState("Ban biên tập Polaris");
  const [readTime, setReadTime] = useState("5 phút đọc");
  const [isFeatured, setIsFeatured] = useState(false);
  const [isSponsored, setIsSponsored] = useState(false);
  const [sponsorName, setSponsorName] = useState("");
  const [targetUrl, setTargetUrl] = useState("");
  const [status, setStatus] = useState<"PUBLISHED" | "DRAFT">("PUBLISHED");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!title.trim() || !summary.trim() || !content.trim()) {
      setError("Vui lòng điền đầy đủ tiêu đề, tóm tắt và nội dung bài viết.");
      return;
    }

    if (isSponsored && !sponsorName.trim()) {
      setError("Khi chọn bài viết tài trợ, vui lòng nhập Tên đối tác / Nhà tài trợ.");
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch("/api/admin/news", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          category,
          summary: summary.trim(),
          content: content.trim(),
          author: author.trim(),
          readTime: readTime.trim(),
          isFeatured,
          isSponsored,
          sponsorInfo: isSponsored
            ? {
                sponsorName: sponsorName.trim(),
                targetUrl: targetUrl.trim(),
              }
            : undefined,
          status,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Tạo bài viết thất bại.");
      }

      router.push("/admin/news");
      router.refresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Đã có lỗi xảy ra";
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full px-6 sm:px-8 py-6 space-y-7 max-w-4xl mx-auto">
      {/* 1. TOP HEADER & BACK */}
      <div className="flex items-center gap-3">
        <Link
          href="/admin/news"
          className="inline-flex items-center justify-center h-9 w-9 rounded-xl border border-slate-200 bg-white text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition-colors shadow-2xs"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
            Tạo bài viết mới
          </h1>
          <p className="text-xs text-slate-500">
            Xuất bản bài viết định hướng hoặc nội dung truyền thông cho sinh viên
          </p>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-xs font-medium text-red-700 flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* 2. MAIN FORM */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-2xs space-y-5">
          {/* Title */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700">
              Tiêu đề bài viết <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ví dụ: Du học không bắt đầu từ một bộ hồ sơ"
              className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-blue-600 shadow-2xs"
              required
            />
          </div>

          {/* Category & Read Time & Author */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Chuyên mục</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-medium text-slate-800 focus:outline-none focus:border-blue-600 shadow-2xs"
              >
                <option value="ORIENTATION">Định hướng</option>
                <option value="STUDY_ABROAD">Du học &amp; Học bổng</option>
                <option value="DISCIPLINES">Khối ngành</option>
                <option value="POSTGRAD">Sau đại học</option>
                <option value="SKILLS_CV">Kỹ năng &amp; CV</option>
                <option value="SCHOLARSHIPS">Học bổng</option>
                <option value="ACTIVITIES">Hoạt động sinh viên</option>
                <option value="RECRUITMENT">Tuyển dụng &amp; MT</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Tác giả</label>
              <input
                type="text"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-blue-600 shadow-2xs"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Thời gian đọc</label>
              <input
                type="text"
                value={readTime}
                onChange={(e) => setReadTime(e.target.value)}
                placeholder="Ví dụ: 6 phút đọc"
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-blue-600 shadow-2xs"
              />
            </div>
          </div>

          {/* Summary */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700">
              Đoạn tóm tắt (Lead / Summary) <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={2}
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="Mô tả ngắn gọn nội dung bài viết hiển thị ở thẻ danh mục..."
              className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-blue-600 shadow-2xs leading-relaxed"
              required
            />
          </div>

          {/* Content */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700">
              Nội dung bài viết (Markdown hoặc văn bản) <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={10}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Nhập nội dung bài viết chi tiết tại đây..."
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-xs text-slate-900 focus:outline-none focus:border-blue-600 shadow-2xs leading-relaxed font-mono"
              required
            />
          </div>
        </div>

        {/* 3. SETTINGS & SPONSORSHIP (FR-NEWS-05, FR-NEWS-06, FR-NEWS-07) */}
        <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-2xs space-y-5">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-600">
            Cấu hình hiển thị &amp; Tài trợ
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Featured toggle */}
            <label className="flex items-start gap-3 p-3.5 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer transition-colors">
              <input
                type="checkbox"
                checked={isFeatured}
                onChange={(e) => setIsFeatured(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <div className="space-y-0.5">
                <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-blue-600" />
                  Tin nổi bật (Hero Banner)
                </span>
                <p className="text-[11px] text-slate-400">
                  Ghim lên vị trí "Ban biên tập đề xuất" đầu trang thư viện tin tức.
                </p>
              </div>
            </label>

            {/* Sponsored toggle */}
            <label className="flex items-start gap-3 p-3.5 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer transition-colors">
              <input
                type="checkbox"
                checked={isSponsored}
                onChange={(e) => setIsSponsored(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-slate-300 text-amber-600 focus:ring-amber-500"
              />
              <div className="space-y-0.5">
                <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <Award className="h-3.5 w-3.5 text-amber-600" />
                  Nội dung tài trợ (Sponsored)
                </span>
                <p className="text-[11px] text-slate-400">
                  Gắn nhãn minh bạch "Được tài trợ" theo quy chuẩn FR-NEWS-06.
                </p>
              </div>
            </label>
          </div>

          {/* Conditional Sponsor Info */}
          {isSponsored && (
            <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/40 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-amber-900">
                  Tên Nhà tài trợ / Đối tác đồng hành <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={sponsorName}
                  onChange={(e) => setSponsorName(e.target.value)}
                  placeholder="Ví dụ: Tập đoàn Unilever Vietnam, Shopee, v.v."
                  className="w-full rounded-xl border border-amber-300 bg-white px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-amber-600"
                  required={isSponsored}
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-amber-900">
                  Đường dẫn chiến dịch / Trang tuyển dụng
                </label>
                <input
                  type="url"
                  value={targetUrl}
                  onChange={(e) => setTargetUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full rounded-xl border border-amber-300 bg-white px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-amber-600"
                />
              </div>
            </div>
          )}

          {/* Status selector */}
          <div className="pt-2 flex items-center gap-4">
            <label className="text-xs font-bold text-slate-700">Trạng thái xuất bản:</label>
            <div className="flex items-center gap-3 text-xs">
              <label className="inline-flex items-center gap-1.5 cursor-pointer">
                <input
                  type="radio"
                  name="status"
                  value="PUBLISHED"
                  checked={status === "PUBLISHED"}
                  onChange={() => setStatus("PUBLISHED")}
                  className="text-blue-600"
                />
                <span className="font-semibold text-slate-800">Xuất bản ngay</span>
              </label>
              <label className="inline-flex items-center gap-1.5 cursor-pointer">
                <input
                  type="radio"
                  name="status"
                  value="DRAFT"
                  checked={status === "DRAFT"}
                  onChange={() => setStatus("DRAFT")}
                  className="text-blue-600"
                />
                <span className="font-medium text-slate-600">Lưu bản nháp</span>
              </label>
            </div>
          </div>
        </div>

        {/* 4. ACTIONS */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Link href="/admin/news">
            <button
              type="button"
              className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-2xs transition-colors"
            >
              Hủy bỏ
            </button>
          </Link>

          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-2.5 text-xs font-semibold text-white shadow-sm shadow-blue-500/25 hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {isSubmitting ? (
              <>
                <div className="h-3.5 w-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                <span>Đang xử lý...</span>
              </>
            ) : (
              <>
                <Send className="h-3.5 w-3.5" />
                <span>Hoàn tất &amp; Lưu bài viết</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
