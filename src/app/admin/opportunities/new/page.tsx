"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Briefcase,
  ArrowLeft,
  Save,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Calendar,
  Sparkles,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function NewOpportunityPage() {
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("employment");
  const [description, setDescription] = useState("");
  const [requirements, setRequirements] = useState("");
  const [benefits, setBenefits] = useState("");
  const [deadline, setDeadline] = useState("");
  const [location, setLocation] = useState("Hà Nội");
  const [isDomestic, setIsDomestic] = useState(true);
  const [sourceName, setSourceName] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [isSponsored, setIsSponsored] = useState(false);
  const [status, setStatus] = useState<"DRAFT" | "PUBLISHED">("PUBLISHED");

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (title.trim().length < 5) {
      setErrorMsg("Tiêu đề cơ hội phải có ít nhất 5 ký tự.");
      return;
    }

    if (description.trim().length < 10) {
      setErrorMsg("Mô tả chi tiết phải có ít nhất 10 ký tự.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/opportunities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          category,
          description: description.trim(),
          requirements: requirements.trim() || undefined,
          benefits: benefits.trim() || undefined,
          deadline: deadline ? new Date(deadline) : null,
          location: location.trim(),
          isDomestic,
          sourceName: sourceName.trim() || "Ban Quản Trị Unera",
          sourceUrl: sourceUrl.trim() || undefined,
          isSponsored,
          status,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.error || "Không thể tạo cơ hội.");
      } else {
        router.push("/admin/opportunities");
        router.refresh();
      }
    } catch {
      setErrorMsg("Đã xảy ra lỗi kết nối với máy chủ.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full space-y-6 px-6 sm:px-8 py-6 max-w-4xl">
      {/* Back button */}
      <div>
        <Link
          href="/admin/opportunities"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Quay lại danh sách cơ hội</span>
        </Link>
      </div>

      <Card className="rounded-2xl border-slate-200/80 shadow-xs bg-white">
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <Briefcase className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-lg font-bold text-slate-900">
                Thêm Cơ Hội Tuyển Dụng / Học Bổng Mới
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">
                Thông tin được kiểm duyệt và hiển thị trực tiếp đến toàn bộ sinh viên trên nền tảng
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {errorMsg && (
            <div className="mb-4 flex items-center gap-2.5 rounded-xl bg-red-50 p-3.5 text-xs text-red-700 border border-red-200">
              <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700" htmlFor="opp-title">
                Tiêu đề cơ hội / Học bổng *
              </label>
              <Input
                id="opp-title"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ví dụ: Chương trình Quản trị viên Tập sự Nestlé Spark 2026"
                className="rounded-xl border-slate-200 text-xs sm:text-sm"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700" htmlFor="opp-cat">
                  Danh mục cơ hội *
                </label>
                <select
                  id="opp-cat"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white py-2 px-3 text-xs sm:text-sm text-slate-800 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                >
                  <option value="employment">Việc làm &amp; Thực tập (Employment)</option>
                  <option value="study_abroad">Học bổng &amp; Du học (Study Abroad)</option>
                  <option value="career_discipline">Khối ngành &amp; NCKH (Discipline)</option>
                  <option value="postgrad">Sau đại học (Postgraduate)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700" htmlFor="opp-deadline">
                  Hạn chót nộp đơn (Deadline)
                </label>
                <Input
                  id="opp-deadline"
                  type="date"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  className="rounded-xl border-slate-200 text-xs sm:text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700" htmlFor="opp-location">
                  Địa điểm làm việc / Tổ chức
                </label>
                <Input
                  id="opp-location"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Hà Nội / TP.HCM / Trực tuyến / Toàn quốc"
                  className="rounded-xl border-slate-200 text-xs sm:text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700" htmlFor="opp-source">
                  Đơn vị phát hành / Doanh nghiệp
                </label>
                <Input
                  id="opp-source"
                  value={sourceName}
                  onChange={(e) => setSourceName(e.target.value)}
                  placeholder="Ví dụ: Tập đoàn Viettel, Đại sứ quán Pháp..."
                  className="rounded-xl border-slate-200 text-xs sm:text-sm"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700" htmlFor="opp-desc">
                Mô tả chi tiết nội dung chương trình *
              </label>
              <textarea
                id="opp-desc"
                required
                rows={5}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Giới thiệu về mục tiêu, quy mô chương trình và các giai đoạn tuyển chọn..."
                className="w-full rounded-xl border border-slate-200 bg-white p-3 text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700" htmlFor="opp-req">
                  Yêu cầu ứng viên (Requirements)
                </label>
                <textarea
                  id="opp-req"
                  rows={3}
                  value={requirements}
                  onChange={(e) => setRequirements(e.target.value)}
                  placeholder="GPA từ 3.0, tiếng Anh giao tiếp thành thạo..."
                  className="w-full rounded-xl border border-slate-200 bg-white p-3 text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700" htmlFor="opp-benefits">
                  Quyền lợi &amp; Chế độ (Benefits)
                </label>
                <textarea
                  id="opp-benefits"
                  rows={3}
                  value={benefits}
                  onChange={(e) => setBenefits(e.target.value)}
                  placeholder="Lương cạnh tranh, học bổng 100% học phí, đài thọ vé máy bay..."
                  className="w-full rounded-xl border border-slate-200 bg-white p-3 text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all"
                />
              </div>
            </div>

            {/* Sponsored Content & Status */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200/80">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isSponsored}
                  onChange={(e) => setIsSponsored(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
                <div>
                  <p className="text-xs font-semibold text-slate-800">Nội dung đối tác tài trợ (Sponsored)</p>
                  <p className="text-[11px] text-slate-500">Hiển thị huy hiệu minh bạch theo quy định FR-NEWS-06</p>
                </div>
              </label>

              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-800">Trạng thái phát hành:</span>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                  className="rounded-lg border border-slate-200 bg-white py-1.5 px-3 text-xs font-semibold text-slate-800"
                >
                  <option value="PUBLISHED">Xuất bản ngay (Published)</option>
                  <option value="DRAFT">Lưu bản nháp (Draft)</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2.5 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={loading}
                className="rounded-xl text-xs"
              >
                Hủy bỏ
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="gap-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-5 text-xs font-semibold"
              >
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                <Save className="h-4 w-4" />
                <span>{status === "PUBLISHED" ? "Xuất bản cơ hội" : "Lưu bản nháp"}</span>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

