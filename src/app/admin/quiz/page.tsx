"use client";

import { useState, useEffect } from "react";
import {
  HelpCircle,
  Plus,
  Search,
  Filter,
  Edit3,
  Trash2,
  Sparkles,
  Award,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  XCircle,
  RotateCcw,
  BookOpen,
  Briefcase,
  FlaskConical,
  Rocket,
  Flame,
  X,
  Save,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface OptionScores {
  study_abroad: number;
  employment: number;
  research: number;
  startup: number;
  skills: number;
}

interface QuestionOption {
  id?: string;
  text: string;
  scores: OptionScores;
}

interface QuizQuestionItem {
  _id: string;
  question: string;
  category: string;
  order: number;
  isActive: boolean;
  options: QuestionOption[];
  createdAt: string;
}

const CATEGORY_MAP: Record<string, string> = {
  GOAL: "Mục tiêu tương lai",
  INTEREST: "Sở thích & Hứng thú",
  PREPARATION: "Kế hoạch chứng chỉ",
  WORK_STYLE: "Phong cách làm việc",
  VALUES: "Giá trị cá nhân",
  ACADEMIC: "Học thuật & Điểm số",
  SKILLS: "Kỹ năng nòng cốt",
  GENERAL: "Khảo sát chung",
};

const DEFAULT_SCORES: OptionScores = {
  study_abroad: 0,
  employment: 0,
  research: 0,
  startup: 0,
  skills: 0,
};

export default function AdminQuizPage() {
  const [questions, setQuestions] = useState<QuizQuestionItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Editor Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<QuizQuestionItem | null>(null);
  const [formQuestion, setFormQuestion] = useState("");
  const [formCategory, setFormCategory] = useState("GOAL");
  const [formOrder, setFormOrder] = useState<number>(1);
  const [formIsActive, setFormIsActive] = useState(true);
  const [formOptions, setFormOptions] = useState<QuestionOption[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  const fetchQuestions = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/admin/quiz/questions");
      const data = await res.json();
      if (data.questions) {
        setQuestions(data.questions);
      }
    } catch (err) {
      console.error("Failed to load quiz questions", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchQuestions();
  }, []);

  // Filter questions
  const filteredQuestions = questions.filter((q) => {
    const matchesSearch =
      q.question.toLowerCase().includes(search.toLowerCase()) ||
      q.options.some((o) => o.text.toLowerCase().includes(search.toLowerCase()));
    const matchesCategory =
      categoryFilter === "ALL" || q.category.toUpperCase() === categoryFilter.toUpperCase();
    const matchesStatus =
      statusFilter === "ALL" ||
      (statusFilter === "ACTIVE" && q.isActive) ||
      (statusFilter === "INACTIVE" && !q.isActive);
    return matchesSearch && matchesCategory && matchesStatus;
  });

  // Toggle active state
  const handleToggleActive = async (q: QuizQuestionItem) => {
    try {
      const res = await fetch(`/api/admin/quiz/questions/${q._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !q.isActive }),
      });
      if (res.ok) {
        setQuestions((prev) =>
          prev.map((item) =>
            item._id === q._id ? { ...item, isActive: !item.isActive } : item
          )
        );
      }
    } catch (err) {
      console.error("Failed to toggle status", err);
    }
  };

  // Open Create Modal
  const handleOpenCreate = () => {
    setEditingQuestion(null);
    setFormQuestion("");
    setFormCategory("GOAL");
    setFormOrder(questions.length + 1);
    setFormIsActive(true);
    setFormOptions([
      { id: "opt_1", text: "", scores: { ...DEFAULT_SCORES } },
      { id: "opt_2", text: "", scores: { ...DEFAULT_SCORES } },
      { id: "opt_3", text: "", scores: { ...DEFAULT_SCORES } },
    ]);
    setModalError(null);
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (q: QuizQuestionItem) => {
    setEditingQuestion(q);
    setFormQuestion(q.question);
    setFormCategory(q.category);
    setFormOrder(q.order);
    setFormIsActive(q.isActive);
    setFormOptions(
      q.options.map((opt) => ({
        id: opt.id,
        text: opt.text,
        scores: {
          study_abroad: opt.scores?.study_abroad || 0,
          employment: opt.scores?.employment || 0,
          research: opt.scores?.research || 0,
          startup: opt.scores?.startup || 0,
          skills: opt.scores?.skills || 0,
        },
      }))
    );
    setModalError(null);
    setIsModalOpen(true);
  };

  // Option row manipulations
  const handleAddOption = () => {
    setFormOptions((prev) => [
      ...prev,
      {
        id: `opt_${Date.now()}_${prev.length + 1}`,
        text: "",
        scores: { ...DEFAULT_SCORES },
      },
    ]);
  };

  const handleRemoveOption = (index: number) => {
    if (formOptions.length <= 2) {
      alert("Mỗi câu hỏi cần giữ tối thiểu 2 phương án lựa chọn.");
      return;
    }
    setFormOptions((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleOptionTextChange = (index: number, val: string) => {
    setFormOptions((prev) =>
      prev.map((opt, idx) => (idx === index ? { ...opt, text: val } : opt))
    );
  };

  const handleOptionScoreChange = (
    index: number,
    field: keyof OptionScores,
    val: number
  ) => {
    setFormOptions((prev) =>
      prev.map((opt, idx) =>
        idx === index
          ? {
              ...opt,
              scores: {
                ...opt.scores,
                [field]: isNaN(val) ? 0 : Math.max(0, val),
              },
            }
          : opt
      )
    );
  };

  // Save Modal
  const handleSaveModal = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError(null);

    if (!formQuestion.trim()) {
      setModalError("Vui lòng nhập nội dung câu hỏi.");
      return;
    }

    for (let i = 0; i < formOptions.length; i++) {
      if (!formOptions[i].text.trim()) {
        setModalError(`Vui lòng nhập nội dung cho phương án lựa chọn ${i + 1}.`);
        return;
      }
    }

    setIsSaving(true);
    try {
      const url = editingQuestion
        ? `/api/admin/quiz/questions/${editingQuestion._id}`
        : `/api/admin/quiz/questions`;
      const method = editingQuestion ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: formQuestion.trim(),
          category: formCategory,
          order: formOrder,
          isActive: formIsActive,
          options: formOptions,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Lưu câu hỏi thất bại");
      }

      setIsModalOpen(false);
      fetchQuestions();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Đã có lỗi xảy ra";
      setModalError(msg);
    } finally {
      setIsSaving(false);
    }
  };

  // Delete Question
  const handleDelete = async (id: string, text: string) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa câu hỏi: "${text}"?`)) return;

    try {
      const res = await fetch(`/api/admin/quiz/questions/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        fetchQuestions();
      }
    } catch (err) {
      console.error("Failed to delete question", err);
    }
  };

  // Reset to default
  const handleResetDefault = async () => {
    if (
      !confirm(
        "CẢNH BÁO: Thao tác này sẽ nạp lại 5 câu hỏi chuẩn ban đầu của trường và ghi đè các câu hỏi hiện tại. Bạn có muốn tiếp tục?"
      )
    ) {
      return;
    }

    try {
      const res = await fetch("/api/admin/quiz/reset-default", {
        method: "POST",
      });
      if (res.ok) {
        alert("Đã khôi phục thành công bộ câu hỏi mặc định!");
        fetchQuestions();
      }
    } catch (err) {
      console.error("Failed to reset default", err);
    }
  };

  // Stats calculation
  const totalQuestions = questions.length;
  const activeQuestions = questions.filter((q) => q.isActive).length;
  const totalOptions = questions.reduce((acc, q) => acc + (q.options?.length || 0), 0);

  return (
    <div className="w-full px-6 sm:px-8 py-6 space-y-7">
      {/* 1. TOP HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-md">
              ADMIN CMS
            </span>
            <span className="text-xs text-slate-400">· Định hướng học tập</span>
          </div>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Quản trị Bộ câu hỏi Trắc nghiệm Định hướng
          </h1>
          <p className="mt-0.5 text-xs sm:text-sm text-slate-500">
            Quản lý nội dung các câu hỏi, danh mục khảo sát, phương án lựa chọn và ma trận điểm số theo quy tắc (Rule-based).
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <button
            type="button"
            onClick={handleResetDefault}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-2xs transition-colors"
            title="Khôi phục lại bộ câu hỏi mặc định của hệ thống"
          >
            <RotateCcw className="h-3.5 w-3.5 text-slate-500" />
            <span>Khôi phục chuẩn</span>
          </button>

          <button
            type="button"
            onClick={handleOpenCreate}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white shadow-sm shadow-blue-500/25 hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>Thêm câu hỏi mới</span>
          </button>
        </div>
      </div>

      {/* 2. STATS OVERVIEW CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Tổng số câu hỏi</span>
            <HelpCircle className="h-4 w-4 text-blue-600" />
          </div>
          <p className="text-2xl font-black text-slate-900">{totalQuestions}</p>
          <p className="text-[11px] text-slate-400">Toàn bộ câu hỏi trong CSDL</p>
        </div>

        <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Đang hoạt động</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-black text-emerald-600">{activeQuestions}</p>
          <p className="text-[11px] text-slate-400">Sinh viên sẽ làm các câu này</p>
        </div>

        <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Tổng phương án</span>
            <Sparkles className="h-4 w-4 text-purple-600" />
          </div>
          <p className="text-2xl font-black text-purple-600">{totalOptions}</p>
          <p className="text-[11px] text-slate-400">Các lựa chọn có gán điểm số</p>
        </div>
      </div>

      {/* 3. FILTER STRIP */}
      <div className="flex flex-col md:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm theo nội dung câu hỏi hoặc phương án trả lời..."
            className="w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-600 shadow-2xs"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 focus:outline-none focus:border-blue-600 shadow-2xs"
          >
            <option value="ALL">Tất cả chuyên mục</option>
            <option value="GOAL">Mục tiêu tương lai</option>
            <option value="INTEREST">Sở thích &amp; Hứng thú</option>
            <option value="PREPARATION">Kế hoạch chứng chỉ</option>
            <option value="WORK_STYLE">Phong cách làm việc</option>
            <option value="ACADEMIC">Học thuật &amp; Điểm số</option>
            <option value="VALUES">Giá trị cá nhân</option>
            <option value="SKILLS">Kỹ năng nòng cốt</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 focus:outline-none focus:border-blue-600 shadow-2xs"
          >
            <option value="ALL">Tất cả trạng thái</option>
            <option value="ACTIVE">Đang hoạt động</option>
            <option value="INACTIVE">Đang tạm ẩn</option>
          </select>
        </div>
      </div>

      {/* 4. QUESTIONS LIST */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center text-slate-400">
            <div className="inline-flex items-center gap-2">
              <div className="h-4 w-4 rounded-full border-2 border-blue-600 border-t-transparent animate-spin" />
              <span>Đang tải danh sách câu hỏi trắc nghiệm...</span>
            </div>
          </div>
        ) : filteredQuestions.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center text-slate-400">
            Không tìm thấy câu hỏi nào phù hợp với bộ lọc hiện tại.
          </div>
        ) : (
          filteredQuestions.map((q) => {
            const isExpanded = expandedId === q._id;

            return (
              <div
                key={q._id}
                className={cn(
                  "rounded-2xl border bg-white shadow-2xs transition-all overflow-hidden",
                  q.isActive ? "border-slate-200/90" : "border-slate-200 bg-slate-50/50 opacity-75"
                )}
              >
                {/* Question Summary Row */}
                <div className="p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="flex items-start gap-3.5 min-w-0">
                    {/* Order Pill */}
                    <div className="h-8 w-8 rounded-xl bg-blue-50 text-blue-700 border border-blue-100 flex items-center justify-center text-xs font-black shrink-0 mt-0.5">
                      #{q.order}
                    </div>

                    <div className="space-y-1.5 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-md">
                          {CATEGORY_MAP[q.category] || q.category}
                        </span>

                        <span
                          className={cn(
                            "inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md",
                            q.isActive
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : "bg-slate-100 text-slate-500 border border-slate-200"
                          )}
                        >
                          {q.isActive ? (
                            <>
                              <CheckCircle2 className="h-3 w-3" /> Đang kích hoạt
                            </>
                          ) : (
                            <>
                              <XCircle className="h-3 w-3" /> Đang tạm ẩn
                            </>
                          )}
                        </span>

                        <span className="text-[11px] text-slate-400 font-medium">
                          {q.options?.length || 0} phương án lựa chọn
                        </span>
                      </div>

                      <h2 className="text-sm font-bold text-slate-900 leading-snug">
                        {q.question}
                      </h2>
                    </div>
                  </div>

                  {/* Right Actions */}
                  <div className="flex items-center gap-2 shrink-0 self-end lg:self-center">
                    {/* Expand/Collapse details */}
                    <button
                      type="button"
                      onClick={() => setExpandedId(isExpanded ? null : q._id)}
                      className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors shadow-2xs"
                    >
                      <span>{isExpanded ? "Ẩn phương án" : "Xem phương án"}</span>
                      {isExpanded ? (
                        <ChevronUp className="h-3.5 w-3.5 text-slate-400" />
                      ) : (
                        <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
                      )}
                    </button>

                    {/* Toggle Active Switch */}
                    <button
                      type="button"
                      onClick={() => handleToggleActive(q)}
                      className={cn(
                        "rounded-xl border px-3 py-1.5 text-xs font-semibold transition-colors shadow-2xs",
                        q.isActive
                          ? "border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100"
                          : "border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100"
                      )}
                      title="Bấm để kích hoạt hoặc tạm dừng câu hỏi"
                    >
                      {q.isActive ? "Tạm ẩn" : "Kích hoạt"}
                    </button>

                    {/* Edit */}
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(q)}
                      className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-blue-600 hover:bg-blue-50 hover:border-blue-200 transition-colors shadow-2xs"
                    >
                      <Edit3 className="h-3.5 w-3.5" />
                      <span>Sửa</span>
                    </button>

                    {/* Delete */}
                    <button
                      type="button"
                      onClick={() => handleDelete(q._id, q.question)}
                      className="inline-flex items-center justify-center h-8 w-8 rounded-xl border border-slate-200 bg-white text-slate-400 hover:text-red-600 hover:bg-red-50 hover:border-red-200 transition-colors shadow-2xs"
                      title="Xóa câu hỏi"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                {/* Collapsible Options Table / Cards */}
                {isExpanded && (
                  <div className="border-t border-slate-100 bg-slate-50/60 p-5 space-y-3">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                      <span>Bảng phương án &amp; ma trận trọng số điểm:</span>
                      <span className="text-[11px] text-slate-400 font-normal">
                        Điểm từ 0 - 5 điểm phân bổ cho từng hướng đi
                      </span>
                    </div>

                    <div className="space-y-2">
                      {q.options?.map((opt, idx) => (
                        <div
                          key={opt.id || idx}
                          className="rounded-xl border border-slate-200 bg-white p-3.5 space-y-2 shadow-2xs"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-start gap-2.5">
                              <span className="h-5 w-5 rounded-md bg-slate-100 text-slate-600 font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                                {String.fromCharCode(65 + idx)}
                              </span>
                              <p className="text-xs font-medium text-slate-800 leading-relaxed">
                                {opt.text}
                              </p>
                            </div>
                          </div>

                          {/* Score Badges */}
                          <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-100 text-[10px]">
                            {opt.scores?.study_abroad > 0 && (
                              <span className="inline-flex items-center gap-1 rounded-md bg-blue-50 border border-blue-200 px-2 py-0.5 text-blue-700 font-bold">
                                <BookOpen className="h-3 w-3" /> Du học: +{opt.scores.study_abroad}
                              </span>
                            )}
                            {opt.scores?.employment > 0 && (
                              <span className="inline-flex items-center gap-1 rounded-md bg-purple-50 border border-purple-200 px-2 py-0.5 text-purple-700 font-bold">
                                <Briefcase className="h-3 w-3" /> MT/MNC: +{opt.scores.employment}
                              </span>
                            )}
                            {opt.scores?.research > 0 && (
                              <span className="inline-flex items-center gap-1 rounded-md bg-indigo-50 border border-indigo-200 px-2 py-0.5 text-indigo-700 font-bold">
                                <FlaskConical className="h-3 w-3" /> NCKH: +{opt.scores.research}
                              </span>
                            )}
                            {opt.scores?.startup > 0 && (
                              <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 border border-amber-200 px-2 py-0.5 text-amber-800 font-bold">
                                <Rocket className="h-3 w-3" /> Khởi nghiệp: +{opt.scores.startup}
                              </span>
                            )}
                            {opt.scores?.skills > 0 && (
                              <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-emerald-700 font-bold">
                                <Flame className="h-3 w-3" /> Kỹ năng: +{opt.scores.skills}
                              </span>
                            )}
                            {Object.values(opt.scores || {}).every((s) => !s) && (
                              <span className="text-slate-400 italic">Chưa gán điểm số</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* 5. MODAL SOẠN THẢO / CHỈNH SỬA CÂU HỎI (QUESTION EDITOR MODAL) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="w-full max-w-3xl rounded-3xl border border-slate-200 bg-white p-6 sm:p-7 shadow-xl space-y-6 my-8 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="space-y-0.5">
                <h2 className="text-lg font-bold text-slate-900">
                  {editingQuestion ? "Chỉnh sửa câu hỏi trắc nghiệm" : "Tạo câu hỏi trắc nghiệm mới"}
                </h2>
                <p className="text-xs text-slate-500">
                  Cấu hình tiêu đề, danh mục và bảng trọng số điểm cho các hướng đi
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="h-8 w-8 rounded-xl border border-slate-200 text-slate-400 hover:text-slate-700 hover:bg-slate-50 flex items-center justify-center transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {modalError && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-3.5 text-xs font-semibold text-red-700 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{modalError}</span>
              </div>
            )}

            {/* Modal Form */}
            <form onSubmit={handleSaveModal} className="space-y-5">
              {/* Question Text */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">
                  Nội dung câu hỏi khảo sát <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={2}
                  value={formQuestion}
                  onChange={(e) => setFormQuestion(e.target.value)}
                  placeholder="Ví dụ: Mục tiêu lớn nhất của bạn trong 2-4 năm tới tại trường đại học là gì?"
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-blue-600 shadow-2xs leading-relaxed"
                  required
                />
              </div>

              {/* Category & Order & Active */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Chuyên mục khảo sát</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:border-blue-600 shadow-2xs"
                  >
                    <option value="GOAL">Mục tiêu tương lai</option>
                    <option value="INTEREST">Sở thích &amp; Hứng thú</option>
                    <option value="PREPARATION">Kế hoạch chứng chỉ</option>
                    <option value="WORK_STYLE">Phong cách làm việc</option>
                    <option value="ACADEMIC">Học thuật &amp; Điểm số</option>
                    <option value="VALUES">Giá trị cá nhân</option>
                    <option value="SKILLS">Kỹ năng nòng cốt</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Thứ tự hiển thị (#order)</label>
                  <input
                    type="number"
                    min={1}
                    value={formOrder}
                    onChange={(e) => setFormOrder(parseInt(e.target.value, 10) || 1)}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-600 shadow-2xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Trạng thái kích hoạt</label>
                  <div className="pt-2">
                    <label className="inline-flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700">
                      <input
                        type="checkbox"
                        checked={formIsActive}
                        onChange={(e) => setFormIsActive(e.target.checked)}
                        className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span>Hiển thị cho sinh viên</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Dynamic Options Manager */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    Danh sách phương án lựa chọn ({formOptions.length}) <span className="text-red-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={handleAddOption}
                    className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-700"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Thêm phương án</span>
                  </button>
                </div>

                <div className="space-y-3">
                  {formOptions.map((opt, idx) => (
                    <div
                      key={opt.id || idx}
                      className="rounded-2xl border border-slate-200 bg-slate-50/50 p-4 space-y-3"
                    >
                      {/* Option Text and Delete button */}
                      <div className="flex items-start gap-2.5">
                        <span className="h-6 w-6 rounded-lg bg-blue-600 text-white font-bold text-xs flex items-center justify-center shrink-0 mt-1 shadow-2xs">
                          {String.fromCharCode(65 + idx)}
                        </span>
                        <div className="flex-1 space-y-1">
                          <input
                            type="text"
                            value={opt.text}
                            onChange={(e) => handleOptionTextChange(idx, e.target.value)}
                            placeholder={`Nội dung phương án ${String.fromCharCode(65 + idx)}...`}
                            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-600 shadow-2xs"
                            required
                          />
                        </div>

                        {formOptions.length > 2 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveOption(idx)}
                            className="p-2 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                            title="Xóa phương án này"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>

                      {/* 5 Score Inputs */}
                      <div className="pt-2 border-t border-slate-200/80 space-y-1.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                          Trọng số điểm cộng khi sinh viên chọn phương án này:
                        </span>
                        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                          <div className="space-y-0.5">
                            <label className="text-[10px] font-semibold text-blue-700">Du học</label>
                            <input
                              type="number"
                              min={0}
                              max={10}
                              value={opt.scores.study_abroad}
                              onChange={(e) =>
                                handleOptionScoreChange(
                                  idx,
                                  "study_abroad",
                                  parseInt(e.target.value, 10)
                                )
                              }
                              className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs text-slate-900 focus:outline-none focus:border-blue-600 text-center font-bold"
                            />
                          </div>

                          <div className="space-y-0.5">
                            <label className="text-[10px] font-semibold text-purple-700">Việc làm / MT</label>
                            <input
                              type="number"
                              min={0}
                              max={10}
                              value={opt.scores.employment}
                              onChange={(e) =>
                                handleOptionScoreChange(
                                  idx,
                                  "employment",
                                  parseInt(e.target.value, 10)
                                )
                              }
                              className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs text-slate-900 focus:outline-none focus:border-blue-600 text-center font-bold"
                            />
                          </div>

                          <div className="space-y-0.5">
                            <label className="text-[10px] font-semibold text-indigo-700">NC Khoa học</label>
                            <input
                              type="number"
                              min={0}
                              max={10}
                              value={opt.scores.research}
                              onChange={(e) =>
                                handleOptionScoreChange(
                                  idx,
                                  "research",
                                  parseInt(e.target.value, 10)
                                )
                              }
                              className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs text-slate-900 focus:outline-none focus:border-blue-600 text-center font-bold"
                            />
                          </div>

                          <div className="space-y-0.5">
                            <label className="text-[10px] font-semibold text-amber-700">Khởi nghiệp</label>
                            <input
                              type="number"
                              min={0}
                              max={10}
                              value={opt.scores.startup}
                              onChange={(e) =>
                                handleOptionScoreChange(
                                  idx,
                                  "startup",
                                  parseInt(e.target.value, 10)
                                )
                              }
                              className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs text-slate-900 focus:outline-none focus:border-blue-600 text-center font-bold"
                            />
                          </div>

                          <div className="space-y-0.5">
                            <label className="text-[10px] font-semibold text-emerald-700">Kỹ năng</label>
                            <input
                              type="number"
                              min={0}
                              max={10}
                              value={opt.scores.skills}
                              onChange={(e) =>
                                handleOptionScoreChange(
                                  idx,
                                  "skills",
                                  parseInt(e.target.value, 10)
                                )
                              }
                              className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs text-slate-900 focus:outline-none focus:border-blue-600 text-center font-bold"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs"
                >
                  Hủy bỏ
                </button>

                <button
                  type="submit"
                  disabled={isSaving}
                  className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2 text-xs font-semibold text-white shadow-sm shadow-blue-500/25 hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  {isSaving ? (
                    <>
                      <div className="h-3.5 w-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                      <span>Đang lưu...</span>
                    </>
                  ) : (
                    <>
                      <Save className="h-3.5 w-3.5" />
                      <span>{editingQuestion ? "Cập nhật câu hỏi" : "Lưu câu hỏi mới"}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
