"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { format } from "date-fns";
import { Calendar, Check, X } from "lucide-react";
import { DayPicker } from "react-day-picker";
import { vi } from "react-day-picker/locale";
import "react-day-picker/style.css";
import { Button } from "@/components/ui/button";
import { formatCvMonthYear } from "@/lib/cv-format";
import { cn } from "@/lib/utils";

interface CvDatePickerProps {
  value?: string | null;
  onChange: (value: string | null) => void;
  placeholder?: string;
  disabled?: boolean;
  error?: string;
}

function parseMonthYearToDate(value?: string | null): Date | undefined {
  if (!value) return undefined;
  const match = value.trim().match(/^(\d{4})-(\d{2})(?:-(\d{2}))?$/);
  if (!match) return undefined;
  const year = Number(match[1]);
  const month = Number(match[2]) - 1;
  const day = match[3] ? Number(match[3]) : 1;
  const d = new Date(year, month, day);
  return Number.isNaN(d.getTime()) ? undefined : d;
}

export function CvDatePicker({
  value,
  onChange,
  placeholder = "Chọn tháng/năm",
  disabled = false,
  error,
}: CvDatePickerProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedDate = useMemo(() => parseMonthYearToDate(value), [value]);
  const [viewMonth, setViewMonth] = useState<Date>(
    () => selectedDate || new Date()
  );

  const currentYear = new Date().getFullYear();

  useEffect(() => {
    if (!open) return;
    const handleOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, [open]);

  const handleSelectDay = (date?: Date) => {
    if (!date) return;
    onChange(format(date, "yyyy-MM"));
    setOpen(false);
  };

  const handleConfirmCurrentMonth = () => {
    onChange(format(viewMonth, "yyyy-MM"));
    setOpen(false);
  };

  const displayLabel = disabled
    ? "Hiện tại"
    : formatCvMonthYear(value) || placeholder;

  return (
    <div ref={containerRef} className="relative">
      <div className="flex items-center gap-1">
        <button
          type="button"
          disabled={disabled}
          onClick={() => {
            if (!disabled) {
              setViewMonth(selectedDate || new Date());
              setOpen((prev) => !prev);
            }
          }}
          className={cn(
            "flex h-9 w-full items-center justify-between rounded-xl border bg-white px-3 text-xs transition-all cursor-pointer",
            disabled
              ? "bg-slate-100 text-slate-500 border-slate-200 cursor-not-allowed"
              : "border-slate-200 text-slate-800 hover:border-blue-400",
            error ? "border-rose-400 focus:ring-rose-200" : ""
          )}
        >
          <span className="flex items-center gap-2 truncate">
            <Calendar className="h-3.5 w-3.5 text-slate-400 shrink-0" />
            <span className={!value && !disabled ? "text-slate-400" : "font-medium"}>
              {displayLabel}
            </span>
          </span>
        </button>

        {value && !disabled && (
          <button
            type="button"
            title="Xóa ngày"
            onClick={() => onChange(null)}
            className="flex h-9 w-8 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-400 hover:text-rose-600 hover:border-rose-200 transition-colors cursor-pointer"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {open && !disabled && (
        <div className="absolute left-0 top-10 z-50 rounded-2xl border border-slate-200 bg-white p-3 shadow-2xl ring-1 ring-black/5 w-max">
          <DayPicker
            mode="single"
            locale={vi}
            captionLayout="dropdown"
            startMonth={new Date(1990, 0)}
            endMonth={new Date(currentYear + 6, 11)}
            month={viewMonth}
            onMonthChange={setViewMonth}
            selected={selectedDate}
            onSelect={handleSelectDay}
            className="text-xs"
          />
          <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
            <span className="text-[11px] text-slate-500">
              Chọn nhanh theo tháng:
            </span>
            <Button
              type="button"
              size="sm"
              className="h-7 px-2.5 text-[11px] gap-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
              onClick={handleConfirmCurrentMonth}
            >
              <Check className="h-3 w-3" />
              <span>Dùng {format(viewMonth, "MM/yyyy")}</span>
            </Button>
          </div>
        </div>
      )}

      {error && <p className="mt-1 text-[11px] text-rose-600">{error}</p>}
    </div>
  );
}

