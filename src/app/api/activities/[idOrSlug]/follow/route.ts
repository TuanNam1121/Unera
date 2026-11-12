import { NextRequest, NextResponse } from "next/server";
import { Types } from "mongoose";
import { ACTIVITY_PUBLISH_STATUS } from "@/constants";
import { connectToDatabase } from "@/lib/db";
import { handleAuthError, requireAuth } from "@/lib/session";
import { revalidateActivityRoutes } from "@/lib/activities";
import { logUserActivity } from "@/lib/user-activity-log";
import { followActivitySchema } from "@/validations";
import { StudentActivity } from "@/models/StudentActivity";
import { ActivityFollow } from "@/models/ActivityFollow";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ idOrSlug: string }> }
) {
  try {
    const user = await requireAuth(req);
    await connectToDatabase();
    const { idOrSlug: id } = await params;

    if (!Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: "ID hoạt động không hợp lệ" },
        { status: 400 }
      );
    }

    let notifyDeadline = true;
    let notifyEvent = true;
    try {
      const body = await req.json();
      const parsed = followActivitySchema.safeParse(body);
      if (parsed.success) {
        if (typeof parsed.data.notifyDeadline === "boolean") {
          notifyDeadline = parsed.data.notifyDeadline;
        }
        if (typeof parsed.data.notifyEvent === "boolean") {
          notifyEvent = parsed.data.notifyEvent;
        }
      }
    } catch {
      // Optional empty JSON body is valid
    }

    const activityObjId = new Types.ObjectId(id);
    const studentObjId = new Types.ObjectId(user.id);

    const activity = await StudentActivity.findById(activityObjId);
    if (
      !activity ||
      activity.publishStatus !== ACTIVITY_PUBLISH_STATUS.PUBLISHED
    ) {
      return NextResponse.json(
        { error: "Không tìm thấy hoạt động đang mở để quan tâm" },
        { status: 404 }
      );
    }

    const existing = await ActivityFollow.findOne({
      studentId: studentObjId,
      activityId: activityObjId,
    });

    let updatedFollowerCount = activity.followerCount || 0;
    let savedFollow = existing;

    if (!existing) {
      try {
        savedFollow = await ActivityFollow.create({
          studentId: studentObjId,
          activityId: activityObjId,
          notifyDeadline,
          notifyEvent,
        });
        const updatedActivity = await StudentActivity.findByIdAndUpdate(
          activityObjId,
          { $inc: { followerCount: 1 } },
          { returnDocument: "after" }
        ).select("followerCount slug");
        updatedFollowerCount =
          updatedActivity?.followerCount ?? updatedFollowerCount + 1;
      } catch (err: unknown) {
        const isDuplicate =
          typeof err === "object" &&
          err !== null &&
          "code" in err &&
          (err as { code?: number }).code === 11000;
        if (!isDuplicate) throw err;
        savedFollow = await ActivityFollow.findOne({
          studentId: studentObjId,
          activityId: activityObjId,
        });
      }
    }

    revalidateActivityRoutes(activity.slug);

    if (!existing) {
      await logUserActivity({
        req,
        actorId: user.id,
        actorEmail: user.email,
        actorName: user.name,
        actorRole: user.role,
        category: "ACTIVITY",
        action: "ACTIVITY_FOLLOW",
        description: `Theo dõi hoạt động "${activity.title}"`,
        status: "SUCCESS",
        statusCode: 200,
        targetCollection: "student_activities",
        targetId: activityObjId.toString(),
        targetTitle: activity.title,
        metadata: { notifyDeadline, notifyEvent, slug: activity.slug },
      });
    }

    return NextResponse.json({
      success: true,
      isFollowed: true,
      followerCount: updatedFollowerCount,
      followPreferences: {
        notifyDeadline: savedFollow?.notifyDeadline ?? notifyDeadline,
        notifyEvent: savedFollow?.notifyEvent ?? notifyEvent,
      },
      message: "Đã thêm hoạt động vào danh sách quan tâm",
    });
  } catch (error) {
    return handleAuthError(error);
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ idOrSlug: string }> }
) {
  try {
    const user = await requireAuth(req);
    await connectToDatabase();
    const { idOrSlug: id } = await params;

    if (!Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: "ID hoạt động không hợp lệ" },
        { status: 400 }
      );
    }

    const body = await req.json();
    const parsed = followActivitySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Tùy chọn thông báo không hợp lệ",
          details: parsed.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const updateSet: Record<string, boolean> = {};
    if (typeof parsed.data.notifyDeadline === "boolean") {
      updateSet.notifyDeadline = parsed.data.notifyDeadline;
    }
    if (typeof parsed.data.notifyEvent === "boolean") {
      updateSet.notifyEvent = parsed.data.notifyEvent;
    }

    const updated = await ActivityFollow.findOneAndUpdate(
      {
        studentId: new Types.ObjectId(user.id),
        activityId: new Types.ObjectId(id),
      },
      { $set: updateSet },
      { returnDocument: "after" }
    );

    if (!updated) {
      return NextResponse.json(
        { error: "Bạn chưa theo dõi hoạt động này" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      followPreferences: {
        notifyDeadline: updated.notifyDeadline,
        notifyEvent: updated.notifyEvent,
      },
    });
  } catch (error) {
    return handleAuthError(error);
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ idOrSlug: string }> }
) {
  try {
    const user = await requireAuth(req);
    await connectToDatabase();
    const { idOrSlug: id } = await params;

    if (!Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: "ID hoạt động không hợp lệ" },
        { status: 400 }
      );
    }

    const activityObjId = new Types.ObjectId(id);
    const studentObjId = new Types.ObjectId(user.id);

    const deleted = await ActivityFollow.findOneAndDelete({
      studentId: studentObjId,
      activityId: activityObjId,
    });

    let updatedFollowerCount = 0;
    let activitySlug: string | undefined;

    if (deleted) {
      const updated = await StudentActivity.findOneAndUpdate(
        { _id: activityObjId, followerCount: { $gt: 0 } },
        { $inc: { followerCount: -1 } },
        { returnDocument: "after" }
      ).select("followerCount slug");
      if (updated) {
        updatedFollowerCount = updated.followerCount;
        activitySlug = updated.slug;
      } else {
        const current = await StudentActivity.findById(activityObjId)
          .select("followerCount slug")
          .lean();
        updatedFollowerCount = current?.followerCount || 0;
        activitySlug = current?.slug;
      }
    } else {
      const current = await StudentActivity.findById(activityObjId)
        .select("followerCount slug")
        .lean();
      if (!current) {
        return NextResponse.json(
          { error: "Không tìm thấy hoạt động" },
          { status: 404 }
        );
      }
      updatedFollowerCount = current.followerCount || 0;
      activitySlug = current.slug;
    }

    revalidateActivityRoutes(activitySlug);

    return NextResponse.json({
      success: true,
      isFollowed: false,
      followerCount: updatedFollowerCount,
      message: "Đã bỏ quan tâm hoạt động",
    });
  } catch (error) {
    return handleAuthError(error);
  }
}

