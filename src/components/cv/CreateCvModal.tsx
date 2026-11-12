"use client";

import { useState } from "react";
import { Award, CheckCircle2, Loader2, Sparkles, X } from "lucide-react";
import { fetchWithAuth } from "@/components/providers/AuthProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DEFAULT_CV_TEMPLATE_ID } from "@/constants/cv";
import { CV_TEMPLATES } from "@/lib/cv-templates";
import type {
  CvLocale,
  ICvDocumentDTO,
  ICvProfilePrefillSeed,
} from "@/types/cv";

interface CreateCvModalProps {
  open: boolean;
  defaultTemplateId?: string;
  profileSeed: ICvProfilePrefillSeed | null;
  onClose: () => void;
  onCreated: (cv: ICvDocumentDTO) => void;
}

export function CreateCvModal({
  open,
  defaultTemplateId,
  profileSeed,
  onClose,
  onCreated,
}: CreateCvModalProps) {
  if (!open) return null;
  const modalKey = `${defaultTemplateId || DEFAULT_CV_TEMPLATE_ID}-${profileSeed?.achievements.length ?? 0}`;
  return (
    <CreateCvModalInner
      key={modalKey}
      defaultTemplateId={defaultTemplateId}
      profileSeed={profileSeed}
      onClose={onClose}
      onCreated={onCreated}
    />
  );
}

function CreateCvModalInner({
  defaultTemplateId,
  profileSeed,
  onClose,
  onCreated,
}: Omit<CreateCvModalProps, "open">) {
  const [title, setTitle] = useState("");
  const [targetRole, setTargetRole] = useState("");
  const [templateId, setTemplateId] = useState(
    defaultTemplateId || DEFAULT_CV_TEMPLATE_ID
  );
  const [locale, setLocale] = useState<CvLocale>("vi");
  const [prefillFromProfile, setPrefillFromProfile] = useState(true);
  const [achievementYears, setAchievementYears] = useState<
    Record<string, string>
  >(() => {
    const seedYears: Record<string, string> = {};
    profileSeed?.achievements.forEach((item, idx) => {
      seedYears[String(idx)] = item.suggestedYear
        ? String(item.suggestedYear)
        : "";
    });
    return seedYears;
  });
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const totalSeedSkills =
    (profileSeed?.hardSkills.length ?? 0) +
    (profileSeed?.softSkills.length ?? 0) +
    (profileSeed?.extraSkills.length ?? 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim().length < 2) {
      setErrorMsg("Vui lòng nhập tên CV (ít nhất 2 ký tự).");
      return;
    }

    const achievementYearsOverride: Record<string, number | null> = {};
    const currentYear = new Date().getFullYear();

    for (const [key, rawVal] of Object.entries(achievementYears)) {
      const trimmed = rawVal.trim();
      if (!trimmed) {
        achievementYearsOverride[key] = null;
        continue;
      }
      const parsedYear = Number(trimmed);
      if (
        !Number.isInteger(parsedYear) ||
        parsedYear < 1980 ||
        parsedYear > currentYear + 1
      ) {
        setErrorMsg(
          `Năm đạt thành tích phải là số nguyên từ 1980 đến ${currentYear + 1}.`
        );
        return;
      }
      achievementYearsOverride[key] = parsedYear;
    }

    setSubmitting(true);
    setErrorMsg(null);
    try {
      const res = await fetchWithAuth("/api/cv", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          targetRole: targetRole.trim(),
          templateId,
          locale,
          prefillFromProfile,
          achievementYearsOverride: prefillFromProfile
            ? achievementYearsOverride
            : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.cv) {
        setErrorMsg(data.error || "Không thể tạo CV mới.");
        return;
      }
      setTitle("");
      setTargetRole("");
      onCreated(data.cv as ICvDocumentDTO);
    } catch {
      setErrorMsg("Lỗi kết nối máy chủ khi tạo CV.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
      <div className="w-full max-w-xl max-h-[90vh] flex flex-col rounded-2xl bg-white border border-slate-200 shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div>
            <h3 className="text-base font-bold text-slate-900">Tạo CV mới</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Khởi tạo CV chuẩn ATS và đồng bộ sẵn kỹ năng, thành tích từ hồ sơ UNERA
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="overflow-y-auto p-5 space-y-4">
          {errorMsg && (
            <div className="rounded-xl bg-rose-50 border border-rose-200 px-3 py-2 text-xs text-rose-700">
              {errorMsg}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-xs font-semibold text-slate-700">
                Tên CV <span className="text-rose-500">*</span>
              </label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="VD: CV Thực tập Marketing - Unilever 2026"
                maxLength={120}
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">
                Vị trí ứng tuyển mục tiêu
              </label>
              <Input
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
                placeholder="VD: Marketing Intern"
                maxLength={120}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">
                Ngôn ngữ nhãn tiêu đề CV
              </label>
              <select
                value={locale}
                onChange={(e) => setLocale(e.target.value as CvLocale)}
                className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs text-slate-800 focus:border-blue-500 focus:outline-none"
              >
                <option value="vi">Tiếng Việt (Học vấn, Kinh nghiệm...)</option>
                <option value="en">English (Education, Work Experience...)</option>
              </select>
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-xs font-semibold text-slate-700">
                Mẫu CV khởi tạo
              </label>
              <select
                value={templateId}
                onChange={(e) => setTemplateId(e.target.value)}
                className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs text-slate-800 focus:border-blue-500 focus:outline-none"
              >
                {CV_TEMPLATES.map((tpl) => (
                  <option key={tpl.id} value={tpl.id}>
                    {tpl.name} — ATS {tpl.atsScore}%
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Prefill from StudentProfile Toggle & Preview */}
          <div className="rounded-xl border border-blue-200/80 bg-blue-50/50 p-3.5 space-y-3">
            <label className="flex items-start justify-between gap-3 cursor-pointer">
              <div className="flex items-start gap-2.5">
                <Sparkles className="h-4 w-4 text-blue-600 mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs font-bold text-slate-900">
                    Tự động điền từ Hồ sơ cá nhân UNERA
                  </p>
                  <p className="text-[11px] text-slate-600 mt-0.5">
                    Lấy sẵn Họ tên, Email, Trường/Ngành, Kỹ năng (Chuyên môn, Mềm, Khác) và Bảng thành tích.
                  </p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={prefillFromProfile}
                onChange={(e) => setPrefillFromProfile(e.target.checked)}
                className="mt-1 h-4 w-4 rounded border-slate-300 accent-blue-600 cursor-pointer"
              />
            </label>

            {prefillFromProfile && profileSeed && (
              <div className="space-y-2.5 pt-2 border-t border-blue-200/60 text-xs">
                <div className="flex flex-wrap gap-2">
                  <span className="inline-flex items-center gap-1 rounded-full bg-white border border-blue-200 px-2.5 py-0.5 text-[11px] font-medium text-blue-700">
                    <CheckCircle2 className="h-3 w-3" />
                    {totalSeedSkills} kỹ năng (
                    {profileSeed.hardSkills.length} chuyên môn ·{" "}
                    {profileSeed.softSkills.length} mềm
                    {profileSeed.extraSkills.length > 0
                      ? ` · ${profileSeed.extraSkills.length} khác`
                      : ""}
                    )
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-white border border-amber-200 px-2.5 py-0.5 text-[11px] font-medium text-amber-700">
                    <Award className="h-3 w-3" />
                    {profileSeed.achievements.length} thành tích
                  </span>
                </div>

                {profileSeed.achievements.length > 0 && (
                  <div className="space-y-1.5 rounded-xl bg-white border border-blue-100 p-2.5">
                    <p className="text-[11px] font-semibold text-slate-700">
                      Gắn nhanh thông tin Năm cho từng Thành tích (có thể sửa sau trong Editor):
                    </p>
                    <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1">
                      {profileSeed.achievements.map((item, idx) => (
                        <div
                          key={`${item.title}-${idx}`}
                          className="flex items-center justify-between gap-2 text-[11px]"
                        >
                          <span className="truncate text-slate-700 flex-1">
                            • {item.title}
                          </span>
                          <input
                            type="number"
                            min={1980}
                            max={new Date().getFullYear() + 1}
                            placeholder="Năm"
                            value={achievementYears[String(idx)] ?? ""}
                            onChange={(e) =>
                              setAchievementYears((prev) => ({
                                ...prev,
                                [String(idx)]: e.target.value,
                              }))
                            }
                            className="h-7 w-20 rounded-lg border border-slate-200 px-2 text-center text-[11px] text-slate-800 focus:border-blue-500 focus:outline-none"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={submitting}
            >
              Hủy
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={submitting}
              className="bg-blue-600 hover:bg-blue-700 text-white gap-1.5"
            >
              {submitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              <span>Tạo CV &amp; Mở Editor</span>
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

