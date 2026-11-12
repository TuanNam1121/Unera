import type { TiptapJSONDoc, TiptapJSONNode } from "@/types";

export interface ExtractedMediaRef {
  url: string;
  publicId?: string;
  role: "COVER" | "CONTENT";
}

function collectTextNodes(node: TiptapJSONNode, parts: string[]) {
  if (!node || typeof node !== "object") return;

  if (node.type === "text" && typeof node.text === "string") {
    parts.push(node.text);
  }

  if (node.type === "calloutBlock" && typeof node.attrs?.title === "string") {
    parts.push(node.attrs.title);
  }

  if (node.type === "image" && typeof node.attrs?.caption === "string") {
    parts.push(node.attrs.caption);
  }

  if (node.type === "audioBlock" && typeof node.attrs?.title === "string") {
    parts.push(node.attrs.title);
  }

  if (node.type === "youtubeEmbed" && typeof node.attrs?.title === "string") {
    parts.push(node.attrs.title);
  }

  if (Array.isArray(node.content)) {
    for (const child of node.content) {
      collectTextNodes(child, parts);
    }
    if (
      [
        "paragraph",
        "heading",
        "blockquote",
        "codeBlock",
        "listItem",
        "tableRow",
        "calloutBlock",
      ].includes(node.type)
    ) {
      parts.push(" ");
    }
  }
}

export function extractPlainTextFromTiptap(doc?: TiptapJSONDoc | null): string {
  if (!doc || typeof doc !== "object" || !Array.isArray(doc.content)) {
    return "";
  }
  const parts: string[] = [];
  for (const child of doc.content) {
    collectTextNodes(child, parts);
  }
  return parts.join("").replace(/\s+/g, " ").trim();
}

function countMediaBlocks(node: TiptapJSONNode): number {
  if (!node || typeof node !== "object") return 0;
  let count = ["image", "audioBlock", "youtubeEmbed"].includes(node.type)
    ? 1
    : 0;
  if (Array.isArray(node.content)) {
    for (const child of node.content) {
      count += countMediaBlocks(child);
    }
  }
  return count;
}

export function estimateReadTimeFromTiptap(
  doc?: TiptapJSONDoc | null,
  precomputedPlainText?: string
): number {
  const plainText = precomputedPlainText ?? extractPlainTextFromTiptap(doc);
  const wordCount = plainText.trim().split(/\s+/).filter(Boolean).length;
  const mediaCount =
    doc && Array.isArray(doc.content)
      ? doc.content.reduce((sum, n) => sum + countMediaBlocks(n), 0)
      : 0;

  // ~200 từ/phút + ~12 giây cho mỗi media block
  const minutes = Math.ceil((wordCount / 200) + mediaCount * 0.2);
  return Math.min(120, Math.max(1, minutes));
}

function walkMediaNodes(
  node: TiptapJSONNode,
  refs: ExtractedMediaRef[]
) {
  if (!node || typeof node !== "object") return;

  if (node.type === "image" && typeof node.attrs?.src === "string") {
    const url = node.attrs.src.trim();
    const publicId =
      typeof node.attrs?.publicId === "string" && node.attrs.publicId.trim()
        ? node.attrs.publicId.trim()
        : undefined;
    if (url) {
      refs.push({ url, publicId, role: "CONTENT" });
    }
  } else if (
    node.type === "audioBlock" &&
    typeof node.attrs?.src === "string"
  ) {
    const url = node.attrs.src.trim();
    const publicId =
      typeof node.attrs?.publicId === "string" && node.attrs.publicId.trim()
        ? node.attrs.publicId.trim()
        : undefined;
    if (url) {
      refs.push({ url, publicId, role: "CONTENT" });
    }
  }

  if (Array.isArray(node.content)) {
    for (const child of node.content) {
      walkMediaNodes(child, refs);
    }
  }
}

export function extractMediaRefsFromTiptapAndCover(params: {
  coverImage?: string | null;
  contentJson?: TiptapJSONDoc | null;
}): ExtractedMediaRef[] {
  const refs: ExtractedMediaRef[] = [];

  if (params.coverImage && params.coverImage.trim()) {
    refs.push({
      url: params.coverImage.trim(),
      role: "COVER",
    });
  }

  if (params.contentJson && Array.isArray(params.contentJson.content)) {
    for (const child of params.contentJson.content) {
      walkMediaNodes(child, refs);
    }
  }

  return refs;
}

// ==============================================================================
// Seed & Test Tiptap Document Builder Helpers
// ==============================================================================

export function tiptapText(text: string, bold = false): TiptapJSONNode {
  return bold
    ? { type: "text", text, marks: [{ type: "bold" }] }
    : { type: "text", text };
}

export function tiptapHeading(level: 2 | 3 | 4, text: string): TiptapJSONNode {
  return {
    type: "heading",
    attrs: { level },
    content: [tiptapText(text)],
  };
}

export function tiptapParagraph(nodes: TiptapJSONNode[]): TiptapJSONNode {
  return {
    type: "paragraph",
    content: nodes,
  };
}

export function tiptapList(
  ordered: boolean,
  items: TiptapJSONNode[][]
): TiptapJSONNode {
  return {
    type: ordered ? "orderedList" : "bulletList",
    content: items.map((inlineNodes) => ({
      type: "listItem",
      content: [tiptapParagraph(inlineNodes)],
    })),
  };
}

export function tiptapCallout(
  variant: "info" | "tip" | "warning",
  title: string,
  bodyText: string
): TiptapJSONNode {
  return {
    type: "calloutBlock",
    attrs: { variant, title },
    content: [tiptapParagraph([tiptapText(bodyText)])],
  };
}

export const EMPTY_TIPTAP_DOC: TiptapJSONDoc = {
  type: "doc",
  content: [{ type: "paragraph" }],
};

export function createTiptapDoc(content: TiptapJSONNode[]): TiptapJSONDoc {
  return {
    type: "doc",
    content,
  };
}
