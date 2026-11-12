"use client";

import React, { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Eye,
  Filter,
  Globe,
  Laptop,
  RefreshCw,
  Search,
  ShieldAlert,
  UserCheck,
  X,
  XCircle,
} from "lucide-react";

interface UserActivityLogItem {
  _id: string;
  actorId?: string | null;
  actorEmail?: string;
  actorName?: string;
  actorRole: "GUEST" | "STUDENT" | "MENTOR" | "ADMIN";
  category: string;
  action: string;
  description: string;
  status: "SUCCESS" | "FAILED" | "BLOCKED";
  severity: "INFO" | "WARN" | "HIGH";
  statusCode?: number;
  errorMessage?: string;
  ipAddress: string;
  geo?: {
    country?: string;
    city?: string;
  };
  userAgent?: string;
  deviceSummary?: string;
  requestPath: string;
  httpMethod: string;
  targetCollection?: string;
  targetId?: string;
  targetTitle?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

interface Summary24h {
  total24h: number;
  failedCount24h: number;
  blockedCount24h: number;
  uniqueIps24h: number;
}

const CATEGORY_LABELS: Record<string, string> = {
  AUTH: "Xác thực (Auth)",
  PROFILE: "Hồ sơ",
  ASSESSMENT: "Đánh giá / Quiz",
  AI: "AI & Lộ trình",
  CV: "Hồ sơ CV",
  ACTIVITY: "Hoạt động SV",
  MENTOR: "Cố vấn",
  SYSTEM: "Hệ thống",
};

const STATUS_BADGES: Record<
  UserActivityLogItem["status"],
  { label: string; className: string }
> = {
  SUCCESS: {
    label: "Thành công",
    className: "bg-emerald-100 text-emerald-700",
  },
  FAILED: {
    label: "Thất bại",
    className: "bg-amber-100 text-amber-800",
  },
  BLOCKED: {
    label: "Bị chặn",
    className: "bg-rose-100 text-rose-700",
  },
};

const ROLE_BADGES: Record<string, string> = {
  ADMIN: "bg-purple-100 text-purple-700",
  MENTOR: "bg-indigo-100 text-indigo-700",
  STUDENT: "bg-blue-100 text-blue-700",
  GUEST: "bg-slate-100 text-slate-600",
};

export default function AdminUserLogsPage() {
  const [logs, setLogs] = useState<UserActivityLogItem[]>([]);
  const [summary24h, setSummary24h] = useState<Summary24h>({
    total24h: 0,
    failedCount24h: 0,
    blockedCount24h: 0,
    uniqueIps24h: 0,
  });
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [severityFilter, setSeverityFilter] = useState("");

  const [refreshNonce, setRefreshNonce] = useState(0);
  const [selectedLog, setSelectedLog] = useState<UserActivityLogItem | null>(
    null
  );

  useEffect(() => {
    let cancelled = false;

    async function loadLogs() {
      try {
        const params = new URLSearchParams({
          page: String(page),
          limit: "25",
        });
        if (search) params.set("search", search);
        if (categoryFilter) params.set("category", categoryFilter);
        if (statusFilter) params.set("status", statusFilter);
        if (roleFilter) params.set("actorRole", roleFilter);
        if (severityFilter) params.set("severity", severityFilter);

        const res = await fetch(`/api/admin/user-activity-logs?${params}`);
        const data = await res.json();
        if (cancelled) return;
        if (data.success) {
          setLogs(data.items || []);
          setTotalPages(data.pagination?.totalPages || 1);
          setTotal(data.pagination?.total || 0);
          if (data.summary24h) {
            setSummary24h(data.summary24h);
          }
        }
      } catch (error) {
        if (!cancelled) {
          console.error("Failed to load user activity logs:", error);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadLogs();
    return () => {
      cancelled = true;
    };
  }, [
    page,
    search,
    categoryFilter,
    statusFilter,
    roleFilter,
    severityFilter,
    refreshNonce,
  ]);

  const handleRefresh = () => {
    setLoading(true);
    setRefreshNonce((n) => n + 1);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setPage(1);
    setSearch(searchInput.trim());
  };

  const handleResetFilters = () => {
    setLoading(true);
    setSearchInput("");
    setSearch("");
    setCategoryFilter("");
    setStatusFilter("");
    setRoleFilter("");
    setSeverityFilter("");
    setPage(1);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Activity className="w-6 h-6 text-blue-600" />
            Hoạt động Người dùng & Địa chỉ IP
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            FR-ADM-21 — Nhật ký độc lập theo dõi truy cập, địa chỉ IP, thiết bị và
            hành vi người dùng hệ thống (tự động lưu 180 ngày).
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          className="self-start sm:self-auto"
        >
          <RefreshCw
            className={`w-4 h-4 mr-1.5 ${loading ? "animate-spin" : ""}`}
          />
          Làm mới
        </Button>
      </div>

      {/* 24h KPI Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-slate-200">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500">Sự kiện 24h</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">
                {summary24h.total24h}
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <UserCheck className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500">IP duy nhất (24h)</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">
                {summary24h.uniqueIps24h}
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Globe className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500">Thất bại (24h)</p>
              <p className="text-2xl font-bold text-amber-600 mt-1">
                {summary24h.failedCount24h}
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500">Bị chặn / Rate-limit</p>
              <p className="text-2xl font-bold text-rose-600 mt-1">
                {summary24h.blockedCount24h}
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <ShieldAlert className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <form
            onSubmit={handleSearchSubmit}
            className="flex flex-col md:flex-row gap-3 items-stretch md:items-center"
          >
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Tìm theo Email, Họ tên, Địa chỉ IP, Hành động hoặc Endpoint..."
                className="w-full h-9 pl-9 pr-3 text-sm rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            <Button type="submit" size="sm">
              Tìm kiếm
            </Button>

            {(search ||
              categoryFilter ||
              statusFilter ||
              roleFilter ||
              severityFilter) && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleResetFilters}
              >
                Xóa lọc
              </Button>
            )}
          </form>

          <div className="flex flex-wrap gap-2.5 items-center pt-1">
            <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
              <Filter className="w-3.5 h-3.5" />
              Bộ lọc:
            </div>

            <select
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value);
                setPage(1);
              }}
              className="h-8 rounded-lg border border-slate-200 px-2.5 text-xs bg-white text-slate-700"
            >
              <option value="">Tất cả phân hệ</option>
              {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="h-8 rounded-lg border border-slate-200 px-2.5 text-xs bg-white text-slate-700"
            >
              <option value="">Tất cả kết quả</option>
              <option value="SUCCESS">Thành công</option>
              <option value="FAILED">Thất bại</option>
              <option value="BLOCKED">Bị chặn</option>
            </select>

            <select
              value={roleFilter}
              onChange={(e) => {
                setRoleFilter(e.target.value);
                setPage(1);
              }}
              className="h-8 rounded-lg border border-slate-200 px-2.5 text-xs bg-white text-slate-700"
            >
              <option value="">Tất cả vai trò</option>
              <option value="STUDENT">Sinh viên (STUDENT)</option>
              <option value="ADMIN">Quản trị viên (ADMIN)</option>
              <option value="MENTOR">Cố vấn (MENTOR)</option>
              <option value="GUEST">Khách / Chưa đăng nhập</option>
            </select>

            <select
              value={severityFilter}
              onChange={(e) => {
                setSeverityFilter(e.target.value);
                setPage(1);
              }}
              className="h-8 rounded-lg border border-slate-200 px-2.5 text-xs bg-white text-slate-700"
            >
              <option value="">Mọi mức cảnh báo</option>
              <option value="INFO">Bình thường (INFO)</option>
              <option value="WARN">Cảnh báo (WARN)</option>
              <option value="HIGH">Nghiêm trọng (HIGH)</option>
            </select>

            <div className="ml-auto text-xs text-slate-500">
              Tổng: <strong>{total}</strong> bản ghi
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Logs Table */}
      <Card>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-sm text-left border-collapse">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 text-xs uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-4 font-semibold">Thời gian</th>
                <th className="py-3.5 px-4 font-semibold">Người dùng</th>
                <th className="py-3.5 px-4 font-semibold">Địa chỉ IP & Vị trí</th>
                <th className="py-3.5 px-4 font-semibold">Hành động & Thiết bị</th>
                <th className="py-3.5 px-4 font-semibold">Kết quả</th>
                <th className="py-3.5 px-4 font-semibold text-right">Chi tiết</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    Đang tải nhật ký hoạt động...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    Chưa có bản ghi hoạt động nào khớp với bộ lọc.
                  </td>
                </tr>
              ) : (
                logs.map((log) => {
                  const statusMeta = STATUS_BADGES[log.status];
                  const roleBadgeClass =
                    ROLE_BADGES[log.actorRole] || ROLE_BADGES.GUEST;
                  const geoLabel = [log.geo?.city, log.geo?.country]
                    .filter(Boolean)
                    .join(", ");

                  return (
                    <tr
                      key={log._id}
                      className="hover:bg-slate-50/70 transition-colors"
                    >
                      <td className="py-3.5 px-4 whitespace-nowrap text-xs text-slate-600">
                        <div className="font-medium text-slate-800">
                          {new Date(log.createdAt).toLocaleTimeString("vi-VN")}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {new Date(log.createdAt).toLocaleDateString("vi-VN")}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-medium text-slate-900">
                          {log.actorName || log.actorEmail || "Ẩn danh"}
                        </div>
                        {log.actorEmail && (
                          <div className="text-xs text-slate-500">
                            {log.actorEmail}
                          </div>
                        )}
                        <span
                          className={`inline-block mt-1 px-1.5 py-0.5 rounded text-[10px] font-semibold ${roleBadgeClass}`}
                        >
                          {log.actorRole}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => {
                            setSearchInput(log.ipAddress);
                            setSearch(log.ipAddress);
                            setPage(1);
                          }}
                          title="Nhấp để lọc theo địa chỉ IP này"
                          className="font-mono text-xs px-2 py-0.5 rounded bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-700 transition-colors"
                        >
                          {log.ipAddress}
                        </button>
                        {geoLabel && (
                          <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
                            <Globe className="w-3 h-3" />
                            {geoLabel}
                          </div>
                        )}
                      </td>

                      <td className="py-3.5 px-4 max-w-md">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-700">
                            {CATEGORY_LABELS[log.category] || log.category}
                          </span>
                          <span className="font-mono text-[11px] text-blue-700 font-semibold">
                            {log.action}
                          </span>
                        </div>
                        <p className="text-xs text-slate-700 mt-1 line-clamp-2">
                          {log.description}
                        </p>
                        {log.deviceSummary && (
                          <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
                            <Laptop className="w-3 h-3" />
                            {log.deviceSummary}
                          </div>
                        )}
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${statusMeta.className}`}
                        >
                          {log.status === "SUCCESS" ? (
                            <CheckCircle2 className="w-3 h-3" />
                          ) : log.status === "FAILED" ? (
                            <AlertTriangle className="w-3 h-3" />
                          ) : (
                            <XCircle className="w-3 h-3" />
                          )}
                          {statusMeta.label}
                        </span>
                        {typeof log.statusCode === "number" && (
                          <div className="text-[11px] font-mono text-slate-400 mt-1">
                            HTTP {log.statusCode}
                          </div>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedLog(log)}
                          className="h-8 text-xs gap-1"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          Xem
                        </Button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-slate-600">
          <span>
            Trang <strong>{page}</strong> / {totalPages}
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Trước
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Sau
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-2xl w-full overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div>
                <h3 className="font-bold text-slate-900">
                  Chi tiết sự kiện người dùng
                </h3>
                <p className="text-xs text-slate-500 mt-0.5 font-mono">
                  {selectedLog.action} ·{" "}
                  {new Date(selectedLog.createdAt).toLocaleString("vi-VN")}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedLog(null)}
                className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto text-sm">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="rounded-xl border border-slate-200 p-3 bg-slate-50/50">
                  <div className="text-xs text-slate-400">Người thực hiện</div>
                  <div className="font-semibold text-slate-900 mt-0.5">
                    {selectedLog.actorName || selectedLog.actorEmail || "Ẩn danh"}
                  </div>
                  {selectedLog.actorEmail && (
                    <div className="text-xs text-slate-600">
                      {selectedLog.actorEmail}
                    </div>
                  )}
                  <div className="text-xs text-slate-500 mt-1">
                    Role: <strong>{selectedLog.actorRole}</strong>
                    {selectedLog.actorId ? ` · ID: ${selectedLog.actorId}` : ""}
                  </div>
                </div>

                <div className="rounded-xl border border-slate-200 p-3 bg-slate-50/50">
                  <div className="text-xs text-slate-400">Mạng & Thiết bị</div>
                  <div className="font-mono font-semibold text-slate-900 mt-0.5">
                    IP: {selectedLog.ipAddress}
                  </div>
                  {(selectedLog.geo?.city || selectedLog.geo?.country) && (
                    <div className="text-xs text-slate-600">
                      Vị trí:{" "}
                      {[selectedLog.geo?.city, selectedLog.geo?.country]
                        .filter(Boolean)
                        .join(", ")}
                    </div>
                  )}
                  <div className="text-xs text-slate-500 mt-1">
                    {selectedLog.deviceSummary || "Không rõ thiết bị"}
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 p-3">
                <div className="text-xs text-slate-400">Endpoint & Kết quả</div>
                <div className="font-mono text-xs text-slate-800 mt-1">
                  {selectedLog.httpMethod} {selectedLog.requestPath}{" "}
                  {typeof selectedLog.statusCode === "number"
                    ? `-> HTTP ${selectedLog.statusCode}`
                    : ""}
                </div>
                <p className="text-slate-700 mt-2">{selectedLog.description}</p>
                {selectedLog.errorMessage && (
                  <p className="text-xs text-rose-600 mt-1 font-medium">
                    Lỗi: {selectedLog.errorMessage}
                  </p>
                )}
              </div>

              {(selectedLog.targetCollection ||
                selectedLog.targetId ||
                selectedLog.targetTitle) && (
                <div className="rounded-xl border border-slate-200 p-3">
                  <div className="text-xs text-slate-400">Đối tượng tác động</div>
                  <div className="text-xs text-slate-700 mt-1 space-y-0.5">
                    {selectedLog.targetTitle && (
                      <div>Tiêu đề: {selectedLog.targetTitle}</div>
                    )}
                    {selectedLog.targetCollection && (
                      <div>
                        Collection:{" "}
                        <span className="font-mono">
                          {selectedLog.targetCollection}
                        </span>
                      </div>
                    )}
                    {selectedLog.targetId && (
                      <div>
                        Target ID:{" "}
                        <span className="font-mono">{selectedLog.targetId}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {selectedLog.userAgent && (
                <div className="rounded-xl border border-slate-200 p-3">
                  <div className="text-xs text-slate-400 mb-1">User-Agent</div>
                  <p className="font-mono text-[11px] text-slate-600 break-all">
                    {selectedLog.userAgent}
                  </p>
                </div>
              )}

              {selectedLog.metadata &&
                Object.keys(selectedLog.metadata).length > 0 && (
                  <div className="rounded-xl border border-slate-200 p-3 bg-slate-900 text-slate-100">
                    <div className="text-xs text-slate-400 mb-1.5">
                      Metadata bổ sung (đã ẩn thông tin nhạy cảm)
                    </div>
                    <pre className="text-xs font-mono overflow-auto max-h-52">
                      {JSON.stringify(selectedLog.metadata, null, 2)}
                    </pre>
                  </div>
                )}
            </div>

            <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 flex justify-end">
              <Button size="sm" onClick={() => setSelectedLog(null)}>
                Đóng
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

