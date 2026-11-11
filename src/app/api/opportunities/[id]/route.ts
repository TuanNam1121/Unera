import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { Opportunity } from "@/models/Opportunity";
import { updateOpportunitySchema } from "@/validations";
import { auth } from "@/lib/auth";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await connectToDatabase();

    const opportunity = await Opportunity.findById(id).lean();

    if (!opportunity) {
      return NextResponse.json(
        { error: "Không tìm thấy cơ hội" },
        { status: 404 }
      );
    }

    return NextResponse.json({ opportunity });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Đã có lỗi xảy ra";
    return NextResponse.json(
      { error: "Lỗi khi lấy thông tin chi tiết cơ hội", details: message },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (!session?.user || (session.user as any).role !== "ADMIN") {
      return NextResponse.json(
        { error: "Chỉ quản trị viên mới có quyền cập nhật cơ hội" },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await req.json();
    const validated = updateOpportunitySchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        {
          error: "Dữ liệu cập nhật không hợp lệ",
          details: validated.error.issues.map((i) => i.message),
        },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const currentRecord = await Opportunity.findById(id);
    if (!currentRecord) {
      return NextResponse.json(
        { error: "Không tìm thấy cơ hội cần cập nhật" },
        { status: 404 }
      );
    }

    // Kiểm tra Optimistic Locking (FR-EXP-14 & PROJECT_CONTEXT Mục 8)
    if (currentRecord.version !== validated.data.version) {
      return NextResponse.json(
        {
          error: "Xung đột dữ liệu đồng thời! Bản ghi này đã được một Admin khác cập nhật trước đó.",
          conflict: true,
          currentVersion: currentRecord.version,
          updatedAt: currentRecord.updatedAt,
        },
        { status: 409 }
      );
    }

    // Cập nhật dữ liệu và tăng version
    Object.assign(currentRecord, validated.data);
    currentRecord.updatedByAdminId = session.user.id;
    await currentRecord.save();

    return NextResponse.json({
      message: "Cập nhật cơ hội thành công",
      opportunity: currentRecord,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Đã có lỗi xảy ra";
    return NextResponse.json(
      { error: "Lỗi cập nhật cơ hội", details: message },
      { status: 500 }
    );
  }
}

