import { NextRequest, NextResponse } from "next/server";
import { NOTIFICATION_CHANNELS } from "@/constants";
import { connectToDatabase } from "@/lib/db";
import { handleAuthError, requireAuth } from "@/lib/session";
import { Notification } from "@/models/Notification";

export async function PATCH(req: NextRequest) {
  try {
    const user = await requireAuth(req);
    await connectToDatabase();

    const result = await Notification.updateMany(
      {
        recipientId: user.id,
        channel: NOTIFICATION_CHANNELS.IN_APP,
        isRead: false,
      },
      {
        $set: {
          isRead: true,
          readAt: new Date(),
        },
      }
    );

    return NextResponse.json({
      success: true,
      modifiedCount: result.modifiedCount || 0,
      unreadCount: 0,
      message: "Đã đánh dấu tất cả thông báo là đã đọc",
    });
  } catch (error) {
    return handleAuthError(error);
  }
}

