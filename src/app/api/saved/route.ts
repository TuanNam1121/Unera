import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { SavedOpportunity } from "@/models/SavedOpportunity";
import { User } from "@/models/User";
import { auth } from "@/lib/auth";

async function getAuthenticatedStudentId(): Promise<string | null> {
  const session = await auth();
  if (session?.user?.id) return session.user.id;

  if (process.env.NODE_ENV !== "production") {
    const defaultStudent = await User.findOne({ email: "student@unera.edu.vn" });
    if (defaultStudent) return defaultStudent._id.toString();
  }
  return null;
}

export async function GET() {
  try {
    await connectToDatabase();
    const studentId = await getAuthenticatedStudentId();

    if (!studentId) {
      return NextResponse.json({ error: "Yêu cầu đăng nhập" }, { status: 401 });
    }

    const saved = await SavedOpportunity.find({ studentId })
      .populate("opportunityId")
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ saved });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Đã có lỗi xảy ra";
    return NextResponse.json({ error: "Lỗi lấy danh sách cơ hội đã lưu", details: message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await connectToDatabase();
    const studentId = await getAuthenticatedStudentId();

    if (!studentId) {
      return NextResponse.json({ error: "Yêu cầu đăng nhập để lưu cơ hội" }, { status: 401 });
    }

    const { opportunityId } = await req.json();
    if (!opportunityId) {
      return NextResponse.json({ error: "Thiếu opportunityId" }, { status: 400 });
    }

    const record = await SavedOpportunity.findOneAndUpdate(
      { studentId, opportunityId },
      { studentId, opportunityId },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    return NextResponse.json({ message: "Đã lưu cơ hội", record });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Đã có lỗi xảy ra";
    return NextResponse.json({ error: "Không thể lưu cơ hội", details: message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    await connectToDatabase();
    const studentId = await getAuthenticatedStudentId();

    if (!studentId) {
      return NextResponse.json({ error: "Yêu cầu đăng nhập" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const opportunityId = searchParams.get("opportunityId");

    if (!opportunityId) {
      return NextResponse.json({ error: "Thiếu tham số opportunityId" }, { status: 400 });
    }

    await SavedOpportunity.findOneAndDelete({ studentId, opportunityId });
    return NextResponse.json({ message: "Đã bỏ lưu cơ hội" });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Đã có lỗi xảy ra";
    return NextResponse.json({ error: "Lỗi khi bỏ lưu cơ hội", details: message }, { status: 500 });
  }
}

