"use client";

import { useState } from "react";
import Link from "next/link";
import { Mail, Loader2, AlertCircle, CheckCircle2, ArrowLeft, ArrowRight } from "lucide-react";
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

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successInfo, setSuccessInfo] = useState<{
    message: string;
    debugResetLink?: string;
  } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(data.error || "Không thể gửi yêu cầu đặt lại mật khẩu.");
      } else {
        setSuccessInfo({
          message: data.message,
          debugResetLink: data.debugResetLink,
        });
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
            <Mail className="h-6 w-6 text-blue-600" />
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight text-slate-900">
            Khôi phục mật khẩu
          </CardTitle>
          <CardDescription className="text-slate-500 text-xs sm:text-sm">
            Nhập địa chỉ email đăng ký để nhận liên kết đặt lại mật khẩu
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4 pt-2">
          {errorMessage && (
            <div className="flex items-center gap-2.5 rounded-xl bg-red-50 p-3 text-xs sm:text-sm text-red-700 border border-red-200 animate-in fade-in">
              <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successInfo ? (
            <div className="space-y-4 animate-in fade-in">
              <div className="flex items-start gap-3 rounded-xl bg-emerald-50 p-4 text-xs sm:text-sm text-emerald-900 border border-emerald-200">
                <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-semibold text-emerald-950">Yêu cầu đã được tiếp nhận!</p>
                  <p className="leading-relaxed">{successInfo.message}</p>
                </div>
              </div>

              {/* Development quick link */}
              {successInfo.debugResetLink && (
                <div className="rounded-xl bg-amber-50 p-3.5 text-xs text-amber-900 border border-amber-200/80 space-y-2">
                  <p className="font-semibold text-amber-950 flex items-center gap-1.5">
                    <span>🛠️ Môi trường thử nghiệm (Development):</span>
                  </p>
                  <p className="text-amber-800">
                    Bấm nút bên dưới để chuyển tiếp ngay đến trang đặt lại mật khẩu:
                  </p>
                  <Link
                    href={successInfo.debugResetLink}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-amber-700 transition-colors shadow-2xs"
                  >
                    <span>Mở trang đặt lại mật khẩu</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              )}

              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setSuccessInfo(null);
                  setEmail("");
                }}
                className="w-full rounded-xl text-xs sm:text-sm border-slate-200"
              >
                Gửi lại yêu cầu khác
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700" htmlFor="email">
                  Địa chỉ Email tài khoản
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

              <Button
                type="submit"
                className="w-full gap-2 mt-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl py-2.5 font-medium shadow-xs"
                disabled={loading}
              >
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                <span>{loading ? "Đang xử lý..." : "Gửi liên kết khôi phục"}</span>
                {!loading && <ArrowRight className="h-4 w-4" />}
              </Button>
            </form>
          )}
        </CardContent>

        <CardFooter className="flex justify-center border-t border-slate-100 pt-4 text-xs text-slate-500">
          <Link
            href="/login"
            className="inline-flex items-center gap-1.5 font-medium text-slate-600 hover:text-blue-600 transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Quay lại trang Đăng nhập</span>
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}

