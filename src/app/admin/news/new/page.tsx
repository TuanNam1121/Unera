import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import { AdminNewsForm } from "@/components/admin/news/AdminNewsForm";

export default function AdminNewNewsPage() {
  return (
    <div className="w-full px-6 sm:px-8 py-6">
      <Suspense
        fallback={
          <div className="flex h-96 items-center justify-center">
            <Loader2 className="h-7 w-7 animate-spin text-blue-600" />
          </div>
        }
      >
        <AdminNewsForm mode="create" />
      </Suspense>
    </div>
  );
}

