"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Compass,
  Edit3,
  ExternalLink,
  Eye,
  Loader2,
  Save,
  Sparkles,
  Tag,
} from "lucide-react";
import { CoverImageField } from "@/components/content/CoverImageField";
import { TiptapContentEditor } from "@/components/content/TiptapContentEditor";
import { TiptapContentRenderer } from "@/components/content/TiptapContentRenderer";
import { fetchWithAuth } from "@/components/providers/AuthProvider";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { CONTENT_MODULES, ORIENTATION_ARTICLE_STATUS } from "@/constants";
import {
  EMPTY_TIPTAP_DOC,
  estimateReadTimeFromTiptap,
  extractPlainTextFromTiptap,
} from "@/lib/content/tiptap-utils";
import {
  getCategoryBannerGradient,
  isSafeMediaUrl,
  slugifyVietnamese,
} from "@/lib/orientation-utils";
import type { IOrientationArticleDetail, TiptapJSONDoc } from "@/types";

interface AdminCategoryOption {
  _id: string;
  name: string;
  slug: string;
  isActive: boolean;
}

interface AdminTopicOption {
  _id: string;
  categoryId: string;
  name: string;
  slug: string;
  isActive: boolean;
}

interface AdminArticleFormProps {
  mode: "create" | "edit";
  articleId?: string;
  initialArticle?: IOrientationArticleDetail;
}

export function AdminArticleForm({
  mode,
  articleId,
  initialArticle,
}: AdminArticleFormProps) {
  const router = useRouter();

  const [categories, setCategories] = useState<AdminCategoryOption[]>([]);
  const [topics, setTopics] = useState<AdminTopicOption[]>([]);
  const [taxonomyLoading, setTaxonomyLoading] = useState(true);

  const [activeTab, setActiveTab] = useState<"editor" | "preview">("editor");

  const [title, setTitle] = useState(initialArticle?.title || "");
  const [slug, setSlug] = useState(initialArticle?.slug || "");
  const [slugTouched, setSlugTouched] = useState(mode === "edit");
  const [summary, setSummary] = useState(initialArticle?.summary || "");
  const [coverImage, setCoverImage] = useState(
    initialArticle?.coverImage || ""
  );
  const [contentJson, setContentJson] = useState<TiptapJSONDoc>(
    initialArticle?.contentJson || EMPTY_TIPTAP_DOC
  );
  const [categoryId, setCategoryId] = useState(
    initialArticle?.category?._id || ""
  );
  const [topicIds, setTopicIds] = useState<string[]>(
    initialArticle?.topics?.map((t) => t._id) || []
  );
  const [tagsInput, setTagsInput] = useState(
    initialArticle?.tags?.join(", ") || ""
  );
  const [authorName, setAuthorName] = useState(
    initialArticle?.authorName || "Ban biên tập Unera"
  );
  const [readTimeOverride, setReadTimeOverride] = useState<string>(
    initialArticle?.readTimeMinutes ? String(initialArticle.readTimeMinutes) : ""
  );
  const [status, setStatus] = useState<"DRAFT" | "PUBLISHED" | "UNPUBLISHED">(
    initialArticle?.status || ORIENTATION_ARTICLE_STATUS.DRAFT
  );
  const [isFeatured, setIsFeatured] = useState(
    Boolean(initialArticle?.isFeatured)
  );

  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [savedSlug, setSavedSlug] = useState(initialArticle?.slug || "");

  useEffect(() => {
    let cancelled = false;

    async function loadTaxonomy() {
      try {
        const [catRes, topRes] = await Promise.all([
          fetchWithAuth("/api/admin/orientation/categories", {
            cache: "no-store",
          }),
          fetchWithAuth("/api/admin/orientation/topics", { cache: "no-store" }),
        ]);

        const [catData, topData] = await Promise.all([
          catRes.json(),
          topRes.json(),
        ]);

        if (!cancelled) {
          const loadedCats: AdminCategoryOption[] = Array.isArray(
            catData.categories
          )
            ? catData.categories
            : [];
          const loadedTopics: AdminTopicOption[] = Array.isArray(topData.topics)
            ? topData.topics
            : [];
          setCategories(loadedCats);
          setTopics(loadedTopics);
          setCategoryId((prev) => prev || loadedCats[0]?._id || "");
        }
      } catch {
        if (!cancelled) {
          setErrorMsg("Không thể tải danh mục và chủ đề từ máy chủ.");
        }
      } finally {
        if (!cancelled) setTaxonomyLoading(false);
      }
    }

    loadTaxonomy();
    return () => {
      cancelled = true;
    };
  }, []);

  const availableTopics = useMemo(
    () => topics.filter((t) => t.categoryId === categoryId),
    [topics, categoryId]
  );

  const selectedCategory = useMemo(
    () => categories.find((c) => c._id === categoryId) || null,
    [categories, categoryId]
  );

  const parsedTags = useMemo(() => {
    const seen = new Set<string>();
    const list: string[] = [];
    for (const part of tagsInput.split(",")) {
      const cleaned = part.trim();
      if (cleaned && !seen.has(cleaned.toLowerCase())) {
        seen.add(cleaned.toLowerCase());
        list.push(cleaned);
      }
    }
    return list.slice(0, 20);
  }, [tagsInput]);

  const plainText = useMemo(
    () => extractPlainTextFromTiptap(contentJson),
    [contentJson]
  );

  const autoReadTime = useMemo(
    () => estimateReadTimeFromTiptap(contentJson, plainText),
    [contentJson, plainText]
  );

  const handleTitleChange = (value: string) => {
    setTitle(value);
    if (!slugTouched) {
      setSlug(slugifyVietnamese(value));
    }
  };

  const handleCategoryChange = (nextCatId: string) => {
    setCategoryId(nextCatId);
    const validIds = new Set(
      topics.filter((t) => t.categoryId === nextCatId).map((t) => t._id)
    );
    setTopicIds((prev) => prev.filter((id) => validIds.has(id)));
  };

  const toggleTopic = (id: string) => {
    setTopicIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSubmit = async (
    targetStatus?: "DRAFT" | "PUBLISHED" | "UNPUBLISHED"
  ) => {
    setErrorMsg(null);
    setSuccessMsg(null);

    if (title.trim().length < 5) {
      setErrorMsg("Tiêu đề bài viết phải có ít nhất 5 ký tự.");
      return;
    }
    if (summary.trim().length < 10) {
      setErrorMsg("Tóm tắt bài viết phải có ít nhất 10 ký tự.");
      return;
    }
    if (!categoryId) {
      setErrorMsg("Vui lòng chọn Danh mục định hướng.");
      return;
    }
    if (plainText.trim().length < 20) {
      setErrorMsg("Nội dung Tiptap phải có ít nhất 20 ký tự văn bản.");
      return;
    }
    if (coverImage.trim() && !isSafeMediaUrl(coverImage.trim())) {
      setErrorMsg("URL ảnh bìa không hợp lệ hoặc không an toàn.");
      return;
    }

    const finalStatus = targetStatus ?? status;
    const parsedOverride = Number.parseInt(readTimeOverride, 10);

    const payload = {
      title: title.trim(),
      slug: slug.trim() || undefined,
      summary: summary.trim(),
      contentJson,
      coverImage: coverImage.trim(),
      categoryId,
      topicIds,
      tags: parsedTags,
      status: finalStatus,
      isFeatured,
      authorName: authorName.trim() || undefined,
      readTimeMinutes:
        Number.isFinite(parsedOverride) && parsedOverride > 0
          ? parsedOverride
          : undefined,
    };

    setSaving(true);
    try {
      const endpoint =
        mode === "create"
          ? "/api/admin/orientation/articles"
          : `/api/admin/orientation/articles/${articleId}`;
      const method = mode === "create" ? "POST" : "PATCH";

      const res = await fetchWithAuth(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.error || "Không thể lưu bài viết định hướng.");
        return;
      }

      setStatus(finalStatus);
      const nextSlug = data.article?.slug || slug;
      setSavedSlug(nextSlug);
      setSlug(nextSlug);

      if (mode === "create" && data.article?._id) {
        setSuccessMsg("Đã tạo bài viết thành công! Đang chuyển sang trang sửa...");
        router.replace(`/admin/explore/${data.article._id}/edit`);
        return;
      }

      setSuccessMsg(
        finalStatus === ORIENTATION_ARTICLE_STATUS.PUBLISHED
          ? "Đã xuất bản bài viết & đồng bộ MediaAsset thành công!"
          : "Đã lưu bài viết & đồng bộ MediaAsset thành công!"
      );
      router.refresh();
    } catch {
      setErrorMsg("Lỗi kết nối máy chủ khi lưu bài viết.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Status Banner */}
      {errorMsg && (
        <div className="flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
            <span>{successMsg}</span>
          </div>
          {savedSlug && status === ORIENTATION_ARTICLE_STATUS.PUBLISHED && (
            <Link
              href={`/explore/${savedSlug}`}
              target="_blank"
              className="inline-flex items-center gap-1 font-medium text-emerald-700 underline underline-offset-4 hover:text-emerald-900"
            >
              Xem trang bài viết
              <ExternalLink className="h-3.5 w-3.5" />
            </Link>
          )}
        </div>
      )}

      {/* Mode Tabs + Quick Submit */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-2xs">
        <div className="flex items-center gap-1 rounded-xl bg-slate-100 p-1">
          <button
            type="button"
            onClick={() => setActiveTab("editor")}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-sm font-medium transition-all ${
              activeTab === "editor"
                ? "bg-white text-slate-900 shadow-2xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Edit3 className="h-4 w-4 text-blue-600" />
            Soạn thảo Tiptap CMS
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("preview")}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-sm font-medium transition-all ${
              activeTab === "preview"
                ? "bg-white text-slate-900 shadow-2xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Eye className="h-4 w-4 text-indigo-600" />
            Xem trước hiển thị
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-lg bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-600 border border-slate-200">
            <Clock className="h-3.5 w-3.5 text-slate-400" />
            Ước tính {autoReadTime} phút đọc · {plainText.length} ký tự
          </span>
          <Button
            type="button"
            variant="outline"
            disabled={saving}
            onClick={() => handleSubmit(ORIENTATION_ARTICLE_STATUS.DRAFT)}
          >
            {saving && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
            Lưu bản nháp
          </Button>
          <Button
            type="button"
            disabled={saving}
            onClick={() => handleSubmit(ORIENTATION_ARTICLE_STATUS.PUBLISHED)}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {saving ? (
              <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-1.5 h-4 w-4" />
            )}
            {mode === "create" ? "Xuất bản bài viết" : "Lưu & Xuất bản"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Main Column */}
        <div className="space-y-6 lg:col-span-8">
          {activeTab === "editor" ? (
            <>
              <Card className="border-slate-200 shadow-2xs">
                <CardContent className="space-y-4 p-5">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wide text-slate-600">
                      Tiêu đề bài viết <span className="text-rose-500">*</span>
                    </label>
                    <Input
                      value={title}
                      onChange={(e) => handleTitleChange(e.target.value)}
                      placeholder="VD: Cẩm nang chuẩn bị hồ sơ học bổng Chính phủ 2026"
                      className="text-base font-medium"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold uppercase tracking-wide text-slate-600">
                        Đường dẫn tĩnh (Slug URL)
                      </label>
                      {slugTouched && (
                        <button
                          type="button"
                          onClick={() => {
                            setSlugTouched(false);
                            setSlug(slugifyVietnamese(title));
                          }}
                          className="text-xs font-medium text-blue-600 hover:underline"
                        >
                          Tạo lại từ tiêu đề
                        </button>
                      )}
                    </div>
                    <div className="flex items-center rounded-lg border border-slate-200 bg-slate-50 px-3">
                      <span className="text-xs text-slate-400 mr-1 select-none">
                        /explore/
                      </span>
                      <input
                        type="text"
                        value={slug}
                        onChange={(e) => {
                          setSlugTouched(true);
                          setSlug(e.target.value.toLowerCase());
                        }}
                        placeholder="cam-nang-san-hoc-bong-2026"
                        className="h-9 w-full bg-transparent text-sm text-slate-800 outline-none"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wide text-slate-600">
                      Tóm tắt ngắn (Summary){" "}
                      <span className="text-rose-500">*</span>
                    </label>
                    <textarea
                      rows={3}
                      value={summary}
                      onChange={(e) => setSummary(e.target.value)}
                      maxLength={500}
                      placeholder="Mô tả súc tích nội dung chính bài viết (10–500 ký tự)..."
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                    />
                    <div className="text-right text-[11px] text-slate-400">
                      {summary.length}/500 ký tự
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="space-y-2">
                <div className="flex items-center justify-between px-1">
                  <label className="text-xs font-semibold uppercase tracking-wide text-slate-600">
                    Nội dung chi tiết (Tiptap Block Editor){" "}
                    <span className="text-rose-500">*</span>
                  </label>
                  <span className="text-xs text-slate-500">
                    Kéo thả / dán ảnh trực tiếp · Hỗ trợ Audio MP3, YouTube Embed, Callout & Bảng
                  </span>
                </div>
                <TiptapContentEditor
                  value={contentJson}
                  onChange={setContentJson}
                  module={CONTENT_MODULES.ORIENTATION}
                />
              </div>
            </>
          ) : (
            <Card className="overflow-hidden border-slate-200 shadow-2xs">
              <div className="relative aspect-[16/9] w-full bg-slate-100">
                {coverImage && isSafeMediaUrl(coverImage) ? (
                  <Image
                    src={coverImage}
                    alt={title || "Ảnh bìa xem trước"}
                    fill
                    unoptimized
                    className="object-cover"
                  />
                ) : (
                  <div
                    className={`flex h-full w-full flex-col justify-between bg-gradient-to-br ${getCategoryBannerGradient(
                      selectedCategory?.slug || slug || "unera"
                    )} p-6 text-white`}
                  >
                    <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-xs font-medium backdrop-blur-xs">
                      <Compass className="h-3.5 w-3.5" />
                      {selectedCategory?.name || "Khám phá định hướng"}
                    </span>
                    <div className="text-xl font-bold leading-snug max-w-2xl">
                      {title || "Tiêu đề bài viết xem trước"}
                    </div>
                  </div>
                )}
              </div>

              <CardContent className="space-y-5 p-6 sm:p-8">
                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                  {selectedCategory && (
                    <span className="rounded-full bg-blue-50 px-2.5 py-1 font-medium text-blue-700">
                      {selectedCategory.name}
                    </span>
                  )}
                  {isFeatured && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 font-medium text-amber-700">
                      <Sparkles className="h-3 w-3" />
                      Nổi bật
                    </span>
                  )}
                  <span>· {authorName || "Ban biên tập Unera"}</span>
                  <span>· {autoReadTime} phút đọc</span>
                </div>

                <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
                  {title || "Chưa có tiêu đề"}
                </h1>

                {summary && (
                  <p className="rounded-xl border-l-4 border-blue-500 bg-slate-50 px-4 py-3 text-base text-slate-600 leading-relaxed">
                    {summary}
                  </p>
                )}

                <div className="border-t border-slate-100 pt-5">
                  <TiptapContentRenderer contentJson={contentJson} />
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Metadata Sidebar */}
        <div className="space-y-5 lg:col-span-4">
          <Card className="border-slate-200 shadow-2xs">
            <CardContent className="p-5">
              <CoverImageField
                value={coverImage}
                onChange={setCoverImage}
                module={CONTENT_MODULES.ORIENTATION}
              />
            </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-2xs">
            <CardContent className="space-y-4 p-5">
              <h3 className="text-sm font-semibold text-slate-900">
                Phân loại định hướng
              </h3>

              {taxonomyLoading ? (
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Đang tải danh mục...
                </div>
              ) : categories.length === 0 ? (
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
                  Chưa có danh mục nào.{" "}
                  <Link
                    href="/admin/explore/taxonomy"
                    className="font-semibold underline"
                  >
                    Tạo danh mục & chủ đề
                  </Link>
                </div>
              ) : (
                <>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-600">
                      Danh mục chính <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={categoryId}
                      onChange={(e) => handleCategoryChange(e.target.value)}
                      className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none focus:border-blue-500"
                    >
                      {categories.map((cat) => (
                        <option key={cat._id} value={cat._id}>
                          {cat.name}
                          {!cat.isActive ? " (Đang ẩn)" : ""}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-600">
                      Chủ đề liên quan ({topicIds.length} đã chọn)
                    </label>
                    {availableTopics.length === 0 ? (
                      <p className="text-xs text-slate-400">
                        Danh mục này chưa có chủ đề con.
                      </p>
                    ) : (
                      <div className="flex flex-wrap gap-1.5">
                        {availableTopics.map((topic) => {
                          const selected = topicIds.includes(topic._id);
                          return (
                            <button
                              key={topic._id}
                              type="button"
                              onClick={() => toggleTopic(topic._id)}
                              className={`rounded-full border px-2.5 py-1 text-xs font-medium transition-colors ${
                                selected
                                  ? "border-blue-600 bg-blue-600 text-white"
                                  : "border-slate-200 bg-slate-50 text-slate-700 hover:border-blue-300"
                              }`}
                            >
                              {topic.name}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-2xs">
            <CardContent className="space-y-4 p-5">
              <h3 className="text-sm font-semibold text-slate-900">
                Xuất bản & Thuộc tính
              </h3>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-600">
                  Trạng thái hiển thị
                </label>
                <select
                  value={status}
                  onChange={(e) =>
                    setStatus(
                      e.target.value as "DRAFT" | "PUBLISHED" | "UNPUBLISHED"
                    )
                  }
                  className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none focus:border-blue-500"
                >
                  <option value="DRAFT">Bản nháp (DRAFT)</option>
                  <option value="PUBLISHED">Đã xuất bản (PUBLISHED)</option>
                  <option value="UNPUBLISHED">Tạm ẩn (UNPUBLISHED)</option>
                </select>
              </div>

              <label className="flex cursor-pointer items-center justify-between rounded-xl border border-slate-200 bg-slate-50/60 px-3 py-2.5">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1.5 text-sm font-medium text-slate-800">
                    <Sparkles className="h-4 w-4 text-amber-500" />
                    Bài viết nổi bật
                  </div>
                  <p className="text-xs text-slate-500">
                    Ưu tiên hiển thị ở mục Tiêu điểm /explore
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={isFeatured}
                  onChange={(e) => setIsFeatured(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
              </label>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-600">
                  Tác giả / Nhóm biên tập
                </label>
                <Input
                  value={authorName}
                  onChange={(e) => setAuthorName(e.target.value)}
                  placeholder="Ban biên tập Unera"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-600">
                  Thời gian đọc (phút, bỏ trống = tự động {autoReadTime} phút)
                </label>
                <Input
                  type="number"
                  min={1}
                  max={120}
                  value={readTimeOverride}
                  onChange={(e) => setReadTimeOverride(e.target.value)}
                  placeholder={String(autoReadTime)}
                />
              </div>

              <div className="space-y-1.5">
                <label className="flex items-center gap-1.5 text-xs font-medium text-slate-600">
                  <Tag className="h-3.5 w-3.5 text-slate-400" />
                  Thẻ từ khóa (phân cách bởi dấu phẩy)
                </label>
                <Input
                  value={tagsInput}
                  onChange={(e) => setTagsInput(e.target.value)}
                  placeholder="Du học, Học bổng, IELTS, Định hướng"
                />
                {parsedTags.length > 0 && (
                  <div className="flex flex-wrap gap-1 pt-1">
                    {parsedTags.map((t) => (
                      <span
                        key={t}
                        className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600"
                      >
                        #{t}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="pt-2">
                <Button
                  type="button"
                  disabled={saving}
                  onClick={() => handleSubmit()}
                  className="w-full bg-slate-900 text-white hover:bg-slate-800"
                >
                  {saving ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="mr-2 h-4 w-4" />
                  )}
                  Lưu với trạng thái hiện tại ({status})
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

