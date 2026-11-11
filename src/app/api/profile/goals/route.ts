import { NextResponse } from "next/server";
import { requireAuth, handleAuthError } from "@/lib/session";
import { connectToDatabase } from "@/lib/db";
import { StudentProfile } from "@/models/StudentProfile";
import { Roadmap } from "@/models/Roadmap";
import { updateGoalsSchema } from "@/validations";

/**
 * Hàm sinh cấu trúc các giai đoạn và nhiệm vụ lộ trình dựa trên mục tiêu sinh viên chọn
 * FR-RM-03, FR-RM-04, FR-RM-08
 */
function generateRoadmapStructure(goals: {
  studyAbroad?: boolean;
  employment?: boolean;
  scientificResearch?: boolean;
  startup?: boolean;
  personalGrowth?: boolean;
}) {
  const milestonesY1S1: Array<{ id: string; title: string; tasks: Array<{ id: string; title: string; completed: boolean }> }> = [
    {
      id: "m_foundations",
      title: "Giai đoạn 1: Xây dựng nền tảng học thuật & Ngoại ngữ",
      tasks: [
        { id: "t_gpa", title: "Duy trì GPA học kỳ trên 3.2/4.0", completed: false },
        { id: "t_lang_eval", title: "Đánh giá trình độ và xây dựng kế hoạch ôn thi chứng chỉ ngoại ngữ (IELTS / TOEIC / HSK)", completed: false },
      ],
    },
  ];

  const milestonesY1S2: Array<{ id: string; title: string; tasks: Array<{ id: string; title: string; completed: boolean }> }> = [
    {
      id: "m_skills_activities",
      title: "Giai đoạn 2: Phát triển kỹ năng chuyên môn & Hoạt động phong trào",
      tasks: [
        { id: "t_club", title: "Tham gia ít nhất 1 Câu lạc bộ học thuật hoặc Dự án tình nguyện", completed: false },
      ],
    },
  ];

  // Nếu chọn Du học
  if (goals.studyAbroad) {
    milestonesY1S1[0].tasks.push({
      id: "t_abroad_target",
      title: "Xác định danh sách 3 - 5 quốc gia và chương trình học bổng mục tiêu (Fulbright, Erasmus, Chevening, MEXT)",
      completed: false,
    });
    milestonesY1S2[0].tasks.push({
      id: "t_abroad_ielts",
      title: "Đạt mục tiêu chứng chỉ ngoại ngữ tối thiểu IELTS 7.0 / TOEFL iBT 90",
      completed: false,
    });
    milestonesY1S2[0].tasks.push({
      id: "t_abroad_sop",
      title: "Bắt đầu phác thảo bài luận cá nhân (Statement of Purpose / Motivation Letter)",
      completed: false,
    });
  }

  // Nếu chọn Việc làm / Doanh nghiệp
  if (goals.employment) {
    milestonesY1S2[0].tasks.push({
      id: "t_job_cv",
      title: "Chuẩn bị CV chuyên nghiệp chuẩn ATS song ngữ Anh - Việt",
      completed: false,
    });
    milestonesY1S2[0].tasks.push({
      id: "t_job_apply",
      title: "Tìm kiếm và ứng tuyển cơ hội Thực tập sinh / Management Trainee mùa hè",
      completed: false,
    });
  }

  // Nếu chọn Nghiên cứu khoa học (NCKH)
  if (goals.scientificResearch) {
    milestonesY1S1[0].tasks.push({
      id: "t_nckh_topic",
      title: "Lựa chọn đề tài NCKH sinh viên cấp Khoa/Trường và liên hệ Giảng viên hướng dẫn",
      completed: false,
    });
    milestonesY1S2[0].tasks.push({
      id: "t_nckh_data",
      title: "Thu thập dữ liệu, viết báo cáo nghiệm thu và chuẩn bị bài tham luận",
      completed: false,
    });
  }

  // Nếu chọn Khởi nghiệp
  if (goals.startup) {
    milestonesY1S2[0].tasks.push({
      id: "t_startup_pitch",
      title: "Xây dựng Business Model Canvas và đăng ký tham gia cuộc thi Ý tưởng Khởi nghiệp sinh viên",
      completed: false,
    });
  }

  // Nếu chọn Phát triển cá nhân
  if (goals.personalGrowth) {
    milestonesY1S1[0].tasks.push({
      id: "t_soft_skills",
      title: "Hoàn thành khóa học kỹ năng mềm: Thuyết trình trước đám đông và Quản lý thời gian",
      completed: false,
    });
  }

  return [
    {
      yearNumber: 1,
      semesters: [
        { semesterNumber: 1, milestones: milestonesY1S1 },
        { semesterNumber: 2, milestones: milestonesY1S2 },
      ],
    },
  ];
}

/**
 * PUT /api/profile/goals
 * FR-PRO-02, FR-RM-08, FR-RM-09: Cập nhật mục tiêu và tự động kích hoạt sinh Lộ trình mới
 */
export async function PUT(req: Request) {
  try {
    const authUser = await requireAuth();

    const body = await req.json();
    const validated = updateGoalsSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        {
          error: "Dữ liệu mục tiêu phát triển không hợp lệ",
          details: validated.error.issues.map((i) => i.message),
        },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const goals = validated.data;

    // 1. Cập nhật mục tiêu trong StudentProfile
    const updatedProfile = await StudentProfile.findOneAndUpdate(
      { userId: authUser.id },
      { $set: { developmentGoals: goals } },
      { new: true, upsert: true }
    );

    // 2. Kích hoạt tự động sinh Lộ trình mới (Automatic Roadmap Regeneration - BR-08, BR-09)
    // Lưu trữ lộ trình cũ (Chuyển sang ARCHIVED)
    await Roadmap.updateMany(
      { studentId: authUser.id, status: "ACTIVE" },
      { $set: { status: "ARCHIVED" } }
    );

    // Sinh cấu trúc lộ trình mới theo mục tiêu
    const generatedYears = generateRoadmapStructure(goals);

    // Khởi tạo Lộ trình ACTIVE duy nhất mới
    const newRoadmap = await Roadmap.create({
      studentId: authUser.id,
      status: "ACTIVE",
      goalSnapshot: goals,
      progressPercent: 0,
      years: generatedYears,
    });

    return NextResponse.json({
      success: true,
      message: "Cập nhật mục tiêu phát triển thành công! Lộ trình mới của bạn đã được khởi tạo tự động.",
      profile: updatedProfile,
      roadmap: newRoadmap,
    });
  } catch (error) {
    return handleAuthError(error);
  }
}

