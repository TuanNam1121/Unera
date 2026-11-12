import { NextResponse } from "next/server";
import { Types } from "mongoose";
import { connectToDatabase } from "@/lib/db";
import { restoreRoadmapFromHistory } from "@/lib/roadmap-service";
import { handleAuthError, requireAuth } from "@/lib/session";

/**
 * POST /api/roadmap/history/[roadmapId]/restore
 * RM14: Khôi phục phiên bản lộ trình cũ thành lộ trình ACTIVE mới (archive bản ACTIVE hiện tại),
 * bảo toàn nguyên vẹn toàn bộ mục tiêu & trạng thái hoàn thành của phiên bản được chọn.
 */
export async function POST(
  req: Request,
  context: { params: Promise<{ roadmapId: string }> }
) {
  try {
    const authUser = await requireAuth(req);
    const { roadmapId } = await context.params;
    if (!Types.ObjectId.isValid(roadmapId)) {
      return NextResponse.json({ error: "Mã lộ trình không hợp lệ" }, { status: 400 });
    }

    await connectToDatabase();

    const restored = await restoreRoadmapFromHistory({
      studentId: authUser.id,
      roadmapId,
    });

    if (!restored) {
      return NextResponse.json(
        { error: "Không tìm thấy phiên bản lộ trình để khôi phục." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Đã khôi phục lộ trình thành phiên bản hoạt động v${restored.version}!`,
      roadmap: restored,
    });
  } catch (error) {
    return handleAuthError(error);
  }
}

