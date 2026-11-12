"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  CheckCircle2,
  Edit3,
  Eye,
  EyeOff,
  FolderTree,
  Loader2,
  Plus,
  Save,
  Tags,
  Trash2,
  X,
} from "lucide-react";
import { fetchWithAuth } from "@/components/providers/AuthProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ORIENTATION_ICON_OPTIONS,
  slugifyVietnamese,
} from "@/lib/orientation-utils";

interface CategoryAdminRow {
  _id: string;
  name: string;
  slug: string;
  description: string;
  icon: string;
  order: number;
  isActive: boolean;
  topicCount: number;
  articleCount: number;
}

interface TopicAdminRow {
  _id: string;
  categoryId: string;
  name: string;
  slug: string;
  description: string;
  order: number;
  isActive: boolean;
  articleCount: number;
}

function broadcastTaxonomyUpdated() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("unera:taxonomy-updated"));
  }
}

export default function AdminExploreTaxonomyPage() {
  const [categories, setCategories] = useState<CategoryAdminRow[]>([]);
  const [topics, setTopics] = useState<TopicAdminRow[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Category Form state
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(
    null
  );
  const [catName, setCatName] = useState("");
  const [catSlug, setCatSlug] = useState("");
  const [catDescription, setCatDescription] = useState("");
  const [catIcon, setCatIcon] = useState("Compass");
  const [catIsActive, setCatIsActive] = useState(true);

  // Topic Form state
  const [editingTopicId, setEditingTopicId] = useState<string | null>(null);
  const [topicName, setTopicName] = useState("");
  const [topicSlug, setTopicSlug] = useState("");
  const [topicDescription, setTopicDescription] = useState("");
  const [topicParentId, setTopicParentId] = useState("");
  const [topicIsActive, setTopicIsActive] = useState(true);

  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const fetchAllPayload = useCallback(async () => {
    const [catRes, topicRes] = await Promise.all([
      fetchWithAuth("/api/admin/orientation/categories", {
        cache: "no-store",
      }),
      fetchWithAuth("/api/admin/orientation/topics", { cache: "no-store" }),
    ]);
    const [catData, topicData] = await Promise.all([
      catRes.json(),
      topicRes.json(),
    ]);
    return { catRes, topicRes, catData, topicData };
  }, []);

  const loadAll = useCallback(async () => {
    try {
      const { catRes, topicRes, catData, topicData } = await fetchAllPayload();

      if (catRes.ok && Array.isArray(catData.categories)) {
        setCategories(catData.categories);
        setSelectedCategoryId((prev) => {
          if (
            prev &&
            catData.categories.some((c: CategoryAdminRow) => c._id === prev)
          ) {
            return prev;
          }
          return catData.categories[0]?._id || "";
        });
      }
      if (topicRes.ok && Array.isArray(topicData.topics)) {
        setTopics(topicData.topics);
      }
    } catch {
      setFeedback({
        type: "error",
        text: "Không thể tải danh sách danh mục và chủ đề.",
      });
    } finally {
      setLoading(false);
    }
  }, [fetchAllPayload]);

  useEffect(() => {
    let active = true;
    fetchAllPayload()
      .then(({ catRes, topicRes, catData, topicData }) => {
        if (!active) return;
        if (catRes.ok && Array.isArray(catData.categories)) {
          setCategories(catData.categories);
          setSelectedCategoryId((prev) => {
            if (
              prev &&
              catData.categories.some((c: CategoryAdminRow) => c._id === prev)
            ) {
              return prev;
            }
            return catData.categories[0]?._id || "";
          });
        }
        if (topicRes.ok && Array.isArray(topicData.topics)) {
          setTopics(topicData.topics);
        }
      })
      .catch(() => {
        if (active) {
          setFeedback({
            type: "error",
            text: "Không thể tải danh sách danh mục và chủ đề.",
          });
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [fetchAllPayload]);

  const activeCategory = useMemo(
    () => categories.find((c) => c._id === selectedCategoryId) || null,
    [categories, selectedCategoryId]
  );

  const scopedTopics = useMemo(
    () => topics.filter((t) => t.categoryId === selectedCategoryId),
    [topics, selectedCategoryId]
  );

  const resetCategoryForm = () => {
    setEditingCategoryId(null);
    setCatName("");
    setCatSlug("");
    setCatDescription("");
    setCatIcon("Compass");
    setCatIsActive(true);
  };

  const resetTopicForm = (defaultCatId?: string) => {
    setEditingTopicId(null);
    setTopicName("");
    setTopicSlug("");
    setTopicDescription("");
    setTopicParentId(defaultCatId || selectedCategoryId);
    setTopicIsActive(true);
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    if (catName.trim().length < 2) {
      setFeedback({
        type: "error",
        text: "Tên danh mục phải có tối thiểu 2 ký tự.",
      });
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: catName.trim(),
        slug: (catSlug.trim() || slugifyVietnamese(catName)).toLowerCase(),
        description: catDescription.trim(),
        icon: catIcon,
        isActive: catIsActive,
      };

      const url = editingCategoryId
        ? `/api/admin/orientation/categories/${editingCategoryId}`
        : "/api/admin/orientation/categories";

      const res = await fetchWithAuth(url, {
        method: editingCategoryId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (!res.ok) {
        setFeedback({
          type: "error",
          text: data.error || "Không thể lưu danh mục.",
        });
        return;
      }

      resetCategoryForm();
      await loadAll();
      if (!editingCategoryId && data.category?._id) {
        setSelectedCategoryId(data.category._id);
      }
      broadcastTaxonomyUpdated();
      setFeedback({
        type: "success",
        text: editingCategoryId
          ? "Đã cập nhật danh mục và đồng bộ Sidebar."
          : "Đã tạo danh mục mới và đồng bộ Sidebar.",
      });
    } catch {
      setFeedback({ type: "error", text: "Lỗi kết nối máy chủ." });
    } finally {
      setSaving(false);
    }
  };

  const handleToggleCategoryActive = async (cat: CategoryAdminRow) => {
    setFeedback(null);
    try {
      const res = await fetchWithAuth(
        `/api/admin/orientation/categories/${cat._id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ isActive: !cat.isActive }),
        }
      );
      const data = await res.json();
      if (!res.ok) {
        setFeedback({
          type: "error",
          text: data.error || "Không thể thay đổi hiển thị danh mục.",
        });
        return;
      }
      await loadAll();
      broadcastTaxonomyUpdated();
      setFeedback({
        type: "success",
        text: !cat.isActive
          ? `Đã bật hiển thị "${cat.name}" trên Sidebar.`
          : `Đã ẩn "${cat.name}" khỏi Sidebar sinh viên.`,
      });
    } catch {
      setFeedback({ type: "error", text: "Lỗi kết nối máy chủ." });
    }
  };

  const handleDeleteCategory = async (cat: CategoryAdminRow) => {
    if (
      !window.confirm(
        `Bạn có chắc muốn xóa danh mục "${cat.name}"?`
      )
    ) {
      return;
    }

    setFeedback(null);
    try {
      const res = await fetchWithAuth(
        `/api/admin/orientation/categories/${cat._id}`,
        { method: "DELETE" }
      );
      const data = await res.json();
      if (!res.ok) {
        setFeedback({
          type: "error",
          text: data.error || "Không thể xóa danh mục.",
        });
        return;
      }
      if (editingCategoryId === cat._id) resetCategoryForm();
      await loadAll();
      broadcastTaxonomyUpdated();
      setFeedback({
        type: "success",
        text: `Đã xóa danh mục "${cat.name}".`,
      });
    } catch {
      setFeedback({ type: "error", text: "Lỗi kết nối máy chủ." });
    }
  };

  const handleMoveOrder = async (
    kind: "category" | "topic",
    list: { _id: string }[],
    index: number,
    direction: -1 | 1
  ) => {
    const targetIdx = index + direction;
    if (targetIdx < 0 || targetIdx >= list.length) return;

    const reordered = [...list];
    const [moved] = reordered.splice(index, 1);
    reordered.splice(targetIdx, 0, moved);

    try {
      const res = await fetchWithAuth(
        "/api/admin/orientation/taxonomy/reorder",
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            kind,
            orderedIds: reordered.map((item) => item._id),
          }),
        }
      );
      if (res.ok) {
        await loadAll();
        broadcastTaxonomyUpdated();
      }
    } catch {
      setFeedback({ type: "error", text: "Không thể cập nhật thứ tự." });
    }
  };

  const handleSaveTopic = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    const parentCatId = topicParentId || selectedCategoryId;
    if (!parentCatId) {
      setFeedback({
        type: "error",
        text: "Vui lòng chọn danh mục cha trước khi tạo chủ đề.",
      });
      return;
    }
    if (topicName.trim().length < 2) {
      setFeedback({
        type: "error",
        text: "Tên chủ đề con tối thiểu 2 ký tự.",
      });
      return;
    }

    setSaving(true);
    try {
      const payload = {
        categoryId: parentCatId,
        name: topicName.trim(),
        slug: (topicSlug.trim() || slugifyVietnamese(topicName)).toLowerCase(),
        description: topicDescription.trim(),
        isActive: topicIsActive,
      };

      const url = editingTopicId
        ? `/api/admin/orientation/topics/${editingTopicId}`
        : "/api/admin/orientation/topics";

      const res = await fetchWithAuth(url, {
        method: editingTopicId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (!res.ok) {
        setFeedback({
          type: "error",
          text: data.error || "Không thể lưu chủ đề.",
        });
        return;
      }

      resetTopicForm(selectedCategoryId);
      await loadAll();
      broadcastTaxonomyUpdated();
      setFeedback({
        type: "success",
        text: editingTopicId
          ? "Đã cập nhật chủ đề con và đồng bộ Sidebar."
          : "Đã thêm chủ đề con mới và đồng bộ Sidebar.",
      });
    } catch {
      setFeedback({ type: "error", text: "Lỗi kết nối máy chủ." });
    } finally {
      setSaving(false);
    }
  };

  const handleToggleTopicActive = async (topic: TopicAdminRow) => {
    setFeedback(null);
    try {
      const res = await fetchWithAuth(
        `/api/admin/orientation/topics/${topic._id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ isActive: !topic.isActive }),
        }
      );
      if (res.ok) {
        await loadAll();
        broadcastTaxonomyUpdated();
      }
    } catch {
      setFeedback({ type: "error", text: "Lỗi kết nối máy chủ." });
    }
  };

  const handleDeleteTopic = async (topic: TopicAdminRow) => {
    const confirmText =
      topic.articleCount > 0
        ? `Chủ đề "${topic.name}" đang được gắn vào ${topic.articleCount} bài viết. Nếu xóa, chủ đề này sẽ tự động được gỡ khỏi các bài viết đó. Bạn có chắc muốn xóa?`
        : `Bạn có chắc muốn xóa chủ đề "${topic.name}"?`;

    if (!window.confirm(confirmText)) return;

    setFeedback(null);
    try {
      const res = await fetchWithAuth(
        `/api/admin/orientation/topics/${topic._id}`,
        { method: "DELETE" }
      );
      const data = await res.json();
      if (!res.ok) {
        setFeedback({
          type: "error",
          text: data.error || "Không thể xóa chủ đề.",
        });
        return;
      }
      if (editingTopicId === topic._id) resetTopicForm();
      await loadAll();
      broadcastTaxonomyUpdated();
      setFeedback({
        type: "success",
        text: `Đã xóa chủ đề "${topic.name}" và đồng bộ Sidebar.`,
      });
    } catch {
      setFeedback({ type: "error", text: "Lỗi kết nối máy chủ." });
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-1">
          <Link
            href="/admin/explore"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-blue-600"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Quay lại Quản lý bài viết</span>
          </Link>
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-slate-900">
            <FolderTree className="h-6 w-6 text-blue-600" />
            <span>Quản lý Danh mục & Chủ đề Khám phá Định hướng</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Cây 2 cấp (Danh mục cấp 1 → Chủ đề/Thẻ con cấp 2) tự động đồng bộ trực tiếp lên Sidebar Khám phá định hướng.
          </p>
        </div>
      </div>

      {feedback && (
        <div
          role="alert"
          className={`flex items-center gap-2 rounded-2xl border px-4 py-3 text-xs sm:text-sm font-medium ${
            feedback.type === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
              : "border-rose-200 bg-rose-50 text-rose-700"
          }`}
        >
          {feedback.type === "success" ? (
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
          ) : (
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
          )}
          <span>{feedback.text}</span>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-16 text-xs text-slate-500 gap-2">
          <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
          <span>Đang tải cấu trúc danh mục...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* LEFT: CATEGORY MANAGEMENT (LEVEL 1) */}
          <section className="lg:col-span-6 space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900">
                1. Danh mục cấp 1 (Sidebar) ({categories.length})
              </h2>
            </div>

            {/* Category Form */}
            <form
              onSubmit={handleSaveCategory}
              className="rounded-xl border border-slate-200 bg-slate-50/60 p-4 space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700">
                  {editingCategoryId
                    ? "Chỉnh sửa danh mục"
                    : "+ Thêm danh mục mới"}
                </span>
                {editingCategoryId && (
                  <button
                    type="button"
                    onClick={resetCategoryForm}
                    className="inline-flex items-center gap-1 text-[11px] text-slate-500 hover:text-slate-800 cursor-pointer"
                  >
                    <X className="h-3 w-3" /> Hủy sửa
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <Input
                  value={catName}
                  onChange={(e) => {
                    setCatName(e.target.value);
                    if (!editingCategoryId) {
                      setCatSlug(slugifyVietnamese(e.target.value));
                    }
                  }}
                  placeholder="Tên danh mục (vd: Khối ngành)"
                  className="rounded-xl border-slate-200 bg-white text-xs"
                />
                <Input
                  value={catSlug}
                  onChange={(e) => setCatSlug(e.target.value.toLowerCase())}
                  placeholder="Slug (vd: khoi-nganh)"
                  className="rounded-xl border-slate-200 bg-white text-xs"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <Input
                  value={catDescription}
                  onChange={(e) => setCatDescription(e.target.value)}
                  placeholder="Mô tả ngắn (tùy chọn)"
                  className="rounded-xl border-slate-200 bg-white text-xs"
                />
                <select
                  value={catIcon}
                  onChange={(e) => setCatIcon(e.target.value)}
                  className="h-9 rounded-xl border border-slate-200 bg-white px-3 text-xs text-slate-700"
                >
                  {ORIENTATION_ICON_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-between pt-1">
                <label className="inline-flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={catIsActive}
                    onChange={(e) => setCatIsActive(e.target.checked)}
                    className="rounded border-slate-300 text-blue-600"
                  />
                  <span>Hiển thị trên Sidebar</span>
                </label>

                <Button
                  type="submit"
                  size="sm"
                  disabled={saving}
                  className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white gap-1"
                >
                  {editingCategoryId ? (
                    <Save className="h-3.5 w-3.5" />
                  ) : (
                    <Plus className="h-3.5 w-3.5" />
                  )}
                  <span>{editingCategoryId ? "Lưu danh mục" : "Thêm mới"}</span>
                </Button>
              </div>
            </form>

            {/* Category List */}
            <div className="space-y-2">
              {categories.length === 0 ? (
                <p className="py-6 text-center text-xs text-slate-400">
                  Chưa có danh mục nào.
                </p>
              ) : (
                categories.map((cat, idx) => {
                  const isSelected = cat._id === selectedCategoryId;
                  return (
                    <div
                      key={cat._id}
                      className={`flex items-center justify-between gap-3 rounded-xl border p-3 transition-colors ${
                        isSelected
                          ? "border-blue-300 bg-blue-50/50"
                          : "border-slate-200 bg-white hover:bg-slate-50"
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedCategoryId(cat._id);
                          resetTopicForm(cat._id);
                        }}
                        className="min-w-0 flex-1 text-left cursor-pointer"
                      >
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-xs sm:text-sm font-bold text-slate-900">
                            {cat.name}
                          </span>
                          <span className="text-[11px] text-slate-400">
                            /{cat.slug}
                          </span>
                          {!cat.isActive && (
                            <span className="rounded bg-slate-200 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600">
                              Đang ẩn
                            </span>
                          )}
                        </div>
                        <p className="mt-0.5 text-[11px] text-slate-500">
                          {cat.topicCount} chủ đề con · {cat.articleCount} bài viết
                        </p>
                      </button>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          disabled={idx === 0}
                          onClick={() =>
                            handleMoveOrder("category", categories, idx, -1)
                          }
                          className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 disabled:opacity-30 cursor-pointer"
                          title="Lên trên"
                        >
                          <ArrowUp className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          disabled={idx === categories.length - 1}
                          onClick={() =>
                            handleMoveOrder("category", categories, idx, 1)
                          }
                          className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 disabled:opacity-30 cursor-pointer"
                          title="Xuống dưới"
                        >
                          <ArrowDown className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleToggleCategoryActive(cat)}
                          className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-blue-600 cursor-pointer"
                          title={cat.isActive ? "Ẩn danh mục" : "Hiện danh mục"}
                        >
                          {cat.isActive ? (
                            <Eye className="h-3.5 w-3.5 text-emerald-600" />
                          ) : (
                            <EyeOff className="h-3.5 w-3.5" />
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingCategoryId(cat._id);
                            setCatName(cat.name);
                            setCatSlug(cat.slug);
                            setCatDescription(cat.description || "");
                            setCatIcon(cat.icon || "Compass");
                            setCatIsActive(cat.isActive);
                          }}
                          className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-blue-600 cursor-pointer"
                          title="Chỉnh sửa"
                        >
                          <Edit3 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteCategory(cat)}
                          className="rounded-lg p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600 cursor-pointer"
                          title="Xóa danh mục"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </section>

          {/* RIGHT: TOPIC/TAG MANAGEMENT (LEVEL 2) */}
          <section className="lg:col-span-6 space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs">
            <div className="flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-base font-bold text-slate-900">
                <Tags className="h-4 w-4 text-blue-600" />
                <span>
                  2. Chủ đề con của{" "}
                  {activeCategory ? `"${activeCategory.name}"` : "..."} (
                  {scopedTopics.length})
                </span>
              </h2>
            </div>

            {!activeCategory ? (
              <p className="py-10 text-center text-xs text-slate-400">
                Chọn hoặc tạo ít nhất 1 danh mục bên trái để quản lý chủ đề con.
              </p>
            ) : (
              <>
                <form
                  onSubmit={handleSaveTopic}
                  className="rounded-xl border border-slate-200 bg-slate-50/60 p-4 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700">
                      {editingTopicId
                        ? "Chỉnh sửa chủ đề con"
                        : `+ Thêm chủ đề thuộc "${activeCategory.name}"`}
                    </span>
                    {editingTopicId && (
                      <button
                        type="button"
                        onClick={() => resetTopicForm(selectedCategoryId)}
                        className="inline-flex items-center gap-1 text-[11px] text-slate-500 hover:text-slate-800 cursor-pointer"
                      >
                        <X className="h-3 w-3" /> Hủy sửa
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <Input
                      value={topicName}
                      onChange={(e) => {
                        setTopicName(e.target.value);
                        if (!editingTopicId) {
                          setTopicSlug(slugifyVietnamese(e.target.value));
                        }
                      }}
                      placeholder="Tên chủ đề (vd: Ngôn ngữ)"
                      className="rounded-xl border-slate-200 bg-white text-xs"
                    />
                    <Input
                      value={topicSlug}
                      onChange={(e) =>
                        setTopicSlug(e.target.value.toLowerCase())
                      }
                      placeholder="Slug (vd: ngon-ngu)"
                      className="rounded-xl border-slate-200 bg-white text-xs"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <Input
                      value={topicDescription}
                      onChange={(e) => setTopicDescription(e.target.value)}
                      placeholder="Mô tả ngắn chủ đề"
                      className="rounded-xl border-slate-200 bg-white text-xs"
                    />
                    <select
                      value={topicParentId || selectedCategoryId}
                      onChange={(e) => setTopicParentId(e.target.value)}
                      className="h-9 rounded-xl border border-slate-200 bg-white px-3 text-xs text-slate-700"
                    >
                      {categories.map((c) => (
                        <option key={c._id} value={c._id}>
                          Thuộc: {c.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <label className="inline-flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={topicIsActive}
                        onChange={(e) => setTopicIsActive(e.target.checked)}
                        className="rounded border-slate-300 text-blue-600"
                      />
                      <span>Hiển thị ở Sidebar</span>
                    </label>

                    <Button
                      type="submit"
                      size="sm"
                      disabled={saving}
                      className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white gap-1"
                    >
                      {editingTopicId ? (
                        <Save className="h-3.5 w-3.5" />
                      ) : (
                        <Plus className="h-3.5 w-3.5" />
                      )}
                      <span>{editingTopicId ? "Lưu chủ đề" : "Thêm chủ đề"}</span>
                    </Button>
                  </div>
                </form>

                <div className="space-y-2">
                  {scopedTopics.length === 0 ? (
                    <p className="py-6 text-center text-xs text-slate-400">
                      Danh mục này chưa có chủ đề con nào.
                    </p>
                  ) : (
                    scopedTopics.map((topic, idx) => (
                      <div
                        key={topic._id}
                        className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-3 hover:bg-slate-50 transition-colors"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-xs sm:text-sm font-semibold text-slate-900">
                              · {topic.name}
                            </span>
                            <span className="text-[11px] text-slate-400">
                              /{topic.slug}
                            </span>
                            {!topic.isActive && (
                              <span className="rounded bg-slate-200 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600">
                                Đang ẩn
                              </span>
                            )}
                          </div>
                          <p className="mt-0.5 text-[11px] text-slate-500">
                            {topic.articleCount} bài viết gắn chủ đề này
                          </p>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            disabled={idx === 0}
                            onClick={() =>
                              handleMoveOrder("topic", scopedTopics, idx, -1)
                            }
                            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 disabled:opacity-30 cursor-pointer"
                            title="Lên trên"
                          >
                            <ArrowUp className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            disabled={idx === scopedTopics.length - 1}
                            onClick={() =>
                              handleMoveOrder("topic", scopedTopics, idx, 1)
                            }
                            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 disabled:opacity-30 cursor-pointer"
                            title="Xuống dưới"
                          >
                            <ArrowDown className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleToggleTopicActive(topic)}
                            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-blue-600 cursor-pointer"
                            title={topic.isActive ? "Ẩn chủ đề" : "Hiện chủ đề"}
                          >
                            {topic.isActive ? (
                              <Eye className="h-3.5 w-3.5 text-emerald-600" />
                            ) : (
                              <EyeOff className="h-3.5 w-3.5" />
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingTopicId(topic._id);
                              setTopicName(topic.name);
                              setTopicSlug(topic.slug);
                              setTopicDescription(topic.description || "");
                              setTopicParentId(topic.categoryId);
                              setTopicIsActive(topic.isActive);
                            }}
                            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-blue-600 cursor-pointer"
                            title="Chỉnh sửa"
                          >
                            <Edit3 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteTopic(topic)}
                            className="rounded-lg p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600 cursor-pointer"
                            title="Xóa chủ đề"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
