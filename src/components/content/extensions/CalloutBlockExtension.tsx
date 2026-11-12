"use client";

import { mergeAttributes, Node } from "@tiptap/core";
import {
  NodeViewContent,
  NodeViewWrapper,
  ReactNodeViewRenderer,
  type NodeViewProps,
} from "@tiptap/react";
import { AlertTriangle, Info, Lightbulb, Trash2 } from "lucide-react";
import {
  NodeAttrInput,
  shouldStopNodeViewEvent,
} from "@/components/content/extensions/NodeAttrInput";

const VARIANT_STYLES = {
  info: {
    container: "border-blue-200 bg-blue-50/70",
    badge: "text-blue-700",
    label: "Thông tin",
    Icon: Info,
  },
  tip: {
    container: "border-emerald-200 bg-emerald-50/70",
    badge: "text-emerald-700",
    label: "Mẹo / Lời khuyên",
    Icon: Lightbulb,
  },
  warning: {
    container: "border-amber-200 bg-amber-50/80",
    badge: "text-amber-700",
    label: "Lưu ý quan trọng",
    Icon: AlertTriangle,
  },
} as const;

function CalloutBlockNodeView({
  node,
  updateAttributes,
  deleteNode,
  selected,
}: NodeViewProps) {
  const variant = (
    node.attrs.variant === "tip" || node.attrs.variant === "warning"
      ? node.attrs.variant
      : "info"
  ) as "info" | "tip" | "warning";
  const title = String(node.attrs.title || "");
  const theme = VARIANT_STYLES[variant];
  const VariantIcon = theme.Icon;

  return (
    <NodeViewWrapper
      className={`my-4 rounded-2xl border p-4 transition-all ${theme.container} ${
        selected ? "ring-2 ring-blue-300" : ""
      }`}
    >
      <div
        className="mb-2.5 flex flex-wrap items-center justify-between gap-2"
        contentEditable={false}
      >
        <div className="flex items-center gap-2">
          <span
            className={`inline-flex items-center gap-1.5 text-xs font-bold ${theme.badge}`}
          >
            <VariantIcon className="h-4 w-4" />
            Callout: {theme.label}
          </span>
          <div className="inline-flex rounded-lg border border-white/80 bg-white/80 p-0.5 text-[11px]">
            {(["info", "tip", "warning"] as const).map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => updateAttributes({ variant: v })}
                className={`rounded-md px-2 py-0.5 font-medium cursor-pointer ${
                  variant === v
                    ? "bg-slate-900 text-white"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {v === "info" ? "Info" : v === "tip" ? "Tip" : "Warning"}
              </button>
            ))}
          </div>
        </div>

        <button
          type="button"
          onClick={deleteNode}
          className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-rose-600 hover:bg-white/70 transition-colors cursor-pointer"
        >
          <Trash2 className="h-3.5 w-3.5" />
          Xóa
        </button>
      </div>

      <NodeAttrInput
        value={title}
        onCommit={(nextTitle) => updateAttributes({ title: nextTitle })}
        placeholder="Tiêu đề hộp ghi chú (tùy chọn)..."
        maxLength={150}
        ariaLabel="Tiêu đề Callout Block"
        className="mb-2 w-full rounded-lg border border-white bg-white/90 px-2.5 py-1.5 text-sm font-semibold text-slate-900 focus:border-blue-500 focus:outline-none"
      />

      <NodeViewContent className="space-y-1.5 text-sm text-slate-700 [&>p]:my-1" />
    </NodeViewWrapper>
  );
}

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    calloutBlock: {
      setCalloutBlock: (options?: {
        variant?: "info" | "tip" | "warning";
        title?: string;
      }) => ReturnType;
    };
  }
}

export const CalloutBlockExtension = Node.create({
  name: "calloutBlock",
  group: "block",
  content: "block+",
  defining: true,

  addAttributes() {
    return {
      variant: { default: "info" },
      title: { default: "" },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-type="callout-block"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(HTMLAttributes, { "data-type": "callout-block" }),
      0,
    ];
  },

  addCommands() {
    return {
      setCalloutBlock:
        (options) =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs: {
              variant: options?.variant || "info",
              title: options?.title || "",
            },
            content: [{ type: "paragraph" }],
          });
        },
    };
  },

  addNodeView() {
    return ReactNodeViewRenderer(CalloutBlockNodeView, {
      stopEvent: shouldStopNodeViewEvent,
    });
  },
});

