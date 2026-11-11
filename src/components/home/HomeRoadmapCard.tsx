"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle2, Circle, ArrowRight } from "lucide-react";

interface Task {
  id: string;
  title: string;
  completed: boolean;
}

interface RoadmapData {
  goalSnapshot?: {
    notes?: string;
  };
  progressPercent: number;
  years: Array<{
    yearNumber: number;
    semesters: Array<{
      semesterNumber: number;
      milestones: Array<{
        tasks: Task[];
      }>;
    }>;
  }>;
}

export default function HomeRoadmapCard() {
  const [roadmap, setRoadmap] = useState<RoadmapData | null>(null);

  useEffect(() => {
    async function loadRoadmap() {
      try {
        const res = await fetch("/api/roadmap");
        if (res.ok) {
          const data = await res.json();
          if (data.roadmap) {
            setRoadmap(data.roadmap);
          }
        }
      } catch {
        // Guest mode fallback
      }
    }
    loadRoadmap();
  }, []);

  // Compute stats
  let totalTasks = 12;
  let completedTasks = 8;
  let progress = 67;
  let goalTitle = "Trở thành Du học sinh Mỹ";
  let completedTaskTitle = "Đạt GPA 4.5 Năm 4";
  let nextTaskTitle = "Nộp cover letter";

  if (roadmap) {
    let tot = 0;
    let comp = 0;
    const allTasks: Task[] = [];

    for (const y of roadmap.years || []) {
      for (const s of y.semesters || []) {
        for (const m of s.milestones || []) {
          for (const t of m.tasks || []) {
            tot++;
            if (t.completed) comp++;
            allTasks.push(t);
          }
        }
      }
    }

    if (tot > 0) {
      totalTasks = tot;
      completedTasks = comp;
      progress = roadmap.progressPercent ?? Math.round((comp / tot) * 100);
      goalTitle = roadmap.goalSnapshot?.notes || goalTitle;

      const lastComp = allTasks.filter((t) => t.completed).pop();
      const firstPending = allTasks.find((t) => !t.completed);

      if (lastComp) completedTaskTitle = lastComp.title;
      if (firstPending) nextTaskTitle = firstPending.title;
    }
  }

  return (
    <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-2xs space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <span className="inline-block rounded-md bg-purple-50 border border-purple-100 px-2.5 py-0.5 text-[11px] font-semibold text-purple-700">
            Du học &amp; Học bổng
          </span>
          <h4 className="mt-2 text-xl font-bold text-slate-900">
            {goalTitle}
          </h4>
          <p className="text-xs text-slate-400 mt-0.5">
            Giai đoạn 2 / 3 · Xây dựng nền tảng
          </p>
        </div>

        {/* Progress Stat */}
        <div className="text-right">
          <span className="text-2xl font-black text-blue-600">{progress}%</span>
          <p className="text-[11px] text-slate-400 mt-0.5">
            {completedTasks} / {totalTasks} bước hoàn tất
          </p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="space-y-1.5">
        <div className="h-2 w-full rounded-full bg-blue-100/60 overflow-hidden">
          <div
            className="h-full rounded-full bg-blue-600 transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Checklist items */}
      <div className="border-t border-slate-100 pt-4 space-y-3">
        <div className="flex items-center gap-2.5 text-xs text-slate-700">
          <CheckCircle2 className="h-4 w-4 text-blue-600 fill-blue-50 shrink-0" />
          <span className="font-medium line-through text-slate-400">
            {completedTaskTitle}
          </span>
        </div>
        <div className="flex items-center justify-between text-xs text-slate-700">
          <div className="flex items-center gap-2.5">
            <Circle className="h-4 w-4 text-slate-300 shrink-0" />
            <span className="font-medium text-slate-800">{nextTaskTitle}</span>
          </div>
          <Link
            href="/roadmap"
            className="text-[11px] font-semibold text-blue-600 hover:underline"
          >
            Bước tiếp theo &rarr;
          </Link>
        </div>
      </div>
    </div>
  );
}

