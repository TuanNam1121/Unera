import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { Opportunity } from "@/models/Opportunity";
import { createOpportunitySchema } from "@/validations";
import { OPPORTUNITY_STATUS } from "@/constants";
import { auth } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");
    const keyword = searchParams.get("q");
    const isDomestic = searchParams.get("isDomestic");
    const status = searchParams.get("status") || OPPORTUNITY_STATUS.PUBLISHED;
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "12", 10);
    const sortBy = searchParams.get("sort") || "deadline";

    await connectToDatabase();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const filter: Record<string, any> = { status };

    if (category && category !== "all") {
      filter.category = category;
    }

    if (isDomestic !== null && isDomestic !== undefined && isDomestic !== "") {
      filter.isDomestic = isDomestic === "true";
    }

    if (keyword && keyword.trim()) {
      filter.$text = { $search: keyword.trim() };
    }

    const skip = (page - 1) * limit;

    // Sắp xếp theo hạn chót (ưu tiên gần nhất) hoặc mới nhất
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sortOptions: Record<string, any> = {};
    if (sortBy === "deadline") {
      sortOptions.deadline = 1; // Sớm nhất trước
    } else {
      sortOptions.createdAt = -1; // Mới đăng nhất
    }

    const [items, total] = await Promise.all([
      Opportunity.find(filter)
        .sort(sortOptions)
        .skip(skip)
        .limit(limit)
        .lean(),
      Opportunity.countDocuments(filter),
    ]);

    return NextResponse.json({
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Đã có lỗi xảy ra";
    return NextResponse.json(
      { error: "Không thể lấy danh sách cơ hội", details: message },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();

    // Kiểm tra quyền Admin trên server (FR-EXP-13, FR-AUTH-07)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (!session?.user || (session.user as any).role !== "ADMIN") {
      return NextResponse.json(
        { error: "Truy cập bị từ chối. Chỉ quản trị viên (Admin) mới có quyền xuất bản cơ hội." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const validated = createOpportunitySchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        {
          error: "Dữ liệu cơ hội không hợp lệ",
          details: validated.error.issues.map((i) => i.message),
        },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const newOpportunity = await Opportunity.create({
      ...validated.data,
      category: validated.data.category as any,
      status: validated.data.status as any,
      version: 1,
      updatedByAdminId: session.user.id,
    });

    return NextResponse.json(
      {
        message: "Tạo cơ hội thành công",
        opportunity: newOpportunity,
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Đã có lỗi xảy ra";
    return NextResponse.json(
      { error: "Không thể tạo cơ hội", details: message },
      { status: 500 }
    );
  }
}
