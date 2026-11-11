"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { Eye, EyeOff, Loader2, AlertCircle, CheckCircle2, ArrowRight } from "lucide-react";
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

export default function RegisterPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    // Validate phía client trước khi gửi
    if (name.trim().length < 2) {
      setErrorMessage("Họ và tên phải có ít nhất 2 ký tự.");
      return;
    }

    if (password.length < 6) {
      setErrorMessage("Mật khẩu phải có độ dài tối thiểu 6 ký tự.");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage("Mật khẩu xác nhận không khớp.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          password,
          confirmPassword,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(data.error || "Không thể tạo tài khoản. Vui lòng kiểm tra lại thông tin.");
      } else {
        setSuccessMessage("Đăng ký tài khoản thành công! Đang tự động đăng nhập...");

        // Tự động đăng nhập người dùng ngay sau khi đăng ký thành công
        const loginRes = await signIn("credentials", {
          email: email.trim().toLowerCase(),
          password,
          redirect: false,
        });

        if (loginRes?.ok) {
          router.push("/explore");
          router.refresh();
        } else {
          router.push("/login?registered=true");
        }
      }
    } catch {
      setErrorMessage("Đã có lỗi xảy ra kết nối với máy chủ.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    try {
      setGoogleLoading(true);
      await signIn("google", { callbackUrl: "/explore" });
    } catch {
      setErrorMessage("Không thể kết nối với dịch vụ Google.");
      setGoogleLoading(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-140px)] items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md shadow-xl border-slate-200/80 rounded-2xl bg-white">
        <CardHeader className="text-center space-y-2 pb-4">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-md shadow-blue-500/20 font-bold text-xl">
            U.
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight text-slate-900">
            Tạo tài khoản Unera
          </CardTitle>
          <CardDescription className="text-slate-500 text-xs sm:text-sm">
            Bắt đầu lộ trình định hướng học tập và mở ra cơ hội tương lai
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4 pt-2">
          {errorMessage && (
            <div className="flex items-center gap-2.5 rounded-xl bg-red-50 p-3 text-xs sm:text-sm text-red-700 border border-red-200 animate-in fade-in">
              <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="flex items-center gap-2.5 rounded-xl bg-emerald-50 p-3 text-xs sm:text-sm text-emerald-800 border border-emerald-200 animate-in fade-in">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Google OAuth Button */}
          <button
            type="button"
            onClick={handleGoogleSignUp}
            disabled={googleLoading || loading}
            className="w-full flex items-center justify-center gap-3 rounded-xl border border-slate-200 bg-white py-2.5 px-4 text-xs sm:text-sm font-medium text-slate-700 shadow-2xs hover:bg-slate-50 hover:border-slate-300 transition-all cursor-pointer disabled:opacity-50"
          >
            {googleLoading ? (
              <Loader2 className="h-4 w-4 animate-spin text-slate-500" />
            ) : (
              <svg className="h-4 w-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.27 21.36 7.35 24 12 24z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.98 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.35 0 3.27 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                />
              </svg>
            )}
            <span>Đăng ký nhanh với Google</span>
          </button>

          <div className="relative flex items-center justify-center">
            <div className="w-full border-t border-slate-200" />
            <span className="absolute bg-white px-3 text-[11px] font-medium text-slate-400 uppercase tracking-wider">
              hoặc điền thông tin cá nhân
            </span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700" htmlFor="name">
                Họ và tên
              </label>
              <Input
                id="name"
                type="text"
                required
                placeholder="Nguyễn Văn A"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={loading}
                className="rounded-xl border-slate-200 text-xs sm:text-sm focus:border-blue-500 focus:ring-blue-100"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700" htmlFor="reg-email">
                Địa chỉ Email sinh viên
              </label>
              <Input
                id="reg-email"
                type="email"
                required
                placeholder="sinhvien@unera.edu.vn"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                disabled={loading}
                className="rounded-xl border-slate-200 text-xs sm:text-sm focus:border-blue-500 focus:ring-blue-100"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700" htmlFor="reg-password">
                Mật khẩu (tối thiểu 6 ký tự)
              </label>
              <div className="relative">
                <Input
                  id="reg-password"
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

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700" htmlFor="confirmPassword">
                Xác nhận lại mật khẩu
              </label>
              <Input
                id="confirmPassword"
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
              <span>{loading ? "Đang khởi tạo tài khoản..." : "Tạo tài khoản ngay"}</span>
              {!loading && <ArrowRight className="h-4 w-4" />}
            </Button>
          </form>
        </CardContent>

        <CardFooter className="flex justify-center border-t border-slate-100 pt-4 text-xs text-slate-500">
          Đã có tài khoản Unera?{" "}
          <Link href="/login" className="ml-1 font-semibold text-blue-600 hover:underline">
            Đăng nhập tại đây
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}

