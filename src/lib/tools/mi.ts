import {
  MI_CATEGORY_ORDER,
  MI_PROFILES,
  MI_QUESTIONS,
  type MiCategoryKey,
  type MiCategoryMeta,
} from "@/constants/mi";

export interface MiCategoryScoreItem {
  category: MiCategoryKey;
  nameVi: string;
  shortLabel: string;
  englishTag: string;
  colorHex: string;
  badgeClass: string;
  barClass: string;
  rawScore: number;
  maxScore: number;
  percentage: number; // 0..100
  rank: number; // 1..8
  meta: MiCategoryMeta;
}

export interface MiComputedResult {
  topCode: MiCategoryKey;
  topNameVi: string;
  summary: string;
  ranked: MiCategoryScoreItem[];
  top3: MiCategoryScoreItem[];
  byCategory: Record<MiCategoryKey, number>; // percentage 0..100
}

export function validateMiAnswers(answers: Record<string, unknown>): {
  valid: boolean;
  missingIds: string[];
  normalized: Record<string, 1 | 2 | 3 | 4 | 5>;
} {
  const missingIds: string[] = [];
  const normalized: Record<string, 1 | 2 | 3 | 4 | 5> = {};

  for (const question of MI_QUESTIONS) {
    const raw = Number(answers[question.id]);
    if (!Number.isInteger(raw) || raw < 1 || raw > 5) {
      missingIds.push(question.id);
    } else {
      normalized[question.id] = raw as 1 | 2 | 3 | 4 | 5;
    }
  }

  return {
    valid: missingIds.length === 0,
    missingIds,
    normalized,
  };
}

export function calculateMiResult(
  answers: Record<string, unknown>
): MiComputedResult {
  const { valid, missingIds, normalized } = validateMiAnswers(answers);
  if (!valid) {
    throw new Error(
      `Vui lòng hoàn thành đủ ${MI_QUESTIONS.length} phát biểu MI (còn thiếu ${missingIds.length} câu).`
    );
  }

  const sums: Record<MiCategoryKey, number> = {
    LINGUISTIC: 0,
    LOGICAL_MATHEMATICAL: 0,
    VISUAL_SPATIAL: 0,
    MUSICAL: 0,
    BODILY_KINESTHETIC: 0,
    INTERPERSONAL: 0,
    INTRAPERSONAL: 0,
    NATURALIST: 0,
  };

  const counts: Record<MiCategoryKey, number> = {
    LINGUISTIC: 0,
    LOGICAL_MATHEMATICAL: 0,
    VISUAL_SPATIAL: 0,
    MUSICAL: 0,
    BODILY_KINESTHETIC: 0,
    INTERPERSONAL: 0,
    INTRAPERSONAL: 0,
    NATURALIST: 0,
  };

  for (const question of MI_QUESTIONS) {
    const value = normalized[question.id];
    sums[question.category] += value;
    counts[question.category] += 1;
  }

  const unsorted: Array<Omit<MiCategoryScoreItem, "rank">> =
    MI_CATEGORY_ORDER.map((key) => {
      const meta = MI_PROFILES[key];
      const rawScore = sums[key];
      const maxScore = (counts[key] || 5) * 5;
      const percentage = Math.round((rawScore / maxScore) * 100);
      return {
        category: key,
        nameVi: meta.nameVi,
        shortLabel: meta.shortLabel,
        englishTag: meta.englishTag,
        colorHex: meta.colorHex,
        badgeClass: meta.badgeClass,
        barClass: meta.barClass,
        rawScore,
        maxScore,
        percentage,
        meta,
      };
    });

  const sorted = [...unsorted].sort((a, b) => {
    if (b.percentage !== a.percentage) return b.percentage - a.percentage;
    if (b.rawScore !== a.rawScore) return b.rawScore - a.rawScore;
    return (
      MI_CATEGORY_ORDER.indexOf(a.category) -
      MI_CATEGORY_ORDER.indexOf(b.category)
    );
  });

  const ranked: MiCategoryScoreItem[] = sorted.map((item, idx) => ({
    ...item,
    rank: idx + 1,
  }));

  const byCategory = {} as Record<MiCategoryKey, number>;
  for (const item of ranked) {
    byCategory[item.category] = item.percentage;
  }

  const top3 = ranked.slice(0, 3);
  const top1 = top3[0];

  return {
    topCode: top1.category,
    topNameVi: top1.nameVi,
    summary: `Top 3 nổi trội: ${top3
      .map((item) => `${item.shortLabel} (${item.percentage}%)`)
      .join(" · ")}`,
    ranked,
    top3,
    byCategory,
  };
}

