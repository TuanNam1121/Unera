"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  Check,
  Edit3,
  GraduationCap,
  Loader2,
  MessageSquare,
  Reply,
  Send,
  Trash2,
  X,
} from "lucide-react";
import { fetchWithAuth, useAuth } from "@/components/providers/AuthProvider";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";
import type { IArticleCommentDTO } from "@/types";

interface ArticleCommentsProps {
  slug: string;
  initialCount: number;
  onCommentCountChange?: (count: number) => void;
}

export function ArticleComments({
  slug,
  initialCount,
  onCommentCountChange,
}: ArticleCommentsProps) {
  const { user } = useAuth();
  const [comments, setComments] = useState<IArticleCommentDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(initialCount);

  const [newContent, setNewContent] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [replyingToId, setReplyingToId] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const [replySubmitting, setReplySubmitting] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [editSubmitting, setEditSubmitting] = useState(false);

  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const loadComments = useCallback(
    async (targetPage: number) => {
      try {
        const res = await fetchWithAuth(
          `/api/orientation/articles/${encodeURIComponent(slug)}/comments?page=${targetPage}&limit=10`,
          { cache: "no-store" }
        );
        const data = await res.json();
        if (res.ok && data.success) {
          setComments(data.comments || []);
          setTotalPages(data.pagination?.totalPages || 1);
          const resolvedTotal =
            typeof data.totalCommentCount === "number"
              ? data.totalCommentCount
              : typeof data.totalCount === "number"
                ? data.totalCount
                : undefined;
          if (typeof resolvedTotal === "number") {
            setTotalCount(resolvedTotal);
            onCommentCountChange?.(resolvedTotal);
          }
        }
      } catch {
        setErrorMsg("Không thể tải bình luận lúc này.");
      } finally {
        setLoading(false);
      }
    },
    [onCommentCountChange, slug]
  );

  useEffect(() => {
    let cancelled = false;
    async function run() {
      try {
        const res = await fetchWithAuth(
          `/api/orientation/articles/${encodeURIComponent(slug)}/comments?page=${page}&limit=10`,
          { cache: "no-store" }
        );
        const data = await res.json();
        if (cancelled) return;
        if (res.ok && data.success) {
          setComments(data.comments || []);
          setTotalPages(data.pagination?.totalPages || 1);
          const resolvedTotal =
            typeof data.totalCommentCount === "number"
              ? data.totalCommentCount
              : typeof data.totalCount === "number"
                ? data.totalCount
                : undefined;
          if (typeof resolvedTotal === "number") {
            setTotalCount(resolvedTotal);
            onCommentCountChange?.(resolvedTotal);
          }
        }
      } catch {
        if (!cancelled) setErrorMsg("Không thể tải bình luận.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    run();
    return () => {
      cancelled = true;
    };
  }, [slug, page, onCommentCountChange]);

  const handleSubmitNew = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newContent.trim();
    if (!trimmed) {
      setErrorMsg("Vui lòng nhập nội dung bình luận.");
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);

    try {
      const res = await fetchWithAuth(
        `/api/orientation/articles/${encodeURIComponent(slug)}/comments`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: trimmed }),
        }
      );
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || "Không thể gửi bình luận.");
        return;
      }

      setNewContent("");
      setPage(1);
      await loadComments(1);
      if (typeof data.commentCount === "number") {
        setTotalCount(data.commentCount);
        onCommentCountChange?.(data.commentCount);
      }
    } catch {
      setErrorMsg("Lỗi kết nối máy chủ khi gửi bình luận.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitReply = async (parentId: string) => {
    const trimmed = replyContent.trim();
    if (!trimmed) {
      setErrorMsg("Vui lòng nhập nội dung trả lời.");
      return;
    }

    setReplySubmitting(true);
    setErrorMsg(null);

    try {
      const res = await fetchWithAuth(
        `/api/orientation/articles/${encodeURIComponent(slug)}/comments`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            content: trimmed,
            parentCommentId: parentId,
          }),
        }
      );
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || "Không thể gửi phản hồi.");
        return;
      }

      setReplyingToId(null);
      setReplyContent("");
      await loadComments(page);
      if (typeof data.commentCount === "number") {
        setTotalCount(data.commentCount);
        onCommentCountChange?.(data.commentCount);
      }
    } catch {
      setErrorMsg("Lỗi kết nối máy chủ khi gửi phản hồi.");
    } finally {
      setReplySubmitting(false);
    }
  };

  const handleSaveEdit = async (commentId: string) => {
    const trimmed = editContent.trim();
    if (!trimmed) {
      setErrorMsg("Nội dung bình luận không được để trống.");
      return;
    }

    setEditSubmitting(true);
    setErrorMsg(null);

    try {
      const res = await fetchWithAuth(
        `/api/orientation/comments/${encodeURIComponent(commentId)}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: trimmed }),
        }
      );
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || "Không thể cập nhật bình luận.");
        return;
      }

      setEditingId(null);
      setEditContent("");
      await loadComments(page);
    } catch {
      setErrorMsg("Lỗi kết nối khi cập nhật bình luận.");
    } finally {
      setEditSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!window.confirm("Bạn có chắc muốn xóa bình luận này không?")) {
      return;
    }

    setErrorMsg(null);
    try {
      const res = await fetchWithAuth(
        `/api/orientation/comments/${encodeURIComponent(commentId)}`,
        { method: "DELETE" }
      );
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || "Không thể xóa bình luận.");
        return;
      }

      await loadComments(page);
      if (typeof data.commentCount === "number") {
        setTotalCount(data.commentCount);
        onCommentCountChange?.(data.commentCount);
      }
    } catch {
      setErrorMsg("Lỗi kết nối khi xóa bình luận.");
    }
  };

  const renderCommentNode = (comment: IArticleCommentDTO, isReply = false) => {
    const initial = comment.user.name.trim().charAt(0).toUpperCase() || "U";
    const isEditing = editingId === comment._id;
    const schoolMajorLabel = [
      comment.user.university?.trim(),
      comment.user.major?.trim(),
    ]
      .filter(Boolean)
      .join(" - ");

    return (
      <div
        key={comment._id}
        className={`rounded-2xl border p-4 ${
          isReply
            ? "ml-6 sm:ml-10 border-slate-200/80 bg-slate-50/70"
            : "border-slate-200 bg-white"
        }`}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-2.5 min-w-0">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700 mt-0.5">
              {initial}
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                <span className="text-xs sm:text-sm font-semibold text-slate-900">
                  {comment.user.name}
                </span>
                <span className="text-[11px] text-slate-400">
                  {formatDate(comment.createdAt)}
                </span>
                {comment.isEdited && (
                  <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-500">
                    đã chỉnh sửa
                  </span>
                )}
              </div>
              {schoolMajorLabel && (
                <p className="mt-0.5 flex items-center gap-1.5 text-[11px] sm:text-xs font-medium text-slate-500">
                  <GraduationCap className="h-3.5 w-3.5 shrink-0 text-blue-500" />
                  <span className="leading-snug">{schoolMajorLabel}</span>
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            {!isReply && user && (
              <button
                type="button"
                onClick={() => {
                  setReplyingToId((prev) =>
                    prev === comment._id ? null : comment._id
                  );
                  setReplyContent("");
                }}
                className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-medium text-slate-500 hover:bg-slate-100 hover:text-blue-600 cursor-pointer"
              >
                <Reply className="h-3 w-3" />
                <span>Trả lời</span>
              </button>
            )}
            {comment.isOwner && !isEditing && (
              <button
                type="button"
                onClick={() => {
                  setEditingId(comment._id);
                  setEditContent(comment.content);
                }}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-blue-600 cursor-pointer"
                aria-label="Chỉnh sửa bình luận"
              >
                <Edit3 className="h-3.5 w-3.5" />
              </button>
            )}
            {comment.canDelete && (
              <button
                type="button"
                onClick={() => handleDeleteComment(comment._id)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 cursor-pointer"
                aria-label="Xóa bình luận"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        {isEditing ? (
          <div className="mt-3 space-y-2">
            <textarea
              rows={2}
              maxLength={1000}
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="w-full rounded-xl border border-slate-200 p-2.5 text-xs sm:text-sm text-slate-800 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
            />
            <div className="flex items-center justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setEditingId(null);
                  setEditContent("");
                }}
                className="rounded-lg"
              >
                <X className="mr-1 h-3.5 w-3.5" />
                Hủy
              </Button>
              <Button
                type="button"
                size="sm"
                disabled={editSubmitting}
                onClick={() => handleSaveEdit(comment._id)}
                className="rounded-lg bg-blue-600 hover:bg-blue-700 text-white"
              >
                {editSubmitting ? (
                  <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Check className="mr-1 h-3.5 w-3.5" />
                )}
                Lưu
              </Button>
            </div>
          </div>
        ) : (
          <p className="mt-2.5 whitespace-pre-wrap text-xs sm:text-sm text-slate-700 leading-relaxed">
            {comment.content}
          </p>
        )}

        {!isReply && replyingToId === comment._id && (
          <div className="mt-3 space-y-2 border-t border-slate-100 pt-3">
            <textarea
              rows={2}
              maxLength={1000}
              placeholder={`Trả lời ${comment.user.name}...`}
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              className="w-full rounded-xl border border-slate-200 p-2.5 text-xs sm:text-sm text-slate-800 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
            />
            <div className="flex items-center justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setReplyingToId(null)}
                className="rounded-lg"
              >
                Đóng
              </Button>
              <Button
                type="button"
                size="sm"
                disabled={replySubmitting}
                onClick={() => handleSubmitReply(comment._id)}
                className="rounded-lg bg-blue-600 hover:bg-blue-700 text-white"
              >
                {replySubmitting ? (
                  <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Send className="mr-1 h-3.5 w-3.5" />
                )}
                Gửi phản hồi
              </Button>
            </div>
          </div>
        )}

        {!isReply && comment.replies && comment.replies.length > 0 && (
          <div className="mt-3 space-y-2.5">
            {comment.replies.map((reply) => renderCommentNode(reply, true))}
          </div>
        )}
      </div>
    );
  };

  return (
    <section id="comments" className="space-y-5 pt-4 border-t border-slate-200">
      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-lg font-bold text-slate-900">
          <MessageSquare className="h-5 w-5 text-blue-600" />
          <span>Thảo luận & Bình luận ({totalCount})</span>
        </h3>
      </div>

      {errorMsg && (
        <div
          role="alert"
          className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-xs sm:text-sm text-rose-700"
        >
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Comment Composer */}
      {user ? (
        <form
          onSubmit={handleSubmitNew}
          className="rounded-2xl border border-slate-200 bg-white p-4 space-y-3 shadow-2xs"
        >
          <textarea
            rows={3}
            maxLength={1000}
            placeholder="Chia sẻ góc nhìn hoặc đặt câu hỏi về định hướng ngành này..."
            value={newContent}
            onChange={(e) => setNewContent(e.target.value)}
            disabled={submitting}
            className="w-full rounded-xl border border-slate-200 p-3 text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
          />
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] text-slate-400">
              {newContent.trim().length}/1000 ký tự
            </span>
            <Button
              type="submit"
              disabled={submitting || !newContent.trim()}
              className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white gap-1.5"
              size="sm"
            >
              {submitting ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Send className="h-3.5 w-3.5" />
              )}
              <span>Gửi bình luận</span>
            </Button>
          </div>
        </form>
      ) : (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-blue-100 bg-blue-50/70 px-5 py-4">
          <p className="text-xs sm:text-sm text-slate-700">
            Đăng nhập bằng tài khoản Unera để tham gia bình luận và thảo luận cùng cộng đồng sinh viên.
          </p>
          <Link
            href={`/login?callbackUrl=${encodeURIComponent(`/explore/${slug}`)}`}
            className="inline-flex shrink-0 items-center justify-center rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700 transition-colors"
          >
            Đăng nhập để bình luận
          </Link>
        </div>
      )}

      {/* Comment Feed */}
      {loading ? (
        <div className="flex items-center justify-center py-8 text-slate-400 gap-2 text-xs">
          <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
          <span>Đang tải bình luận...</span>
        </div>
      ) : comments.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 py-8 text-center text-xs sm:text-sm text-slate-500">
          Chưa có bình luận nào. Hãy là người đầu tiên chia sẻ suy nghĩ của bạn!
        </div>
      ) : (
        <div className="space-y-3">
          {comments.map((comment) => renderCommentNode(comment, false))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="rounded-xl"
          >
            Trang trước
          </Button>
          <span className="text-xs font-medium text-slate-600 px-2">
            Trang {page} / {totalPages}
          </span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            className="rounded-xl"
          >
            Trang sau
          </Button>
        </div>
      )}
    </section>
  );
}

