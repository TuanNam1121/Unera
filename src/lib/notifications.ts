import { Types } from "mongoose";
import {
  ACCOUNT_STATUS,
  ACTIVITY_PUBLISH_STATUS,
  DEFAULT_REMINDER_SETTING,
  NOTIFICATION_CHANNELS,
  NOTIFICATION_TYPES,
} from "@/constants";
import { sendReminderNotificationEmail } from "@/lib/email";
import {
  buildReminderCopy,
  differenceInVietnamCalendarDays,
} from "@/lib/notifications-utils";
import { Notification } from "@/models/Notification";
import {
  IReminderSettingDocument,
  ReminderSetting,
} from "@/models/ReminderSetting";
import { ActivityFollow } from "@/models/ActivityFollow";
import { StudentActivity } from "@/models/StudentActivity";
import { User } from "@/models/User";
import type {
  INotification,
  IReminderJobRunSummary,
  IReminderSettingDTO,
  NotificationType,
  ReminderType,
} from "@/types";

export interface RawNotificationDoc {
  _id: Types.ObjectId | string;
  recipientId: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
  isRead: boolean;
  readAt?: Date | string | null;
  channel: "IN_APP" | "EMAIL";
  emailDeliveryStatus?: "PENDING" | "SENT" | "FAILED";
  activityId?: string;
  reminderType?: ReminderType;
  reminderOffsetDays?: number;
  idempotencyKey?: string;
  createdAt: Date | string;
  updatedAt?: Date | string;
}

export function serializeNotification(doc: RawNotificationDoc): INotification {
  return {
    _id: doc._id.toString(),
    recipientId: doc.recipientId,
    type: doc.type,
    title: doc.title,
    message: doc.message,
    link: doc.link || undefined,
    isRead: Boolean(doc.isRead),
    readAt: doc.readAt ?? null,
    channel: doc.channel,
    emailDeliveryStatus: doc.emailDeliveryStatus,
    activityId: doc.activityId || undefined,
    reminderType: doc.reminderType || undefined,
    reminderOffsetDays:
      typeof doc.reminderOffsetDays === "number"
        ? doc.reminderOffsetDays
        : undefined,
    idempotencyKey: doc.idempotencyKey || undefined,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

export function serializeReminderSetting(
  userId: string,
  doc?: Pick<
    IReminderSettingDocument,
    | "_id"
    | "enableReminders"
    | "enableDeadlineReminder"
    | "enableEventReminder"
    | "offsetsDays"
    | "channels"
    | "updatedAt"
  > | null
): IReminderSettingDTO {
  if (!doc) {
    return {
      userId,
      enableReminders: DEFAULT_REMINDER_SETTING.enableReminders,
      enableDeadlineReminder: DEFAULT_REMINDER_SETTING.enableDeadlineReminder,
      enableEventReminder: DEFAULT_REMINDER_SETTING.enableEventReminder,
      offsetsDays: [...DEFAULT_REMINDER_SETTING.offsetsDays],
      channels: { ...DEFAULT_REMINDER_SETTING.channels },
    };
  }

  return {
    _id: doc._id?.toString(),
    userId,
    enableReminders: Boolean(doc.enableReminders),
    enableDeadlineReminder: Boolean(doc.enableDeadlineReminder),
    enableEventReminder: Boolean(doc.enableEventReminder),
    offsetsDays: Array.isArray(doc.offsetsDays)
      ? [...doc.offsetsDays]
      : [...DEFAULT_REMINDER_SETTING.offsetsDays],
    channels: {
      inApp: doc.channels?.inApp ?? DEFAULT_REMINDER_SETTING.channels.inApp,
      email: doc.channels?.email ?? DEFAULT_REMINDER_SETTING.channels.email,
    },
    updatedAt: doc.updatedAt,
  };
}

let legacyIndexChecked = false;

/**
 * Bảo đảm gỡ bỏ unique index cũ (thiếu reminderType & targetDate) để idempotencyKey hoạt động chính xác.
 */
async function ensureNotificationIndexesReady(): Promise<void> {
  if (legacyIndexChecked) return;
  legacyIndexChecked = true;
  try {
    const indexes = await Notification.collection.indexes();
    const legacy = indexes.find(
      (idx) =>
        idx.name ===
        "recipientId_1_activityId_1_reminderOffsetDays_1_channel_1"
    );
    if (legacy && legacy.name) {
      await Notification.collection.dropIndex(legacy.name);
    }
  } catch {
    // Non-fatal if collection does not exist yet
  }
}

export async function getOrCreateReminderSetting(
  userId: string
): Promise<IReminderSettingDTO> {
  if (!Types.ObjectId.isValid(userId)) {
    return serializeReminderSetting(userId, null);
  }
  const userObjId = new Types.ObjectId(userId);
  let doc = await ReminderSetting.findOne({ userId: userObjId }).lean();
  if (!doc) {
    try {
      const created = await ReminderSetting.create({
        userId: userObjId,
        enableReminders: DEFAULT_REMINDER_SETTING.enableReminders,
        enableDeadlineReminder: DEFAULT_REMINDER_SETTING.enableDeadlineReminder,
        enableEventReminder: DEFAULT_REMINDER_SETTING.enableEventReminder,
        offsetsDays: [...DEFAULT_REMINDER_SETTING.offsetsDays],
        channels: { ...DEFAULT_REMINDER_SETTING.channels },
      });
      doc = created.toObject();
    } catch (err: unknown) {
      const isDup =
        typeof err === "object" &&
        err !== null &&
        "code" in err &&
        (err as { code?: number }).code === 11000;
      if (!isDup) throw err;
      doc = await ReminderSetting.findOne({ userId: userObjId }).lean();
    }
  }
  return serializeReminderSetting(userId, doc);
}

const LIGHT_SYNC_COOLDOWN_MS = 60 * 60 * 1000; // 1 giờ/user
const lastLightSyncByUser = new Map<string, number>();

export async function triggerLightUserReminderSync(
  userId: string
): Promise<void> {
  const nowMs = Date.now();
  const prev = lastLightSyncByUser.get(userId) || 0;
  if (nowMs - prev < LIGHT_SYNC_COOLDOWN_MS) {
    return;
  }
  if (lastLightSyncByUser.size > 5000) {
    lastLightSyncByUser.clear();
  }
  lastLightSyncByUser.set(userId, nowMs);

  try {
    await runReminderJob({ userId });
  } catch (err) {
    console.warn(
      "[REMINDER LIGHT SYNC] Warning:",
      err instanceof Error ? err.message : err
    );
  }
}

/**
 * Quét ActivityFollow + StudentActivity + ReminderSetting để phát thông báo nhắc Deadline & Event (OP09, OP10).
 */
export async function runReminderJob(options?: {
  userId?: string;
  referenceDate?: Date;
}): Promise<IReminderJobRunSummary> {
  await ensureNotificationIndexesReady();

  const summary: IReminderJobRunSummary = {
    scannedFollows: 0,
    createdCount: 0,
    skippedDuplicates: 0,
    emailedCount: 0,
    errorsCount: 0,
  };

  const now = options?.referenceDate || new Date();
  const followFilter: Record<string, unknown> = {};
  if (options?.userId) {
    if (!Types.ObjectId.isValid(options.userId)) return summary;
    followFilter.studentId = new Types.ObjectId(options.userId);
  }

  const follows = await ActivityFollow.find(followFilter)
    .select("studentId activityId notifyDeadline notifyEvent")
    .lean();

  if (follows.length === 0) return summary;
  summary.scannedFollows = follows.length;

  const studentIds = Array.from(
    new Set(follows.map((f) => f.studentId.toString()))
  ).map((id) => new Types.ObjectId(id));
  const activityIds = Array.from(
    new Set(follows.map((f) => f.activityId.toString()))
  ).map((id) => new Types.ObjectId(id));

  const [activeUsers, publishedActivities, settingsDocs] = await Promise.all([
    User.find({
      _id: { $in: studentIds },
      status: ACCOUNT_STATUS.ACTIVE,
    })
      .select("_id name email")
      .lean(),
    StudentActivity.find({
      _id: { $in: activityIds },
      publishStatus: ACTIVITY_PUBLISH_STATUS.PUBLISHED,
      manualClosed: { $ne: true },
    })
      .select("_id title slug location deadline eventDate")
      .lean(),
    ReminderSetting.find({ userId: { $in: studentIds } }).lean(),
  ]);

  const userMap = new Map(activeUsers.map((u) => [u._id.toString(), u]));
  const activityMap = new Map(
    publishedActivities.map((a) => [a._id.toString(), a])
  );
  const settingMap = new Map(
    settingsDocs.map((s) => [s.userId.toString(), s])
  );

  for (const follow of follows) {
    const studentId = follow.studentId.toString();
    const activityId = follow.activityId.toString();
    const user = userMap.get(studentId);
    const activity = activityMap.get(activityId);

    if (!user || !activity) continue;

    const setting = serializeReminderSetting(
      studentId,
      settingMap.get(studentId)
    );
    if (!setting.enableReminders) continue;
    if (!setting.channels.inApp && !setting.channels.email) continue;
    if (!setting.offsetsDays || setting.offsetsDays.length === 0) continue;

    const candidates: Array<{
      reminderType: ReminderType;
      targetDate: Date;
    }> = [];

    if (
      setting.enableDeadlineReminder &&
      follow.notifyDeadline !== false &&
      activity.deadline
    ) {
      candidates.push({
        reminderType: "DEADLINE",
        targetDate: new Date(activity.deadline),
      });
    }

    if (
      setting.enableEventReminder &&
      follow.notifyEvent !== false &&
      activity.eventDate
    ) {
      candidates.push({
        reminderType: "EVENT",
        targetDate: new Date(activity.eventDate),
      });
    }

    for (const candidate of candidates) {
      const daysUntil = differenceInVietnamCalendarDays(
        candidate.targetDate,
        now
      );
      if (daysUntil === null || !setting.offsetsDays.includes(daysUntil)) {
        continue;
      }

      const copy = buildReminderCopy({
        reminderType: candidate.reminderType,
        offsetDays: daysUntil,
        activityTitle: activity.title,
        targetDate: candidate.targetDate,
        location: activity.location,
      });

      const idempotencyKey = `${studentId}:${activityId}:${candidate.reminderType}:${daysUntil}:${copy.targetDateKey}`;
      const channel = setting.channels.inApp
        ? NOTIFICATION_CHANNELS.IN_APP
        : NOTIFICATION_CHANNELS.EMAIL;
      const activityLink = activity.slug
        ? `/activities/${activity.slug}`
        : "/activities";

      try {
        const created = await Notification.create({
          recipientId: studentId,
          type: copy.notificationType,
          title: copy.title,
          message: copy.message,
          link: activityLink,
          isRead: false,
          readAt: null,
          channel,
          emailDeliveryStatus: "PENDING",
          activityId,
          reminderType: candidate.reminderType,
          reminderOffsetDays: daysUntil,
          idempotencyKey,
        });

        summary.createdCount += 1;

        if (setting.channels.email && user.email) {
          try {
            const emailRes = await sendReminderNotificationEmail({
              to: user.email,
              recipientName: user.name || "bạn",
              title: copy.title,
              message: copy.message,
              link: activityLink,
              badgeLabel: copy.badgeLabel,
            });
            if (emailRes.delivered) {
              summary.emailedCount += 1;
              await Notification.updateOne(
                { _id: created._id },
                { $set: { emailDeliveryStatus: "SENT" } }
              );
            }
          } catch {
            await Notification.updateOne(
              { _id: created._id },
              { $set: { emailDeliveryStatus: "FAILED" } }
            );
          }
        }
      } catch (err: unknown) {
        const isDuplicate =
          typeof err === "object" &&
          err !== null &&
          "code" in err &&
          (err as { code?: number }).code === 11000;
        if (isDuplicate) {
          summary.skippedDuplicates += 1;
        } else {
          summary.errorsCount += 1;
        }
      }
    }
  }

  return summary;
}

export async function createSystemNotification(params: {
  recipientId: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
}): Promise<void> {
  try {
    await ensureNotificationIndexesReady();
    await Notification.create({
      recipientId: params.recipientId,
      type: params.type,
      title: params.title,
      message: params.message,
      link: params.link,
      isRead: false,
      readAt: null,
      channel: NOTIFICATION_CHANNELS.IN_APP,
    });
  } catch (err) {
    console.warn(
      "[NOTIFICATION] Failed to insert system notification:",
      err instanceof Error ? err.message : err
    );
  }
}

export async function seedDefaultNotifications(
  studentId: Types.ObjectId | string,
  firstActivity?: { _id: Types.ObjectId | string; title: string; slug: string } | null
): Promise<{ notificationsCount: number }> {
  await ensureNotificationIndexesReady();
  const recipientId = studentId.toString();

  await getOrCreateReminderSetting(recipientId);

  const actLink = firstActivity?.slug
    ? `/activities/${firstActivity.slug}`
    : "/activities";
  const actTitle =
    firstActivity?.title || "Học bổng Trao đổi Sinh viên Quốc tế ULIS";

  const now = new Date();
  const docs = [
    {
      recipientId,
      type: NOTIFICATION_TYPES.DEADLINE_REMINDER,
      title: `Còn 1 tuần tới hạn nộp: ${actTitle}`,
      message:
        "Chỉ còn 7 ngày nữa là đóng đơn đăng ký. Hãy rà soát CV và minh chứng ngoại ngữ trước khi nộp!",
      link: actLink,
      isRead: false,
      readAt: null,
      channel: NOTIFICATION_CHANNELS.IN_APP,
      activityId: firstActivity?._id?.toString(),
      reminderType: "DEADLINE" as const,
      reminderOffsetDays: 7,
      createdAt: new Date(now.getTime() - 45 * 60 * 1000),
    },
    {
      recipientId,
      type: NOTIFICATION_TYPES.EVENT_REMINDER,
      title: "Ngày mai diễn ra: Ngày hội Việc làm & Kết nối Doanh nghiệp ULIS",
      message:
        "Chương trình sẽ diễn ra lúc 08:30 tại Hội trường Nguyễn Văn Đạo, ĐHQGHN.",
      link: "/activities",
      isRead: false,
      readAt: null,
      channel: NOTIFICATION_CHANNELS.IN_APP,
      reminderType: "EVENT" as const,
      reminderOffsetDays: 1,
      createdAt: new Date(now.getTime() - 3 * 60 * 60 * 1000),
    },
    {
      recipientId,
      type: NOTIFICATION_TYPES.ROADMAP_UPDATE,
      title: "Lộ trình phát triển cá nhân đã sẵn sàng",
      message:
        "Hệ thống đã đồng bộ các cột mốc kỹ năng và hoạt động đề xuất theo mục tiêu Du học & Việc làm của bạn.",
      link: "/roadmap",
      isRead: true,
      readAt: new Date(now.getTime() - 20 * 60 * 60 * 1000),
      channel: NOTIFICATION_CHANNELS.IN_APP,
      createdAt: new Date(now.getTime() - 24 * 60 * 60 * 1000),
    },
  ];

  await Notification.insertMany(docs);
  return { notificationsCount: docs.length };
}

