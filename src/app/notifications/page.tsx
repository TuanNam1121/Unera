import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import { NotificationCenterClient } from "@/components/notifications/NotificationCenterClient";

export default function NotificationsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[360px] items-center justify-center gap-2 text-sm text-slate-500">
          <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
          <span>Đang tải Trung tâm thông báo...</span>
        </div>
      }
    >
      <NotificationCenterClient />
    </Suspense>
  );
}

