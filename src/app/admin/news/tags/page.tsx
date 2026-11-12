"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  CheckCircle2,
  Edit,
  Eye,
  EyeOff,
  GitMerge,
  Loader2,
  Plus,
  Save,
  Tag,
  Trash2,
  X,
} from "lucide-react";
import { fetchWithAuth } from "@/components/providers/AuthProvider";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { slugifyVietnamese } from "@/lib/orientation-utils";
import type { INewsTagDTO } from "@/types";

export default function AdminNewsTagsPage() {
  const [tags, setTags] = useState<INewsTagDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const [newName, setNewName] = useState("");
  const [newSlug, setNewSlug] = useState("");
  const [newSlugTouched, setNewSlugTouched] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editSlug, setEditSlug] = useState("");

  const [mergingId, setMergingId] = useState<string | null>(null);
  const [mergeTargetId, setMergeTargetId] = useState("");

  const [feedback, setFeedback] = useState<{
    type: "error" | "success";
    text: string;
  } | null>(null);

  const refreshTags = async () => {
    const res = await fetchWithAuth("/api/admin/news/tags", {
      cache: "no-store",
    });
    const data = await res.json();
    if (res.ok && Array.isArray(data.tags)) {
      setTags(data.tags);
    }
  };

  useEffect(() => {
    let active = true;
    const init = async () => {
      try {
        const res = await fetchWithAuth("/api/admin/news/tags", {
          cache: "no-store",
        });
        const data = await res.json();
        if (active && res.ok && Array.isArray(data.tags)) {
          setTags(data.tags);
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
    if (!newName.trim()) {
      setFeedback({ type: "error", text: "Vui lòng nhập tên tag." });
      return;
    }

    setCreating(true);
    setFeedback(null);
    try {
      const res = await fetchWithAuth("/api/admin/news/tags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newName.trim(),
          slug: newSlug.trim() || undefined,
          isActive: true,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setFeedback({ type: "error", text: data.error || "Không thể tạo tag." });
        return;
      }
      setNewName("");
      setNewSlug("");
      setNewSlugTouched(false);
      setFeedback({ type: "success", text: data.message || "Đã tạo tag mới." });
      await refreshTags();
    } finally {
      setCreating(false);
    }
  };

  const handleSaveEdit = async (id: string) => {
    if (!editName.trim()) return;
    setBusyId(id);
    setFeedback(null);
    try {
      const res = await fetchWithAuth(`/api/admin/news/tags/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editName.trim(),
          slug: editSlug.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setFeedback({ type: "error", text: data.error || "Không thể đổi tên tag." });
        return;
      }
      setEditingId(null);
      setFeedback({
        type: "success",
        text: data.message || "Đã cập nhật tag và đồng bộ trên các bài viết.",
      });
      await refreshTags();
    } finally {
      setBusyId(null);
    }
  };

  const handleMerge = async (sourceId: string) => {
    if (!mergeTargetId || mergeTargetId === sourceId) return;
    setBusyId(sourceId);
    setFeedback(null);
    try {
      const res = await fetchWithAuth(`/api/admin/news/tags/${sourceId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mergeTargetId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setFeedback({ type: "error", text: data.error || "Không thể gộp tag." });
        return;
      }
      setMergingId(null);
      setMergeTargetId("");
      setFeedback({ type: "success", text: data.message || "Đã gộp tag thành công." });
      await refreshTags();
    } finally {
      setBusyId(null);
    }
  };

  const handleToggleActive = async (tag: INewsTagDTO) => {
    setBusyId(tag._id);
    try {
      const res = await fetchWithAuth(`/api/admin/news/tags/${tag._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !tag.isActive }),
      });
      if (res.ok) await refreshTags();
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (tag: INewsTagDTO) => {
    if (
      !window.confirm(
        `Xác nhận xóa tag "${tag.name}"? Thao tác này sẽ gỡ tag khỏi ${tag.usageCount} bài viết đang dùng.`
      )
    ) {
      return;
    }
    setBusyId(tag._id);
    setFeedback(null);
    try {
      const res = await fetchWithAuth(`/api/admin/news/tags/${tag._id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) {
        setFeedback({ type: "error", text: data.error || "Không thể xóa tag." });
        return;
      }
      setFeedback({ type: "success", text: data.message || "Đã xóa tag." });
      await refreshTags();
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="w-full max-w-5xl px-6 sm:px-8 py-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
            Quản Lý Tag &amp; Chủ Đề Tin Tức
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Tạo mới, đổi tên đồng bộ, gộp các tag trùng nghĩa hoặc xóa tag khỏi hệ thống.
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

      {/* Create Tag */}
      <Card className="rounded-2xl border-slate-200/80 shadow-2xs bg-white">
        <CardContent className="p-5">
          <form onSubmit={handleCreate} className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
            <div className="sm:col-span-5 space-y-1">
              <label className="text-xs font-semibold text-slate-700">
                Tên Tag mới *
              </label>
              <Input
                value={newName}
                onChange={(e) => {
                  setNewName(e.target.value);
                  if (!newSlugTouched) {
                    setNewSlug(slugifyVietnamese(e.target.value));
                  }
                }}
                placeholder="VD: Học bổng Chính phủ"
                className="h-9 text-xs"
              />
            </div>

            <div className="sm:col-span-5 space-y-1">
              <label className="text-xs font-semibold text-slate-700">
                Slug URL
              </label>
              <Input
                value={newSlug}
                onChange={(e) => {
                  setNewSlugTouched(true);
                  setNewSlug(e.target.value.toLowerCase());
                }}
                placeholder="hoc-bong-chinh-phu"
                className="h-9 text-xs font-mono"
              />
            </div>

            <div className="sm:col-span-2">
              <Button type="submit" size="sm" disabled={creating} className="w-full h-9 gap-1.5">
                {creating ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4" />
                )}
                <span>Thêm tag</span>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Tags Table */}
      <Card className="rounded-2xl border-slate-200/80 shadow-2xs bg-white overflow-hidden">
        {loading ? (
          <div className="flex h-48 items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
          </div>
        ) : tags.length === 0 ? (
          <div className="p-10 text-center text-xs text-slate-400">
            Chưa có tag tin tức nào.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {tags.map((tag) => {
              const isEditing = editingId === tag._id;
              const isMerging = mergingId === tag._id;
              const isBusy = busyId === tag._id;

              return (
                <div
                  key={tag._id}
                  className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/60"
                >
                  {isEditing ? (
                    <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2">
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
                    </div>
                  ) : isMerging ? (
                    <div className="flex-1 flex flex-wrap items-center gap-2">
                      <span className="text-xs font-semibold text-slate-700">
                        Gộp <strong>#{tag.name}</strong> vào tag:
                      </span>
                      <select
                        value={mergeTargetId}
                        onChange={(e) => setMergeTargetId(e.target.value)}
                        className="h-9 rounded-xl border border-slate-200 bg-white px-2.5 text-xs"
                      >
                        <option value="">-- Chọn tag đích --</option>
                        {tags
                          .filter((other) => other._id !== tag._id)
                          .map((other) => (
                            <option key={other._id} value={other._id}>
                              #{other.name} ({other.usageCount} bài)
                            </option>
                          ))}
                      </select>
                      <Button
                        type="button"
                        size="sm"
                        disabled={!mergeTargetId || isBusy}
                        onClick={() => handleMerge(tag._id)}
                      >
                        Xác nhận gộp
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setMergingId(null);
                          setMergeTargetId("");
                        }}
                      >
                        Hủy
                      </Button>
                    </div>
                  ) : (
                    <div className="flex flex-wrap items-center gap-2.5">
                      <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-800">
                        <Tag className="h-3 w-3 text-blue-600" />
                        {tag.name}
                      </span>
                      <span className="text-[11px] font-mono text-slate-400">
                        /{tag.slug}
                      </span>
                      <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-semibold text-blue-700">
                        {tag.usageCount} bài viết
                      </span>
                      {!tag.isActive && (
                        <span className="rounded bg-slate-200 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                          Đang ẩn
                        </span>
                      )}
                    </div>
                  )}

                  {!isMerging && (
                    <div className="flex items-center gap-1.5 shrink-0">
                      {isEditing ? (
                        <>
                          <Button
                            type="button"
                            size="sm"
                            disabled={isBusy}
                            onClick={() => handleSaveEdit(tag._id)}
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
                            variant="outline"
                            disabled={isBusy}
                            onClick={() => handleToggleActive(tag)}
                            title={tag.isActive ? "Ẩn tag gợi ý" : "Hiện tag gợi ý"}
                          >
                            {tag.isActive ? (
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
                              setEditingId(tag._id);
                              setEditName(tag.name);
                              setEditSlug(tag.slug);
                            }}
                            title="Đổi tên tag"
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            disabled={tags.length < 2}
                            onClick={() => {
                              setMergingId(tag._id);
                              setMergeTargetId("");
                            }}
                            title="Gộp tag này vào tag khác"
                          >
                            <GitMerge className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            disabled={isBusy}
                            onClick={() => handleDelete(tag)}
                            className="text-rose-600 border-rose-200 hover:bg-rose-50"
                            title="Xóa tag"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}

