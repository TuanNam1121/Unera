"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  Calculator,
  Minus,
  Plus,
  ReceiptText,
  RotateCcw,
} from "lucide-react";
import { PitBracketsTable } from "@/components/tools/PitBracketsTable";
import { ToolSubNav } from "@/components/tools/ToolSubNav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  QUICK_TAX_EXAMPLES,
  SALARY_TAX_REGULATORY_INFO,
} from "@/constants/salaryTaxConfig";
import {
  calculateStandalonePIT,
  formatNumberVi,
  formatVnd,
  parseCurrencyInput,
} from "@/lib/calculators/salaryTax";
import { cn } from "@/lib/utils";

type ViewPeriod = "MONTHLY" | "ANNUAL";

export function TaxCalculatorClient() {
  const [viewPeriod, setViewPeriod] = useState<ViewPeriod>("MONTHLY");
  const [grossIncome, setGrossIncome] = useState<number>(30_000_000);
  const [autoInsurance, setAutoInsurance] = useState<boolean>(true);
  const [manualInsurance, setManualInsurance] = useState<number>(3_150_000);
  const [dependents, setDependents] = useState<number>(1);
  const [personalDeduction, setPersonalDeduction] = useState<number>(
    SALARY_TAX_REGULATORY_INFO.personalDeduction
  );
  const [otherDeductions, setOtherDeductions] = useState<number>(0);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Khi bật Auto 10.5%, tính tự động theo trần bảo hiểm Vùng I tiêu chuẩn
  const effectiveInsurance = useMemo(() => {
    if (!autoInsurance) return manualInsurance;
    const bhxhBhytBase = Math.min(
      grossIncome,
      SALARY_TAX_REGULATORY_INFO.maxBhxhBhytCap
    );
    const bhtnBase = Math.min(grossIncome, 99_200_000);
    return (
      Math.round(bhxhBhytBase * 0.095) + Math.round(bhtnBase * 0.01)
    );
  }, [autoInsurance, manualInsurance, grossIncome]);

  const result = useMemo(
    () =>
      calculateStandalonePIT({
        grossIncome,
        insuranceAmount: effectiveInsurance,
        dependents,
        personalDeduction,
        otherDeductions,
      }),
    [grossIncome, effectiveInsurance, dependents, personalDeduction, otherDeductions]
  );

  const multiplier = viewPeriod === "ANNUAL" ? 12 : 1;
  const periodLabel = viewPeriod === "ANNUAL" ? "cả năm" : "tháng";

  const handleNumericFieldChange = (
    raw: string,
    fieldName: string,
    setter: (val: number) => void
  ) => {
    if (raw.includes("-")) {
      setValidationError(`${fieldName} không được phép nhập số âm.`);
      return;
    }
    setValidationError(null);
    setter(parseCurrencyInput(raw));
  };

  const handleApplyExample = (ex: (typeof QUICK_TAX_EXAMPLES)[number]) => {
    setValidationError(null);
    setGrossIncome(ex.grossIncome);
    setDependents(ex.dependents);
    setAutoInsurance(ex.autoInsurance);
    setManualInsurance(ex.insuranceAmount);
    setPersonalDeduction(SALARY_TAX_REGULATORY_INFO.personalDeduction);
    setOtherDeductions(ex.otherDeductions);
  };

  const handleReset = () => {
    setViewPeriod("MONTHLY");
    setGrossIncome(30_000_000);
    setAutoInsurance(true);
    setManualInsurance(3_150_000);
    setDependents(1);
    setPersonalDeduction(SALARY_TAX_REGULATORY_INFO.personalDeduction);
    setOtherDeductions(0);
    setValidationError(null);
  };

  return (
    <div className="w-full px-6 sm:px-8 py-6 space-y-6">
      <ToolSubNav />

      {/* Header */}
      <div className="rounded-3xl bg-gradient-to-r from-[#DCEBFE] via-[#E8F1FD] to-[#D5E7FD] p-6 sm:p-8 flex flex-col lg:flex-row lg:items-center justify-between gap-5 border border-blue-100">
        <div className="space-y-2 max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/85 px-3 py-1 text-xs font-semibold text-blue-700 border border-blue-200/80">
            <ReceiptText className="h-3.5 w-3.5" />
            <span>TOOL-04 · Biểu Thuế TNCN Lũy Tiến Từng Phần 7 Bậc</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
            Công Cụ Tính Thuế Thu Nhập Cá Nhân (TNCN)
          </h1>
          <p className="text-sm text-slate-600 leading-relaxed">
            Tính chi tiết Thuế TNCN từ tiền lương, tiền công theo từng bậc thuế suất (5% → 35%), giúp sinh viên thực tập và người mới đi làm hiểu rõ cơ chế lũy tiến từng phần và tổng thu nhập thực nhận.
          </p>
        </div>

        <Link
          href="/tools/gross-net"
          className="inline-flex items-center gap-2 rounded-xl bg-white/95 border border-blue-200 px-4 py-2.5 text-xs font-semibold text-blue-700 hover:bg-white shrink-0 shadow-2xs"
        >
          <Calculator className="h-4 w-4" />
          <span>Quy đổi lương Gross ↔ Net 2 chiều</span>
        </Link>
      </div>

      {/* Main Layout */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* Left Inputs */}
        <div className="xl:col-span-5 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-[0_2px_8px_rgba(0,0,0,0.02)] space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
            <h2 className="text-base font-bold text-slate-900">
              Thông tin Thu nhập & Giảm trừ
            </h2>
            <button
              type="button"
              onClick={handleReset}
              className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-blue-600 cursor-pointer"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Đặt lại
            </button>
          </div>

          {validationError && (
            <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-xs text-rose-700">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{validationError}</span>
            </div>
          )}

          {/* Kỳ tính hiển thị */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700">
              Chế độ xem kết quả
            </label>
            <div className="grid grid-cols-2 gap-2 rounded-xl bg-slate-100 p-1">
              {(
                [
                  { id: "MONTHLY", label: "Theo Tháng" },
                  { id: "ANNUAL", label: "Ước tính Cả Năm (×12)" },
                ] as const
              ).map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setViewPeriod(item.id)}
                  className={cn(
                    "rounded-lg py-2 text-xs font-semibold transition-all cursor-pointer",
                    viewPeriod === item.id
                      ? "bg-white text-blue-700 shadow-2xs"
                      : "text-slate-600 hover:text-slate-900"
                  )}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Tổng thu nhập chịu thuế tháng */}
          <div className="space-y-1.5">
            <label
              htmlFor="tax-gross-income"
              className="block text-xs font-semibold text-slate-700"
            >
              Tổng thu nhập chịu thuế / tháng (VNĐ)
            </label>
            <div className="relative">
              <Input
                id="tax-gross-income"
                type="text"
                inputMode="numeric"
                value={formatNumberVi(grossIncome)}
                onChange={(e) =>
                  handleNumericFieldChange(
                    e.target.value,
                    "Tổng thu nhập",
                    setGrossIncome
                  )
                }
                className="pr-14 text-base font-bold tabular-nums h-11"
              />
              <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400">
                VNĐ
              </span>
            </div>
          </div>

          {/* Bảo hiểm bắt buộc */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <label
                htmlFor="tax-insurance-input"
                className="text-xs font-semibold text-slate-700"
              >
                Bảo hiểm bắt buộc đã đóng / tháng (VNĐ)
              </label>
              <button
                type="button"
                onClick={() => {
                  if (autoInsurance) {
                    setManualInsurance(effectiveInsurance);
                    setAutoInsurance(false);
                  } else {
                    setAutoInsurance(true);
                  }
                }}
                className={cn(
                  "rounded-full px-2.5 py-0.5 text-[11px] font-semibold border transition-colors cursor-pointer",
                  autoInsurance
                    ? "border-blue-300 bg-blue-50 text-blue-700"
                    : "border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100"
                )}
              >
                {autoInsurance ? "Đang tự động tính 10.5%" : "Bật auto 10.5%"}
              </button>
            </div>
            <div className="relative">
              <Input
                id="tax-insurance-input"
                type="text"
                inputMode="numeric"
                disabled={autoInsurance}
                value={formatNumberVi(effectiveInsurance)}
                onChange={(e) => {
                  setAutoInsurance(false);
                  handleNumericFieldChange(
                    e.target.value,
                    "Tiền bảo hiểm",
                    setManualInsurance
                  );
                }}
                className={cn(
                  "pr-14 font-semibold tabular-nums",
                  autoInsurance ? "bg-slate-50 text-slate-700" : ""
                )}
              />
              <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400">
                VNĐ
              </span>
            </div>
          </div>

          {/* Người phụ thuộc */}
          <div className="flex items-center justify-between gap-3 rounded-xl border border-slate-200/80 bg-slate-50/70 px-4 py-3">
            <div>
              <p className="text-xs font-semibold text-slate-800">
                Số người phụ thuộc
              </p>
              <p className="text-[11px] text-slate-500">
                {formatVnd(SALARY_TAX_REGULATORY_INFO.dependentDeduction)} / người / tháng
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setDependents((d) => Math.max(0, d - 1))}
                disabled={dependents === 0}
              >
                <Minus className="h-3.5 w-3.5" />
              </Button>
              <span className="w-8 text-center text-sm font-bold text-slate-900 tabular-nums">
                {dependents}
              </span>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setDependents((d) => d + 1)}
              >
                <Plus className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>

          {/* Giảm trừ bản thân & Giảm trừ khác */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label
                htmlFor="tax-personal-deduction"
                className="block text-xs font-semibold text-slate-700"
              >
                Giảm trừ bản thân
              </label>
              <Input
                id="tax-personal-deduction"
                type="text"
                inputMode="numeric"
                value={formatNumberVi(personalDeduction)}
                onChange={(e) =>
                  handleNumericFieldChange(
                    e.target.value,
                    "Giảm trừ bản thân",
                    setPersonalDeduction
                  )
                }
                className="text-xs sm:text-sm font-semibold tabular-nums"
              />
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="tax-other-deductions"
                className="block text-xs font-semibold text-slate-700"
              >
                Giảm trừ hợp lệ khác
              </label>
              <Input
                id="tax-other-deductions"
                type="text"
                inputMode="numeric"
                value={formatNumberVi(otherDeductions)}
                onChange={(e) =>
                  handleNumericFieldChange(
                    e.target.value,
                    "Giảm trừ hợp lệ khác",
                    setOtherDeductions
                  )
                }
                placeholder="Từ thiện, hưu trí tự nguyện..."
                className="text-xs sm:text-sm font-semibold tabular-nums"
              />
            </div>
          </div>

          {/* Ví dụ mẫu */}
          <div className="border-t border-slate-100 pt-4 space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Ví dụ mẫu tính nhanh
            </p>
            <div className="flex flex-wrap gap-1.5">
              {QUICK_TAX_EXAMPLES.map((ex) => (
                <button
                  key={ex.id}
                  type="button"
                  onClick={() => handleApplyExample(ex)}
                  className={cn(
                    "rounded-full border px-3 py-1.5 text-[11px] font-medium transition-colors cursor-pointer",
                    grossIncome === ex.grossIncome && dependents === ex.dependents
                      ? "border-blue-600 bg-blue-50 text-blue-700"
                      : "border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100"
                  )}
                >
                  {ex.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Breakdown */}
        <div className="xl:col-span-7 space-y-5">
          {/* KPI Summary Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
            <div className="rounded-2xl border border-rose-200 bg-rose-50/70 p-4 shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
              <p className="text-[11px] font-semibold text-rose-700">
                Thuế TNCN ({periodLabel})
              </p>
              <p className="text-base sm:text-lg font-extrabold text-rose-700 mt-1 tabular-nums">
                {formatVnd(result.taxAmount * multiplier)}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
              <p className="text-[11px] font-medium text-slate-500">
                Thu nhập tính thuế ({periodLabel})
              </p>
              <p className="text-base sm:text-lg font-bold text-slate-900 mt-1 tabular-nums">
                {formatVnd(result.taxableIncome * multiplier)}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
              <p className="text-[11px] font-medium text-slate-500">
                Thuế suất hiệu dụng
              </p>
              <p className="text-base sm:text-lg font-bold text-indigo-700 mt-1 tabular-nums">
                {result.effectiveTaxRate.toFixed(2)}%
              </p>
            </div>
            <div className="rounded-2xl border border-blue-200 bg-blue-50/70 p-4 shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
              <p className="text-[11px] font-semibold text-blue-700">
                Thực nhận sau thuế & BH
              </p>
              <p className="text-base sm:text-lg font-extrabold text-blue-700 mt-1 tabular-nums">
                {formatVnd(result.netIncome * multiplier)}
              </p>
            </div>
          </div>

          {/* Bảng Tổng Hợp Công Thức */}
          <div className="rounded-2xl border border-slate-200/80 bg-white shadow-[0_2px_8px_rgba(0,0,0,0.02)] overflow-hidden">
            <div className="border-b border-slate-100 px-5 py-4 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-900">
                Công Thức Tính Thu Nhập Tính Thuế ({periodLabel})
              </h3>
              <span className="text-xs text-slate-500">
                TNTT = max(0, Thu nhập - Tổng giảm trừ)
              </span>
            </div>

            <div className="divide-y divide-slate-100 text-xs sm:text-sm">
              <div className="flex items-center justify-between px-5 py-3 font-semibold text-slate-900 bg-slate-50/50">
                <span>Tổng thu nhập chịu thuế</span>
                <span className="tabular-nums">
                  {formatVnd(result.grossIncome * multiplier)}
                </span>
              </div>
              <div className="flex items-center justify-between px-5 py-2.5 text-slate-600">
                <span>(-) Bảo hiểm bắt buộc đã đóng</span>
                <span className="tabular-nums">
                  -{formatVnd(result.insuranceAmount * multiplier)}
                </span>
              </div>
              <div className="flex items-center justify-between px-5 py-2.5 text-slate-600">
                <span>(-) Giảm trừ gia cảnh bản thân</span>
                <span className="tabular-nums">
                  -{formatVnd(result.personalDeduction * multiplier)}
                </span>
              </div>
              <div className="flex items-center justify-between px-5 py-2.5 text-slate-600">
                <span>(-) Giảm trừ người phụ thuộc ({result.dependents} người)</span>
                <span className="tabular-nums">
                  -{formatVnd(result.dependentDeduction * multiplier)}
                </span>
              </div>
              {result.otherDeductions > 0 && (
                <div className="flex items-center justify-between px-5 py-2.5 text-slate-600">
                  <span>(-) Các khoản giảm trừ hợp lệ khác</span>
                  <span className="tabular-nums">
                    -{formatVnd(result.otherDeductions * multiplier)}
                  </span>
                </div>
              )}
              <div className="flex items-center justify-between px-5 py-3 font-semibold text-slate-800 bg-slate-50/50">
                <span>(=) Thu nhập tính thuế (TNTT)</span>
                <span className="tabular-nums">
                  {formatVnd(result.taxableIncome * multiplier)}
                </span>
              </div>
              <div className="flex items-center justify-between px-5 py-3 font-bold text-rose-700">
                <span>(=) Thuế TNCN phải nộp</span>
                <span className="tabular-nums">
                  {formatVnd(result.taxAmount * multiplier)}
                </span>
              </div>
              <div className="flex items-center justify-between px-5 py-3.5 font-bold text-blue-700 bg-blue-50/70">
                <span>Thu nhập thực nhận sau thuế & bảo hiểm</span>
                <span className="text-base tabular-nums">
                  {formatVnd(result.netIncome * multiplier)}
                </span>
              </div>
            </div>
          </div>

          {/* Biểu 7 bậc lũy tiến */}
          <PitBracketsTable
            brackets={result.pitBrackets}
            totalTax={result.taxAmount}
            multiplier={multiplier}
            periodLabel={periodLabel}
          />
        </div>
      </div>
    </div>
  );
}

