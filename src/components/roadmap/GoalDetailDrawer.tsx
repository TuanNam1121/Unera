"use client";

import { useState } from "react";
import {
  Calendar,
  CheckCircle2,
  Edit3,
  Loader2,
  Sparkles,
  Trash2,
  UserCheck,
  X,
} from "lucide-react";
import { RoadmapGoalStatus } from "@/constants";
import {
  GOAL_CATEGORY_META,
  GOAL_PRIORITY_META,
  GOAL_STATUS_META,
  semesterLabel,
} from "@/lib/roadmap-utils";
import type { IRoadmapGoalDTO } from "@/types";

interface GoalDetailDrawerProps {
  open: boolean;
  yearNumber: 1 | 2 | 3 | 4;
  goal: IRoadmapGoalDTO | null;
  busy?: boolean;
  onClose: () => void;
  onStatusChange: (goalId: string, nextStatus: RoadmapGoalStatus) => void;
  onEdit: (goal: IRoadmapGoalDTO, yearNumber: 1 | 2 | 3 | 4) => void;
  onDelete: (goalId: string) => Promise<void> | void;
}

function formatDateVi(iso: string | null | undefined): string {
  if (!iso) return "Chưa đặt hạn";
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) return "Chưa đặt hạn";
  return parsed.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function GoalDetailDrawer({
  open,
  yearNumber,
  goal,
  busy = false,
  onClose,
  onStatusChange,
  onEdit,
  onDelete,
}: GoalDetailDrawerProps) {
  const [confirmDelete, setConfirmDelete] = useState(false);

  if (!open || !goal) return null;

  const catMeta = GOAL_CATEGORY_META[goal.category];
  const prioMeta = GOAL_PRIORITY_META[goal.priority];
  const statusMeta = GOAL_STATUS_META[goal.status];

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-slate-950/45 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-label="Chi tiết mục tiêu"
    >
      <div className="flex h-full w-full max-w-lg flex-col bg-white shadow-2xl">
        <div className="flex items-start justify-between border-b border-slate-100 px-6 py-5">
          <div className="space-y-1.5 pr-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-[#102C8A]/10 px-2.5 py-0.5 text-xs font-semibold text-[#102C8A]">
                Năm {yearNumber} · {semesterLabel(goal.semester)}
              </span>
              {goal.isCustom ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-teal-50 px-2.5 py-0.5 text-xs font-medium text-teal-700">
                  <UserCheck className="h-3 w-3" />
                  Tự thêm
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-medium text-indigo-700">
                  <Sparkles className="h-3 w-3" />
                  Đề xuất bởi AI
                </span>
              )}
            </div>
            <h2 className="text-lg font-bold leading-snug text-slate-900">
              {goal.title}
            </h2>
          </div>
          <button
            type="button"
            onClick={() => {
              setConfirmDelete(false);
              onClose();
            }}
            className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
            aria-label="Đóng ngăn chi tiết"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 space-y-6 overflow-y-auto px-6 py-5">
          <div className="flex flex-wrap gap-2">
            <span
              className={`rounded-full border px-3 py-1 text-xs font-medium ${catMeta.badgeClass}`}
            >
              {catMeta.label}
            </span>
            <span
              className={`rounded-full border px-3 py-1 text-xs font-medium ${prioMeta.badgeClass}`}
            >
              {prioMeta.label}
            </span>
            <span
              className={`rounded-full border px-3 py-1 text-xs font-medium ${statusMeta.badgeClass}`}
            >
              {statusMeta.label}
            </span>
          </div>

          <div className="rounded-2xl border border-slate-200/80 bg-slate-50/70 p-4">
            <h3 className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Mô tả & Tiêu chí hành động
            </h3>
            <p className="whitespace-pre-line text-sm leading-relaxed text-slate-700">
              {goal.description?.trim()
                ? goal.description
                : "Chưa có mô tả chi tiết cho mục tiêu này. Bạn có thể bấm Chỉnh sửa để bổ sung ghi chú hành động."}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-xl border border-slate-200 p-3.5">
              <div className="mb-1 flex items-center gap-1.5 text-xs font-medium text-slate-500">
                <Calendar className="h-3.5 w-3.5 text-[#102C8A]" />
                Hạn hoàn thành
              </div>
              <div className="font-semibold text-slate-900">
                {formatDateVi(goal.dueDate)}
              </div>
            </div>
            <div className="rounded-xl border border-slate-200 p-3.5">
              <div className="mb-1 flex items-center gap-1.5 text-xs font-medium text-slate-500">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                Thời điểm hoàn thành
              </div>
              <div className="font-semibold text-slate-900">
                {goal.completedAt ? formatDateVi(goal.completedAt) : "Chưa xong"}
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 p-4">
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
              Cập nhật trạng thái thực hiện
            </label>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(GOAL_STATUS_META).map(([statusKey, meta]) => {
                const active = goal.status === statusKey;
                return (
                  <button
                    key={statusKey}
                    type="button"
                    disabled={busy}
                    onClick={() =>
                      onStatusChange(goal.id, statusKey as RoadmapGoalStatus)
                    }
                    className={`rounded-xl border px-3 py-2.5 text-left text-xs font-semibold transition ${
                      active
                        ? "border-[#102C8A] bg-[#102C8A] text-white shadow-xs"
                        : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"
                    }`}
                  >
                    {meta.label}
                  </button>
                );
              })}
            </div>
            <p className="mt-2.5 text-xs text-slate-500">
              Lưu ý: Mục tiêu ở trạng thái <strong>Bỏ qua</strong> sẽ không được
              tính vào mẫu số phần trăm hoàn thành lộ trình.
            </p>
          </div>
        </div>

        <div className="border-t border-slate-100 bg-slate-50/70 px-6 py-4">
          {confirmDelete ? (
            <div className="flex flex-col gap-3 rounded-xl border border-rose-200 bg-rose-50 p-3.5">
              <p className="text-xs font-medium text-rose-800">
                Xác nhận xóa vĩnh viễn mục tiêu &ldquo;{goal.title}&rdquo; khỏi
                lộ trình hiện tại?
              </p>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => setConfirmDelete(false)}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                >
                  Giữ lại
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={async () => {
                    await onDelete(goal.id);
                    setConfirmDelete(false);
                  }}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-rose-700 disabled:opacity-60"
                >
                  {busy && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  Xóa ngay
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between gap-3">
              <button
                type="button"
                disabled={busy}
                onClick={() => setConfirmDelete(true)}
                className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 bg-white px-4 py-2 text-sm font-medium text-rose-600 transition hover:bg-rose-50"
              >
                <Trash2 className="h-4 w-4" />
                Xóa mục tiêu
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => {
                  onClose();
                  onEdit(goal, yearNumber);
                }}
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#102C8A] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#0B2066]"
              >
                <Edit3 className="h-4 w-4" />
                Chỉnh sửa
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

