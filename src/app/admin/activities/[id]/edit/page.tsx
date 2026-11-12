"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Loader2 } from "lucide-react";
import { AdminActivityForm } from "@/components/admin/activities/AdminActivityForm";
import { fetchWithAuth } from "@/components/providers/AuthProvider";
import { buttonVariants } from "@/components/ui/button";
import type { IStudentActivityDetail } from "@/types";

function AdminEditActivityContent() {
  const params = useParams<{ id: string }>();
  const id = params?.id || "";

  const [activity, setActivity] = useState<IStudentActivityDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [reloadNonce, setReloadNonce] = useState(0);

  const triggerReload = useCallback(() => {
    setReloadNonce((n) => n + 1);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadActivity() {
      if (!id) return;
      setLoading(true);
      setErrorMsg("");
      try {
        const res = await fetchWithAuth(`/api/admin/activities/${id}`, {
          cache: "no-store",
        });
        const data = await res.json();
        if (!cancelled && res.ok && data.activity) {
          setActivity(data.activity);
        } else if (!cancelled) {
          setErrorMsg(data.error || "Không tìm thấy hoạt động cần chỉnh sửa.");
        }
      } catch {
        if (!cancelled) {
          setErrorMsg("Lỗi khi tải thông tin hoạt động.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadActivity();
    return () => {
      cancelled = true;
    };
  }, [id, reloadNonce]);

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (errorMsg || !activity) {
    return (
      <div className="mx-auto max-w-xl py-16 text-center space-y-4">
        <h2 className="text-lg font-bold text-slate-900">
          {errorMsg || "Không thể tải hoạt động"}
        </h2>
        <Link
          href="/admin/activities"
          className={buttonVariants({
            variant: "outline",
            className: "rounded-xl",
          })}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Quay lại danh sách hoạt động
        </Link>
      </div>
    );
  }

  return (
    <AdminActivityForm
      key={`${activity._id}-v${activity.version}-${reloadNonce}`}
      mode="edit"
      activityId={id}
      initialActivity={activity}
      onReloadRequested={triggerReload}
    />
  );
}

export default function AdminEditActivityPage() {
  return (
    <div className="mx-auto w-full max-w-7xl px-6 sm:px-8 py-6">
      <Suspense
        fallback={
          <div className="flex h-96 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          </div>
        }
      >
        <AdminEditActivityContent />
      </Suspense>
    </div>
  );
}

