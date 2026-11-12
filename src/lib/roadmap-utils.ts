import {
  ROADMAP_GOAL_CATEGORIES,
  ROADMAP_GOAL_PRIORITIES,
  ROADMAP_GOAL_STATUSES,
  RoadmapGoalCategory,
  RoadmapGoalPriority,
  RoadmapGoalStatus,
} from "@/constants";
import type {
  IRoadmapProgressBreakdownDTO,
  IRoadmapYearDTO,
  IRoadmapYearProgressDTO,
} from "@/types";

export const GOAL_CATEGORY_META: Record<
  RoadmapGoalCategory,
  { label: string; badgeClass: string }
> = {
  [ROADMAP_GOAL_CATEGORIES.ACADEMIC]: {
    label: "Học thuật",
    badgeClass: "bg-blue-50 text-blue-700 border-blue-200",
  },
  [ROADMAP_GOAL_CATEGORIES.SKILL]: {
    label: "Kỹ năng",
    badgeClass: "bg-indigo-50 text-indigo-700 border-indigo-200",
  },
  [ROADMAP_GOAL_CATEGORIES.CERTIFICATE]: {
    label: "Chứng chỉ",
    badgeClass: "bg-amber-50 text-amber-700 border-amber-200",
  },
  [ROADMAP_GOAL_CATEGORIES.EXPERIENCE]: {
    label: "Trải nghiệm",
    badgeClass: "bg-purple-50 text-purple-700 border-purple-200",
  },
  [ROADMAP_GOAL_CATEGORIES.CAREER]: {
    label: "Nghề nghiệp",
    badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
};

export const GOAL_PRIORITY_META: Record<
  RoadmapGoalPriority,
  { label: string; badgeClass: string }
> = {
  [ROADMAP_GOAL_PRIORITIES.HIGH]: {
    label: "Ưu tiên cao",
    badgeClass: "bg-rose-50 text-rose-700 border-rose-200",
  },
  [ROADMAP_GOAL_PRIORITIES.MEDIUM]: {
    label: "Trung bình",
    badgeClass: "bg-amber-50 text-amber-700 border-amber-200",
  },
  [ROADMAP_GOAL_PRIORITIES.LOW]: {
    label: "Bổ sung",
    badgeClass: "bg-slate-100 text-slate-600 border-slate-200",
  },
};

export const GOAL_STATUS_META: Record<
  RoadmapGoalStatus,
  { label: string; badgeClass: string }
> = {
  [ROADMAP_GOAL_STATUSES.NOT_STARTED]: {
    label: "Chưa bắt đầu",
    badgeClass: "bg-slate-100 text-slate-700 border-slate-200",
  },
  [ROADMAP_GOAL_STATUSES.IN_PROGRESS]: {
    label: "Đang thực hiện",
    badgeClass: "bg-sky-50 text-sky-700 border-sky-200",
  },
  [ROADMAP_GOAL_STATUSES.COMPLETED]: {
    label: "Hoàn thành",
    badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  [ROADMAP_GOAL_STATUSES.SKIPPED]: {
    label: "Bỏ qua",
    badgeClass: "bg-zinc-100 text-zinc-500 border-zinc-200",
  },
};

export function semesterLabel(semester: 0 | 1 | 2): string {
  if (semester === 1) return "Học kỳ 1";
  if (semester === 2) return "Học kỳ 2";
  return "Cả năm";
}

export function academicYearToNumber(academicYear?: string | null): 1 | 2 | 3 | 4 | null {
  switch (academicYear) {
    case "YEAR_1":
      return 1;
    case "YEAR_2":
      return 2;
    case "YEAR_3":
      return 3;
    case "YEAR_4":
    case "YEAR_5_PLUS":
      return 4;
    default:
      return null;
  }
}

/**
 * Tính toán tiến độ tổng thể và tiến độ từng năm (RM10):
 * Mục tiêu ở trạng thái SKIPPED được loại khỏi mẫu số `countableGoals`.
 */
export function calculateRoadmapProgress(
  years: Array<Pick<IRoadmapYearDTO, "yearNumber" | "goals">>
): IRoadmapProgressBreakdownDTO {
  let totalGoals = 0;
  let countableGoals = 0;
  let completedGoals = 0;
  let inProgressGoals = 0;
  let skippedGoals = 0;

  const byYearMap = new Map<number, IRoadmapYearProgressDTO>();

  for (const year of years) {
    const goals = Array.isArray(year.goals) ? year.goals : [];
    const yTotal = goals.length;
    const ySkipped = goals.filter((g) => g.status === ROADMAP_GOAL_STATUSES.SKIPPED).length;
    const yCountable = yTotal - ySkipped;
    const yCompleted = goals.filter((g) => g.status === ROADMAP_GOAL_STATUSES.COMPLETED).length;
    const yInProgress = goals.filter((g) => g.status === ROADMAP_GOAL_STATUSES.IN_PROGRESS).length;
    const yPercent = yCountable <= 0 ? 0 : Math.round((yCompleted / yCountable) * 100);

    totalGoals += yTotal;
    skippedGoals += ySkipped;
    countableGoals += yCountable;
    completedGoals += yCompleted;
    inProgressGoals += yInProgress;

    byYearMap.set(year.yearNumber, {
      yearNumber: year.yearNumber as 1 | 2 | 3 | 4,
      totalGoals: yTotal,
      countableGoals: yCountable,
      completedGoals: yCompleted,
      inProgressGoals: yInProgress,
      skippedGoals: ySkipped,
      progressPercent: yPercent,
    });
  }

  const byYear: IRoadmapYearProgressDTO[] = ([1, 2, 3, 4] as const).map(
    (num) =>
      byYearMap.get(num) || {
        yearNumber: num,
        totalGoals: 0,
        countableGoals: 0,
        completedGoals: 0,
        inProgressGoals: 0,
        skippedGoals: 0,
        progressPercent: 0,
      }
  );

  const progressPercent =
    countableGoals <= 0 ? 0 : Math.round((completedGoals / countableGoals) * 100);

  return {
    totalGoals,
    countableGoals,
    completedGoals,
    inProgressGoals,
    skippedGoals,
    progressPercent,
    byYear,
  };
}

