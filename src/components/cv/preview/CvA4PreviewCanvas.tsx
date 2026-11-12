"use client";

import { useEffect, useRef, useState } from "react";
import { CvA4Renderer, CvA4RendererProps } from "@/components/cv/preview/CvA4Renderer";

const A4_WIDTH_PX = 794;
const A4_HEIGHT_PX = 1123;

interface CvA4PreviewCanvasProps extends CvA4RendererProps {
  zoomLevel: number;
  fitMode: boolean;
  showPageBreaks?: boolean;
}

export function CvA4PreviewCanvas({
  zoomLevel,
  fitMode,
  showPageBreaks = true,
  ...rendererProps
}: CvA4PreviewCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const paperRef = useRef<HTMLDivElement>(null);
  const [fitScale, setFitScale] = useState(0.72);
  const [paperHeightPx, setPaperHeightPx] = useState(A4_HEIGHT_PX);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const updateWidth = () => {
      const availableWidth = Math.max(240, el.clientWidth - 32);
      setFitScale(Math.min(1, availableWidth / A4_WIDTH_PX));
    };
    updateWidth();
    const ro = new ResizeObserver(updateWidth);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const paper = paperRef.current;
    if (!paper) return;
    const updateHeight = () => {
      setPaperHeightPx(Math.max(A4_HEIGHT_PX, paper.scrollHeight));
    };
    updateHeight();
    const ro = new ResizeObserver(updateHeight);
    ro.observe(paper);
    return () => ro.disconnect();
  }, [rendererProps.cv, rendererProps.templateId, rendererProps.styleConfig, rendererProps.sectionOrder, rendererProps.hiddenSections]);

  const effectiveScale = fitMode ? fitScale : zoomLevel;
  const pageCount = Math.max(1, Math.ceil(paperHeightPx / A4_HEIGHT_PX));

  return (
    <div
      ref={containerRef}
      className="w-full flex flex-col items-center overflow-auto py-4 px-4"
    >
      <div
        className="relative transition-transform duration-150 ease-out"
        style={{
          width: `${A4_WIDTH_PX * effectiveScale}px`,
          height: `${paperHeightPx * effectiveScale}px`,
        }}
      >
        <div
          ref={paperRef}
          className="origin-top-left shadow-xl ring-1 ring-slate-900/10 rounded-xs overflow-hidden bg-white"
          style={{
            width: `${A4_WIDTH_PX}px`,
            transform: `scale(${effectiveScale})`,
          }}
        >
          <CvA4Renderer {...rendererProps} />

          {/* Simulated A4 page break markers */}
          {showPageBreaks &&
            pageCount > 1 &&
            Array.from({ length: pageCount - 1 }).map((_, idx) => (
              <div
                key={idx}
                className="pointer-events-none absolute left-0 right-0 flex items-center justify-center border-t-2 border-dashed border-amber-400/80"
                style={{ top: `${(idx + 1) * A4_HEIGHT_PX}px` }}
              >
                <span className="-mt-3 rounded-full bg-amber-100 border border-amber-300 px-2.5 py-0.5 text-[10px] font-semibold text-amber-800 shadow-2xs">
                  Hết trang {idx + 1} · Sang trang {idx + 2}
                </span>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}

