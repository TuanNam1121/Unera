import { NextRequest, NextResponse } from "next/server";
import { connection } from "next/server";
import { Types } from "mongoose";
import { ACTIVITY_PUBLISH_STATUS, USER_ROLES } from "@/constants";
import { connectToDatabase } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { RawActivityDoc, serializeStudentActivity } from "@/lib/activities";
import { StudentActivity } from "@/models/StudentActivity";
import { ActivityFollow } from "@/models/ActivityFollow";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ idOrSlug: string }> }
) {
  await connection();

  try {
    await connectToDatabase();
    const { idOrSlug } = await params;
    const currentUser = await getCurrentUser(req);

    const matchByIdOrSlug = Types.ObjectId.isValid(idOrSlug)
      ? { $or: [{ _id: new Types.ObjectId(idOrSlug) }, { slug: idOrSlug }] }
      : { slug: idOrSlug };

    const isAdmin = currentUser?.role === USER_ROLES.ADMIN;
    const query = isAdmin
      ? matchByIdOrSlug
      : {
          ...matchByIdOrSlug,
          publishStatus: ACTIVITY_PUBLISH_STATUS.PUBLISHED,
        };

    const activityDoc = (await StudentActivity.findOne(query)
      .populate("categoryId", "name slug colorToken icon")
      .lean()) as unknown as RawActivityDoc | null;

    if (!activityDoc) {
      return NextResponse.json(
        { error: "Không tìm thấy hoạt động sinh viên" },
        { status: 404 }
      );
    }

    // Increment viewCount only when viewing a published activity
    let updatedViewCount =
      typeof activityDoc.viewCount === "number" ? activityDoc.viewCount : 0;
    if (activityDoc.publishStatus === ACTIVITY_PUBLISH_STATUS.PUBLISHED) {
      await StudentActivity.updateOne(
        { _id: activityDoc._id },
        { $inc: { viewCount: 1 } }
      );
      updatedViewCount += 1;
    }

    let followedIds = new Set<string>();
    let followPreferences: {
      notifyDeadline: boolean;
      notifyEvent: boolean;
    } | null = null;

    if (currentUser && Types.ObjectId.isValid(currentUser.id)) {
      const followDoc = await ActivityFollow.findOne({
        studentId: new Types.ObjectId(currentUser.id),
        activityId: new Types.ObjectId(activityDoc._id.toString()),
      }).lean();

      if (followDoc) {
        followedIds = new Set([activityDoc._id.toString()]);
        followPreferences = {
          notifyDeadline: followDoc.notifyDeadline !== false,
          notifyEvent: followDoc.notifyEvent !== false,
        };
      }
    }

    const now = new Date();
    const activity = serializeStudentActivity(
      { ...activityDoc, viewCount: updatedViewCount },
      {
        followedIds,
        includeContent: true,
        now,
        followPreferences,
      }
    );

    // Related activities in the same category
    const categoryId =
      typeof activityDoc.categoryId === "object" &&
      activityDoc.categoryId !== null &&
      "_id" in activityDoc.categoryId
        ? activityDoc.categoryId._id
        : activityDoc.categoryId;

    const relatedRaw = categoryId
      ? ((await StudentActivity.find({
          _id: { $ne: activityDoc._id },
          categoryId,
          publishStatus: ACTIVITY_PUBLISH_STATUS.PUBLISHED,
          manualClosed: { $ne: true },
        })
          .sort({ followerCount: -1, deadline: 1, publishedAt: -1 })
          .limit(3)
          .populate("categoryId", "name slug colorToken icon")
          .lean()) as unknown as RawActivityDoc[])
      : [];

    const relatedIds =
      currentUser && relatedRaw.length > 0 && Types.ObjectId.isValid(currentUser.id)
        ? new Set(
            (
              await ActivityFollow.find({
                studentId: new Types.ObjectId(currentUser.id),
                activityId: { $in: relatedRaw.map((r) => r._id) },
              })
                .select("activityId")
                .lean()
            ).map((f) => f.activityId.toString())
          )
        : new Set<string>();

    const relatedActivities = relatedRaw.map((doc) =>
      serializeStudentActivity(doc, { followedIds: relatedIds, now })
    );

    return NextResponse.json({
      success: true,
      activity,
      relatedActivities,
    });
  } catch (error) {
    console.error("GET /api/activities/[idOrSlug] error:", error);
    return NextResponse.json(
      { error: "Lỗi khi tải chi tiết hoạt động" },
      { status: 500 }
    );
  }
}

