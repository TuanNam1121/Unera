"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Check, CheckCircle2, ChevronDown, Search } from "lucide-react";
import {
  filterUniversities,
  isPresetUniversity,
} from "@/constants/universities";
import { Input } from "@/components/ui/input";

interface UniversityComboboxProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
  forceOpenSignal?: number;
}

export function UniversityCombobox({
  id = "universitySearch",
  value,
  onChange,
  disabled = false,
  placeholder = "Tìm tên trường hoặc viết tắt (vd: ULIS, HUST, NEU, FTU...)",
  forceOpenSignal = 0,
}: UniversityComboboxProps) {
  const [queryOverride, setQueryOverride] = useState<string | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [dismissedSignal, setDismissedSignal] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const isOpen =
    dropdownOpen || (forceOpenSignal > 0 && dismissedSignal < forceOpenSignal);
  const displayQuery = queryOverride !== null ? queryOverride : value;

  const filteredUniversities = useMemo(
    () => filterUniversities(displayQuery),
    [displayQuery]
  );

  const isLegacyCustomValue = Boolean(value && !isPresetUniversity(value));

  useEffect(() => {
    function handleOutsideClick(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setDropdownOpen(false);
        setDismissedSignal(forceOpenSignal);
      }
    }
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [forceOpenSignal]);

  const handleSelect = (uniName: string) => {
    onChange(uniName);
    setQueryOverride(uniName);
    setDropdownOpen(false);
    setDismissedSignal(forceOpenSignal);
  };

  return (
    <div className="space-y-1.5 relative" ref={containerRef}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
        <Input
          id={id}
          type="text"
          autoComplete="off"
          placeholder={placeholder}
          value={displayQuery}
          onFocus={() => setDropdownOpen(true)}
          onChange={(e) => {
            const nextQuery = e.target.value;
            setQueryOverride(nextQuery);
            if (value && nextQuery !== value) {
              onChange("");
            }
            setDropdownOpen(true);
          }}
          disabled={disabled}
          className="rounded-xl border-slate-200 pl-9 pr-9 text-xs sm:text-sm focus:border-blue-500 focus:ring-blue-100"
        />
        <button
          type="button"
          onClick={() => {
            if (isOpen) {
              setDropdownOpen(false);
              setDismissedSignal(forceOpenSignal);
            } else {
              setDropdownOpen(true);
            }
          }}
          tabIndex={-1}
          disabled={disabled}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
          aria-label="Mở danh sách trường đại học"
        >
          <ChevronDown className="h-4 w-4" />
        </button>
      </div>

      {value && !isLegacyCustomValue && (
        <p className="text-[11px] font-medium text-emerald-700 flex items-center gap-1">
          <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
          <span>Đã chọn: {value}</span>
        </p>
      )}

      {isLegacyCustomValue && (
        <p className="text-[11px] font-medium text-amber-700">
          Tên trường hiện tại chưa theo danh sách chuẩn. Vui lòng chọn trường từ danh sách gợi ý khi cập nhật.
        </p>
      )}

      {isOpen && (
        <div className="absolute left-0 right-0 z-30 mt-1 max-h-56 overflow-y-auto rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl">
          {filteredUniversities.length === 0 ? (
            <div className="px-3 py-4 text-center text-xs text-slate-500">
              Không tìm thấy trường phù hợp. Bạn có thể gõ &quot;Trường khác&quot; để chọn.
            </div>
          ) : (
            filteredUniversities.map((uni) => {
              const isSelected = value === uni.name;
              return (
                <button
                  key={uni.code}
                  type="button"
                  onClick={() => handleSelect(uni.name)}
                  className={`w-full flex items-center justify-between gap-2 rounded-lg px-3 py-2 text-left text-xs transition-colors cursor-pointer ${
                    isSelected
                      ? "bg-blue-50 text-blue-700 font-semibold"
                      : "text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  <div className="min-w-0">
                    <p className="truncate">{uni.name}</p>
                    <p className="text-[11px] text-slate-400">
                      {uni.shortName} · {uni.city}
                    </p>
                  </div>
                  {isSelected && (
                    <Check className="h-4 w-4 shrink-0 text-blue-600" />
                  )}
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
