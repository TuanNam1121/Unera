"use client";

import { useState } from "react";
import { Building2, Calendar, GraduationCap, Loader2, Save, User as UserIcon } from "lucide-react";
import { ACADEMIC_YEARS } from "@/constants";
import { isPresetUniversity } from "@/constants/universities";
import { UniversityCombobox } from "@/components/profile/UniversityCombobox";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export interface ProfileInfoFields {
  fullName: string;
  birthYear?: number;
  academicYear: string;
  university: string;
  major: string;
  bio: string;
}

interface ProfileInfoTabProps {
  profile: ProfileInfoFields;
  onChange: (updated: Partial<ProfileInfoFields>) => void;
  onSave: () => Promise<void>;
  onValidationError: (message: string) => void;
  saving: boolean;
}

export function ProfileInfoTab({
  profile,
  onChange,
  onSave,
  onValidationError,
  saving,
}: ProfileInfoTabProps) {
  const [openUniSignal, setOpenUniSignal] = useState(0);
  const maxBirthYear = new Date().getFullYear() - 15;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (profile.fullName.trim().length < 2) {
      onValidationError("Họ và tên phải có ít nhất 2 ký tự.");
      return;
    }

    if (profile.birthYear !== undefined) {
      if (
        !Number.isInteger(profile.birthYear) ||
        profile.birthYear < 1960 ||
        profile.birthYear > maxBirthYear
      ) {
        onValidationError(
          `Năm sinh hợp lệ phải nằm trong khoảng 1960 đến ${maxBirthYear}.`
        );
        return;
      }
    }

    if (profile.university && !isPresetUniversity(profile.university)) {
      onValidationError(
        "Vui lòng chọn Trường Đại học từ danh sách gợi ý của hệ thống."
      );
      setOpenUniSignal((n) => n + 1);
      return;
    }

    if ((profile.bio || "").length > 500) {
      onValidationError("Tiểu sử và định hướng ngắn tối đa 500 ký tự.");
      return;
    }

    await onSave();
  };

  return (
    <Card className="rounded-2xl border-slate-200/80 shadow-xs bg-white">
      <CardHeader>
        <CardTitle className="text-base font-bold text-slate-900">
          Thông tin sinh viên &amp; Học thuật
        </CardTitle>
        <CardDescription className="text-xs text-slate-500">
          Quản lý hồ sơ cơ bản, thông tin trường lớp và định hướng ngắn của bạn trên Unera
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Họ và tên */}
            <div className="space-y-1.5">
              <label
                className="text-xs font-semibold text-slate-700 flex items-center gap-1.5"
                htmlFor="profileFullName"
              >
                <UserIcon className="h-3.5 w-3.5 text-slate-400" />
                <span>Họ và tên</span>
              </label>
              <Input
                id="profileFullName"
                value={profile.fullName}
                onChange={(e) => onChange({ fullName: e.target.value })}
                placeholder="Nguyễn Văn An"
                disabled={saving}
                className="rounded-xl border-slate-200 text-xs sm:text-sm"
              />
            </div>

            {/* Năm sinh & Sinh viên năm mấy */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label
                  className="text-xs font-semibold text-slate-700 flex items-center gap-1.5"
                  htmlFor="profileBirthYear"
                >
                  <Calendar className="h-3.5 w-3.5 text-slate-400" />
                  <span>Năm sinh</span>
                </label>
                <Input
                  id="profileBirthYear"
                  type="number"
                  min={1960}
                  max={maxBirthYear}
                  placeholder="2005"
                  value={profile.birthYear ?? ""}
                  onChange={(e) => {
                    const raw = e.target.value;
                    onChange({
                      birthYear: raw === "" ? undefined : Number(raw),
                    });
                  }}
                  disabled={saving}
                  className="rounded-xl border-slate-200 text-xs sm:text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <label
                  className="text-xs font-semibold text-slate-700 flex items-center gap-1.5"
                  htmlFor="profileAcademicYear"
                >
                  <GraduationCap className="h-3.5 w-3.5 text-slate-400" />
                  <span>Sinh viên năm</span>
                </label>
                <select
                  id="profileAcademicYear"
                  value={profile.academicYear || "YEAR_1"}
                  onChange={(e) => onChange({ academicYear: e.target.value })}
                  disabled={saving}
                  className="w-full h-9 rounded-xl border border-slate-200 bg-white px-2.5 text-xs sm:text-sm text-slate-800 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                >
                  {ACADEMIC_YEARS.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Trường Đại học */}
            <div className="space-y-1.5">
              <label
                className="text-xs font-semibold text-slate-700 flex items-center gap-1.5"
                htmlFor="profileUniversitySearch"
              >
                <Building2 className="h-3.5 w-3.5 text-slate-400" />
                <span>Trường Đại học</span>
              </label>
              <UniversityCombobox
                id="profileUniversitySearch"
                value={profile.university}
                onChange={(university) => onChange({ university })}
                disabled={saving}
                forceOpenSignal={openUniSignal}
              />
            </div>

            {/* Chuyên ngành */}
            <div className="space-y-1.5">
              <label
                className="text-xs font-semibold text-slate-700"
                htmlFor="profileMajor"
              >
                Chuyên ngành đào tạo
              </label>
              <Input
                id="profileMajor"
                value={profile.major}
                onChange={(e) => onChange({ major: e.target.value })}
                placeholder="Ví dụ: Ngôn ngữ Anh, Công nghệ thông tin..."
                disabled={saving}
                className="rounded-xl border-slate-200 text-xs sm:text-sm"
              />
            </div>
          </div>

          {/* Tiểu sử & định hướng ngắn */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <label
                className="text-xs font-semibold text-slate-700"
                htmlFor="profileBio"
              >
                Tiểu sử &amp; Định hướng ngắn
              </label>
              <span className="text-[11px] text-slate-400">
                {profile.bio?.length || 0}/500 ký tự
              </span>
            </div>
            <textarea
              id="profileBio"
              rows={4}
              maxLength={500}
              value={profile.bio}
              onChange={(e) => onChange({ bio: e.target.value })}
              disabled={saving}
              placeholder="Giới thiệu đôi nét về sở thích học thuật, thế mạnh bản thân hoặc mục tiêu phát triển ngắn hạn..."
              className="w-full rounded-xl border border-slate-200 bg-white p-3 text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all"
            />
          </div>

          <div className="flex justify-end pt-2">
            <Button
              type="submit"
              disabled={saving}
              className="gap-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-5"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              <span>{saving ? "Đang lưu..." : "Lưu thông tin cá nhân"}</span>
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

