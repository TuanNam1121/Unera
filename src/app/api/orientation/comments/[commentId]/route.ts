import { NextResponse } from "next/server";
import { Types } from "mongoose";
import { USER_ROLES } from "@/constants";
import { logAuditAction } from "@/lib/audit";
import { connectToDatabase } from "@/lib/db";
import { handleAuthError, requireAuth } from "@/lib/session";
import { ArticleComment } from "@/models/ArticleComment";
import { OrientationArticle } from "@/models/OrientationArticle";
import { updateArticleCommentSchema } from "@/validations";

/**
 * PATCH /api/orientation/comments/[commentId]
 * Chỉ chủ sở hữu bình luận mới được phép chỉnh sửa nội dung
 */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ commentId: string }> }
) {
  try {
    const authUser = await requireAuth(req);
    const { commentId } = await params;

    if (!Types.ObjectId.isValid(commentId)) {
      return NextResponse.json(
        { error: "Mã bình luận không hợp lệ." },
        { status: 400 }
      );
    }

    const body = await req.json();
    const parsed = updateArticleCommentSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error:
            parsed.error.issues[0]?.message || "Nội dung bình luận không hợp lệ.",
        },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const comment = await ArticleComment.findOne({
      _id: new Types.ObjectId(commentId),
      isDeleted: false,
    });

    if (!comment) {
      return NextResponse.json(
        { error: "Không tìm thấy bình luận." },
        { status: 404 }
      );
    }

    if (comment.userId.toString() !== authUser.id) {
      return NextResponse.json(
        { error: "Bạn không có quyền chỉnh sửa bình luận của người khác." },
        { status: 403 }
      );
    }

    comment.content = parsed.data.content;
    comment.isEdited = true;
    await comment.save();

    return NextResponse.json({
      success: true,
      comment: {
        _id: comment._id.toString(),
        articleId: comment.articleId.toString(),
        content: comment.content,
        parentCommentId: comment.parentCommentId
          ? comment.parentCommentId.toString()
          : null,
        isEdited: comment.isEdited,
        updatedAt: comment.updatedAt.toISOString(),
      },
    });
  } catch (error) {
    return handleAuthError(error);
  }
}

/**
 * DELETE /api/orientation/comments/[commentId]
 * Chủ sở hữu hoặc ADMIN xóa bình luận (kèm các reply con và đồng bộ commentCount)
 */
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ commentId: string }> }
) {
  try {
    const authUser = await requireAuth(req);
    const { commentId } = await params;

    if (!Types.ObjectId.isValid(commentId)) {
      return NextResponse.json(
        { error: "Mã bình luận không hợp lệ." },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const comment = await ArticleComment.findById(commentId).lean();

    if (!comment || comment.isDeleted) {
      return NextResponse.json(
        { error: "Không tìm thấy bình luận." },
        { status: 404 }
      );
    }

    const isOwner = comment.userId.toString() === authUser.id;
    const isAdmin = authUser.role === USER_ROLES.ADMIN;

    if (!isOwner && !isAdmin) {
      return NextResponse.json(
        { error: "Bạn không có quyền xóa bình luận của người khác." },
        { status: 403 }
      );
    }

    await ArticleComment.deleteMany({
      $or: [{ _id: comment._id }, { parentCommentId: comment._id }],
    });

    const commentCount = await ArticleComment.countDocuments({
      articleId: comment.articleId,
      isDeleted: false,
    });

    await OrientationArticle.updateOne(
      { _id: comment.articleId },
      { $set: { commentCount } }
    );

    if (isAdmin && !isOwner) {
      await logAuditAction({
        admin: {
          id: authUser.id,
          email: authUser.email,
          name: authUser.name,
        },
        action: "DELETE",
        targetCollection: "article_comments",
        targetId: comment._id,
        targetTitle: comment.content.slice(0, 80),
        changesBefore: {
          articleId: comment.articleId.toString(),
          userId: comment.userId.toString(),
          content: comment.content,
        },
        reason: "Admin kiểm duyệt xóa bình luận trên bài viết định hướng",
        req,
      });
    }

    return NextResponse.json({
      success: true,
      commentCount,
    });
  } catch (error) {
    return handleAuthError(error);
  }
}

