import { NextResponse } from "next/server";
import { Types } from "mongoose";
import { ROADMAP_STATUS } from "@/constants";
import { connectToDatabase } from "@/lib/db";
import {
  ensureRoadmapCollectionClean,
  serializeRoadmap,
} from "@/lib/roadmap-service";
import { handleAuthError, requireAuth } from "@/lib/session";
import { Roadmap } from "@/models/Roadmap";
import { reorderRoadmapGoalsSchema } from "@/validations/roadmap";

/**
 * PATCH /api/roadmap/years/[yearNumber]/reorder
 * RM11: Sắp xếp lại thứ tự mục tiêu trong cùng một năm học.
 */
export async function PATCH(
  req: Request,
  context: { params: Promise<{ yearNumber: string }> }
) {
  try {
    const authUser = await requireAuth(req);
    const { yearNumber } = await context.params;
    const yrNum = Number(yearNumber);

    if (![1, 2, 3, 4].includes(yrNum)) {
      return NextResponse.json(
        { error: "Năm học phải nằm trong khoảng 1 đến 4." },
        { status: 400 }
      );
    }

    const body = await req.json();
    const parsed = reorderRoadmapGoalsSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Danh sách thứ tự không hợp lệ" },
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

    const targetYear = roadmap.years.find((y) => y.yearNumber === yrNum);
    if (!targetYear) {
      return NextResponse.json(
        { error: `Không tìm thấy Năm ${yrNum}.` },
        { status: 404 }
      );
    }

    const orderedIds = parsed.data.orderedGoalIds;
    const goalMap = new Map(targetYear.goals.map((g) => [g.id, g]));

    if (
      orderedIds.length !== targetYear.goals.length ||
      orderedIds.some((id) => !goalMap.has(id)) ||
      new Set(orderedIds).size !== targetYear.goals.length
    ) {
      return NextResponse.json(
        {
          error:
            "Danh sách orderedGoalIds phải chứa đầy đủ toàn bộ mục tiêu hiện có của năm học này.",
        },
        { status: 400 }
      );
    }

    targetYear.goals = orderedIds.map((id, idx) => {
      const g = goalMap.get(id)!;
      g.order = idx + 1;
      return g;
    });

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

