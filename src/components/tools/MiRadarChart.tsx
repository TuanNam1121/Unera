"use client";

import type { MiCategoryScoreItem } from "@/lib/tools/mi";

interface MiRadarChartProps {
  items: MiCategoryScoreItem[];
}

export function MiRadarChart({ items }: MiRadarChartProps) {
  // Giữ thứ tự trục cố định quanh vòng tròn (8 đỉnh) để dễ đối chiếu
  const size = 340;
  const center = size / 2;
  const radius = 104;
  const levels = [20, 40, 60, 80, 100];
  const count = items.length || 8;

  const pointAt = (index: number, pct: number, extraRadius = 0) => {
    const angle = (Math.PI * 2 * index) / count - Math.PI / 2;
    const r = (radius * pct) / 100 + extraRadius;
    return {
      x: center + r * Math.cos(angle),
      y: center + r * Math.sin(angle),
      angle,
    };
  };

  const dataPoints = items.map((item, idx) =>
    pointAt(idx, Math.max(4, item.percentage))
  );
  const polygonPoints = dataPoints
    .map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`)
    .join(" ");

  return (
    <div className="flex flex-col items-center justify-center w-full">
      <svg
        viewBox={`0 0 ${size} ${size}`}
        className="w-full max-w-[360px] h-auto overflow-visible"
        role="img"
        aria-label="Biểu đồ Radar 8 loại trí thông minh"
      >
        {/* Vòng lưới đồng tâm */}
        {levels.map((lvl) => {
          const ringPoints = items
            .map((_, idx) => {
              const pt = pointAt(idx, lvl);
              return `${pt.x.toFixed(1)},${pt.y.toFixed(1)}`;
            })
            .join(" ");
          return (
            <polygon
              key={lvl}
              points={ringPoints}
              fill={lvl === 100 ? "#F8FAFC" : "none"}
              fillOpacity={lvl === 100 ? 0.65 : 0}
              stroke="#E2E8F0"
              strokeWidth={lvl === 100 ? 1.4 : 1}
              strokeDasharray={lvl < 100 ? "3 3" : undefined}
            />
          );
        })}

        {/* Đường trục từ tâm tới 8 đỉnh */}
        {items.map((item, idx) => {
          const outer = pointAt(idx, 100);
          return (
            <line
              key={item.category}
              x1={center}
              y1={center}
              x2={outer.x}
              y2={outer.y}
              stroke="#CBD5E1"
              strokeWidth={1}
            />
          );
        })}

        {/* Nhãn thang % trên trục dọc trên */}
        {[40, 80, 100].map((lvl) => {
          const pt = pointAt(0, lvl);
          return (
            <text
              key={lvl}
              x={pt.x + 4}
              y={pt.y + 3}
              fontSize="9"
              fill="#94A3B8"
              fontWeight="600"
            >
              {lvl}%
            </text>
          );
        })}

        {/* Vùng dữ liệu sinh viên */}
        <polygon
          points={polygonPoints}
          fill="#2563EB"
          fillOpacity={0.18}
          stroke="#2563EB"
          strokeWidth={2.5}
          strokeLinejoin="round"
        />

        {/* Chấm đỉnh + nhãn tên trục */}
        {items.map((item, idx) => {
          const dot = dataPoints[idx];
          const labelPt = pointAt(idx, 100, 26);
          const cos = Math.cos(labelPt.angle);
          const textAnchor =
            Math.abs(cos) < 0.25 ? "middle" : cos > 0 ? "start" : "end";

          return (
            <g key={item.category}>
              <circle
                cx={dot.x}
                cy={dot.y}
                r={4.2}
                fill={item.rank <= 3 ? item.colorHex : "#2563EB"}
                stroke="#FFFFFF"
                strokeWidth={1.6}
              >
                <title>{`${item.nameVi}: ${item.percentage}%`}</title>
              </circle>
              <text
                x={labelPt.x}
                y={labelPt.y - 3}
                textAnchor={textAnchor}
                fontSize="11"
                fontWeight={item.rank <= 3 ? "700" : "600"}
                fill={item.rank <= 3 ? "#0F172A" : "#475569"}
              >
                {item.shortLabel}
              </text>
              <text
                x={labelPt.x}
                y={labelPt.y + 10}
                textAnchor={textAnchor}
                fontSize="10"
                fontWeight="700"
                fill={item.rank <= 3 ? item.colorHex : "#64748B"}
              >
                {item.percentage}%
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

