import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { QuizQuestion } from "@/models/QuizQuestion";

const DEFAULT_QUESTIONS = [
  {
    question: "Mục tiêu lớn nhất của bạn trong 2-4 năm tới tại trường đại học là gì?",
    category: "GOAL",
    order: 1,
    isActive: true,
    options: [
      {
        id: "q1_a",
        text: "Săn học bổng du học toàn phần hoặc bán phần sau đại học (Thạc sĩ / Tiến sĩ)",
        scores: { study_abroad: 5, skills: 1 },
      },
      {
        id: "q1_b",
        text: "Trở thành Quản trị viên tập sự (Management Trainee) hoặc làm việc tại các tập đoàn đa quốc gia",
        scores: { employment: 5, skills: 1 },
      },
      {
        id: "q1_c",
        text: "Tham gia nghiên cứu khoa học, viết bài báo học thuật và hướng tới học thuật chuyên sâu",
        scores: { research: 5, study_abroad: 2 },
      },
      {
        id: "q1_d",
        text: "Xây dựng dự án khởi nghiệp hoặc tham gia các vườn ươm đổi mới sáng tạo sinh viên",
        scores: { startup: 5, employment: 1 },
      },
      {
        id: "q1_e",
        text: "Phát triển kỹ năng mềm, chứng chỉ ngoại ngữ và mở rộng trải nghiệm xã hội",
        scores: { skills: 5 },
      },
    ],
  },
  {
    question: "Bạn cảm thấy hứng thú nhất với hình thức hoạt động nào sau đây?",
    category: "INTEREST",
    order: 2,
    isActive: true,
    options: [
      {
        id: "q2_a",
        text: "Tìm hiểu văn hóa các nước, đọc tài liệu nước ngoài và cải thiện ngoại ngữ",
        scores: { study_abroad: 4, skills: 2 },
      },
      {
        id: "q2_b",
        text: "Giải quyết các bài toán kinh doanh (Case Study), đàm phán và thuyết trình dự án",
        scores: { employment: 4, startup: 2 },
      },
      {
        id: "q2_c",
        text: "Phân tích số liệu, đọc bài báo quốc tế và đào sâu lý thuyết chuyên ngành",
        scores: { research: 5 },
      },
      {
        id: "q2_d",
        text: "Lên ý tưởng sản phẩm mới, tìm kiếm cộng sự và tạo ra giá trị kinh tế thực tế",
        scores: { startup: 5, employment: 2 },
      },
      {
        id: "q2_e",
        text: "Tham gia câu lạc bộ, tổ chức sự kiện và hoạt động tình nguyện vì cộng đồng",
        scores: { skills: 5 },
      },
    ],
  },
  {
    question: "Bạn đã có kế hoạch nào cho chứng chỉ ngoại ngữ (IELTS / TOEIC / HSK / JLPT) chưa?",
    category: "PREPARATION",
    order: 3,
    isActive: true,
    options: [
      {
        id: "q3_a",
        text: "Đang ôn luyện nghiêm túc và mục tiêu đạt điểm cao (IELTS 7.0+ / HSK 5+) để nộp hồ sơ học bổng",
        scores: { study_abroad: 5, skills: 2 },
      },
      {
        id: "q3_b",
        text: "Cần chứng chỉ để đáp ứng yêu cầu tuyển dụng của doanh nghiệp nước ngoài (FDI)",
        scores: { employment: 4, skills: 2 },
      },
      {
        id: "q3_c",
        text: "Cần chứng chỉ để đọc hiểu và viết bài tham luận nghiên cứu quốc tế",
        scores: { research: 3, skills: 2 },
      },
      {
        id: "q3_d",
        text: "Tập trung vào kỹ năng giao tiếp thực chiến hơn là chứng chỉ học thuật",
        scores: { startup: 3, skills: 3 },
      },
      {
        id: "q3_e",
        text: "Chưa có kế hoạch cụ thể, muốn cải thiện dần dần từng bước",
        scores: { skills: 3 },
      },
    ],
  },
  {
    question: "Môi trường làm việc lý tưởng trong tương lai mà bạn hình dung là:",
    category: "ENVIRONMENT",
    order: 4,
    isActive: true,
    options: [
      {
        id: "q4_a",
        text: "Môi trường quốc tế tại Châu Âu, Bắc Mỹ, Úc hoặc Nhật Bản",
        scores: { study_abroad: 5, employment: 2 },
      },
      {
        id: "q4_b",
        text: "Doanh nghiệp FDI, tập đoàn lớn có lộ trình thăng tiến rõ ràng",
        scores: { employment: 5 },
      },
      {
        id: "q4_c",
        text: "Viện nghiên cứu, trường đại học hoặc các tổ chức giáo dục chuyên sâu",
        scores: { research: 5 },
      },
      {
        id: "q4_d",
        text: "Doanh nghiệp khởi nghiệp công nghệ (Tech Startup) năng động, linh hoạt",
        scores: { startup: 5 },
      },
      {
        id: "q4_e",
        text: "Các tổ chức phi chính phủ (NGO) hoặc môi trường gắn kết cộng đồng",
        scores: { skills: 4, research: 2 },
      },
    ],
  },
  {
    question: "Điểm số GPA trên giảng đường có ý nghĩa thế nào đối với kế hoạch của bạn?",
    category: "ACADEMIC",
    order: 5,
    isActive: true,
    options: [
      {
        id: "q5_a",
        text: "Cực kỳ quan trọng vì là tiêu chí tiên quyết để xét tuyển học bổng du học",
        scores: { study_abroad: 5, research: 3 },
      },
      {
        id: "q5_b",
        text: "Rất quan trọng, mục tiêu Giỏi/Xuất sắc để vượt qua vòng hồ sơ ứng tuyển MT",
        scores: { employment: 4 },
      },
      {
        id: "q5_c",
        text: "Tối quan trọng, tôi hướng tới thủ khoa hoặc sinh viên tiêu biểu trong NCKH",
        scores: { research: 5 },
      },
      {
        id: "q5_d",
        text: "Chỉ cần mức Khá trở lên, tôi ưu tiên kinh nghiệm thực tế và dự án",
        scores: { startup: 4, skills: 2 },
      },
      {
        id: "q5_e",
        text: "Đạt chuẩn tốt nghiệp đúng hạn kết hợp tham gia nhiều hoạt động rèn luyện",
        scores: { skills: 4 },
      },
    ],
  },
];

/**
 * GET /api/quiz
 * FR-ONB-01, FR-ONB-02: Lấy danh sách câu hỏi trắc nghiệm định hướng
 */
export async function GET() {
  try {
    await connectToDatabase();

    let questions = await QuizQuestion.find({ isActive: true }).sort({ order: 1 });

    // Nếu chưa có câu hỏi nào trong DB, tự động nạp bộ câu hỏi chuẩn ban đầu
    if (!questions || questions.length === 0) {
      await QuizQuestion.insertMany(DEFAULT_QUESTIONS);
      questions = await QuizQuestion.find({ isActive: true }).sort({ order: 1 });
    }

    return NextResponse.json({
      success: true,
      totalQuestions: questions.length,
      questions: questions.map((q) => ({
        id: q._id.toString(),
        question: q.question,
        category: q.category,
        order: q.order,
        options: q.options.map((opt) => ({
          id: opt.id,
          text: opt.text,
        })),
      })),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Lỗi tải câu hỏi";
    return NextResponse.json({ error: "Không thể lấy câu hỏi trắc nghiệm", details: message }, { status: 500 });
  }
}

