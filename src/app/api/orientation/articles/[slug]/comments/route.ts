import { NextResponse, connection } from "next/server";
import { Types } from "mongoose";
import { ORIENTATION_ARTICLE_STATUS, USER_ROLES } from "@/constants";
import { connectToDatabase } from "@/lib/db";
import {
  getCurrentUser,
  handleAuthError,
  requireAuth,
} from "@/lib/session";
import { ArticleComment } from "@/models/ArticleComment";
import { OrientationArticle } from "@/models/OrientationArticle";
import { StudentProfile } from "@/models/StudentProfile";
import type { IArticleCommentDTO } from "@/types";
import { createArticleCommentSchema } from "@/validations";

interface RawCommentDoc {
  _id: Types.ObjectId;
  articleId: Types.ObjectId;
  userId: Types.ObjectId;
  authorName: string;
  authorAvatar?: string;
  authorUniversity?: string;
  authorMajor?: string;
  parentCommentId: Types.ObjectId | null;
  content: string;
  isEdited: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface AuthorProfileMeta {
  fullName?: string;
  university?: string;
  major?: string;
}

function serializeComment(
  doc: RawCommentDoc,
  currentUserId: string | null,
  isAdmin: boolean,
  profileByUserId?: Map<string, AuthorProfileMeta>,
  replies?: IArticleCommentDTO[]
): IArticleCommentDTO {
  const ownerId = doc.userId.toString();
  const isOwner = Boolean(currentUserId && ownerId === currentUserId);
  const profile = profileByUserId?.get(ownerId);
  return {
    _id: doc._id.toString(),
    articleId: doc.articleId.toString(),
    content: doc.content,
    parentCommentId: doc.parentCommentId ? doc.parentCommentId.toString() : null,
    user: {
      id: ownerId,
      name: profile?.fullName?.trim() || doc.authorName,
      avatar: doc.authorAvatar || "",
      university: profile?.university?.trim() || doc.authorUniversity || "",
      major: profile?.major?.trim() || doc.authorMajor || "",
    },
    isEdited: Boolean(doc.isEdited),
    isOwner,
    canDelete: isOwner || isAdmin,
    createdAt:
      doc.createdAt instanceof Date
        ? doc.createdAt.toISOString()
        : String(doc.createdAt),
    updatedAt:
      doc.updatedAt instanceof Date
        ? doc.updatedAt.toISOString()
        : String(doc.updatedAt),
    replies,
  };
}

/**
 * GET /api/orientation/articles/[slug]/comments
 * Lấy danh sách bình luận phân trang (lồng tối đa 1 cấp reply)
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  await connection();

  try {
    const { slug } = await params;
    const normalizedSlug = slug.trim().toLowerCase();
    const { searchParams } = new URL(req.url);

    const parsedPage = Number.parseInt(searchParams.get("page") || "1", 10);
    const parsedLimit = Number.parseInt(searchParams.get("limit") || "10", 10);
    const page = Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : 1;
    const limit =
      Number.isFinite(parsedLimit) && parsedLimit > 0
        ? Math.min(parsedLimit, 30)
        : 10;

    await connectToDatabase();

    const article = await OrientationArticle.findOne({
      slug: normalizedSlug,
      status: ORIENTATION_ARTICLE_STATUS.PUBLISHED,
    })
      .select("_id commentCount")
      .lean();

    if (!article) {
      return NextResponse.json(
        { error: "Không tìm thấy bài viết định hướng." },
        { status: 404 }
      );
    }

    let currentUser = null;
    try {
      currentUser = await getCurrentUser(req);
    } catch {
      currentUser = null;
    }

    const currentUserId = currentUser?.id || null;
    const isAdmin = currentUser?.role === USER_ROLES.ADMIN;

    const topFilter = {
      articleId: article._id,
      parentCommentId: null,
      isDeleted: false,
    };

    const [topComments, totalTop] = await Promise.all([
      ArticleComment.find(topFilter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean<RawCommentDoc[]>(),
      ArticleComment.countDocuments(topFilter),
    ]);

    const topIds = topComments.map((c) => c._id);
    const replyDocs =
      topIds.length > 0
        ? await ArticleComment.find({
            articleId: article._id,
            parentCommentId: { $in: topIds },
            isDeleted: false,
          })
            .sort({ createdAt: 1 })
            .lean<RawCommentDoc[]>()
        : [];

    const authorIds = Array.from(
      new Set([
        ...topComments.map((c) => c.userId.toString()),
        ...replyDocs.map((r) => r.userId.toString()),
      ])
    );

    const profileDocs =
      authorIds.length > 0
        ? await StudentProfile.find({ userId: { $in: authorIds } })
            .select("userId fullName university major")
            .lean<
              Array<{
                userId: string;
                fullName?: string;
                university?: string;
                major?: string;
              }>
            >()
        : [];

    const profileByUserId = new Map<string, AuthorProfileMeta>();
    for (const p of profileDocs) {
      profileByUserId.set(p.userId, {
        fullName: p.fullName,
        university: p.university,
        major: p.major,
      });
    }

    const repliesByParent = new Map<string, IArticleCommentDTO[]>();
    for (const r of replyDocs) {
      if (!r.parentCommentId) continue;
      const parentKey = r.parentCommentId.toString();
      const list = repliesByParent.get(parentKey) || [];
      list.push(serializeComment(r, currentUserId, isAdmin, profileByUserId));
      repliesByParent.set(parentKey, list);
    }

    const comments = topComments.map((c) =>
      serializeComment(
        c,
        currentUserId,
        isAdmin,
        profileByUserId,
        repliesByParent.get(c._id.toString()) || []
      )
    );

    return NextResponse.json({
      success: true,
      comments,
      pagination: {
        page,
        limit,
        total: totalTop,
        totalPages: Math.max(1, Math.ceil(totalTop / limit)),
      },
      totalCount: article.commentCount || 0,
    });
  } catch (error) {
    console.error("GET /api/orientation/articles/[slug]/comments error:", error);
    return NextResponse.json(
      { error: "Không thể tải bình luận." },
      { status: 500 }
    );
  }
}

/**
 * POST /api/orientation/articles/[slug]/comments
 * Tạo bình luận mới hoặc trả lời bình luận gốc (tối đa 1 cấp lồng)
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const authUser = await requireAuth(req);
    const { slug } = await params;
    const normalizedSlug = slug.trim().toLowerCase();

    const body = await req.json();
    const parsed = createArticleCommentSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error:
            parsed.error.issues[0]?.message ||
            "Nội dung bình luận không hợp lệ.",
        },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const article = await OrientationArticle.findOne({
      slug: normalizedSlug,
      status: ORIENTATION_ARTICLE_STATUS.PUBLISHED,
    })
      .select("_id")
      .lean();

    if (!article) {
      return NextResponse.json(
        { error: "Không tìm thấy bài viết định hướng." },
        { status: 404 }
      );
    }

    let parentObjectId: Types.ObjectId | null = null;
    if (parsed.data.parentCommentId) {
      if (!Types.ObjectId.isValid(parsed.data.parentCommentId)) {
        return NextResponse.json(
          { error: "Mã bình luận gốc không hợp lệ." },
          { status: 400 }
        );
      }

      const parentComment = await ArticleComment.findOne({
        _id: parsed.data.parentCommentId,
        articleId: article._id,
        isDeleted: false,
      })
        .select("_id parentCommentId")
        .lean();

      if (!parentComment) {
        return NextResponse.json(
          { error: "Không tìm thấy bình luận gốc để trả lời." },
          { status: 404 }
        );
      }

      if (parentComment.parentCommentId) {
        return NextResponse.json(
          { error: "Chỉ hỗ trợ trả lời trực tiếp cho bình luận gốc (1 cấp)." },
          { status: 400 }
        );
      }

      parentObjectId = parentComment._id;
    }

    const authorProfile = await StudentProfile.findOne({ userId: authUser.id })
      .select("fullName university major")
      .lean<{
        fullName?: string;
        university?: string;
        major?: string;
      } | null>();

    const created = await ArticleComment.create({
      articleId: article._id,
      userId: new Types.ObjectId(authUser.id),
      authorName: authorProfile?.fullName?.trim() || authUser.name,
      authorAvatar: authUser.image || "",
      authorUniversity: authorProfile?.university?.trim() || "",
      authorMajor: authorProfile?.major?.trim() || "",
      parentCommentId: parentObjectId,
      content: parsed.data.content,
    });

    const commentCount = await ArticleComment.countDocuments({
      articleId: article._id,
      isDeleted: false,
    });

    await OrientationArticle.updateOne(
      { _id: article._id },
      { $set: { commentCount } }
    );

    const dto = serializeComment(
      created.toObject() as unknown as RawCommentDoc,
      authUser.id,
      authUser.role === USER_ROLES.ADMIN,
      undefined,
      parentObjectId ? undefined : []
    );

    return NextResponse.json(
      {
        success: true,
        comment: dto,
        commentCount,
      },
      { status: 201 }
    );
  } catch (error) {
    return handleAuthError(error);
  }
}
