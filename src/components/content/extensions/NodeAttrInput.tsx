"use client";

import { useState } from "react";

/**
 * Ngăn ProseMirror/Tiptap chặn phím bấm, bôi đen chuột hoặc kéo-thả
 * khi người dùng tương tác với input/control bên trong React NodeView.
 */
export function shouldStopNodeViewEvent({ event }: { event: Event }): boolean {
  const target = event.target;
  if (!(target instanceof HTMLElement)) return false;
  return Boolean(
    target.closest("input, textarea, select, option, button, audio")
  );
}

interface NodeAttrInputProps {
  value: string;
  onCommit: (nextValue: string) => void;
  placeholder?: string;
  className?: string;
  maxLength?: number;
  ariaLabel?: string;
}

/**
 * Input dùng trong các Tiptap NodeView, hỗ trợ gõ tiếng Việt IME (Telex/VNI)
 * mượt mà và cho phép xóa trắng hoàn toàn mà không bị ghi đè con trỏ hay reset giá trị mặc định.
 */
export function NodeAttrInput({
  value,
  onCommit,
  placeholder,
  className,
  maxLength,
  ariaLabel,
}: NodeAttrInputProps) {
  const [composingValue, setComposingValue] = useState<string | null>(null);
  const displayedValue = composingValue ?? value;

  return (
    <input
      type="text"
      value={displayedValue}
      placeholder={placeholder}
      maxLength={maxLength}
      aria-label={ariaLabel}
      draggable={false}
      contentEditable={false}
      onCompositionStart={(e) => setComposingValue(e.currentTarget.value)}
      onChange={(e) => {
        const next = e.target.value;
        const native = e.nativeEvent as InputEvent | undefined;
        if (native?.isComposing) {
          setComposingValue(next);
          return;
        }
        setComposingValue(null);
        onCommit(next);
      }}
      onCompositionEnd={(e) => {
        const finalValue = e.currentTarget.value;
        setComposingValue(null);
        onCommit(finalValue);
      }}
      onBlur={(e) => {
        if (composingValue !== null) {
          const finalValue = e.currentTarget.value;
          setComposingValue(null);
          onCommit(finalValue);
        }
      }}
      onKeyDown={(e) => e.stopPropagation()}
      onKeyUp={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
      onDragStart={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
      className={className}
    />
  );
}

