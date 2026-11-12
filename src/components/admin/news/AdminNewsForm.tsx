"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  CalendarClock,
  CheckCircle2,
  Clock,
  Edit3,
  ExternalLink,
  Eye,
  Loader2,
  Plus,
  Save,
  Sparkles,
  Tag,
  X,
} from "lucide-react";
import { CoverImageField } from "@/components/content/CoverImageField";
import { TiptapContentEditor } from "@/components/content/TiptapContentEditor";
import { TiptapContentRenderer } from "@/components/content/TiptapContentRenderer";
import { fetchWithAuth } from "@/components/providers/AuthProvider";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { CONTENT_MODULES, NEWS_ARTICLE_STATUS } from "@/constants";
import {
  EMPTY_TIPTAP_DOC,
  estimateReadTimeFromTiptap,
  extractPlainTextFromTiptap,
} from "@/lib/content/tiptap-utils";
import { toDateTimeLocalValue } from "@/lib/news-utils";
import { slugifyVietnamese } from "@/lib/orientation-utils";
import type {
  INewsArticleDetail,
  INewsCategoryDTO,
  INewsTagDTO,
  TiptapJSONDoc,
} from "@/types";

interface AdminNewsFormProps {
  mode: "create" | "edit";
  articleId?: string;
  initialArticle?: INewsArticleDetail;
}

export function AdminNewsForm({
  mode,
  articleId,
  initialArticle,
}: AdminNewsFormProps) {
  const router = useRouter();

  const [categories, setCategories] = useState<INewsCategoryDTO[]>([]);
  const [availableTags, setAvailableTags] = useState<INewsTagDTO[]>([]);
  const [taxonomyLoading, setTaxonomyLoading] = useState(true);

  const [activeTab, setActiveTab] = useState<"editor" | "preview">("editor");

  const [title, setTitle] = useState(initialArticle?.title || "");
  const [slug, setSlug] = useState(initialArticle?.slug || "");
  const [slugTouched, setSlugTouched] = useState(mode === "edit");
  const [summary, setSummary] = useState(initialArticle?.summary || "");
  const [coverImage, setCoverImage] = useState(initialArticle?.coverImage || "");
  const [contentJson, setContentJson] = useState<TiptapJSONDoc>(
    initialArticle?.contentJson || EMPTY_TIPTAP_DOC
  );
  const [categoryId, setCategoryId] = useState(
    initialArticle?.category?._id || ""
  );
  const [selectedTags, setSelectedTags] = useState<string[]>(
    initialArticle?.tags || []
  );
  const [tagDraft, setTagDraft] = useState("");

  const [authorName, setAuthorName] = useState(
    initialArticle?.authorName || "Ban biên tập Unera"
  );
  const [readTimeOverride, setReadTimeOverride] = useState<string>(
    initialArticle?.readTimeMinutes ? String(initialArticle.readTimeMinutes) : ""
  );
  const [status, setStatus] = useState<
    "DRAFT" | "SCHEDULED" | "PUBLISHED" | "UNPUBLISHED"
  >(initialArticle?.status || NEWS_ARTICLE_STATUS.DRAFT);
  const [scheduledAtInput, setScheduledAtInput] = useState<string>(
    toDateTimeLocalValue(initialArticle?.scheduledAt)
  );
  const [isFeatured, setIsFeatured] = useState(
    Boolean(initialArticle?.isFeatured)
  );
  const [isSponsored, setIsSponsored] = useState(
    Boolean(initialArticle?.isSponsored)
  );
  const [sponsorInfo, setSponsorInfo] = useState(
    initialArticle?.sponsorInfo || ""
  );
  const [sourceName, setSourceName] = useState(initialArticle?.sourceName || "");
  const [sourceUrl, setSourceUrl] = useState(initialArticle?.sourceUrl || "");

  const [version, setVersion] = useState<number>(initialArticle?.version ?? 1);
  const [submitting, setSubmitting] = useState(false);
  const [versionConflict, setVersionConflict] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: "error" | "success";
    text: string;
  } | null>(null);

  useEffect(() => {
    let active = true;
    const loadTaxonomy = async () => {
      try {
        const [catsRes, tagsRes] = await Promise.all([
          fetchWithAuth("/api/admin/news/categories", { cache: "no-store" }),
          fetchWithAuth("/api/admin/news/tags", { cache: "no-store" }),
        ]);
        const [catsData, tagsData] = await Promise.all([
          catsRes.json(),
          tagsRes.json(),
        ]);
        if (!active) return;

        if (catsRes.ok && Array.isArray(catsData.categories)) {
          setCategories(catsData.categories);
          setCategoryId((curr) => curr || catsData.categories[0]?._id || "");
        }
        if (tagsRes.ok && Array.isArray(tagsData.tags)) {
          setAvailableTags(tagsData.tags);
        }
      } finally {
        if (active) setTaxonomyLoading(false);
      }
    };

    void loadTaxonomy();
    return () => {
      active = false;
    };
  }, []);

  const plainContentText = useMemo(
    () => extractPlainTextFromTiptap(contentJson),
    [contentJson]
  );

  const estimatedReadTime = useMemo(
    () => estimateReadTimeFromTiptap(contentJson),
    [contentJson]
  );

  const handleTitleChange = (val: string) => {
    setTitle(val);
    if (!slugTouched) {
      setSlug(slugifyVietnamese(val));
    }
  };

  const addTag = (raw: string) => {
    const cleaned = raw.trim();
    if (!cleaned) return;
    setSelectedTags((prev) => {
      if (prev.some((t) => t.toLowerCase() === cleaned.toLowerCase())) {
        return prev;
      }
      if (prev.length >= 20) return prev;
      return [...prev, cleaned];
    });
    setTagDraft("");
  };

  const removeTag = (tagToRemove: string) => {
    setSelectedTags((prev) => prev.filter((t) => t !== tagToRemove));
  };

  const handleSubmit = async (
    targetStatus?: "DRAFT" | "SCHEDULED" | "PUBLISHED" | "UNPUBLISHED"
  ) => {
    setFeedback(null);
    setVersionConflict(false);
    const effectiveStatus = targetStatus ?? status;

    if (!title.trim() || title.trim().length < 5) {
      setFeedback({ type: "error", text: "Tiêu đề phải có ít nhất 5 ký tự." });
      return;
    }
    if (!summary.trim() || summary.trim().length < 10) {
      setFeedback({ type: "error", text: "Tóm tắt phải có ít nhất 10 ký tự." });
      return;
    }
    if (!categoryId) {
      setFeedback({ type: "error", text: "Vui lòng chọn danh mục tin tức." });
      return;
    }
    if (plainContentText.trim().length < 20) {
      setFeedback({
        type: "error",
        text: "Nội dung bài viết tối thiểu 20 ký tự.",
      });
      return;
    }

    let scheduledDateIso: string | null = null;
    if (effectiveStatus === NEWS_ARTICLE_STATUS.SCHEDULED) {
      if (!scheduledAtInput) {
        setFeedback({
          type: "error",
          text: "Vui lòng chọn ngày giờ hẹn xuất bản.",
        });
        return;
      }
      const parsedDate = new Date(scheduledAtInput);
      if (Number.isNaN(parsedDate.getTime()) || parsedDate.getTime() <= Date.now()) {
        setFeedback({
          type: "error",
          text: "Thời gian hẹn xuất bản phải ở tương lai.",
        });
        return;
      }
      scheduledDateIso = parsedDate.toISOString();
    }

    setSubmitting(true);
    try {
      const payload = {
        title: title.trim(),
        slug: slug.trim() || undefined,
        summary: summary.trim(),
        coverImage: coverImage.trim(),
        contentJson,
        categoryId,
        tags: selectedTags,
        authorName: authorName.trim() || "Ban biên tập Unera",
        readTimeMinutes: readTimeOverride
          ? Number(readTimeOverride)
          : estimatedReadTime,
        status: effectiveStatus,
        scheduledAt: scheduledDateIso,
        isFeatured,
        isSponsored,
        sponsorInfo: isSponsored ? sponsorInfo.trim() : "",
        sourceName: sourceName.trim(),
        sourceUrl: sourceUrl.trim(),
        ...(mode === "edit" ? { version } : {}),
      };

      const endpoint =
        mode === "create"
          ? "/api/admin/news"
          : `/api/admin/news/${articleId}`;
      const method = mode === "create" ? "POST" : "PATCH";

      const res = await fetchWithAuth(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (res.status === 409 && data.conflict) {
        setVersionConflict(true);
        setFeedback({
          type: "error",
          text:
            data.error ||
            "Bài viết vừa bị sửa ở phiên khác. Vui lòng tải lại trang.",
        });
        return;
      }

      if (!res.ok) {
        setFeedback({
          type: "error",
          text: data.error || "Không thể lưu bài viết tin tức.",
        });
        return;
      }

      if (data.article?.version) {
        setVersion(data.article.version);
      }
      setStatus(effectiveStatus);
      setFeedback({
        type: "success",
        text: data.message || "Đã lưu bài viết tin tức thành công!",
      });

      if (mode === "create" && data.article?._id) {
        router.push(`/admin/news/${data.article._id}/edit`);
      } else {
        router.refresh();
      }
    } catch {
      setFeedback({
        type: "error",
        text: "Lỗi kết nối máy chủ khi lưu bài viết.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-2xs">
        <div>
          <h1 className="text-lg sm:text-xl font-bold text-slate-900">
            {mode === "create"
              ? "Soạn Bài Viết Tin Tức Mới"
              : "Chỉnh Sửa Bài Viết Tin Tức"}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Hỗ trợ soạn thảo Tiptap Block, tải media Cloudinary, gắn Tag &amp; lên lịch xuất bản tự động.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link href="/admin/news">
            <Button type="button" variant="outline" size="sm">
              Danh sách tin tức
            </Button>
          </Link>

          {mode === "edit" && initialArticle?.status === "PUBLISHED" && (
            <Link href={`/news/${initialArticle.slug}`} target="_blank">
              <Button type="button" variant="outline" size="sm" className="gap-1.5">
                <ExternalLink className="h-3.5 w-3.5" />
                <span>Xem bài công khai</span>
              </Button>
            </Link>
          )}

          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={submitting}
            onClick={() => handleSubmit("DRAFT")}
          >
            Lưu bản nháp
          </Button>

          <Button
            type="button"
            size="sm"
            disabled={submitting}
            onClick={() => handleSubmit()}
            className="gap-1.5"
          >
            {submitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            <span>
              {status === NEWS_ARTICLE_STATUS.SCHEDULED
                ? "Lưu & Hẹn giờ"
                : status === NEWS_ARTICLE_STATUS.PUBLISHED
                  ? "Lưu & Xuất bản"
                  : "Lưu thay đổi"}
            </span>
          </Button>
        </div>
      </div>

      {/* Feedback Banner */}
      {feedback && (
        <div
          className={`flex flex-wrap items-center justify-between gap-3 rounded-xl border px-4 py-3 text-xs font-medium ${
            feedback.type === "error"
              ? "border-rose-200 bg-rose-50 text-rose-700"
              : "border-emerald-200 bg-emerald-50 text-emerald-700"
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === "error" ? (
              <AlertCircle className="h-4 w-4 shrink-0" />
            ) : (
              <CheckCircle2 className="h-4 w-4 shrink-0" />
            )}
            <span>{feedback.text}</span>
          </div>
          {versionConflict && (
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => window.location.reload()}
            >
              Tải lại dữ liệu mới nhất
            </Button>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content Column */}
        <div className="lg:col-span-2 space-y-5">
          <Card className="rounded-2xl border-slate-200/80 shadow-2xs bg-white">
            <CardContent className="p-5 sm:p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">
                  Tiêu đề bài viết <span className="text-rose-500">*</span>
                </label>
                <Input
                  value={title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  placeholder="VD: Mở rộng học bổng Chính phủ 2026 cho sinh viên Ngoại ngữ..."
                  className="h-10 text-sm font-medium"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">
                  Đường dẫn (Slug URL)
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400 shrink-0">/news/</span>
                  <Input
                    value={slug}
                    onChange={(e) => {
                      setSlugTouched(true);
                      setSlug(e.target.value.toLowerCase());
                    }}
                    placeholder="tu-dong-tao-tu-tieu-de"
                    className="h-9 text-xs font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">
                  Tóm tắt ngắn (Sapo) <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={3}
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  placeholder="Mô tả ngắn gọn điểm nhấn của bản tin (10–600 ký tự)..."
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs sm:text-sm text-slate-800 focus:border-blue-500 focus:outline-none"
                />
              </div>

              <CoverImageField
                value={coverImage}
                onChange={setCoverImage}
                module={CONTENT_MODULES.NEWS}
                label="Ảnh bìa bản tin (Cloudinary / URL)"
              />
            </CardContent>
          </Card>

          {/* Rich Text Editor / Preview Switcher */}
          <Card className="rounded-2xl border-slate-200/80 shadow-2xs bg-white">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setActiveTab("editor")}
                  className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold cursor-pointer ${
                    activeTab === "editor"
                      ? "bg-blue-50 text-blue-700"
                      : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  <Edit3 className="h-3.5 w-3.5" />
                  <span>Soạn thảo nội dung (Tiptap)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("preview")}
                  className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold cursor-pointer ${
                    activeTab === "preview"
                      ? "bg-blue-50 text-blue-700"
                      : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  <Eye className="h-3.5 w-3.5" />
                  <span>Xem trước bản in</span>
                </button>
              </div>
              <span className="text-[11px] text-slate-400">
                Ước tính {estimatedReadTime} phút đọc · {plainContentText.length} ký tự
              </span>
            </div>

            <CardContent className="p-5">
              {activeTab === "editor" ? (
                <TiptapContentEditor
                  value={contentJson}
                  onChange={setContentJson}
                  module={CONTENT_MODULES.NEWS}
                  placeholder="Bắt đầu viết nội dung tin tức bằng các block tiêu đề, văn bản, ảnh, âm thanh, video YouTube hoặc hộp ghi chú..."
                />
              ) : (
                <div className="rounded-xl border border-slate-100 bg-slate-50/40 p-6">
                  <TiptapContentRenderer contentJson={contentJson} />
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar Metadata & Scheduling Column */}
        <div className="space-y-5">
          {/* Publish & Schedule Card (NEWS16, NEWS17, NEWS21) */}
          <Card className="rounded-2xl border-slate-200/80 shadow-2xs bg-white">
            <CardContent className="p-5 space-y-4">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <CalendarClock className="h-4 w-4 text-blue-600" />
                <span>Trạng thái &amp; Lịch xuất bản</span>
              </h2>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-700">
                  Chế độ xuất bản
                </label>
                <select
                  value={status}
                  onChange={(e) =>
                    setStatus(
                      e.target.value as
                        | "DRAFT"
                        | "SCHEDULED"
                        | "PUBLISHED"
                        | "UNPUBLISHED"
                    )
                  }
                  className="w-full h-9 rounded-xl border border-slate-200 bg-white px-3 text-xs font-medium text-slate-800 focus:border-blue-500 focus:outline-none"
                >
                  <option value={NEWS_ARTICLE_STATUS.DRAFT}>Bản nháp (DRAFT)</option>
                  <option value={NEWS_ARTICLE_STATUS.PUBLISHED}>
                    Xuất bản ngay (PUBLISHED)
                  </option>
                  <option value={NEWS_ARTICLE_STATUS.SCHEDULED}>
                    Lên lịch hẹn giờ (SCHEDULED)
                  </option>
                  {mode === "edit" && (
                    <option value={NEWS_ARTICLE_STATUS.UNPUBLISHED}>
                      Ẩn khỏi trang chủ (UNPUBLISHED)
                    </option>
                  )}
                </select>
              </div>

              {status === NEWS_ARTICLE_STATUS.SCHEDULED && (
                <div className="rounded-xl border border-sky-200 bg-sky-50/70 p-3 space-y-2">
                  <label className="text-xs font-semibold text-sky-900 flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5" />
                    <span>Thời điểm tự động đăng</span>
                  </label>
                  <Input
                    type="datetime-local"
                    value={scheduledAtInput}
                    onChange={(e) => setScheduledAtInput(e.target.value)}
                    className="h-9 bg-white text-xs"
                  />
                  <p className="text-[11px] text-sky-700">
                    Bài viết sẽ tự động chuyển sang PUBLISHED khi tới thời gian đã chọn.
                  </p>
                </div>
              )}

              <label className="flex items-center gap-2.5 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={isFeatured}
                  onChange={(e) => setIsFeatured(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-blue-600"
                />
                <span className="text-xs font-medium text-slate-700 flex items-center gap-1">
                  <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                  Đánh dấu Tin nổi bật (Featured)
                </span>
              </label>

              {mode === "edit" && (
                <p className="text-[11px] text-slate-400">
                  Phiên bản đồng bộ: <strong>v{version}</strong>
                </p>
              )}
            </CardContent>
          </Card>

          {/* Category & Tags Card (NEWS18, NEWS19) */}
          <Card className="rounded-2xl border-slate-200/80 shadow-2xs bg-white">
            <CardContent className="p-5 space-y-4">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Tag className="h-4 w-4 text-blue-600" />
                <span>Danh mục &amp; Chủ đề (Tags)</span>
              </h2>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">
                  Danh mục tin tức <span className="text-rose-500">*</span>
                </label>
                {taxonomyLoading ? (
                  <div className="text-xs text-slate-400">Đang tải danh mục...</div>
                ) : (
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="w-full h-9 rounded-xl border border-slate-200 bg-white px-3 text-xs font-medium text-slate-800 focus:border-blue-500 focus:outline-none"
                  >
                    {categories.map((cat) => (
                      <option key={cat._id} value={cat._id}>
                        {cat.name} {!cat.isActive ? "(Đang ẩn)" : ""}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-700">
                  Tags bài viết ({selectedTags.length}/20)
                </label>
                <div className="flex gap-2">
                  <Input
                    value={tagDraft}
                    onChange={(e) => setTagDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addTag(tagDraft);
                      }
                    }}
                    placeholder="Nhập tag mới rồi Enter..."
                    className="h-9 text-xs"
                  />
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => addTag(tagDraft)}
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </Button>
                </div>

                {selectedTags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {selectedTags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center gap-1 rounded-full bg-blue-50 border border-blue-200 px-2.5 py-0.5 text-[11px] font-semibold text-blue-700"
                      >
                        #{tag}
                        <button
                          type="button"
                          onClick={() => removeTag(tag)}
                          className="hover:text-rose-600 cursor-pointer"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}

                {availableTags.length > 0 && (
                  <div className="pt-1 space-y-1">
                    <p className="text-[11px] text-slate-400">
                      Gợi ý tag có sẵn trong hệ thống:
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {availableTags
                        .filter(
                          (t) =>
                            t.isActive &&
                            !selectedTags.some(
                              (st) => st.toLowerCase() === t.name.toLowerCase()
                            )
                        )
                        .slice(0, 12)
                        .map((tag) => (
                          <button
                            key={tag._id}
                            type="button"
                            onClick={() => addTag(tag.name)}
                            className="rounded-full bg-slate-100 hover:bg-slate-200 px-2.5 py-0.5 text-[11px] font-medium text-slate-600 transition-colors cursor-pointer"
                          >
                            + {tag.name}
                          </button>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Author, Sponsorship & Attribution Card */}
          <Card className="rounded-2xl border-slate-200/80 shadow-2xs bg-white">
            <CardContent className="p-5 space-y-4">
              <h2 className="text-sm font-bold text-slate-900">
                Biên tập &amp; Nguồn trích dẫn
              </h2>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">
                  Tác giả / Nhóm biên tập
                </label>
                <Input
                  value={authorName}
                  onChange={(e) => setAuthorName(e.target.value)}
                  className="h-9 text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">
                  Thời gian đọc (phút — để trống để tự tính)
                </label>
                <Input
                  type="number"
                  min={1}
                  max={120}
                  value={readTimeOverride}
                  onChange={(e) => setReadTimeOverride(e.target.value)}
                  placeholder={`Mặc định ${estimatedReadTime} phút`}
                  className="h-9 text-xs"
                />
              </div>

              <div className="pt-1 space-y-2 border-t border-slate-100">
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isSponsored}
                    onChange={(e) => setIsSponsored(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-blue-600"
                  />
                  <span className="text-xs font-medium text-slate-700">
                    Bài viết có nội dung tài trợ / đối tác
                  </span>
                </label>

                {isSponsored && (
                  <Input
                    value={sponsorInfo}
                    onChange={(e) => setSponsorInfo(e.target.value)}
                    placeholder="Ghi chú đơn vị tài trợ hoặc thông điệp minh bạch..."
                    className="h-9 text-xs"
                  />
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">
                  Tên nguồn trích dẫn (nếu có)
                </label>
                <Input
                  value={sourceName}
                  onChange={(e) => setSourceName(e.target.value)}
                  placeholder="VD: Cổng thông tin ĐHQGHN"
                  className="h-9 text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">
                  URL nguồn gốc (tùy chọn)
                </label>
                <Input
                  value={sourceUrl}
                  onChange={(e) => setSourceUrl(e.target.value)}
                  placeholder="https://..."
                  className="h-9 text-xs"
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
