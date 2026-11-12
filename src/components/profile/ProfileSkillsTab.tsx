"use client";

import { useState } from "react";
import { Briefcase, Loader2, Plus, Save, Sparkles, Users, X } from "lucide-react";
import {
  SUGGESTED_HARD_SKILLS,
  SUGGESTED_SOFT_SKILLS,
} from "@/lib/profile-skills";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type SkillCategory = "hard" | "soft";

interface ProfileSkillsTabProps {
  hardSkills: string[];
  softSkills: string[];
  onChangeSkills: (hardSkills: string[], softSkills: string[]) => void;
  onSave: () => Promise<void>;
  onError: (msg: string) => void;
  saving: boolean;
}

export function ProfileSkillsTab({
  hardSkills,
  softSkills,
  onChangeSkills,
  onSave,
  onError,
  saving,
}: ProfileSkillsTabProps) {
  const [selectedCategory, setSelectedCategory] = useState<SkillCategory>("hard");
  const [newSkill, setNewSkill] = useState("");

  const addSkillToCategory = (rawSkill: string, targetCategory: SkillCategory) => {
    const trimmed = rawSkill.trim().replace(/\s+/g, " ");
    if (!trimmed) return;

    const lower = trimmed.toLowerCase();
    const existsInTarget = (
      targetCategory === "hard" ? hardSkills : softSkills
    ).some((s) => s.toLowerCase() === lower);

    if (existsInTarget) {
      onError(
        `Kỹ năng "${trimmed}" đã tồn tại trong nhóm ${
          targetCategory === "hard" ? "Kỹ năng chuyên môn" : "Kỹ năng mềm"
        }.`
      );
      return;
    }

    if (targetCategory === "hard") {
      onChangeSkills([...hardSkills, trimmed], softSkills);
    } else {
      onChangeSkills(hardSkills, [...softSkills, trimmed]);
    }
    setNewSkill("");
  };

  const removeSkill = (skillToRemove: string, category: SkillCategory) => {
    if (category === "hard") {
      onChangeSkills(
        hardSkills.filter((s) => s !== skillToRemove),
        softSkills
      );
    } else {
      onChangeSkills(
        hardSkills,
        softSkills.filter((s) => s !== skillToRemove)
      );
    }
  };

  return (
    <Card className="rounded-2xl border-slate-200/80 shadow-xs bg-white">
      <CardHeader>
        <CardTitle className="text-base font-bold text-slate-900">
          Kỹ năng Chuyên môn &amp; Kỹ năng Mềm
        </CardTitle>
        <CardDescription className="text-xs text-slate-500">
          Phân loại năng lực cốt lõi để cá nhân hóa lộ trình học tập và tham gia hoạt động sinh viên phù hợp
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Form thêm kỹ năng kèm chọn nhóm */}
        <div className="rounded-2xl border border-slate-200/80 bg-slate-50/70 p-4 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-slate-600 mr-1">
              Nhóm kỹ năng:
            </span>
            <button
              type="button"
              onClick={() => setSelectedCategory("hard")}
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold transition-all cursor-pointer ${
                selectedCategory === "hard"
                  ? "bg-blue-600 text-white shadow-2xs"
                  : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
              }`}
            >
              <Briefcase className="h-3.5 w-3.5" />
              <span>Kỹ năng chuyên môn</span>
            </button>
            <button
              type="button"
              onClick={() => setSelectedCategory("soft")}
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold transition-all cursor-pointer ${
                selectedCategory === "soft"
                  ? "bg-indigo-600 text-white shadow-2xs"
                  : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
              }`}
            >
              <Users className="h-3.5 w-3.5" />
              <span>Kỹ năng mềm</span>
            </button>
          </div>

          <div className="flex gap-2">
            <Input
              value={newSkill}
              onChange={(e) => setNewSkill(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addSkillToCategory(newSkill, selectedCategory);
                }
              }}
              placeholder={
                selectedCategory === "hard"
                  ? "Nhập kỹ năng chuyên môn (vd: IELTS 7.5, Python, Biên phiên dịch)..."
                  : "Nhập kỹ năng mềm (vd: Thuyết trình, Làm việc nhóm, Quản lý thời gian)..."
              }
              className="rounded-xl border-slate-200 bg-white text-xs sm:text-sm"
            />
            <Button
              type="button"
              onClick={() => addSkillToCategory(newSkill, selectedCategory)}
              className="gap-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs sm:text-sm shrink-0"
            >
              <Plus className="h-4 w-4" />
              <span>Thêm</span>
            </Button>
          </div>
        </div>

        {/* 2 nhóm kỹ năng tách biệt rõ ràng */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Kỹ năng chuyên môn (Hard Skills) */}
          <div className="rounded-2xl border border-slate-200/80 p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                  <Briefcase className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Kỹ năng chuyên môn ({hardSkills.length})
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Ngoại ngữ, công cụ, kiến thức chuyên ngành
                  </p>
                </div>
              </div>
            </div>

            {hardSkills.length === 0 ? (
              <p className="text-xs text-slate-400 italic py-2">
                Chưa có kỹ năng chuyên môn nào.
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {hardSkills.map((skill) => (
                  <span
                    key={skill}
                    className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 border border-blue-200/80 px-3 py-1 text-xs font-semibold text-blue-700"
                  >
                    <span>{skill}</span>
                    <button
                      type="button"
                      onClick={() => removeSkill(skill, "hard")}
                      className="rounded-full p-0.5 text-blue-400 hover:bg-blue-200/60 hover:text-blue-800 transition-colors cursor-pointer"
                      title="Xóa kỹ năng chuyên môn"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}

            <div className="pt-3 border-t border-slate-100 space-y-2">
              <span className="text-[11px] font-semibold text-slate-500 flex items-center gap-1">
                <Sparkles className="h-3 w-3 text-blue-500" />
                Gợi ý chuyên môn nhanh:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {SUGGESTED_HARD_SKILLS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => addSkillToCategory(s, "hard")}
                    className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-medium text-slate-700 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 transition-all cursor-pointer"
                  >
                    <Plus className="h-3 w-3 text-slate-400" />
                    <span>{s}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Kỹ năng mềm (Soft Skills) */}
          <div className="rounded-2xl border border-slate-200/80 p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                  <Users className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Kỹ năng mềm ({softSkills.length})
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Giao tiếp, cộng tác, tư duy &amp; lãnh đạo
                  </p>
                </div>
              </div>
            </div>

            {softSkills.length === 0 ? (
              <p className="text-xs text-slate-400 italic py-2">
                Chưa có kỹ năng mềm nào.
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {softSkills.map((skill) => (
                  <span
                    key={skill}
                    className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 border border-indigo-200/80 px-3 py-1 text-xs font-semibold text-indigo-700"
                  >
                    <span>{skill}</span>
                    <button
                      type="button"
                      onClick={() => removeSkill(skill, "soft")}
                      className="rounded-full p-0.5 text-indigo-400 hover:bg-indigo-200/60 hover:text-indigo-800 transition-colors cursor-pointer"
                      title="Xóa kỹ năng mềm"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}

            <div className="pt-3 border-t border-slate-100 space-y-2">
              <span className="text-[11px] font-semibold text-slate-500 flex items-center gap-1">
                <Sparkles className="h-3 w-3 text-indigo-500" />
                Gợi ý kỹ năng mềm nhanh:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {SUGGESTED_SOFT_SKILLS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => addSkillToCategory(s, "soft")}
                    className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-medium text-slate-700 hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700 transition-all cursor-pointer"
                  >
                    <Plus className="h-3 w-3 text-slate-400" />
                    <span>{s}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <Button
            type="button"
            onClick={onSave}
            disabled={saving}
            className="gap-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-5"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            <span>{saving ? "Đang lưu..." : "Lưu danh sách kỹ năng"}</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

