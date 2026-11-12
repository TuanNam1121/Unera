"use client";

import { mergeAttributes, Node } from "@tiptap/core";
import {
  NodeViewWrapper,
  ReactNodeViewRenderer,
  type NodeViewProps,
} from "@tiptap/react";
import { Headphones, Trash2 } from "lucide-react";
import {
  NodeAttrInput,
  shouldStopNodeViewEvent,
} from "@/components/content/extensions/NodeAttrInput";

function AudioBlockNodeView({
  node,
  updateAttributes,
  deleteNode,
  selected,
}: NodeViewProps) {
  const src = String(node.attrs.src || "");
  const title = typeof node.attrs.title === "string" ? node.attrs.title : "";
  const sourceType = String(node.attrs.sourceType || "CLOUDINARY");

  return (
    <NodeViewWrapper
      contentEditable={false}
      className={`my-4 rounded-2xl border bg-gradient-to-br from-slate-50 to-blue-50/40 p-4 transition-all ${
        selected
          ? "border-blue-500 ring-2 ring-blue-100"
          : "border-slate-200 hover:border-slate-300"
      }`}
    >
      <div
        data-drag-handle
        className="mb-3 flex flex-wrap items-center justify-between gap-2 cursor-grab active:cursor-grabbing"
      >
        <div className="flex items-center gap-2 text-xs font-semibold text-blue-700">
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-blue-100 text-blue-700">
            <Headphones className="h-4 w-4" />
          </span>
          <span>Audio Block</span>
          <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-medium text-slate-600 border border-slate-200">
            {sourceType === "CLOUDINARY" ? "Cloudinary Media" : "External URL"}
          </span>
        </div>

        <button
          type="button"
          onClick={deleteNode}
          className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
        >
          <Trash2 className="h-3.5 w-3.5" />
          Xóa
        </button>
      </div>

      <NodeAttrInput
        value={title}
        onCommit={(nextTitle) => updateAttributes({ title: nextTitle })}
        placeholder="Nhập tiêu đề đoạn âm thanh / podcast..."
        maxLength={160}
        ariaLabel="Tiêu đề Audio Block"
        className="mb-3 w-full rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-800 focus:border-blue-500 focus:outline-none"
      />

      {src && (
        <audio
          controls
          preload="metadata"
          src={src}
          className="w-full h-10"
        />
      )}
    </NodeViewWrapper>
  );
}

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    audioBlock: {
      setAudioBlock: (options: {
        src: string;
        title?: string;
        publicId?: string;
        mimeType?: string;
        durationSeconds?: number;
        sourceType?: "CLOUDINARY" | "EXTERNAL_ALLOWLIST";
      }) => ReturnType;
    };
  }
}

export const AudioBlockExtension = Node.create({
  name: "audioBlock",
  group: "block",
  atom: true,
  draggable: true,

  addAttributes() {
    return {
      src: { default: "" },
      publicId: { default: null },
      title: { default: "" },
      mimeType: { default: "" },
      durationSeconds: { default: null },
      sourceType: { default: "CLOUDINARY" },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-type="audio-block"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(HTMLAttributes, { "data-type": "audio-block" }),
    ];
  },

  addCommands() {
    return {
      setAudioBlock:
        (options) =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs: {
              src: options.src,
              title: typeof options.title === "string" ? options.title : "",
              publicId: options.publicId || null,
              mimeType: options.mimeType || "",
              durationSeconds: options.durationSeconds ?? null,
              sourceType:
                options.sourceType ||
                (options.publicId ? "CLOUDINARY" : "EXTERNAL_ALLOWLIST"),
            },
          });
        },
    };
  },

  addNodeView() {
    return ReactNodeViewRenderer(AudioBlockNodeView, {
      stopEvent: shouldStopNodeViewEvent,
      ignoreMutation: () => true,
    });
  },
});

