import { NextRequest, NextResponse } from "next/server";
import { connection } from "next/server";
import { Types } from "mongoose";
import { connectToDatabase } from "@/lib/db";
import {
  getOrCreateReminderSetting,
  serializeReminderSetting,
} from "@/lib/notifications";
import { handleAuthError, requireAuth } from "@/lib/session";
import { ReminderSetting } from "@/models/ReminderSetting";
import { reminderSettingSchema } from "@/validations";

export async function GET(req: NextRequest) {
  await connection();

  try {
    const user = await requireAuth(req);
    await connectToDatabase();

    const setting = await getOrCreateReminderSetting(user.id);
    return NextResponse.json({
      success: true,
      setting,
    });
  } catch (error) {
    return handleAuthError(error);
  }
}

export async function PUT(req: NextRequest) {
  try {
    const user = await requireAuth(req);
    await connectToDatabase();

    if (!Types.ObjectId.isValid(user.id)) {
      return NextResponse.json(
        { error: "Tài khoản người dùng không hợp lệ" },
        { status: 400 }
      );
    }

    const body = await req.json();
    const parsed = reminderSettingSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Cấu hình nhắc nhở không hợp lệ",
          details: parsed.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const data = parsed.data;
    const updated = await ReminderSetting.findOneAndUpdate(
      { userId: new Types.ObjectId(user.id) },
      {
        $set: {
          enableReminders: data.enableReminders,
          enableDeadlineReminder: data.enableDeadlineReminder,
          enableEventReminder: data.enableEventReminder,
          offsetsDays: data.offsetsDays,
          channels: data.channels,
        },
      },
      {
        upsert: true,
        returnDocument: "after",
        setDefaultsOnInsert: true,
      }
    ).lean();

    return NextResponse.json({
      success: true,
      setting: serializeReminderSetting(user.id, updated),
      message: "Đã lưu cấu hình thông báo nhắc nhở",
    });
  } catch (error) {
    return handleAuthError(error);
  }
}

