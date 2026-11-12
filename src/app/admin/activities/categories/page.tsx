"use client";

import { useEffect, useState } from "react";
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
  FolderKanban,
  Loader2,
  Plus,
  Save,
  Trash2,
  X,
} from "lucide-react";
import { fetchWithAuth } from "@/components/providers/AuthProvider";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ACTIVITY_CATEGORY_COLOR_TOKENS } from "@/constants";
import {
  ACTIVITY_CATEGORY_COLOR_MAP,
  getCategoryColorClasses,
} from "@/lib/activity-utils";
import { slugifyVietnamese } from "@/lib/orientation-utils";
import type { IActivityCategoryDTO } from "@/types";

export default function AdminActivityCategoriesPage() {
  const [categories, setCategories] = useState<IActivityCategoryDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  // Create form state
  const [newName, setNewName] = useState("");
  const [newSlug, setNewSlug] = useState("");
  const [newSlugTouched, setNewSlugTouched] = useState(false);
  const [newDescription, setNewDescription] = useState("");
  const [newColorToken, setNewColorToken] = useState<string>("blue");

  // Edit row state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editSlug, setEditSlug] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editColorToken, setEditColorToken] = useState<string>("blue");

  const [feedback, setFeedback] = useState<{
    type: "error" | "success";
    text: string;
  } | null>(null);

  const notifySidebarUpdated = () => {
    window.dispatchEvent(new Event("unera:activity-categories-updated"));
  };

  const loadCategories = async () => {
    setLoading(true);
    try {
      const res = await fetchWithAuth("/api/admin/activities/categories", {
        cache: "no-store",
      });
      const data = await res.json();
      if (res.ok && Array.isArray(data.categories)) {
        setCategories(data.categories);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    const init = async () => {
      try {
        const res = await fetchWithAuth("/api/admin/activities/categories", {
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
    setFeedback(null);
    if (newName.trim().length < 2) {
      setFeedback({
        type: "error",
        text: "Tên danh mục phải có ít nhất 2 ký tự.",
      });
      return;
    }

    setCreating(true);
    try {
      const res = await fetchWithAuth("/api/admin/activities/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newName.trim(),
          slug: newSlug.trim() || undefined,
          description: newDescription.trim(),
          colorToken: newColorToken,
          order: categories.length + 1,
          isActive: true,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setFeedback({
          type: "error",
          text: data.error || "Không thể tạo danh mục mới.",
        });
        return;
      }

      setNewName("");
      setNewSlug("");
      setNewSlugTouched(false);
      setNewDescription("");
      setFeedback({ type: "success", text: data.message });
      await loadCategories();
      notifySidebarUpdated();
    } finally {
      setCreating(false);
    }
  };

  const startEditing = (cat: IActivityCategoryDTO) => {
    setEditingId(cat._id);
    setEditName(cat.name);
    setEditSlug(cat.slug);
    setEditDescription(cat.description || "");
    setEditColorToken(cat.colorToken || "blue");
    setFeedback(null);
  };

  const handleSaveEdit = async (id: string) => {
    setBusyId(id);
    setFeedback(null);
    try {
      const res = await fetchWithAuth(`/api/admin/activities/categories/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editName.trim(),
          slug: editSlug.trim() || undefined,
          description: editDescription.trim(),
          colorToken: editColorToken,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setFeedback({
          type: "error",
          text: data.error || "Không thể cập nhật danh mục.",
        });
        return;
      }

      setEditingId(null);
      setFeedback({ type: "success", text: data.message });
      await loadCategories();
      notifySidebarUpdated();
    } finally {
      setBusyId(null);
    }
  };

  const handleToggleActive = async (cat: IActivityCategoryDTO) => {
    setBusyId(cat._id);
    setFeedback(null);
    try {
      const res = await fetchWithAuth(
        `/api/admin/activities/categories/${cat._id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ isActive: !cat.isActive }),
        }
      );
      const data = await res.json();
      if (res.ok) {
        setFeedback({
          type: "success",
          text: cat.isActive
            ? `Đã ẩn danh mục "${cat.name}" khỏi thanh điều hướng`
            : `Đã kích hoạt hiển thị danh mục "${cat.name}"`,
        });
        await loadCategories();
        notifySidebarUpdated();
      } else {
        setFeedback({ type: "error", text: data.error });
      }
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

    try {
      await fetchWithAuth("/api/admin/activities/categories", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderedIds: reordered.map((c) => c._id),
        }),
      });
      notifySidebarUpdated();
    } catch {
      await loadCategories();
    }
  };

  const handleDelete = async (cat: IActivityCategoryDTO) => {
    if (
      !window.confirm(
        `Bạn có chắc muốn xóa danh mục "${cat.name}"? Hành động này chỉ thực hiện được khi không còn hoạt động nào thuộc danh mục này.`
      )
    ) {
      return;
    }

    setBusyId(cat._id);
    setFeedback(null);
    try {
      const res = await fetchWithAuth(
        `/api/admin/activities/categories/${cat._id}`,
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

      setFeedback({ type: "success", text: data.message });
      await loadCategories();
      notifySidebarUpdated();
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="mx-auto w-full max-w-6xl px-6 sm:px-8 py-6 space-y-6">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <FolderKanban className="h-5 w-5 text-blue-600" />
            <h1 className="text-xl font-bold text-slate-900">
              Danh mục Hoạt động Sinh viên
            </h1>
          </div>
          <p className="text-xs text-slate-500">
            Tùy chỉnh danh mục hiển thị động trên Sidebar sinh viên và bộ lọc trang Hoạt động.
          </p>
        </div>

        <Link
          href="/admin/activities"
          className={buttonVariants({
            variant: "outline",
            size: "sm",
            className: "rounded-xl self-start sm:self-auto",
          })}
        >
          <ArrowLeft className="mr-1.5 h-4 w-4" />
          Quay lại danh sách hoạt động
        </Link>
      </div>

      {feedback && (
        <div
          className={`flex items-center gap-2 rounded-xl border px-4 py-3 text-xs font-medium ${
            feedback.type === "error"
              ? "border-red-200 bg-red-50 text-red-700"
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

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Create Category Form */}
        <Card className="lg:col-span-4 rounded-2xl border-slate-200/90 bg-white shadow-xs">
          <CardHeader className="pb-3 border-b border-slate-100">
            <CardTitle className="text-sm font-bold text-slate-900">
              Thêm danh mục mới
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5">
            <form onSubmit={handleCreate} className="space-y-3.5">
              <div className="space-y-1">
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
                  placeholder="VD: Tình nguyện & Cộng đồng"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">
                  Slug URL
                </label>
                <Input
                  value={newSlug}
                  onChange={(e) => {
                    setNewSlugTouched(true);
                    setNewSlug(e.target.value);
                  }}
                  placeholder="tinh-nguyen-cong-dong"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">
                  Màu sắc nhãn
                </label>
                <select
                  value={newColorToken}
                  onChange={(e) => setNewColorToken(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700"
                >
                  {ACTIVITY_CATEGORY_COLOR_TOKENS.map((token) => (
                    <option key={token} value={token}>
                      {ACTIVITY_CATEGORY_COLOR_MAP[token]?.label || token}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">
                  Mô tả ngắn
                </label>
                <textarea
                  rows={3}
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Mô tả nhóm hoạt động..."
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-800 focus:border-blue-500 focus:outline-none"
                />
              </div>

              <Button
                type="submit"
                disabled={creating}
                className="w-full rounded-xl bg-blue-600 hover:bg-blue-700"
              >
                {creating ? (
                  <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="mr-1.5 h-4 w-4" />
                )}
                Thêm danh mục
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Category List */}
        <Card className="lg:col-span-8 rounded-2xl border-slate-200/90 bg-white shadow-xs overflow-hidden">
          <CardHeader className="pb-3 border-b border-slate-100">
            <CardTitle className="text-sm font-bold text-slate-900">
              Danh sách danh mục hiện có ({categories.length})
            </CardTitle>
          </CardHeader>

          {loading ? (
            <div className="flex h-48 items-center justify-center">
              <Loader2 className="h-7 w-7 animate-spin text-blue-600" />
            </div>
          ) : categories.length === 0 ? (
            <div className="p-10 text-center text-xs text-slate-500">
              Chưa có danh mục hoạt động nào.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {categories.map((cat, idx) => {
                const isEditing = editingId === cat._id;
                const isBusy = busyId === cat._id;
                const colors = getCategoryColorClasses(cat.colorToken);

                return (
                  <div
                    key={cat._id}
                    className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/70"
                  >
                    {isEditing ? (
                      <div className="flex-1 space-y-2.5">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                          <Input
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            placeholder="Tên danh mục"
                          />
                          <Input
                            value={editSlug}
                            onChange={(e) => setEditSlug(e.target.value)}
                            placeholder="Slug"
                          />
                          <select
                            value={editColorToken}
                            onChange={(e) => setEditColorToken(e.target.value)}
                            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium"
                          >
                            {ACTIVITY_CATEGORY_COLOR_TOKENS.map((token) => (
                              <option key={token} value={token}>
                                {ACTIVITY_CATEGORY_COLOR_MAP[token]?.label ||
                                  token}
                              </option>
                            ))}
                          </select>
                        </div>
                        <Input
                          value={editDescription}
                          onChange={(e) => setEditDescription(e.target.value)}
                          placeholder="Mô tả ngắn"
                        />
                        <div className="flex items-center gap-2">
                          <Button
                            type="button"
                            size="sm"
                            disabled={isBusy}
                            onClick={() => handleSaveEdit(cat._id)}
                            className="rounded-lg bg-blue-600"
                          >
                            <Save className="mr-1 h-3.5 w-3.5" />
                            Lưu
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => setEditingId(null)}
                            className="rounded-lg"
                          >
                            <X className="mr-1 h-3.5 w-3.5" />
                            Hủy
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="space-y-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span
                              className={`rounded-md border px-2.5 py-0.5 text-xs font-bold ${colors.pillClass}`}
                            >
                              {cat.name}
                            </span>
                            <span className="text-[11px] text-slate-400">
                              /{cat.slug}
                            </span>
                            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                              {cat.activityCount || 0} hoạt động
                            </span>
                            {!cat.isActive && (
                              <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-bold text-slate-600">
                                Đang ẩn
                              </span>
                            )}
                          </div>
                          {cat.description && (
                            <p className="text-xs text-slate-500">
                              {cat.description}
                            </p>
                          )}
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={idx === 0}
                            onClick={() => handleMove(idx, -1)}
                            className="h-8 w-8 p-0 rounded-lg"
                            title="Lên trên"
                          >
                            <ArrowUp className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={idx === categories.length - 1}
                            onClick={() => handleMove(idx, 1)}
                            className="h-8 w-8 p-0 rounded-lg"
                            title="Xuống dưới"
                          >
                            <ArrowDown className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={isBusy}
                            onClick={() => handleToggleActive(cat)}
                            className="h-8 w-8 p-0 rounded-lg"
                            title={cat.isActive ? "Ẩn danh mục" : "Hiện danh mục"}
                          >
                            {cat.isActive ? (
                              <Eye className="h-3.5 w-3.5 text-emerald-600" />
                            ) : (
                              <EyeOff className="h-3.5 w-3.5 text-slate-400" />
                            )}
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => startEditing(cat)}
                            className="h-8 rounded-lg px-2.5 text-xs"
                          >
                            <Edit3 className="mr-1 h-3.5 w-3.5" />
                            Sửa
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={isBusy}
                            onClick={() => handleDelete(cat)}
                            className="h-8 w-8 p-0 rounded-lg text-red-600 border-red-200 hover:bg-red-50"
                            title="Xóa danh mục"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
