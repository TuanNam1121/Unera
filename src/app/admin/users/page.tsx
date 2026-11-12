"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Eye,
  GraduationCap,
  Loader2,
  Lock,
  Search,
  ShieldCheck,
  Trash2,
  Unlock,
  UserCog,
  UserPlus,
  Users,
} from "lucide-react";
import {
  AdminUserItem,
  ChangeRoleModal,
  ChangeStatusModal,
  CreateUserModal,
  DeleteUserDangerModal,
  UserDetailModal,
} from "@/components/admin/AdminUserModals";
import { fetchWithAuth, useAuth } from "@/components/providers/AuthProvider";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ACCOUNT_STATUS, USER_ROLES } from "@/constants";

interface UserSummary {
  totalUsers: number;
  totalStudents: number;
  totalAdmins: number;
  activeUsers: number;
  disabledUsers: number;
}

function AdminUsersContent({
  initialRole,
  initialStatus,
}: {
  initialRole: string;
  initialStatus: string;
}) {
  const { user: currentUser } = useAuth();

  const [users, setUsers] = useState<AdminUserItem[]>([]);
  const [summary, setSummary] = useState<UserSummary>({
    totalUsers: 0,
    totalStudents: 0,
    totalAdmins: 0,
    activeUsers: 0,
    disabledUsers: 0,
  });
  const [loading, setLoading] = useState(true);

  const [searchInput, setSearchInput] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState(initialRole);
  const [statusFilter, setStatusFilter] = useState(initialStatus);
  const [providerFilter, setProviderFilter] = useState("ALL");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [reloadTick, setReloadTick] = useState(0);

  const [feedbackMsg, setFeedbackMsg] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [detailUserId, setDetailUserId] = useState<string | null>(null);
  const [roleModalUser, setRoleModalUser] = useState<AdminUserItem | null>(null);
  const [statusModalUser, setStatusModalUser] = useState<AdminUserItem | null>(
    null
  );
  const [deleteModalUser, setDeleteModalUser] = useState<AdminUserItem | null>(
    null
  );

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const params = new URLSearchParams({
          page: page.toString(),
          limit: "12",
          role: roleFilter,
          status: statusFilter,
          authProvider: providerFilter,
          search: appliedSearch,
        });
        const res = await fetchWithAuth(`/api/admin/users?${params.toString()}`);
        if (!res.ok) return;
        const data = await res.json();
        if (!active) return;
        setUsers(data.users || []);
        if (data.summary) setSummary(data.summary);
        setTotalPages(data.pagination?.totalPages || 1);
        setTotalCount(data.pagination?.total || 0);
      } catch (err) {
        console.error("Lỗi tải danh sách người dùng:", err);
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [page, roleFilter, statusFilter, providerFilter, appliedSearch, reloadTick]);

  const triggerReload = (message?: string) => {
    if (message) {
      setFeedbackMsg(message);
      setTimeout(() => setFeedbackMsg(""), 5000);
    }
    setLoading(true);
    setReloadTick((t) => t + 1);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setPage(1);
    setAppliedSearch(searchInput.trim());
  };

  return (
    <div className="w-full space-y-6 px-6 sm:px-8 py-6 max-w-7xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <Users className="h-6 w-6 text-blue-600" />
            <span>Quản Lý Người Dùng & Phân Quyền ({totalCount})</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Quản trị toàn bộ tài khoản Sinh viên & Quản trị viên, phân quyền vai
            trò, khóa/mở khóa và xóa vĩnh viễn dữ liệu người dùng.
          </p>
        </div>

        <Button
          type="button"
          onClick={() => setCreateOpen(true)}
          className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs self-start sm:self-auto"
        >
          <UserPlus className="h-4 w-4 mr-1.5" />
          Tạo tài khoản mới
        </Button>
      </div>

      {/* Feedback Banner */}
      {feedbackMsg && (
        <div className="flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-xs sm:text-sm text-emerald-700">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
          <span>{feedbackMsg}</span>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="rounded-2xl border-slate-200/80 shadow-xs bg-white">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                Tổng người dùng
              </p>
              <p className="text-2xl font-bold text-slate-900 mt-1">
                {summary.totalUsers}
              </p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <Users className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-slate-200/80 shadow-xs bg-white">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                Sinh viên (STUDENT)
              </p>
              <p className="text-2xl font-bold text-slate-900 mt-1">
                {summary.totalStudents}
              </p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-50 text-sky-600">
              <GraduationCap className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-slate-200/80 shadow-xs bg-white">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                Quản trị viên (ADMIN)
              </p>
              <p className="text-2xl font-bold text-indigo-700 mt-1">
                {summary.totalAdmins}
              </p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
              <ShieldCheck className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-slate-200/80 shadow-xs bg-white">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                Tài khoản bị khóa
              </p>
              <p className="text-2xl font-bold text-red-600 mt-1">
                {summary.disabledUsers}
              </p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 text-red-600">
              <Lock className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters & Search */}
      <Card className="rounded-2xl border-slate-200/80 shadow-xs bg-white">
        <CardHeader className="pb-3 border-b border-slate-100">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            <div>
              <CardTitle className="text-base font-bold text-slate-900">
                Danh sách tài khoản hệ thống
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">
                Chỉ Admin mới có quyền đổi vai trò, khóa hoặc xóa vĩnh viễn dữ liệu
                người dùng
              </CardDescription>
            </div>

            <form
              onSubmit={handleSearchSubmit}
              className="flex items-center gap-2 w-full lg:w-auto"
            >
              <div className="relative flex-1 lg:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Tìm theo tên hoặc email..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="pl-9 h-9 text-xs rounded-xl bg-slate-50"
                />
              </div>
              <Button
                type="submit"
                size="sm"
                className="h-9 rounded-xl text-xs bg-slate-800 hover:bg-slate-900 text-white"
              >
                Tìm
              </Button>
            </form>
          </div>

          {/* Filter Pills */}
          <div className="flex flex-wrap items-center gap-3 pt-3">
            <div className="flex items-center gap-1 rounded-xl bg-slate-100 p-1">
              {[
                { key: "ALL", label: "Mọi vai trò" },
                { key: USER_ROLES.STUDENT, label: "STUDENT" },
                { key: USER_ROLES.ADMIN, label: "ADMIN" },
              ].map((opt) => (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => {
                    setLoading(true);
                    setRoleFilter(opt.key);
                    setPage(1);
                  }}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                    roleFilter === opt.key
                      ? "bg-white text-slate-900 shadow-2xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-1 rounded-xl bg-slate-100 p-1">
              {[
                { key: "ALL", label: "Mọi trạng thái" },
                { key: ACCOUNT_STATUS.ACTIVE, label: "Hoạt động" },
                { key: ACCOUNT_STATUS.DISABLED, label: "Đã khóa" },
              ].map((opt) => (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => {
                    setLoading(true);
                    setStatusFilter(opt.key);
                    setPage(1);
                  }}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                    statusFilter === opt.key
                      ? "bg-white text-slate-900 shadow-2xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            <select
              value={providerFilter}
              onChange={(e) => {
                setLoading(true);
                setProviderFilter(e.target.value);
                setPage(1);
              }}
              aria-label="Lọc theo phương thức đăng nhập"
              className="h-9 rounded-xl border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="ALL">Nguồn: Tất cả</option>
              <option value="CREDENTIALS">Email / Mật khẩu</option>
              <option value="GOOGLE">Google OAuth</option>
            </select>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {loading ? (
            <div className="flex h-64 items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
          ) : users.length === 0 ? (
            <div className="p-12 text-center text-xs sm:text-sm text-slate-400 italic">
              Không tìm thấy tài khoản nào phù hợp với bộ lọc hiện tại.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200/80 text-slate-500 font-semibold uppercase text-[11px] tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Người dùng</th>
                    <th className="py-3 px-4">Vai trò & Trạng thái</th>
                    <th className="py-3 px-4">Hồ sơ / Trường ngành</th>
                    <th className="py-3 px-4">Đăng nhập / Onboarding</th>
                    <th className="py-3 px-4 text-right">Thao tác quản trị</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {users.map((item) => {
                    const isSelf = currentUser?.id === item.id;
                    const isAdminRole = item.role === USER_ROLES.ADMIN;
                    return (
                      <tr
                        key={item.id}
                        className="hover:bg-slate-50/70 transition-colors"
                      >
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <div
                              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full font-bold text-xs ${
                                isAdminRole
                                  ? "bg-indigo-100 text-indigo-700"
                                  : "bg-blue-100 text-blue-700"
                              }`}
                            >
                              {item.name ? item.name.charAt(0).toUpperCase() : "U"}
                            </div>
                            <div>
                              <div className="flex items-center gap-1.5">
                                <p className="font-semibold text-slate-900">
                                  {item.name}
                                </p>
                                {isSelf && (
                                  <span className="px-1.5 py-0.5 rounded bg-slate-900 text-white text-[9px] font-bold">
                                    Bạn
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] text-slate-500">
                                {item.email}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                                isAdminRole
                                  ? "bg-indigo-50 text-indigo-700 border-indigo-200"
                                  : "bg-sky-50 text-sky-700 border-sky-200"
                              }`}
                            >
                              {isAdminRole ? (
                                <ShieldCheck className="h-3 w-3" />
                              ) : (
                                <GraduationCap className="h-3 w-3" />
                              )}
                              {item.role}
                            </span>

                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                                item.status === ACCOUNT_STATUS.ACTIVE
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                  : "bg-red-50 text-red-700 border-red-200"
                              }`}
                            >
                              {item.status === ACCOUNT_STATUS.ACTIVE
                                ? "Hoạt động"
                                : "Đã khóa"}
                            </span>
                          </div>
                        </td>

                        <td className="py-3.5 px-4 max-w-xs">
                          {item.university || item.major ? (
                            <div className="space-y-0.5">
                              <p className="font-medium text-slate-800 truncate">
                                {item.university || "Chưa chọn trường"}
                              </p>
                              <p className="text-[11px] text-slate-500 truncate">
                                {item.major || "Chưa có ngành"}{" "}
                                {item.academicYear ? `· ${item.academicYear}` : ""}
                              </p>
                            </div>
                          ) : (
                            <span className="text-[11px] text-slate-400 italic">
                              {isAdminRole ? "Tài khoản quản trị" : "Chưa cập nhật hồ sơ"}
                            </span>
                          )}
                        </td>

                        <td className="py-3.5 px-4 text-[11px] text-slate-500">
                          <p className="font-medium text-slate-700">
                            {item.authProviders.join(" + ")} · {item.onboardingStep}
                          </p>
                          <p>
                            Tham gia:{" "}
                            {new Date(item.createdAt).toLocaleDateString("vi-VN")}
                          </p>
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <div className="inline-flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => setDetailUserId(item.id)}
                              title="Xem chi tiết & thống kê dữ liệu"
                              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 px-2.5 py-1.5 text-[11px] font-semibold text-slate-700 cursor-pointer"
                            >
                              <Eye className="h-3.5 w-3.5 text-slate-500" />
                              <span className="hidden xl:inline">Chi tiết</span>
                            </button>

                            <button
                              type="button"
                              disabled={isSelf}
                              onClick={() => setRoleModalUser(item)}
                              title={
                                isSelf
                                  ? "Không thể tự đổi vai trò chính mình"
                                  : "Chuyển đổi vai trò STUDENT / ADMIN"
                              }
                              className="inline-flex items-center gap-1 rounded-lg border border-indigo-200 bg-indigo-50/70 hover:bg-indigo-100/80 px-2.5 py-1.5 text-[11px] font-semibold text-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                            >
                              <UserCog className="h-3.5 w-3.5" />
                              <span className="hidden xl:inline">Đổi Role</span>
                            </button>

                            <button
                              type="button"
                              disabled={isSelf}
                              onClick={() => setStatusModalUser(item)}
                              title={
                                isSelf
                                  ? "Không thể tự khóa chính mình"
                                  : item.status === ACCOUNT_STATUS.ACTIVE
                                  ? "Khóa tài khoản"
                                  : "Mở khóa tài khoản"
                              }
                              className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[11px] font-semibold disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer ${
                                item.status === ACCOUNT_STATUS.ACTIVE
                                  ? "bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100"
                                  : "bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100"
                              }`}
                            >
                              {item.status === ACCOUNT_STATUS.ACTIVE ? (
                                <>
                                  <Lock className="h-3.5 w-3.5" />
                                  <span className="hidden xl:inline">Khóa</span>
                                </>
                              ) : (
                                <>
                                  <Unlock className="h-3.5 w-3.5" />
                                  <span className="hidden xl:inline">Mở khóa</span>
                                </>
                              )}
                            </button>

                            <button
                              type="button"
                              disabled={isSelf}
                              onClick={() => setDeleteModalUser(item)}
                              title={
                                isSelf
                                  ? "Không thể tự xóa chính mình"
                                  : "Xóa vĩnh viễn tài khoản & toàn bộ dữ liệu liên quan"
                              }
                              className="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-red-50 hover:bg-red-100 px-2.5 py-1.5 text-[11px] font-semibold text-red-700 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              <span className="hidden xl:inline">Xóa</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3 bg-slate-50/50">
              <span className="text-xs text-slate-500">
                Trang {page} / {totalPages}
              </span>
              <div className="flex items-center gap-1.5">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => {
                    setLoading(true);
                    setPage((p) => Math.max(1, p - 1));
                  }}
                  className="h-8 rounded-lg text-xs"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => {
                    setLoading(true);
                    setPage((p) => Math.min(totalPages, p + 1));
                  }}
                  className="h-8 rounded-lg text-xs"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {createOpen && (
        <CreateUserModal
          onClose={() => setCreateOpen(false)}
          onCreated={(msg) => {
            setCreateOpen(false);
            triggerReload(msg);
          }}
        />
      )}

      {detailUserId && (
        <UserDetailModal
          userId={detailUserId}
          onClose={() => setDetailUserId(null)}
        />
      )}

      {roleModalUser && (
        <ChangeRoleModal
          key={roleModalUser.id}
          user={roleModalUser}
          onClose={() => setRoleModalUser(null)}
          onUpdated={(msg) => {
            setRoleModalUser(null);
            triggerReload(msg);
          }}
        />
      )}

      {statusModalUser && (
        <ChangeStatusModal
          key={statusModalUser.id}
          user={statusModalUser}
          onClose={() => setStatusModalUser(null)}
          onUpdated={(msg) => {
            setStatusModalUser(null);
            triggerReload(msg);
          }}
        />
      )}

      {deleteModalUser && (
        <DeleteUserDangerModal
          key={deleteModalUser.id}
          user={deleteModalUser}
          onClose={() => setDeleteModalUser(null)}
          onDeleted={(msg) => {
            setDeleteModalUser(null);
            triggerReload(msg);
          }}
        />
      )}
    </div>
  );
}

function AdminUsersSearchWrapper() {
  const searchParams = useSearchParams();
  const roleParam = searchParams.get("role") || "ALL";
  const statusParam = searchParams.get("status") || "ALL";

  return (
    <AdminUsersContent
      key={`${roleParam}:${statusParam}`}
      initialRole={roleParam}
      initialStatus={statusParam}
    />
  );
}

export default function AdminUsersPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[60vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      }
    >
      <AdminUsersSearchWrapper />
    </Suspense>
  );
}

