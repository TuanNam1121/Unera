/**
 * Pure client/server utilities for Module 03 (Orientation Explore)
 */

export function slugifyVietnamese(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[đĐ]/g, "d")
    .replace(/[^a-z0-9\s-]/g, " ")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function normalizeStringList(items?: string[]): string[] {
  if (!Array.isArray(items)) return [];
  const seen = new Set<string>();
  const result: string[] = [];

  for (const item of items) {
    const trimmed = typeof item === "string" ? item.trim() : "";
    if (!trimmed) continue;
    const key = trimmed.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(trimmed);
  }

  return result;
}

export function isSafeMediaUrl(url?: string | null): boolean {
  if (!url) return true;
  const trimmed = url.trim();
  if (!trimmed) return true;
  if (trimmed.startsWith("/") && !trimmed.startsWith("//")) return true;
  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === "https:" || parsed.protocol === "http:";
  } catch {
    return false;
  }
}

export function escapeRegexInput(input: string): string {
  return input.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export const ORIENTATION_ICON_OPTIONS = [
  { value: "Compass", label: "La bàn định hướng" },
  { value: "Globe2", label: "Quốc tế / Du học" },
  { value: "Layers", label: "Khối ngành" },
  { value: "GraduationCap", label: "Sau đại học" },
  { value: "BookOpen", label: "Học thuật" },
  { value: "Briefcase", label: "Nghề nghiệp" },
] as const;

const GRADIENT_POOL = [
  "from-blue-600 via-indigo-600 to-sky-500",
  "from-emerald-600 via-teal-600 to-cyan-500",
  "from-violet-600 via-purple-600 to-fuchsia-500",
  "from-amber-500 via-orange-500 to-rose-500",
  "from-slate-700 via-blue-800 to-indigo-800",
] as const;

export function getCategoryBannerGradient(seed?: string): string {
  if (!seed) return GRADIENT_POOL[0];
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return GRADIENT_POOL[hash % GRADIENT_POOL.length];
}

