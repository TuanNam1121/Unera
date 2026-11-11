"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { KeyRound, Eye, EyeOff, Loader2, AlertCircle, CheckCircle2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [success, setSuccess] = useState(false);

  if (!token) {
    return (
      <div className="flex min-h-[calc(100vh-140px)] items-center justify-center px-4 py-12">
        <Card className="w-full max-w-md shadow-xl border-slate-200/80 rounded-2xl bg-white p-6 text-center space-y-4">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 border border-amber-200">
            <AlertCircle className="h-6 w-6" />
          </div>
          <CardTitle className="text-xl font-bold text-slate-900">
            Thiếu mã xác thực
          </CardTitle>
          <CardDescription className="text-slate-500 text-xs sm:text-sm">
            Liên kết đặt lại mật khẩu không hợp lệ hoặc thiếu mã token xác thực. Vui lòng gửi lại yêu cầu mới.
          </CardDescription>
          <div className="pt-2">
            <Link
              href="/forgot-password"
              className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs sm:text-sm font-medium text-white hover:bg-blue-700 transition-colors"
            >
              <span>Yêu cầu liên kết mới</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    if (password.length < 6) {
      setErrorMessage("Mật khẩu mới phải có tối thiểu 6 ký tự.");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage("Mật khẩu xác nhận không khớp.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          password,
          confirmPassword,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(data.error || "Không thể đặt lại mật khẩu.");
      } else {
        setSuccess(true);
        setTimeout(() => {
          router.push("/login?reset=success");
        }, 2000);
      }
    } catch {
      setErrorMessage("Đã có lỗi xảy ra kết nối với máy chủ.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-140px)] items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md shadow-xl border-slate-200/80 rounded-2xl bg-white">
        <CardHeader className="text-center space-y-2 pb-4">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 border border-blue-100 font-bold text-xl">
            <KeyRound className="h-6 w-6 text-blue-600" />
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight text-slate-900">
            Đặt lại mật khẩu mới
          </CardTitle>
          <CardDescription className="text-slate-500 text-xs sm:text-sm">
            Tạo mật khẩu an toàn mới cho tài khoản của bạn
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4 pt-2">
          {errorMessage && (
            <div className="flex items-center gap-2.5 rounded-xl bg-red-50 p-3 text-xs sm:text-sm text-red-700 border border-red-200 animate-in fade-in">
              <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          {success ? (
            <div className="space-y-3 animate-in fade-in text-center py-4">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <p className="font-semibold text-slate-900 text-base">
                Đặt lại mật khẩu thành công!
              </p>
              <p className="text-xs text-slate-500">
                Đang chuyển hướng về trang đăng nhập...
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700" htmlFor="new-password">
                  Mật khẩu mới (tối thiểu 6 ký tự)
                </label>
                <div className="relative">
                  <Input
                    id="new-password"
                    type={showPassword ? "text" : "password"}
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="new-password"
                    disabled={loading}
                    className="rounded-xl border-slate-200 pr-10 text-xs sm:text-sm focus:border-blue-500 focus:ring-blue-100"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700" htmlFor="confirm-new-password">
                  Xác nhận lại mật khẩu mới
                </label>
                <Input
                  id="confirm-new-password"
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  autoComplete="new-password"
                  disabled={loading}
                  className="rounded-xl border-slate-200 text-xs sm:text-sm focus:border-blue-500 focus:ring-blue-100"
                />
              </div>

              <Button
                type="submit"
                className="w-full gap-2 mt-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl py-2.5 font-medium shadow-xs"
                disabled={loading}
              >
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                <span>{loading ? "Đang lưu mật khẩu mới..." : "Lưu mật khẩu mới"}</span>
                {!loading && <ArrowRight className="h-4 w-4" />}
              </Button>
            </form>
          )}
        </CardContent>

        <CardFooter className="flex justify-center border-t border-slate-100 pt-4 text-xs text-slate-500">
          <Link
            href="/login"
            className="font-medium text-blue-600 hover:underline"
          >
            Quay lại trang Đăng nhập
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[calc(100vh-140px)] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}

