"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { Sparkles, Eye, EyeOff, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setLoading(true);

    try {
      const res = await signIn("credentials", {
        email: email.trim(),
        password,
        redirect: false,
      });

      if (res?.error) {
        setErrorMessage(res.error || "Email hoặc mật khẩu không chính xác.");
      } else {
        router.push("/explore");
        router.refresh();
      }
    } catch {
      setErrorMessage("Đã có lỗi xảy ra trong quá trình đăng nhập.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-140px)] items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md shadow-lg border-gray-200">
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-md shadow-indigo-500/20">
            <Sparkles className="h-6 w-6" />
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight text-gray-900">
            Đăng nhập UNERA
          </CardTitle>
          <CardDescription>
            Tiếp tục hành trình định hướng học tập &amp; phát triển sự nghiệp
          </CardDescription>
        </CardHeader>

        <CardContent>
          {errorMessage && (
            <div className="mb-4 flex items-center gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-700 border border-red-200">
              <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700" htmlFor="email">
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
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700" htmlFor="password">
                  Mật khẩu
                </label>
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
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button type="submit" className="w-full gap-2 mt-2" disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {loading ? "Đang đăng nhập..." : "Đăng nhập"}
            </Button>
          </form>

          {/* Seed account quick helper hint */}
          <div className="mt-4 rounded-lg bg-indigo-50/60 p-3 text-xs text-indigo-900 border border-indigo-100/80">
            <p className="font-semibold mb-1">Tài khoản thử nghiệm mặc định:</p>
            <p>Admin: <code className="bg-indigo-100/80 px-1 py-0.5 rounded">admin@unera.edu.vn</code> / <code className="bg-indigo-100/80 px-1 py-0.5 rounded">Admin@123456</code></p>
            <p className="mt-0.5">Sinh viên: <code className="bg-indigo-100/80 px-1 py-0.5 rounded">student@unera.edu.vn</code> / <code className="bg-indigo-100/80 px-1 py-0.5 rounded">Student@123456</code></p>
          </div>
        </CardContent>

        <CardFooter className="flex justify-center text-xs text-gray-500">
          Chưa có tài khoản?{" "}
          <Link href="/register" className="ml-1 font-semibold text-indigo-600 hover:underline">
            Đăng ký ngay
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}
