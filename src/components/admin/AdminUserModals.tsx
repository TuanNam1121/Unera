"use client";

import { useEffect, useState } from "react";
import {
  AlertCircle,
  AlertTriangle,
  Database,
  GraduationCap,
  Loader2,
  Lock,
  ShieldAlert,
  ShieldCheck,
  Trash2,
  Unlock,
  UserPlus,
  X,
} from "lucide-react";
import { fetchWithAuth } from "@/components/providers/AuthProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ACCOUNT_STATUS, USER_ROLES, type AccountStatus, type UserRole } from "@/constants";

export interface AdminUserItem {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: AccountStatus;
  avatar?: string;
  authProviders: string[];
  isProfileCompleted: boolean;
  onboardingStep: string;
  university: string;
  major: string;
  academicYear: string;
  birthYear: number | null;
  lastLoginAt: string | null;
  createdAt: string;
}

export interface UserRelatedDataSummary {
  studentProfiles: number;
  refreshTokens: number;
  passwordResetTokens: number;
  reminderSettings: number;
  assessmentSubmissions: number;
  aiOrientationAnalyses: number;
  roadmaps: number;
  activityFollows: number;
  notifications: number;
  articleLikes: number;
  articleComments: number;
  newsBookmarks: number;
  newsReadingHistories: number;
  toolResults: number;
  bookingRequests: number;
  cmsContentCount: number;
}

interface UserDetailResponse {
  user: AdminUserItem & { updatedAt?: string };
  profile: {
    fullName: string;
    birthYear: number | null;
    university: string;
    major: string;
    academicYear: string;
    bio: string;
    hardSkills: string[];
    softSkills: string[];
    achievements: string[];
  } | null;
  relatedDataSummary: UserRelatedDataSummary;
}

const SUMMARY_LABELS: Array<{ key: keyof UserRelatedDataSummary; label: string }> = [
  { key: "roadmaps", label: "Lộ trình 4 năm" },
  { key: "assessmentSubmissions", label: "Bài khảo sát định hướng" },
  { key: "aiOrientationAnalyses", label: "Phân tích AI Gemini" },
  { key: "toolResults", label: "Kết quả công cụ (MBTI/MI/...)" },
  { key: "activityFollows", label: "Hoạt động đang theo dõi" },
  { key: "articleLikes", label: "Lượt thích bài viết" },
  { key: "articleComments", label: "Bình luận khám phá" },
  { key: "newsBookmarks", label: "Tin tức đã lưu" },
  { key: "newsReadingHistories", label: "Lịch sử đọc tin" },
  { key: "notifications", label: "Thông báo" },
  { key: "refreshTokens", label: "Phiên đăng nhập" },
];

export function CreateUserModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (message: string) => void;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole>(USER_ROLES.STUDENT);
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const res = await fetchWithAuth("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          password,
          role,
          status: ACCOUNT_STATUS.ACTIVE,
          reason: reason.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Không thể tạo tài khoản.");
        return;
      }
      onCreated(data.message || "Đã tạo tài khoản thành công.");
    } catch {
      setError("Lỗi kết nối máy chủ.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
              <UserPlus className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Tạo tài khoản người dùng mới
              </h3>
              <p className="text-xs text-slate-500">
                Cấp tài khoản Sinh viên hoặc Quản trị viên trực tiếp
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700">
              Họ và tên <span className="text-red-500">*</span>
            </label>
            <Input
              required
              minLength={2}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ví dụ: Nguyễn Văn An"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700">
              Email đăng nhập <span className="text-red-500">*</span>
            </label>
            <Input
              required
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@ulis.vnu.edu.vn"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700">
              Mật khẩu khởi tạo (tối thiểu 8 ký tự){" "}
              <span className="text-red-500">*</span>
            </label>
            <Input
              required
              type="password"
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700">
              Vai trò hệ thống <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                {
                  value: USER_ROLES.STUDENT,
                  label: "Sinh viên (STUDENT)",
                  icon: GraduationCap,
                },
                {
                  value: USER_ROLES.ADMIN,
                  label: "Quản trị viên (ADMIN)",
                  icon: ShieldCheck,
                },
              ].map((opt) => {
                const Icon = opt.icon;
                const active = role === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setRole(opt.value)}
                    className={`flex items-center justify-center gap-1.5 rounded-xl border px-3 py-2.5 text-xs font-semibold transition-all cursor-pointer ${
                      active
                        ? "border-blue-600 bg-blue-50 text-blue-700"
                        : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{opt.value}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700">
              Ghi chú tạo tài khoản (tuỳ chọn)
            </label>
            <Input
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Ví dụ: Cấp quyền biên tập viên CMS..."
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 rounded-xl bg-red-50 border border-red-200 p-2.5 text-xs text-red-700">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={submitting}
              className="rounded-xl text-xs"
            >
              Hủy
            </Button>
            <Button
              type="submit"
              disabled={submitting}
              className="rounded-xl text-xs bg-blue-600 hover:bg-blue-700 text-white"
            >
              {submitting ? (
                <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
              ) : null}
              Tạo tài khoản
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function ChangeRoleModal({
  user,
  onClose,
  onUpdated,
}: {
  user: AdminUserItem;
  onClose: () => void;
  onUpdated: (message: string) => void;
}) {
  const targetRole: UserRole =
    user.role === USER_ROLES.ADMIN ? USER_ROLES.STUDENT : USER_ROLES.ADMIN;
  const [selectedRole, setSelectedRole] = useState<UserRole>(targetRole);
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (reason.trim().length < 5) {
      setError("Vui lòng nhập lý do thay đổi vai trò (tối thiểu 5 ký tự).");
      return;
    }
    setError("");
    setSubmitting(true);
    try {
      const res = await fetchWithAuth(`/api/admin/users/${user.id}/role`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: selectedRole, reason: reason.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Không thể thay đổi vai trò.");
        return;
      }
      onUpdated(data.message || "Đã cập nhật vai trò người dùng.");
    } catch {
      setError("Lỗi kết nối máy chủ.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Thay đổi Vai trò Hệ thống
              </h3>
              <p className="text-xs text-slate-500">
                {user.name} ({user.email})
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700">
              Chọn vai trò mới (Hiện tại: {user.role})
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[USER_ROLES.STUDENT, USER_ROLES.ADMIN].map((r) => (
                <button
                  key={r}
                  type="button"
                  disabled={r === user.role}
                  onClick={() => setSelectedRole(r)}
                  className={`rounded-xl border px-3 py-2.5 text-xs font-semibold transition-all ${
                    r === user.role
                      ? "border-slate-100 bg-slate-50 text-slate-400 cursor-not-allowed"
                      : selectedRole === r
                      ? "border-indigo-600 bg-indigo-50 text-indigo-700 cursor-pointer"
                      : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50 cursor-pointer"
                  }`}
                >
                  {r === USER_ROLES.ADMIN ? "Quản trị viên (ADMIN)" : "Sinh viên (STUDENT)"}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-xl bg-amber-50 border border-amber-200 p-3 text-xs text-amber-800 space-y-1">
            <p className="font-semibold flex items-center gap-1.5">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              Lưu ý bảo mật
            </p>
            <p>
              Toàn bộ Refresh Token hiện tại của tài khoản này sẽ bị thu hồi ngay
              sau khi đổi vai trò để cập nhật quyền truy cập mới.
            </p>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700">
              Lý do thay đổi vai trò (bắt buộc){" "}
              <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={3}
              required
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Ví dụ: Cấp quyền quản trị nội dung kỳ tuyển sinh 2026..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50/70 p-3 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 rounded-xl bg-red-50 border border-red-200 p-2.5 text-xs text-red-700">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-1">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={submitting}
              className="rounded-xl text-xs"
            >
              Hủy
            </Button>
            <Button
              type="submit"
              disabled={submitting || selectedRole === user.role}
              className="rounded-xl text-xs bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              {submitting ? (
                <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
              ) : null}
              Xác nhận đổi vai trò
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function ChangeStatusModal({
  user,
  onClose,
  onUpdated,
}: {
  user: AdminUserItem;
  onClose: () => void;
  onUpdated: (message: string) => void;
}) {
  const isLocking = user.status === ACCOUNT_STATUS.ACTIVE;
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleConfirm = async () => {
    if (isLocking && reason.trim().length < 5) {
      setError("Vui lòng nhập lý do khóa tối thiểu 5 ký tự.");
      return;
    }
    setError("");
    setSubmitting(true);
    try {
      const nextStatus = isLocking
        ? ACCOUNT_STATUS.DISABLED
        : ACCOUNT_STATUS.ACTIVE;
      const res = await fetchWithAuth(`/api/admin/users/${user.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus, reason: reason.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Không thể cập nhật trạng thái.");
        return;
      }
      onUpdated(data.message || "Đã cập nhật trạng thái tài khoản.");
    } catch {
      setError("Lỗi kết nối máy chủ.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                isLocking
                  ? "bg-red-100 text-red-600"
                  : "bg-emerald-100 text-emerald-600"
              }`}
            >
              {isLocking ? (
                <ShieldAlert className="h-5 w-5" />
              ) : (
                <Unlock className="h-5 w-5" />
              )}
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                {isLocking
                  ? "Khóa tài khoản người dùng"
                  : "Mở khóa tài khoản người dùng"}
              </h3>
              <p className="text-xs text-slate-500">
                {user.name} ({user.email})
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <p className="text-xs text-slate-600 leading-relaxed">
          {isLocking
            ? "Tài khoản bị khóa sẽ bị thu hồi mọi phiên đăng nhập và không thể truy cập hệ thống cho đến khi được mở khóa lại."
            : "Tài khoản sẽ được kích hoạt trạng thái ACTIVE và có thể đăng nhập lại bình thường."}
        </p>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-700">
            Lý do thực hiện {isLocking ? "(bắt buộc, >= 5 ký tự)" : "(tuỳ chọn)"}
          </label>
          <textarea
            rows={3}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder={
              isLocking
                ? "Nhập lý do vi phạm hoặc yêu cầu tạm khóa..."
                : "Nhập ghi chú mở khóa tài khoản..."
            }
            className="w-full rounded-xl border border-slate-200 bg-slate-50/70 p-3 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
        </div>

        {error && (
          <div className="flex items-center gap-2 rounded-xl bg-red-50 border border-red-200 p-2.5 text-xs text-red-700">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="flex justify-end gap-2 pt-1">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={submitting}
            className="rounded-xl text-xs"
          >
            Hủy
          </Button>
          <Button
            type="button"
            onClick={handleConfirm}
            disabled={submitting}
            className={`rounded-xl text-xs text-white ${
              isLocking
                ? "bg-red-600 hover:bg-red-700"
                : "bg-emerald-600 hover:bg-emerald-700"
            }`}
          >
            {submitting ? (
              <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
            ) : isLocking ? (
              <Lock className="h-3.5 w-3.5 mr-1.5" />
            ) : (
              <Unlock className="h-3.5 w-3.5 mr-1.5" />
            )}
            {isLocking ? "Xác nhận khóa" : "Xác nhận mở khóa"}
          </Button>
        </div>
      </div>
    </div>
  );
}

export function UserDetailModal({
  userId,
  onClose,
}: {
  userId: string;
  onClose: () => void;
}) {
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState<UserDetailResponse | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await fetchWithAuth(`/api/admin/users/${userId}`);
        const data = await res.json();
        if (!active) return;
        if (!res.ok) {
          setError(data.error || "Không thể tải chi tiết người dùng.");
        } else {
          setDetail(data);
        }
      } catch {
        if (active) setError("Lỗi kết nối máy chủ.");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [userId]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
      <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <h3 className="text-base font-bold text-slate-900">
            Hồ sơ chi tiết & Dữ liệu liên kết
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {loading ? (
          <div className="flex h-40 items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
          </div>
        ) : error || !detail ? (
          <div className="rounded-xl bg-red-50 border border-red-200 p-4 text-xs text-red-700">
            {error || "Không có dữ liệu."}
          </div>
        ) : (
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 rounded-xl bg-slate-50 border border-slate-200/80 p-4">
              <div>
                <p className="text-slate-400">Họ tên / Email</p>
                <p className="font-bold text-slate-900 mt-0.5">{detail.user.name}</p>
                <p className="text-slate-600">{detail.user.email}</p>
              </div>
              <div>
                <p className="text-slate-400">Vai trò / Trạng thái</p>
                <p className="font-semibold text-slate-900 mt-0.5">
                  {detail.user.role} · {detail.user.status}
                </p>
                <p className="text-slate-600">
                  Onboarding: {detail.user.onboardingStep} · Phương thức:{" "}
                  {detail.user.authProviders.join(", ")}
                </p>
              </div>
              {detail.profile && (
                <>
                  <div>
                    <p className="text-slate-400">Trường / Ngành</p>
                    <p className="font-medium text-slate-800 mt-0.5">
                      {detail.profile.university || "Chưa cập nhật"}
                    </p>
                    <p className="text-slate-600">
                      {detail.profile.major || "Chưa cập nhật"}
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-400">Năm học / Năm sinh</p>
                    <p className="font-medium text-slate-800 mt-0.5">
                      {detail.profile.academicYear || "Chưa cập nhật"} ·{" "}
                      {detail.profile.birthYear || "—"}
                    </p>
                  </div>
                </>
              )}
            </div>

            <div>
              <p className="font-semibold text-slate-800 mb-2 flex items-center gap-1.5">
                <Database className="h-4 w-4 text-blue-600" />
                Thống kê bản ghi gắn với tài khoản
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {SUMMARY_LABELS.map((item) => (
                  <div
                    key={item.key}
                    className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2"
                  >
                    <span className="text-slate-600">{item.label}</span>
                    <span className="font-bold text-slate-900">
                      {detail.relatedDataSummary[item.key]}
                    </span>
                  </div>
                ))}
                <div className="flex items-center justify-between rounded-lg border border-indigo-200 bg-indigo-50/60 px-3 py-2">
                  <span className="text-indigo-700 font-medium">
                    Nội dung CMS đã tạo
                  </span>
                  <span className="font-bold text-indigo-800">
                    {detail.relatedDataSummary.cmsContentCount}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export function DeleteUserDangerModal({
  user,
  onClose,
  onDeleted,
}: {
  user: AdminUserItem;
  onClose: () => void;
  onDeleted: (message: string) => void;
}) {
  const [summary, setSummary] = useState<UserRelatedDataSummary | null>(null);
  const [loadingSummary, setLoadingSummary] = useState(true);
  const [confirmEmail, setConfirmEmail] = useState("");
  const [reason, setReason] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await fetchWithAuth(`/api/admin/users/${user.id}`);
        const data = await res.json();
        if (active && res.ok && data.relatedDataSummary) {
          setSummary(data.relatedDataSummary);
        }
      } catch {
        // Bỏ qua lỗi phụ khi tải trước bản tóm tắt
      } finally {
        if (active) setLoadingSummary(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [user.id]);

  const emailMatches =
    confirmEmail.trim().toLowerCase() === user.email.trim().toLowerCase();

  const handleDelete = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailMatches) {
      setError("Vui lòng nhập chính xác email của tài khoản cần xóa.");
      return;
    }
    if (reason.trim().length < 5) {
      setError("Vui lòng nhập lý do xóa tài khoản (tối thiểu 5 ký tự).");
      return;
    }
    setError("");
    setDeleting(true);
    try {
      const res = await fetchWithAuth(`/api/admin/users/${user.id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          confirmEmail: confirmEmail.trim(),
          reason: reason.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Không thể xóa vĩnh viễn tài khoản.");
        return;
      }
      onDeleted(data.message || "Đã xóa vĩnh viễn tài khoản và toàn bộ dữ liệu liên quan.");
    } catch {
      setError("Lỗi kết nối máy chủ.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl space-y-4 border border-red-200">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-100 text-red-600 shrink-0">
              <Trash2 className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-red-700">
                Xóa vĩnh viễn tài khoản (Không thể hoàn tác)
              </h3>
              <p className="text-xs text-slate-600">
                {user.name} · <span className="font-mono">{user.email}</span> ({user.role})
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="rounded-xl bg-red-50 border border-red-200 p-3.5 text-xs text-red-800 space-y-2">
          <p className="font-semibold flex items-center gap-1.5">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            Hành động này sẽ xóa sạch 100% dữ liệu cá nhân của tài khoản:
          </p>
          {loadingSummary ? (
            <div className="flex items-center gap-2 text-red-600">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              <span>Đang thống kê dữ liệu liên quan...</span>
            </div>
          ) : summary ? (
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[11px]">
              {SUMMARY_LABELS.map((item) => (
                <div key={item.key} className="flex justify-between">
                  <span>• {item.label}:</span>
                  <span className="font-bold">{summary[item.key]}</span>
                </div>
              ))}
            </div>
          ) : null}
          <p className="text-[11px] text-red-700 pt-1 border-t border-red-200/70">
            Lưu ý: Nếu tài khoản này từng tạo bài viết Tin tức / Khám phá / Hoạt động
            CMS chung, nội dung cộng đồng sẽ được giữ lại ở trạng thái ẩn danh tác
            giả và nhật ký AuditLog cũ được ẩn danh.
          </p>
        </div>

        <form onSubmit={handleDelete} className="space-y-3">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700">
              Nhập lại email{" "}
              <span className="font-mono text-red-600">{user.email}</span> để xác
              nhận <span className="text-red-500">*</span>
            </label>
            <Input
              required
              type="email"
              value={confirmEmail}
              onChange={(e) => setConfirmEmail(e.target.value)}
              placeholder={user.email}
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700">
              Lý do xóa vĩnh viễn (tối thiểu 5 ký tự){" "}
              <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={2}
              required
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Ví dụ: Yêu cầu xóa dữ liệu cá nhân / Tài khoản trùng lặp..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50/70 p-2.5 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 rounded-xl bg-red-50 border border-red-200 p-2.5 text-xs text-red-700">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-1">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={deleting}
              className="rounded-xl text-xs"
            >
              Hủy
            </Button>
            <Button
              type="submit"
              disabled={deleting || !emailMatches || reason.trim().length < 5}
              className="rounded-xl text-xs bg-red-600 hover:bg-red-700 text-white disabled:opacity-50"
            >
              {deleting ? (
                <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
              ) : (
                <Trash2 className="h-3.5 w-3.5 mr-1.5" />
              )}
              Xóa vĩnh viễn tài khoản
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

