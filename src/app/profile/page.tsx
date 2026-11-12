"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  AlertCircle,
  ArrowUpRight,
  Building2,
  Calendar,
  CheckCircle2,
  Compass,
  FileText,
  GraduationCap,
  Loader2,
  Mail,
  Map as MapIcon,
  Sparkles,
  Trophy,
  User as UserIcon,
} from "lucide-react";
import { ACADEMIC_YEARS } from "@/constants";
import { fetchWithAuth, useAuth } from "@/components/providers/AuthProvider";
import { ProfileAchievementsTab } from "@/components/profile/ProfileAchievementsTab";
import {
  ProfileInfoFields,
  ProfileInfoTab,
} from "@/components/profile/ProfileInfoTab";
import { ProfileRoadmapTab } from "@/components/profile/ProfileRoadmapTab";
import { ProfileSkillsTab } from "@/components/profile/ProfileSkillsTab";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ProfileTabKey = "info" | "skills" | "achievements" | "roadmap";

interface ProfileState extends ProfileInfoFields {
  avatar: string;
  hardSkills: string[];
  softSkills: string[];
  achievements: string[];
  isProfileCompleted?: boolean;
}

const VALID_TABS: readonly ProfileTabKey[] = [
  "info",
  "skills",
  "achievements",
  "roadmap",
];

function resolveTabParam(rawTab: string | null): ProfileTabKey {
  if (rawTab && (VALID_TABS as readonly string[]).includes(rawTab)) {
    return rawTab as ProfileTabKey;
  }
  return "info";
}

const INITIAL_PROFILE: ProfileState = {
  fullName: "",
  birthYear: undefined,
  academicYear: "YEAR_1",
  university: "",
  major: "",
  bio: "",
  avatar: "",
  hardSkills: [],
  softSkills: [],
  achievements: [],
};

function ProfileContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading: authLoading, setAuthUser } = useAuth();

  const activeTab = useMemo(
    () => resolveTabParam(searchParams.get("tab")),
    [searchParams]
  );

  const [profile, setProfile] = useState<ProfileState>(INITIAL_PROFILE);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      router.replace("/login?callbackUrl=/profile");
      return;
    }

    let cancelled = false;

    async function loadProfile() {
      try {
        const res = await fetchWithAuth("/api/profile");
        const data = await res.json();
        if (cancelled) return;

        if (!res.ok || !data.profile) {
          setMessage({
            type: "error",
            text: data.error || "Không thể tải thông tin hồ sơ sinh viên.",
          });
          return;
        }

        const p = data.profile;
        setProfile({
          fullName: typeof p.fullName === "string" ? p.fullName : user?.name || "",
          birthYear:
            typeof p.birthYear === "number" ? p.birthYear : undefined,
          academicYear:
            typeof p.academicYear === "string" && p.academicYear
              ? p.academicYear
              : "YEAR_1",
          university: typeof p.university === "string" ? p.university : "",
          major: typeof p.major === "string" ? p.major : "",
          bio: typeof p.bio === "string" ? p.bio : "",
          avatar: typeof p.avatar === "string" ? p.avatar : "",
          hardSkills: Array.isArray(p.hardSkills) ? p.hardSkills : [],
          softSkills: Array.isArray(p.softSkills) ? p.softSkills : [],
          achievements: Array.isArray(p.achievements) ? p.achievements : [],
          isProfileCompleted: Boolean(p.isProfileCompleted),
        });
      } catch {
        if (!cancelled) {
          setMessage({
            type: "error",
            text: "Không thể kết nối đến máy chủ để tải hồ sơ.",
          });
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadProfile();

    return () => {
      cancelled = true;
    };
  }, [authLoading, user, router]);

  const handleTabChange = useCallback(
    (tab: ProfileTabKey) => {
      setMessage(null);
      const nextUrl = tab === "info" ? "/profile" : `/profile?tab=${tab}`;
      router.replace(nextUrl, { scroll: false });
    },
    [router]
  );

  const persistProfilePatch = useCallback(
    async (patch: Record<string, unknown>, successText: string) => {
      setSaving(true);
      setMessage(null);

      try {
        const res = await fetchWithAuth("/api/profile", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(patch),
        });

        const data = await res.json();

        if (!res.ok || !data.profile) {
          setMessage({
            type: "error",
            text: data.error || "Lưu thay đổi thất bại. Vui lòng kiểm tra lại.",
          });
          return;
        }

        const updated = data.profile;
        setProfile((prev) => ({
          ...prev,
          fullName:
            typeof updated.fullName === "string"
              ? updated.fullName
              : prev.fullName,
          birthYear:
            typeof updated.birthYear === "number"
              ? updated.birthYear
              : updated.birthYear === undefined
                ? prev.birthYear
                : undefined,
          academicYear:
            typeof updated.academicYear === "string" && updated.academicYear
              ? updated.academicYear
              : prev.academicYear,
          university:
            typeof updated.university === "string"
              ? updated.university
              : prev.university,
          major:
            typeof updated.major === "string" ? updated.major : prev.major,
          bio: typeof updated.bio === "string" ? updated.bio : prev.bio,
          hardSkills: Array.isArray(updated.hardSkills)
            ? updated.hardSkills
            : prev.hardSkills,
          softSkills: Array.isArray(updated.softSkills)
            ? updated.softSkills
            : prev.softSkills,
          achievements: Array.isArray(updated.achievements)
            ? updated.achievements
            : prev.achievements,
          isProfileCompleted:
            typeof updated.isProfileCompleted === "boolean"
              ? updated.isProfileCompleted
              : prev.isProfileCompleted,
        }));

        if (typeof patch.fullName === "string" && user) {
          setAuthUser({
            ...user,
            name: updated.fullName || patch.fullName,
            isProfileCompleted:
              typeof updated.isProfileCompleted === "boolean"
                ? updated.isProfileCompleted
                : user.isProfileCompleted,
          });
        }

        setMessage({ type: "success", text: successText });
      } catch {
        setMessage({
          type: "error",
          text: "Lỗi kết nối máy chủ khi lưu hồ sơ. Vui lòng thử lại.",
        });
      } finally {
        setSaving(false);
      }
    },
    [setAuthUser, user]
  );

  const handleSaveInfo = useCallback(async () => {
    await persistProfilePatch(
      {
        fullName: profile.fullName.trim(),
        birthYear: profile.birthYear,
        academicYear: profile.academicYear,
        university: profile.university.trim(),
        major: profile.major.trim(),
        bio: profile.bio.trim(),
      },
      "Đã cập nhật thông tin cá nhân & học vấn thành công."
    );
  }, [persistProfilePatch, profile]);

  const handleSaveSkills = useCallback(async () => {
    await persistProfilePatch(
      {
        hardSkills: profile.hardSkills,
        softSkills: profile.softSkills,
      },
      "Đã lưu danh sách kỹ năng chuyên môn & kỹ năng mềm."
    );
  }, [persistProfilePatch, profile.hardSkills, profile.softSkills]);

  const handleSaveAchievements = useCallback(async () => {
    await persistProfilePatch(
      {
        achievements: profile.achievements,
      },
      "Đã cập nhật bảng thành tích cá nhân."
    );
  }, [persistProfilePatch, profile.achievements]);

  const academicYearLabel = useMemo(() => {
    return (
      ACADEMIC_YEARS.find((y) => y.value === profile.academicYear)?.label ||
      profile.academicYear
    );
  }, [profile.academicYear]);

  const displayName = profile.fullName || user?.name || "Sinh viên Unera";
  const avatarInitial = displayName.trim().charAt(0).toUpperCase() || "U";
  const totalSkillsCount =
    profile.hardSkills.length + profile.softSkills.length;

  if (authLoading || loading) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8 space-y-6">
        <div className="h-44 rounded-3xl bg-white border border-slate-200/80 animate-pulse" />
        <div className="h-12 w-full max-w-2xl rounded-2xl bg-white border border-slate-200/80 animate-pulse" />
        <div className="h-96 rounded-2xl bg-white border border-slate-200/80 animate-pulse" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8 space-y-6">
      {/* Hero Header */}
      <section className="relative overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-sm">
        <div className="h-24 w-full bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-500" />
        <div className="px-6 pb-6 sm:px-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between -mt-10">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end min-w-0 flex-1">
              <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl border-4 border-white bg-gradient-to-br from-blue-600 to-indigo-700 text-2xl font-bold text-white shadow-md">
                {avatarInitial}
              </div>

              <div className="min-w-0 flex-1 space-y-1.5 pt-1 sm:pt-11">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
                    {displayName}
                  </h1>
                  <Badge className="bg-blue-50 text-blue-700 border border-blue-200 font-medium">
                    <GraduationCap className="mr-1 h-3.5 w-3.5" />
                    {academicYearLabel}
                  </Badge>
                  {profile.birthYear && (
                    <Badge
                      variant="outline"
                      className="border-slate-200 bg-slate-50 text-slate-600 font-medium"
                    >
                      <Calendar className="mr-1 h-3 w-3" />
                      {profile.birthYear}
                    </Badge>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs sm:text-sm text-slate-600">
                  <span className="inline-flex items-center gap-1.5">
                    <Building2 className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                    <span>{profile.university || "Chưa chọn trường đại học"}</span>
                  </span>
                  {profile.major && (
                    <span className="inline-flex items-center gap-1.5 font-medium text-slate-700">
                      <Compass className="h-3.5 w-3.5 shrink-0 text-blue-500" />
                      <span>Ngành: {profile.major}</span>
                    </span>
                  )}
                  <span className="inline-flex items-center gap-1.5 text-slate-500">
                    <Mail className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                    <span>{user.email}</span>
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0 lg:flex-nowrap lg:justify-end lg:pb-0.5">
              <Link
                href="/tools/cv-builder"
                className={cn(
                  buttonVariants({ variant: "outline", size: "sm" }),
                  "h-9 rounded-xl border-blue-200 bg-blue-50/80 px-3.5 text-xs font-medium text-blue-700 hover:bg-blue-100 hover:text-blue-800 whitespace-nowrap"
                )}
              >
                <FileText className="mr-1.5 h-3.5 w-3.5" />
                Tạo CV chuẩn ATS
              </Link>
              <Link
                href="/onboarding"
                className={cn(
                  buttonVariants({ variant: "outline", size: "sm" }),
                  "h-9 rounded-xl border-slate-200 bg-white px-3.5 text-xs font-medium text-slate-700 hover:bg-slate-50 whitespace-nowrap"
                )}
              >
                <Sparkles className="mr-1.5 h-3.5 w-3.5 text-indigo-500" />
                Khảo sát định hướng
              </Link>
              <Link
                href="/roadmap"
                className={cn(
                  buttonVariants({ size: "sm" }),
                  "h-9 rounded-xl bg-blue-600 px-3.5 text-xs font-medium text-white shadow-xs hover:bg-blue-700 whitespace-nowrap"
                )}
              >
                <MapIcon className="mr-1.5 h-3.5 w-3.5" />
                Lộ trình chi tiết
                <ArrowUpRight className="ml-1 h-3.5 w-3.5" />
              </Link>
            </div>
          </div>

          {profile.bio && (
            <p className="mt-4 rounded-xl bg-slate-50/90 border border-slate-100 px-4 py-3 text-xs sm:text-sm text-slate-600 leading-relaxed">
              {profile.bio}
            </p>
          )}
        </div>
      </section>

      {/* Navigation Tabs */}
      <nav
        aria-label="Hồ sơ sinh viên"
        className="flex flex-wrap gap-2 rounded-2xl border border-slate-200/80 bg-white p-1.5 shadow-sm"
      >
        <button
          type="button"
          onClick={() => handleTabChange("info")}
          className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs sm:text-sm font-medium transition-colors cursor-pointer ${
            activeTab === "info"
              ? "bg-blue-600 text-white shadow-sm"
              : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
          }`}
        >
          <UserIcon className="h-4 w-4" />
          <span>Thông tin & Học vấn</span>
        </button>

        <button
          type="button"
          onClick={() => handleTabChange("skills")}
          className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs sm:text-sm font-medium transition-colors cursor-pointer ${
            activeTab === "skills"
              ? "bg-blue-600 text-white shadow-sm"
              : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
          }`}
        >
          <Sparkles className="h-4 w-4" />
          <span>Kỹ năng</span>
          <span
            className={`rounded-full px-1.5 py-0.5 text-[11px] font-semibold ${
              activeTab === "skills"
                ? "bg-white/20 text-white"
                : "bg-slate-100 text-slate-600"
            }`}
          >
            {totalSkillsCount}
          </span>
        </button>

        <button
          type="button"
          onClick={() => handleTabChange("achievements")}
          className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs sm:text-sm font-medium transition-colors cursor-pointer ${
            activeTab === "achievements"
              ? "bg-blue-600 text-white shadow-sm"
              : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
          }`}
        >
          <Trophy className="h-4 w-4" />
          <span>Bảng thành tích</span>
          <span
            className={`rounded-full px-1.5 py-0.5 text-[11px] font-semibold ${
              activeTab === "achievements"
                ? "bg-white/20 text-white"
                : "bg-slate-100 text-slate-600"
            }`}
          >
            {profile.achievements.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => handleTabChange("roadmap")}
          className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs sm:text-sm font-medium transition-colors cursor-pointer ${
            activeTab === "roadmap"
              ? "bg-blue-600 text-white shadow-sm"
              : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
          }`}
        >
          <MapIcon className="h-4 w-4" />
          <span>Lộ trình cá nhân</span>
        </button>
      </nav>

      {/* Feedback Banner */}
      {message && (
        <div
          role="alert"
          className={`flex items-center gap-2.5 rounded-xl border px-4 py-3 text-xs sm:text-sm font-medium ${
            message.type === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
              : "border-rose-200 bg-rose-50 text-rose-700"
          }`}
        >
          {message.type === "success" ? (
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
          ) : (
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {/* Active Tab Content */}
      {activeTab === "info" && (
        <ProfileInfoTab
          profile={{
            fullName: profile.fullName,
            birthYear: profile.birthYear,
            academicYear: profile.academicYear,
            university: profile.university,
            major: profile.major,
            bio: profile.bio,
          }}
          onChange={(updated) => {
            setMessage(null);
            setProfile((prev) => ({ ...prev, ...updated }));
          }}
          onSave={handleSaveInfo}
          onValidationError={(msg) => setMessage({ type: "error", text: msg })}
          saving={saving}
        />
      )}

      {activeTab === "skills" && (
        <ProfileSkillsTab
          hardSkills={profile.hardSkills}
          softSkills={profile.softSkills}
          onChangeSkills={(hardSkills, softSkills) => {
            setMessage(null);
            setProfile((prev) => ({ ...prev, hardSkills, softSkills }));
          }}
          onSave={handleSaveSkills}
          onError={(msg) => setMessage({ type: "error", text: msg })}
          saving={saving}
        />
      )}

      {activeTab === "achievements" && (
        <ProfileAchievementsTab
          achievements={profile.achievements}
          onChange={(achievements) => {
            setMessage(null);
            setProfile((prev) => ({ ...prev, achievements }));
          }}
          onSave={handleSaveAchievements}
          onError={(msg) => setMessage({ type: "error", text: msg })}
          saving={saving}
        />
      )}

      {activeTab === "roadmap" && <ProfileRoadmapTab />}
    </div>
  );
}

export default function ProfilePage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[60vh] items-center justify-center text-slate-500 gap-2 text-sm">
          <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
          <span>Đang tải hồ sơ sinh viên...</span>
        </div>
      }
    >
      <ProfileContent />
    </Suspense>
  );
}
