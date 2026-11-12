"use client";

import Image from "next/image";
import TiptapImage from "@tiptap/extension-image";
import {
  NodeViewWrapper,
  ReactNodeViewRenderer,
  type NodeViewProps,
} from "@tiptap/react";
import { Image as ImageIcon, Trash2 } from "lucide-react";
import {
  NodeAttrInput,
  shouldStopNodeViewEvent,
} from "@/components/content/extensions/NodeAttrInput";

function ImageBlockNodeView({
  node,
  updateAttributes,
  deleteNode,
  selected,
}: NodeViewProps) {
  const src = String(node.attrs.src || "");
  const alt = typeof node.attrs.alt === "string" ? node.attrs.alt : "";
  const caption =
    typeof node.attrs.caption === "string" ? node.attrs.caption : "";
  const width =
    typeof node.attrs.width === "number" && node.attrs.width > 0
      ? node.attrs.width
      : 1200;
  const height =
    typeof node.attrs.height === "number" && node.attrs.height > 0
      ? node.attrs.height
      : 675;

  return (
    <NodeViewWrapper
      contentEditable={false}
      className={`my-4 rounded-2xl border bg-slate-50/70 p-3 transition-all ${
        selected
          ? "border-blue-500 ring-2 ring-blue-100"
          : "border-slate-200 hover:border-slate-300"
      }`}
    >
      <div
        data-drag-handle
        className="mb-2 flex items-center justify-between gap-2 text-xs text-slate-500 cursor-grab active:cursor-grabbing"
      >
        <span className="inline-flex items-center gap-1.5 font-semibold text-slate-700">
          <ImageIcon className="h-3.5 w-3.5 text-blue-600" />
          Khối hình ảnh
        </span>
        <button
          type="button"
          onClick={deleteNode}
          className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
        >
          <Trash2 className="h-3.5 w-3.5" />
          Xóa
        </button>
      </div>

      {src && (
        <div className="relative overflow-hidden rounded-xl border border-slate-200 bg-white">
          <Image
            src={src}
            alt={alt || caption || "Ảnh minh họa bài viết"}
            width={width}
            height={height}
            unoptimized
            className="mx-auto max-h-[420px] w-full object-contain"
          />
        </div>
      )}

      <div className="mt-2.5 grid grid-cols-1 sm:grid-cols-2 gap-2">
        <NodeAttrInput
          value={caption}
          onCommit={(nextCaption) => updateAttributes({ caption: nextCaption })}
          placeholder="Chú thích ảnh (tùy chọn)..."
          maxLength={300}
          ariaLabel="Chú thích ảnh"
          className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-700 focus:border-blue-500 focus:outline-none"
        />
        <NodeAttrInput
          value={alt}
          onCommit={(nextAlt) => updateAttributes({ alt: nextAlt })}
          placeholder="Văn bản thay thế Alt text..."
          maxLength={300}
          ariaLabel="Alt text của ảnh"
          className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-700 focus:border-blue-500 focus:outline-none"
        />
      </div>
    </NodeViewWrapper>
  );
}

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    imageBlock: {
      setImageBlock: (options: {
        src: string;
        alt?: string;
        caption?: string;
        publicId?: string;
        width?: number;
        height?: number;
      }) => ReturnType;
    };
  }
}

export const ImageBlockExtension = TiptapImage.extend({
  addOptions() {
    const parentOpts = this.parent?.();
    return {
      inline: false,
      HTMLAttributes: {},
      resize: false,
      ...parentOpts,
      allowBase64: false,
    };
  },

  addAttributes() {
    return {
      ...this.parent?.(),
      publicId: {
        default: null,
        parseHTML: (el) => el.getAttribute("data-public-id"),
        renderHTML: (attrs) =>
          attrs.publicId ? { "data-public-id": attrs.publicId } : {},
      },
      caption: {
        default: "",
        parseHTML: (el) => el.getAttribute("data-caption") || "",
        renderHTML: (attrs) =>
          attrs.caption ? { "data-caption": attrs.caption } : {},
      },
      width: {
        default: null,
      },
      height: {
        default: null,
      },
    };
  },

  addCommands() {
    return {
      ...this.parent?.(),
      setImageBlock:
        (options) =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs: {
              src: options.src,
              alt: options.alt || "",
              caption: options.caption || "",
              publicId: options.publicId || null,
              width: options.width ?? null,
              height: options.height ?? null,
            },
          });
        },
    };
  },

  addNodeView() {
    return ReactNodeViewRenderer(ImageBlockNodeView, {
      stopEvent: shouldStopNodeViewEvent,
      ignoreMutation: () => true,
    });
  },
});
