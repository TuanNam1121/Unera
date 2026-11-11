"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  History,
  Search,
  Filter,
  Clock,
  ShieldCheck,
  Eye,
  Loader2,
  ChevronLeft,
  ChevronRight,
  User,
  Globe,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface AuditLog {
  id: string;
  adminId: string;
  adminEmail: string;
  adminName: string;
  action: string;
  targetCollection: string;
  targetId: string;
  targetTitle?: string;
  targetVersion?: number;
  changesBefore?: Record<string, any>;
  changesAfter?: Record<string, any>;
  reason?: string;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
}

function AdminAuditLogsContent() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState("ALL");
  const [collectionFilter, setCollectionFilter] = useState("ALL");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Selected log for Diff Modal
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: "15",
        action: actionFilter,
        collection: collectionFilter,
      });

      const res = await fetch(`/api/admin/audit-logs?${queryParams.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs || []);
        setTotalPages(data.pagination?.totalPages || 1);
        setTotalCount(data.pagination?.total || 0);
      }
    } catch (err) {
      console.error("Lỗi tải nhật ký kiểm toán:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [page, actionFilter, collectionFilter]);

  const getActionBadge = (action: string) => {
    switch (action) {
      case "CREATE":
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">TẠO MỚI</span>;
      case "UPDATE":
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">CẬP NHẬT</span>;
      case "STATUS_CHANGE":
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">ĐỔI TRẠNG THÁI</span>;
      case "LOCK_ACCOUNT":
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-50 text-red-700 border border-red-200">KHÓA TÀI KHOẢN</span>;
      case "UNLOCK_ACCOUNT":
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">MỞ KHÓA</span>;
      default:
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">{action}</span>;
    }
  };

  return (
    <div className="w-full space-y-6 px-6 sm:px-8 py-6 max-w-7xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <History className="h-6 w-6 text-blue-600" />
            <span>Nhật Ký Kiểm Toán Hệ Thống ({totalCount})</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Truy vết minh bạch mọi thao tác quản trị viên theo chuẩn FR-ADM-14 và FR-ADM-20 (Append-only Audit Trail)
          </p>
        </div>

        {/* Action Filters */}
        <div className="flex items-center gap-1 rounded-xl bg-slate-100 p-1 overflow-x-auto">
          {["ALL", "STATUS_CHANGE", "LOCK_ACCOUNT", "UNLOCK_ACCOUNT", "UPDATE", "CREATE"].map((act) => (
            <button
              key={act}
              onClick={() => {
                setActionFilter(act);
                setPage(1);
              }}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                actionFilter === act ? "bg-white text-slate-900 shadow-2xs" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              {act === "ALL"
                ? "Tất cả"
                : act === "STATUS_CHANGE"
                ? "Đổi trạng thái"
                : act === "LOCK_ACCOUNT"
                ? "Khóa TK"
                : act === "UNLOCK_ACCOUNT"
                ? "Mở khóa TK"
                : act === "UPDATE"
                ? "Cập nhật"
                : "Tạo mới"}
            </button>
          ))}
        </div>
      </div>

      {/* Audit Log Table Card */}
      <Card className="rounded-2xl border-slate-200/80 shadow-xs bg-white overflow-hidden">
        <CardContent className="p-0">
          {loading ? (
            <div className="flex h-64 items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
          ) : logs.length === 0 ? (
            <div className="p-12 text-center text-xs sm:text-sm text-slate-400 italic">
              Chưa có bản ghi nhật ký kiểm toán nào được ghi nhận.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200/80 text-slate-500 font-semibold uppercase text-[11px] tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Thời gian</th>
                    <th className="py-3 px-4">Quản trị viên thực hiện</th>
                    <th className="py-3 px-4">Hành động</th>
                    <th className="py-3 px-4">Đối tượng tác động</th>
                    <th className="py-3 px-4">Lý do / Ghi chú</th>
                    <th className="py-3 px-4 text-right">Chi tiết</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {logs.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4 text-slate-500 text-[11px] whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <Clock className="h-3.5 w-3.5 text-slate-400" />
                          <span>{new Date(item.createdAt).toLocaleString("vi-VN")}</span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="space-y-0.5">
                          <p className="font-semibold text-slate-900 text-xs">{item.adminName}</p>
                          <p className="text-[11px] text-slate-400">{item.adminEmail}</p>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">{getActionBadge(item.action)}</td>

                      <td className="py-3.5 px-4 max-w-xs">
                        <div className="space-y-0.5">
                          <p className="font-medium text-slate-800 line-clamp-1">{item.targetTitle || item.targetId}</p>
                          <span className="text-[10px] text-slate-400 font-mono">
                            Phân hệ: {item.targetCollection}
                          </span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-slate-600 max-w-xs truncate">
                        {item.reason || "—"}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        {(item.changesBefore || item.changesAfter) && (
                          <button
                            type="button"
                            onClick={() => setSelectedLog(item)}
                            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-700 transition-all shadow-2xs cursor-pointer"
                          >
                            <Eye className="h-3.5 w-3.5 text-slate-500" />
                            <span>So sánh</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3 bg-slate-50/50">
              <span className="text-xs text-slate-500">
                Trang {page} / {totalPages}
              </span>
              <div className="flex items-center gap-1.5">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="h-8 rounded-lg text-xs"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="h-8 rounded-lg text-xs"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal Chi tiết So sánh Dữ liệu (Diff Viewer) */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="space-y-0.5">
                <h3 className="text-base font-bold text-slate-900">
                  Chi tiết So sánh Dữ liệu (Audit Diff Viewer)
                </h3>
                <p className="text-xs text-slate-500">
                  {selectedLog.adminName} ({selectedLog.adminEmail}) thực hiện lúc{" "}
                  {new Date(selectedLog.createdAt).toLocaleString("vi-VN")}
                </p>
              </div>
              <div>{getActionBadge(selectedLog.action)}</div>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 pr-1 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Before */}
                <div className="space-y-1.5">
                  <span className="font-semibold text-red-700 bg-red-50 px-2.5 py-1 rounded-md border border-red-200 inline-block">
                    Dữ liệu trước thay đổi (Before)
                  </span>
                  <pre className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 overflow-x-auto text-[11px] font-mono whitespace-pre-wrap">
                    {selectedLog.changesBefore
                      ? JSON.stringify(selectedLog.changesBefore, null, 2)
                      : "Không có dữ liệu trước thay đổi"}
                  </pre>
                </div>

                {/* After */}
                <div className="space-y-1.5">
                  <span className="font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200 inline-block">
                    Dữ liệu sau thay đổi (After)
                  </span>
                  <pre className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 overflow-x-auto text-[11px] font-mono whitespace-pre-wrap">
                    {selectedLog.changesAfter
                      ? JSON.stringify(selectedLog.changesAfter, null, 2)
                      : "Không có dữ liệu sau thay đổi"}
                  </pre>
                </div>
              </div>

              {selectedLog.reason && (
                <div className="p-3 rounded-xl bg-blue-50/70 border border-blue-200/60 text-blue-900">
                  <span className="font-semibold">Lý do ghi nhận:</span> {selectedLog.reason}
                </div>
              )}

              <div className="text-[11px] text-slate-400 space-y-0.5">
                <p>Địa chỉ IP: {selectedLog.ipAddress || "127.0.0.1"}</p>
                {selectedLog.userAgent && <p className="truncate">Tác nhân: {selectedLog.userAgent}</p>}
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-100">
              <Button
                variant="outline"
                onClick={() => setSelectedLog(null)}
                className="rounded-xl text-xs"
              >
                Đóng
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminAuditLogsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-96 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      }
    >
      <AdminAuditLogsContent />
    </Suspense>
  );
}
