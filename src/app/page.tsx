import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import HomeExploreArticles from "@/components/home/HomeExploreArticles";
import HomeRoadmapCard from "@/components/home/HomeRoadmapCard";
import HomeUpcomingDeadlines from "@/components/home/HomeUpcomingDeadlines";

export default function HomePage() {
  return (
    <div className="w-full px-6 sm:px-8 py-6 space-y-7">
      {/* 1. TOP HEADER & STATUS */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Khởi đầu vững chắc giúp bạn tiến xa hơn
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-500">
            Một khởi đầu mới. Một bước gần hơn với tương lai bạn chọn.
          </p>
        </div>

        {/* Ready status pill */}
        <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3.5 py-1.5 shadow-2xs self-start sm:self-auto">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-medium text-slate-600">Sẵn sàng cho bước tiếp theo</span>
        </div>
      </div>

      {/* 2. HERO BANNER */}
      <section className="relative overflow-hidden rounded-3xl border border-blue-200/60 bg-gradient-to-r from-[#D9EBFE] via-[#E6F1FE] to-[#D1E6FD] p-8 sm:p-10 shadow-xs">
        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left Text & CTAs */}
          <div className="lg:col-span-7 space-y-4">
            <span className="text-[11px] font-semibold tracking-wider text-blue-700 uppercase">
              TƯƠNG LAI BẮT ĐẦU TỪ BẠN
            </span>

            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 leading-[1.2]">
              Tìm hướng đi. Vững bước tương lai.
            </h2>

            <p className="text-sm sm:text-base text-slate-600 max-w-xl leading-relaxed">
              Khám phá thế mạnh, xây lộ trình đại học và cập nhật các hoạt động sinh viên phù hợp trên hành trình phát triển sự nghiệp.
            </p>

            <div className="pt-2 flex flex-wrap items-center gap-3">
              <Link href="/roadmap">
                <button
                  type="button"
                  className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-sm shadow-blue-500/25 hover:bg-blue-700 transition-colors"
                >
                  <span>Tiếp tục lộ trình</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </Link>
              <Link href="/activities">
                <button
                  type="button"
                  className="flex items-center gap-2 rounded-xl border border-white/80 bg-white/80 px-5 py-2.5 text-xs sm:text-sm font-semibold text-slate-800 shadow-2xs hover:bg-white transition-all backdrop-blur-xs"
                >
                  <span>Hoạt động sinh viên</span>
                  <ArrowRight className="h-4 w-4 text-slate-600" />
                </button>
              </Link>
            </div>
          </div>

          {/* Right Orbital Graphic & Floating Card */}
          <div className="lg:col-span-5 relative flex items-center justify-center py-4">
            {/* Orbital concentric rings graphic */}
            <div className="relative flex items-center justify-center w-64 h-64 sm:w-72 sm:h-72">
              <div className="absolute inset-0 rounded-full border border-blue-300/40" />
              <div className="absolute inset-6 rounded-full border border-blue-300/60" />
              <div className="absolute inset-12 rounded-full border border-blue-300/80" />

              {/* Floating Highlight Card */}
              <div className="relative z-10 w-full max-w-[280px] rounded-2xl border border-white/90 bg-white/95 p-4 shadow-lg shadow-blue-900/10 backdrop-blur-md">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-purple-100 text-purple-600">
                    <Sparkles className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-900 truncate">
                      Mỗi bước nhỏ, một tương lai lớn
                    </p>
                    <p className="text-[11px] text-slate-400 truncate">
                      Hành trình của riêng bạn
                    </p>
                  </div>
                </div>

                {/* Card progress bar */}
                <div className="mt-3 h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
                  <div className="h-full rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 w-2/3" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. TWO-COLUMN GRID: ROADMAP & UPCOMING DEADLINES */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2/3 width): Lộ trình của tôi */}
        <div className="lg:col-span-2 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900">Lộ trình của tôi</h3>
            <Link
              href="/roadmap"
              className="flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700 transition-colors"
            >
              <span>Xem lộ trình</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="flex-1">
            <HomeRoadmapCard />
          </div>
        </div>

        {/* Right Column (1/3 width): Hạn sắp tới */}
        <HomeUpcomingDeadlines />
      </section>

      {/* 4. ORIENTATION EXPLORE ARTICLES */}
      <HomeExploreArticles />
    </div>
  );
}
