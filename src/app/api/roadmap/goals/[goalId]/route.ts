import { NextResponse } from "next/server";
import { Types } from "mongoose";
import { ROADMAP_GOAL_STATUSES, ROADMAP_STATUS } from "@/constants";
import { connectToDatabase } from "@/lib/db";
import {
  ensureRoadmapCollectionClean,
  serializeRoadmap,
} from "@/lib/roadmap-service";
import { calculateRoadmapProgress } from "@/lib/roadmap-utils";
import { handleAuthError, requireAuth } from "@/lib/session";
import { Roadmap } from "@/models/Roadmap";
import { updateRoadmapGoalSchema } from "@/validations/roadmap";

function recomputeAndAssignOrder(
  goals: Array<{ order: number }>
) {
  goals.sort((a, b) => a.order - b.order);
  goals.forEach((g, idx) => {
    g.order = idx + 1;
  });
}

/**
 * PATCH /api/roadmap/goals/[goalId]
 * RM06, RM08, RM09: Cập nhật thông tin mục tiêu, đổi năm học hoặc cập nhật 4 trạng thái (NOT_STARTED/IN_PROGRESS/COMPLETED/SKIPPED).
 */
export async function PATCH(
  req: Request,
  context: { params: Promise<{ goalId: string }> }
) {
  try {
    const authUser = await requireAuth(req);
    const { goalId } = await context.params;

    const body = await req.json();
    const parsed = updateRoadmapGoalSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Dữ liệu cập nhật mục tiêu không hợp lệ" },
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
        { error: "Không tìm thấy lộ trình đang kích hoạt." },
        { status: 404 }
      );
    }

    let sourceYearIndex = -1;
    let sourceGoalIndex = -1;

    for (let yi = 0; yi < roadmap.years.length; yi++) {
      const gi = roadmap.years[yi].goals.findIndex((g) => g.id === goalId);
      if (gi !== -1) {
        sourceYearIndex = yi;
        sourceGoalIndex = gi;
        break;
      }
    }

    if (sourceYearIndex === -1 || sourceGoalIndex === -1) {
      return NextResponse.json(
        { error: "Không tìm thấy mục tiêu trong lộ trình hiện tại." },
        { status: 404 }
      );
    }

    const sourceYear = roadmap.years[sourceYearIndex];
    const goal = sourceYear.goals[sourceGoalIndex];

    if (parsed.data.title !== undefined) goal.title = parsed.data.title;
    if (parsed.data.description !== undefined) goal.description = parsed.data.description;
    if (parsed.data.category !== undefined) goal.category = parsed.data.category;
    if (parsed.data.semester !== undefined) goal.semester = parsed.data.semester;
    if (parsed.data.priority !== undefined) goal.priority = parsed.data.priority;

    if (parsed.data.dueDate !== undefined) {
      if (parsed.data.dueDate === null || parsed.data.dueDate === "") {
        goal.dueDate = null;
      } else {
        const d = new Date(parsed.data.dueDate);
        if (Number.isNaN(d.getTime())) {
          return NextResponse.json(
            { error: "Ngày hạn hoàn thành không hợp lệ." },
            { status: 400 }
          );
        }
        goal.dueDate = d;
      }
    }

    if (parsed.data.status !== undefined) {
      const prevStatus = goal.status;
      goal.status = parsed.data.status;
      if (
        parsed.data.status === ROADMAP_GOAL_STATUSES.COMPLETED &&
        prevStatus !== ROADMAP_GOAL_STATUSES.COMPLETED
      ) {
        goal.completedAt = new Date();
      } else if (parsed.data.status !== ROADMAP_GOAL_STATUSES.COMPLETED) {
        goal.completedAt = null;
      }
    }

    // Chuyển mục tiêu sang năm khác nếu người dùng yêu cầu (RM06)
    if (
      parsed.data.targetYearNumber !== undefined &&
      parsed.data.targetYearNumber !== sourceYear.yearNumber
    ) {
      const destYear = roadmap.years.find(
        (y) => y.yearNumber === parsed.data.targetYearNumber
      );
      if (!destYear) {
        return NextResponse.json(
          { error: `Không tìm thấy Năm ${parsed.data.targetYearNumber}.` },
          { status: 400 }
        );
      }

      const [movedGoal] = sourceYear.goals.splice(sourceGoalIndex, 1);
      recomputeAndAssignOrder(sourceYear.goals);

      const destMaxOrder = destYear.goals.reduce(
        (max, g) => Math.max(max, g.order || 0),
        0
      );
      movedGoal.order = destMaxOrder + 1;
      destYear.goals.push(movedGoal);
    }

    const breakdown = calculateRoadmapProgress(
      roadmap.years.map((y) => ({
        yearNumber: y.yearNumber,
        goals: y.goals.map((g) => ({
          ...g,
          dueDate: g.dueDate ? new Date(g.dueDate).toISOString() : null,
          completedAt: g.completedAt ? new Date(g.completedAt).toISOString() : null,
        })),
      }))
    );

    roadmap.progressPercent = breakdown.progressPercent;
    roadmap.markModified("years");
    await roadmap.save();

    return NextResponse.json({
      success: true,
      roadmap: serializeRoadmap(roadmap),
    });
  } catch (error) {
    return handleAuthError(error);
  }
}

/**
 * DELETE /api/roadmap/goals/[goalId]
 * RM07: Xóa mục tiêu khỏi năm học, cập nhật lại order & progressPercent.
 */
export async function DELETE(
  req: Request,
  context: { params: Promise<{ goalId: string }> }
) {
  try {
    const authUser = await requireAuth(req);
    const { goalId } = await context.params;

    await connectToDatabase();
    await ensureRoadmapCollectionClean();

    const roadmap = await Roadmap.findOne({
      studentId: new Types.ObjectId(authUser.id),
      status: ROADMAP_STATUS.ACTIVE,
    });

    if (!roadmap) {
      return NextResponse.json(
        { error: "Không tìm thấy lộ trình đang kích hoạt." },
        { status: 404 }
      );
    }

    let found = false;
    for (const yr of roadmap.years) {
      const idx = yr.goals.findIndex((g) => g.id === goalId);
      if (idx !== -1) {
        yr.goals.splice(idx, 1);
        recomputeAndAssignOrder(yr.goals);
        found = true;
        break;
      }
    }

    if (!found) {
      return NextResponse.json(
        { error: "Không tìm thấy mục tiêu cần xóa." },
        { status: 404 }
      );
    }

    const breakdown = calculateRoadmapProgress(
      roadmap.years.map((y) => ({
        yearNumber: y.yearNumber,
        goals: y.goals.map((g) => ({
          ...g,
          dueDate: g.dueDate ? new Date(g.dueDate).toISOString() : null,
          completedAt: g.completedAt ? new Date(g.completedAt).toISOString() : null,
        })),
      }))
    );
    roadmap.progressPercent = breakdown.progressPercent;
    roadmap.markModified("years");
    await roadmap.save();

    return NextResponse.json({
      success: true,
      roadmap: serializeRoadmap(roadmap),
    });
  } catch (error) {
    return handleAuthError(error);
  }
}

