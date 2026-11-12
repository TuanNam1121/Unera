"use client";

import { useState } from "react";
import { Loader2, Plus, Save, X } from "lucide-react";
import {
  ROADMAP_GOAL_CATEGORIES,
  ROADMAP_GOAL_PRIORITIES,
  RoadmapGoalCategory,
  RoadmapGoalPriority,
} from "@/constants";
import { GOAL_CATEGORY_META, GOAL_PRIORITY_META } from "@/lib/roadmap-utils";
import type { IRoadmapGoalDTO } from "@/types";

export interface GoalFormValues {
  yearNumber: 1 | 2 | 3 | 4;
  title: string;
  description: string;
  category: RoadmapGoalCategory;
  semester: 0 | 1 | 2;
  priority: RoadmapGoalPriority;
  dueDate: string | null;
}

interface GoalFormModalProps {
  open: boolean;
  mode: "create" | "edit";
  initialYearNumber: 1 | 2 | 3 | 4;
  goal?: IRoadmapGoalDTO | null;
  submitting?: boolean;
  errorMsg?: string | null;
  onClose: () => void;
  onSubmit: (values: GoalFormValues) => Promise<void> | void;
}

function toDateInputValue(iso: string | null | undefined): string {
  if (!iso) return "";
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) return "";
  return parsed.toISOString().slice(0, 10);
}

export function GoalFormModal(props: GoalFormModalProps) {
  if (!props.open) return null;
  const formKey = `${props.mode}-${props.goal?.id ?? "new"}-${props.initialYearNumber}`;
  return <GoalFormModalInner key={formKey} {...props} />;
}

function GoalFormModalInner({
  mode,
  initialYearNumber,
  goal,
  submitting = false,
  errorMsg = null,
  onClose,
  onSubmit,
}: GoalFormModalProps) {
  const isEdit = mode === "edit" && Boolean(goal);
  const [yearNumber, setYearNumber] = useState<1 | 2 | 3 | 4>(initialYearNumber);
  const [title, setTitle] = useState(isEdit && goal ? goal.title : "");
  const [description, setDescription] = useState(
    isEdit && goal ? goal.description || "" : ""
  );
  const [category, setCategory] = useState<RoadmapGoalCategory>(
    isEdit && goal ? goal.category : ROADMAP_GOAL_CATEGORIES.SKILL
  );
  const [semester, setSemester] = useState<0 | 1 | 2>(
    isEdit && goal ? goal.semester : 0
  );
  const [priority, setPriority] = useState<RoadmapGoalPriority>(
    isEdit && goal ? goal.priority : ROADMAP_GOAL_PRIORITIES.MEDIUM
  );
  const [dueDate, setDueDate] = useState(
    isEdit && goal ? toDateInputValue(goal.dueDate) : ""
  );
  const [localError, setLocalError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = title.trim();
    if (trimmed.length < 3) {
      setLocalError("Tiêu đề mục tiêu cần có ít nhất 3 ký tự.");
      return;
    }
    setLocalError(null);
    await onSubmit({
      yearNumber,
      title: trimmed,
      description: description.trim(),
      category,
      semester,
      priority,
      dueDate: dueDate ? dueDate : null,
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-label={mode === "create" ? "Thêm mục tiêu mới" : "Chỉnh sửa mục tiêu"}
    >
      <div className="w-full max-w-xl rounded-2xl border border-slate-200 bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              {mode === "create"
                ? "Thêm mục tiêu cá nhân mới"
                : "Chỉnh sửa mục tiêu lộ trình"}
            </h2>
            <p className="text-xs text-slate-500">
              {mode === "create"
                ? "Tự bổ sung cột mốc riêng vào lộ trình học tập 4 năm của bạn."
                : "Cập nhật thông tin hoặc di chuyển mục tiêu sang năm học khác."}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
            aria-label="Đóng"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 p-6">
          {(localError || errorMsg) && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm text-rose-700">
              {localError || errorMsg}
            </div>
          )}

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              Tên mục tiêu <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ví dụ: Đạt IELTS 7.0 hoặc Hoàn thành thực tập Business Analyst..."
              maxLength={200}
              className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 outline-hidden transition focus:border-[#102C8A] focus:ring-2 focus:ring-[#102C8A]/15"
              required
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              Mô tả chi tiết & hành động cụ thể
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              maxLength={1000}
              placeholder="Ghi rõ tiêu chí hoàn thành, tài nguyên cần chuẩn bị hoặc đầu ra mong muốn..."
              className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 outline-hidden transition focus:border-[#102C8A] focus:ring-2 focus:ring-[#102C8A]/15"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                Năm học
              </label>
              <select
                value={yearNumber}
                onChange={(e) =>
                  setYearNumber(Number(e.target.value) as 1 | 2 | 3 | 4)
                }
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-hidden focus:border-[#102C8A]"
              >
                <option value={1}>Năm 1 (Đại cương & Khám phá)</option>
                <option value={2}>Năm 2 (Nền tảng & Kỹ năng)</option>
                <option value={3}>Năm 3 (Thực chiến & Bứt phá)</option>
                <option value={4}>Năm 4 (Tốt nghiệp & Sự nghiệp)</option>
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                Học kỳ dự kiến
              </label>
              <select
                value={semester}
                onChange={(e) =>
                  setSemester(Number(e.target.value) as 0 | 1 | 2)
                }
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-hidden focus:border-[#102C8A]"
              >
                <option value={0}>Cả năm</option>
                <option value={1}>Học kỳ 1</option>
                <option value={2}>Học kỳ 2</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                Phân loại
              </label>
              <select
                value={category}
                onChange={(e) =>
                  setCategory(e.target.value as RoadmapGoalCategory)
                }
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-hidden focus:border-[#102C8A]"
              >
                {Object.entries(GOAL_CATEGORY_META).map(([key, meta]) => (
                  <option key={key} value={key}>
                    {meta.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                Mức độ ưu tiên
              </label>
              <select
                value={priority}
                onChange={(e) =>
                  setPriority(e.target.value as RoadmapGoalPriority)
                }
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-hidden focus:border-[#102C8A]"
              >
                {Object.entries(GOAL_PRIORITY_META).map(([key, meta]) => (
                  <option key={key} value={key}>
                    {meta.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                Hạn hoàn thành
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-hidden focus:border-[#102C8A]"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 rounded-xl bg-[#102C8A] px-5 py-2 text-sm font-semibold text-white shadow-xs transition hover:bg-[#0B2066] disabled:opacity-60"
            >
              {submitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : mode === "create" ? (
                <Plus className="h-4 w-4" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              {mode === "create" ? "Thêm mục tiêu" : "Lưu thay đổi"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

