import {
  DEFAULT_ALLOWED_AUDIO_HOSTS,
  YOUTUBE_ALLOWED_HOSTS,
} from "@/constants";

export function isSafeWebUrl(
  rawUrl?: string | null,
  options?: { allowRelative?: boolean }
): boolean {
  if (!rawUrl) return false;
  const trimmed = rawUrl.trim();
  if (!trimmed) return false;

  // Reject inline base64/data URIs and script protocols explicitly
  const lowered = trimmed.toLowerCase();
  if (
    lowered.startsWith("data:") ||
    lowered.startsWith("javascript:") ||
    lowered.startsWith("vbscript:")
  ) {
    return false;
  }

  if (
    options?.allowRelative &&
    trimmed.startsWith("/") &&
    !trimmed.startsWith("//")
  ) {
    return true;
  }

  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === "https:" || parsed.protocol === "http:";
  } catch {
    return false;
  }
}

export function getAllowedAudioHosts(): string[] {
  const envHosts = (process.env.ALLOWED_AUDIO_HOSTS || "")
    .split(",")
    .map((h) => h.trim().toLowerCase())
    .filter(Boolean);
  return Array.from(new Set([...DEFAULT_ALLOWED_AUDIO_HOSTS, ...envHosts]));
}

export function isAllowedAudioUrl(rawUrl?: string | null): boolean {
  if (!rawUrl) return false;
  try {
    const parsed = new URL(rawUrl.trim());
    if (parsed.protocol !== "https:") return false;
    const host = parsed.hostname.toLowerCase();
    const allowed = getAllowedAudioHosts();
    return allowed.some(
      (domain) => host === domain || host.endsWith(`.${domain}`)
    );
  } catch {
    return false;
  }
}

const YOUTUBE_ID_REGEX = /^[a-zA-Z0-9_-]{11}$/;

export function extractYouTubeVideoId(input?: string | null): string | null {
  if (!input) return null;
  const trimmed = input.trim();
  if (!trimmed) return null;

  if (YOUTUBE_ID_REGEX.test(trimmed)) {
    return trimmed;
  }

  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
      return null;
    }

    const host = parsed.hostname.toLowerCase();
    const isAllowedHost = (YOUTUBE_ALLOWED_HOSTS as readonly string[]).includes(
      host
    );
    if (!isAllowedHost) return null;

    if (host.includes("youtu.be")) {
      const seg = parsed.pathname.split("/").filter(Boolean)[0] || "";
      return YOUTUBE_ID_REGEX.test(seg) ? seg : null;
    }

    const vParam = parsed.searchParams.get("v");
    if (vParam && YOUTUBE_ID_REGEX.test(vParam)) {
      return vParam;
    }

    const segments = parsed.pathname.split("/").filter(Boolean);
    if (
      segments.length >= 2 &&
      (segments[0] === "embed" ||
        segments[0] === "shorts" ||
        segments[0] === "live") &&
      YOUTUBE_ID_REGEX.test(segments[1])
    ) {
      return segments[1];
    }

    return null;
  } catch {
    return null;
  }
}

export interface DetectedMagicFile {
  mediaKind: "IMAGE" | "AUDIO";
  mimeType: string;
  extension: string;
}

export function detectMediaMagicBytes(
  bytes: Uint8Array
): DetectedMagicFile | null {
  if (bytes.length < 12) return null;

  // JPEG: FF D8 FF
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return { mediaKind: "IMAGE", mimeType: "image/jpeg", extension: "jpg" };
  }

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47 &&
    bytes[4] === 0x0d &&
    bytes[5] === 0x0a &&
    bytes[6] === 0x1a &&
    bytes[7] === 0x0a
  ) {
    return { mediaKind: "IMAGE", mimeType: "image/png", extension: "png" };
  }

  // GIF: GIF8
  if (
    bytes[0] === 0x47 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x38
  ) {
    return { mediaKind: "IMAGE", mimeType: "image/gif", extension: "gif" };
  }

  // RIFF container -> WebP or WAV
  if (
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46
  ) {
    // WEBP at 8..11
    if (
      bytes[8] === 0x57 &&
      bytes[9] === 0x45 &&
      bytes[10] === 0x42 &&
      bytes[11] === 0x50
    ) {
      return { mediaKind: "IMAGE", mimeType: "image/webp", extension: "webp" };
    }
    // WAVE at 8..11
    if (
      bytes[8] === 0x57 &&
      bytes[9] === 0x41 &&
      bytes[10] === 0x56 &&
      bytes[11] === 0x45
    ) {
      return { mediaKind: "AUDIO", mimeType: "audio/wav", extension: "wav" };
    }
  }

  // OGG: OggS
  if (
    bytes[0] === 0x4f &&
    bytes[1] === 0x67 &&
    bytes[2] === 0x67 &&
    bytes[3] === 0x53
  ) {
    return { mediaKind: "AUDIO", mimeType: "audio/ogg", extension: "ogg" };
  }

  // MP3 with ID3 tag: 49 44 33
  if (bytes[0] === 0x49 && bytes[1] === 0x44 && bytes[2] === 0x33) {
    return { mediaKind: "AUDIO", mimeType: "audio/mpeg", extension: "mp3" };
  }

  // MP3 raw frame sync: FF Fx (excluding F0)
  if (bytes[0] === 0xff && (bytes[1] & 0xe0) === 0xe0 && bytes[1] !== 0xff) {
    return { mediaKind: "AUDIO", mimeType: "audio/mpeg", extension: "mp3" };
  }

  // M4A / MP4 ISO Base Media: 'ftyp' at bytes 4..7
  if (
    bytes[4] === 0x66 &&
    bytes[5] === 0x74 &&
    bytes[6] === 0x79 &&
    bytes[7] === 0x70
  ) {
    return { mediaKind: "AUDIO", mimeType: "audio/mp4", extension: "m4a" };
  }

  return null;
}

export function sanitizeOriginalFilename(name: string): string {
  const base = name.split(/[/\\]/).pop() || "media";
  return base
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9._-]/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 120);
}

export function formatFileBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 B";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

