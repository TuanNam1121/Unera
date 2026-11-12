"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Eye,
  EyeOff,
  Loader2,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";
import { useAuth } from "@/components/providers/AuthProvider";
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

const URL_ERROR_MESSAGES: Record<string, string> = {
  AccountDisabled:
    "Tài khoản của bạn đã bị vô hiệu hóa. Vui lòng liên hệ quản trị viên.",
  GoogleOAuthNotConfigured:
    "Đăng nhập Google chưa được cấu hình trên máy chủ.",
  GoogleOAuthCancelled:
    "Bạn đã hủy quá trình đăng nhập bằng Google.",
  GoogleOAuthStateInvalid:
    "Phiên xác thực Google không hợp lệ hoặc đã hết hạn. Vui lòng thử lại.",
  GoogleOAuthTokenFailed:
    "Không thể xác thực mã ủy quyền với Google. Vui lòng thử lại.",
  GoogleOAuthProfileFailed:
    "Không thể lấy thông tin hồ sơ từ tài khoản Google.",
  GoogleEmailNotVerified:
    "Email Google của bạn chưa được xác minh.",
  GoogleOAuthServerError:
    "Có lỗi xảy ra khi đăng nhập bằng Google. Vui lòng thử lại sau.",
};

function LoginForm() {
  const searchParams = useSearchParams();
  const { setAuthUser, refreshUser } = useAuth();

  const callbackUrl = searchParams.get("callbackUrl") || "/";
  const urlError = searchParams.get("error");
  const isResetSuccess = searchParams.get("reset") === "success";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(
    urlError
      ? URL_ERROR_MESSAGES[urlError] || "Đã xảy ra lỗi trong quá trình xác thực."
      : ""
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          password,
          rememberMe,
          callbackUrl,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(data.error || "Email hoặc mật khẩu không chính xác.");
        return;
      }

      if (data.user) {
        setAuthUser(data.user);
      } else {
        await refreshUser();
      }

      window.location.assign(data.redirectTo || "/");
    } catch {
      setErrorMessage("Đã có lỗi xảy ra khi kết nối với máy chủ.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = () => {
    setGoogleLoading(true);
    const target = new URL("/api/auth/google", window.location.origin);
    target.searchParams.set("callbackUrl", callbackUrl);
    window.location.assign(target.toString());
  };

  return (
    <div className="flex min-h-[calc(100vh-140px)] items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md shadow-xl border-slate-200/80 rounded-2xl bg-white">
        <CardHeader className="text-center space-y-2 pb-4">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-md shadow-blue-500/20 font-bold text-xl">
            U.
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight text-slate-900">
            Đăng nhập Unera
          </CardTitle>
          <CardDescription className="text-slate-500 text-xs sm:text-sm">
            Tiếp tục hành trình định hướng học tập &amp; phát triển sự nghiệp
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4 pt-2">
          {isResetSuccess && !errorMessage && (
            <div className="flex items-center gap-2.5 rounded-xl bg-emerald-50 p-3 text-xs sm:text-sm text-emerald-800 border border-emerald-200">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
              <span>
                Đặt lại mật khẩu thành công! Vui lòng đăng nhập với mật khẩu mới.
              </span>
            </div>
          )}

          {errorMessage && (
            <div className="flex items-center gap-2.5 rounded-xl bg-red-50 p-3 text-xs sm:text-sm text-red-700 border border-red-200">
              <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Google OAuth Button */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
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
            <span>Đăng nhập bằng Google</span>
          </button>

          <p className="text-[11px] text-center text-slate-400">
            Chưa có tài khoản Gmail trên Unera? Hệ thống sẽ tự động đăng ký cho bạn.
          </p>

          <div className="relative flex items-center justify-center">
            <div className="w-full border-t border-slate-200" />
            <span className="absolute bg-white px-3 text-[11px] font-medium text-slate-400 uppercase tracking-wider">
              hoặc đăng nhập bằng email
            </span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700" htmlFor="email">
                Địa chỉ Email
              </label>
              <Input
                id="email"
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

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-700" htmlFor="password">
                  Mật khẩu
                </label>
                <Link
                  href="/forgot-password"
                  className="text-xs font-medium text-blue-600 hover:text-blue-700 hover:underline"
                >
                  Quên mật khẩu?
                </Link>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
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

            <div className="flex items-center gap-2">
              <input
                id="remember"
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="h-3.5 w-3.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
              />
              <label htmlFor="remember" className="text-xs text-slate-600 cursor-pointer">
                Ghi nhớ đăng nhập (30 ngày)
              </label>
            </div>

            <Button
              type="submit"
              className="w-full gap-2 mt-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl py-2.5 font-medium shadow-xs"
              disabled={loading}
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              <span>{loading ? "Đang xác thực..." : "Đăng nhập"}</span>
              {!loading && <ArrowRight className="h-4 w-4" />}
            </Button>
          </form>
        </CardContent>

        <CardFooter className="flex justify-center border-t border-slate-100 pt-4 text-xs text-slate-500">
          Chưa có tài khoản?{" "}
          <Link href="/register" className="ml-1 font-semibold text-blue-600 hover:underline">
            Đăng ký tài khoản mới
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[calc(100vh-140px)] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
