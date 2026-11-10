import Link from "next/link";
import {
  ArrowRight,
  Bookmark,
  CheckCircle2,
  Circle,
  Briefcase,
  GraduationCap,
  Code,
  Sparkles,
} from "lucide-react";

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
              Tìm hướng đi. Mở cơ hội.
            </h2>

            <p className="text-sm sm:text-base text-slate-600 max-w-xl leading-relaxed">
              Khám phá thế mạnh, xây lộ trình và kết nối với những người giúp bạn tiến xa hơn trên hành trình sự nghiệp.
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
              <Link href="/explore">
                <button
                  type="button"
                  className="flex items-center gap-2 rounded-xl border border-white/80 bg-white/80 px-5 py-2.5 text-xs sm:text-sm font-semibold text-slate-800 shadow-2xs hover:bg-white transition-all backdrop-blur-xs"
                >
                  <span>Khám phá 7 lĩnh vực</span>
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
        <div className="lg:col-span-2 space-y-3">
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

          <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-2xs space-y-5">
            <div className="flex items-start justify-between">
              <div>
                <span className="inline-block rounded-md bg-purple-50 border border-purple-100 px-2.5 py-0.5 text-[11px] font-semibold text-purple-700">
                  Du học
                </span>
                <h4 className="mt-2 text-xl font-bold text-slate-900">
                  Trở thành Du học sinh Mỹ
                </h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  Giai đoạn 2 / 3 · Xây dựng nền tảng
                </p>
              </div>

              {/* Progress Stat */}
              <div className="text-right">
                <span className="text-2xl font-black text-blue-600">67%</span>
                <p className="text-[11px] text-slate-400 mt-0.5">8 / 12 bước hoàn tất</p>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="space-y-1.5">
              <div className="h-2 w-full rounded-full bg-blue-100/60 overflow-hidden">
                <div className="h-full rounded-full bg-blue-600 w-[67%]" />
              </div>
            </div>

            {/* Checklist items */}
            <div className="border-t border-slate-100 pt-4 space-y-3">
              <div className="flex items-center gap-2.5 text-xs text-slate-700">
                <CheckCircle2 className="h-4 w-4 text-blue-600 fill-blue-50 shrink-0" />
                <span className="font-medium line-through text-slate-400">Đạt GPA 4.5 Năm 4</span>
              </div>
              <div className="flex items-center justify-between text-xs text-slate-700">
                <div className="flex items-center gap-2.5">
                  <Circle className="h-4 w-4 text-slate-300 shrink-0" />
                  <span className="font-medium text-slate-800">Nộp cover letter</span>
                </div>
                <Link
                  href="/roadmap"
                  className="text-[11px] font-semibold text-blue-600 hover:underline"
                >
                  Bước tiếp theo
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (1/3 width): Hạn sắp tới */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900">Hạn sắp tới</h3>
            <Link
              href="/calendar"
              className="text-xs font-medium text-blue-600 hover:text-blue-700 transition-colors"
            >
              Xem tất cả
            </Link>
          </div>

          <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-2xs divide-y divide-slate-100">
            {/* Deadline Item 1 */}
            <div className="flex items-center justify-between py-3 first:pt-1 last:pb-1">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 flex-col items-center justify-center rounded-xl bg-blue-50 border border-blue-100 text-center">
                  <span className="text-sm font-bold text-blue-600 leading-none">12</span>
                  <span className="text-[9px] font-semibold text-slate-400 uppercase mt-0.5">TH 11</span>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-800 line-clamp-1">
                    Chương trình thực tập : SDSV Student
                  </p>
                  <p className="text-[11px] text-slate-400">Công việc thực tập</p>
                </div>
              </div>
              <span className="shrink-0 rounded-md bg-slate-50 px-2 py-1 text-[10px] font-medium text-slate-500">
                Còn 3 ngày
              </span>
            </div>

            {/* Deadline Item 2 */}
            <div className="flex items-center justify-between py-3">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 flex-col items-center justify-center rounded-xl bg-purple-50 border border-purple-100 text-center">
                  <span className="text-sm font-bold text-purple-600 leading-none">14</span>
                  <span className="text-[9px] font-semibold text-slate-400 uppercase mt-0.5">TH 11</span>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-800 line-clamp-1">
                    Workshop: Hiểu mình, chọn nghề
                  </p>
                  <p className="text-[11px] text-slate-400">Sự kiện trực tuyến</p>
                </div>
              </div>
              <span className="shrink-0 rounded-md bg-slate-50 px-2 py-1 text-[10px] font-medium text-slate-500">
                Còn 5 ngày
              </span>
            </div>

            {/* Deadline Item 3 */}
            <div className="flex items-center justify-between py-3 last:pb-1">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 flex-col items-center justify-center rounded-xl bg-amber-50 border border-amber-100 text-center">
                  <span className="text-sm font-bold text-amber-600 leading-none">18</span>
                  <span className="text-[9px] font-semibold text-slate-400 uppercase mt-0.5">TH 11</span>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-800 line-clamp-1">
                    Chương trình thực tập mùa đông
                  </p>
                  <p className="text-[11px] text-slate-400">Cơ hội đã lưu</p>
                </div>
              </div>
              <span className="shrink-0 rounded-md bg-slate-50 px-2 py-1 text-[10px] font-medium text-slate-500">
                Còn 9 ngày
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* 4. FEATURED OPPORTUNITIES */}
      <section className="space-y-4 pt-1">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-slate-900">Cơ hội nổi bật</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Được chọn cho bước tiến tiếp theo của bạn
            </p>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
            <button
              type="button"
              className="rounded-full bg-blue-50 border border-blue-200 px-3.5 py-1 text-xs font-semibold text-blue-700 shadow-2xs"
            >
              Dành cho bạn
            </button>
            <button
              type="button"
              className="rounded-full bg-white border border-slate-200 px-3.5 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors"
            >
              Thực tập
            </button>
            <button
              type="button"
              className="rounded-full bg-white border border-slate-200 px-3.5 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors"
            >
              Học bổng
            </button>
            <Link
              href="/explore"
              className="flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 ml-2 whitespace-nowrap"
            >
              <span>Xem tất cả</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>

        {/* 3 Opportunity Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Opportunity Card 1 */}
          <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-2xs hover:shadow-md hover:border-blue-200 transition-all flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 border border-blue-100 text-blue-600">
                    <Briefcase className="h-4 w-4" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-blue-700 tracking-wider uppercase">
                      THỰC TẬP
                    </span>
                    <p className="text-[11px] text-slate-400">Hà Nội · Hybrid</p>
                  </div>
                </div>

                <button
                  type="button"
                  className="text-slate-400 hover:text-blue-600 p-1"
                  title="Lưu cơ hội"
                >
                  <Bookmark className="h-4 w-4" />
                </button>
              </div>

              <div>
                <h4 className="text-sm font-bold text-slate-900 group-hover:text-blue-600">
                  UX/UI Design Intern
                </h4>
                <p className="mt-1 text-xs text-slate-500 line-clamp-2 leading-relaxed">
                  Dành cho người yêu trải nghiệm số và muốn tạo ra sản phẩm có ý nghĩa.
                </p>
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="rounded-md bg-blue-50 px-2 py-0.5 text-[11px] font-medium text-blue-700">
                Phù hợp lộ trình
              </span>
              <div className="flex items-center gap-1 text-[11px] text-slate-400 font-medium">
                <span>Hạn nộp: 18/11</span>
                <ArrowRight className="h-3 w-3 text-slate-400" />
              </div>
            </div>
          </div>

          {/* Opportunity Card 2 */}
          <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-2xs hover:shadow-md hover:border-blue-200 transition-all flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-50 border border-purple-100 text-purple-600">
                    <GraduationCap className="h-4 w-4" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-purple-700 tracking-wider uppercase">
                      HỌC BỔNG
                    </span>
                    <p className="text-[11px] text-slate-400">Trực tuyến · 8 tuần</p>
                  </div>
                </div>

                <button
                  type="button"
                  className="text-slate-400 hover:text-blue-600 p-1"
                  title="Lưu cơ hội"
                >
                  <Bookmark className="h-4 w-4" />
                </button>
              </div>

              <div>
                <h4 className="text-sm font-bold text-slate-900">
                  Digital Skills Scholarship
                </h4>
                <p className="mt-1 text-xs text-slate-500 line-clamp-2 leading-relaxed">
                  Phát triển kỹ năng công nghệ với chương trình hỗ trợ học phí 100%.
                </p>
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="rounded-md bg-purple-50 px-2 py-0.5 text-[11px] font-medium text-purple-700">
                Đang mở đơn
              </span>
              <div className="flex items-center gap-1 text-[11px] text-slate-400 font-medium">
                <span>Hạn nộp: 25/11</span>
                <ArrowRight className="h-3 w-3 text-slate-400" />
              </div>
            </div>
          </div>

          {/* Opportunity Card 3 */}
          <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-2xs hover:shadow-md hover:border-blue-200 transition-all flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-50 border border-teal-100 text-teal-600">
                    <Code className="h-4 w-4" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-teal-700 tracking-wider uppercase">
                      CUỘC THI
                    </span>
                    <p className="text-[11px] text-slate-400">Toàn quốc · Đội 2-4 người</p>
                  </div>
                </div>

                <button
                  type="button"
                  className="text-slate-400 hover:text-blue-600 p-1"
                  title="Lưu cơ hội"
                >
                  <Bookmark className="h-4 w-4" />
                </button>
              </div>

              <div>
                <h4 className="text-sm font-bold text-slate-900">
                  Build for Tomorrow 2026
                </h4>
                <p className="mt-1 text-xs text-slate-500 line-clamp-2 leading-relaxed">
                  Cùng đồng đội giải bài toán thực tế và biến ý tưởng thành sản phẩm.
                </p>
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="rounded-md bg-teal-50 px-2 py-0.5 text-[11px] font-medium text-teal-700">
                Công nghệ
              </span>
              <div className="flex items-center gap-1 text-[11px] text-slate-400 font-medium">
                <span>Hạn đăng ký: 30/11</span>
                <ArrowRight className="h-3 w-3 text-slate-400" />
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
