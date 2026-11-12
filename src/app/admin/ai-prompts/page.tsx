"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  ArrowLeft,
  Bot,
  CheckCircle2,
  ClipboardList,
  Clock,
  FlaskConical,
  Loader2,
  Play,
  Plus,
  Sparkles,
  X,
} from "lucide-react";
import { fetchWithAuth } from "@/components/providers/AuthProvider";
import {
  DEFAULT_GEMINI_MODEL,
  GEMINI_MODELS,
  resolveAllowedGeminiModel,
  SYSTEM_PROMPT_KEYS,
  SystemPromptKey,
} from "@/constants";
import type { ISystemPromptDTO } from "@/types";

const PROMPT_KEY_META: Record<
  SystemPromptKey,
  { label: string; badge: string; description: string }
> = {
  [SYSTEM_PROMPT_KEYS.ORIENTATION_ANALYSIS]: {
    label: "1. Phân tích Định hướng AI",
    badge: "ORIENTATION_ANALYSIS",
    description:
      "Chỉ dẫn Gemini AI tổng hợp hồ sơ sinh viên (kể cả khi thiếu thành tích/kỹ năng ở lần onboarding đầu) và câu trả lời khảo sát để đánh giá 5 hướng phát triển.",
  },
  [SYSTEM_PROMPT_KEYS.ROADMAP_GENERATION]: {
    label: "2. Kiến tạo Lộ trình 4 năm",
    badge: "ROADMAP_GENERATION",
    description:
      "Chỉ dẫn Gemini AI chuyển hóa kết quả định hướng và bối cảnh năm học thành lộ trình 4 năm chi tiết với mục tiêu học kỳ, phân loại và mức ưu tiên.",
  },
};

function formatDateTimeVi(iso?: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function AdminAiPromptsPage() {
  const [prompts, setPrompts] = useState<ISystemPromptDTO[]>([]);
  const [activeKey, setActiveKey] = useState<SystemPromptKey>(
    SYSTEM_PROMPT_KEYS.ORIENTATION_ANALYSIS
  );
  const [selectedPromptId, setSelectedPromptId] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [modelName, setModelName] = useState<string>(DEFAULT_GEMINI_MODEL);
  const [temperature, setTemperature] = useState<number>(0.35);
  const [promptContent, setPromptContent] = useState("");
  const [activateImmediately, setActivateImmediately] = useState(true);

  const [sampleInput, setSampleInput] = useState("");
  const [testResult, setTestResult] = useState<{
    durationMs: number;
    retryCount: number;
    modelUsed: string;
    output: unknown;
  } | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activatingId, setActivatingId] = useState<string | null>(null);
  const [testing, setTesting] = useState(false);
  const [banner, setBanner] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const populateEditor = useCallback((ver: ISystemPromptDTO | undefined) => {
    if (!ver) return;
    setSelectedPromptId(ver._id);
    setName(ver.name);
    setModelName(resolveAllowedGeminiModel(ver.modelName));
    setTemperature(ver.temperature ?? 0.35);
    setPromptContent(ver.promptContent);
    setTestResult(null);
  }, []);

  const loadPrompts = useCallback(
    async (preferredId?: string, targetKey: SystemPromptKey = activeKey) => {
      try {
        const res = await fetchWithAuth("/api/admin/ai-prompts", {
          cache: "no-store",
        });
        const data = await res.json();
        if (!res.ok) {
          setBanner({
            type: "error",
            text: data.error || "Không thể tải danh sách System Prompt.",
          });
          return;
        }
        const list: ISystemPromptDTO[] = data.prompts || [];
        setPrompts(list);

        const scoped = list
          .filter((p) => p.key === targetKey)
          .sort((a, b) => b.version - a.version);
        const matched =
          (preferredId && scoped.find((p) => p._id === preferredId)) ||
          scoped.find((p) => p.isActive) ||
          scoped[0];
        populateEditor(matched);
      } catch {
        setBanner({
          type: "error",
          text: "Lỗi kết nối máy chủ khi tải System Prompt.",
        });
      } finally {
        setLoading(false);
      }
    },
    [activeKey, populateEditor]
  );

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await fetchWithAuth("/api/admin/ai-prompts", {
          cache: "no-store",
        });
        const data = await res.json();
        if (!active) return;
        if (!res.ok) {
          setBanner({
            type: "error",
            text: data.error || "Không thể tải danh sách System Prompt.",
          });
          return;
        }
        const list: ISystemPromptDTO[] = data.prompts || [];
        setPrompts(list);
        const scoped = list
          .filter((p) => p.key === SYSTEM_PROMPT_KEYS.ORIENTATION_ANALYSIS)
          .sort((a, b) => b.version - a.version);
        const matched = scoped.find((p) => p.isActive) || scoped[0];
        populateEditor(matched);
      } catch {
        if (active) {
          setBanner({
            type: "error",
            text: "Lỗi kết nối máy chủ khi tải System Prompt.",
          });
        }
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [populateEditor]);

  const versionsForKey = useMemo(
    () =>
      prompts
        .filter((p) => p.key === activeKey)
        .sort((a, b) => b.version - a.version),
    [prompts, activeKey]
  );

  const handleSelectKeyTab = (key: SystemPromptKey) => {
    setActiveKey(key);
    const scoped = prompts
      .filter((p) => p.key === key)
      .sort((a, b) => b.version - a.version);
    const matched = scoped.find((p) => p.isActive) || scoped[0];
    populateEditor(matched);
  };

  const handleSelectVersion = (ver: ISystemPromptDTO) => {
    populateEditor(ver);
  };

  const handleSaveNewVersion = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setBanner(null);
    try {
      const res = await fetchWithAuth("/api/admin/ai-prompts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          key: activeKey,
          name: name.trim(),
          promptContent: promptContent.trim(),
          modelName: modelName.trim() || DEFAULT_GEMINI_MODEL,
          temperature: Number(temperature),
          activateImmediately,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.prompt) {
        setBanner({
          type: "error",
          text: data.error || "Không thể lưu phiên bản prompt mới.",
        });
        return;
      }
      setBanner({
        type: "success",
        text: `Đã tạo phiên bản v${data.prompt.version}${data.prompt.isActive ? " và kích hoạt ngay" : ""}.`,
      });
      await loadPrompts(data.prompt._id);
    } catch {
      setBanner({ type: "error", text: "Lỗi kết nối khi lưu System Prompt." });
    } finally {
      setSaving(false);
    }
  };

  const handleActivateVersion = async (id: string) => {
    setActivatingId(id);
    setBanner(null);
    try {
      const res = await fetchWithAuth(`/api/admin/ai-prompts/${id}/activate`, {
        method: "PATCH",
      });
      const data = await res.json();
      if (!res.ok || !data.prompt) {
        setBanner({
          type: "error",
          text: data.error || "Không thể kích hoạt phiên bản prompt này.",
        });
        return;
      }
      setBanner({
        type: "success",
        text: `Đã kích hoạt ${data.prompt.key} v${data.prompt.version}.`,
      });
      await loadPrompts(id);
    } catch {
      setBanner({ type: "error", text: "Lỗi mạng khi kích hoạt prompt." });
    } finally {
      setActivatingId(null);
    }
  };

  const handleTestPrompt = async () => {
    setTesting(true);
    setBanner(null);
    setTestResult(null);
    try {
      const res = await fetchWithAuth("/api/admin/ai-prompts/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          key: activeKey,
          promptContent,
          modelName,
          temperature: Number(temperature),
          sampleInput: sampleInput.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setBanner({
          type: "error",
          text: data.error || "Thử nghiệm Prompt với Gemini thất bại.",
        });
        return;
      }
      setTestResult({
        durationMs: data.durationMs,
        retryCount: data.retryCount,
        modelUsed: data.modelUsed,
        output: data.output,
      });
    } catch {
      setBanner({
        type: "error",
        text: "Lỗi kết nối máy chủ khi gọi Gemini thử nghiệm.",
      });
    } finally {
      setTesting(false);
    }
  };

  const selectedVersion = versionsForKey.find(
    (v) => v._id === selectedPromptId
  );

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
      <header className="flex flex-col justify-between gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-xs sm:flex-row sm:items-center">
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-[#102C8A]">
            <Bot className="h-3.5 w-3.5" />
            Quản trị AI Engine & System Prompts
          </div>
          <h1 className="mt-2 text-2xl font-bold text-slate-900">
            Cấu hình System Prompt Google Gemini AI
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Quản lý phiên bản, tinh chỉnh model/temperature và thử nghiệm
            structured JSON trực tiếp với dữ liệu sinh viên mẫu.
          </p>
        </div>

        <Link
          href="/admin/quiz"
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:border-[#102C8A]/40 hover:text-[#102C8A]"
        >
          <ClipboardList className="h-4 w-4" />
          Quay lại Bộ câu hỏi
          <ArrowLeft className="h-4 w-4 rotate-180 hidden" />
        </Link>
      </header>

      {banner && (
        <div
          className={`flex items-center justify-between rounded-2xl border px-4 py-3 text-sm font-medium ${
            banner.type === "error"
              ? "border-rose-200 bg-rose-50 text-rose-800"
              : "border-emerald-200 bg-emerald-50 text-emerald-800"
          }`}
        >
          <span className="flex items-center gap-2">
            {banner.type === "error" ? (
              <AlertCircle className="h-4 w-4 shrink-0" />
            ) : (
              <CheckCircle2 className="h-4 w-4 shrink-0" />
            )}
            {banner.text}
          </span>
          <button
            type="button"
            onClick={() => setBanner(null)}
            className="rounded-lg p-1 hover:bg-black/5"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Key Selector Tabs */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {(
          [
            SYSTEM_PROMPT_KEYS.ORIENTATION_ANALYSIS,
            SYSTEM_PROMPT_KEYS.ROADMAP_GENERATION,
          ] as const
        ).map((key) => {
          const meta = PROMPT_KEY_META[key];
          const active = activeKey === key;
          const activeVer = prompts.find((p) => p.key === key && p.isActive);
          return (
            <button
              key={key}
              type="button"
              onClick={() => handleSelectKeyTab(key)}
              className={`rounded-2xl border p-4 text-left transition ${
                active
                  ? "border-[#102C8A] bg-blue-50/40 ring-2 ring-[#102C8A]/15"
                  : "border-slate-200 bg-white hover:border-slate-300"
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-bold text-slate-900">
                  {meta.label}
                </span>
                {activeVer && (
                  <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700">
                    Active: v{activeVer.version} ({activeVer.modelName})
                  </span>
                )}
              </div>
              <p className="mt-1 text-xs leading-relaxed text-slate-600">
                {meta.description}
              </p>
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Version Sidebar */}
        <aside className="lg:col-span-4">
          <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-xs">
            <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-600">
              Lịch sử phiên bản ({versionsForKey.length})
            </h2>

            {loading ? (
              <div className="flex justify-center py-10">
                <Loader2 className="h-6 w-6 animate-spin text-[#102C8A]" />
              </div>
            ) : (
              <div className="space-y-2.5">
                {versionsForKey.map((ver) => {
                  const isSelected = ver._id === selectedPromptId;
                  return (
                    <div
                      key={ver._id}
                      className={`rounded-2xl border p-3.5 transition ${
                        isSelected
                          ? "border-[#102C8A] bg-blue-50/35 ring-1 ring-[#102C8A]/20"
                          : "border-slate-200 bg-white hover:border-slate-300"
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => handleSelectVersion(ver)}
                        className="w-full text-left"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="rounded-lg bg-slate-900 px-2 py-0.5 text-xs font-bold text-white">
                            v{ver.version}
                          </span>
                          {ver.isActive ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                              <CheckCircle2 className="h-3 w-3" />
                              Đang hoạt động
                            </span>
                          ) : (
                            <span className="text-[11px] text-slate-500">
                              Bản lưu
                            </span>
                          )}
                        </div>
                        <h3 className="mt-2 text-sm font-bold text-slate-900">
                          {ver.name}
                        </h3>
                        <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
                          <span className="font-mono text-[#102C8A]">
                            {ver.modelName}
                          </span>
                          <span>· temp {ver.temperature}</span>
                        </div>
                        {ver.createdAt && (
                          <div className="mt-1 flex items-center gap-1 text-[11px] text-slate-400">
                            <Clock className="h-3 w-3" />
                            {formatDateTimeVi(ver.createdAt)}
                          </div>
                        )}
                      </button>

                      {!ver.isActive && (
                        <div className="mt-2.5 border-t border-slate-100 pt-2">
                          <button
                            type="button"
                            disabled={activatingId === ver._id}
                            onClick={() => handleActivateVersion(ver._id)}
                            className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-800 hover:bg-emerald-100 disabled:opacity-60"
                          >
                            {activatingId === ver._id ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <CheckCircle2 className="h-3.5 w-3.5" />
                            )}
                            Kích hoạt phiên bản v{ver.version}
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </aside>

        {/* Prompt Editor + Live Test Sandbox */}
        <section className="space-y-6 lg:col-span-8">
          <form
            onSubmit={handleSaveNewVersion}
            className="space-y-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-xs"
          >
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Biên tập & Tạo phiên bản mới
                </h2>
                <p className="text-xs text-slate-500">
                  Đang xem từ{" "}
                  <strong>
                    {selectedVersion ? `v${selectedVersion.version}` : "mới"}
                  </strong>
                  . Khi lưu sẽ tự động tăng version mới để bảo toàn lịch sử.
                </p>
              </div>
              <span className="rounded-lg bg-slate-100 px-2.5 py-1 font-mono text-xs font-semibold text-slate-700">
                {activeKey}
              </span>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-12">
              <div className="sm:col-span-5">
                <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                  Tên gợi nhớ phiên bản
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  placeholder="VD: Prompt chuẩn hóa cho SV năm nhất"
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-hidden focus:border-[#102C8A]"
                />
              </div>

              <div className="sm:col-span-4">
                <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                  Model Gemini
                </label>
                <select
                  value={resolveAllowedGeminiModel(modelName)}
                  onChange={(e) => setModelName(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 font-mono text-xs text-slate-900 outline-hidden focus:border-[#102C8A]"
                >
                  {GEMINI_MODELS.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-[11px] text-slate-500">
                  Tự động chuyển đổi qua lại giữa 2 model khi gặp giới hạn 429/Quota.
                </p>
              </div>

              <div className="sm:col-span-3">
                <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                  Temperature ({temperature})
                </label>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={temperature}
                  onChange={(e) => setTemperature(Number(e.target.value))}
                  className="mt-2 w-full accent-[#102C8A]"
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                Nội dung System Prompt (tối thiểu 20 ký tự)
              </label>
              <textarea
                rows={12}
                value={promptContent}
                onChange={(e) => setPromptContent(e.target.value)}
                required
                className="w-full rounded-2xl border border-slate-200 bg-slate-50/70 p-4 font-mono text-xs leading-relaxed text-slate-900 outline-hidden focus:border-[#102C8A] focus:bg-white"
              />
            </div>

            <div className="flex flex-col justify-between gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-center">
              <label className="inline-flex cursor-pointer items-center gap-2 text-xs font-medium text-slate-700">
                <input
                  type="checkbox"
                  checked={activateImmediately}
                  onChange={(e) => setActivateImmediately(e.target.checked)}
                  className="h-4 w-4 rounded accent-[#102C8A]"
                />
                Kích hoạt phiên bản mới ngay sau khi lưu
              </label>

              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#102C8A] px-5 py-2.5 text-sm font-semibold text-white shadow-xs transition hover:bg-[#0B2066] disabled:opacity-60"
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4" />
                )}
                Lưu thành phiên bản mới
              </button>
            </div>
          </form>

          {/* Gemini Live Prompt Test Sandbox */}
          <div className="space-y-4 rounded-3xl border border-teal-200 bg-white p-6 shadow-xs">
            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
              <div>
                <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900">
                  <FlaskConical className="h-5 w-5 text-[#0D9488]" />
                  Thử nghiệm Prompt với Gemini AI (Sandbox)
                </h2>
                <p className="text-xs text-slate-600">
                  Chạy thử nội dung prompt hiện tại trên khung soạn thảo để kiểm
                  tra cấu trúc JSON trả về (không lưu DB).
                </p>
              </div>
              <button
                type="button"
                disabled={testing || promptContent.trim().length < 20}
                onClick={handleTestPrompt}
                className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-[#0D9488] px-4 py-2.5 text-sm font-semibold text-white shadow-xs transition hover:bg-[#0F766E] disabled:opacity-60"
              >
                {testing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Play className="h-4 w-4" />
                )}
                {testing
                  ? "Đang gọi Gemini..."
                  : "Thử nghiệm Prompt với Gemini"}
              </button>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-600">
                Dữ liệu sinh viên mẫu (để trống để dùng mẫu sinh viên năm nhất
                onboarding chưa có kỹ năng/thành tích)
              </label>
              <textarea
                rows={4}
                value={sampleInput}
                onChange={(e) => setSampleInput(e.target.value)}
                placeholder="Nhập bối cảnh tùy chỉnh nếu muốn test tình huống cụ thể, hoặc để trống dùng dữ liệu mẫu mặc định..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50/70 p-3 font-mono text-xs text-slate-900 outline-hidden focus:border-[#0D9488] focus:bg-white"
              />
            </div>

            {testResult && (
              <div className="space-y-2 rounded-2xl border border-slate-200 bg-slate-950 p-4 text-slate-100">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2 text-xs">
                  <span className="inline-flex items-center gap-1.5 font-semibold text-emerald-400">
                    <Sparkles className="h-3.5 w-3.5" />
                    Schema JSON hợp lệ · Model: {testResult.modelUsed}
                  </span>
                  <span className="text-slate-400">
                    Thời gian: {testResult.durationMs}ms · Retries:{" "}
                    {testResult.retryCount}
                  </span>
                </div>
                <pre className="max-h-96 overflow-auto font-mono text-xs leading-relaxed text-emerald-100">
                  {JSON.stringify(testResult.output, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

