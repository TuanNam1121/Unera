"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  CheckCircle2,
  ClipboardList,
  Edit3,
  Eye,
  GitBranch,
  Loader2,
  Plus,
  Power,
  PowerOff,
  Save,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import { QuestionEditorModal } from "@/components/admin/QuestionEditorModal";
import { fetchWithAuth } from "@/components/providers/AuthProvider";
import type { IAssessmentQuestionDTO, IQuestionnaireDTO } from "@/types";

const TYPE_BADGE: Record<string, { label: string; cls: string }> = {
  SINGLE_CHOICE: {
    label: "Chọn 1",
    cls: "bg-blue-50 text-blue-700 border-blue-200",
  },
  MULTIPLE_CHOICE: {
    label: "Chọn nhiều",
    cls: "bg-indigo-50 text-indigo-700 border-indigo-200",
  },
  SCALE: {
    label: "Thang điểm",
    cls: "bg-amber-50 text-amber-700 border-amber-200",
  },
  TEXT: {
    label: "Tự luận",
    cls: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
};

export default function AdminQuizBuilderPage() {
  const [questionnaires, setQuestionnaires] = useState<IQuestionnaireDTO[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activeQuestionnaire, setActiveQuestionnaire] =
    useState<IQuestionnaireDTO | null>(null);
  const [questions, setQuestions] = useState<IAssessmentQuestionDTO[]>([]);

  const [loadingList, setLoadingList] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [banner, setBanner] = useState<{
    type: "success" | "error" | "warning";
    text: string;
  } | null>(null);

  // Create Questionnaire modal
  const [createOpen, setCreateOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [creatingSet, setCreatingSet] = useState(false);

  // Edit Questionnaire metadata state
  const [metaTitle, setMetaTitle] = useState("");
  const [metaDesc, setMetaDesc] = useState("");
  const [savingMeta, setSavingMeta] = useState(false);

  // Question Editor Modal
  const [qModalOpen, setQModalOpen] = useState(false);
  const [qModalMode, setQModalMode] = useState<"create" | "edit">("create");
  const [editingQuestion, setEditingQuestion] =
    useState<IAssessmentQuestionDTO | null>(null);

  const [confirmDeleteQId, setConfirmDeleteQId] = useState<string | null>(null);
  const [confirmDeleteSetId, setConfirmDeleteSetId] = useState<string | null>(
    null
  );
  const [busyAction, setBusyAction] = useState(false);

  const loadQuestionnaires = useCallback(async (preferredId?: string) => {
    try {
      const res = await fetchWithAuth("/api/admin/questionnaires", {
        cache: "no-store",
      });
      const data = await res.json();
      if (!res.ok) {
        setBanner({
          type: "error",
          text: data.error || "Không thể tải danh sách bộ câu hỏi.",
        });
        return;
      }
      const list: IQuestionnaireDTO[] = data.questionnaires || [];
      setQuestionnaires(list);
      setSelectedId((prev) => {
        if (preferredId && list.some((q) => q._id === preferredId)) {
          return preferredId;
        }
        if (prev && list.some((q) => q._id === prev)) {
          return prev;
        }
        const active = list.find((q) => q.isActive);
        return active?._id || list[0]?._id || null;
      });
    } catch {
      setBanner({
        type: "error",
        text: "Lỗi kết nối máy chủ khi tải danh sách bộ câu hỏi.",
      });
    } finally {
      setLoadingList(false);
    }
  }, []);

  const loadDetail = useCallback(async (id: string) => {
    try {
      const res = await fetchWithAuth(`/api/admin/questionnaires/${id}`, {
        cache: "no-store",
      });
      const data = await res.json();
      if (!res.ok) {
        setBanner({
          type: "error",
          text: data.error || "Không thể tải chi tiết bộ câu hỏi.",
        });
        return;
      }
      setActiveQuestionnaire(data.questionnaire);
      setMetaTitle(data.questionnaire?.title || "");
      setMetaDesc(data.questionnaire?.description || "");
      setQuestions(
        [...(data.questions || [])].sort(
          (a: IAssessmentQuestionDTO, b: IAssessmentQuestionDTO) =>
            a.order - b.order
        )
      );
    } catch {
      setBanner({
        type: "error",
        text: "Lỗi kết nối máy chủ khi tải câu hỏi.",
      });
    } finally {
      setLoadingDetail(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await fetchWithAuth("/api/admin/questionnaires", {
          cache: "no-store",
        });
        const data = await res.json();
        if (!active) return;
        if (!res.ok) {
          setBanner({
            type: "error",
            text: data.error || "Không thể tải danh sách bộ câu hỏi.",
          });
          return;
        }
        const list: IQuestionnaireDTO[] = data.questionnaires || [];
        setQuestionnaires(list);
        const initialId =
          list.find((q) => q.isActive)?._id || list[0]?._id || null;
        if (initialId) {
          setLoadingDetail(true);
          setSelectedId(initialId);
        }
      } catch {
        if (active) {
          setBanner({
            type: "error",
            text: "Lỗi kết nối máy chủ khi tải danh sách bộ câu hỏi.",
          });
        }
      } finally {
        if (active) setLoadingList(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!selectedId) return;
    let active = true;
    (async () => {
      try {
        const res = await fetchWithAuth(
          `/api/admin/questionnaires/${selectedId}`,
          { cache: "no-store" }
        );
        const data = await res.json();
        if (!active) return;
        if (!res.ok) {
          setBanner({
            type: "error",
            text: data.error || "Không thể tải chi tiết bộ câu hỏi.",
          });
          return;
        }
        setActiveQuestionnaire(data.questionnaire);
        setMetaTitle(data.questionnaire?.title || "");
        setMetaDesc(data.questionnaire?.description || "");
        setQuestions(
          [...(data.questions || [])].sort(
            (a: IAssessmentQuestionDTO, b: IAssessmentQuestionDTO) =>
              a.order - b.order
          )
        );
      } catch {
        if (active) {
          setBanner({
            type: "error",
            text: "Lỗi kết nối máy chủ khi tải câu hỏi.",
          });
        }
      } finally {
        if (active) setLoadingDetail(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [selectedId]);

  const handleSelectQuestionnaire = (id: string) => {
    setLoadingDetail(true);
    setSelectedId(id);
  };

  const questionCodeById = useMemo(() => {
    const map = new Map<string, string>();
    questions.forEach((q) => map.set(q._id, q.code));
    return map;
  }, [questions]);

  const handleCreateQuestionnaire = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    setCreatingSet(true);
    try {
      const res = await fetchWithAuth("/api/admin/questionnaires", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newTitle.trim(),
          description: newDesc.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.questionnaire) {
        setBanner({
          type: "error",
          text: data.error || "Không thể tạo bộ câu hỏi mới.",
        });
        return;
      }
      setCreateOpen(false);
      setNewTitle("");
      setNewDesc("");
      setBanner({
        type: "success",
        text: `Đã tạo bộ câu hỏi "${data.questionnaire.title}". Hãy thêm câu hỏi trước khi kích hoạt.`,
      });
      await loadQuestionnaires(data.questionnaire._id);
    } catch {
      setBanner({ type: "error", text: "Lỗi mạng khi tạo bộ câu hỏi." });
    } finally {
      setCreatingSet(false);
    }
  };

  const handleSaveMeta = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeQuestionnaire) return;
    setSavingMeta(true);
    try {
      const res = await fetchWithAuth(
        `/api/admin/questionnaires/${activeQuestionnaire._id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: metaTitle.trim(),
            description: metaDesc.trim(),
          }),
        }
      );
      const data = await res.json();
      if (!res.ok) {
        setBanner({
          type: "error",
          text: data.error || "Không thể cập nhật thông tin bộ câu hỏi.",
        });
        return;
      }
      setActiveQuestionnaire(data.questionnaire);
      setBanner({
        type: "success",
        text: "Đã cập nhật thông tin bộ câu hỏi.",
      });
      loadQuestionnaires(activeQuestionnaire._id);
    } catch {
      setBanner({ type: "error", text: "Lỗi kết nối máy chủ." });
    } finally {
      setSavingMeta(false);
    }
  };

  const handleToggleActivate = async (target: IQuestionnaireDTO) => {
    setBusyAction(true);
    try {
      const res = await fetchWithAuth(
        `/api/admin/questionnaires/${target._id}/activate`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ active: !target.isActive }),
        }
      );
      const data = await res.json();
      if (!res.ok) {
        setBanner({
          type: "error",
          text: data.error || "Không thể thay đổi trạng thái kích hoạt.",
        });
        return;
      }
      setBanner({
        type: "success",
        text: !target.isActive
          ? `Đã kích hoạt bộ câu hỏi "${target.title}".`
          : `Đã tắt kích hoạt bộ câu hỏi "${target.title}".`,
      });
      await loadQuestionnaires(target._id);
      if (selectedId === target._id) {
        await loadDetail(target._id);
      }
    } catch {
      setBanner({ type: "error", text: "Lỗi kết nối máy chủ." });
    } finally {
      setBusyAction(false);
    }
  };

  const handleDeleteQuestionnaire = async (id: string) => {
    setBusyAction(true);
    try {
      const res = await fetchWithAuth(`/api/admin/questionnaires/${id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) {
        setBanner({
          type: "error",
          text: data.error || "Không thể xóa bộ câu hỏi.",
        });
        return;
      }
      setConfirmDeleteSetId(null);
      if (selectedId === id) {
        setActiveQuestionnaire(null);
        setQuestions([]);
      }
      setBanner({
        type: "success",
        text: data.message || "Đã xóa bộ câu hỏi.",
      });
      await loadQuestionnaires();
    } catch {
      setBanner({ type: "error", text: "Lỗi mạng khi xóa bộ câu hỏi." });
    } finally {
      setBusyAction(false);
    }
  };

  const handleReorderQuestions = async (
    index: number,
    direction: "up" | "down"
  ) => {
    if (!activeQuestionnaire) return;
    const targetIdx = direction === "up" ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= questions.length) return;

    const next = [...questions];
    const [moved] = next.splice(index, 1);
    next.splice(targetIdx, 0, moved);

    setBusyAction(true);
    try {
      const res = await fetchWithAuth(
        `/api/admin/questionnaires/${activeQuestionnaire._id}/questions/reorder`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            orderedQuestionIds: next.map((q) => q._id),
          }),
        }
      );
      const data = await res.json();
      if (!res.ok) {
        setBanner({
          type: "error",
          text:
            data.error ||
            "Không thể đổi thứ tự vì vi phạm quy tắc điều kiện đứng trước.",
        });
        return;
      }
      setQuestions(data.questions || next);
      setBanner({
        type: "success",
        text: "Đã cập nhật thứ tự câu hỏi.",
      });
    } catch {
      setBanner({ type: "error", text: "Lỗi kết nối khi đổi thứ tự câu hỏi." });
    } finally {
      setBusyAction(false);
    }
  };

  const handleDeleteQuestion = async (questionId: string) => {
    if (!activeQuestionnaire) return;
    setBusyAction(true);
    try {
      const res = await fetchWithAuth(`/api/admin/questions/${questionId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) {
        setBanner({
          type: "error",
          text: data.error || "Không thể xóa câu hỏi.",
        });
        return;
      }
      setConfirmDeleteQId(null);
      const hasAffected =
        Array.isArray(data.affectedCodes) && data.affectedCodes.length > 0;
      setBanner({
        type: hasAffected ? "warning" : "success",
        text: data.message || "Đã xóa câu hỏi.",
      });
      await Promise.all([
        loadDetail(activeQuestionnaire._id),
        loadQuestionnaires(activeQuestionnaire._id),
      ]);
    } catch {
      setBanner({ type: "error", text: "Lỗi mạng khi xóa câu hỏi." });
    } finally {
      setBusyAction(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
      <header className="flex flex-col justify-between gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-xs sm:flex-row sm:items-center">
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-[#102C8A]">
            <ClipboardList className="h-3.5 w-3.5" />
            Quản trị Đánh giá Định hướng Động (Module 08)
          </div>
          <h1 className="mt-2 text-2xl font-bold text-slate-900">
            Bộ câu hỏi & Logic phân nhánh Onboarding
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Thiết kế câu hỏi khảo sát động với 4 định dạng, quy tắc điều kiện
            hiển thị (AND/OR), kiểm tra chu trình và chế độ xem trước trực tiếp.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            href="/admin/ai-prompts"
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-[#102C8A]/40 hover:text-[#102C8A]"
          >
            <Sparkles className="h-4 w-4" />
            Cấu hình System Prompt AI
          </Link>
          <button
            type="button"
            onClick={() => setCreateOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-[#102C8A] px-4 py-2 text-sm font-semibold text-white shadow-xs transition hover:bg-[#0B2066]"
          >
            <Plus className="h-4 w-4" />
            Tạo bộ câu hỏi mới
          </button>
        </div>
      </header>

      {banner && (
        <div
          className={`flex items-center justify-between rounded-2xl border px-4 py-3 text-sm font-medium ${
            banner.type === "error"
              ? "border-rose-200 bg-rose-50 text-rose-800"
              : banner.type === "warning"
                ? "border-amber-200 bg-amber-50 text-amber-900"
                : "border-emerald-200 bg-emerald-50 text-emerald-800"
          }`}
        >
          <span>{banner.text}</span>
          <button
            type="button"
            onClick={() => setBanner(null)}
            className="rounded-lg p-1 hover:bg-black/5"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left: Questionnaire List */}
        <aside className="space-y-3 lg:col-span-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
            <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-600">
              Danh sách bộ câu hỏi ({questionnaires.length})
            </h2>

            {loadingList ? (
              <div className="flex items-center justify-center py-10">
                <Loader2 className="h-6 w-6 animate-spin text-[#102C8A]" />
              </div>
            ) : questionnaires.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-200 p-6 text-center text-sm text-slate-500">
                Chưa có bộ câu hỏi nào. Bấm &ldquo;Tạo bộ câu hỏi mới&rdquo; để
                bắt đầu.
              </div>
            ) : (
              <div className="space-y-2.5">
                {questionnaires.map((item) => {
                  const isSelected = selectedId === item._id;
                  return (
                    <div
                      key={item._id}
                      className={`rounded-2xl border p-3.5 transition ${
                        isSelected
                          ? "border-[#102C8A] bg-blue-50/40 ring-2 ring-[#102C8A]/10"
                          : "border-slate-200 bg-white hover:border-slate-300"
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => handleSelectQuestionnaire(item._id)}
                        className="w-full text-left"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          {item.isActive ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700">
                              <CheckCircle2 className="h-3 w-3" />
                              Đang kích hoạt
                            </span>
                          ) : (
                            <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-medium text-slate-600">
                              Nháp / Tắt
                            </span>
                          )}
                          <span className="text-xs font-medium text-slate-500">
                            {item.questionCount ?? 0} câu · {item.submissionCount ?? 0}{" "}
                            lượt nộp
                          </span>
                        </div>
                        <h3 className="mt-2 font-bold text-slate-900">
                          {item.title}
                        </h3>
                        {item.description && (
                          <p className="mt-0.5 line-clamp-2 text-xs text-slate-600">
                            {item.description}
                          </p>
                        )}
                      </button>

                      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-2.5">
                        <button
                          type="button"
                          disabled={busyAction}
                          onClick={() => handleToggleActivate(item)}
                          className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                            item.isActive
                              ? "bg-amber-50 text-amber-800 hover:bg-amber-100"
                              : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                          }`}
                        >
                          {item.isActive ? (
                            <>
                              <PowerOff className="h-3.5 w-3.5" />
                              Tắt kích hoạt
                            </>
                          ) : (
                            <>
                              <Power className="h-3.5 w-3.5" />
                              Kích hoạt
                            </>
                          )}
                        </button>

                        <div className="flex items-center gap-1.5">
                          <Link
                            href={`/admin/quiz/${item._id}/preview`}
                            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 hover:text-[#102C8A]"
                          >
                            <Eye className="h-3.5 w-3.5" />
                            Xem trước
                          </Link>

                          {confirmDeleteSetId === item._id ? (
                            <div className="inline-flex items-center gap-1 rounded-lg border border-rose-200 bg-rose-50 px-2 py-1 text-xs">
                              <button
                                type="button"
                                disabled={busyAction}
                                onClick={() =>
                                  handleDeleteQuestionnaire(item._id)
                                }
                                className="font-semibold text-rose-700"
                              >
                                Xóa
                              </button>
                              <span>/</span>
                              <button
                                type="button"
                                onClick={() => setConfirmDeleteSetId(null)}
                                className="text-slate-600"
                              >
                                Hủy
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteSetId(item._id)}
                              title="Xóa bộ câu hỏi"
                              className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </aside>

        {/* Right: Active Questionnaire Metadata & Questions Builder */}
        <section className="space-y-5 lg:col-span-8">
          {!activeQuestionnaire ? (
            <div className="rounded-3xl border border-slate-200 bg-white p-12 text-center text-sm text-slate-500">
              Chọn một bộ câu hỏi bên trái để chỉnh sửa nội dung và điều kiện
              phân nhánh.
            </div>
          ) : loadingDetail ? (
            <div className="flex min-h-[320px] items-center justify-center rounded-3xl border border-slate-200 bg-white">
              <Loader2 className="h-8 w-8 animate-spin text-[#102C8A]" />
            </div>
          ) : (
            <>
              {/* Metadata Form (PA14) */}
              <form
                onSubmit={handleSaveMeta}
                className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs"
              >
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">
                      Thông tin bộ câu hỏi (v{activeQuestionnaire.version})
                    </h2>
                    <p className="text-xs text-slate-500">
                      Đã ghi nhận {activeQuestionnaire.submissionCount ?? 0}{" "}
                      lượt sinh viên hoàn thành.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/admin/quiz/${activeQuestionnaire._id}/preview`}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-[#102C8A]/25 bg-blue-50/50 px-3.5 py-2 text-xs font-semibold text-[#102C8A] hover:bg-blue-100/60"
                    >
                      <Eye className="h-4 w-4" />
                      Chạy thử Xem trước (Preview)
                    </Link>
                    <button
                      type="submit"
                      disabled={savingMeta}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-3.5 py-2 text-xs font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
                    >
                      {savingMeta ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Save className="h-3.5 w-3.5" />
                      )}
                      Lưu thông tin
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-600">
                      Tiêu đề bộ câu hỏi
                    </label>
                    <input
                      type="text"
                      value={metaTitle}
                      onChange={(e) => setMetaTitle(e.target.value)}
                      required
                      className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm text-slate-900 outline-hidden focus:border-[#102C8A]"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-600">
                      Mô tả hướng dẫn sinh viên
                    </label>
                    <textarea
                      rows={2}
                      value={metaDesc}
                      onChange={(e) => setMetaDesc(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm text-slate-900 outline-hidden focus:border-[#102C8A]"
                    />
                  </div>
                </div>
              </form>

              {/* Questions Builder List (PA17 - PA24) */}
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs">
                <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">
                      Danh sách câu hỏi ({questions.length})
                    </h2>
                    <p className="text-xs text-slate-500">
                      Sinh viên sẽ trả lời tuần tự từ #1 trở đi; câu có điều
                      kiện chỉ xuất hiện khi câu trước thỏa quy tắc.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setQModalMode("create");
                      setEditingQuestion(null);
                      setQModalOpen(true);
                    }}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-[#102C8A] px-4 py-2 text-sm font-semibold text-white shadow-xs transition hover:bg-[#0B2066]"
                  >
                    <Plus className="h-4 w-4" />
                    Thêm câu hỏi
                  </button>
                </div>

                {questions.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/70 p-10 text-center">
                    <AlertTriangle className="mx-auto h-8 w-8 text-amber-500" />
                    <p className="mt-2 text-sm font-semibold text-slate-800">
                      Bộ câu hỏi chưa có câu hỏi nào
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      Không thể kích hoạt bộ câu hỏi trống. Hãy bấm &ldquo;Thêm
                      câu hỏi&rdquo; để khởi tạo.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {questions.map((q, idx) => {
                      const badge = TYPE_BADGE[q.questionType] || {
                        label: q.questionType,
                        cls: "bg-slate-100 text-slate-700 border-slate-200",
                      };
                      const hasCond = Boolean(
                        q.conditionalLogic?.enabled &&
                          q.conditionalLogic.rules.length > 0
                      );

                      return (
                        <div
                          key={q._id}
                          className="rounded-2xl border border-slate-200 bg-white p-4 transition hover:border-slate-300"
                        >
                          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                            <div className="min-w-0 flex-1 space-y-1.5">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="rounded-lg bg-slate-900 px-2 py-0.5 text-xs font-bold text-white">
                                  #{q.order}
                                </span>
                                <span className="rounded-md bg-slate-100 px-2 py-0.5 font-mono text-xs font-semibold text-slate-700">
                                  {q.code}
                                </span>
                                <span
                                  className={`rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${badge.cls}`}
                                >
                                  {badge.label}
                                </span>
                                {q.isRequired ? (
                                  <span className="rounded-full bg-rose-50 px-2 py-0.5 text-[11px] font-medium text-rose-700">
                                    Bắt buộc
                                  </span>
                                ) : (
                                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] text-slate-500">
                                    Tùy chọn
                                  </span>
                                )}
                                {hasCond && (
                                  <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2.5 py-0.5 text-[11px] font-semibold text-indigo-700">
                                    <GitBranch className="h-3 w-3" />
                                    Có điều kiện ({q.conditionalLogic!.matchType})
                                  </span>
                                )}
                              </div>

                              <h3 className="text-sm font-bold text-slate-900 sm:text-base">
                                {q.questionText}
                              </h3>

                              {q.description && (
                                <p className="text-xs text-slate-500">
                                  {q.description}
                                </p>
                              )}

                              {q.options?.length > 0 && (
                                <div className="flex flex-wrap gap-1.5 pt-1">
                                  {q.options.map((opt) => (
                                    <span
                                      key={opt.id || opt.value}
                                      className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] text-slate-700"
                                    >
                                      {opt.label}{" "}
                                      <span className="font-mono text-slate-400">
                                        ({opt.value})
                                      </span>
                                    </span>
                                  ))}
                                </div>
                              )}

                              {hasCond && (
                                <div className="mt-2 rounded-xl border border-indigo-100 bg-indigo-50/50 px-3 py-2 text-xs text-indigo-900">
                                  <span className="font-semibold">
                                    Chỉ hiện khi{" "}
                                    {q.conditionalLogic!.matchType === "ALL"
                                      ? "TẤT CẢ"
                                      : "MỘT TRONG CÁC"}{" "}
                                    điều kiện đúng:{" "}
                                  </span>
                                  {q.conditionalLogic!.rules
                                    .map(
                                      (r) =>
                                        `[${questionCodeById.get(r.sourceQuestionId) || r.sourceQuestionId}] ${r.operator} "${r.value}"`
                                    )
                                    .join(" • ")}
                                </div>
                              )}
                            </div>

                            <div className="flex shrink-0 items-center gap-1.5">
                              <button
                                type="button"
                                disabled={idx === 0 || busyAction}
                                onClick={() =>
                                  handleReorderQuestions(idx, "up")
                                }
                                title="Đưa lên trước"
                                className="rounded-lg border border-slate-200 p-1.5 text-slate-500 hover:bg-slate-50 hover:text-slate-900 disabled:opacity-35"
                              >
                                <ArrowUp className="h-4 w-4" />
                              </button>
                              <button
                                type="button"
                                disabled={
                                  idx === questions.length - 1 || busyAction
                                }
                                onClick={() =>
                                  handleReorderQuestions(idx, "down")
                                }
                                title="Đưa xuống sau"
                                className="rounded-lg border border-slate-200 p-1.5 text-slate-500 hover:bg-slate-50 hover:text-slate-900 disabled:opacity-35"
                              >
                                <ArrowDown className="h-4 w-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setQModalMode("edit");
                                  setEditingQuestion(q);
                                  setQModalOpen(true);
                                }}
                                title="Chỉnh sửa câu hỏi"
                                className="rounded-lg border border-slate-200 p-1.5 text-slate-600 hover:border-[#102C8A]/40 hover:text-[#102C8A]"
                              >
                                <Edit3 className="h-4 w-4" />
                              </button>

                              {confirmDeleteQId === q._id ? (
                                <div className="inline-flex items-center gap-1 rounded-lg border border-rose-200 bg-rose-50 px-2 py-1 text-xs">
                                  <button
                                    type="button"
                                    disabled={busyAction}
                                    onClick={() => handleDeleteQuestion(q._id)}
                                    className="font-semibold text-rose-700"
                                  >
                                    Xác nhận xóa
                                  </button>
                                  <span>/</span>
                                  <button
                                    type="button"
                                    onClick={() => setConfirmDeleteQId(null)}
                                    className="text-slate-600"
                                  >
                                    Hủy
                                  </button>
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => setConfirmDeleteQId(q._id)}
                                  title="Xóa câu hỏi"
                                  className="rounded-lg border border-slate-200 p-1.5 text-slate-500 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          )}
        </section>
      </div>

      {/* Create Questionnaire Modal (PA13) */}
      {createOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
          aria-label="Tạo bộ câu hỏi mới"
        >
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <h2 className="text-lg font-bold text-slate-900">
                Tạo bộ câu hỏi mới
              </h2>
              <button
                type="button"
                onClick={() => setCreateOpen(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleCreateQuestionnaire} className="space-y-4 p-6">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Tên bộ câu hỏi <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="VD: Khảo sát định hướng Sinh viên Khóa 2026"
                  required
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-hidden focus:border-[#102C8A]"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Mô tả ngắn
                </label>
                <textarea
                  rows={3}
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="Mục đích hoặc đối tượng áp dụng..."
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-hidden focus:border-[#102C8A]"
                />
              </div>
              <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
                <button
                  type="button"
                  onClick={() => setCreateOpen(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={creatingSet}
                  className="inline-flex items-center gap-2 rounded-xl bg-[#102C8A] px-5 py-2 text-sm font-semibold text-white hover:bg-[#0B2066] disabled:opacity-60"
                >
                  {creatingSet && <Loader2 className="h-4 w-4 animate-spin" />}
                  Tạo bộ câu hỏi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Question Editor Modal (PA17 - PA24) */}
      {activeQuestionnaire && (
        <QuestionEditorModal
          open={qModalOpen}
          mode={qModalMode}
          questionnaireId={activeQuestionnaire._id}
          existingQuestions={questions}
          question={editingQuestion}
          onClose={() => setQModalOpen(false)}
          onSaved={async () => {
            setQModalOpen(false);
            setBanner({
              type: "success",
              text:
                qModalMode === "create"
                  ? "Đã thêm câu hỏi mới vào bộ câu hỏi."
                  : "Đã lưu thay đổi câu hỏi.",
            });
            await Promise.all([
              loadDetail(activeQuestionnaire._id),
              loadQuestionnaires(activeQuestionnaire._id),
            ]);
          }}
        />
      )}
    </div>
  );
}
