"use client";

import { ReactNode, useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  ChevronDown,
  ChevronRight,
  Eye,
  EyeOff,
  GripVertical,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SortableSectionCardProps {
  id: string;
  title: string;
  icon: ReactNode;
  isHidden: boolean;
  onToggleHidden: () => void;
  errorCount?: number;
  headerAction?: ReactNode;
  defaultOpen?: boolean;
  children: ReactNode;
}

export function SortableSectionCard({
  id,
  title,
  icon,
  isHidden,
  onToggleHidden,
  errorCount = 0,
  headerAction,
  defaultOpen = true,
  children,
}: SortableSectionCardProps) {
  const [open, setOpen] = useState(defaultOpen);
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "rounded-2xl border bg-white shadow-xs transition-shadow",
        isDragging
          ? "border-blue-400 shadow-lg ring-2 ring-blue-100 z-20 relative"
          : "border-slate-200/90",
        isHidden ? "opacity-70 bg-slate-50/70" : ""
      )}
    >
      <div className="flex items-center justify-between gap-2 px-3.5 py-3 border-b border-slate-100">
        <div className="flex items-center gap-2 min-w-0">
          <button
            type="button"
            {...attributes}
            {...listeners}
            title="Kéo để sắp xếp thứ tự mục này"
            className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 cursor-grab active:cursor-grabbing shrink-0"
          >
            <GripVertical className="h-4 w-4" />
          </button>

          <button
            type="button"
            onClick={() => setOpen((p) => !p)}
            className="flex items-center gap-2 min-w-0 text-left cursor-pointer"
          >
            <span className="text-blue-600 shrink-0">{icon}</span>
            <span className="text-sm font-bold text-slate-900 truncate">
              {title}
            </span>
            {errorCount > 0 && (
              <span className="rounded-full bg-rose-100 border border-rose-200 px-1.5 py-0.2 text-[10px] font-bold text-rose-700">
                {errorCount} lỗi
              </span>
            )}
            {open ? (
              <ChevronDown className="h-3.5 w-3.5 text-slate-400 shrink-0" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5 text-slate-400 shrink-0" />
            )}
          </button>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {headerAction}
          <button
            type="button"
            onClick={onToggleHidden}
            title={
              isHidden
                ? "Đang ẩn khỏi CV — Bấm để hiện lại"
                : "Đang hiển thị — Bấm để tạm ẩn khỏi CV"
            }
            className={cn(
              "rounded-lg p-1.5 text-xs transition-colors cursor-pointer",
              isHidden
                ? "bg-amber-50 text-amber-700 hover:bg-amber-100"
                : "text-slate-400 hover:bg-slate-100 hover:text-slate-700"
            )}
          >
            {isHidden ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>

      {open && <div className="p-3.5 space-y-3">{children}</div>}
    </div>
  );
}

interface SortableItemCardProps {
  id: string;
  summaryTitle: string;
  summarySubtitle?: string;
  onRemove: () => void;
  defaultOpen?: boolean;
  children: ReactNode;
}

export function SortableItemCard({
  id,
  summaryTitle,
  summarySubtitle,
  onRemove,
  defaultOpen = true,
  children,
}: SortableItemCardProps) {
  const [open, setOpen] = useState(defaultOpen);
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "rounded-xl border bg-slate-50/50 transition-shadow",
        isDragging
          ? "border-blue-400 bg-white shadow-md ring-2 ring-blue-100 z-30 relative"
          : "border-slate-200/80"
      )}
    >
      <div className="flex items-center justify-between gap-2 px-2.5 py-2">
        <div className="flex items-center gap-1.5 min-w-0 flex-1">
          <button
            type="button"
            {...attributes}
            {...listeners}
            title="Kéo để sắp xếp thứ tự"
            className="p-1 rounded-md text-slate-400 hover:bg-slate-200/70 hover:text-slate-700 cursor-grab active:cursor-grabbing shrink-0"
          >
            <GripVertical className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setOpen((p) => !p)}
            className="min-w-0 flex-1 text-left flex items-center gap-1.5 cursor-pointer"
          >
            <span className="text-xs font-semibold text-slate-800 truncate">
              {summaryTitle || "Mục chưa đặt tiêu đề"}
            </span>
            {summarySubtitle && (
              <span className="text-[11px] text-slate-400 truncate hidden sm:inline">
                · {summarySubtitle}
              </span>
            )}
          </button>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={() => setOpen((p) => !p)}
            className="p-1 rounded-md text-slate-400 hover:bg-slate-200/60 hover:text-slate-700 cursor-pointer"
            title={open ? "Thu gọn" : "Mở rộng"}
          >
            {open ? (
              <ChevronDown className="h-3.5 w-3.5" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5" />
            )}
          </button>
          <button
            type="button"
            onClick={onRemove}
            className="p-1 rounded-md text-slate-400 hover:bg-rose-50 hover:text-rose-600 cursor-pointer"
            title="Xóa mục này"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {open && (
        <div className="px-3 pb-3 pt-1.5 border-t border-slate-200/70 bg-white rounded-b-xl space-y-2.5">
          {children}
        </div>
      )}
    </div>
  );
}

