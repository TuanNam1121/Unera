"use client";

import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import { AdminActivityForm } from "@/components/admin/activities/AdminActivityForm";

export default function AdminNewActivityPage() {
  return (
    <div className="mx-auto w-full max-w-7xl px-6 sm:px-8 py-6">
      <Suspense
        fallback={
          <div className="flex h-96 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          </div>
        }
      >
        <AdminActivityForm mode="create" />
      </Suspense>
    </div>
  );
}

