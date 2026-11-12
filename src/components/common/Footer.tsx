import Link from "next/link";
import { Sparkles, Heart } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-gray-200 bg-gray-50/50 py-12 text-sm text-gray-600">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white">
                <Sparkles className="h-4 w-4" />
              </div>
              <span className="text-lg font-bold text-gray-900">UNERA</span>
            </div>
            <p className="text-xs text-gray-500 leading-relaxed">
              Nền tảng định hướng học tập, khám phá hoạt động sinh viên và quản lý lộ trình phát triển sự nghiệp toàn diện dành riêng cho sinh viên đại học.
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-gray-900 mb-3 text-xs uppercase tracking-wider">
              Khám phá &amp; Hoạt động
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/explore" className="hover:text-indigo-600">
                  Khám phá định hướng
                </Link>
              </li>
              <li>
                <Link href="/activities" className="hover:text-indigo-600">
                  Tất cả hoạt động sinh viên
                </Link>
              </li>
              <li>
                <Link href="/news" className="hover:text-indigo-600">
                  Tin tức &amp; Sự kiện ULIS
                </Link>
              </li>
              <li>
                <Link href="/news/saved" className="hover:text-indigo-600">
                  Tin tức đã lưu
                </Link>
              </li>
              <li>
                <Link href="/activities?tab=followed" className="hover:text-indigo-600">
                  Hoạt động đã quan tâm
                </Link>
              </li>
              <li>
                <Link href="/onboarding" className="hover:text-indigo-600">
                  Trắc nghiệm định hướng
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-gray-900 mb-3 text-xs uppercase tracking-wider">
              Công cụ &amp; Hỗ trợ
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/roadmap" className="hover:text-indigo-600">
                  Lộ trình 4 năm đại học
                </Link>
              </li>
              <li>
                <Link href="/tools/cv-builder" className="hover:text-indigo-600">
                  Tạo CV song ngữ chuẩn
                </Link>
              </li>
              <li>
                <Link href="/notifications" className="hover:text-indigo-600">
                  Nhắc lịch &amp; Thông báo
                </Link>
              </li>
              <li>
                <Link href="/mentors" className="hover:text-indigo-600">
                  Kết nối Mentor định hướng
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-gray-900 mb-3 text-xs uppercase tracking-wider">
              Về UNERA
            </h4>
            <p className="text-xs text-gray-500 leading-relaxed mb-3">
              Dự án phát triển nền tảng định hướng học tập & nghề nghiệp sinh viên đại học.
            </p>
            <div className="text-xs text-gray-400">
              Phiên bản hệ thống: 1.0 (PRD 1.3 Baseline)
            </div>
          </div>
        </div>

        <div className="mt-8 border-t border-gray-200/80 pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-gray-500">
          <p>© 2026 UNERA. All rights reserved.</p>
          <p className="flex items-center gap-1 mt-2 sm:mt-0">
            Được phát triển với <Heart className="h-3.5 w-3.5 text-red-500 fill-red-500" /> cho sinh viên Việt Nam
          </p>
        </div>
      </div>
    </footer>
  );
}
export default Footer;
