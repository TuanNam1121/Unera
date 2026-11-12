"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  ArrowRight,
  Building2,
  Calendar,
  Check,
  CheckCircle2,
  GraduationCap,
  Loader2,
  LogOut,
  User as UserIcon,
} from "lucide-react";
import { ACADEMIC_YEARS, ONBOARDING_STEPS } from "@/constants";
import { isPresetUniversity } from "@/constants/universities";
import { UniversityCombobox } from "@/components/profile/UniversityCombobox";
import { fetchWithAuth, useAuth } from "@/components/providers/AuthProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function CompleteProfilePage() {
  const router = useRouter();
  const { user, loading: authLoading, setAuthUser, refreshUser, logout } =
    useAuth();

  const [fullNameInput, setFullNameInput] = useState<string | null>(null);
  const [birthYear, setBirthYear] = useState("");
  const [academicYear, setAcademicYear] = useState<string>("YEAR_1");
  const [university, setUniversity] = useState("");
  const [major, setMajor] = useState("");
  const [uniForceOpenSignal, setUniForceOpenSignal] = useState(0);

  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const defaultFullName = useMemo(() => {
    if (!user?.name) return "";
    const emailPrefix = user.email?.split("@")[0] || "";
    return user.name !== emailPrefix ? user.name : "";
  }, [user]);

  const fullName = fullNameInput !== null ? fullNameInput : defaultFullName;

  useEffect(() => {
    if (
      !authLoading &&
      !submitting &&
      user?.isProfileCompleted &&
      user.role !== "ADMIN"
    ) {
      router.replace(
        user.onboardingStep === ONBOARDING_STEPS.QUIZ
          ? "/onboarding?from=register"
          : "/"
      );
    }
  }, [user, authLoading, submitting, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    const trimmedName = fullName.trim();
    const numericBirthYear = Number(birthYear);
    const maxBirthYear = new Date().getFullYear() - 15;

    if (trimmedName.length < 2) {
      setErrorMessage("Vui lòng nhập họ và tên đầy đủ (tối thiểu 2 ký tự).");
      return;
    }

    if (
      !Number.isInteger(numericBirthYear) ||
      numericBirthYear < 1960 ||
      numericBirthYear > maxBirthYear
    ) {
      setErrorMessage(
        `Vui lòng nhập năm sinh hợp lệ (từ 1960 đến ${maxBirthYear}).`
      );
      return;
    }

    if (!university || !isPresetUniversity(university)) {
      setErrorMessage(
        "Vui lòng chọn Trường Đại học từ danh sách gợi ý của hệ thống."
      );
      setUniForceOpenSignal((prev) => prev + 1);
      return;
    }

    if (major.trim().length < 2) {
      setErrorMessage("Vui lòng nhập tên ngành học của bạn.");
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetchWithAuth("/api/auth/complete-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: trimmedName,
          birthYear: numericBirthYear,
          academicYear,
          university,
          major: major.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(
          data.error || "Không thể lưu thông tin hồ sơ. Vui lòng thử lại."
        );
        return;
      }

      if (data.user) {
        setAuthUser(data.user);
      } else {
        await refreshUser();
      }

      setSuccessMessage(
        "Hoàn thiện hồ sơ thành công! Đang chuyển sang Quiz định hướng..."
      );
      router.push(data.nextStepUrl || "/onboarding?from=register");
      router.refresh();
    } catch {
      setErrorMessage("Đã xảy ra lỗi khi kết nối với máy chủ.");
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading) {
    return (
      <div className="flex min-h-[calc(100vh-140px)] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="flex min-h-[calc(100vh-140px)] items-center justify-center px-4 py-10 sm:px-6 lg:px-8">
      <div className="w-full max-w-lg space-y-5">
        {/* Stepper 3 bước */}
        <div className="flex items-center justify-between rounded-2xl border border-slate-200/80 bg-white px-4 py-3 shadow-2xs">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
              <Check className="h-3.5 w-3.5" />
            </span>
            <span className="text-xs font-medium text-emerald-700">
              Tài khoản
            </span>
          </div>
          <div className="h-px flex-1 mx-2 bg-blue-200" />
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-[11px] font-bold text-white">
              2
            </span>
            <span className="text-xs font-semibold text-blue-700">
              Hồ sơ sinh viên
            </span>
          </div>
          <div className="h-px flex-1 mx-2 bg-slate-200" />
          <div className="flex items-center gap-2 opacity-60">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-[11px] font-semibold text-slate-500">
              3
            </span>
            <span className="text-xs font-medium text-slate-500">
              Quiz định hướng
            </span>
          </div>
        </div>

        <Card className="w-full shadow-xl border-slate-200/80 rounded-2xl bg-white">
          <CardHeader className="text-center space-y-2 pb-4">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 border border-blue-100">
              <GraduationCap className="h-6 w-6" />
            </div>
            <CardTitle className="text-2xl font-bold tracking-tight text-slate-900">
              Thông tin sinh viên của bạn
            </CardTitle>
            <CardDescription className="text-slate-500 text-xs sm:text-sm">
              Bước 2/3: Hoàn thiện thông tin cơ bản trước khi làm Quiz định hướng
            </CardDescription>
            {user?.email && (
              <div className="inline-flex items-center justify-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-[11px] font-medium text-slate-600">
                <span>Tài khoản:</span>
                <span className="font-semibold text-slate-800">{user.email}</span>
              </div>
            )}
          </CardHeader>

          <CardContent className="space-y-4 pt-2">
            {errorMessage && (
              <div className="flex items-center gap-2.5 rounded-xl bg-red-50 p-3 text-xs sm:text-sm text-red-700 border border-red-200">
                <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
                <span>{errorMessage}</span>
              </div>
            )}

            {successMessage && (
              <div className="flex items-center gap-2.5 rounded-xl bg-emerald-50 p-3 text-xs sm:text-sm text-emerald-800 border border-emerald-200">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                <span>{successMessage}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Họ và tên */}
              <div className="space-y-1.5">
                <label
                  className="text-xs font-semibold text-slate-700 flex items-center gap-1.5"
                  htmlFor="fullName"
                >
                  <UserIcon className="h-3.5 w-3.5 text-slate-400" />
                  <span>Họ và tên</span>
                </label>
                <Input
                  id="fullName"
                  type="text"
                  required
                  placeholder="Nguyễn Văn An"
                  value={fullName}
                  onChange={(e) => setFullNameInput(e.target.value)}
                  disabled={submitting}
                  className="rounded-xl border-slate-200 text-xs sm:text-sm focus:border-blue-500 focus:ring-blue-100"
                />
              </div>

              {/* Năm sinh + Sinh viên năm mấy */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label
                    className="text-xs font-semibold text-slate-700 flex items-center gap-1.5"
                    htmlFor="birthYear"
                  >
                    <Calendar className="h-3.5 w-3.5 text-slate-400" />
                    <span>Năm sinh</span>
                  </label>
                  <Input
                    id="birthYear"
                    type="number"
                    min={1960}
                    max={new Date().getFullYear() - 15}
                    required
                    placeholder="Ví dụ: 2005"
                    value={birthYear}
                    onChange={(e) => setBirthYear(e.target.value)}
                    disabled={submitting}
                    className="rounded-xl border-slate-200 text-xs sm:text-sm focus:border-blue-500 focus:ring-blue-100"
                  />
                </div>

                <div className="space-y-1.5">
                  <label
                    className="text-xs font-semibold text-slate-700 flex items-center gap-1.5"
                    htmlFor="academicYear"
                  >
                    <GraduationCap className="h-3.5 w-3.5 text-slate-400" />
                    <span>Sinh viên năm mấy</span>
                  </label>
                  <select
                    id="academicYear"
                    value={academicYear}
                    onChange={(e) => setAcademicYear(e.target.value)}
                    disabled={submitting}
                    className="w-full h-9 rounded-xl border border-slate-200 bg-white px-3 text-xs sm:text-sm text-slate-800 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  >
                    {ACADEMIC_YEARS.map((item) => (
                      <option key={item.value} value={item.value}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Trường Đại học (chọn từ list có sẵn kèm tìm kiếm nhanh) */}
              <div className="space-y-1.5">
                <label
                  className="text-xs font-semibold text-slate-700 flex items-center gap-1.5"
                  htmlFor="universitySearch"
                >
                  <Building2 className="h-3.5 w-3.5 text-slate-400" />
                  <span>Trường Đại học (chọn từ danh sách)</span>
                </label>

                <UniversityCombobox
                  id="universitySearch"
                  value={university}
                  onChange={setUniversity}
                  disabled={submitting}
                  forceOpenSignal={uniForceOpenSignal}
                />
              </div>

              {/* Ngành học (tự điền) */}
              <div className="space-y-1.5">
                <label
                  className="text-xs font-semibold text-slate-700"
                  htmlFor="major"
                >
                  Ngành học (tự điền)
                </label>
                <Input
                  id="major"
                  type="text"
                  required
                  placeholder="Ví dụ: Ngôn ngữ Anh, Công nghệ thông tin, Kinh tế quốc tế..."
                  value={major}
                  onChange={(e) => setMajor(e.target.value)}
                  disabled={submitting}
                  className="rounded-xl border-slate-200 text-xs sm:text-sm focus:border-blue-500 focus:ring-blue-100"
                />
              </div>

              <Button
                type="submit"
                className="w-full gap-2 mt-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl py-2.5 font-medium shadow-xs"
                disabled={submitting}
              >
                {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                <span>
                  {submitting
                    ? "Đang lưu hồ sơ..."
                    : "Hoàn tất & Làm Quiz định hướng"}
                </span>
                {!submitting && <ArrowRight className="h-4 w-4" />}
              </Button>
            </form>
          </CardContent>

          <CardFooter className="flex justify-center border-t border-slate-100 pt-4">
            <button
              type="button"
              onClick={() => logout("/login")}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-red-600 transition-colors cursor-pointer"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>Đăng xuất và sử dụng tài khoản khác</span>
            </button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
