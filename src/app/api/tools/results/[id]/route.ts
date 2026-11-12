import { NextRequest, NextResponse, connection } from "next/server";
import { Types } from "mongoose";
import { connectToDatabase } from "@/lib/db";
import { handleAuthError, requireAuth } from "@/lib/session";
import { ToolResult } from "@/models/ToolResult";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  await connection();

  try {
    const user = await requireAuth(req);
    const { id } = await params;

    if (!Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: "ID kết quả không hợp lệ" },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const deleted = await ToolResult.findOneAndDelete({
      _id: new Types.ObjectId(id),
      userId: new Types.ObjectId(user.id),
    });

    if (!deleted) {
      return NextResponse.json(
        { error: "Không tìm thấy kết quả hoặc bạn không có quyền xóa" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Đã xóa kết quả khỏi lịch sử",
    });
  } catch (error: unknown) {
    if (error instanceof Response) return handleAuthError(error);
    const message =
      error instanceof Error ? error.message : "Không thể xóa kết quả công cụ";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

