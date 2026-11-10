import Link from "next/link";
import {
  Compass,
  Map,
  Calendar,
  Sparkles,
  ArrowRight,
  GraduationCap,
  Building2,
  Trophy,
  Microscope,
  Award,
  Users,
  CheckCircle2,
  Clock,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { OPPORTUNITY_CATEGORIES } from "@/constants";

export default function HomePage() {
  const categories = [
    {
      ...OPPORTUNITY_CATEGORIES.STUDY_ABROAD,
      icon: GraduationCap,
      color: "text-blue-600 bg-blue-50 border-blue-200",
    },
    {
      ...OPPORTUNITY_CATEGORIES.MULTINATIONAL,
      icon: Building2,
      color: "text-purple-600 bg-purple-50 border-purple-200",
    },
    {
      ...OPPORTUNITY_CATEGORIES.MANAGEMENT_TRAINEE,
      icon: Award,
      color: "text-amber-600 bg-amber-50 border-amber-200",
    },
    {
      ...OPPORTUNITY_CATEGORIES.SCIENTIFIC_RESEARCH,
      icon: Microscope,
      color: "text-emerald-600 bg-emerald-50 border-emerald-200",
    },
    {
      ...OPPORTUNITY_CATEGORIES.COMPETITIONS,
      icon: Trophy,
      color: "text-rose-600 bg-rose-50 border-rose-200",
    },
    {
      ...OPPORTUNITY_CATEGORIES.AMBASSADOR_PROGRAMS,
      icon: Users,
      color: "text-cyan-600 bg-cyan-50 border-cyan-200",
    },
  ];

  return (
    <div className="flex flex-col">
      {/* 1. HERO SECTION */}
      <section className="relative overflow-hidden bg-gradient-to-b from-indigo-50/60 via-white to-white py-20 sm:py-28">
        <div className="absolute inset-0 -z-10 bg-[linear-gradient(to_right,#e5e7eb_1px,transparent_1px),linear-gradient(to_bottom,#e5e7eb_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-40" />

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center space-y-6">
            <Badge variant="default" className="py-1 px-3 text-xs tracking-wide">
              <Sparkles className="mr-1.5 h-3.5 w-3.5" /> Nền tảng định hướng sinh viên đại học
            </Badge>

            <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 sm:text-6xl sm:leading-[1.15]">
              Định hướng rõ ràng. <br />
              <span className="bg-gradient-to-r from-indigo-600 via-indigo-700 to-violet-600 bg-clip-text text-transparent">
                Làm chủ 4 năm đại học.
              </span>
            </h1>

            <p className="text-lg text-gray-600 sm:text-xl leading-relaxed">
              Khám phá cơ hội học bổng, thực tập MNC, nghiên cứu khoa học. Xây dựng lộ trình phát triển cá nhân theo từng kỳ học và không bao giờ bỏ lỡ bất kỳ hạn chót nào.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
              <Link href="/onboarding" className="w-full sm:w-auto">
                <Button size="lg" className="w-full sm:w-auto gap-2 shadow-lg shadow-indigo-500/25">
                  Làm bài trắc nghiệm định hướng
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/explore" className="w-full sm:w-auto">
                <Button variant="outline" size="lg" className="w-full sm:w-auto">
                  Khám phá các cơ hội
                </Button>
              </Link>
            </div>

            <div className="pt-8 flex flex-wrap items-center justify-center gap-6 text-xs text-gray-500">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" /> Dữ liệu thẩm định bởi Admin
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="h-4 w-4 text-indigo-500" /> Nhắc hẹn hạn chót 7, 3, 1 ngày
              </span>
              <span className="flex items-center gap-1.5">
                <FileText className="h-4 w-4 text-violet-500" /> Tạo CV chuẩn song ngữ
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* 2. OPPORTUNITY CATEGORIES */}
      <section className="py-16 bg-gray-50/60 border-t border-gray-100">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl">
              Cơ hội chọn lọc cho mọi định hướng
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Tổng hợp, phân loại và cập nhật liên tục từ các nguồn chính thống uy tín.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {categories.map((cat) => {
              const Icon = cat.icon;
              return (
                <Link key={cat.id} href={`/explore?category=${cat.id}`}>
                  <Card className="h-full hover:shadow-md hover:border-indigo-300 transition-all cursor-pointer group">
                    <CardContent className="p-6 flex flex-col h-full justify-between">
                      <div className="space-y-4">
                        <div
                          className={`inline-flex p-3 rounded-xl border ${cat.color} group-hover:scale-105 transition-transform`}
                        >
                          <Icon className="h-6 w-6" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-lg text-gray-900 group-hover:text-indigo-600 transition-colors">
                            {cat.label}
                          </h3>
                          <p className="mt-1 text-sm text-gray-500 leading-relaxed">
                            {cat.description}
                          </p>
                        </div>
                      </div>
                      <div className="mt-6 flex items-center text-xs font-medium text-indigo-600">
                        <span>Xem danh sách cơ hội</span>
                        <ArrowRight className="ml-1 h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* 3. CORE HIGHLIGHTS */}
      <section className="py-20 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="space-y-3 p-6 rounded-2xl bg-indigo-50/50 border border-indigo-100">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white">
                <Map className="h-5 w-5" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">Lộ trình 4 năm cá nhân hóa</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Được cấu trúc theo từng năm học, kỳ học, mục tiêu và từng đầu việc cụ thể. Tự động tái sinh lộ trình khi bạn cập nhật mục tiêu mới.
              </p>
            </div>

            <div className="space-y-3 p-6 rounded-2xl bg-violet-50/50 border border-violet-100">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-600 text-white">
                <Calendar className="h-5 w-5" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">Quản lý hạn chót thông minh</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Chủ động chọn &quot;Thêm vào lịch&quot; cho cơ hội bạn quan tâm. Hệ thống tự động gửi nhắc nhở qua In-app và Email trước 7, 3 và 1 ngày.
              </p>
            </div>

            <div className="space-y-3 p-6 rounded-2xl bg-rose-50/50 border border-rose-100">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-600 text-white">
                <Compass className="h-5 w-5" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">Theo dõi ứng tuyển &amp; Kanban</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Bảng Kanban trực quan giúp bạn kiểm soát tiến độ từng bộ hồ sơ: từ Quan tâm, Đang chuẩn bị, Đã nộp đơn đến Phỏng vấn và Nhận kết quả.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
