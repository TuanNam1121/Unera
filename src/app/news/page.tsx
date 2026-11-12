import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import { NewsPortalClient } from "@/components/news/NewsPortalClient";

export default function NewsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-96 items-center justify-center">
          <Loader2 className="h-7 w-7 animate-spin text-blue-600" />
        </div>
      }
    >
      <NewsPortalClient initialTab="all" />
    </Suspense>
  );
}

