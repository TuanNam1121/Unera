import { NextRequest, NextResponse } from "next/server";
import { Types } from "mongoose";
import { NOTIFICATION_CHANNELS } from "@/constants";
import { connectToDatabase } from "@/lib/db";
import { RawNotificationDoc, serializeNotification } from "@/lib/notifications";
import { handleAuthError, requireAuth } from "@/lib/session";
import { Notification } from "@/models/Notification";
import { updateNotificationReadSchema } from "@/validations";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(req);
    await connectToDatabase();
    const { id } = await params;

    if (!Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: "ID thông báo không hợp lệ" },
        { status: 400 }
      );
    }

    const body = await req.json();
    const parsed = updateNotificationReadSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Dữ liệu cập nhật trạng thái thông báo không hợp lệ",
          details: parsed.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { isRead } = parsed.data;
    const updated = (await Notification.findOneAndUpdate(
      {
        _id: new Types.ObjectId(id),
        recipientId: user.id,
      },
      {
        $set: {
          isRead,
          readAt: isRead ? new Date() : null,
        },
      },
      { returnDocument: "after" }
    ).lean()) as unknown as RawNotificationDoc | null;

    if (!updated) {
      return NextResponse.json(
        { error: "Không tìm thấy thông báo hoặc bạn không có quyền thao tác" },
        { status: 404 }
      );
    }

    const unreadCount = await Notification.countDocuments({
      recipientId: user.id,
      channel: NOTIFICATION_CHANNELS.IN_APP,
      isRead: false,
    });

    return NextResponse.json({
      success: true,
      notification: serializeNotification(updated),
      unreadCount,
    });
  } catch (error) {
    return handleAuthError(error);
  }
}

