"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  ArrowDown,
  ArrowUp,
  CheckCircle2,
  Edit,
  Eye,
  EyeOff,
  Loader2,
  PanelLeft,
  PanelLeftClose,
  Plus,
  Save,
  Trash2,
  X,
} from "lucide-react";
import { fetchWithAuth } from "@/components/providers/AuthProvider";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { NEWS_CATEGORY_COLOR_TOKENS } from "@/constants";
import { NEWS_CATEGORY_COLOR_MAP, getNewsColorClasses } from "@/lib/news-utils";
import { slugifyVietnamese } from "@/lib/orientation-utils";
import type { INewsCategoryDTO } from "@/types";

export default function AdminNewsCategoriesPage() {
  const [categories, setCategories] = useState<INewsCategoryDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const [newName, setNewName] = useState("");
  const [newSlug, setNewSlug] = useState("");
  const [newSlugTouched, setNewSlugTouched] = useState(false);
  const [newDescription, setNewDescription] = useState("");
  const [newColorToken, setNewColorToken] = useState<string>("blue");
  const [newShowInSidebar, setNewShowInSidebar] = useState(true);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editSlug, setEditSlug] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editColorToken, setEditColorToken] = useState<string>("blue");
  const [editShowInSidebar, setEditShowInSidebar] = useState(true);

  const [feedback, setFeedback] = useState<{
    type: "error" | "success";
    text: string;
  } | null>(null);

  const notifySidebarUpdated = () => {
    window.dispatchEvent(new Event("unera:news-categories-updated"));
  };

  const refreshCategories = async () => {
    const res = await fetchWithAuth("/api/admin/news/categories", {
      cache: "no-store",
    });
    const data = await res.json();
    if (res.ok && Array.isArray(data.categories)) {
      setCategories(data.categories);
    }
  };

  useEffect(() => {
    let active = true;
    const init = async () => {
      try {
        const res = await fetchWithAuth("/api/admin/news/categories", {
          cache: "no-store",
        });
        const data = await res.json();
        if (active && res.ok && Array.isArray(data.categories)) {
          setCategories(data.categories);
        }
      } finally {
        if (active) setLoading(false);
      }
    };
    void init();
    return () => {
      active = false;
    };
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || newName.trim().length < 2) {
      setFeedback({ type: "error", text: "Tên danh mục tối thiểu 2 ký tự." });
      return;
    }

    setCreating(true);
    setFeedback(null);
    try {
      const res = await fetchWithAuth("/api/admin/news/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newName.trim(),
          slug: newSlug.trim() || undefined,
          description: newDescription.trim(),
          colorToken: newColorToken,
          order: categories.length + 1,
          isActive: true,
          showInSidebar: newShowInSidebar,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setFeedback({ type: "error", text: data.error || "Không thể tạo danh mục." });
        return;
      }
      setNewName("");
      setNewSlug("");
      setNewSlugTouched(false);
      setNewDescription("");
      setNewShowInSidebar(true);
      setFeedback({ type: "success", text: data.message || "Đã tạo danh mục." });
      await refreshCategories();
      notifySidebarUpdated();
    } finally {
      setCreating(false);
    }
  };

  const handleSaveEdit = async (id: string) => {
    if (!editName.trim() || editName.trim().length < 2) {
      setFeedback({ type: "error", text: "Tên danh mục tối thiểu 2 ký tự." });
      return;
    }
    setBusyId(id);
    setFeedback(null);
    try {
      const res = await fetchWithAuth(`/api/admin/news/categories/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editName.trim(),
          slug: editSlug.trim() || undefined,
          description: editDescription.trim(),
          colorToken: editColorToken,
          showInSidebar: editShowInSidebar,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setFeedback({ type: "error", text: data.error || "Không thể cập nhật." });
        return;
      }
      setEditingId(null);
      setFeedback({ type: "success", text: data.message || "Đã cập nhật danh mục." });
      await refreshCategories();
      notifySidebarUpdated();
    } finally {
      setBusyId(null);
    }
  };

  const handleToggleActive = async (cat: INewsCategoryDTO) => {
    setBusyId(cat._id);
    setFeedback(null);
    try {
      const res = await fetchWithAuth(`/api/admin/news/categories/${cat._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !cat.isActive }),
      });
      if (res.ok) {
        setFeedback({
          type: "success",
          text: cat.isActive
            ? `Đã tạm ẩn danh mục "${cat.name}".`
            : `Đã kích hoạt lại danh mục "${cat.name}".`,
        });
        await refreshCategories();
        notifySidebarUpdated();
      }
    } finally {
      setBusyId(null);
    }
  };

  const handleToggleShowInSidebar = async (cat: INewsCategoryDTO) => {
    const nextValue = cat.showInSidebar === false;
    setBusyId(cat._id);
    setFeedback(null);
    try {
      const res = await fetchWithAuth(`/api/admin/news/categories/${cat._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ showInSidebar: nextValue }),
      });
      const data = await res.json();
      if (!res.ok) {
        setFeedback({
          type: "error",
          text: data.error || "Không thể cập nhật trạng thái hiển thị Sidebar.",
        });
        return;
      }
      const updatedCategory: INewsCategoryDTO | undefined = data.category;
      if (updatedCategory) {
        setCategories((prev) =>
          prev.map((item) => (item._id === cat._id ? updatedCategory : item))
        );
      }
      const persistedValue = updatedCategory
        ? updatedCategory.showInSidebar !== false
        : nextValue;
      setFeedback({
        type: "success",
        text: persistedValue
          ? `Sidebar "${cat.name}": Đang bật hiển thị.`
          : `Sidebar "${cat.name}": Đã tắt hiển thị (danh mục vẫn hiển thị trên trang Tin tức).`,
      });
      await refreshCategories();
      notifySidebarUpdated();
    } finally {
      setBusyId(null);
    }
  };

  const handleMove = async (index: number, direction: -1 | 1) => {
    const targetIdx = index + direction;
    if (targetIdx < 0 || targetIdx >= categories.length) return;
    const reordered = [...categories];
    const [moved] = reordered.splice(index, 1);
    reordered.splice(targetIdx, 0, moved);
    setCategories(reordered);

    await fetchWithAuth("/api/admin/news/categories", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderedIds: reordered.map((c) => c._id) }),
    });
    notifySidebarUpdated();
  };

  const handleDelete = async (cat: INewsCategoryDTO) => {
    if (!window.confirm(`Xác nhận xóa danh mục "${cat.name}"?`)) return;
    setBusyId(cat._id);
    setFeedback(null);
    try {
      const res = await fetchWithAuth(`/api/admin/news/categories/${cat._id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) {
        setFeedback({ type: "error", text: data.error || "Không thể xóa danh mục." });
        return;
      }
      setFeedback({ type: "success", text: data.message || "Đã xóa danh mục." });
      await refreshCategories();
      notifySidebarUpdated();
    } finally {
      setBusyId(null);
    }
  };

  const sidebarVisibleCount = categories.filter(
    (c) => c.isActive && c.showInSidebar !== false
  ).length;

  return (
    <div className="w-full max-w-6xl px-6 sm:px-8 py-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
              Quản Lý Danh Mục Tin Tức
            </h1>
            {!loading && (
              <span className="inline-flex items-center gap-1 rounded-full border border-sky-200 bg-sky-50 px-2.5 py-0.5 text-[11px] font-semibold text-sky-700">
                <PanelLeft className="h-3 w-3" />
                {sidebarVisibleCount}/{categories.length} hiển thị trên Sidebar
              </span>
            )}
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Thêm, sửa, sắp xếp và bật/tắt từng danh mục hiển thị trên Sidebar sinh viên.
          </p>
        </div>

        <Link href="/admin/news">
          <Button variant="outline" size="sm">
            Quay lại Bài viết Tin tức
          </Button>
        </Link>
      </div>

      {feedback && (
        <div
          className={`flex items-center gap-2 rounded-xl border px-4 py-3 text-xs font-medium ${
            feedback.type === "error"
              ? "border-rose-200 bg-rose-50 text-rose-700"
              : "border-emerald-200 bg-emerald-50 text-emerald-700"
          }`}
        >
          {feedback.type === "error" ? (
            <AlertCircle className="h-4 w-4 shrink-0" />
          ) : (
            <CheckCircle2 className="h-4 w-4 shrink-0" />
          )}
          <span>{feedback.text}</span>
        </div>
      )}

      {/* Create Form */}
      <Card className="rounded-2xl border-slate-200/80 shadow-2xs bg-white">
        <CardContent className="p-5">
          <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
            <div className="md:col-span-3 space-y-1">
              <label className="text-xs font-semibold text-slate-700">
                Tên danh mục *
              </label>
              <Input
                value={newName}
                onChange={(e) => {
                  setNewName(e.target.value);
                  if (!newSlugTouched) {
                    setNewSlug(slugifyVietnamese(e.target.value));
                  }
                }}
                placeholder="VD: Góc nhìn quốc tế"
                className="h-9 text-xs"
              />
            </div>

            <div className="md:col-span-3 space-y-1">
              <label className="text-xs font-semibold text-slate-700">Slug</label>
              <Input
                value={newSlug}
                onChange={(e) => {
                  setNewSlugTouched(true);
                  setNewSlug(e.target.value.toLowerCase());
                }}
                placeholder="goc-nhin-quoc-te"
                className="h-9 text-xs font-mono"
              />
            </div>

            <div className="md:col-span-2 space-y-1">
              <label className="text-xs font-semibold text-slate-700">Màu nhãn</label>
              <select
                value={newColorToken}
                onChange={(e) => setNewColorToken(e.target.value)}
                className="w-full h-9 rounded-xl border border-slate-200 bg-white px-2.5 text-xs"
              >
                {NEWS_CATEGORY_COLOR_TOKENS.map((tok) => (
                  <option key={tok} value={tok}>
                    {NEWS_CATEGORY_COLOR_MAP[tok]?.label || tok}
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-3 space-y-1">
              <label className="text-xs font-semibold text-slate-700">Mô tả ngắn</label>
              <Input
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                placeholder="Mô tả..."
                className="h-9 text-xs"
              />
            </div>

            <div className="md:col-span-1">
              <Button type="submit" size="sm" disabled={creating} className="w-full h-9">
                {creating ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4" />
                )}
              </Button>
            </div>

            <div className="md:col-span-12 pt-1">
              <label className="inline-flex items-center gap-2 text-xs text-slate-700 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={newShowInSidebar}
                  onChange={(e) => setNewShowInSidebar(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <span>Hiển thị chuyên mục này trong menu Sidebar của sinh viên</span>
              </label>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Categories List */}
      <Card className="rounded-2xl border-slate-200/80 shadow-2xs bg-white overflow-hidden">
        {loading ? (
          <div className="flex h-48 items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {categories.map((cat, idx) => {
              const colorClasses = getNewsColorClasses(cat.colorToken);
              const isEditing = editingId === cat._id;
              const isBusy = busyId === cat._id;

              return (
                <div
                  key={cat._id}
                  className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/60"
                >
                  {isEditing ? (
                    <div className="flex-1 grid grid-cols-1 sm:grid-cols-4 gap-2">
                      <Input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="h-9 text-xs"
                      />
                      <Input
                        value={editSlug}
                        onChange={(e) => setEditSlug(e.target.value.toLowerCase())}
                        className="h-9 text-xs font-mono"
                      />
                      <select
                        value={editColorToken}
                        onChange={(e) => setEditColorToken(e.target.value)}
                        className="h-9 rounded-xl border border-slate-200 bg-white px-2 text-xs"
                      >
                        {NEWS_CATEGORY_COLOR_TOKENS.map((tok) => (
                          <option key={tok} value={tok}>
                            {NEWS_CATEGORY_COLOR_MAP[tok]?.label || tok}
                          </option>
                        ))}
                      </select>
                      <Input
                        value={editDescription}
                        onChange={(e) => setEditDescription(e.target.value)}
                        placeholder="Mô tả"
                        className="h-9 text-xs"
                      />
                      <label className="sm:col-span-4 inline-flex items-center gap-2 text-xs text-slate-700 pt-1 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={editShowInSidebar}
                          onChange={(e) => setEditShowInSidebar(e.target.checked)}
                          className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span>Hiển thị chuyên mục này trên Sidebar</span>
                      </label>
                    </div>
                  ) : (
                    <div className="space-y-1 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`rounded-md border px-2.5 py-0.5 text-xs font-semibold ${colorClasses.pillClass}`}
                        >
                          {cat.name}
                        </span>
                        <span className="text-[11px] font-mono text-slate-400">
                          /{cat.slug}
                        </span>
                        <span className="text-[11px] text-slate-500">
                          · {cat.articleCount ?? 0} bài viết
                        </span>
                        {!cat.isActive ? (
                          <span className="inline-flex items-center gap-1 rounded bg-slate-200 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                            <PanelLeftClose className="h-3 w-3" />
                            Đang tạm ẩn · Đã tắt Sidebar
                          </span>
                        ) : cat.showInSidebar !== false ? (
                          <span className="inline-flex items-center gap-1 rounded border border-sky-200 bg-sky-50 px-2 py-0.5 text-[10px] font-semibold text-sky-700">
                            <PanelLeft className="h-3 w-3" />
                            Sidebar: Đang bật
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded border border-slate-200 bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                            <PanelLeftClose className="h-3 w-3" />
                            Sidebar: Đã tắt
                          </span>
                        )}
                      </div>
                      {cat.description && (
                        <p className="text-xs text-slate-500">{cat.description}</p>
                      )}
                    </div>
                  )}

                  <div className="flex items-center gap-1.5 shrink-0">
                    {isEditing ? (
                      <>
                        <Button
                          type="button"
                          size="sm"
                          disabled={isBusy}
                          onClick={() => handleSaveEdit(cat._id)}
                        >
                          <Save className="h-3.5 w-3.5 mr-1" /> Lưu
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={() => setEditingId(null)}
                        >
                          <X className="h-3.5 w-3.5" />
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          disabled={idx === 0 || isBusy}
                          onClick={() => handleMove(idx, -1)}
                          title="Đẩy lên trên"
                        >
                          <ArrowUp className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          disabled={idx === categories.length - 1 || isBusy}
                          onClick={() => handleMove(idx, 1)}
                          title="Đẩy xuống dưới"
                        >
                          <ArrowDown className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          type="button"
                          role="switch"
                          aria-checked={cat.isActive && cat.showInSidebar !== false}
                          aria-label={`Hiển thị ${cat.name} trên Sidebar`}
                          size="sm"
                          variant="outline"
                          disabled={isBusy || !cat.isActive}
                          onClick={() => handleToggleShowInSidebar(cat)}
                          title={
                            !cat.isActive
                              ? "Danh mục đang tạm ẩn nên đã tắt khỏi Sidebar"
                              : cat.showInSidebar !== false
                                ? "Đang bật trên Sidebar — bấm để tắt"
                                : "Đã tắt trên Sidebar — bấm để bật lại"
                          }
                          className={`gap-2 text-xs font-medium transition-colors ${
                            !cat.isActive
                              ? "border-slate-200 bg-slate-50 text-slate-400"
                              : cat.showInSidebar !== false
                                ? "border-sky-300 bg-sky-50 text-sky-800 hover:bg-sky-100"
                                : "border-slate-300 bg-slate-100 text-slate-600 hover:bg-slate-200/80"
                          }`}
                        >
                          {isBusy ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <span
                              aria-hidden="true"
                              className={`inline-flex h-4 w-7 shrink-0 items-center rounded-full p-0.5 transition-colors ${
                                cat.isActive && cat.showInSidebar !== false
                                  ? "bg-sky-600"
                                  : "bg-slate-300"
                              }`}
                            >
                              <span
                                className={`h-3 w-3 rounded-full bg-white shadow-2xs transition-transform ${
                                  cat.isActive && cat.showInSidebar !== false
                                    ? "translate-x-3"
                                    : "translate-x-0"
                                }`}
                              />
                            </span>
                          )}
                          <span>
                            {!cat.isActive || cat.showInSidebar === false
                              ? "Sidebar: Đã tắt"
                              : "Sidebar: Đang bật"}
                          </span>
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          disabled={isBusy}
                          onClick={() => handleToggleActive(cat)}
                          title={cat.isActive ? "Ẩn toàn bộ danh mục" : "Kích hoạt lại danh mục"}
                        >
                          {cat.isActive ? (
                            <Eye className="h-3.5 w-3.5 text-emerald-600" />
                          ) : (
                            <EyeOff className="h-3.5 w-3.5 text-slate-400" />
                          )}
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setEditingId(cat._id);
                            setEditName(cat.name);
                            setEditSlug(cat.slug);
                            setEditDescription(cat.description || "");
                            setEditColorToken(cat.colorToken || "blue");
                            setEditShowInSidebar(cat.showInSidebar !== false);
                          }}
                          title="Chỉnh sửa danh mục"
                        >
                          <Edit className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          disabled={isBusy}
                          onClick={() => handleDelete(cat)}
                          className="text-rose-600 border-rose-200 hover:bg-rose-50"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}

