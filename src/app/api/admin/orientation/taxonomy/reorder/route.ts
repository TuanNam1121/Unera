import { NextResponse } from "next/server";
import { Types } from "mongoose";
import { logAuditAction } from "@/lib/audit";
import { connectToDatabase } from "@/lib/db";
import { revalidateOrientationRoutes } from "@/lib/orientation";
import { handleAuthError, requireAdmin } from "@/lib/session";
import { OrientationCategory } from "@/models/OrientationCategory";
import { OrientationTopic } from "@/models/OrientationTopic";
import { reorderOrientationTaxonomySchema } from "@/validations";

/**
 * PATCH /api/admin/orientation/taxonomy/reorder
 * Cập nhật đồng loạt thứ tự hiển thị (order) cho Category hoặc Topic để đồng bộ Sidebar
 */
export async function PATCH(req: Request) {
  try {
    const admin = await requireAdmin(req);
    const body = await req.json();
    const parsed = reorderOrientationTaxonomySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error:
            parsed.error.issues[0]?.message || "Danh sách thứ tự không hợp lệ.",
        },
        { status: 400 }
      );
    }

    const { kind, orderedIds } = parsed.data;
    if (orderedIds.some((id) => !Types.ObjectId.isValid(id))) {
      return NextResponse.json(
        { error: "Danh sách chứa mã định danh không hợp lệ." },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const ops = orderedIds.map((id, index) => ({
      updateOne: {
        filter: { _id: new Types.ObjectId(id) },
        update: { $set: { order: index } },
      },
    }));

    if (kind === "category") {
      await OrientationCategory.bulkWrite(ops);
    } else {
      await OrientationTopic.bulkWrite(ops);
    }

    await logAuditAction({
      admin: { id: admin.id, email: admin.email, name: admin.name },
      action: "UPDATE",
      targetCollection:
        kind === "category" ? "orientation_categories" : "orientation_topics",
      targetId: new Types.ObjectId(orderedIds[0]),
      targetTitle: `Sắp xếp thứ tự ${kind} (${orderedIds.length} mục)`,
      changesAfter: { orderedIds },
      req,
    });

    revalidateOrientationRoutes();

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    return handleAuthError(error);
  }
}

