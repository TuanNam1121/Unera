import React from "react";
import Image from "next/image";
import Link from "next/link";
import { AlertTriangle, Headphones, Info, Lightbulb } from "lucide-react";
import {
  extractYouTubeVideoId,
  isAllowedAudioUrl,
  isSafeWebUrl,
} from "@/lib/content/media-validation";
import type { TiptapJSONDoc, TiptapJSONMark, TiptapJSONNode } from "@/types";

interface TiptapContentRendererProps {
  contentJson?: TiptapJSONDoc | null;
  className?: string;
}

function getAlignClass(align: unknown): string {
  if (align === "center") return "text-center";
  if (align === "right") return "text-right";
  return "";
}

function applyMarks(
  element: React.ReactNode,
  marks: TiptapJSONMark[] | undefined,
  keyPrefix: string
): React.ReactNode {
  if (!Array.isArray(marks) || marks.length === 0) return element;

  let current = element;
  marks.forEach((mark, idx) => {
    const key = `${keyPrefix}-m-${idx}`;
    switch (mark.type) {
      case "bold":
        current = (
          <strong key={key} className="font-semibold text-slate-900">
            {current}
          </strong>
        );
        break;
      case "italic":
        current = (
          <em key={key} className="italic">
            {current}
          </em>
        );
        break;
      case "underline":
        current = (
          <u key={key} className="underline underline-offset-2">
            {current}
          </u>
        );
        break;
      case "strike":
        current = (
          <s key={key} className="line-through text-slate-400">
            {current}
          </s>
        );
        break;
      case "code":
        current = (
          <code
            key={key}
            className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[0.9em] font-mono text-blue-700"
          >
            {current}
          </code>
        );
        break;
      case "highlight":
        current = (
          <mark
            key={key}
            className="rounded bg-amber-100/90 px-1 text-slate-900"
          >
            {current}
          </mark>
        );
        break;
      case "link": {
        const href =
          typeof mark.attrs?.href === "string" ? mark.attrs.href.trim() : "";
        if (!isSafeWebUrl(href, { allowRelative: true })) {
          break;
        }
        const isInternal = href.startsWith("/");
        current = isInternal ? (
          <Link
            key={key}
            href={href}
            className="font-medium text-blue-600 underline decoration-blue-300 underline-offset-2 hover:text-blue-800"
          >
            {current}
          </Link>
        ) : (
          <a
            key={key}
            href={href}
            target="_blank"
            rel="noopener noreferrer nofollow"
            className="font-medium text-blue-600 underline decoration-blue-300 underline-offset-2 hover:text-blue-800"
          >
            {current}
          </a>
        );
        break;
      }
      default:
        break;
    }
  });

  return current;
}

function renderInlineChildren(
  children: TiptapJSONNode[] | undefined,
  keyPrefix: string
): React.ReactNode {
  if (!Array.isArray(children) || children.length === 0) return null;

  return children.map((child, idx) => {
    const key = `${keyPrefix}-${idx}`;
    if (child.type === "text") {
      return (
        <React.Fragment key={key}>
          {applyMarks(child.text || "", child.marks, key)}
        </React.Fragment>
      );
    }
    if (child.type === "hardBreak") {
      return <br key={key} />;
    }
    return renderBlockNode(child, key);
  });
}

function renderBlockNode(
  node: TiptapJSONNode,
  key: string
): React.ReactNode {
  switch (node.type) {
    case "paragraph": {
      const align = getAlignClass(node.attrs?.textAlign);
      const isEmpty = !Array.isArray(node.content) || node.content.length === 0;
      return (
        <p
          key={key}
          className={`text-sm sm:text-base leading-7 text-slate-700 ${align}`}
        >
          {isEmpty ? <>&nbsp;</> : renderInlineChildren(node.content, key)}
        </p>
      );
    }

    case "heading": {
      const level = Number(node.attrs?.level) || 2;
      const align = getAlignClass(node.attrs?.textAlign);
      const content = renderInlineChildren(node.content, key);
      if (level <= 2) {
        return (
          <h2
            key={key}
            className={`mt-7 mb-3 text-xl sm:text-2xl font-bold tracking-tight text-slate-900 border-b border-slate-100 pb-2 ${align}`}
          >
            {content}
          </h2>
        );
      }
      if (level === 3) {
        return (
          <h3
            key={key}
            className={`mt-5 mb-2 text-lg sm:text-xl font-bold text-slate-900 ${align}`}
          >
            {content}
          </h3>
        );
      }
      return (
        <h4
          key={key}
          className={`mt-4 mb-1.5 text-base sm:text-lg font-semibold text-slate-800 ${align}`}
        >
          {content}
        </h4>
      );
    }

    case "bulletList":
      return (
        <ul
          key={key}
          className="my-3 list-disc pl-6 space-y-1.5 text-sm sm:text-base text-slate-700"
        >
          {Array.isArray(node.content)
            ? node.content.map((item, idx) =>
                renderBlockNode(item, `${key}-li-${idx}`)
              )
            : null}
        </ul>
      );

    case "orderedList":
      return (
        <ol
          key={key}
          className="my-3 list-decimal pl-6 space-y-1.5 text-sm sm:text-base text-slate-700"
        >
          {Array.isArray(node.content)
            ? node.content.map((item, idx) =>
                renderBlockNode(item, `${key}-ol-${idx}`)
              )
            : null}
        </ol>
      );

    case "listItem":
      return (
        <li key={key} className="leading-7 [&>p]:my-0">
          {Array.isArray(node.content)
            ? node.content.map((child, idx) =>
                renderBlockNode(child, `${key}-c-${idx}`)
              )
            : null}
        </li>
      );

    case "blockquote":
      return (
        <blockquote
          key={key}
          className="my-4 rounded-r-xl border-l-4 border-blue-500 bg-blue-50/50 px-4 py-3 text-slate-700 italic [&>p]:my-1"
        >
          {Array.isArray(node.content)
            ? node.content.map((child, idx) =>
                renderBlockNode(child, `${key}-bq-${idx}`)
              )
            : null}
        </blockquote>
      );

    case "codeBlock": {
      const codeText = Array.isArray(node.content)
        ? node.content.map((c) => c.text || "").join("")
        : "";
      return (
        <pre
          key={key}
          className="my-4 overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900 p-4 text-xs sm:text-sm font-mono text-slate-100 leading-relaxed"
        >
          <code>{codeText}</code>
        </pre>
      );
    }

    case "horizontalRule":
      return <hr key={key} className="my-6 border-slate-200" />;

    case "table":
      return (
        <div
          key={key}
          className="my-5 overflow-x-auto rounded-xl border border-slate-200 bg-white"
        >
          <table className="min-w-full border-collapse text-left text-sm">
            <tbody>
              {Array.isArray(node.content)
                ? node.content.map((row, idx) =>
                    renderBlockNode(row, `${key}-tr-${idx}`)
                  )
                : null}
            </tbody>
          </table>
        </div>
      );

    case "tableRow":
      return (
        <tr key={key} className="border-b border-slate-200 last:border-b-0">
          {Array.isArray(node.content)
            ? node.content.map((cell, idx) =>
                renderBlockNode(cell, `${key}-td-${idx}`)
              )
            : null}
        </tr>
      );

    case "tableHeader":
      return (
        <th
          key={key}
          colSpan={typeof node.attrs?.colspan === "number" ? node.attrs.colspan : undefined}
          rowSpan={typeof node.attrs?.rowspan === "number" ? node.attrs.rowspan : undefined}
          className="border-r border-slate-200 last:border-r-0 bg-slate-50 px-3.5 py-2.5 text-xs font-bold uppercase tracking-wider text-slate-700 [&>p]:my-0"
        >
          {Array.isArray(node.content)
            ? node.content.map((c, idx) =>
                renderBlockNode(c, `${key}-thc-${idx}`)
              )
            : null}
        </th>
      );

    case "tableCell":
      return (
        <td
          key={key}
          colSpan={typeof node.attrs?.colspan === "number" ? node.attrs.colspan : undefined}
          rowSpan={typeof node.attrs?.rowspan === "number" ? node.attrs.rowspan : undefined}
          className="border-r border-slate-200 last:border-r-0 px-3.5 py-2.5 align-top text-slate-700 [&>p]:my-0"
        >
          {Array.isArray(node.content)
            ? node.content.map((c, idx) =>
                renderBlockNode(c, `${key}-tdc-${idx}`)
              )
            : null}
        </td>
      );

    case "image": {
      const src = typeof node.attrs?.src === "string" ? node.attrs.src : "";
      if (!isSafeWebUrl(src)) return null;
      const alt =
        typeof node.attrs?.alt === "string" ? node.attrs.alt : "";
      const caption =
        typeof node.attrs?.caption === "string" ? node.attrs.caption : "";
      const width =
        typeof node.attrs?.width === "number" && node.attrs.width > 0
          ? node.attrs.width
          : 1200;
      const height =
        typeof node.attrs?.height === "number" && node.attrs.height > 0
          ? node.attrs.height
          : 675;

      return (
        <figure
          key={key}
          className="my-6 overflow-hidden rounded-2xl border border-slate-200 bg-slate-50/50 p-2"
        >
          <div className="overflow-hidden rounded-xl bg-white">
            <Image
              src={src}
              alt={alt || caption || "Hình ảnh bài viết"}
              width={width}
              height={height}
              unoptimized
              className="mx-auto max-h-[540px] w-full object-contain"
            />
          </div>
          {caption && (
            <figcaption className="mt-2 px-2 pb-1 text-center text-xs text-slate-500 italic">
              {caption}
            </figcaption>
          )}
        </figure>
      );
    }

    case "audioBlock": {
      const src = typeof node.attrs?.src === "string" ? node.attrs.src : "";
      if (!isAllowedAudioUrl(src)) return null;
      const title =
        typeof node.attrs?.title === "string" && node.attrs.title.trim()
          ? node.attrs.title.trim()
          : "Tệp âm thanh đính kèm";

      return (
        <div
          key={key}
          className="my-6 rounded-2xl border border-blue-200 bg-gradient-to-br from-blue-50/70 to-indigo-50/40 p-4"
        >
          <div className="mb-3 flex items-center gap-2.5">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-blue-600 text-white shadow-xs">
              <Headphones className="h-4 w-4" />
            </span>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-blue-700">
                Audio đính kèm
              </p>
              <p className="text-sm font-bold text-slate-900">{title}</p>
            </div>
          </div>
          <audio controls preload="metadata" src={src} className="w-full h-10" />
        </div>
      );
    }

    case "youtubeEmbed": {
      const raw =
        (typeof node.attrs?.videoId === "string" && node.attrs.videoId) ||
        (typeof node.attrs?.url === "string" && node.attrs.url) ||
        "";
      const videoId = extractYouTubeVideoId(raw);
      if (!videoId) return null;
      const title =
        typeof node.attrs?.title === "string" ? node.attrs.title.trim() : "";

      return (
        <figure
          key={key}
          className="my-6 overflow-hidden rounded-2xl border border-slate-200 bg-slate-950 shadow-sm"
        >
          <div className="aspect-video w-full">
            <iframe
              src={`https://www.youtube-nocookie.com/embed/${encodeURIComponent(videoId)}?rel=0`}
              title={title || `YouTube video ${videoId}`}
              loading="lazy"
              className="h-full w-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
          {title && (
            <figcaption className="bg-white px-4 py-2 text-xs font-medium text-slate-600 border-t border-slate-100">
              {title}
            </figcaption>
          )}
        </figure>
      );
    }

    case "calloutBlock": {
      const variant =
        node.attrs?.variant === "tip" || node.attrs?.variant === "warning"
          ? node.attrs.variant
          : "info";
      const title =
        typeof node.attrs?.title === "string" ? node.attrs.title.trim() : "";

      const styles =
        variant === "warning"
          ? {
              box: "border-amber-200 bg-amber-50/70 text-amber-950",
              badge: "text-amber-700",
              Icon: AlertTriangle,
              fallbackTitle: "Lưu ý quan trọng",
            }
          : variant === "tip"
          ? {
              box: "border-emerald-200 bg-emerald-50/70 text-emerald-950",
              badge: "text-emerald-700",
              Icon: Lightbulb,
              fallbackTitle: "Mẹo & Gợi ý",
            }
          : {
              box: "border-blue-200 bg-blue-50/70 text-blue-950",
              badge: "text-blue-700",
              Icon: Info,
              fallbackTitle: "Thông tin định hướng",
            };

      const CalloutIcon = styles.Icon;

      return (
        <div
          key={key}
          className={`my-5 rounded-2xl border p-4 sm:p-5 ${styles.box}`}
        >
          <div className={`mb-2 flex items-center gap-2 text-sm font-bold ${styles.badge}`}>
            <CalloutIcon className="h-4 w-4 shrink-0" />
            <span>{title || styles.fallbackTitle}</span>
          </div>
          <div className="space-y-1.5 [&>p]:my-1 [&>p]:text-slate-800">
            {Array.isArray(node.content)
              ? node.content.map((child, idx) =>
                  renderBlockNode(child, `${key}-cb-${idx}`)
                )
              : null}
          </div>
        </div>
      );
    }

    default:
      return null;
  }
}

export function TiptapContentRenderer({
  contentJson,
  className = "",
}: TiptapContentRendererProps) {
  if (
    !contentJson ||
    contentJson.type !== "doc" ||
    !Array.isArray(contentJson.content)
  ) {
    return (
      <p className="text-sm text-slate-500 italic">
        Nội dung bài viết hiện chưa khả dụng.
      </p>
    );
  }

  return (
    <div className={`space-y-3 ${className}`}>
      {contentJson.content.map((node, index) =>
        renderBlockNode(node, `tiptap-node-${index}`)
      )}
    </div>
  );
}

