"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Bell,
  BellRing,
  Calendar,
  CheckCircle2,
  Clock,
  Loader2,
  LogIn,
  Mail,
  Save,
  Smartphone,
} from "lucide-react";
import { useAuth } from "@/components/providers/AuthProvider";
import { Button, buttonVariants } from "@/components/ui/button";
import { DEFAULT_REMINDER_SETTING } from "@/constants";
import type { IReminderSettingDTO } from "@/types";

const OFFSET_OPTIONS = [
  {
    days: 30,
    title: "Trước 1 tháng (30 ngày)",
    description:
      "Nhận thông báo sớm để chuẩn bị hồ sơ, minh chứng, thư giới thiệu hoặc bài luận.",
  },
  {
    days: 7,
    title: "Trước 1 tuần (7 ngày)",
    description:
      "Nhắc rà soát lần cuối trước khi hết hạn nộp đơn hoặc trước tuần diễn ra sự kiện.",
  },
  {
    days: 1,
    title: "Trước 1 ngày (Ngày mai)",
    description:
      "Cảnh báo khẩn vào ngày trước hạn chót hoặc trước ngày sự kiện bắt đầu.",
  },
] as const;

function ReminderSettingsContent() {
  const { user, loading: authLoading } = useAuth();

  const [enableReminders, setEnableReminders] = useState<boolean>(
    DEFAULT_REMINDER_SETTING.enableReminders
  );
  const [enableDeadlineReminder, setEnableDeadlineReminder] = useState<boolean>(
    DEFAULT_REMINDER_SETTING.enableDeadlineReminder
  );
  const [enableEventReminder, setEnableEventReminder] = useState<boolean>(
    DEFAULT_REMINDER_SETTING.enableEventReminder
  );
  const [offsetsDays, setOffsetsDays] = useState<number[]>([
    ...DEFAULT_REMINDER_SETTING.offsetsDays,
  ]);
  const [channelInApp, setChannelInApp] = useState<boolean>(
    DEFAULT_REMINDER_SETTING.channels.inApp
  );
  const [channelEmail, setChannelEmail] = useState<boolean>(
    DEFAULT_REMINDER_SETTING.channels.email
  );

  const [loadedUserId, setLoadedUserId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const loadingSettings = Boolean(user) && loadedUserId !== user?.id;

  useEffect(() => {
    if (!user) return;
    let cancelled = false;

    async function loadSettings() {
      try {
        const res = await fetch("/api/notifications/settings", {
          cache: "no-store",
        });
        if (!res.ok) return;
        const data = await res.json();
        const setting: IReminderSettingDTO | undefined = data.setting;
        if (!cancelled && setting) {
          setEnableReminders(Boolean(setting.enableReminders));
          setEnableDeadlineReminder(Boolean(setting.enableDeadlineReminder));
          setEnableEventReminder(Boolean(setting.enableEventReminder));
          setOffsetsDays(
            Array.isArray(setting.offsetsDays)
              ? setting.offsetsDays
              : [...DEFAULT_REMINDER_SETTING.offsetsDays]
          );
          setChannelInApp(setting.channels?.inApp ?? true);
          setChannelEmail(setting.channels?.email ?? true);
        }
      } finally {
        if (!cancelled && user) {
          setLoadedUserId(user.id);
        }
      }
    }

    loadSettings();
    return () => {
      cancelled = true;
    };
  }, [user]);

  const handleToggleOffset = (days: number) => {
    setStatusMessage(null);
    setOffsetsDays((prev) =>
      prev.includes(days)
        ? prev.filter((d) => d !== days)
        : [...prev, days].sort((a, b) => b - a)
    );
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || saving) return;
    setSaving(true);
    setStatusMessage(null);

    try {
      const res = await fetch("/api/notifications/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          enableReminders,
          enableDeadlineReminder,
          enableEventReminder,
          offsetsDays,
          channels: {
            inApp: channelInApp,
            email: channelEmail,
          },
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setStatusMessage({
          type: "error",
          text: data.error || "Không thể lưu cấu hình nhắc nhở",
        });
        return;
      }
      setStatusMessage({
        type: "success",
        text: data.message || "Đã lưu cấu hình thông báo nhắc nhở",
      });
    } catch {
      setStatusMessage({
        type: "error",
        text: "Đã xảy ra lỗi kết nối khi lưu cài đặt",
      });
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || loadingSettings) {
    return (
      <div className="flex min-h-[360px] items-center justify-center gap-2 text-sm text-slate-500">
        <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
        <span>Đang tải cài đặt nhắc nhở...</span>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-xl py-14 px-4 text-center space-y-4">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
          <BellRing className="h-7 w-7" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">
          Cài đặt Thông báo &amp; Nhắc nhở
        </h2>
        <p className="text-sm text-slate-600">
          Vui lòng đăng nhập để tùy chỉnh mốc thời gian và kênh nhận thông báo nhắc hạn nộp, sự kiện.
        </p>
        <Link
          href="/login?redirect=/notifications/settings"
          className={buttonVariants({
            className: "rounded-xl bg-blue-600 hover:bg-blue-700 text-white gap-2",
          })}
        >
          <LogIn className="h-4 w-4" />
          <span>Đăng nhập ngay</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      <div className="flex items-center justify-between gap-3">
        <Link
          href="/notifications"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-blue-600 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Quay lại Trung tâm Thông báo</span>
        </Link>
      </div>

      <form onSubmit={handleSave} className="space-y-5">
        {/* Header & Master Switch */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-2xs space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <Bell className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-base sm:text-lg font-bold text-slate-900">
                  Cài đặt Nhắc nhở Tự động
                </h1>
                <p className="text-xs text-slate-500 mt-0.5">
                  Tùy chỉnh cách UNERA nhắc bạn về hạn nộp hồ sơ và lịch sự kiện cho các hoạt động bạn đã nhấn Quan tâm.
                </p>
              </div>
            </div>

            <label className="inline-flex items-center gap-2 cursor-pointer shrink-0">
              <input
                type="checkbox"
                checked={enableReminders}
                onChange={(e) => {
                  setEnableReminders(e.target.checked);
                  setStatusMessage(null);
                }}
                className="h-5 w-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-xs font-bold text-slate-800">
                {enableReminders ? "Đang bật" : "Đã tắt"}
              </span>
            </label>
          </div>
        </div>

        {/* Dependent Settings Panel */}
        <div
          className={`space-y-5 transition-opacity ${
            enableReminders ? "opacity-100" : "opacity-55 pointer-events-none"
          }`}
        >
          {/* Reminder Categories */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-2xs space-y-4">
            <h2 className="text-sm font-bold text-slate-900">
              1. Loại sự kiện muốn nhận nhắc nhở
            </h2>

            <div className="divide-y divide-slate-100">
              <label className="flex items-center justify-between gap-4 py-3 first:pt-0 cursor-pointer">
                <div className="flex items-start gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-rose-50 text-rose-600">
                    <Clock className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-900">
                      Nhắc trước Hạn chót nộp hồ sơ (Deadline)
                    </p>
                    <p className="text-[11px] text-slate-500">
                      Cảnh báo khi học bổng, cuộc thi hoặc chương trình sắp đóng đơn đăng ký.
                    </p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={enableDeadlineReminder}
                  onChange={(e) => {
                    setEnableDeadlineReminder(e.target.checked);
                    setStatusMessage(null);
                  }}
                  className="h-4 w-4 rounded border-slate-300 text-blue-600"
                />
              </label>

              <label className="flex items-center justify-between gap-4 pt-3 cursor-pointer">
                <div className="flex items-start gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                    <Calendar className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-900">
                      Nhắc trước Ngày diễn ra sự kiện (Event)
                    </p>
                    <p className="text-[11px] text-slate-500">
                      Gửi thông báo nhắc lịch kèm giờ bắt đầu và địa điểm tổ chức sự kiện.
                    </p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={enableEventReminder}
                  onChange={(e) => {
                    setEnableEventReminder(e.target.checked);
                    setStatusMessage(null);
                  }}
                  className="h-4 w-4 rounded border-slate-300 text-blue-600"
                />
              </label>
            </div>
          </div>

          {/* Offset Days */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-2xs space-y-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                2. Các mốc thời gian nhắc hẹn
              </h2>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Chọn các mốc đếm ngược (theo ngày tại Việt Nam UTC+7) bạn muốn nhận thông báo.
              </p>
            </div>

            <div className="space-y-2.5">
              {OFFSET_OPTIONS.map((opt) => {
                const checked = offsetsDays.includes(opt.days);
                return (
                  <label
                    key={opt.days}
                    className={`flex items-start gap-3 rounded-xl border p-3.5 transition-colors cursor-pointer ${
                      checked
                        ? "border-blue-200 bg-blue-50/50"
                        : "border-slate-200 bg-white hover:bg-slate-50"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => handleToggleOffset(opt.days)}
                      className="mt-0.5 h-4 w-4 rounded border-slate-300 text-blue-600"
                    />
                    <div>
                      <p className="text-xs font-bold text-slate-900">
                        {opt.title}
                      </p>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {opt.description}
                      </p>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Channels */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-2xs space-y-4">
            <h2 className="text-sm font-bold text-slate-900">
              3. Kênh nhận thông báo
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label
                className={`flex items-start gap-3 rounded-xl border p-3.5 cursor-pointer transition-colors ${
                  channelInApp
                    ? "border-blue-200 bg-blue-50/50"
                    : "border-slate-200 bg-white"
                }`}
              >
                <input
                  type="checkbox"
                  checked={channelInApp}
                  onChange={(e) => {
                    setChannelInApp(e.target.checked);
                    setStatusMessage(null);
                  }}
                  className="mt-0.5 h-4 w-4 rounded border-slate-300 text-blue-600"
                />
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
                    <Smartphone className="h-3.5 w-3.5 text-blue-600" />
                    <span>Trong ứng dụng UNERA</span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Hiển thị trên Chuông thông báo &amp; Trung tâm Thông báo.
                  </p>
                </div>
              </label>

              <label
                className={`flex items-start gap-3 rounded-xl border p-3.5 cursor-pointer transition-colors ${
                  channelEmail
                    ? "border-blue-200 bg-blue-50/50"
                    : "border-slate-200 bg-white"
                }`}
              >
                <input
                  type="checkbox"
                  checked={channelEmail}
                  onChange={(e) => {
                    setChannelEmail(e.target.checked);
                    setStatusMessage(null);
                  }}
                  className="mt-0.5 h-4 w-4 rounded border-slate-300 text-blue-600"
                />
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
                    <Mail className="h-3.5 w-3.5 text-indigo-600" />
                    <span>Qua Email ({user.email})</span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Gửi email nhắc lịch tự động tới địa chỉ đã đăng ký.
                  </p>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* Status Message & Submit */}
        {statusMessage && (
          <div
            className={`flex items-center gap-2 rounded-xl border px-4 py-3 text-xs font-medium ${
              statusMessage.type === "success"
                ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                : "border-red-200 bg-red-50 text-red-700"
            }`}
          >
            {statusMessage.type === "success" && (
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
            )}
            <span>{statusMessage.text}</span>
          </div>
        )}

        <div className="flex items-center justify-end gap-3">
          <Link
            href="/notifications"
            className={buttonVariants({
              variant: "outline",
              className: "rounded-xl text-xs",
            })}
          >
            Hủy
          </Link>
          <Button
            type="submit"
            disabled={saving}
            className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs gap-1.5 cursor-pointer"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            <span>Lưu cài đặt</span>
          </Button>
        </div>
      </form>
    </div>
  );
}

export default function NotificationSettingsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[360px] items-center justify-center gap-2 text-sm text-slate-500">
          <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
          <span>Đang tải cài đặt nhắc nhở...</span>
        </div>
      }
    >
      <ReminderSettingsContent />
    </Suspense>
  );
}

