import {
  MBTI_AXIS_META,
  MBTI_AXIS_ORDER,
  MBTI_PROFILES,
  MBTI_QUESTIONS,
  type MbtiAxis,
  type MbtiCode,
  type MbtiPole,
  type MbtiTypeProfile,
} from "@/constants/mbti";

export interface MbtiAxisBreakdown {
  axis: MbtiAxis;
  title: string;
  leftPole: MbtiPole;
  rightPole: MbtiPole;
  leftLabel: string;
  rightLabel: string;
  leftCount: number;
  rightCount: number;
  leftPct: number;
  rightPct: number;
  winnerPole: MbtiPole;
  isTie: boolean;
  tieBreakerNote?: string;
}

export interface MbtiComputedResult {
  code: MbtiCode;
  nameVi: string;
  summary: string;
  hasBalancedAxis: boolean;
  axes: MbtiAxisBreakdown[];
  profile: MbtiTypeProfile;
}

export function validateMbtiAnswers(answers: Record<string, unknown>): {
  valid: boolean;
  missingIds: string[];
  normalized: Record<string, "A" | "B">;
} {
  const missingIds: string[] = [];
  const normalized: Record<string, "A" | "B"> = {};

  for (const question of MBTI_QUESTIONS) {
    const raw = answers[question.id];
    const upper = typeof raw === "string" ? raw.trim().toUpperCase() : "";
    if (upper !== "A" && upper !== "B") {
      missingIds.push(question.id);
    } else {
      normalized[question.id] = upper;
    }
  }

  return {
    valid: missingIds.length === 0,
    missingIds,
    normalized,
  };
}

export function calculateMbtiResult(
  answers: Record<string, unknown>
): MbtiComputedResult {
  const { valid, missingIds, normalized } = validateMbtiAnswers(answers);
  if (!valid) {
    throw new Error(
      `Vui lòng hoàn thành đủ ${MBTI_QUESTIONS.length} câu hỏi MBTI (còn thiếu ${missingIds.length} câu).`
    );
  }

  const poleCounts: Record<MbtiPole, number> = {
    E: 0,
    I: 0,
    S: 0,
    N: 0,
    T: 0,
    F: 0,
    J: 0,
    P: 0,
  };

  for (const question of MBTI_QUESTIONS) {
    const choice = normalized[question.id];
    const chosenPole =
      choice === "A" ? question.optionA.pole : question.optionB.pole;
    poleCounts[chosenPole] += 1;
  }

  const axes: MbtiAxisBreakdown[] = MBTI_AXIS_ORDER.map((axisKey) => {
    const meta = MBTI_AXIS_META[axisKey];
    const leftCount = poleCounts[meta.leftPole];
    const rightCount = poleCounts[meta.rightPole];
    const total = leftCount + rightCount || 1;
    const leftPct = Math.round((leftCount / total) * 100);
    const rightPct = 100 - leftPct;
    const isTie = leftCount === rightCount;
    const winnerPole = isTie
      ? meta.tieBreakerPole
      : leftCount > rightCount
        ? meta.leftPole
        : meta.rightPole;

    return {
      axis: axisKey,
      title: meta.title,
      leftPole: meta.leftPole,
      rightPole: meta.rightPole,
      leftLabel: meta.leftLabel,
      rightLabel: meta.rightLabel,
      leftCount,
      rightCount,
      leftPct,
      rightPct,
      winnerPole,
      isTie,
      tieBreakerNote: isTie ? meta.tieBreakerNote : undefined,
    };
  });

  const code = axes.map((a) => a.winnerPole).join("") as MbtiCode;
  const profile = MBTI_PROFILES[code];
  const hasBalancedAxis = axes.some((a) => a.isTie);

  return {
    code,
    nameVi: profile.nameVi,
    summary: `${code} — ${profile.nameVi}: ${profile.tagline}`,
    hasBalancedAxis,
    axes,
    profile,
  };
}

