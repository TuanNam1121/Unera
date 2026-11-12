"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";

function RedirectToAdminUsers() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const params = new URLSearchParams();
    const status = searchParams.get("status");
    const role = searchParams.get("role");
    params.set("role", role || "STUDENT");
    if (status) params.set("status", status);
    router.replace(`/admin/users?${params.toString()}`);
  }, [router, searchParams]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center gap-2 text-xs text-slate-500">
      <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
      <span>Đang chuyển hướng sang trang Quản lý Người dùng & Phân quyền...</span>
    </div>
  );
}

export default function AdminStudentsRedirectPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[60vh] items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
        </div>
      }
    >
      <RedirectToAdminUsers />
    </Suspense>
  );
}
