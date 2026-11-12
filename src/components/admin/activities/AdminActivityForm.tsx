"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  CalendarClock,
  CheckCircle2,
  Edit3,
  ExternalLink,
  Eye,
  GraduationCap,
  Loader2,
  RefreshCw,
  Save,
  Sparkles,
  Tag,
} from "lucide-react";
import { CoverImageField } from "@/components/content/CoverImageField";
import { TiptapContentEditor } from "@/components/content/TiptapContentEditor";
import { TiptapContentRenderer } from "@/components/content/TiptapContentRenderer";
import { fetchWithAuth } from "@/components/providers/AuthProvider";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  ACTIVITY_PUBLISH_STATUS,
  CONTENT_MODULES,
  type ActivityPublishStatus,
} from "@/constants";
import {
  ACTIVITY_COMPUTED_STATUS_META,
  computeActivityStatus,
  formatVietnamDateTime,
  getCategoryColorClasses,
  toDateTimeLocalValue,
} from "@/lib/activity-utils";
import {
  EMPTY_TIPTAP_DOC,
  extractPlainTextFromTiptap,
} from "@/lib/content/tiptap-utils";
import {
  isSafeMediaUrl,
  normalizeStringList,
  slugifyVietnamese,
} from "@/lib/orientation-utils";
import type {
  IActivityCategoryDTO,
  IStudentActivityDetail,
  TiptapJSONDoc,
} from "@/types";

interface AdminActivityFormProps {
  mode: "create" | "edit";
  activityId?: string;
  initialActivity?: IStudentActivityDetail;
  onReloadRequested?: () => void;
}

export function AdminActivityForm({
  mode,
  activityId,
  initialActivity,
  onReloadRequested,
}: AdminActivityFormProps) {
  const router = useRouter();

  const [categories, setCategories] = useState<IActivityCategoryDTO[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"editor" | "preview">("editor");

  const [title, setTitle] = useState(initialActivity?.title || "");
  const [slug, setSlug] = useState(initialActivity?.slug || "");
  const [slugTouched, setSlugTouched] = useState(mode === "edit");
  const [summary, setSummary] = useState(initialActivity?.summary || "");
  const [coverImage, setCoverImage] = useState(
    initialActivity?.coverImage || ""
  );
  const [contentJson, setContentJson] = useState<TiptapJSONDoc>(
    initialActivity?.contentJson || EMPTY_TIPTAP_DOC
  );
  const [categoryId, setCategoryId] = useState(
    initialActivity?.category?._id || ""
  );
  const [organizer, setOrganizer] = useState(initialActivity?.organizer || "");
  const [location, setLocation] = useState(initialActivity?.location || "");
  const [isDomestic, setIsDomestic] = useState(
    initialActivity?.isDomestic !== undefined
      ? initialActivity.isDomestic
      : true
  );
  const [registrationUrl, setRegistrationUrl] = useState(
    initialActivity?.registrationUrl || ""
  );

  const [openingDate, setOpeningDate] = useState(
    toDateTimeLocalValue(initialActivity?.openingDate)
  );
  const [deadline, setDeadline] = useState(
    toDateTimeLocalValue(initialActivity?.deadline)
  );
  const [eventDate, setEventDate] = useState(
    toDateTimeLocalValue(initialActivity?.eventDate)
  );
  const [eventEndDate, setEventEndDate] = useState(
    toDateTimeLocalValue(initialActivity?.eventEndDate)
  );

  const [eligibility, setEligibility] = useState(
    initialActivity?.eligibility || ""
  );
  const [requirements, setRequirements] = useState(
    initialActivity?.requirements || ""
  );
  const [benefits, setBenefits] = useState(initialActivity?.benefits || "");
  const [applicationInstructions, setApplicationInstructions] = useState(
    initialActivity?.applicationInstructions || ""
  );

  const [tagsInput, setTagsInput] = useState(
    initialActivity?.tags?.join(", ") || ""
  );
  const [publishStatus, setPublishStatus] = useState<ActivityPublishStatus>(
    initialActivity?.publishStatus || ACTIVITY_PUBLISH_STATUS.DRAFT
  );
  const [manualClosed, setManualClosed] = useState(
    Boolean(initialActivity?.manualClosed)
  );
  const [isFeatured, setIsFeatured] = useState(
    Boolean(initialActivity?.isFeatured)
  );

  const [version, setVersion] = useState<number>(initialActivity?.version || 1);
  const [conflictDetected, setConflictDetected] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function loadCategories() {
      try {
        const res = await fetchWithAuth("/api/admin/activities/categories", {
          cache: "no-store",
        });
        const data = await res.json();
        if (!cancelled && res.ok && Array.isArray(data.categories)) {
          setCategories(data.categories);
          setCategoryId((prev) => prev || data.categories[0]?._id || "");
        }
      } catch {
        // Ignore non-fatal fetch error
      } finally {
        if (!cancelled) setCategoriesLoading(false);
      }
    }
    loadCategories();
    return () => {
      cancelled = true;
    };
  }, []);

  const plainText = useMemo(
    () => extractPlainTextFromTiptap(contentJson),
    [contentJson]
  );

  const parsedTags = useMemo(
    () =>
      normalizeStringList(
        tagsInput
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean)
      ),
    [tagsInput]
  );

  const previewCategory = categories.find((c) => c._id === categoryId) || null;
  const previewComputedStatus = computeActivityStatus({
    manualClosed,
    openingDate: openingDate || null,
    deadline: deadline || null,
    eventDate: eventDate || null,
    eventEndDate: eventEndDate || null,
  });
  const previewStatusMeta =
    ACTIVITY_COMPUTED_STATUS_META[previewComputedStatus];

  const handleTitleChange = (val: string) => {
    setTitle(val);
    if (!slugTouched && mode === "create") {
      setSlug(slugifyVietnamese(val));
    }
  };

  const toIsoOrNull = (localValue: string): string | null => {
    if (!localValue.trim()) return null;
    const parsed = new Date(localValue);
    return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");
    setConflictDetected(false);

    if (title.trim().length < 5) {
      setErrorMsg("Tiêu đề hoạt động phải có ít nhất 5 ký tự.");
      return;
    }
    if (summary.trim().length < 10) {
      setErrorMsg("Tóm tắt ngắn phải có ít nhất 10 ký tự.");
      return;
    }
    if (!categoryId) {
      setErrorMsg("Vui lòng chọn danh mục hoạt động.");
      return;
    }
    if (plainText.length < 20) {
      setErrorMsg(
        "Nội dung chi tiết hoạt động phải có ít nhất 20 ký tự văn bản thực tế."
      );
      return;
    }
    if (openingDate && deadline && new Date(deadline) < new Date(openingDate)) {
      setErrorMsg("Hạn chót đăng ký phải lớn hơn hoặc bằng ngày mở đơn.");
      return;
    }
    if (
      eventDate &&
      eventEndDate &&
      new Date(eventEndDate) < new Date(eventDate)
    ) {
      setErrorMsg(
        "Ngày kết thúc sự kiện phải lớn hơn hoặc bằng ngày bắt đầu."
      );
      return;
    }

    const payload = {
      title: title.trim(),
      slug: slug.trim() || undefined,
      summary: summary.trim(),
      contentJson,
      coverImage: coverImage.trim(),
      categoryId,
      organizer: organizer.trim(),
      location: location.trim(),
      isDomestic,
      eligibility: eligibility.trim(),
      requirements: requirements.trim(),
      benefits: benefits.trim(),
      applicationInstructions: applicationInstructions.trim(),
      openingDate: toIsoOrNull(openingDate),
      deadline: toIsoOrNull(deadline),
      eventDate: toIsoOrNull(eventDate),
      eventEndDate: toIsoOrNull(eventEndDate),
      registrationUrl: registrationUrl.trim(),
      tags: parsedTags,
      publishStatus,
      manualClosed,
      isFeatured,
      ...(mode === "edit" ? { version } : {}),
    };

    setSubmitting(true);
    try {
      const endpoint =
        mode === "create"
          ? "/api/admin/activities"
          : `/api/admin/activities/${activityId}`;
      const method = mode === "create" ? "POST" : "PATCH";

      const res = await fetchWithAuth(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (res.status === 409) {
        setConflictDetected(true);
        setErrorMsg(
          data.error ||
            "Phát hiện xung đột phiên bản chỉnh sửa. Vui lòng tải lại dữ liệu mới nhất."
        );
        return;
      }

      if (!res.ok) {
        const detailMessages =
          data.details && typeof data.details === "object"
            ? Object.values(data.details as Record<string, string[] | undefined>)
                .flat()
                .filter((msg): msg is string => Boolean(msg))
            : [];
        setErrorMsg(
          detailMessages.length > 0
            ? `${data.error || "Dữ liệu không hợp lệ"}: ${detailMessages.join(" · ")}`
            : data.error || "Không thể lưu hoạt động."
        );
        return;
      }

      if (mode === "create") {
        router.push("/admin/activities");
        return;
      }

      if (typeof data.activity?.version === "number") {
        setVersion(data.activity.version);
      }
      setSuccessMsg(data.message || "Đã cập nhật hoạt động thành công!");
      router.refresh();
    } catch {
      setErrorMsg("Lỗi kết nối máy chủ khi lưu hoạt động.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/activities"
            className={buttonVariants({
              variant: "outline",
              size: "sm",
              className: "rounded-xl",
            })}
          >
            <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
            Danh sách
          </Link>
          <div>
            <h1 className="text-base sm:text-lg font-bold text-slate-900">
              {mode === "create"
                ? "Tạo Hoạt động Sinh viên mới"
                : "Chỉnh sửa Hoạt động Sinh viên"}
            </h1>
            <p className="text-[11px] text-slate-500">
              Trình soạn thảo Tiptap CMS &amp; Media Cloudinary{" "}
              {mode === "edit" ? `· Phiên bản v${version}` : ""}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Editor / Preview Switcher */}
          <div className="inline-flex rounded-xl bg-slate-100 p-1">
            <button
              type="button"
              onClick={() => setActiveTab("editor")}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold cursor-pointer ${
                activeTab === "editor"
                  ? "bg-white text-blue-700 shadow-2xs"
                  : "text-slate-600"
              }`}
            >
              <Edit3 className="h-3.5 w-3.5" />
              Soạn thảo
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("preview")}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold cursor-pointer ${
                activeTab === "preview"
                  ? "bg-white text-blue-700 shadow-2xs"
                  : "text-slate-600"
              }`}
            >
              <Eye className="h-3.5 w-3.5" />
              Xem trước
            </button>
          </div>

          {mode === "edit" &&
            initialActivity?.slug &&
            publishStatus === ACTIVITY_PUBLISH_STATUS.PUBLISHED && (
              <Link
                href={`/activities/${initialActivity.slug}`}
                target="_blank"
                className={buttonVariants({
                  variant: "outline",
                  size: "sm",
                  className: "rounded-xl",
                })}
              >
                <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
                Mở trang công khai
              </Link>
            )}

          <Button
            type="submit"
            disabled={submitting || categoriesLoading}
            className="rounded-xl bg-blue-600 hover:bg-blue-700"
          >
            {submitting ? (
              <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-1.5 h-4 w-4" />
            )}
            {mode === "create" ? "Lưu hoạt động" : "Cập nhật thay đổi"}
          </Button>
        </div>
      </div>

      {/* Feedback / Conflict Alerts */}
      {conflictDetected && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-amber-300 bg-amber-50 px-5 py-4 text-xs text-amber-900">
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="h-5 w-5 shrink-0 text-amber-600 mt-0.5" />
            <div>
              <p className="font-bold">Xung đột cập nhật đồng thời (409)</p>
              <p className="mt-0.5 text-amber-800">{errorMsg}</p>
            </div>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              if (onReloadRequested) onReloadRequested();
              else window.location.reload();
            }}
            className="rounded-xl bg-white border-amber-300 text-amber-900 hover:bg-amber-100 shrink-0"
          >
            <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
            Tải lại bản mới nhất
          </Button>
        </div>
      )}

      {errorMsg && !conflictDetected && (
        <div className="flex items-center gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-medium text-red-700">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-medium text-emerald-700">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {activeTab === "preview" ? (
        <Card className="rounded-3xl border-slate-200/90 bg-white shadow-xs">
          <CardContent className="p-6 sm:p-10 max-w-4xl mx-auto space-y-6">
            {coverImage && isSafeMediaUrl(coverImage) && (
              <div className="relative aspect-[16/9] w-full overflow-hidden rounded-2xl bg-slate-100">
                <Image
                  src={coverImage}
                  alt={title || "Preview cover"}
                  fill
                  unoptimized
                  className="object-cover"
                />
              </div>
            )}

            <div className="flex flex-wrap items-center gap-2">
              {previewCategory && (
                <span
                  className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                    getCategoryColorClasses(previewCategory.colorToken).pillClass
                  }`}
                >
                  {previewCategory.name}
                </span>
              )}
              <span
                className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${previewStatusMeta.badgeClass}`}
              >
                <span
                  className={`h-2 w-2 rounded-full ${previewStatusMeta.dotClass}`}
                />
                {previewStatusMeta.label}
              </span>
            </div>

            <div className="space-y-3">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                {title || "Tiêu đề hoạt động xem trước"}
              </h2>
              <p className="text-sm text-slate-600 leading-relaxed">
                {summary || "Mô tả tóm tắt sẽ hiển thị tại đây..."}
              </p>
              <div className="flex flex-wrap gap-4 text-xs text-slate-500 pt-1">
                {organizer && <span>Đơn vị: {organizer}</span>}
                {deadline && (
                  <span>Hạn đăng ký: {formatVietnamDateTime(deadline)}</span>
                )}
                {eventDate && (
                  <span>Sự kiện: {formatVietnamDateTime(eventDate)}</span>
                )}
              </div>
            </div>

            <div className="border-t border-slate-100 pt-6">
              <TiptapContentRenderer contentJson={contentJson} />
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Main Content Column */}
          <div className="lg:col-span-8 space-y-6">
            <Card className="rounded-2xl border-slate-200/90 bg-white shadow-xs">
              <CardContent className="p-6 space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">
                    Tiêu đề hoạt động <span className="text-red-500">*</span>
                  </label>
                  <Input
                    value={title}
                    onChange={(e) => handleTitleChange(e.target.value)}
                    placeholder="VD: Giải thưởng Nghiên cứu Khoa học Sinh viên ULIS 2026"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700">
                      Slug đường dẫn (/activities/...)
                    </label>
                    <Input
                      value={slug}
                      onChange={(e) => {
                        setSlugTouched(true);
                        setSlug(e.target.value);
                      }}
                      placeholder="tu-dong-tao-tu-tieu-de"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700">
                      Đơn vị tổ chức (Organizer)
                    </label>
                    <Input
                      value={organizer}
                      onChange={(e) => setOrganizer(e.target.value)}
                      placeholder="VD: Phòng Khoa học Công nghệ / Unilever VN"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-slate-700">
                      Tóm tắt ngắn <span className="text-red-500">*</span>
                    </label>
                    <span className="text-[11px] text-slate-400">
                      {summary.length}/500
                    </span>
                  </div>
                  <textarea
                    rows={3}
                    maxLength={500}
                    value={summary}
                    onChange={(e) => setSummary(e.target.value)}
                    placeholder="Tóm tắt ngắn gọn nội dung hoạt động, đối tượng và điểm nổi bật (10 - 500 ký tự)..."
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                    required
                  />
                </div>
              </CardContent>
            </Card>

            {/* Tiptap Content Editor (Module 00) */}
            <Card className="rounded-2xl border-slate-200/90 bg-white shadow-xs">
              <CardContent className="p-6 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-sm font-bold text-slate-900">
                      Nội dung chi tiết hoạt động (Tiptap Block Editor) *
                    </h2>
                    <p className="text-[11px] text-slate-500">
                      Hỗ trợ tiêu đề, bảng, hình ảnh Cloudinary, audio, video YouTube và callout nổi bật.
                    </p>
                  </div>
                  <span className="text-[11px] font-medium text-slate-500">
                    {plainText.length} ký tự văn bản
                  </span>
                </div>

                <TiptapContentEditor
                  value={contentJson}
                  onChange={setContentJson}
                  module={CONTENT_MODULES.ACTIVITIES}
                  placeholder="Soạn thảo thể lệ, quy trình tham gia, giải thưởng và lưu ý chi tiết cho sinh viên..."
                />
              </CardContent>
            </Card>

            {/* Optional Structured Highlights */}
            <Card className="rounded-2xl border-slate-200/90 bg-white shadow-xs">
              <CardContent className="p-6 space-y-4">
                <h2 className="text-sm font-bold text-slate-900">
                  Thông tin tóm lược bổ sung (Hiển thị dạng thẻ nổi bật)
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700">
                      Đối tượng tham gia
                    </label>
                    <textarea
                      rows={3}
                      value={eligibility}
                      onChange={(e) => setEligibility(e.target.value)}
                      placeholder="VD: Sinh viên năm 2–4, GPA >= 3.0..."
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-800 focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700">
                      Yêu cầu hồ sơ / điều kiện
                    </label>
                    <textarea
                      rows={3}
                      value={requirements}
                      onChange={(e) => setRequirements(e.target.value)}
                      placeholder="VD: CV, Bảng điểm, Đề cương PDF..."
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-800 focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700">
                      Quyền lợi / Giải thưởng
                    </label>
                    <textarea
                      rows={3}
                      value={benefits}
                      onChange={(e) => setBenefits(e.target.value)}
                      placeholder="VD: Chứng nhận, học bổng, suất thực tập..."
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-800 focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700">
                      Hướng dẫn đăng ký nhanh
                    </label>
                    <textarea
                      rows={3}
                      value={applicationInstructions}
                      onChange={(e) =>
                        setApplicationInstructions(e.target.value)
                      }
                      placeholder="VD: Điền form trực tuyến trước 23:59..."
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-800 focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Configuration Sidebar */}
          <div className="lg:col-span-4 space-y-5">
            {/* Publishing Status & Visibility */}
            <Card className="rounded-2xl border-slate-200/90 bg-white shadow-xs">
              <CardContent className="p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Xuất bản &amp; Trạng thái
                  </span>
                  <span
                    className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${previewStatusMeta.badgeClass}`}
                  >
                    {previewStatusMeta.shortLabel}
                  </span>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">
                    Trạng thái xuất bản
                  </label>
                  <select
                    value={publishStatus}
                    onChange={(e) =>
                      setPublishStatus(e.target.value as ActivityPublishStatus)
                    }
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800 focus:border-blue-500 focus:outline-none"
                  >
                    <option value={ACTIVITY_PUBLISH_STATUS.DRAFT}>
                      Bản nháp (DRAFT)
                    </option>
                    <option value={ACTIVITY_PUBLISH_STATUS.PUBLISHED}>
                      Xuất bản công khai (PUBLISHED)
                    </option>
                    <option value={ACTIVITY_PUBLISH_STATUS.UNPUBLISHED}>
                      Ẩn bài viết (UNPUBLISHED)
                    </option>
                  </select>
                </div>

                <label className="flex items-center justify-between gap-2 rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-2.5 text-xs text-slate-700 cursor-pointer">
                  <span className="font-medium">
                    Đánh dấu đóng đăng ký thủ công
                  </span>
                  <input
                    type="checkbox"
                    checked={manualClosed}
                    onChange={(e) => setManualClosed(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-blue-600"
                  />
                </label>

                <label className="flex items-center justify-between gap-2 rounded-xl border border-amber-200 bg-amber-50/60 px-3 py-2.5 text-xs text-amber-900 cursor-pointer">
                  <span className="inline-flex items-center gap-1.5 font-semibold">
                    <Sparkles className="h-3.5 w-3.5 text-amber-600" />
                    Ghim Hoạt động Nổi bật
                  </span>
                  <input
                    type="checkbox"
                    checked={isFeatured}
                    onChange={(e) => setIsFeatured(e.target.checked)}
                    className="h-4 w-4 rounded border-amber-300 text-amber-600"
                  />
                </label>
              </CardContent>
            </Card>

            {/* Category & Location */}
            <Card className="rounded-2xl border-slate-200/90 bg-white shadow-xs">
              <CardContent className="p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-500">
                    <GraduationCap className="h-4 w-4 text-blue-500" />
                    Phân loại &amp; Phạm vi
                  </span>
                  <Link
                    href="/admin/activities/categories"
                    className="text-[11px] font-semibold text-blue-600 hover:underline"
                  >
                    Quản lý danh mục
                  </Link>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">
                    Danh mục hoạt động *
                  </label>
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    disabled={categoriesLoading}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-800 focus:border-blue-500 focus:outline-none"
                    required
                  >
                    <option value="">-- Chọn danh mục --</option>
                    {categories.map((cat) => (
                      <option key={cat._id} value={cat._id}>
                        {cat.name} {!cat.isActive ? "(Đang ẩn)" : ""}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">
                    Phạm vi địa lý
                  </label>
                  <select
                    value={isDomestic ? "true" : "false"}
                    onChange={(e) => setIsDomestic(e.target.value === "true")}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-800 focus:border-blue-500 focus:outline-none"
                  >
                    <option value="true">Trong nước</option>
                    <option value="false">Quốc tế / Toàn cầu</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">
                    Địa điểm / Hình thức
                  </label>
                  <Input
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="VD: Hà Nội · Hybrid / Trực tuyến"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">
                    Link cổng đăng ký / Website chính thức
                  </label>
                  <Input
                    type="url"
                    value={registrationUrl}
                    onChange={(e) => setRegistrationUrl(e.target.value)}
                    placeholder="https://..."
                  />
                </div>
              </CardContent>
            </Card>

            {/* Important Dates */}
            <Card className="rounded-2xl border-slate-200/90 bg-white shadow-xs">
              <CardContent className="p-5 space-y-3.5">
                <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-500">
                  <CalendarClock className="h-4 w-4 text-rose-500" />
                  Thời gian &amp; Hạn chót
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">
                    Ngày mở đơn
                  </label>
                  <Input
                    type="datetime-local"
                    value={openingDate}
                    onChange={(e) => setOpeningDate(e.target.value)}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">
                    Hạn chót đăng ký (Deadline)
                  </label>
                  <Input
                    type="datetime-local"
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">
                    Ngày bắt đầu sự kiện
                  </label>
                  <Input
                    type="datetime-local"
                    value={eventDate}
                    onChange={(e) => setEventDate(e.target.value)}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">
                    Ngày kết thúc sự kiện
                  </label>
                  <Input
                    type="datetime-local"
                    value={eventEndDate}
                    onChange={(e) => setEventEndDate(e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Cover Image (Module 00) */}
            <Card className="rounded-2xl border-slate-200/90 bg-white shadow-xs">
              <CardContent className="p-5">
                <CoverImageField
                  value={coverImage}
                  onChange={setCoverImage}
                  module={CONTENT_MODULES.ACTIVITIES}
                />
              </CardContent>
            </Card>

            {/* Tags */}
            <Card className="rounded-2xl border-slate-200/90 bg-white shadow-xs">
              <CardContent className="p-5 space-y-2.5">
                <label className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-500">
                  <Tag className="h-3.5 w-3.5" />
                  Thẻ từ khóa (Tags)
                </label>
                <Input
                  value={tagsInput}
                  onChange={(e) => setTagsInput(e.target.value)}
                  placeholder="NCKH, Học bổng, Toàn quốc (cách bằng dấu phẩy)"
                />
                {parsedTags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {parsedTags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-medium text-slate-600"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </form>
  );
}

