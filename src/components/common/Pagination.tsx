"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PaginationProps {
  page: number;
  totalPages: number;
  totalItems?: number;
  itemLabel?: string;
  onPageChange: (nextPage: number) => void;
  scrollToTop?: boolean;
  className?: string;
}

function buildPageTokens(current: number, total: number): (number | "ellipsis")[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, idx) => idx + 1);
  }

  const tokens: (number | "ellipsis")[] = [1];
  const left = Math.max(2, current - 1);
  const right = Math.min(total - 1, current + 1);

  if (left > 2) tokens.push("ellipsis");
  for (let p = left; p <= right; p += 1) {
    tokens.push(p);
  }
  if (right < total - 1) tokens.push("ellipsis");
  tokens.push(total);

  return tokens;
}

export function Pagination({
  page,
  totalPages,
  totalItems,
  itemLabel = "kết quả",
  onPageChange,
  scrollToTop = true,
  className = "",
}: PaginationProps) {
  if (totalPages <= 1) return null;

  const safePage = Math.min(Math.max(1, page), totalPages);
  const tokens = buildPageTokens(safePage, totalPages);

  const handleSelect = (targetPage: number) => {
    if (targetPage === safePage || targetPage < 1 || targetPage > totalPages) {
      return;
    }
    onPageChange(targetPage);
    if (scrollToTop && typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  return (
    <div
      className={`flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 ${className}`}
    >
      <p className="text-xs text-slate-500">
        Trang <strong className="text-slate-800">{safePage}</strong> / {totalPages}
        {typeof totalItems === "number" ? (
          <span>
            {" "}
            · <strong className="text-slate-800">{totalItems}</strong> {itemLabel}
          </span>
        ) : null}
      </p>

      <div className="flex flex-wrap items-center justify-center gap-1.5">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={safePage <= 1}
          onClick={() => handleSelect(safePage - 1)}
          className="h-8 rounded-lg px-2.5 text-xs"
        >
          <ChevronLeft className="h-3.5 w-3.5 mr-0.5" />
          Trang trước
        </Button>

        {tokens.map((token, idx) =>
          token === "ellipsis" ? (
            <span
              key={`ellipsis-${idx}`}
              className="px-1.5 text-xs text-slate-400 select-none"
            >
              …
            </span>
          ) : (
            <Button
              key={token}
              type="button"
              variant={token === safePage ? "default" : "outline"}
              size="sm"
              onClick={() => handleSelect(token)}
              aria-current={token === safePage ? "page" : undefined}
              className={`h-8 min-w-8 rounded-lg px-2.5 text-xs ${
                token === safePage
                  ? "bg-blue-600 text-white hover:bg-blue-700"
                  : ""
              }`}
            >
              {token}
            </Button>
          )
        )}

        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={safePage >= totalPages}
          onClick={() => handleSelect(safePage + 1)}
          className="h-8 rounded-lg px-2.5 text-xs"
        >
          Trang sau
          <ChevronRight className="h-3.5 w-3.5 ml-0.5" />
        </Button>
      </div>
    </div>
  );
}

