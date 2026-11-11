import { NextResponse } from "next/server";
import { requireAuth, handleAuthError } from "@/lib/session";
import { connectToDatabase } from "@/lib/db";
import { QuizQuestion } from "@/models/QuizQuestion";
import { QuizResult } from "@/models/QuizResult";
import { StudentProfile } from "@/models/StudentProfile";
import { Roadmap } from "@/models/Roadmap";

const DIRECTION_METADATA: Record<
  string,
  { title: string; description: string; steps: string[] }
> = {
  study_abroad: {
    title: "Du học & Săn học bổng Quốc tế",
    description:
      "Bạn có đam mê trải nghiệm môi trường học thuật quốc tế, tư duy cầu tiến và định hướng nâng cao trình độ chuyên sâu tại các trường đại học hàng đầu thế giới.",
    steps: [
      "Xác định điểm đến mục tiêu và tìm hiểu tiêu chí học bổng (GPA, chứng chỉ, thư giới thiệu)",
      "Lập kế hoạch thi chứng chỉ ngoại ngữ mục tiêu (IELTS 7.0+ hoặc HSK 5+/JLPT N2)",
      "Tích lũy hồ sơ hoạt động ngoại khóa, bài luận cá nhân (SOP) và giữ GPA trên 3.2",
    ],
  },
  employment: {
    title: "Quản trị viên Tập sự & Doanh nghiệp Toàn cầu",
    description:
      "Bạn hướng tới môi trường kinh doanh thực chiến, năng động, thích giải quyết các bài toán thử thách và phát triển kỹ năng lãnh đạo trong các tập đoàn đa quốc gia.",
    steps: [
      "Chuẩn bị bản CV song ngữ chuẩn ATS làm nổi bật kỹ năng và dự án môn học",
      "Luyện tập kỹ năng phỏng vấn theo khung năng lực và giải Case Study kinh doanh",
      "Ứng tuyển các đợt Management Trainee hoặc vị trí thực tập sinh mùa hè",
    ],
  },
  research: {
    title: "Nghiên cứu Khoa học & Học thuật Chuyên sâu",
    description:
      "Bạn sở hữu tư duy phân tích sắc sảo, tính kiên trì và niềm say mê khám phá bản chất các vấn đề học thuật chuyên ngành.",
    steps: [
      "Gia nhập nhóm NCKH sinh viên của Khoa hoặc liên hệ Thầy/Cô hướng dẫn đề tài",
      "Học phương pháp nghiên cứu khoa học, xử lý số liệu và viết tổng quan tài liệu",
      "Hoàn thiện bài báo cáo tham gia hội nghị sinh viên nghiên cứu cấp Trường",
    ],
  },
  startup: {
    title: "Khởi nghiệp & Đổi mới Sáng tạo",
    description:
      "Bạn là người giàu sáng kiến, dám nghĩ dám làm, yêu thích biến ý tưởng thành sản phẩm thực tế và giải quyết bài toán thị trường.",
    steps: [
      "Xây dựng ý tưởng giải pháp và hoàn thiện bản mô hình kinh doanh (Business Model Canvas)",
      "Tìm kiếm cộng sự cùng chí hướng và đăng ký tham gia cuộc thi Khởi nghiệp sinh viên",
      "Tham gia các vườn ươm khởi nghiệp và kết nối với các Mentor doanh nhân",
    ],
  },
  skills: {
    title: "Phát triển Năng lực Cá nhân & Kỹ năng Toàn diện",
    description:
      "Bạn đề cao sự cân bằng, mong muốn rèn luyện kỹ năng mềm, ngoại ngữ giao tiếp và tích cực đóng góp cho các hoạt động cộng đồng.",
    steps: [
      "Đặt mục tiêu thi đạt chứng chỉ ngoại ngữ chuẩn hóa trong năm nay",
      "Đảm nhận vai trò nòng cốt trong các CLB sinh viên hoặc dự án tình nguyện",
      "Tham gia các workshop kỹ năng: Đàm phán, Quản lý thời gian, Thuyết trình",
    ],
  },
};

/**
 * POST /api/quiz/submit
 * FR-ONB-03, FR-ONB-04, FR-ONB-05, FR-ONB-06, FR-ONB-07
 */
export async function POST(req: Request) {
  try {
    const authUser = await requireAuth();
    const body = await req.json();
    const { answers } = body; // Map: { [questionId]: optionId }

    if (!answers || typeof answers !== "object") {
      return NextResponse.json(
        { error: "Dữ liệu bài làm trắc nghiệm không hợp lệ." },
        { status: 400 }
      );
    }

    await connectToDatabase();

    // 1. Tải toàn bộ câu hỏi đang kích hoạt
    const questions = await QuizQuestion.find({ isActive: true });
    if (!questions.length) {
      return NextResponse.json(
        { error: "Hệ thống trắc nghiệm tạm thời chưa có câu hỏi." },
        { status: 500 }
      );
    }

    // Kiểm tra xem sinh viên đã trả lời đủ câu hỏi chưa (FR-ONB-04)
    for (const q of questions) {
      if (!answers[q._id.toString()]) {
        return NextResponse.json(
          {
            error: "Vui lòng trả lời đầy đủ tất cả các câu hỏi trước khi gửi bài.",
            missingQuestionId: q._id.toString(),
          },
          { status: 400 }
        );
      }
    }

    // 2. Thuật toán chấm điểm Rule-based (FR-ONB-05)
    const scores = {
      study_abroad: 0,
      employment: 0,
      research: 0,
      startup: 0,
      skills: 0,
    };

    for (const q of questions) {
      const selectedOptionId = answers[q._id.toString()];
      const opt = q.options.find((o) => o.id === selectedOptionId);
      if (opt && opt.scores) {
        scores.study_abroad += opt.scores.study_abroad || 0;
        scores.employment += opt.scores.employment || 0;
        scores.research += opt.scores.research || 0;
        scores.startup += opt.scores.startup || 0;
        scores.skills += opt.scores.skills || 0;
      }
    }

    // 3. Sắp xếp thứ hạng các hướng đi theo điểm
    const rankedDirections = Object.entries(scores)
      .map(([dir, score]) => ({
        direction: dir,
        score,
        meta: DIRECTION_METADATA[dir],
      }))
      .sort((a, b) => b.score - a.score);

    const top1 = rankedDirections[0];
    const top2 = rankedDirections[1];

    const recommendedDirections = [
      {
        direction: top1.direction,
        title: top1.meta.title,
        score: top1.score,
        description: top1.meta.description,
        suggestedNextSteps: top1.meta.steps,
      },
    ];

    // Nếu hướng thứ 2 có điểm chênh lệch không quá 20% so với Top 1, đề xuất cả 2 hướng (FR-ONB-06)
    if (top2 && top1.score > 0 && (top1.score - top2.score) / top1.score <= 0.25) {
      recommendedDirections.push({
        direction: top2.direction,
        title: top2.meta.title,
        score: top2.score,
        description: top2.meta.description,
        suggestedNextSteps: top2.meta.steps,
      });
    }

    // 4. Lưu kết quả trắc nghiệm vào cơ sở dữ liệu (Bảo toàn lịch sử - FR-ONB-08, FR-ONB-09)
    const newResult = await QuizResult.create({
      studentId: authUser.id,
      answers,
      scores,
      recommendedDirections,
    });

    // 5. Tự động áp dụng kết quả vào Hồ sơ sinh viên (FR-ONB-06)
    const newGoals = {
      studyAbroad: recommendedDirections.some((d) => d.direction === "study_abroad"),
      employment: recommendedDirections.some((d) => d.direction === "employment"),
      scientificResearch: recommendedDirections.some((d) => d.direction === "research"),
      startup: recommendedDirections.some((d) => d.direction === "startup"),
      personalGrowth: recommendedDirections.some((d) => d.direction === "skills"),
      notes: `Định hướng khuyến nghị từ bài trắc nghiệm: ${recommendedDirections.map((d) => d.title).join(" & ")}.`,
    };

    await StudentProfile.findOneAndUpdate(
      { userId: authUser.id },
      { $set: { developmentGoals: newGoals } },
      { upsert: true }
    );

    // 6. Tự động cập nhật Lộ trình hoạt động (FR-ONB-07, FR-RM-08)
    await Roadmap.updateMany(
      { studentId: authUser.id, status: "ACTIVE" },
      { $set: { status: "ARCHIVED" } }
    );

    const newRoadmap = await Roadmap.create({
      studentId: authUser.id,
      status: "ACTIVE",
      goalSnapshot: newGoals,
      progressPercent: 0,
      years: [
        {
          yearNumber: 1,
          semesters: [
            {
              semesterNumber: 1,
              milestones: [
                {
                  id: "m_foundations",
                  title: `Giai đoạn 1: Xây dựng nền tảng cho hướng đi ${top1.meta.title}`,
                  tasks: top1.meta.steps.map((step, idx) => ({
                    id: `task_top1_${idx + 1}`,
                    title: step,
                    completed: false,
                  })),
                },
              ],
            },
          ],
        },
      ],
    });

    return NextResponse.json({
      success: true,
      message: "Hoàn thành bài trắc nghiệm định hướng thành công!",
      result: newResult,
      roadmapId: newRoadmap._id.toString(),
    });
  } catch (error) {
    return handleAuthError(error);
  }
}
