import {
  DEFAULT_EMPLOYEE_INSURANCE_RATES,
  DEFAULT_EMPLOYER_INSURANCE_RATES,
  PIT_BRACKETS,
  SALARY_TAX_REGULATORY_INFO,
  VIETNAM_REGIONS,
  type PitBracketConfig,
  type VietnamRegionCode,
} from "@/constants/salaryTaxConfig";

export type SalaryDirection = "GROSS_TO_NET" | "NET_TO_GROSS";
export type InsuranceBaseMode = "OFFICIAL" | "CUSTOM";

export interface PitBracketBreakdown extends PitBracketConfig {
  taxablePortion: number;
  taxAmount: number;
  isActive: boolean;
}

export interface PitCalculationResult {
  taxableIncome: number;
  totalTax: number;
  brackets: PitBracketBreakdown[];
}

export interface SalaryInsuranceRates {
  bhxh: number;
  bhyt: number;
  bhtn: number;
}

export interface GrossNetCalculationInput {
  amount: number;
  direction: SalaryDirection;
  region: VietnamRegionCode;
  dependents: number;
  insuranceMode?: InsuranceBaseMode;
  customInsuranceSalary?: number;
  employeeRates?: Partial<SalaryInsuranceRates>;
}

export interface GrossNetCalculationResult {
  direction: SalaryDirection;
  region: VietnamRegionCode;
  grossSalary: number;
  netSalary: number;
  insuranceBaseSalary: number;
  insuranceMode: InsuranceBaseMode;
  bhxh: number;
  bhyt: number;
  bhtn: number;
  totalEmployeeInsurance: number;
  incomeBeforeTax: number;
  personalDeduction: number;
  dependents: number;
  dependentDeduction: number;
  totalFamilyDeduction: number;
  taxableIncome: number;
  taxAmount: number;
  pitBrackets: PitBracketBreakdown[];
  effectiveTaxRate: number;
  employerCost: {
    bhxh: number;
    bhyt: number;
    bhtn: number;
    totalInsurance: number;
    totalCost: number;
  };
  capsApplied: {
    bhxhBhytCapReached: boolean;
    bhtnCapReached: boolean;
    maxBhxhBhytCap: number;
    bhtnCap: number;
  };
  roundTripDelta: number;
}

export interface StandalonePitInput {
  grossIncome: number;
  insuranceAmount: number;
  dependents: number;
  personalDeduction?: number;
  dependentDeductionPerPerson?: number;
  otherDeductions?: number;
}

export interface StandalonePitResult {
  grossIncome: number;
  insuranceAmount: number;
  dependents: number;
  personalDeduction: number;
  dependentDeduction: number;
  otherDeductions: number;
  totalDeductions: number;
  taxableIncome: number;
  taxAmount: number;
  effectiveTaxRate: number;
  netIncome: number;
  pitBrackets: PitBracketBreakdown[];
  annual: {
    grossIncome: number;
    insuranceAmount: number;
    totalDeductions: number;
    taxableIncome: number;
    taxAmount: number;
    netIncome: number;
  };
}

export function formatVnd(amount: number): string {
  const safe = Number.isFinite(amount) ? Math.round(amount) : 0;
  return `${new Intl.NumberFormat("vi-VN").format(safe)} đ`;
}

export function formatNumberVi(amount: number): string {
  const safe = Number.isFinite(amount) ? Math.round(amount) : 0;
  return new Intl.NumberFormat("vi-VN").format(safe);
}

export function parseCurrencyInput(raw: string): number {
  const digits = raw.replace(/[^\d]/g, "");
  if (!digits) return 0;
  const parsed = Number.parseInt(digits, 10);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
}

function clampNonNegative(value: number): number {
  if (!Number.isFinite(value) || value < 0) return 0;
  return value;
}

/**
 * Tính thuế TNCN lũy tiến từng phần 7 bậc từ Thu nhập tính thuế (TNTT).
 */
export function calculatePIT(taxableIncomeRaw: number): PitCalculationResult {
  const taxableIncome = Math.max(0, Math.round(taxableIncomeRaw));
  let totalTaxFloat = 0;

  const brackets: PitBracketBreakdown[] = PIT_BRACKETS.map((bracket) => {
    const upper =
      bracket.maxInclusive === null ? Number.POSITIVE_INFINITY : bracket.maxInclusive;
    const taxablePortion =
      taxableIncome > bracket.minExclusive
        ? Math.min(taxableIncome, upper) - bracket.minExclusive
        : 0;
    const taxAmountFloat = taxablePortion * bracket.rate;
    totalTaxFloat += taxAmountFloat;

    return {
      ...bracket,
      taxablePortion,
      taxAmount: Math.round(taxAmountFloat),
      isActive: taxablePortion > 0,
    };
  });

  return {
    taxableIncome,
    totalTax: Math.round(totalTaxFloat),
    brackets,
  };
}

/**
 * Nghịch đảo hàm lũy tiến 7 bậc thuế TNCN:
 * Từ Net mong muốn + Tổng giảm trừ gia cảnh → Thu nhập trước thuế (trước khi trừ thuế).
 */
export function invertTaxFromNet(
  netSalaryRaw: number,
  totalFamilyDeductionRaw: number
): number {
  const netSalary = clampNonNegative(netSalaryRaw);
  const totalFamilyDeduction = clampNonNegative(totalFamilyDeductionRaw);

  if (netSalary <= totalFamilyDeduction) {
    return netSalary;
  }

  let remainingAfterTaxOverDeduction = netSalary - totalFamilyDeduction;
  let taxableIncome = 0;

  for (const bracket of PIT_BRACKETS) {
    if (bracket.maxInclusive === null) {
      taxableIncome += remainingAfterTaxOverDeduction / (1 - bracket.rate);
      remainingAfterTaxOverDeduction = 0;
      break;
    }

    const bracketWidth = bracket.maxInclusive - bracket.minExclusive;
    const maxNetSlice = bracketWidth * (1 - bracket.rate);

    if (remainingAfterTaxOverDeduction <= maxNetSlice + 1e-9) {
      taxableIncome += remainingAfterTaxOverDeduction / (1 - bracket.rate);
      remainingAfterTaxOverDeduction = 0;
      break;
    }

    taxableIncome += bracketWidth;
    remainingAfterTaxOverDeduction -= maxNetSlice;
  }

  return totalFamilyDeduction + taxableIncome;
}

function resolveEmployeeRates(
  overrides?: Partial<SalaryInsuranceRates>
): SalaryInsuranceRates {
  return {
    bhxh: clampNonNegative(
      overrides?.bhxh ?? DEFAULT_EMPLOYEE_INSURANCE_RATES.bhxh
    ),
    bhyt: clampNonNegative(
      overrides?.bhyt ?? DEFAULT_EMPLOYEE_INSURANCE_RATES.bhyt
    ),
    bhtn: clampNonNegative(
      overrides?.bhtn ?? DEFAULT_EMPLOYEE_INSURANCE_RATES.bhtn
    ),
  };
}

function computeEmployeeInsurance(
  insuranceBase: number,
  region: VietnamRegionCode,
  rates: SalaryInsuranceRates
) {
  const regionCfg = VIETNAM_REGIONS[region] || VIETNAM_REGIONS.I;
  const maxBhxhBhytCap = SALARY_TAX_REGULATORY_INFO.maxBhxhBhytCap;
  const bhtnCap = regionCfg.bhtnCap;

  const bhxhBase = Math.min(insuranceBase, maxBhxhBhytCap);
  const bhtnBase = Math.min(insuranceBase, bhtnCap);

  const bhxh = Math.round(bhxhBase * rates.bhxh);
  const bhyt = Math.round(bhxhBase * rates.bhyt);
  const bhtn = Math.round(bhtnBase * rates.bhtn);

  return {
    bhxh,
    bhyt,
    bhtn,
    total: bhxh + bhyt + bhtn,
    bhxhBhytCapReached: insuranceBase > maxBhxhBhytCap,
    bhtnCapReached: insuranceBase > bhtnCap,
    maxBhxhBhytCap,
    bhtnCap,
  };
}

/**
 * Tính lương Gross → Net theo quy định Việt Nam.
 */
export function calculateGrossToNet(
  input: Omit<GrossNetCalculationInput, "direction">
): GrossNetCalculationResult {
  const grossSalary = Math.round(clampNonNegative(input.amount));
  const dependents = Math.max(0, Math.floor(clampNonNegative(input.dependents)));
  const region = input.region || "I";
  const insuranceMode: InsuranceBaseMode = input.insuranceMode || "OFFICIAL";
  const insuranceBaseSalary =
    insuranceMode === "CUSTOM"
      ? Math.round(clampNonNegative(input.customInsuranceSalary ?? 0))
      : grossSalary;
  const rates = resolveEmployeeRates(input.employeeRates);

  const empIns = computeEmployeeInsurance(insuranceBaseSalary, region, rates);
  const incomeBeforeTax = Math.max(0, grossSalary - empIns.total);

  const personalDeduction = SALARY_TAX_REGULATORY_INFO.personalDeduction;
  const dependentDeduction =
    dependents * SALARY_TAX_REGULATORY_INFO.dependentDeduction;
  const totalFamilyDeduction = personalDeduction + dependentDeduction;

  const taxableIncome = Math.max(0, incomeBeforeTax - totalFamilyDeduction);
  const pit = calculatePIT(taxableIncome);
  const netSalary = Math.max(0, incomeBeforeTax - pit.totalTax);

  // Chi phí Doanh nghiệp đóng thêm
  const employerBhxhBase = Math.min(insuranceBaseSalary, empIns.maxBhxhBhytCap);
  const employerBhtnBase = Math.min(insuranceBaseSalary, empIns.bhtnCap);
  const empErBhxh = Math.round(
    employerBhxhBase * DEFAULT_EMPLOYER_INSURANCE_RATES.bhxh
  );
  const empErBhyt = Math.round(
    employerBhxhBase * DEFAULT_EMPLOYER_INSURANCE_RATES.bhyt
  );
  const empErBhtn = Math.round(
    employerBhtnBase * DEFAULT_EMPLOYER_INSURANCE_RATES.bhtn
  );
  const empErTotal = empErBhxh + empErBhyt + empErBhtn;

  return {
    direction: "GROSS_TO_NET",
    region,
    grossSalary,
    netSalary,
    insuranceBaseSalary,
    insuranceMode,
    bhxh: empIns.bhxh,
    bhyt: empIns.bhyt,
    bhtn: empIns.bhtn,
    totalEmployeeInsurance: empIns.total,
    incomeBeforeTax,
    personalDeduction,
    dependents,
    dependentDeduction,
    totalFamilyDeduction,
    taxableIncome,
    taxAmount: pit.totalTax,
    pitBrackets: pit.brackets,
    effectiveTaxRate: grossSalary > 0 ? (pit.totalTax / grossSalary) * 100 : 0,
    employerCost: {
      bhxh: empErBhxh,
      bhyt: empErBhyt,
      bhtn: empErBhtn,
      totalInsurance: empErTotal,
      totalCost: grossSalary + empErTotal,
    },
    capsApplied: {
      bhxhBhytCapReached: empIns.bhxhBhytCapReached,
      bhtnCapReached: empIns.bhtnCapReached,
      maxBhxhBhytCap: empIns.maxBhxhBhytCap,
      bhtnCap: empIns.bhtnCap,
    },
    roundTripDelta: 0,
  };
}

/**
 * Tính lương Net → Gross theo 2 bước:
 * B1: Nghịch đảo Thuế TNCN lũy tiến 7 bậc để ra Thu nhập trước thuế.
 * B2: Giải ngược phương trình Bảo hiểm có xét ngưỡng trần BHXH/BHYT & trần BHTN theo vùng,
 *     sau đó tinh chỉnh lân cận vài đồng và kiểm chứng lại bằng hàm Gross → Net.
 */
export function calculateNetToGross(
  input: Omit<GrossNetCalculationInput, "direction">
): GrossNetCalculationResult {
  const targetNet = Math.round(clampNonNegative(input.amount));
  const dependents = Math.max(0, Math.floor(clampNonNegative(input.dependents)));
  const region = input.region || "I";
  const insuranceMode: InsuranceBaseMode = input.insuranceMode || "OFFICIAL";
  const rates = resolveEmployeeRates(input.employeeRates);

  const personalDeduction = SALARY_TAX_REGULATORY_INFO.personalDeduction;
  const dependentDeduction =
    dependents * SALARY_TAX_REGULATORY_INFO.dependentDeduction;
  const totalFamilyDeduction = personalDeduction + dependentDeduction;

  const targetIncomeBeforeTax = invertTaxFromNet(targetNet, totalFamilyDeduction);

  let grossCandidate: number;

  if (insuranceMode === "CUSTOM") {
    const customBase = Math.round(
      clampNonNegative(input.customInsuranceSalary ?? 0)
    );
    const fixedIns = computeEmployeeInsurance(customBase, region, rates).total;
    grossCandidate = targetIncomeBeforeTax + fixedIns;
  } else {
    const maxBhxhBhytCap = SALARY_TAX_REGULATORY_INFO.maxBhxhBhytCap;
    const bhtnCap = (VIETNAM_REGIONS[region] || VIETNAM_REGIONS.I).bhtnCap;
    const lowerCap = Math.min(maxBhxhBhytCap, bhtnCap);
    const upperCap = Math.max(maxBhxhBhytCap, bhtnCap);

    const fAtLowerCap =
      lowerCap - computeEmployeeInsurance(lowerCap, region, rates).total;
    const fAtUpperCap =
      upperCap - computeEmployeeInsurance(upperCap, region, rates).total;

    if (targetIncomeBeforeTax <= fAtLowerCap) {
      const totalRate = rates.bhxh + rates.bhyt + rates.bhtn;
      grossCandidate = targetIncomeBeforeTax / Math.max(0.01, 1 - totalRate);
    } else if (targetIncomeBeforeTax <= fAtUpperCap) {
      if (maxBhxhBhytCap <= bhtnCap) {
        const fixedBhxhBhyt = Math.round(
          maxBhxhBhytCap * (rates.bhxh + rates.bhyt)
        );
        grossCandidate =
          (targetIncomeBeforeTax + fixedBhxhBhyt) /
          Math.max(0.01, 1 - rates.bhtn);
      } else {
        const fixedBhtn = Math.round(bhtnCap * rates.bhtn);
        grossCandidate =
          (targetIncomeBeforeTax + fixedBhtn) /
          Math.max(0.01, 1 - (rates.bhxh + rates.bhyt));
      }
    } else {
      const maxTotalIns = computeEmployeeInsurance(
        upperCap,
        region,
        rates
      ).total;
      grossCandidate = targetIncomeBeforeTax + maxTotalIns;
    }
  }

  // Tinh chỉnh số nguyên quanh nghiệm giải tích để đảm bảo kiểm chứng Gross -> Net sát nhất (<= 1đ)
  const roundedCenter = Math.max(0, Math.round(grossCandidate));
  let bestResult = calculateGrossToNet({
    ...input,
    amount: roundedCenter,
  });
  let bestDiff = Math.abs(bestResult.netSalary - targetNet);

  for (let delta = -4; delta <= 4; delta += 1) {
    const probe = roundedCenter + delta;
    if (probe < 0) continue;
    const candidateRes = calculateGrossToNet({
      ...input,
      amount: probe,
    });
    const diff = Math.abs(candidateRes.netSalary - targetNet);
    if (
      diff < bestDiff ||
      (diff === bestDiff && candidateRes.grossSalary < bestResult.grossSalary)
    ) {
      bestResult = candidateRes;
      bestDiff = diff;
    }
    if (bestDiff === 0) break;
  }

  return {
    ...bestResult,
    direction: "NET_TO_GROSS",
    roundTripDelta: bestDiff,
  };
}

export function calculateGrossNetSalary(
  input: GrossNetCalculationInput
): GrossNetCalculationResult {
  if (input.direction === "NET_TO_GROSS") {
    return calculateNetToGross(input);
  }
  return calculateGrossToNet(input);
}

/**
 * Tính Thuế TNCN độc lập cho TOOL-04 (/tools/tax), dùng chung calculatePIT với TOOL-03.
 */
export function calculateStandalonePIT(
  input: StandalonePitInput
): StandalonePitResult {
  const grossIncome = Math.round(clampNonNegative(input.grossIncome));
  const insuranceAmount = Math.round(clampNonNegative(input.insuranceAmount));
  const dependents = Math.max(0, Math.floor(clampNonNegative(input.dependents)));
  const personalDeduction = Math.round(
    clampNonNegative(
      input.personalDeduction ?? SALARY_TAX_REGULATORY_INFO.personalDeduction
    )
  );
  const dependentDeductionPerPerson = Math.round(
    clampNonNegative(
      input.dependentDeductionPerPerson ??
        SALARY_TAX_REGULATORY_INFO.dependentDeduction
    )
  );
  const otherDeductions = Math.round(clampNonNegative(input.otherDeductions ?? 0));

  const dependentDeduction = dependents * dependentDeductionPerPerson;
  const totalDeductions =
    personalDeduction + dependentDeduction + insuranceAmount + otherDeductions;
  const taxableIncome = Math.max(0, grossIncome - totalDeductions);
  const pit = calculatePIT(taxableIncome);
  const netIncome = Math.max(0, grossIncome - insuranceAmount - pit.totalTax);
  const effectiveTaxRate = grossIncome > 0 ? (pit.totalTax / grossIncome) * 100 : 0;

  return {
    grossIncome,
    insuranceAmount,
    dependents,
    personalDeduction,
    dependentDeduction,
    otherDeductions,
    totalDeductions,
    taxableIncome,
    taxAmount: pit.totalTax,
    effectiveTaxRate,
    netIncome,
    pitBrackets: pit.brackets,
    annual: {
      grossIncome: grossIncome * 12,
      insuranceAmount: insuranceAmount * 12,
      totalDeductions: totalDeductions * 12,
      taxableIncome: taxableIncome * 12,
      taxAmount: pit.totalTax * 12,
      netIncome: netIncome * 12,
    },
  };
}

