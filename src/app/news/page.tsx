"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Bookmark,
  ArrowRight,
  ChevronRight,
  Search,
  ChevronDown,
  Sparkles,
  Award,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface NewsItem {
  _id?: string;
  id?: string;
  slug?: string;
  title: string;
  summary?: string;
  description?: string;
  category: string;
  categoryColor?: string;
  author: string;
  readTime: string;
  isFeatured?: boolean;
  isSponsored?: boolean;
}

const CATEGORY_COLORS: Record<string, string> = {
  DU_HOC: "bg-blue-50 text-blue-700 border-blue-100",
  STUDY_ABROAD: "bg-blue-50 text-blue-700 border-blue-100",
  KHOI_NGANH: "bg-purple-50 text-purple-700 border-purple-100",
  DISCIPLINES: "bg-purple-50 text-purple-700 border-purple-100",
  KY_NANG_CV: "bg-sky-50 text-sky-700 border-sky-100",
  SKILLS_CV: "bg-sky-50 text-sky-700 border-sky-100",
  SAU_DAI_HOC: "bg-indigo-50 text-indigo-700 border-indigo-100",
  POSTGRAD: "bg-indigo-50 text-indigo-700 border-indigo-100",
  HOC_BONG: "bg-emerald-50 text-emerald-700 border-emerald-100",
  SCHOLARSHIPS: "bg-emerald-50 text-emerald-700 border-emerald-100",
  HOAT_DONG_SINH_VIEN: "bg-cyan-50 text-cyan-700 border-cyan-100",
  ACTIVITIES: "bg-cyan-50 text-cyan-700 border-cyan-100",
  ORIENTATION: "bg-blue-50 text-blue-700 border-blue-100",
};

const DEFAULT_ARTICLES: NewsItem[] = [
  {
    id: "1",
    slug: "du-hoc-khong-bat-dau-tu-mot-bo-ho-so",
    category: "DU HỌC",
    title: "Du học không bắt đầu từ một bộ hồ sơ",
    description:
      "Cách xác định mục tiêu, chọn điểm đến và chuẩn bị nguồn lực trước khi nộp đơn.",
    author: "Ban biên tập Polaris",
    readTime: "8 phút đọc",
  },
  {
    id: "2",
    slug: "kinh-te-quan-tri-ban-se-hoc-va-lam-gi",
    category: "KHỐI NGÀNH",
    title: "Kinh tế – Quản trị: Bạn sẽ học và làm gì?",
    description:
      "Hiểu về chương trình học, nhóm kỹ năng và các hướng nghề nghiệp sau tốt nghiệp.",
    author: "Ban biên tập Polaris",
    readTime: "6 phút đọc",
  },
  {
    id: "3",
    slug: "cv-dau-tien-it-kinh-nghiem-van-co-diem-manh",
    category: "KỸ NĂNG & CV",
    title: "CV đầu tiên: ít kinh nghiệm, vẫn có điểm mạnh",
    description:
      "Biến dự án môn học và hoạt động sinh viên thành câu chuyện năng lực của bạn.",
    author: "Ban biên tập Polaris",
    readTime: "5 phút đọc",
  },
  {
    id: "4",
    slug: "hoc-thac-si-ngay-hay-di-lam-truoc",
    category: "SAU ĐẠI HỌC",
    title: "Học thạc sĩ ngay hay đi làm trước?",
    description:
      "Những câu hỏi cần tự trả lời để lựa chọn thời điểm học tiếp phù hợp với mình.",
    author: "Ban biên tập Polaris",
    readTime: "7 phút đọc",
  },
  {
    id: "5",
    slug: "tim-hoc-bong-phu-hop-khong-chi-hoc-bong-lon",
    category: "HỌC BỔNG",
    title: "Tìm học bổng phù hợp, không chỉ học bổng lớn",
    description:
      "Một cách tiếp cận có hệ thống để tìm kiếm, sàng lọc và theo dõi cơ hội học bổng.",
    author: "Ban biên tập Polaris",
    readTime: "6 phút đọc",
  },
  {
    id: "6",
    slug: "bat-dau-nghien-cuu-khoa-hoc-tu-nam-dai-hoc",
    category: "HOẠT ĐỘNG SINH VIÊN",
    title: "Bắt đầu nghiên cứu khoa học từ năm đại học",
    description:
      "Từ một câu hỏi nhỏ đến đề tài đầu tiên: cách tìm chủ đề, nhóm và người hướng dẫn.",
    author: "Ban biên tập Polaris",
    readTime: "9 phút đọc",
  },
];

export default function NewsPage() {
  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [articles, setArticles] = useState<NewsItem[]>(DEFAULT_ARTICLES);
  const [featured, setFeatured] = useState<NewsItem | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [savedArticles, setSavedArticles] = useState<Record<string, boolean>>({});

  const tabs = [
    { id: "all", label: "Tất cả" },
    { id: "orientation", label: "Định hướng" },
    { id: "study_abroad", label: "Du học" },
    { id: "disciplines", label: "Khối ngành" },
    { id: "postgrad", label: "Sau đại học" },
    { id: "skills_cv", label: "Kỹ năng & CV" },
    { id: "scholarships", label: "Học bổng" },
  ];

  useEffect(() => {
    async function fetchNews() {
      try {
        const params = new URLSearchParams({
          page: page.toString(),
          limit: "6",
          ...(activeTab !== "all" && { category: activeTab }),
          ...(searchQuery && { search: searchQuery }),
        });
        const res = await fetch(`/api/news?${params}`);
        if (res.ok) {
          const data = await res.json();
          if (data.articles && data.articles.length > 0) {
            setArticles(data.articles);
            setTotalPages(data.totalPages || 1);
          }
          if (data.featuredArticle) {
            setFeatured(data.featuredArticle);
          }
        }
      } catch {
        // Fallback to default
      }
    }
    fetchNews();
  }, [activeTab, searchQuery, page]);

  const toggleSaveArticle = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setSavedArticles((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const featuredTitle =
    featured?.title ||
    "Chưa biết mình phù hợp với ngành nào? Bắt đầu từ đây.";
  const featuredSummary =
    featured?.summary ||
    "Một hướng dẫn để hiểu bản thân, tìm hiểu ngành học và biến những băn khoăn thành kế hoạch cụ thể.";
  const featuredSlug =
    featured?.slug || "chua-biet-minh-phu-hop-voi-nganh-nao-bat-dau-tu-day";

  return (
    <div className="w-full px-6 sm:px-8 py-6 space-y-7">
      {/* 1. TOP HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <span className="text-[11px] font-semibold tracking-wider text-blue-600 uppercase">
            THƯ VIỆN ĐỊNH HƯỚNG
          </span>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Đọc hôm nay, vững bước ngày mai.
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-500">
            Cẩm nang, góc nhìn và tài liệu giúp bạn tự tin lựa chọn hành trình của mình.
          </p>
        </div>

        {/* Saved Articles Button */}
        <button
          type="button"
          onClick={() => alert(`Bạn đang lưu ${Object.values(savedArticles).filter(Boolean).length} bài viết.`)}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 transition-colors self-start sm:self-auto"
        >
          <Bookmark className="h-4 w-4 text-slate-500" />
          <span>Bài viết đã lưu</span>
        </button>
      </div>

      {/* 2. SPLIT FEATURED SECTION */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2/3 width) - Featured Article Banner */}
        <div className="lg:col-span-2 rounded-2xl border border-blue-200/70 bg-gradient-to-r from-blue-100/80 via-[#EBF3FE] to-blue-100/60 p-7 sm:p-8 flex flex-col justify-between shadow-2xs">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="rounded-md bg-white/90 border border-white px-2.5 py-1 text-[10px] font-bold tracking-wider text-slate-700 uppercase shadow-2xs">
                BAN BIÊN TẬP ĐỀ XUẤT
              </span>
              <button
                type="button"
                onClick={(e) => toggleSaveArticle("featured", e)}
                className="text-slate-400 hover:text-blue-600 p-1"
                title="Lưu bài viết"
              >
                <Bookmark
                  className={cn(
                    "h-4 w-4",
                    savedArticles["featured"] && "fill-blue-600 text-blue-600"
                  )}
                />
              </button>
            </div>

            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 leading-tight">
              {featuredTitle}
            </h2>

            <p className="text-xs sm:text-sm text-slate-600 max-w-xl leading-relaxed">
              {featuredSummary}
            </p>
          </div>

          <div className="mt-6 pt-4 flex flex-wrap items-center gap-4">
            <Link href={`/news/${featuredSlug}`}>
              <button
                type="button"
                className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-sm shadow-blue-500/25 hover:bg-blue-700 transition-colors"
              >
                <span>Đọc bài viết</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </Link>
            <span className="text-xs text-slate-500">
              Ban biên tập Polaris · 8 phút đọc
            </span>
          </div>
        </div>

        {/* Right Column (1/3 width) - Step Guide */}
        <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-2xs flex flex-col justify-between">
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-slate-900">
              Mới bắt đầu? Đọc theo lộ trình
            </h3>
            <p className="text-[11px] text-slate-400">
              3 chủ đề, từng bước rõ hướng đi.
            </p>
          </div>

          <div className="mt-4 space-y-3 divide-y divide-slate-100">
            {/* Step 01 */}
            <Link
              href="/onboarding"
              className="group flex items-center justify-between pt-3 first:pt-0"
            >
              <div className="flex items-start gap-3">
                <span className="text-xs font-bold text-slate-400 group-hover:text-blue-600">
                  01
                </span>
                <div>
                  <p className="text-xs font-bold text-slate-800 group-hover:text-blue-600 transition-colors">
                    Hiểu mình trước khi chọn ngành
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Khám phá thế mạnh &amp; sở thích
                  </p>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all" />
            </Link>

            {/* Step 02 */}
            <Link
              href="/explore"
              className="group flex items-center justify-between pt-3"
            >
              <div className="flex items-start gap-3">
                <span className="text-xs font-bold text-slate-400 group-hover:text-blue-600">
                  02
                </span>
                <div>
                  <p className="text-xs font-bold text-slate-800 group-hover:text-blue-600 transition-colors">
                    Tìm hiểu ngành học và cơ hội
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Nhìn xa hơn tên gọi của ngành
                  </p>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all" />
            </Link>

            {/* Step 03 */}
            <Link
              href="/roadmap"
              className="group flex items-center justify-between pt-3"
            >
              <div className="flex items-start gap-3">
                <span className="text-xs font-bold text-slate-400 group-hover:text-blue-600">
                  03
                </span>
                <div>
                  <p className="text-xs font-bold text-slate-800 group-hover:text-blue-600 transition-colors">
                    Lên kế hoạch cho bước tiếp theo
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Từ mục tiêu đến hành động
                  </p>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all" />
            </Link>
          </div>
        </div>
      </section>

      {/* 3. FILTER TABS & SEARCH BAR */}
      <section className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        {/* Horizontal Category Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          {tabs.map((tab) => {
            const isSelected = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setActiveTab(tab.id);
                  setPage(1);
                }}
                className={cn(
                  "rounded-full px-3.5 py-1.5 text-xs font-medium transition-all whitespace-nowrap",
                  isSelected
                    ? "bg-blue-600 text-white shadow-2xs font-semibold"
                    : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
                )}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Search Input for Library */}
        <div className="relative w-full md:w-72 shrink-0">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm trong thư viện bài viết..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(1);
            }}
            className="w-full rounded-full border border-slate-200 bg-white py-1.5 pl-8 pr-4 text-xs text-slate-800 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all"
          />
        </div>
      </section>

      {/* 4. ARTICLES GRID */}
      <section className="space-y-4">
        {/* Header with Sort Dropdown */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900">Bài viết mới nhất</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Góc nhìn từ đội ngũ biên tập Polaris
            </p>
          </div>

          <div className="relative">
            <button
              type="button"
              className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50 shadow-2xs"
            >
              <span>Mới nhất</span>
              <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
            </button>
          </div>
        </div>

        {/* Article Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {articles.map((item) => {
            const itemKey = item._id || item.id || item.slug || item.title;
            const itemSlug = item.slug || item.id;
            const categoryBadgeColor =
              item.categoryColor ||
              CATEGORY_COLORS[item.category] ||
              "bg-blue-50 text-blue-700 border-blue-100";

            return (
              <Link
                key={itemKey}
                href={`/news/${itemSlug}`}
                className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-2xs hover:shadow-md hover:border-blue-200 transition-all flex flex-col justify-between group"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span
                        className={cn(
                          "rounded-md border px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase",
                          categoryBadgeColor
                        )}
                      >
                        {item.category}
                      </span>

                      {item.isSponsored && (
                        <span className="inline-flex items-center gap-1 rounded-md border border-amber-200 bg-amber-50 px-1.5 py-0.5 text-[9px] font-bold text-amber-800">
                          <Award className="h-2.5 w-2.5" /> Tài trợ
                        </span>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={(e) => toggleSaveArticle(itemKey, e)}
                      className="text-slate-400 hover:text-blue-600 p-1"
                      title="Lưu bài viết"
                    >
                      <Bookmark
                        className={cn(
                          "h-4 w-4",
                          savedArticles[itemKey] && "fill-blue-600 text-blue-600"
                        )}
                      />
                    </button>
                  </div>

                  <div>
                    <h4 className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors leading-snug">
                      {item.title}
                    </h4>
                    <p className="mt-1.5 text-xs text-slate-500 line-clamp-2 leading-relaxed">
                      {item.summary || item.description}
                    </p>
                  </div>
                </div>

                <div className="mt-6 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                  <span>{item.author}</span>
                  <div className="flex items-center gap-2">
                    <span>{item.readTime}</span>
                    <ArrowRight className="h-3.5 w-3.5 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all" />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* 5. PAGINATION & FOOTER NOTE */}
      <section className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4">
        <p className="text-xs text-slate-400 text-center sm:text-left">
          Bài viết từ quản trị viên · Kiến thức cho hành trình sinh viên
        </p>

        {/* Pagination controls */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-xs text-slate-600 hover:bg-slate-50 shadow-2xs disabled:opacity-40"
            aria-label="Previous page"
          >
            &lt;
          </button>
          <button
            type="button"
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-xs font-semibold text-white shadow-2xs"
          >
            {page}
          </button>
          <span className="px-2 text-xs text-slate-500">Trang {page} / {totalPages}</span>
          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 h-8 text-xs font-medium text-slate-600 hover:bg-slate-50 shadow-2xs disabled:opacity-40"
          >
            <span>Tiếp theo</span>
            <span>&gt;</span>
          </button>
        </div>
      </section>
    </div>
  );
}
