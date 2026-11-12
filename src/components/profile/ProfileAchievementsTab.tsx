"use client";

import { useState } from "react";
import { Award, Loader2, Plus, Save, Trophy, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";

interface ProfileAchievementsTabProps {
  achievements: string[];
  onChange: (achievements: string[]) => void;
  onSave: () => Promise<void>;
  onError: (msg: string) => void;
  saving: boolean;
}

export function ProfileAchievementsTab({
  achievements,
  onChange,
  onSave,
  onError,
  saving,
}: ProfileAchievementsTabProps) {
  const [newAchievement, setNewAchievement] = useState("");

  const handleAdd = () => {
    const trimmed = newAchievement.trim().replace(/\s+/g, " ");
    if (!trimmed) return;

    const duplicate = achievements.some(
      (item) => item.toLowerCase() === trimmed.toLowerCase()
    );
    if (duplicate) {
      onError("Thành tích này đã có trong Bảng thành tích của bạn.");
      return;
    }

    onChange([trimmed, ...achievements]);
    setNewAchievement("");
  };

  const handleRemove = (index: number) => {
    onChange(achievements.filter((_, idx) => idx !== index));
  };

  return (
    <Card className="rounded-2xl border-slate-200/80 shadow-xs bg-white">
      <CardHeader>
        <CardTitle className="text-base font-bold text-slate-900">
          Bảng Thành Tích &amp; Giải Thưởng
        </CardTitle>
        <CardDescription className="text-xs text-slate-500">
          Lưu giữ các giải thưởng, học bổng, đề tài nghiên cứu khoa học và danh hiệu sinh viên
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-5">
        {/* Form thêm thành tích */}
        <div className="flex gap-2">
          <Input
            value={newAchievement}
            onChange={(e) => setNewAchievement(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleAdd();
              }
            }}
            placeholder="Nhập thành tích (vd: Giải Nhì NCKH Sinh viên 2025, Học bổng Khuyến khích HK1)..."
            className="rounded-xl border-slate-200 text-xs sm:text-sm"
          />
          <Button
            type="button"
            onClick={handleAdd}
            className="gap-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs sm:text-sm shrink-0"
          >
            <Plus className="h-4 w-4" />
            <span>Thêm</span>
          </Button>
        </div>

        {/* Danh sách thành tích */}
        <div className="space-y-2">
          {achievements.length === 0 ? (
            <div className="text-center py-8 text-slate-400 space-y-2">
              <Award className="h-10 w-10 mx-auto text-slate-300" />
              <p className="text-xs">
                Chưa có thành tích nào được ghi nhận. Hãy thêm các mốc tự hào của bạn!
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {achievements.map((ach, idx) => (
                <div
                  key={`${ach}-${idx}`}
                  className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50/50 p-3.5 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-700">
                      <Trophy className="h-4 w-4" />
                    </div>
                    <span className="text-xs sm:text-sm font-semibold text-slate-800 break-words">
                      {ach}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemove(idx)}
                    className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 transition-colors cursor-pointer shrink-0"
                    title="Xóa thành tích"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
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
            <span>{saving ? "Đang lưu..." : "Lưu bảng thành tích"}</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

