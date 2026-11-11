"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  CalendarCheck,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
  Video,
  User,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Send,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface Booking {
  id: string;
  student: {
    id: string;
    name: string;
    email: string;
    avatar?: string;
  };
  mentor?: {
    fullName: string;
    title: string;
    company: string;
  };
  topic: string;
  preferredTime: string;
  message: string;
  status: "PENDING" | "CONFIRMED" | "REJECTED" | "COMPLETED" | "CANCELLED";
  adminResponse?: string;
  createdAt: string;
}

function AdminBookingsContent() {
  const searchParams = useSearchParams();
  const initialStatus = searchParams.get("status") || "ALL";

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState(initialStatus);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Modal Xử lý Duyệt / Từ chối
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [targetStatus, setTargetStatus] = useState<"CONFIRMED" | "REJECTED">("CONFIRMED");
  const [responseNotes, setResponseNotes] = useState("");
  const [processing, setProcessing] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: "10",
        status: statusFilter,
      });

      const res = await fetch(`/api/admin/bookings?${queryParams.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setBookings(data.bookings || []);
        setTotalPages(data.pagination?.totalPages || 1);
        setTotalCount(data.pagination?.total || 0);
      }
    } catch (err) {
      console.error("Lỗi tải danh sách đặt lịch:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, [page, statusFilter]);

  const handleProcessBooking = async () => {
    if (!selectedBooking) return;
    setProcessing(true);
    setErrorMsg("");

    try {
      const res = await fetch(`/api/admin/bookings/${selectedBooking.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: targetStatus,
          adminResponse: responseNotes.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.error || "Không thể xử lý yêu cầu đặt lịch.");
      } else {
        setSuccessMsg(data.message);
        setSelectedBooking(null);
        setResponseNotes("");
        fetchBookings();
        setTimeout(() => setSuccessMsg(""), 4000);
      }
    } catch {
      setErrorMsg("Đã xảy ra lỗi kết nối với máy chủ.");
    } finally {
      setProcessing(false);
    }
  };

  const getStatusBadge = (st: string) => {
    switch (st) {
      case "PENDING":
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">Chờ Admin duyệt</span>;
      case "CONFIRMED":
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">Đã chốt lịch (Confirmed)</span>;
      case "REJECTED":
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-red-50 text-red-700 border border-red-200">Đã từ chối</span>;
      case "COMPLETED":
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">Đã hoàn thành</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-600">{st}</span>;
    }
  };

  return (
    <div className="w-full space-y-6 px-6 sm:px-8 py-6 max-w-7xl">
      {/* Alert Notification */}
      {successMsg && (
        <div className="flex items-center gap-2.5 rounded-xl bg-emerald-50 p-3.5 text-xs sm:text-sm text-emerald-800 border border-emerald-200 animate-in fade-in">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <CalendarCheck className="h-6 w-6 text-blue-600" />
            <span>Xử Lý Yêu Cầu Tư Vấn Cố Vấn ({totalCount})</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Mô hình Admin làm cầu nối trung gian (FR-MEN-11..13): kiểm duyệt câu hỏi, xếp lịch và cung cấp đường dẫn phòng họp
          </p>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1 rounded-xl bg-slate-100 p-1 overflow-x-auto">
          {["ALL", "PENDING", "CONFIRMED", "REJECTED", "COMPLETED"].map((st) => (
            <button
              key={st}
              onClick={() => {
                setStatusFilter(st);
                setPage(1);
              }}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                statusFilter === st ? "bg-white text-slate-900 shadow-2xs" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              {st === "ALL"
                ? "Tất cả"
                : st === "PENDING"
                ? "Chờ duyệt"
                : st === "CONFIRMED"
                ? "Đã duyệt"
                : st === "REJECTED"
                ? "Đã từ chối"
                : "Hoàn tất"}
            </button>
          ))}
        </div>
      </div>

      {/* Bookings Table Card */}
      <Card className="rounded-2xl border-slate-200/80 shadow-xs bg-white overflow-hidden">
        <CardContent className="p-0">
          {loading ? (
            <div className="flex h-64 items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
          ) : bookings.length === 0 ? (
            <div className="p-12 text-center text-xs sm:text-sm text-slate-400 italic">
              Không có yêu cầu tư vấn nào phù hợp với bộ lọc.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200/80 text-slate-500 font-semibold uppercase text-[11px] tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Sinh viên</th>
                    <th className="py-3 px-4">Cố vấn mục tiêu</th>
                    <th className="py-3 px-4">Chủ đề &amp; Thời gian mong muốn</th>
                    <th className="py-3 px-4">Trạng thái</th>
                    <th className="py-3 px-4 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {bookings.map((b) => (
                    <tr key={b.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="space-y-0.5">
                          <p className="font-semibold text-slate-900 text-xs sm:text-sm">{b.student.name}</p>
                          <p className="text-[11px] text-slate-500">{b.student.email}</p>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="space-y-0.5">
                          <p className="font-semibold text-slate-800">{b.mentor?.fullName || "Chuyên gia Unera"}</p>
                          <p className="text-[11px] text-slate-400">
                            {b.mentor?.title} · {b.mentor?.company}
                          </p>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 max-w-sm">
                        <div className="space-y-1">
                          <p className="font-semibold text-slate-800 text-xs line-clamp-1">{b.topic}</p>
                          <p className="text-[11px] text-blue-600 flex items-center gap-1 font-medium">
                            <Clock className="h-3 w-3" />
                            <span>Khung giờ: {b.preferredTime}</span>
                          </p>
                          <p className="text-[11px] text-slate-500 line-clamp-1 italic">&quot;{b.message}&quot;</p>
                          {b.adminResponse && (
                            <p className="text-[11px] text-emerald-700 bg-emerald-50/80 px-2 py-0.5 rounded border border-emerald-200/50">
                              Phản hồi: {b.adminResponse}
                            </p>
                          )}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">{getStatusBadge(b.status)}</td>

                      <td className="py-3.5 px-4 text-right">
                        {b.status === "PENDING" ? (
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedBooking(b);
                                setTargetStatus("CONFIRMED");
                                setResponseNotes("Đã xác nhận với Mentor. Link Google Meet: https://meet.google.com/abc-defg-hij");
                                setErrorMsg("");
                              }}
                              className="rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white px-2.5 py-1 text-xs font-semibold transition-all shadow-2xs cursor-pointer"
                            >
                              Duyệt lịch
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedBooking(b);
                                setTargetStatus("REJECTED");
                                setResponseNotes("Mentor bận lịch công tác trong khung giờ này. Vui lòng đăng ký khung giờ khác.");
                                setErrorMsg("");
                              }}
                              className="rounded-lg border border-red-200 bg-red-50 hover:bg-red-100 text-red-700 px-2.5 py-1 text-xs font-semibold transition-all shadow-2xs cursor-pointer"
                            >
                              Từ chối
                            </button>
                          </div>
                        ) : (
                          <span className="text-slate-400 text-xs italic">Đã xử lý</span>
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

      {/* Modal Xử lý Duyệt / Từ chối (FR-ADM-06, FR-MEN-08) */}
      {selectedBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                  targetStatus === "CONFIRMED" ? "bg-emerald-100 text-emerald-600" : "bg-red-100 text-red-600"
                }`}
              >
                {targetStatus === "CONFIRMED" ? <CheckCircle2 className="h-5 w-5" /> : <XCircle className="h-5 w-5" />}
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  {targetStatus === "CONFIRMED" ? "Phê duyệt & Xếp lịch tư vấn" : "Từ chối yêu cầu tư vấn"}
                </h3>
                <p className="text-xs text-slate-500">
                  Sinh viên: {selectedBooking.student.name} · Cố vấn: {selectedBooking.mentor?.fullName}
                </p>
              </div>
            </div>

            {errorMsg && (
              <div className="rounded-xl bg-red-50 p-3 text-xs text-red-700 border border-red-200">
                {errorMsg}
              </div>
            )}

            <div className="space-y-1.5 p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-xs text-slate-700">
              <p><span className="font-semibold">Chủ đề:</span> {selectedBooking.topic}</p>
              <p><span className="font-semibold">Khung giờ đề xuất:</span> {selectedBooking.preferredTime}</p>
              <p><span className="font-semibold">Nội dung câu hỏi:</span> {selectedBooking.message}</p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">
                {targetStatus === "CONFIRMED"
                  ? "Đường dẫn Google Meet / Thông tin địa điểm & Lời dặn gửi sinh viên:"
                  : "Lý do từ chối gửi đến sinh viên:"}
              </label>
              <textarea
                rows={3}
                value={responseNotes}
                onChange={(e) => setResponseNotes(e.target.value)}
                placeholder="Ví dụ: Lịch hẹn đã được xác nhận vào lúc 19:30 Thứ 5. Link Google Meet: https://meet.google.com/xyz..."
                className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-800 placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 focus:outline-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                onClick={() => setSelectedBooking(null)}
                disabled={processing}
                className="rounded-xl text-xs"
              >
                Hủy bỏ
              </Button>
              <Button
                onClick={handleProcessBooking}
                disabled={processing}
                className={`rounded-xl text-xs gap-1.5 text-white ${
                  targetStatus === "CONFIRMED" ? "bg-emerald-600 hover:bg-emerald-700" : "bg-red-600 hover:bg-red-700"
                }`}
              >
                {processing && <Loader2 className="h-4 w-4 animate-spin" />}
                <Send className="h-3.5 w-3.5" />
                <span>{targetStatus === "CONFIRMED" ? "Xác nhận duyệt & Gửi link" : "Xác nhận từ chối"}</span>
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminBookingsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-96 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      }
    >
      <AdminBookingsContent />
    </Suspense>
  );
}
