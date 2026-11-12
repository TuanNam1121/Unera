import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { connection } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { runReminderJob } from "@/lib/notifications";

export const maxDuration = 60;

function isAuthorizedCronRequest(req: NextRequest): boolean {
  const expectedSecret = process.env.CRON_SECRET?.trim();
  if (!expectedSecret) return false;

  const authHeader = req.headers.get("authorization") || "";
  const expectedHeader = `Bearer ${expectedSecret}`;

  const a = Buffer.from(authHeader);
  const b = Buffer.from(expectedHeader);
  if (a.length !== b.length) return false;

  return crypto.timingSafeEqual(a, b);
}

async function handleCronExecution(req: NextRequest) {
  if (!isAuthorizedCronRequest(req)) {
    return NextResponse.json(
      { error: "Unauthorized: CRON_SECRET không hợp lệ hoặc bị thiếu" },
      { status: 401 }
    );
  }

  try {
    await connectToDatabase();
    const summary = await runReminderJob();
    return NextResponse.json({
      success: true,
      summary,
      executedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Cron /api/cron/reminders failed:", error);
    return NextResponse.json(
      { error: "Lỗi trong quá trình thực thi job nhắc nhở" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  return handleCronExecution(req);
}

export async function GET(req: NextRequest) {
  await connection();
  return handleCronExecution(req);
}

