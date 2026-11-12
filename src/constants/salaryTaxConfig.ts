/**
 * Hằng số pháp quy Việt Nam cho Công cụ Tính lương Gross ↔ Net & Thuế TNCN
 * Được tách riêng để dễ dàng cập nhật khi Nhà nước điều chỉnh lương cơ sở,
 * lương tối thiểu vùng hoặc mức giảm trừ gia cảnh.
 */

export type VietnamRegionCode = "I" | "II" | "III" | "IV";

export interface RegionWageConfig {
  code: VietnamRegionCode;
  label: string;
  shortLabel: string;
  minWage: number;
  bhtnCap: number;
  examples: string;
}

export interface PitBracketConfig {
  level: number;
  label: string;
  minExclusive: number;
  maxInclusive: number | null; // null = không giới hạn trên
  rate: number; // 0.05 -> 5%
}

export const SALARY_TAX_REGULATORY_INFO = {
  effectiveFrom: "01/07/2024",
  legalBasis:
    "Nghị định 73/2024/NĐ-CP (lương cơ sở 2.340.000đ) & Nghị định 74/2024/NĐ-CP (lương tối thiểu vùng), Luật Thuế TNCN (NQ 954/2020/UBTVQH14)",
  personalDeduction: 11_000_000,
  dependentDeduction: 4_400_000,
  baseSalary: 2_340_000,
  bhxhBhytCapMultiplier: 20,
  bhtnCapMultiplier: 20,
  maxBhxhBhytCap: 46_800_000, // 20 x 2.340.000
} as const;

export const DEFAULT_EMPLOYEE_INSURANCE_RATES = {
  bhxh: 0.08, // 8%
  bhyt: 0.015, // 1.5%
  bhtn: 0.01, // 1%
} as const;

export const DEFAULT_EMPLOYER_INSURANCE_RATES = {
  bhxh: 0.175, // 17.5% (14% hưu trí tử tuất + 3% ốm đau thai sản + 0.5% BNN)
  bhyt: 0.03, // 3%
  bhtn: 0.01, // 1%
} as const;

export const VIETNAM_REGIONS: Record<VietnamRegionCode, RegionWageConfig> = {
  I: {
    code: "I",
    label: "Vùng I — 4.960.000đ (Trần BHTN: 99.200.000đ)",
    shortLabel: "Vùng I",
    minWage: 4_960_000,
    bhtnCap: 99_200_000,
    examples: "Hà Nội, TP.HCM, Hải Phòng, Bình Dương, Đồng Nai...",
  },
  II: {
    code: "II",
    label: "Vùng II — 4.410.000đ (Trần BHTN: 88.200.000đ)",
    shortLabel: "Vùng II",
    minWage: 4_410_000,
    bhtnCap: 88_200_000,
    examples: "Đà Nẵng, Cần Thơ, Hải Dương, Bắc Ninh, Thừa Thiên Huế...",
  },
  III: {
    code: "III",
    label: "Vùng III — 3.860.000đ (Trần BHTN: 77.200.000đ)",
    shortLabel: "Vùng III",
    minWage: 3_860_000,
    bhtnCap: 77_200_000,
    examples: "Các TP thuộc tỉnh còn lại, các huyện vùng ven công nghiệp...",
  },
  IV: {
    code: "IV",
    label: "Vùng IV — 3.450.000đ (Trần BHTN: 69.000.000đ)",
    shortLabel: "Vùng IV",
    minWage: 3_450_000,
    bhtnCap: 69_000_000,
    examples: "Các địa bàn nông thôn, miền núi còn lại",
  },
};

export const VIETNAM_REGION_LIST: RegionWageConfig[] = [
  VIETNAM_REGIONS.I,
  VIETNAM_REGIONS.II,
  VIETNAM_REGIONS.III,
  VIETNAM_REGIONS.IV,
];

export const PIT_BRACKETS: PitBracketConfig[] = [
  {
    level: 1,
    label: "Đến 5 triệu VNĐ",
    minExclusive: 0,
    maxInclusive: 5_000_000,
    rate: 0.05,
  },
  {
    level: 2,
    label: "Trên 5 triệu đến 10 triệu VNĐ",
    minExclusive: 5_000_000,
    maxInclusive: 10_000_000,
    rate: 0.1,
  },
  {
    level: 3,
    label: "Trên 10 triệu đến 18 triệu VNĐ",
    minExclusive: 10_000_000,
    maxInclusive: 18_000_000,
    rate: 0.15,
  },
  {
    level: 4,
    label: "Trên 18 triệu đến 32 triệu VNĐ",
    minExclusive: 18_000_000,
    maxInclusive: 32_000_000,
    rate: 0.2,
  },
  {
    level: 5,
    label: "Trên 32 triệu đến 52 triệu VNĐ",
    minExclusive: 32_000_000,
    maxInclusive: 52_000_000,
    rate: 0.25,
  },
  {
    level: 6,
    label: "Trên 52 triệu đến 80 triệu VNĐ",
    minExclusive: 52_000_000,
    maxInclusive: 80_000_000,
    rate: 0.3,
  },
  {
    level: 7,
    label: "Trên 80 triệu VNĐ",
    minExclusive: 80_000_000,
    maxInclusive: null,
    rate: 0.35,
  },
];

export const QUICK_SALARY_PRESETS = [
  10_000_000,
  15_000_000,
  20_000_000,
  30_000_000,
  60_000_000,
] as const;

export const QUICK_TAX_EXAMPLES = [
  {
    id: "15m-0dep",
    label: "Lương 15 triệu · 0 phụ thuộc",
    grossIncome: 15_000_000,
    dependents: 0,
    autoInsurance: true,
    insuranceAmount: 1_575_000,
    otherDeductions: 0,
  },
  {
    id: "25m-1dep",
    label: "Lương 25 triệu · 1 phụ thuộc",
    grossIncome: 25_000_000,
    dependents: 1,
    autoInsurance: true,
    insuranceAmount: 2_625_000,
    otherDeductions: 0,
  },
  {
    id: "40m-2dep",
    label: "Lương 40 triệu · 2 phụ thuộc",
    grossIncome: 40_000_000,
    dependents: 2,
    autoInsurance: true,
    insuranceAmount: 4_200_000,
    otherDeductions: 0,
  },
] as const;

