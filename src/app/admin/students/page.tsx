"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  Users,
  Search,
  Lock,
  Unlock,
  AlertCircle,
  CheckCircle2,
  Loader2,
  GraduationCap,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface Student {
  id: string;
  name: string;
  email: string;
  status: "ACTIVE" | "DISABLED";
  role: string;
  avatar?: string;
  university: string;
  major: string;
  academicYear: string;
  createdAt: string;
}

function AdminStudentsContent() {
  const searchParams = useSearchParams();
  const initialStatus = searchParams.get("status") || "ALL";

  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState(initialStatus);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Modal Khóa / Mở khóa
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [actionType, setActionType] = useState<"LOCK" | "UNLOCK">("LOCK");
  const [reason, setReason] = useState("");
  const [processing, setProcessing] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: "12",
        status: statusFilter,
        search,
      });

      const res = await fetch(`/api/admin/students?${queryParams.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setStudents(data.students);
        setTotalPages(data.pagination.totalPages);
        setTotalCount(data.pagination.total);
      }
    } catch (err) {
      console.error("Lỗi tải sinh viên:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, [page, statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchStudents();
  };

  const handleConfirmStatusChange = async () => {
    if (!selectedStudent) return;
    if (actionType === "LOCK" && reason.trim().length < 5) {
      setErrorMsg("Vui lòng nhập lý do khóa tối thiểu 5 ký tự.");
      return;
    }

    setProcessing(true);
    setErrorMsg("");

    try {
      const newStatus = actionType === "LOCK" ? "DISABLED" : "ACTIVE";
      const res = await fetch(`/api/admin/students/${selectedStudent.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus, reason: reason.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.error || "Không thể cập nhật trạng thái.");
      } else {
        setFeedbackMsg(data.message);
        setSelectedStudent(null);
        setReason("");
        fetchStudents();
        setTimeout(() => setFeedbackMsg(""), 4000);
      }
    } catch {
      setErrorMsg("Đã xảy ra lỗi kết nối với máy chủ.");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="w-full space-y-6 px-6 sm:px-8 py-6 max-w-7xl">
      {/* Notifications */}
      {feedbackMsg && (
        <div className="flex items-center gap-2.5 rounded-xl bg-emerald-50 p-3.5 text-xs sm:text-sm text-emerald-800 border border-emerald-200 animate-in fade-in">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
          <span>{feedbackMsg}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <Users className="h-6 w-6 text-blue-600" />
            <span>Quản Lý Sinh Viên ({totalCount})</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Tra cứu thông tin, giám sát trạng thái tài khoản và áp dụng kiểm toán hệ thống
          </p>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 rounded-xl bg-slate-100 p-1">
          <button
            onClick={() => {
              setStatusFilter("ALL");
              setPage(1);
            }}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              statusFilter === "ALL" ? "bg-white text-slate-900 shadow-2xs" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Tất cả
          </button>
          <button
            onClick={() => {
              setStatusFilter("ACTIVE");
              setPage(1);
            }}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              statusFilter === "ACTIVE" ? "bg-white text-emerald-700 shadow-2xs" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Đang hoạt động
          </button>
          <button
            onClick={() => {
              setStatusFilter("DISABLED");
              setPage(1);
            }}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              statusFilter === "DISABLED" ? "bg-white text-red-700 shadow-2xs" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Đã khóa
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <form onSubmit={handleSearchSubmit} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm theo họ tên, email sinh viên..."
            className="pl-9 rounded-xl border-slate-200 text-xs sm:text-sm"
          />
        </div>
        <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-5 text-xs sm:text-sm">
          Tìm kiếm
        </Button>
      </form>

      {/* Student Data Table */}
      <Card className="rounded-2xl border-slate-200/80 shadow-xs bg-white overflow-hidden">
        <CardContent className="p-0">
          {loading ? (
            <div className="flex h-64 items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
          ) : students.length === 0 ? (
            <div className="p-12 text-center text-xs sm:text-sm text-slate-400 italic">
              Không tìm thấy sinh viên nào phù hợp với điều kiện tìm kiếm.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200/80 text-slate-500 font-semibold uppercase text-[11px] tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Sinh viên</th>
                    <th className="py-3 px-4">Trường &amp; Ngành học</th>
                    <th className="py-3 px-4">Ngày đăng ký</th>
                    <th className="py-3 px-4">Trạng thái</th>
                    <th className="py-3 px-4 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {students.map((st) => (
                    <tr key={st.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100 text-blue-700 font-bold text-xs shrink-0">
                            {st.name ? st.name.charAt(0).toUpperCase() : "U"}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-900 text-xs sm:text-sm">{st.name}</p>
                            <p className="text-[11px] text-slate-500">{st.email}</p>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-slate-600">
                        <p className="font-medium text-slate-800">{st.major}</p>
                        <p className="text-[11px] text-slate-400">{st.university}</p>
                      </td>

                      <td className="py-3.5 px-4 text-slate-500 text-[11px]">
                        {new Date(st.createdAt).toLocaleDateString("vi-VN")}
                      </td>

                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                            st.status === "ACTIVE"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : "bg-red-50 text-red-700 border border-red-200"
                          }`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${
                              st.status === "ACTIVE" ? "bg-emerald-500" : "bg-red-500"
                            }`}
                          />
                          {st.status === "ACTIVE" ? "Đang hoạt động" : "Bị vô hiệu hóa"}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        {st.status === "ACTIVE" ? (
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedStudent(st);
                              setActionType("LOCK");
                              setReason("");
                              setErrorMsg("");
                            }}
                            className="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-red-50/50 hover:bg-red-100 text-red-700 px-2.5 py-1 text-xs font-semibold transition-all cursor-pointer shadow-2xs"
                          >
                            <Lock className="h-3.5 w-3.5" />
                            <span>Khóa</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedStudent(st);
                              setActionType("UNLOCK");
                              setReason("Admin mở khóa lại tài khoản");
                              setErrorMsg("");
                            }}
                            className="inline-flex items-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50/50 hover:bg-emerald-100 text-emerald-700 px-2.5 py-1 text-xs font-semibold transition-all cursor-pointer shadow-2xs"
                          >
                            <Unlock className="h-3.5 w-3.5" />
                            <span>Mở khóa</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination Footer */}
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

      {/* Modal Xác nhận Khóa / Mở khóa tài khoản (FR-ADM-02, FR-ADM-14) */}
      {selectedStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                  actionType === "LOCK" ? "bg-red-100 text-red-600" : "bg-emerald-100 text-emerald-600"
                }`}
              >
                {actionType === "LOCK" ? <ShieldAlert className="h-5 w-5" /> : <Unlock className="h-5 w-5" />}
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  {actionType === "LOCK" ? "Khóa tài khoản sinh viên" : "Mở khóa tài khoản sinh viên"}
                </h3>
                <p className="text-xs text-slate-500">{selectedStudent.name} ({selectedStudent.email})</p>
              </div>
            </div>

            {errorMsg && (
              <div className="rounded-xl bg-red-50 p-3 text-xs text-red-700 border border-red-200">
                {errorMsg}
              </div>
            )}

            {actionType === "LOCK" ? (
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-700">
                  Lý do khóa tài khoản (bắt buộc - phục vụ kiểm toán):
                </label>
                <textarea
                  rows={3}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Ví dụ: Phát hiện hành vi gian lận thông tin minh chứng chứng chỉ..."
                  className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-800 placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 focus:outline-none"
                />
                <p className="text-[11px] text-slate-400 italic">
                  * Khi bị khóa, sinh viên sẽ không thể đăng nhập hoặc gọi bất kỳ API nào trên nền tảng.
                </p>
              </div>
            ) : (
              <p className="text-xs text-slate-600">
                Bạn có chắc chắn muốn mở khóa tài khoản cho sinh viên này? Sinh viên sẽ có thể tiếp tục sử dụng hệ thống bình thường.
              </p>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                onClick={() => setSelectedStudent(null)}
                disabled={processing}
                className="rounded-xl text-xs"
              >
                Hủy bỏ
              </Button>
              <Button
                onClick={handleConfirmStatusChange}
                disabled={processing}
                className={`rounded-xl text-xs gap-1.5 text-white ${
                  actionType === "LOCK" ? "bg-red-600 hover:bg-red-700" : "bg-emerald-600 hover:bg-emerald-700"
                }`}
              >
                {processing && <Loader2 className="h-4 w-4 animate-spin" />}
                <span>{actionType === "LOCK" ? "Xác nhận khóa" : "Xác nhận mở khóa"}</span>
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminStudentsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-96 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      }
    >
      <AdminStudentsContent />
    </Suspense>
  );
}
