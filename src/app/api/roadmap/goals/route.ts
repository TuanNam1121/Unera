import crypto from "crypto";
import { NextResponse } from "next/server";
import { Types } from "mongoose";
import { ROADMAP_GOAL_STATUSES, ROADMAP_STATUS } from "@/constants";
import { connectToDatabase } from "@/lib/db";
import {
  ensureRoadmapCollectionClean,
  serializeRoadmap,
} from "@/lib/roadmap-service";
import { handleAuthError, requireAuth } from "@/lib/session";
import { Roadmap } from "@/models/Roadmap";
import { createRoadmapGoalSchema } from "@/validations/roadmap";

/**
 * POST /api/roadmap/goals
 * RM05: Thêm mục tiêu cá nhân (isCustom: true) vào một năm học cụ thể của lộ trình ACTIVE.
 */
export async function POST(req: Request) {
  try {
    const authUser = await requireAuth(req);
    const body = await req.json();

    const parsed = createRoadmapGoalSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Thông tin mục tiêu không hợp lệ" },
        { status: 400 }
      );
    }

    await connectToDatabase();
    await ensureRoadmapCollectionClean();

    const roadmap = await Roadmap.findOne({
      studentId: new Types.ObjectId(authUser.id),
      status: ROADMAP_STATUS.ACTIVE,
    });

    if (!roadmap) {
      return NextResponse.json(
        { error: "Bạn chưa có lộ trình đang hoạt động để thêm mục tiêu." },
        { status: 404 }
      );
    }

    const targetYear = roadmap.years.find(
      (y) => y.yearNumber === parsed.data.yearNumber
    );
    if (!targetYear) {
      return NextResponse.json(
        { error: `Không tìm thấy Năm ${parsed.data.yearNumber} trong lộ trình.` },
        { status: 400 }
      );
    }

    let parsedDueDate: Date | null = null;
    if (parsed.data.dueDate) {
      const d = new Date(parsed.data.dueDate);
      if (Number.isNaN(d.getTime())) {
        return NextResponse.json(
          { error: "Định dạng ngày hạn hoàn thành (dueDate) không hợp lệ." },
          { status: 400 }
        );
      }
      parsedDueDate = d;
    }

    const maxOrder = targetYear.goals.reduce(
      (max, g) => Math.max(max, g.order || 0),
      0
    );

    const newGoalId = crypto.randomUUID();
    targetYear.goals.push({
      id: newGoalId,
      title: parsed.data.title,
      description: parsed.data.description,
      category: parsed.data.category,
      semester: parsed.data.semester,
      priority: parsed.data.priority,
      status: ROADMAP_GOAL_STATUSES.NOT_STARTED,
      dueDate: parsedDueDate,
      order: maxOrder + 1,
      isCustom: true,
      completedAt: null,
    });

    const serializedBeforeSave = serializeRoadmap(roadmap);
    roadmap.progressPercent = serializedBeforeSave.progressBreakdown?.progressPercent ?? 0;
    await roadmap.save();

    return NextResponse.json(
      {
        success: true,
        goalId: newGoalId,
        roadmap: serializeRoadmap(roadmap),
      },
      { status: 201 }
    );
  } catch (error) {
    return handleAuthError(error);
  }
}

