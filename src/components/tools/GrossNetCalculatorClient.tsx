"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeftRight,
  Building2,
  Calculator,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Info,
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
  DEFAULT_EMPLOYEE_INSURANCE_RATES,
  QUICK_SALARY_PRESETS,
  SALARY_TAX_REGULATORY_INFO,
  VIETNAM_REGIONS,
  VIETNAM_REGION_LIST,
  type VietnamRegionCode,
} from "@/constants/salaryTaxConfig";
import {
  calculateGrossNetSalary,
  formatNumberVi,
  formatVnd,
  parseCurrencyInput,
  type InsuranceBaseMode,
  type SalaryDirection,
} from "@/lib/calculators/salaryTax";
import { cn } from "@/lib/utils";

export function GrossNetCalculatorClient() {
  const [direction, setDirection] = useState<SalaryDirection>("GROSS_TO_NET");
  const [salaryAmount, setSalaryAmount] = useState<number>(20_000_000);
  const [region, setRegion] = useState<VietnamRegionCode>("I");
  const [dependents, setDependents] = useState<number>(0);
  const [insuranceMode, setInsuranceMode] =
    useState<InsuranceBaseMode>("OFFICIAL");
  const [customInsuranceSalary, setCustomInsuranceSalary] =
    useState<number>(5_500_000);

  // Tùy chọn nâng cao (collapsible)
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [bhxhPct, setBhxhPct] = useState<number>(8);
  const [bhytPct, setBhytPct] = useState<number>(1.5);
  const [bhtnPct, setBhtnPct] = useState<number>(1);
  const [showEmployerCost, setShowEmployerCost] = useState(true);
  const [validationError, setValidationError] = useState<string | null>(null);

  const result = useMemo(
    () =>
      calculateGrossNetSalary({
        amount: salaryAmount,
        direction,
        region,
        dependents,
        insuranceMode,
        customInsuranceSalary,
        employeeRates: {
          bhxh: bhxhPct / 100,
          bhyt: bhytPct / 100,
          bhtn: bhtnPct / 100,
        },
      }),
    [
      salaryAmount,
      direction,
      region,
      dependents,
      insuranceMode,
      customInsuranceSalary,
      bhxhPct,
      bhytPct,
      bhtnPct,
    ]
  );

  const handleSalaryTextChange = (raw: string) => {
    if (raw.includes("-")) {
      setValidationError("Mức lương không được phép là số âm.");
      return;
    }
    setValidationError(null);
    setSalaryAmount(parseCurrencyInput(raw));
  };

  const handleCustomInsChange = (raw: string) => {
    if (raw.includes("-")) {
      setValidationError("Mức đóng bảo hiểm không được là số âm.");
      return;
    }
    setValidationError(null);
    setCustomInsuranceSalary(parseCurrencyInput(raw));
  };

  const handleFlipDirection = () => {
    if (direction === "GROSS_TO_NET") {
      setDirection("NET_TO_GROSS");
      setSalaryAmount(result.netSalary);
    } else {
      setDirection("GROSS_TO_NET");
      setSalaryAmount(result.grossSalary);
    }
  };

  const handleReset = () => {
    setDirection("GROSS_TO_NET");
    setSalaryAmount(20_000_000);
    setRegion("I");
    setDependents(0);
    setInsuranceMode("OFFICIAL");
    setCustomInsuranceSalary(5_500_000);
    setBhxhPct(DEFAULT_EMPLOYEE_INSURANCE_RATES.bhxh * 100);
    setBhytPct(DEFAULT_EMPLOYEE_INSURANCE_RATES.bhyt * 100);
    setBhtnPct(DEFAULT_EMPLOYEE_INSURANCE_RATES.bhtn * 100);
    setShowEmployerCost(true);
    setValidationError(null);
  };

  const regionCfg = VIETNAM_REGIONS[region];

  return (
    <div className="w-full px-6 sm:px-8 py-6 space-y-6">
      <ToolSubNav />

      {/* Header */}
      <div className="rounded-3xl bg-gradient-to-r from-[#DCEBFE] via-[#E8F1FD] to-[#D5E7FD] p-6 sm:p-8 flex flex-col lg:flex-row lg:items-center justify-between gap-5 border border-blue-100">
        <div className="space-y-2 max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/85 px-3 py-1 text-xs font-semibold text-blue-700 border border-blue-200/80">
            <Calculator className="h-3.5 w-3.5" />
            <span>
              TOOL-03 · Quy Chuẩn Áp Dụng Từ {SALARY_TAX_REGULATORY_INFO.effectiveFrom}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
            Công Cụ Tính Lương Gross ↔ Net Chuẩn Quy Định Việt Nam
          </h1>
          <p className="text-sm text-slate-600 leading-relaxed">
            Quy đổi 2 chiều Gross → Net và Net → Gross theo {SALARY_TAX_REGULATORY_INFO.legalBasis}. Hỗ trợ trần đóng bảo hiểm theo từng vùng I–IV, người phụ thuộc và chi phí doanh nghiệp.
          </p>
        </div>

        <Link
          href="/tools/tax"
          className="inline-flex items-center gap-2 rounded-xl bg-white/95 border border-blue-200 px-4 py-2.5 text-xs font-semibold text-blue-700 hover:bg-white shrink-0 shadow-2xs"
        >
          <ReceiptText className="h-4 w-4" />
          <span>Mở công cụ Tính Thuế TNCN độc lập</span>
        </Link>
      </div>

      {/* Main Split Workspace */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* Left Inputs Form */}
        <div className="xl:col-span-5 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-[0_2px_8px_rgba(0,0,0,0.02)] space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
            <h2 className="text-base font-bold text-slate-900">
              Thông số Thu nhập & Bảo hiểm
            </h2>
            <button
              type="button"
              onClick={handleReset}
              className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-blue-600 cursor-pointer"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Mặc định
            </button>
          </div>

          {validationError && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-xs text-rose-700">
              {validationError}
            </div>
          )}

          {/* Chiều quy đổi */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-700">
                Chế độ quy đổi
              </label>
              <button
                type="button"
                onClick={handleFlipDirection}
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 hover:underline cursor-pointer"
              >
                <ArrowLeftRight className="h-3 w-3" />
                Đảo chiều giữ số tiền
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2 rounded-xl bg-slate-100 p-1">
              {(
                [
                  { id: "GROSS_TO_NET", label: "Gross → Net" },
                  { id: "NET_TO_GROSS", label: "Net → Gross" },
                ] as const
              ).map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setDirection(item.id)}
                  className={cn(
                    "rounded-lg py-2 text-xs font-semibold transition-all cursor-pointer",
                    direction === item.id
                      ? "bg-white text-blue-700 shadow-2xs"
                      : "text-slate-600 hover:text-slate-900"
                  )}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Số tiền lương */}
          <div className="space-y-2">
            <label
              htmlFor="gross-net-salary-input"
              className="block text-xs font-semibold text-slate-700"
            >
              {direction === "GROSS_TO_NET"
                ? "Lương Gross hàng tháng (VNĐ)"
                : "Lương Net mong muốn thực nhận (VNĐ)"}
            </label>
            <div className="relative">
              <Input
                id="gross-net-salary-input"
                type="text"
                inputMode="numeric"
                value={formatNumberVi(salaryAmount)}
                onChange={(e) => handleSalaryTextChange(e.target.value)}
                className="pr-14 text-base font-bold text-slate-900 tabular-nums h-11"
              />
              <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400">
                VNĐ
              </span>
            </div>

            <div className="flex flex-wrap gap-1.5 pt-1">
              {QUICK_SALARY_PRESETS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => {
                    setValidationError(null);
                    setSalaryAmount(preset);
                  }}
                  className={cn(
                    "rounded-full px-2.5 py-1 text-[11px] font-medium border transition-colors cursor-pointer",
                    salaryAmount === preset
                      ? "border-blue-600 bg-blue-50 text-blue-700"
                      : "border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100"
                  )}
                >
                  {preset / 1_000_000} triệu
                </button>
              ))}
            </div>
          </div>

          {/* Mức đóng bảo hiểm */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-700">
              Mức lương đóng Bảo hiểm (BHXH, BHYT, BHTN)
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setInsuranceMode("OFFICIAL")}
                className={cn(
                  "rounded-xl border px-3 py-2.5 text-left text-xs transition-all cursor-pointer",
                  insuranceMode === "OFFICIAL"
                    ? "border-blue-600 bg-blue-50/70 text-blue-900 font-semibold"
                    : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                )}
              >
                Trên lương chính thức
              </button>
              <button
                type="button"
                onClick={() => setInsuranceMode("CUSTOM")}
                className={cn(
                  "rounded-xl border px-3 py-2.5 text-left text-xs transition-all cursor-pointer",
                  insuranceMode === "CUSTOM"
                    ? "border-blue-600 bg-blue-50/70 text-blue-900 font-semibold"
                    : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                )}
              >
                Nhập mức đóng riêng
              </button>
            </div>

            {insuranceMode === "CUSTOM" && (
              <div className="pt-1">
                <div className="relative">
                  <Input
                    type="text"
                    inputMode="numeric"
                    value={formatNumberVi(customInsuranceSalary)}
                    onChange={(e) => handleCustomInsChange(e.target.value)}
                    placeholder="Ví dụ: 5.500.000"
                    className="pr-14 font-semibold tabular-nums"
                  />
                  <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400">
                    VNĐ
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Vùng */}
          <div className="space-y-2">
            <label
              htmlFor="gross-net-region"
              className="block text-xs font-semibold text-slate-700"
            >
              Vùng lương tối thiểu (quy định trần BHTN)
            </label>
            <select
              id="gross-net-region"
              value={region}
              onChange={(e) => setRegion(e.target.value as VietnamRegionCode)}
              className="w-full h-10 rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              {VIETNAM_REGION_LIST.map((r) => (
                <option key={r.code} value={r.code}>
                  {r.label}
                </option>
              ))}
            </select>
            <p className="text-[11px] text-slate-500">
              Địa bàn tiêu biểu {regionCfg.shortLabel}: {regionCfg.examples}. Trần BHXH & BHYT chung:{" "}
              <strong>
                {formatVnd(SALARY_TAX_REGULATORY_INFO.maxBhxhBhytCap)}
              </strong>
              .
            </p>
          </div>

          {/* Số người phụ thuộc */}
          <div className="flex items-center justify-between gap-3 rounded-xl border border-slate-200/80 bg-slate-50/70 px-4 py-3">
            <div>
              <p className="text-xs font-semibold text-slate-800">
                Số người phụ thuộc
              </p>
              <p className="text-[11px] text-slate-500">
                Giảm trừ{" "}
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
                aria-label="Giảm người phụ thuộc"
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
                aria-label="Tăng người phụ thuộc"
              >
                <Plus className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>

          {/* Tùy chọn nâng cao */}
          <div className="border-t border-slate-100 pt-3">
            <button
              type="button"
              onClick={() => setShowAdvanced((v) => !v)}
              className="flex w-full items-center justify-between text-xs font-semibold text-slate-700 hover:text-blue-700 cursor-pointer"
            >
              <span>Tùy chọn nâng cao (Tỷ lệ đóng & Chi phí DN)</span>
              {showAdvanced ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </button>

            {showAdvanced && (
              <div className="mt-3 space-y-3 rounded-xl border border-slate-200/70 bg-slate-50/70 p-3.5">
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">
                      BHXH (%)
                    </label>
                    <Input
                      type="number"
                      min={0}
                      max={30}
                      step={0.5}
                      value={bhxhPct}
                      onChange={(e) =>
                        setBhxhPct(Math.max(0, Number(e.target.value) || 0))
                      }
                      className="h-8 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">
                      BHYT (%)
                    </label>
                    <Input
                      type="number"
                      min={0}
                      max={15}
                      step={0.5}
                      value={bhytPct}
                      onChange={(e) =>
                        setBhytPct(Math.max(0, Number(e.target.value) || 0))
                      }
                      className="h-8 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">
                      BHTN (%)
                    </label>
                    <Input
                      type="number"
                      min={0}
                      max={10}
                      step={0.5}
                      value={bhtnPct}
                      onChange={(e) =>
                        setBhtnPct(Math.max(0, Number(e.target.value) || 0))
                      }
                      className="h-8 text-xs"
                    />
                  </div>
                </div>

                <label className="inline-flex items-center gap-2 text-xs text-slate-700 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={showEmployerCost}
                    onChange={(e) => setShowEmployerCost(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-blue-600"
                  />
                  <span>Hiển thị bảng Chi phí Nhà tuyển dụng trả (21.5%)</span>
                </label>
              </div>
            )}
          </div>
        </div>

        {/* Right Output Breakdown */}
        <div className="xl:col-span-7 space-y-5">
          {/* 4 KPI Summary Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
            <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
              <p className="text-[11px] font-medium text-slate-500">Lương Gross</p>
              <p className="text-base sm:text-lg font-extrabold text-slate-900 mt-1 tabular-nums">
                {formatVnd(result.grossSalary)}
              </p>
            </div>
            <div className="rounded-2xl border border-blue-200 bg-blue-50/70 p-4 shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
              <p className="text-[11px] font-semibold text-blue-700">
                Lương Net thực nhận
              </p>
              <p className="text-base sm:text-lg font-extrabold text-blue-700 mt-1 tabular-nums">
                {formatVnd(result.netSalary)}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
              <p className="text-[11px] font-medium text-slate-500">
                Tổng Bảo hiểm NLĐ
              </p>
              <p className="text-base sm:text-lg font-bold text-amber-700 mt-1 tabular-nums">
                -{formatVnd(result.totalEmployeeInsurance)}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
              <p className="text-[11px] font-medium text-slate-500">Thuế TNCN</p>
              <p className="text-base sm:text-lg font-bold text-rose-700 mt-1 tabular-nums">
                -{formatVnd(result.taxAmount)}
              </p>
            </div>
          </div>

          {/* Cap & Round-trip Precision Notes */}
          {(result.capsApplied.bhxhBhytCapReached ||
            result.capsApplied.bhtnCapReached ||
            direction === "NET_TO_GROSS") && (
            <div className="flex flex-wrap items-center gap-2">
              {direction === "NET_TO_GROSS" && (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[11px] font-semibold text-emerald-700">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Đã kiểm chứng ngược Gross → Net (sai số {formatVnd(result.roundTripDelta)})
                </span>
              )}
              {result.capsApplied.bhxhBhytCapReached && (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-[11px] font-medium text-amber-800">
                  <Info className="h-3.5 w-3.5" />
                  Đã áp dụng trần BHXH/BHYT tối đa:{" "}
                  {formatVnd(result.capsApplied.maxBhxhBhytCap)}
                </span>
              )}
              {result.capsApplied.bhtnCapReached && (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-[11px] font-medium text-sky-800">
                  <Info className="h-3.5 w-3.5" />
                  Đã áp dụng trần BHTN {regionCfg.shortLabel}:{" "}
                  {formatVnd(result.capsApplied.bhtnCap)}
                </span>
              )}
            </div>
          )}

          {/* Bảng Diễn Giải Chi Tiết */}
          <div className="rounded-2xl border border-slate-200/80 bg-white shadow-[0_2px_8px_rgba(0,0,0,0.02)] overflow-hidden">
            <div className="border-b border-slate-100 px-5 py-4 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-900">
                Bảng Diễn Giải Chi Tiết (Gross ↔ Net)
              </h3>
              <span className="text-xs text-slate-500">
                Mức đóng BH: {formatVnd(result.insuranceBaseSalary)}
              </span>
            </div>

            <div className="divide-y divide-slate-100 text-xs sm:text-sm">
              <div className="flex items-center justify-between px-5 py-3 font-semibold text-slate-900 bg-slate-50/50">
                <span>Lương Gross</span>
                <span className="tabular-nums">{formatVnd(result.grossSalary)}</span>
              </div>
              <div className="flex items-center justify-between px-5 py-2.5 text-slate-600">
                <span>Bảo hiểm xã hội (BHXH {bhxhPct}%)</span>
                <span className="tabular-nums text-amber-700">
                  -{formatVnd(result.bhxh)}
                </span>
              </div>
              <div className="flex items-center justify-between px-5 py-2.5 text-slate-600">
                <span>Bảo hiểm y tế (BHYT {bhytPct}%)</span>
                <span className="tabular-nums text-amber-700">
                  -{formatVnd(result.bhyt)}
                </span>
              </div>
              <div className="flex items-center justify-between px-5 py-2.5 text-slate-600">
                <span>
                  Bảo hiểm thất nghiệp (BHTN {bhtnPct}% · {regionCfg.shortLabel})
                </span>
                <span className="tabular-nums text-amber-700">
                  -{formatVnd(result.bhtn)}
                </span>
              </div>
              <div className="flex items-center justify-between px-5 py-3 font-semibold text-slate-800 bg-slate-50/50">
                <span>Thu nhập trước thuế</span>
                <span className="tabular-nums">
                  {formatVnd(result.incomeBeforeTax)}
                </span>
              </div>
              <div className="flex items-center justify-between px-5 py-2.5 text-slate-600">
                <span>Giảm trừ gia cảnh bản thân</span>
                <span className="tabular-nums">
                  -{formatVnd(result.personalDeduction)}
                </span>
              </div>
              <div className="flex items-center justify-between px-5 py-2.5 text-slate-600">
                <span>Giảm trừ người phụ thuộc ({result.dependents} người)</span>
                <span className="tabular-nums">
                  -{formatVnd(result.dependentDeduction)}
                </span>
              </div>
              <div className="flex items-center justify-between px-5 py-3 font-semibold text-slate-800 bg-slate-50/50">
                <span>Thu nhập tính thuế (TNTT)</span>
                <span className="tabular-nums">{formatVnd(result.taxableIncome)}</span>
              </div>
              <div className="flex items-center justify-between px-5 py-2.5 text-rose-700 font-medium">
                <span>Thuế Thu nhập cá nhân (lũy tiến 7 bậc)</span>
                <span className="tabular-nums">-{formatVnd(result.taxAmount)}</span>
              </div>
              <div className="flex items-center justify-between px-5 py-3.5 font-bold text-blue-700 bg-blue-50/70">
                <span>Lương Net thực nhận</span>
                <span className="text-base tabular-nums">
                  {formatVnd(result.netSalary)}
                </span>
              </div>
            </div>
          </div>

          {/* Biểu thuế TNCN 7 bậc */}
          <PitBracketsTable
            brackets={result.pitBrackets}
            totalTax={result.taxAmount}
          />

          {/* Bảng Chi phí Doanh nghiệp */}
          {showEmployerCost && (
            <div className="rounded-2xl border border-slate-200/80 bg-white shadow-[0_2px_8px_rgba(0,0,0,0.02)] overflow-hidden">
              <div className="border-b border-slate-100 px-5 py-4 flex items-center gap-2">
                <Building2 className="h-4 w-4 text-slate-600" />
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">
                    Chi phí Nhà Tuyển Dụng chi trả (Tham khảo)
                  </h3>
                  <p className="text-xs text-slate-500">
                    Ngoài lương Gross, doanh nghiệp đóng thêm 21.5% bảo hiểm bắt buộc (có áp trần vùng).
                  </p>
                </div>
              </div>
              <div className="divide-y divide-slate-100 text-xs sm:text-sm">
                <div className="flex items-center justify-between px-5 py-2.5 text-slate-700">
                  <span>Lương Gross trả người lao động</span>
                  <span className="tabular-nums font-medium">
                    {formatVnd(result.grossSalary)}
                  </span>
                </div>
                <div className="flex items-center justify-between px-5 py-2.5 text-slate-600">
                  <span>BHXH Doanh nghiệp đóng (17.5%)</span>
                  <span className="tabular-nums">
                    +{formatVnd(result.employerCost.bhxh)}
                  </span>
                </div>
                <div className="flex items-center justify-between px-5 py-2.5 text-slate-600">
                  <span>BHYT Doanh nghiệp đóng (3%)</span>
                  <span className="tabular-nums">
                    +{formatVnd(result.employerCost.bhyt)}
                  </span>
                </div>
                <div className="flex items-center justify-between px-5 py-2.5 text-slate-600">
                  <span>BHTN Doanh nghiệp đóng (1%)</span>
                  <span className="tabular-nums">
                    +{formatVnd(result.employerCost.bhtn)}
                  </span>
                </div>
                <div className="flex items-center justify-between px-5 py-3.5 font-bold text-slate-900 bg-slate-50">
                  <span>Tổng chi phí Doanh nghiệp</span>
                  <span className="tabular-nums">
                    {formatVnd(result.employerCost.totalCost)}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

