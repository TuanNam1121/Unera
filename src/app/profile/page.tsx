"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  User,
  GraduationCap,
  Target,
  Award,
  Sparkles,
  Save,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Plus,
  X,
  Compass,
  FileText,
  BookOpen,
  Briefcase,
  FlaskConical,
  Rocket,
  Heart,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

interface DevelopmentGoals {
  studyAbroad: boolean;
  employment: boolean;
  scientificResearch: boolean;
  startup: boolean;
  personalGrowth: boolean;
  notes?: string;
}

interface ProfileData {
  fullName: string;
  avatar?: string;
  university?: string;
  major?: string;
  academicYear?: string;
  bio?: string;
  developmentGoals: DevelopmentGoals;
  skills: string[];
  achievements: string[];
}

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState<"info" | "goals" | "skills" | "achievements">("info");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const [profile, setProfile] = useState<ProfileData>({
    fullName: "",
    university: "",
    major: "",
    academicYear: "YEAR_3",
    bio: "",
    developmentGoals: {
      studyAbroad: false,
      employment: false,
      scientificResearch: false,
      startup: false,
      personalGrowth: false,
      notes: "",
    },
    skills: [],
    achievements: [],
  });

  const [newSkill, setNewSkill] = useState("");
  const [newAchievement, setNewAchievement] = useState("");

  const suggestedSkills = [
    "IELTS",
    "TOEIC",
    "Python",
    "Figma",
    "Dịch thuật",
    "Nghiên cứu khoa học",
    "Thuyết trình",
    "Case Study",
    "Quản lý dự án",
    "Giao tiếp đa văn hóa",
  ];

  // Tải dữ liệu hồ sơ sinh viên
  useEffect(() => {
    async function fetchProfile() {
      try {
        setLoading(true);
        const res = await fetch("/api/profile");
        if (res.ok) {
          const data = await res.json();
          if (data.profile) {
            setProfile({
              fullName: data.profile.fullName || data.user?.name || "",
              avatar: data.profile.avatar || data.user?.image || "",
              university: data.profile.university || "",
              major: data.profile.major || "",
              academicYear: data.profile.academicYear || "YEAR_3",
              bio: data.profile.bio || "",
              developmentGoals: {
                studyAbroad: data.profile.developmentGoals?.studyAbroad ?? false,
                employment: data.profile.developmentGoals?.employment ?? false,
                scientificResearch: data.profile.developmentGoals?.scientificResearch ?? false,
                startup: data.profile.developmentGoals?.startup ?? false,
                personalGrowth: data.profile.developmentGoals?.personalGrowth ?? false,
                notes: data.profile.developmentGoals?.notes || "",
              },
              skills: data.profile.skills || [],
              achievements: data.profile.achievements || [],
            });
          }
        }
      } catch (err) {
        console.error("Lỗi tải hồ sơ:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchProfile();
  }, []);

  const showNotification = (msg: string, isError = false) => {
    if (isError) {
      setErrorMsg(msg);
      setSuccessMsg("");
    } else {
      setSuccessMsg(msg);
      setErrorMsg("");
      setTimeout(() => setSuccessMsg(""), 4000);
    }
  };

  // Lưu thông tin học vấn / cá nhân / kỹ năng / thành tích
  const handleSaveProfile = async () => {
    setSaving(true);
    setErrorMsg("");
    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: profile.fullName,
          university: profile.university,
          major: profile.major,
          academicYear: profile.academicYear,
          bio: profile.bio,
          skills: profile.skills,
          achievements: profile.achievements,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        showNotification(data.error || "Không thể lưu hồ sơ.", true);
      } else {
        showNotification("Cập nhật hồ sơ sinh viên thành công!");
      }
    } catch {
      showNotification("Đã có lỗi xảy ra kết nối với máy chủ.", true);
    } finally {
      setSaving(false);
    }
  };

  // Lưu mục tiêu phát triển & tự động sinh Lộ trình (FR-PRO-02, FR-RM-08)
  const handleSaveGoals = async () => {
    setSaving(true);
    setErrorMsg("");
    try {
      const res = await fetch("/api/profile/goals", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profile.developmentGoals),
      });

      const data = await res.json();
      if (!res.ok) {
        showNotification(data.error || "Không thể cập nhật mục tiêu phát triển.", true);
      } else {
        showNotification("Mục tiêu đã lưu! Lộ trình cá nhân của bạn đã được cập nhật tự động.");
      }
    } catch {
      showNotification("Đã có lỗi xảy ra kết nối với máy chủ.", true);
    } finally {
      setSaving(false);
    }
  };

  // Thêm kỹ năng
  const handleAddSkill = (skillToAdd: string) => {
    const trimmed = skillToAdd.trim();
    if (!trimmed) return;
    if (profile.skills.includes(trimmed)) {
      showNotification("Kỹ năng này đã tồn tại trong danh sách.", true);
      return;
    }
    setProfile((prev) => ({
      ...prev,
      skills: [...prev.skills, trimmed],
    }));
    setNewSkill("");
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    setProfile((prev) => ({
      ...prev,
      skills: prev.skills.filter((s) => s !== skillToRemove),
    }));
  };

  // Thêm thành tích
  const handleAddAchievement = () => {
    const trimmed = newAchievement.trim();
    if (!trimmed) return;
    setProfile((prev) => ({
      ...prev,
      achievements: [trimmed, ...prev.achievements],
    }));
    setNewAchievement("");
  };

  const handleRemoveAchievement = (index: number) => {
    setProfile((prev) => ({
      ...prev,
      achievements: prev.achievements.filter((_, i) => i !== index),
    }));
  };

  const getYearLabel = (yearCode?: string) => {
    switch (yearCode) {
      case "YEAR_1":
        return "Năm 1 (Tân sinh viên)";
      case "YEAR_2":
        return "Năm 2";
      case "YEAR_3":
        return "Năm 3";
      case "YEAR_4":
        return "Năm 4 (Chuẩn bị tốt nghiệp)";
      case "YEAR_5_PLUS":
        return "Năm 5+ / Sau đại học";
      default:
        return "Năm 3";
    }
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="w-full space-y-6 px-6 sm:px-8 py-6 max-w-7xl">
      {/* Alert Notification */}
      {successMsg && (
        <div className="flex items-center gap-2.5 rounded-xl bg-emerald-50 p-3.5 text-xs sm:text-sm text-emerald-800 border border-emerald-200 animate-in fade-in">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="flex items-center gap-2.5 rounded-xl bg-red-50 p-3.5 text-xs sm:text-sm text-red-700 border border-red-200 animate-in fade-in">
          <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Profile Hero Header Card */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-700 p-6 text-white shadow-md">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm border border-white/30 text-white font-bold text-2xl shadow-inner">
              {profile.fullName ? profile.fullName.charAt(0).toUpperCase() : "U"}
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
                  {profile.fullName || "Sinh viên Unera"}
                </h1>
                <span className="rounded-full bg-white/20 px-2.5 py-0.5 text-[11px] font-semibold text-white backdrop-blur-xs">
                  {getYearLabel(profile.academicYear)}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-blue-100 flex items-center gap-1.5">
                <GraduationCap className="h-3.5 w-3.5" />
                <span>
                  {profile.major || "Chưa cập nhật ngành"} · {profile.university || "Đại học Quốc gia Hà Nội"}
                </span>
              </p>
            </div>
          </div>

          {/* Quick Action Navigation Buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            <Link
              href="/roadmap"
              className="inline-flex items-center gap-2 rounded-xl bg-white/10 hover:bg-white/20 px-4 py-2 text-xs font-semibold text-white border border-white/20 backdrop-blur-xs transition-all shadow-xs"
            >
              <Compass className="h-4 w-4" />
              <span>Xem Lộ trình của tôi</span>
            </Link>
            <Link
              href="/tools/cv-builder"
              className="inline-flex items-center gap-2 rounded-xl bg-white text-blue-700 hover:bg-blue-50 px-4 py-2 text-xs font-semibold transition-all shadow-xs"
            >
              <FileText className="h-4 w-4" />
              <span>Xuất CV chuẩn ATS</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab("info")}
          className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs sm:text-sm font-semibold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === "info"
              ? "bg-blue-600 text-white shadow-xs"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          <User className="h-4 w-4" />
          <span>Học vấn &amp; Cá nhân</span>
        </button>

        <button
          onClick={() => setActiveTab("goals")}
          className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs sm:text-sm font-semibold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === "goals"
              ? "bg-blue-600 text-white shadow-xs"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          <Target className="h-4 w-4" />
          <span>Mục tiêu phát triển</span>
          <span className="rounded-full bg-amber-400 text-amber-950 px-1.5 py-0.2 text-[10px] font-bold">
            Auto-Sync
          </span>
        </button>

        <button
          onClick={() => setActiveTab("skills")}
          className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs sm:text-sm font-semibold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === "skills"
              ? "bg-blue-600 text-white shadow-xs"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          <Sparkles className="h-4 w-4" />
          <span>Kỹ năng &amp; Năng lực ({profile.skills.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("achievements")}
          className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs sm:text-sm font-semibold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === "achievements"
              ? "bg-blue-600 text-white shadow-xs"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          <Award className="h-4 w-4" />
          <span>Bảng vàng thành tích ({profile.achievements.length})</span>
        </button>
      </div>

      {/* Tab 1: Thông tin học vấn & Cá nhân */}
      {activeTab === "info" && (
        <Card className="rounded-2xl border-slate-200/80 shadow-xs bg-white">
          <CardHeader>
            <CardTitle className="text-base font-bold text-slate-900">
              Thông tin sinh viên &amp; Học thuật
            </CardTitle>
            <CardDescription className="text-xs text-slate-500">
              Các thông tin này sẽ được dùng để cá nhân hóa gợi ý cơ hội và tự động điền vào mẫu CV
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700" htmlFor="fullName">
                  Họ và tên sinh viên
                </label>
                <Input
                  id="fullName"
                  value={profile.fullName}
                  onChange={(e) => setProfile({ ...profile, fullName: e.target.value })}
                  placeholder="Nguyễn Văn A"
                  className="rounded-xl border-slate-200 text-xs sm:text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700" htmlFor="academicYear">
                  Năm học hiện tại
                </label>
                <select
                  id="academicYear"
                  value={profile.academicYear}
                  onChange={(e) => setProfile({ ...profile, academicYear: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 bg-white py-2 px-3 text-xs sm:text-sm text-slate-800 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                >
                  <option value="YEAR_1">Năm 1 (Tân sinh viên)</option>
                  <option value="YEAR_2">Năm 2</option>
                  <option value="YEAR_3">Năm 3</option>
                  <option value="YEAR_4">Năm 4 (Chuẩn bị tốt nghiệp)</option>
                  <option value="YEAR_5_PLUS">Năm 5+ / Sau đại học</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700" htmlFor="university">
                  Trường Đại học / Học viện
                </label>
                <Input
                  id="university"
                  value={profile.university}
                  onChange={(e) => setProfile({ ...profile, university: e.target.value })}
                  placeholder="Ví dụ: Đại học Ngoại ngữ - ĐHQGHN"
                  className="rounded-xl border-slate-200 text-xs sm:text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700" htmlFor="major">
                  Chuyên ngành đào tạo
                </label>
                <Input
                  id="major"
                  value={profile.major}
                  onChange={(e) => setProfile({ ...profile, major: e.target.value })}
                  placeholder="Ví dụ: Sư phạm Tiếng Anh, Kinh tế Quốc tế"
                  className="rounded-xl border-slate-200 text-xs sm:text-sm"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="text-xs font-semibold text-slate-700" htmlFor="bio">
                  Tiểu sử &amp; Định hướng ngắn
                </label>
                <span className="text-[11px] text-slate-400">
                  {profile.bio?.length || 0}/500 ký tự
                </span>
              </div>
              <textarea
                id="bio"
                rows={4}
                maxLength={500}
                value={profile.bio}
                onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                placeholder="Giới thiệu đôi nét về đam mê học thuật, thế mạnh bản thân hoặc mục tiêu nghề nghiệp..."
                className="w-full rounded-xl border border-slate-200 bg-white p-3 text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all"
              />
            </div>

            <div className="flex justify-end pt-2">
              <Button
                onClick={handleSaveProfile}
                disabled={saving}
                className="gap-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-5"
              >
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                <Save className="h-4 w-4" />
                <span>Lưu thông tin học vấn</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tab 2: Mục tiêu phát triển (Auto-sync Roadmap) */}
      {activeTab === "goals" && (
        <Card className="rounded-2xl border-slate-200/80 shadow-xs bg-white">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold text-slate-900">
                  5 Nhóm Mục Tiêu Định Hướng Nghề Nghiệp
                </CardTitle>
                <CardDescription className="text-xs text-slate-500">
                  Khi bạn lưu thay đổi, hệ thống sẽ tự động cập nhật và sinh lại Lộ trình phát triển tương ứng
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-5">
            {/* 5 Goal Selection Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {/* Study Abroad */}
              <label
                className={`relative flex items-start gap-3.5 rounded-2xl border p-4 cursor-pointer transition-all ${
                  profile.developmentGoals.studyAbroad
                    ? "border-blue-500 bg-blue-50/50 shadow-2xs"
                    : "border-slate-200 hover:border-slate-300 bg-white"
                }`}
              >
                <input
                  type="checkbox"
                  checked={profile.developmentGoals.studyAbroad}
                  onChange={(e) =>
                    setProfile({
                      ...profile,
                      developmentGoals: {
                        ...profile.developmentGoals,
                        studyAbroad: e.target.checked,
                      },
                    })
                  }
                  className="mt-1 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 font-semibold text-xs sm:text-sm text-slate-900">
                    <BookOpen className="h-4 w-4 text-blue-600" />
                    <span>Du học &amp; Học bổng Quốc tế</span>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-snug">
                    Săn học bổng chính phủ, bậc Thạc sĩ / Tiến sĩ, hoàn thiện hồ sơ SOP và thi chứng chỉ ngoại ngữ.
                  </p>
                </div>
              </label>

              {/* Employment */}
              <label
                className={`relative flex items-start gap-3.5 rounded-2xl border p-4 cursor-pointer transition-all ${
                  profile.developmentGoals.employment
                    ? "border-blue-500 bg-blue-50/50 shadow-2xs"
                    : "border-slate-200 hover:border-slate-300 bg-white"
                }`}
              >
                <input
                  type="checkbox"
                  checked={profile.developmentGoals.employment}
                  onChange={(e) =>
                    setProfile({
                      ...profile,
                      developmentGoals: {
                        ...profile.developmentGoals,
                        employment: e.target.checked,
                      },
                    })
                  }
                  className="mt-1 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 font-semibold text-xs sm:text-sm text-slate-900">
                    <Briefcase className="h-4 w-4 text-blue-600" />
                    <span>Việc làm &amp; Management Trainee</span>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-snug">
                    Ứng tuyển thực tập sinh, chương trình lãnh đạo trẻ tại tập đoàn đa quốc gia và doanh nghiệp lớn.
                  </p>
                </div>
              </label>

              {/* Scientific Research */}
              <label
                className={`relative flex items-start gap-3.5 rounded-2xl border p-4 cursor-pointer transition-all ${
                  profile.developmentGoals.scientificResearch
                    ? "border-blue-500 bg-blue-50/50 shadow-2xs"
                    : "border-slate-200 hover:border-slate-300 bg-white"
                }`}
              >
                <input
                  type="checkbox"
                  checked={profile.developmentGoals.scientificResearch}
                  onChange={(e) =>
                    setProfile({
                      ...profile,
                      developmentGoals: {
                        ...profile.developmentGoals,
                        scientificResearch: e.target.checked,
                      },
                    })
                  }
                  className="mt-1 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 font-semibold text-xs sm:text-sm text-slate-900">
                    <FlaskConical className="h-4 w-4 text-blue-600" />
                    <span>Nghiên cứu Khoa học (NCKH)</span>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-snug">
                    Tham gia đề tài NCKH sinh viên các cấp, công bố bài báo và tham dự hội thảo học thuật.
                  </p>
                </div>
              </label>

              {/* Startup */}
              <label
                className={`relative flex items-start gap-3.5 rounded-2xl border p-4 cursor-pointer transition-all ${
                  profile.developmentGoals.startup
                    ? "border-blue-500 bg-blue-50/50 shadow-2xs"
                    : "border-slate-200 hover:border-slate-300 bg-white"
                }`}
              >
                <input
                  type="checkbox"
                  checked={profile.developmentGoals.startup}
                  onChange={(e) =>
                    setProfile({
                      ...profile,
                      developmentGoals: {
                        ...profile.developmentGoals,
                        startup: e.target.checked,
                      },
                    })
                  }
                  className="mt-1 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 font-semibold text-xs sm:text-sm text-slate-900">
                    <Rocket className="h-4 w-4 text-blue-600" />
                    <span>Khởi nghiệp &amp; Đổi mới sáng tạo</span>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-snug">
                    Tham gia các cuộc thi ý tưởng khởi nghiệp sinh viên, phát triển dự án và tìm kiếm vườn ươm.
                  </p>
                </div>
              </label>

              {/* Personal Growth */}
              <label
                className={`relative flex items-start gap-3.5 rounded-2xl border p-4 cursor-pointer transition-all ${
                  profile.developmentGoals.personalGrowth
                    ? "border-blue-500 bg-blue-50/50 shadow-2xs"
                    : "border-slate-200 hover:border-slate-300 bg-white"
                }`}
              >
                <input
                  type="checkbox"
                  checked={profile.developmentGoals.personalGrowth}
                  onChange={(e) =>
                    setProfile({
                      ...profile,
                      developmentGoals: {
                        ...profile.developmentGoals,
                        personalGrowth: e.target.checked,
                      },
                    })
                  }
                  className="mt-1 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 font-semibold text-xs sm:text-sm text-slate-900">
                    <Heart className="h-4 w-4 text-blue-600" />
                    <span>Phát triển Năng lực Cá nhân</span>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-snug">
                    Rèn luyện kỹ năng mềm, kỹ năng lãnh đạo, hoạt động tình nguyện và mở rộng quan hệ cộng đồng.
                  </p>
                </div>
              </label>
            </div>

            {/* Notes */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700" htmlFor="goals-notes">
                Ghi chú nguyện vọng &amp; Kỳ vọng cụ thể
              </label>
              <textarea
                id="goals-notes"
                rows={3}
                value={profile.developmentGoals.notes}
                onChange={(e) =>
                  setProfile({
                    ...profile,
                    developmentGoals: {
                      ...profile.developmentGoals,
                      notes: e.target.value,
                    },
                  })
                }
                placeholder="Ví dụ: Mong muốn xin học bổng Erasmus Mundus ngành Truyền thông tại Châu Âu vào năm 2027..."
                className="w-full rounded-xl border border-slate-200 bg-white p-3 text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all"
              />
            </div>

            <div className="flex justify-between items-center pt-2">
              <span className="text-xs text-slate-500 italic">
                * Lộ trình cũ sẽ được lưu trữ an toàn, lộ trình mới sẽ tự động kích hoạt.
              </span>
              <Button
                onClick={handleSaveGoals}
                disabled={saving}
                className="gap-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-5"
              >
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                <Save className="h-4 w-4" />
                <span>Lưu mục tiêu &amp; Tự động cập nhật Lộ trình</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tab 3: Kỹ năng & Năng lực */}
      {activeTab === "skills" && (
        <Card className="rounded-2xl border-slate-200/80 shadow-xs bg-white">
          <CardHeader>
            <CardTitle className="text-base font-bold text-slate-900">
              Kỹ năng Chuyên môn &amp; Kỹ năng Mềm
            </CardTitle>
            <CardDescription className="text-xs text-slate-500">
              Kỹ năng giúp hệ thống đánh giá nhãn &quot;Phù hợp lộ trình&quot; trên các bài đăng tuyển dụng
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-5">
            {/* Input thêm nhanh kỹ năng */}
            <div className="flex gap-2">
              <Input
                value={newSkill}
                onChange={(e) => setNewSkill(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddSkill(newSkill);
                  }
                }}
                placeholder="Nhập tên kỹ năng (ví dụ: IELTS 7.5, Python, Thuyết trình)..."
                className="rounded-xl border-slate-200 text-xs sm:text-sm"
              />
              <Button
                onClick={() => handleAddSkill(newSkill)}
                className="gap-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs sm:text-sm"
              >
                <Plus className="h-4 w-4" />
                <span>Thêm</span>
              </Button>
            </div>

            {/* Gợi ý kỹ năng phổ biến */}
            <div className="space-y-2">
              <span className="text-xs font-semibold text-slate-500">Gợi ý kỹ năng nổi bật:</span>
              <div className="flex flex-wrap gap-1.5">
                {suggestedSkills.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => handleAddSkill(s)}
                    className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-700 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 transition-all cursor-pointer"
                  >
                    <Plus className="h-3 w-3 text-slate-400" />
                    <span>{s}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Danh sách kỹ năng hiện tại */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <span className="text-xs font-semibold text-slate-700">
                Kỹ năng trong hồ sơ của bạn ({profile.skills.length}):
              </span>
              {profile.skills.length === 0 ? (
                <p className="text-xs text-slate-400 italic py-2">
                  Chưa có kỹ năng nào được lưu. Hãy thêm kỹ năng của bạn ở trên!
                </p>
              ) : (
                <div className="flex flex-wrap gap-2 pt-1">
                  {profile.skills.map((skill) => (
                    <span
                      key={skill}
                      className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 border border-blue-200/80 px-3.5 py-1 text-xs font-semibold text-blue-700 shadow-2xs"
                    >
                      <span>{skill}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveSkill(skill)}
                        className="rounded-full p-0.5 text-blue-400 hover:bg-blue-200/60 hover:text-blue-800 transition-colors cursor-pointer"
                        title="Xóa kỹ năng"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <Button
                onClick={handleSaveProfile}
                disabled={saving}
                className="gap-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-5"
              >
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                <Save className="h-4 w-4" />
                <span>Lưu danh sách kỹ năng</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tab 4: Bảng vàng thành tích */}
      {activeTab === "achievements" && (
        <Card className="rounded-2xl border-slate-200/80 shadow-xs bg-white">
          <CardHeader>
            <CardTitle className="text-base font-bold text-slate-900">
              Bảng Vàng Thành Tích &amp; Giải Thưởng
            </CardTitle>
            <CardDescription className="text-xs text-slate-500">
              Lưu giữ các giải thưởng, học bổng, đề tài nghiên cứu đã nghiệm thu và danh hiệu sinh viên
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-5">
            {/* Input thêm thành tích */}
            <div className="flex gap-2">
              <Input
                value={newAchievement}
                onChange={(e) => setNewAchievement(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddAchievement();
                  }
                }}
                placeholder="Nhập tên giải thưởng / thành tích (Ví dụ: Giải Nhất Cuộc thi Case Study 2025)..."
                className="rounded-xl border-slate-200 text-xs sm:text-sm"
              />
              <Button
                onClick={handleAddAchievement}
                className="gap-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs sm:text-sm"
              >
                <Plus className="h-4 w-4" />
                <span>Thêm</span>
              </Button>
            </div>

            {/* Danh sách thành tích */}
            <div className="space-y-2">
              {profile.achievements.length === 0 ? (
                <div className="text-center py-8 text-slate-400 space-y-2">
                  <Award className="h-10 w-10 mx-auto text-slate-300" />
                  <p className="text-xs">Chưa có thành tích nào được ghi nhận. Hãy thêm các mốc tự hào của bạn!</p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {profile.achievements.map((ach, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50/50 p-3.5 hover:bg-slate-50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100 text-amber-700 font-bold text-xs">
                          🏆
                        </div>
                        <span className="text-xs sm:text-sm font-semibold text-slate-800">
                          {ach}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveAchievement(idx)}
                        className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 transition-colors cursor-pointer"
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
                onClick={handleSaveProfile}
                disabled={saving}
                className="gap-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-5"
              >
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                <Save className="h-4 w-4" />
                <span>Lưu bảng vàng thành tích</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

