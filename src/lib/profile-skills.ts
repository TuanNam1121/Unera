export const SUGGESTED_HARD_SKILLS = [
  "IELTS 7.0+",
  "TOEIC 800+",
  "Python",
  "SQL",
  "Figma / UI-UX",
  "Phân tích dữ liệu",
  "Biên - Phiên dịch",
  "Nghiên cứu khoa học",
  "Tài chính - Kế toán",
  "Digital Marketing",
] as const;

export const SUGGESTED_SOFT_SKILLS = [
  "Thuyết trình",
  "Làm việc nhóm",
  "Quản lý dự án",
  "Tư duy phản biện",
  "Giao tiếp đa văn hóa",
  "Quản lý thời gian",
  "Giải quyết vấn đề",
  "Lãnh đạo đội nhóm",
] as const;

const KNOWN_SOFT_SKILL_SET = new Set(
  SUGGESTED_SOFT_SKILLS.map((skill) => skill.toLowerCase())
);

/**
 * Chuẩn hóa danh sách chuỗi: bỏ khoảng trắng thừa, bỏ phần tử rỗng và chống trùng lặp không phân biệt hoa/thường
 */
export function normalizeUniqueStrings(items: unknown): string[] {
  if (!Array.isArray(items)) return [];
  const seen = new Set<string>();
  const result: string[] = [];

  for (const raw of items) {
    if (typeof raw !== "string") continue;
    const trimmed = raw.trim().replace(/\s+/g, " ");
    if (!trimmed) continue;
    const key = trimmed.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(trimmed);
  }

  return result;
}

/**
 * Chuẩn hóa cặp Kỹ năng chuyên môn / Kỹ năng mềm và suy luận tương thích ngược từ `skills` cũ nếu cần
 */
export function resolveCategorizedSkills(input?: {
  hardSkills?: string[] | null;
  softSkills?: string[] | null;
  skills?: string[] | null;
}): {
  hardSkills: string[];
  softSkills: string[];
  skills: string[];
} {
  const existingHard = normalizeUniqueStrings(input?.hardSkills);
  const existingSoft = normalizeUniqueStrings(input?.softSkills);
  const legacyAll = normalizeUniqueStrings(input?.skills);

  if (existingHard.length > 0 || existingSoft.length > 0) {
    return {
      hardSkills: existingHard,
      softSkills: existingSoft,
      skills: normalizeUniqueStrings([...existingHard, ...existingSoft]),
    };
  }

  const hardSkills: string[] = [];
  const softSkills: string[] = [];

  for (const skill of legacyAll) {
    const lower = skill.toLowerCase();
    if (
      KNOWN_SOFT_SKILL_SET.has(lower) ||
      lower.includes("thuyết trình") ||
      lower.includes("giao tiếp") ||
      lower.includes("quản lý") ||
      lower.includes("làm việc nhóm") ||
      lower.includes("lãnh đạo")
    ) {
      softSkills.push(skill);
    } else {
      hardSkills.push(skill);
    }
  }

  return {
    hardSkills,
    softSkills,
    skills: normalizeUniqueStrings([...hardSkills, ...softSkills]),
  };
}

