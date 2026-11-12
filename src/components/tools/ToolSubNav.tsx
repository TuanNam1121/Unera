"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BrainCircuit,
  Calculator,
  Compass,
  ReceiptText,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

const TOOL_LINKS = [
  { href: "/tools", label: "Tổng quan Công cụ", icon: Compass, exact: true },
  { href: "/tools/mbti", label: "Trắc nghiệm MBTI", icon: BrainCircuit },
  { href: "/tools/mi", label: "Đa trí thông minh MI", icon: Sparkles },
  { href: "/tools/gross-net", label: "Lương Gross ↔ Net", icon: Calculator },
  { href: "/tools/tax", label: "Thuế TNCN 7 bậc", icon: ReceiptText },
];

export function ToolSubNav() {
  const pathname = usePathname();

  return (
    <div className="flex flex-wrap items-center gap-2">
      {TOOL_LINKS.map((item) => {
        const Icon = item.icon;
        const active = item.exact
          ? pathname === item.href
          : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-medium transition-all",
              active
                ? "bg-blue-600 text-white shadow-sm shadow-blue-500/20"
                : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900"
            )}
          >
            <Icon className="h-3.5 w-3.5" />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </div>
  );
}

