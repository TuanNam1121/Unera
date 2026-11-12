import { NextRequest, NextResponse } from "next/server";
import { connection } from "next/server";
import { NOTIFICATION_CHANNELS } from "@/constants";
import { connectToDatabase } from "@/lib/db";
import { triggerLightUserReminderSync } from "@/lib/notifications";
import { handleAuthError, requireAuth } from "@/lib/session";
import { Notification } from "@/models/Notification";

export async function GET(req: NextRequest) {
  await connection();

  try {
    const user = await requireAuth(req);
    await connectToDatabase();
    await triggerLightUserReminderSync(user.id);

    const unreadCount = await Notification.countDocuments({
      recipientId: user.id,
      channel: NOTIFICATION_CHANNELS.IN_APP,
      isRead: false,
    });

    return NextResponse.json({
      success: true,
      unreadCount,
    });
  } catch (error) {
    return handleAuthError(error);
  }
}

