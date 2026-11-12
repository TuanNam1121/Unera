import {
  TIPTAP_ALLOWED_MARK_TYPES,
  TIPTAP_ALLOWED_NODE_TYPES,
  TIPTAP_MAX_TREE_DEPTH,
} from "@/constants";
import {
  extractYouTubeVideoId,
  isAllowedAudioUrl,
  isSafeWebUrl,
} from "@/lib/content/media-validation";
import {
  estimateReadTimeFromTiptap,
  extractPlainTextFromTiptap,
} from "@/lib/content/tiptap-utils";
import type { TiptapJSONDoc, TiptapJSONMark, TiptapJSONNode } from "@/types";

const ALLOWED_NODE_SET = new Set<string>(TIPTAP_ALLOWED_NODE_TYPES);
const ALLOWED_MARK_SET = new Set<string>(TIPTAP_ALLOWED_MARK_TYPES);
const ALLOWED_ALIGNMENTS = new Set(["left", "center", "right"]);
const ALLOWED_CALLOUT_VARIANTS = new Set(["info", "tip", "warning"]);

function sanitizeMarks(rawMarks: unknown): { ok: true; marks?: TiptapJSONMark[] } | { ok: false; error: string } {
  if (rawMarks === undefined) return { ok: true };
  if (!Array.isArray(rawMarks)) {
    return { ok: false, error: "Định dạng marks của nội dung không hợp lệ." };
  }

  const sanitized: TiptapJSONMark[] = [];
  for (const item of rawMarks) {
    if (!item || typeof item !== "object") continue;
    const markType = (item as { type?: unknown }).type;
    if (typeof markType !== "string" || !ALLOWED_MARK_SET.has(markType)) {
      return {
        ok: false,
        error: `Định dạng văn bản "${String(markType)}" không được hỗ trợ.`,
      };
    }

    const rawAttrs = (item as { attrs?: Record<string, unknown> }).attrs;
    if (markType === "link") {
      const href = typeof rawAttrs?.href === "string" ? rawAttrs.href.trim() : "";
      if (!isSafeWebUrl(href, { allowRelative: true })) {
        return {
          ok: false,
          error: "Liên kết trong bài viết chứa URL không an toàn.",
        };
      }
      sanitized.push({
        type: "link",
        attrs: {
          href,
          target: "_blank",
          rel: "noopener noreferrer nofollow",
        },
      });
    } else if (markType === "highlight") {
      const color =
        typeof rawAttrs?.color === "string" ? rawAttrs.color.slice(0, 32) : undefined;
      sanitized.push(color ? { type: "highlight", attrs: { color } } : { type: "highlight" });
    } else {
      sanitized.push({ type: markType });
    }
  }

  return { ok: true, marks: sanitized.length > 0 ? sanitized : undefined };
}

function sanitizeNode(
  rawNode: unknown,
  depth: number
): { ok: true; node: TiptapJSONNode } | { ok: false; error: string } {
  if (depth > TIPTAP_MAX_TREE_DEPTH) {
    return {
      ok: false,
      error: "Cấu trúc nội dung lồng nhau vượt quá giới hạn cho phép.",
    };
  }

  if (!rawNode || typeof rawNode !== "object") {
    return { ok: false, error: "Node nội dung Tiptap không hợp lệ." };
  }

  const candidate = rawNode as Record<string, unknown>;
  const nodeType = candidate.type;

  if (typeof nodeType !== "string" || !ALLOWED_NODE_SET.has(nodeType)) {
    return {
      ok: false,
      error: `Loại khối nội dung "${String(nodeType)}" không được hỗ trợ.`,
    };
  }

  const rawAttrs =
    candidate.attrs && typeof candidate.attrs === "object"
      ? (candidate.attrs as Record<string, unknown>)
      : {};

  if (nodeType === "text") {
    const text = typeof candidate.text === "string" ? candidate.text : "";
    const marksResult = sanitizeMarks(candidate.marks);
    if (!marksResult.ok) return marksResult;
    const textNode: TiptapJSONNode = { type: "text", text };
    if (marksResult.marks) textNode.marks = marksResult.marks;
    return { ok: true, node: textNode };
  }

  if (nodeType === "image") {
    const src = typeof rawAttrs.src === "string" ? rawAttrs.src.trim() : "";
    if (!isSafeWebUrl(src)) {
      return {
        ok: false,
        error:
          "Block hình ảnh bắt buộc sử dụng URL HTTP/HTTPS hợp lệ (không chấp nhận dữ liệu base64 nội tuyến).",
      };
    }

    const attrs: Record<string, unknown> = { src };
    if (typeof rawAttrs.alt === "string" && rawAttrs.alt.trim()) {
      attrs.alt = rawAttrs.alt.trim().slice(0, 240);
    }
    if (typeof rawAttrs.caption === "string" && rawAttrs.caption.trim()) {
      attrs.caption = rawAttrs.caption.trim().slice(0, 300);
    }
    if (typeof rawAttrs.publicId === "string" && rawAttrs.publicId.trim()) {
      attrs.publicId = rawAttrs.publicId.trim().slice(0, 300);
    }
    if (typeof rawAttrs.width === "number" && Number.isFinite(rawAttrs.width) && rawAttrs.width > 0) {
      attrs.width = Math.round(rawAttrs.width);
    }
    if (typeof rawAttrs.height === "number" && Number.isFinite(rawAttrs.height) && rawAttrs.height > 0) {
      attrs.height = Math.round(rawAttrs.height);
    }

    return { ok: true, node: { type: "image", attrs } };
  }

  if (nodeType === "audioBlock") {
    const src = typeof rawAttrs.src === "string" ? rawAttrs.src.trim() : "";
    if (!isAllowedAudioUrl(src)) {
      return {
        ok: false,
        error:
          "Block audio chỉ chấp nhận URL HTTPS từ Cloudinary hoặc nguồn domain được phép.",
      };
    }

    const publicId =
      typeof rawAttrs.publicId === "string" && rawAttrs.publicId.trim()
        ? rawAttrs.publicId.trim().slice(0, 300)
        : undefined;
    const title =
      typeof rawAttrs.title === "string" ? rawAttrs.title.trim().slice(0, 160) : "";
    const sourceType = publicId ? "CLOUDINARY" : "EXTERNAL_ALLOWLIST";

    const attrs: Record<string, unknown> = {
      src,
      title,
      sourceType,
    };
    if (publicId) attrs.publicId = publicId;
    if (typeof rawAttrs.mimeType === "string" && rawAttrs.mimeType.trim()) {
      attrs.mimeType = rawAttrs.mimeType.trim().slice(0, 80);
    }
    if (
      typeof rawAttrs.durationSeconds === "number" &&
      Number.isFinite(rawAttrs.durationSeconds) &&
      rawAttrs.durationSeconds > 0
    ) {
      attrs.durationSeconds = Math.round(rawAttrs.durationSeconds);
    }

    return { ok: true, node: { type: "audioBlock", attrs } };
  }

  if (nodeType === "youtubeEmbed") {
    const rawSource =
      (typeof rawAttrs.videoId === "string" && rawAttrs.videoId) ||
      (typeof rawAttrs.url === "string" && rawAttrs.url) ||
      "";
    const videoId = extractYouTubeVideoId(rawSource);
    if (!videoId) {
      return {
        ok: false,
        error: "Liên kết YouTube trong bài viết không hợp lệ.",
      };
    }

    const attrs: Record<string, unknown> = {
      videoId,
      url: `https://www.youtube.com/watch?v=${videoId}`,
      aspectRatio: "16:9",
    };
    if (typeof rawAttrs.title === "string" && rawAttrs.title.trim()) {
      attrs.title = rawAttrs.title.trim().slice(0, 200);
    }

    return { ok: true, node: { type: "youtubeEmbed", attrs } };
  }

  let sanitizedAttrs: Record<string, unknown> | undefined;

  if (nodeType === "heading") {
    const rawLevel = Number(rawAttrs.level);
    const level = rawLevel === 2 || rawLevel === 3 || rawLevel === 4 ? rawLevel : 2;
    sanitizedAttrs = { level };
    if (typeof rawAttrs.textAlign === "string" && ALLOWED_ALIGNMENTS.has(rawAttrs.textAlign)) {
      sanitizedAttrs.textAlign = rawAttrs.textAlign;
    }
  } else if (nodeType === "paragraph") {
    if (typeof rawAttrs.textAlign === "string" && ALLOWED_ALIGNMENTS.has(rawAttrs.textAlign)) {
      sanitizedAttrs = { textAlign: rawAttrs.textAlign };
    }
  } else if (nodeType === "codeBlock") {
    if (typeof rawAttrs.language === "string" && rawAttrs.language.trim()) {
      sanitizedAttrs = { language: rawAttrs.language.trim().slice(0, 40) };
    }
  } else if (nodeType === "calloutBlock") {
    const variant =
      typeof rawAttrs.variant === "string" && ALLOWED_CALLOUT_VARIANTS.has(rawAttrs.variant)
        ? rawAttrs.variant
        : "info";
    const title =
      typeof rawAttrs.title === "string" ? rawAttrs.title.trim().slice(0, 150) : "";
    sanitizedAttrs = { variant, title };
  } else if (nodeType === "tableCell" || nodeType === "tableHeader") {
    const cellAttrs: Record<string, unknown> = {};
    if (typeof rawAttrs.colspan === "number" && rawAttrs.colspan > 1) {
      cellAttrs.colspan = Math.min(20, Math.round(rawAttrs.colspan));
    }
    if (typeof rawAttrs.rowspan === "number" && rawAttrs.rowspan > 1) {
      cellAttrs.rowspan = Math.min(20, Math.round(rawAttrs.rowspan));
    }
    if (Object.keys(cellAttrs).length > 0) {
      sanitizedAttrs = cellAttrs;
    }
  }

  let sanitizedChildren: TiptapJSONNode[] | undefined;
  if (candidate.content !== undefined) {
    if (!Array.isArray(candidate.content)) {
      return { ok: false, error: "Danh sách khối con trong nội dung không hợp lệ." };
    }
    sanitizedChildren = [];
    for (const child of candidate.content) {
      const childRes = sanitizeNode(child, depth + 1);
      if (!childRes.ok) return childRes;
      sanitizedChildren.push(childRes.node);
    }
  }

  const out: TiptapJSONNode = { type: nodeType };
  if (sanitizedAttrs) out.attrs = sanitizedAttrs;
  if (sanitizedChildren) out.content = sanitizedChildren;

  return { ok: true, node: out };
}

export function validateAndSanitizeTiptapDoc(
  input: unknown,
  options?: { minTextLength?: number }
):
  | {
      ok: true;
      doc: TiptapJSONDoc;
      plainText: string;
      readTimeMinutes: number;
    }
  | { ok: false; error: string } {
  if (!input || typeof input !== "object") {
    return { ok: false, error: "Dữ liệu nội dung Tiptap JSON không hợp lệ." };
  }

  const raw = input as { type?: unknown; content?: unknown };
  if (raw.type !== "doc" || !Array.isArray(raw.content)) {
    return {
      ok: false,
      error: 'Tài liệu Tiptap phải có gốc { type: "doc", content: [...] }.',
    };
  }

  const sanitizedContent: TiptapJSONNode[] = [];
  for (const child of raw.content) {
    const res = sanitizeNode(child, 1);
    if (!res.ok) return res;
    sanitizedContent.push(res.node);
  }

  const doc: TiptapJSONDoc = { type: "doc", content: sanitizedContent };
  const plainText = extractPlainTextFromTiptap(doc);
  const minTextLength = options?.minTextLength ?? 20;

  if (plainText.length < minTextLength) {
    return {
      ok: false,
      error: `Nội dung bài viết tối thiểu ${minTextLength} ký tự văn bản.`,
    };
  }

  const readTimeMinutes = estimateReadTimeFromTiptap(doc, plainText);
  return { ok: true, doc, plainText, readTimeMinutes };
}

