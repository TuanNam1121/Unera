import { NextRequest, NextResponse } from "next/server";
import { connection } from "next/server";
import { NOTIFICATION_CHANNELS } from "@/constants";
import { connectToDatabase } from "@/lib/db";
import {
  RawNotificationDoc,
  serializeNotification,
  triggerLightUserReminderSync,
} from "@/lib/notifications";
import { resolveNotificationTypeFilter } from "@/lib/notifications-utils";
import { handleAuthError, requireAuth } from "@/lib/session";
import { Notification } from "@/models/Notification";

export async function GET(req: NextRequest) {
  await connection();

  try {
    const user = await requireAuth(req);
    await connectToDatabase();
    await triggerLightUserReminderSync(user.id);

    const { searchParams } = new URL(req.url);
    const filter = (searchParams.get("filter") || "all").trim().toLowerCase();
    const rawType = searchParams.get("type");
    const page = Math.max(
      1,
      parseInt(searchParams.get("page") || "1", 10) || 1
    );
    const limit = Math.min(
      50,
      Math.max(1, parseInt(searchParams.get("limit") || "20", 10) || 20)
    );
    const skip = (page - 1) * limit;

    const query: Record<string, unknown> = {
      recipientId: user.id,
      channel: NOTIFICATION_CHANNELS.IN_APP,
    };

    if (filter === "unread") {
      query.isRead = false;
    }

    const typeFilter = resolveNotificationTypeFilter(rawType);
    if (typeFilter && typeFilter.length === 1) {
      query.type = typeFilter[0];
    } else if (typeFilter && typeFilter.length > 1) {
      query.type = { $in: typeFilter };
    }

    const [total, unreadCount, rawDocs] = await Promise.all([
      Notification.countDocuments(query),
      Notification.countDocuments({
        recipientId: user.id,
        channel: NOTIFICATION_CHANNELS.IN_APP,
        isRead: false,
      }),
      Notification.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean() as Promise<unknown[]>,
    ]);

    const totalPages = total === 0 ? 0 : Math.ceil(total / limit);

    return NextResponse.json({
      success: true,
      notifications: (rawDocs as RawNotificationDoc[]).map((doc) =>
        serializeNotification(doc)
      ),
      unreadCount,
      total,
      page,
      totalPages,
      pagination: { page, limit, total, totalPages },
    });
  } catch (error) {
    return handleAuthError(error);
  }
}

