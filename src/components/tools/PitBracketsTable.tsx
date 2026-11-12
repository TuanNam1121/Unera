"use client";

import { formatVnd, type PitBracketBreakdown } from "@/lib/calculators/salaryTax";

interface PitBracketsTableProps {
  brackets: PitBracketBreakdown[];
  totalTax: number;
  multiplier?: number;
  periodLabel?: string;
}

export function PitBracketsTable({
  brackets,
  totalTax,
  multiplier = 1,
  periodLabel = "tháng",
}: PitBracketsTableProps) {
  const scaledTotal = Math.round(totalTax * multiplier);

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white shadow-[0_2px_8px_rgba(0,0,0,0.02)] overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-5 py-4">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">
            Chi tiết Thuế TNCN theo Biểu Lũy Tiến Từng Phần 7 Bậc
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Chỉ phần thu nhập vượt ngưỡng mới chịu thuế suất của bậc tương ứng ({periodLabel}).
          </p>
        </div>
        <span className="rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
          Tổng thuế: {formatVnd(scaledTotal)}
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs sm:text-sm">
          <thead>
            <tr className="bg-slate-50/90 text-slate-600 border-b border-slate-100">
              <th className="px-4 py-2.5 font-semibold">Bậc</th>
              <th className="px-4 py-2.5 font-semibold">Phần thu nhập tính thuế / tháng</th>
              <th className="px-4 py-2.5 font-semibold text-center">Thuế suất</th>
              <th className="px-4 py-2.5 font-semibold text-right">
                Phần TN chịu thuế ({periodLabel})
              </th>
              <th className="px-4 py-2.5 font-semibold text-right">
                Tiền thuế ({periodLabel})
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {brackets.map((b) => {
              const portion = Math.round(b.taxablePortion * multiplier);
              const tax = Math.round(b.taxAmount * multiplier);
              return (
                <tr
                  key={b.level}
                  className={
                    b.isActive
                      ? "bg-blue-50/40 text-slate-900"
                      : "text-slate-400 hover:bg-slate-50/50"
                  }
                >
                  <td className="px-4 py-2.5 font-medium whitespace-nowrap">
                    <span
                      className={`inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-semibold ${
                        b.isActive
                          ? "bg-blue-600 text-white"
                          : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      Bậc {b.level}
                    </span>
                  </td>
                  <td className="px-4 py-2.5">{b.label}</td>
                  <td className="px-4 py-2.5 text-center font-semibold">
                    {Math.round(b.rate * 100)}%
                  </td>
                  <td className="px-4 py-2.5 text-right tabular-nums">
                    {formatVnd(portion)}
                  </td>
                  <td
                    className={`px-4 py-2.5 text-right tabular-nums font-semibold ${
                      b.isActive ? "text-blue-700" : "text-slate-400"
                    }`}
                  >
                    {formatVnd(tax)}
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="border-t border-slate-200 bg-slate-50 font-semibold text-slate-900">
              <td colSpan={4} className="px-4 py-3 text-right">
                Tổng Thuế TNCN phải nộp ({periodLabel})
              </td>
              <td className="px-4 py-3 text-right tabular-nums text-blue-700">
                {formatVnd(scaledTotal)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}

