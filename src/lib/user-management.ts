import { NextResponse } from "next/server";
import { ClientSession, Types } from "mongoose";
import {
  ACCOUNT_STATUS,
  AccountStatus,
  ONBOARDING_STEPS,
  USER_ROLES,
  UserRole,
} from "@/constants";
import { logAuditAction } from "@/lib/audit";
import {
  destroyCloudinaryAsset,
  isCloudinaryConfigured,
} from "@/lib/cloudinary";
import { connectToDatabase } from "@/lib/db";
import { runWithOptionalTransaction } from "@/lib/mongo-helpers";
import { AuthenticatedUser, handleAuthError } from "@/lib/session";
import { revokeAllUserRefreshTokens } from "@/lib/tokens";
import { ActivityFollow } from "@/models/ActivityFollow";
import { AiOrientationAnalysis } from "@/models/AiOrientationAnalysis";
import { ArticleComment } from "@/models/ArticleComment";
import { ArticleLike } from "@/models/ArticleLike";
import { AssessmentSubmission } from "@/models/AssessmentSubmission";
import { AuditLog } from "@/models/AuditLog";
import { BookingRequest } from "@/models/BookingRequest";
import { CvDocument } from "@/models/CvDocument";
import { MediaAsset } from "@/models/MediaAsset";
import { NewsArticle } from "@/models/NewsArticle";
import { NewsBookmark } from "@/models/NewsBookmark";
import { NewsReadingHistory } from "@/models/NewsReadingHistory";
import { Notification } from "@/models/Notification";
import { OrientationArticle } from "@/models/OrientationArticle";
import { PasswordResetToken } from "@/models/PasswordResetToken";
import { Questionnaire } from "@/models/Questionnaire";
import { RefreshToken } from "@/models/RefreshToken";
import { ReminderSetting } from "@/models/ReminderSetting";
import { Roadmap } from "@/models/Roadmap";
import { StudentActivity } from "@/models/StudentActivity";
import { StudentProfile } from "@/models/StudentProfile";
import { SystemPrompt } from "@/models/SystemPrompt";
import { ToolResult } from "@/models/ToolResult";
import { IUserDocument, User } from "@/models/User";

export class UserAdminApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "UserAdminApiError";
    this.status = status;
  }
}

export function handleUserAdminError(error: unknown) {
  if (error instanceof UserAdminApiError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }
  return handleAuthError(error);
}

export function assertValidUserId(id: string): Types.ObjectId {
  if (!Types.ObjectId.isValid(id)) {
    throw new UserAdminApiError(400, "Mã tài khoản người dùng không hợp lệ.");
  }
  return new Types.ObjectId(id);
}

async function countOtherActiveAdmins(excludeId: Types.ObjectId): Promise<number> {
  return User.countDocuments({
    role: USER_ROLES.ADMIN,
    status: ACCOUNT_STATUS.ACTIVE,
    _id: { $ne: excludeId },
  });
}

async function assertNotLastActiveAdmin(targetUser: IUserDocument): Promise<void> {
  if (
    targetUser.role === USER_ROLES.ADMIN &&
    targetUser.status === ACCOUNT_STATUS.ACTIVE
  ) {
    const others = await countOtherActiveAdmins(targetUser._id);
    if (others < 1) {
      throw new UserAdminApiError(
        409,
        "Không thể thực hiện vì đây là tài khoản Quản trị viên đang hoạt động cuối cùng trong hệ thống."
      );
    }
  }
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
  cvDocuments: number;
  cmsContentCount: number;
}

export async function getUserRelatedDataSummary(
  userId: string
): Promise<UserRelatedDataSummary> {
  const objId = assertValidUserId(userId);
  const strId = objId.toString();

  const [
    studentProfiles,
    refreshTokens,
    passwordResetTokens,
    reminderSettings,
    assessmentSubmissions,
    aiOrientationAnalyses,
    roadmaps,
    activityFollows,
    notifications,
    articleLikes,
    articleComments,
    newsBookmarks,
    newsReadingHistories,
    toolResults,
    bookingRequests,
    cvDocuments,
    oriArticlesCount,
    newsArticlesCount,
    activitiesCount,
    questionnairesCount,
  ] = await Promise.all([
    StudentProfile.countDocuments({ userId: strId }),
    RefreshToken.countDocuments({ userId: objId }),
    PasswordResetToken.countDocuments({ userId: objId }),
    ReminderSetting.countDocuments({ userId: objId }),
    AssessmentSubmission.countDocuments({ studentId: objId }),
    AiOrientationAnalysis.countDocuments({ studentId: objId }),
    Roadmap.countDocuments({ studentId: objId }),
    ActivityFollow.countDocuments({ studentId: objId }),
    Notification.countDocuments({ recipientId: strId }),
    ArticleLike.countDocuments({ userId: objId }),
    ArticleComment.countDocuments({ userId: objId }),
    NewsBookmark.countDocuments({ userId: objId }),
    NewsReadingHistory.countDocuments({ userId: objId }),
    ToolResult.countDocuments({ userId: objId }),
    BookingRequest.countDocuments({ studentId: strId }),
    CvDocument.countDocuments({ userId: objId }),
    OrientationArticle.countDocuments({ createdByAdminId: objId }),
    NewsArticle.countDocuments({ createdBy: objId }),
    StudentActivity.countDocuments({ createdBy: objId }),
    Questionnaire.countDocuments({ createdByAdminId: objId }),
  ]);

  return {
    studentProfiles,
    refreshTokens,
    passwordResetTokens,
    reminderSettings,
    assessmentSubmissions,
    aiOrientationAnalyses,
    roadmaps,
    activityFollows,
    notifications,
    articleLikes,
    articleComments,
    newsBookmarks,
    newsReadingHistories,
    toolResults,
    bookingRequests,
    cvDocuments,
    cmsContentCount:
      oriArticlesCount +
      newsArticlesCount +
      activitiesCount +
      questionnairesCount,
  };
}

export async function updateUserRoleService(params: {
  targetUserId: string;
  nextRole: UserRole;
  reason: string;
  currentAdmin: AuthenticatedUser;
  req?: Request;
}) {
  await connectToDatabase();
  const targetObjId = assertValidUserId(params.targetUserId);

  if (targetObjId.toString() === params.currentAdmin.id) {
    throw new UserAdminApiError(
      400,
      "Bạn không thể tự thay đổi vai trò của tài khoản đang đăng nhập."
    );
  }

  const targetUser = await User.findById(targetObjId);
  if (!targetUser) {
    throw new UserAdminApiError(404, "Không tìm thấy tài khoản người dùng.");
  }

  if (targetUser.role === params.nextRole) {
    throw new UserAdminApiError(
      400,
      `Tài khoản ${targetUser.name} đã đang ở vai trò ${params.nextRole}.`
    );
  }

  if (
    targetUser.role === USER_ROLES.ADMIN &&
    params.nextRole !== USER_ROLES.ADMIN
  ) {
    await assertNotLastActiveAdmin(targetUser);
  }

  const previousRole = targetUser.role;
  targetUser.role = params.nextRole;

  if (params.nextRole === USER_ROLES.ADMIN) {
    targetUser.isProfileCompleted = true;
    targetUser.onboardingStep = ONBOARDING_STEPS.COMPLETED;
  } else {
    const existingProfile = await StudentProfile.exists({
      userId: targetObjId.toString(),
    });
    if (!existingProfile) {
      await StudentProfile.create({
        userId: targetObjId.toString(),
        fullName: targetUser.name,
        avatar: targetUser.avatar,
      });
    }
  }

  await targetUser.save();
  await revokeAllUserRefreshTokens(targetObjId.toString());

  await logAuditAction({
    admin: {
      id: params.currentAdmin.id,
      email: params.currentAdmin.email,
      name: params.currentAdmin.name,
    },
    action: "ROLE_CHANGE",
    targetCollection: "users",
    targetId: targetUser._id,
    targetTitle: `${targetUser.name} (${targetUser.email})`,
    changesBefore: { role: previousRole },
    changesAfter: { role: params.nextRole },
    reason: params.reason.trim(),
    req: params.req,
  });

  return {
    id: targetUser._id.toString(),
    name: targetUser.name,
    email: targetUser.email,
    role: targetUser.role,
    status: targetUser.status,
    isProfileCompleted: targetUser.isProfileCompleted,
    onboardingStep: targetUser.onboardingStep,
  };
}

export async function updateUserStatusService(params: {
  targetUserId: string;
  nextStatus: AccountStatus;
  reason?: string;
  currentAdmin: AuthenticatedUser;
  req?: Request;
}) {
  await connectToDatabase();
  const targetObjId = assertValidUserId(params.targetUserId);

  if (
    targetObjId.toString() === params.currentAdmin.id &&
    params.nextStatus === ACCOUNT_STATUS.DISABLED
  ) {
    throw new UserAdminApiError(
      400,
      "Bạn không thể tự khóa tài khoản Quản trị viên đang đăng nhập."
    );
  }

  const targetUser = await User.findById(targetObjId);
  if (!targetUser) {
    throw new UserAdminApiError(404, "Không tìm thấy tài khoản người dùng.");
  }

  if (params.nextStatus === ACCOUNT_STATUS.DISABLED) {
    await assertNotLastActiveAdmin(targetUser);
  }

  const previousStatus = targetUser.status;
  targetUser.status = params.nextStatus;
  await targetUser.save();

  if (params.nextStatus === ACCOUNT_STATUS.DISABLED) {
    await revokeAllUserRefreshTokens(targetObjId.toString());
  }

  await logAuditAction({
    admin: {
      id: params.currentAdmin.id,
      email: params.currentAdmin.email,
      name: params.currentAdmin.name,
    },
    action:
      params.nextStatus === ACCOUNT_STATUS.DISABLED
        ? "LOCK_ACCOUNT"
        : "UNLOCK_ACCOUNT",
    targetCollection: "users",
    targetId: targetUser._id,
    targetTitle: `${targetUser.name} (${targetUser.email})`,
    changesBefore: { status: previousStatus },
    changesAfter: { status: params.nextStatus },
    reason:
      params.reason?.trim() ||
      (params.nextStatus === ACCOUNT_STATUS.ACTIVE
        ? "Admin mở khóa tài khoản"
        : "Admin khóa tài khoản"),
    req: params.req,
  });

  return {
    id: targetUser._id.toString(),
    name: targetUser.name,
    email: targetUser.email,
    role: targetUser.role,
    status: targetUser.status,
  };
}

function countDocsByIdField(
  docs: Array<Record<string, unknown>>,
  field: string
): Map<string, number> {
  const counts = new Map<string, number>();
  for (const doc of docs) {
    const raw = doc[field];
    if (!raw) continue;
    const key = String(raw);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return counts;
}

async function recalculateAffectedCounters(params: {
  activityRemovedCounts: Map<string, number>;
  articleLikeRemovedCounts: Map<string, number>;
  commentArticleIds: string[];
  newsBookmarkRemovedCounts: Map<string, number>;
  session: ClientSession | null;
}) {
  const opts = params.session ? { session: params.session } : undefined;
  const attachSession = <T>(query: { session: (s: ClientSession | null) => T }) =>
    params.session ? query.session(params.session) : (query as unknown as T);

  for (const [actIdStr, removedCount] of params.activityRemovedCounts) {
    const actId = new Types.ObjectId(actIdStr);
    const [activityDoc, realCount] = await Promise.all([
      attachSession(StudentActivity.findById(actId).select("followerCount").lean()),
      attachSession(ActivityFollow.countDocuments({ activityId: actId })),
    ]);
    const nextFollowerCount = Math.max(
      realCount,
      (activityDoc?.followerCount ?? 0) - removedCount
    );
    await StudentActivity.updateOne(
      { _id: actId },
      { $set: { followerCount: nextFollowerCount } },
      opts
    );
  }

  const allOrientationArticleIds = Array.from(
    new Set([...params.articleLikeRemovedCounts.keys(), ...params.commentArticleIds])
  );
  const commentArticleSet = new Set(params.commentArticleIds);

  for (const artIdStr of allOrientationArticleIds) {
    const artId = new Types.ObjectId(artIdStr);
    const removedLikes = params.articleLikeRemovedCounts.get(artIdStr) ?? 0;
    const hasLikeChange = params.articleLikeRemovedCounts.has(artIdStr);
    const hasCommentChange = commentArticleSet.has(artIdStr);

    const [articleDoc, realLikes, realComments] = await Promise.all([
      hasLikeChange
        ? attachSession(OrientationArticle.findById(artId).select("likeCount").lean())
        : Promise.resolve(null),
      hasLikeChange
        ? attachSession(ArticleLike.countDocuments({ articleId: artId }))
        : Promise.resolve(0),
      hasCommentChange
        ? attachSession(
            ArticleComment.countDocuments({ articleId: artId, isDeleted: false })
          )
        : Promise.resolve(0),
    ]);

    const updateSet: Record<string, number> = {};
    if (hasLikeChange) {
      updateSet.likeCount = Math.max(
        realLikes,
        (articleDoc?.likeCount ?? 0) - removedLikes
      );
    }
    if (hasCommentChange) {
      updateSet.commentCount = realComments;
    }

    if (Object.keys(updateSet).length > 0) {
      await OrientationArticle.updateOne(
        { _id: artId },
        { $set: updateSet },
        opts
      );
    }
  }

  for (const [newsIdStr, removedCount] of params.newsBookmarkRemovedCounts) {
    const newsId = new Types.ObjectId(newsIdStr);
    const [newsDoc, realCount] = await Promise.all([
      attachSession(NewsArticle.findById(newsId).select("bookmarkCount").lean()),
      attachSession(NewsBookmark.countDocuments({ articleId: newsId })),
    ]);
    const nextBookmarkCount = Math.max(
      realCount,
      (newsDoc?.bookmarkCount ?? 0) - removedCount
    );
    await NewsArticle.updateOne(
      { _id: newsId },
      { $set: { bookmarkCount: nextBookmarkCount } },
      opts
    );
  }
}

export async function cascadeDeleteUserService(params: {
  targetUserId: string;
  confirmEmail: string;
  reason: string;
  currentAdmin: AuthenticatedUser;
  req?: Request;
}) {
  await connectToDatabase();
  const targetObjId = assertValidUserId(params.targetUserId);
  const strId = targetObjId.toString();

  if (strId === params.currentAdmin.id) {
    throw new UserAdminApiError(
      400,
      "Bạn không thể tự xóa vĩnh viễn tài khoản đang đăng nhập."
    );
  }

  const targetUser = await User.findById(targetObjId);
  if (!targetUser) {
    throw new UserAdminApiError(404, "Không tìm thấy tài khoản người dùng.");
  }

  if (
    params.confirmEmail.trim().toLowerCase() !==
    targetUser.email.trim().toLowerCase()
  ) {
    throw new UserAdminApiError(
      400,
      "Email xác nhận không khớp với email của tài khoản cần xóa."
    );
  }

  await assertNotLastActiveAdmin(targetUser);

  const summaryBeforeDelete = await getUserRelatedDataSummary(strId);

  const removableAssets = await MediaAsset.find({
    uploadedBy: targetObjId,
    $or: [{ usedBy: { $size: 0 } }, { usedBy: { $exists: false } }],
  })
    .select("publicId resourceType")
    .lean();

  const targetEmailLower = targetUser.email.toLowerCase();
  const targetSnapshot = {
    name: targetUser.name,
    email: targetUser.email,
    role: targetUser.role,
    status: targetUser.status,
  };

  await runWithOptionalTransaction(async (session) => {
    const opts = session ? { session } : undefined;
    const withSession = <T>(query: { session: (s: ClientSession | null) => T }) =>
      session ? query.session(session) : (query as unknown as T);

    const [
      followedActivityDocs,
      likedArticleDocs,
      userComments,
      bookmarkedNewsDocs,
    ] = await Promise.all([
      withSession(
        ActivityFollow.find({ studentId: targetObjId }).select("activityId").lean()
      ),
      withSession(
        ArticleLike.find({ userId: targetObjId }).select("articleId").lean()
      ),
      withSession(
        ArticleComment.find({ userId: targetObjId }).select("_id articleId").lean()
      ),
      withSession(
        NewsBookmark.find({ userId: targetObjId }).select("articleId").lean()
      ),
    ]);

    const userCommentIds = userComments.map((c) => c._id);
    const childReplyArticles = userCommentIds.length
      ? await withSession(
          ArticleComment.find({
            parentCommentId: { $in: userCommentIds },
          })
            .select("articleId")
            .lean()
        )
      : [];

    const activityRemovedCounts = countDocsByIdField(
      followedActivityDocs as unknown as Array<Record<string, unknown>>,
      "activityId"
    );
    const articleLikeRemovedCounts = countDocsByIdField(
      likedArticleDocs as unknown as Array<Record<string, unknown>>,
      "articleId"
    );
    const newsBookmarkRemovedCounts = countDocsByIdField(
      bookmarkedNewsDocs as unknown as Array<Record<string, unknown>>,
      "articleId"
    );
    const commentArticleIds = Array.from(
      new Set([
        ...userComments.map((c) => String(c.articleId)),
        ...childReplyArticles.map((c) => String(c.articleId)),
      ])
    );

    await Promise.all([
      RefreshToken.deleteMany({ userId: targetObjId }, opts),
      PasswordResetToken.deleteMany(
        { $or: [{ userId: targetObjId }, { email: targetEmailLower }] },
        opts
      ),
      StudentProfile.deleteMany({ userId: strId }, opts),
      ReminderSetting.deleteMany({ userId: targetObjId }, opts),
      AssessmentSubmission.deleteMany({ studentId: targetObjId }, opts),
      AiOrientationAnalysis.deleteMany({ studentId: targetObjId }, opts),
      Roadmap.deleteMany({ studentId: targetObjId }, opts),
      ActivityFollow.deleteMany({ studentId: targetObjId }, opts),
      Notification.deleteMany({ recipientId: strId }, opts),
      ArticleLike.deleteMany({ userId: targetObjId }, opts),
      ArticleComment.deleteMany(
        userCommentIds.length
          ? {
              $or: [
                { userId: targetObjId },
                { parentCommentId: { $in: userCommentIds } },
              ],
            }
          : { userId: targetObjId },
        opts
      ),
      NewsBookmark.deleteMany({ userId: targetObjId }, opts),
      NewsReadingHistory.deleteMany({ userId: targetObjId }, opts),
      ToolResult.deleteMany({ userId: targetObjId }, opts),
      BookingRequest.deleteMany({ studentId: strId }, opts),
      CvDocument.deleteMany({ userId: targetObjId }, opts),
      MediaAsset.deleteMany(
        {
          uploadedBy: targetObjId,
          $or: [{ usedBy: { $size: 0 } }, { usedBy: { $exists: false } }],
        },
        opts
      ),
    ]);

    await recalculateAffectedCounters({
      activityRemovedCounts,
      articleLikeRemovedCounts,
      commentArticleIds,
      newsBookmarkRemovedCounts,
      session,
    });

    await Promise.all([
      MediaAsset.updateMany(
        { uploadedBy: targetObjId },
        { $set: { uploadedBy: null } },
        opts
      ),
      OrientationArticle.updateMany(
        { createdByAdminId: targetObjId },
        { $set: { createdByAdminId: null } },
        opts
      ),
      NewsArticle.updateMany(
        { createdBy: targetObjId },
        { $set: { createdBy: null } },
        opts
      ),
      NewsArticle.updateMany(
        { updatedByAdminId: targetObjId },
        { $set: { updatedByAdminId: null } },
        opts
      ),
      StudentActivity.updateMany(
        { createdBy: targetObjId },
        { $set: { createdBy: null } },
        opts
      ),
      StudentActivity.updateMany(
        { updatedByAdminId: targetObjId },
        { $set: { updatedByAdminId: null } },
        opts
      ),
      Questionnaire.updateMany(
        { createdByAdminId: targetObjId },
        { $set: { createdByAdminId: null } },
        opts
      ),
      SystemPrompt.updateMany(
        { updatedByAdminId: targetObjId },
        { $set: { updatedByAdminId: null } },
        opts
      ),
      AuditLog.updateMany(
        { adminId: targetObjId },
        {
          $set: {
            adminId: null,
            adminEmail: "deleted-user@system.local",
            adminName: "Tài khoản đã xóa",
          },
        },
        opts
      ),
    ]);

    await User.deleteOne({ _id: targetObjId }, opts);
  });

  if (removableAssets.length > 0 && isCloudinaryConfigured()) {
    await Promise.allSettled(
      removableAssets.map((asset) =>
        destroyCloudinaryAsset(asset.publicId, asset.resourceType)
      )
    );
  }

  await logAuditAction({
    admin: {
      id: params.currentAdmin.id,
      email: params.currentAdmin.email,
      name: params.currentAdmin.name,
    },
    action: "DELETE",
    targetCollection: "users",
    targetId: targetObjId,
    targetTitle: `${targetSnapshot.name} (${targetSnapshot.email})`,
    changesBefore: {
      ...targetSnapshot,
      relatedDataSummary: summaryBeforeDelete,
    },
    changesAfter: { deleted: true },
    reason: params.reason.trim(),
    req: params.req,
  });

  return {
    target: targetSnapshot,
    deletedCounts: summaryBeforeDelete,
  };
}
