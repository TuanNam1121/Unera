"use client";

import { mergeAttributes, Node } from "@tiptap/core";
import {
  NodeViewWrapper,
  ReactNodeViewRenderer,
  type NodeViewProps,
} from "@tiptap/react";
import { PlaySquare, Trash2 } from "lucide-react";
import {
  NodeAttrInput,
  shouldStopNodeViewEvent,
} from "@/components/content/extensions/NodeAttrInput";

function YouTubeEmbedNodeView({
  node,
  updateAttributes,
  deleteNode,
  selected,
}: NodeViewProps) {
  const videoId = String(node.attrs.videoId || "");
  const title = typeof node.attrs.title === "string" ? node.attrs.title : "";

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
        className="mb-2.5 flex items-center justify-between gap-2 text-xs text-slate-600 cursor-grab active:cursor-grabbing"
      >
        <span className="inline-flex items-center gap-1.5 font-semibold text-rose-600">
          <PlaySquare className="h-4 w-4" />
          YouTube Embed ({videoId})
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

      {videoId && (
        <div className="aspect-video w-full overflow-hidden rounded-xl border border-slate-200 bg-black">
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${encodeURIComponent(videoId)}?rel=0`}
            title={title || `YouTube video ${videoId}`}
            className="h-full w-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      )}

      <NodeAttrInput
        value={title}
        onCommit={(nextTitle) => updateAttributes({ title: nextTitle })}
        placeholder="Tiêu đề / ghi chú cho video (tùy chọn)..."
        maxLength={200}
        ariaLabel="Tiêu đề video YouTube"
        className="mt-2.5 w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-700 focus:border-blue-500 focus:outline-none"
      />
    </NodeViewWrapper>
  );
}

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    youtubeEmbed: {
      setYouTubeEmbed: (options: {
        videoId: string;
        url?: string;
        title?: string;
      }) => ReturnType;
    };
  }
}

export const YouTubeEmbedExtension = Node.create({
  name: "youtubeEmbed",
  group: "block",
  atom: true,
  draggable: true,

  addAttributes() {
    return {
      videoId: { default: "" },
      url: { default: "" },
      title: { default: "" },
      aspectRatio: { default: "16:9" },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-type="youtube-embed"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(HTMLAttributes, { "data-type": "youtube-embed" }),
    ];
  },

  addCommands() {
    return {
      setYouTubeEmbed:
        (options) =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs: {
              videoId: options.videoId,
              url:
                options.url ||
                `https://www.youtube.com/watch?v=${options.videoId}`,
              title: options.title || "",
              aspectRatio: "16:9",
            },
          });
        },
    };
  },

  addNodeView() {
    return ReactNodeViewRenderer(YouTubeEmbedNodeView, {
      stopEvent: shouldStopNodeViewEvent,
      ignoreMutation: () => true,
    });
  },
});

