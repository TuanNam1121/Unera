"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Compass,
  CheckCircle2,
  Circle,
  Calendar,
  Sparkles,
  Plus,
  ArrowRight,
  Filter,
  Layers,
  ChevronDown,
  ChevronRight,
  Flag,
  RotateCcw,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Task {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  dueDate?: string;
}

interface Milestone {
  id: string;
  title: string;
  tasks: Task[];
}

interface Semester {
  semesterNumber: number;
  milestones: Milestone[];
}

interface Year {
  yearNumber: number;
  semesters: Semester[];
}

interface RoadmapData {
  _id: string;
  studentId: string;
  status: "ACTIVE" | "ARCHIVED";
  goalSnapshot?: {
    notes?: string;
    studyAbroad?: boolean;
    employment?: boolean;
    scientificResearch?: boolean;
    startup?: boolean;
  };
  progressPercent: number;
  years: Year[];
  createdAt: string;
  updatedAt: string;
}

export default function RoadmapPage() {
  const [roadmap, setRoadmap] = useState<RoadmapData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState<number | "all">("all");
  const [filterStatus, setFilterStatus] = useState<"all" | "pending" | "completed">("all");
  const [isTogglingId, setIsTogglingId] = useState<string | null>(null);
  const [addingToMilestoneId, setAddingToMilestoneId] = useState<string | null>(null);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [isAddingTask, setIsAddingTask] = useState(false);

  useEffect(() => {
    fetchRoadmap();
  }, []);

  async function fetchRoadmap() {
    try {
      const res = await fetch("/api/roadmap");
      const data = await res.json();
      if (data.roadmap) {
        setRoadmap(data.roadmap);
      }
    } catch (err) {
      console.error("Failed to load roadmap", err);
    } finally {
      setIsLoading(false);
    }
  }

  // Toggle task completion
  const handleToggleTask = async (taskId: string, currentCompleted: boolean) => {
    if (!roadmap) return;

    // Optimistic UI update
    const updatedYears = roadmap.years.map((year) => ({
      ...year,
      semesters: year.semesters.map((sem) => ({
        ...sem,
        milestones: sem.milestones.map((ms) => ({
          ...ms,
          tasks: ms.tasks.map((task) =>
            task.id === taskId ? { ...task, completed: !currentCompleted } : task
          ),
        })),
      })),
    }));

    // Recalculate progress locally
    let total = 0;
    let completed = 0;
    for (const y of updatedYears) {
      for (const s of y.semesters) {
        for (const m of s.milestones) {
          for (const t of m.tasks) {
            total++;
            if (t.completed) completed++;
          }
        }
      }
    }
    const newPercent = total > 0 ? Math.round((completed / total) * 100) : 0;

    setRoadmap({
      ...roadmap,
      progressPercent: newPercent,
      years: updatedYears,
    });

    setIsTogglingId(taskId);

    try {
      const res = await fetch("/api/roadmap", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          taskId,
          completed: !currentCompleted,
        }),
      });
      const data = await res.json();
      if (data.roadmap) {
        setRoadmap(data.roadmap);
      }
    } catch (err) {
      console.error("Failed to update task", err);
      // Revert if error
      fetchRoadmap();
    } finally {
      setIsTogglingId(null);
    }
  };

  // Add custom task
  const handleAddTask = async (milestoneId: string) => {
    if (!newTaskTitle.trim()) return;

    setIsAddingTask(true);
    try {
      const res = await fetch("/api/roadmap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          milestoneId,
          title: newTaskTitle.trim(),
        }),
      });
      const data = await res.json();
      if (data.roadmap) {
        setRoadmap(data.roadmap);
        setAddingToMilestoneId(null);
        setNewTaskTitle("");
      }
    } catch (err) {
      console.error("Failed to add task", err);
    } finally {
      setIsAddingTask(false);
    }
  };

  // Compute overall stats
  let totalTasks = 0;
  let completedTasks = 0;
  if (roadmap) {
    for (const y of roadmap.years) {
      for (const s of y.semesters) {
        for (const m of s.milestones) {
          for (const t of m.tasks) {
            totalTasks++;
            if (t.completed) completedTasks++;
          }
        }
      }
    }
  }

  if (isLoading) {
    return (
      <div className="w-full min-h-[60vh] flex items-center justify-center p-6">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 rounded-full border-3 border-blue-600 border-t-transparent animate-spin" />
          <p className="text-xs font-semibold text-slate-600">Đang tải lộ trình của bạn...</p>
        </div>
      </div>
    );
  }

  const goalTitle =
    roadmap?.goalSnapshot?.notes || "Trở thành Du học sinh & Học bổng Toàn phần";

  return (
    <div className="w-full px-6 sm:px-8 py-6 space-y-7">
      {/* 1. TOP HEADER & HERO PROGRESS */}
      <div className="rounded-2xl border border-blue-200/80 bg-gradient-to-r from-blue-50/90 via-[#F3F7FE] to-white p-6 sm:p-8 shadow-2xs">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="rounded-md bg-blue-600 text-white text-[10px] font-bold tracking-wider px-2.5 py-0.5 uppercase">
                LỘ TRÌNH ĐANG KÍCH HOẠT
              </span>
              <span className="text-xs text-slate-500 font-medium">
                4 năm đại học · Chuẩn hoá theo định hướng cá nhân
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {goalTitle}
            </h1>

            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Mỗi bước nhỏ hoàn thành đưa bạn đến gần hơn với mục tiêu học thuật và sự nghiệp tương lai. Cập nhật tiến độ thường xuyên để nhận được các đề xuất cơ hội phù hợp nhất.
            </p>
          </div>

          {/* Progress Widget Card */}
          <div className="rounded-xl border border-slate-200/90 bg-white p-5 shadow-2xs min-w-[260px] space-y-3 shrink-0">
            <div className="flex items-baseline justify-between">
              <span className="text-xs font-semibold text-slate-600">Tiến độ tổng thể</span>
              <span className="text-2xl font-black text-blue-600">
                {roadmap?.progressPercent || 0}%
              </span>
            </div>

            <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-600 rounded-full transition-all duration-500"
                style={{ width: `${roadmap?.progressPercent || 0}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium pt-1">
              <span>
                {completedTasks} / {totalTasks} bước hoàn tất
              </span>
              <span className="text-emerald-600 font-semibold">Đang diễn ra</span>
            </div>
          </div>
        </div>

        {/* Quick action strip */}
        <div className="mt-6 pt-5 border-t border-blue-100/80 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <Link
              href="/onboarding"
              className="inline-flex items-center gap-1.5 text-blue-700 hover:text-blue-800 font-semibold"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Làm lại trắc nghiệm định hướng</span>
            </Link>
            <span className="text-slate-300">|</span>
            <Link
              href="/explore"
              className="text-slate-600 hover:text-slate-900 font-medium"
            >
              Xem cơ hội dành riêng cho lộ trình &rarr;
            </Link>
          </div>
        </div>
      </div>

      {/* 2. CONTROLS: YEAR TABS & STATUS FILTER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        {/* Year Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <button
            type="button"
            onClick={() => setSelectedYear("all")}
            className={cn(
              "px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-colors shrink-0",
              selectedYear === "all"
                ? "bg-blue-600 text-white shadow-2xs"
                : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
            )}
          >
            Tất cả 4 năm
          </button>
          {[1, 2, 3, 4].map((yr) => (
            <button
              key={yr}
              type="button"
              onClick={() => setSelectedYear(yr)}
              className={cn(
                "px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-colors shrink-0",
                selectedYear === yr
                  ? "bg-blue-600 text-white shadow-2xs"
                  : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
              )}
            >
              Năm {yr}
            </button>
          ))}
        </div>

        {/* Filter Completed / Pending */}
        <div className="flex items-center gap-1.5 self-start sm:self-auto">
          <span className="text-xs text-slate-400 font-medium mr-1 flex items-center gap-1">
            <Filter className="h-3.5 w-3.5" /> Lọc:
          </span>
          <button
            type="button"
            onClick={() => setFilterStatus("all")}
            className={cn(
              "px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors",
              filterStatus === "all"
                ? "bg-slate-900 text-white"
                : "text-slate-600 hover:bg-slate-100"
            )}
          >
            Toàn bộ
          </button>
          <button
            type="button"
            onClick={() => setFilterStatus("pending")}
            className={cn(
              "px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors",
              filterStatus === "pending"
                ? "bg-blue-600 text-white"
                : "text-slate-600 hover:bg-slate-100"
            )}
          >
            Cần làm
          </button>
          <button
            type="button"
            onClick={() => setFilterStatus("completed")}
            className={cn(
              "px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors",
              filterStatus === "completed"
                ? "bg-emerald-600 text-white"
                : "text-slate-600 hover:bg-slate-100"
            )}
          >
            Đã xong
          </button>
        </div>
      </div>

      {/* 3. TIMELINE & MILESTONES CONTENT */}
      <div className="space-y-8">
        {roadmap?.years
          .filter((y) => selectedYear === "all" || y.yearNumber === selectedYear)
          .map((year) => (
            <section key={year.yearNumber} className="space-y-5">
              {/* Year Separator Banner */}
              <div className="flex items-center gap-3">
                <div className="h-7 w-7 rounded-lg bg-blue-600 text-white flex items-center justify-center text-xs font-bold shadow-2xs">
                  {year.yearNumber}
                </div>
                <h2 className="text-base font-bold text-slate-900">
                  Năm {year.yearNumber}:{" "}
                  <span className="font-medium text-slate-500">
                    {year.yearNumber === 1 && "Hòa nhập & Khám phá tiềm năng"}
                    {year.yearNumber === 2 && "Xây dựng nền tảng học thuật & Kỹ năng"}
                    {year.yearNumber === 3 && "Chuẩn bị hồ sơ ứng tuyển chuyên sâu"}
                    {year.yearNumber === 4 && "Về đích & Hiện thực hóa mục tiêu"}
                  </span>
                </h2>
                <div className="flex-1 h-px bg-slate-200" />
              </div>

              {/* Semesters Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {year.semesters.map((sem) => (
                  <div
                    key={sem.semesterNumber}
                    className="rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-2xs space-y-4 flex flex-col justify-between"
                  >
                    <div className="space-y-4">
                      {/* Semester Header */}
                      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                        <span className="text-xs font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-2.5 py-1 rounded-md">
                          Học kỳ {sem.semesterNumber}
                        </span>
                        <span className="text-[11px] font-semibold text-slate-400">
                          {sem.milestones.reduce(
                            (acc, m) =>
                              acc + m.tasks.filter((t) => t.completed).length,
                            0
                          )}{" "}
                          /{" "}
                          {sem.milestones.reduce(
                            (acc, m) => acc + m.tasks.length,
                            0
                          )}{" "}
                          hoàn tất
                        </span>
                      </div>

                      {/* Milestones inside Semester */}
                      {sem.milestones.map((ms) => {
                        const visibleTasks = ms.tasks.filter((t) => {
                          if (filterStatus === "pending") return !t.completed;
                          if (filterStatus === "completed") return t.completed;
                          return true;
                        });

                        return (
                          <div key={ms.id} className="space-y-3">
                            <div className="flex items-center justify-between">
                              <h3 className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-2">
                                <Flag className="h-3.5 w-3.5 text-blue-600" />
                                <span>{ms.title}</span>
                              </h3>
                              <button
                                type="button"
                                onClick={() =>
                                  setAddingToMilestoneId(
                                    addingToMilestoneId === ms.id ? null : ms.id
                                  )
                                }
                                className="text-[11px] text-blue-600 hover:text-blue-700 font-semibold inline-flex items-center gap-1 hover:underline"
                              >
                                <Plus className="h-3 w-3" />
                                <span>Thêm việc</span>
                              </button>
                            </div>

                            {/* Inline Add Task Form */}
                            {addingToMilestoneId === ms.id && (
                              <div className="p-3 bg-blue-50/50 rounded-xl border border-blue-200 space-y-2">
                                <input
                                  type="text"
                                  value={newTaskTitle}
                                  onChange={(e) => setNewTaskTitle(e.target.value)}
                                  placeholder="Nhập tên nhiệm vụ cần thực hiện..."
                                  className="w-full text-xs rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-900 focus:outline-none focus:border-blue-600"
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") handleAddTask(ms.id);
                                  }}
                                />
                                <div className="flex items-center justify-end gap-2">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setAddingToMilestoneId(null);
                                      setNewTaskTitle("");
                                    }}
                                    className="px-2.5 py-1 text-[11px] font-semibold text-slate-500 hover:text-slate-700"
                                  >
                                    Hủy
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleAddTask(ms.id)}
                                    disabled={isAddingTask || !newTaskTitle.trim()}
                                    className="px-3 py-1 bg-blue-600 text-white rounded-lg text-[11px] font-semibold shadow-2xs hover:bg-blue-700 disabled:opacity-50"
                                  >
                                    {isAddingTask ? "Đang lưu..." : "Lưu nhiệm vụ"}
                                  </button>
                                </div>
                              </div>
                            )}

                            {/* Tasks List */}
                            <div className="space-y-2">
                              {visibleTasks.length === 0 ? (
                                <p className="text-[11px] text-slate-400 italic py-1">
                                  Không có nhiệm vụ nào trong bộ lọc này.
                                </p>
                              ) : (
                                visibleTasks.map((task) => (
                                  <div
                                    key={task.id}
                                    onClick={() =>
                                      handleToggleTask(task.id, task.completed)
                                    }
                                    className={cn(
                                      "group cursor-pointer rounded-xl border p-3 transition-all flex items-start gap-3",
                                      task.completed
                                        ? "border-slate-100 bg-slate-50/60 text-slate-400"
                                        : "border-slate-200/90 bg-white hover:border-blue-300 hover:shadow-2xs text-slate-800"
                                    )}
                                  >
                                    <button
                                      type="button"
                                      aria-label={task.completed ? "Đã xong" : "Chưa xong"}
                                      className="mt-0.5 shrink-0"
                                    >
                                      {task.completed ? (
                                        <CheckCircle2 className="h-4 w-4 text-blue-600" />
                                      ) : (
                                        <Circle className="h-4 w-4 text-slate-300 group-hover:text-blue-500 transition-colors" />
                                      )}
                                    </button>

                                    <div className="space-y-0.5 flex-1 min-w-0">
                                      <p
                                        className={cn(
                                          "text-xs font-semibold leading-snug",
                                          task.completed && "line-through text-slate-400"
                                        )}
                                      >
                                        {task.title}
                                      </p>
                                      {task.description && (
                                        <p
                                          className={cn(
                                            "text-[11px] text-slate-500 line-clamp-2",
                                            task.completed && "text-slate-400"
                                          )}
                                        >
                                          {task.description}
                                        </p>
                                      )}
                                      {task.dueDate && (
                                        <span className="inline-flex items-center gap-1 text-[10px] text-slate-400 font-medium pt-1">
                                          <Calendar className="h-3 w-3" />
                                          Hạn:{" "}
                                          {new Date(task.dueDate).toLocaleDateString(
                                            "vi-VN"
                                          )}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                ))
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))}
      </div>
    </div>
  );
}
