import { NextResponse } from "next/server";
import { requireAdmin, handleAuthError } from "@/lib/session";
import { connectToDatabase } from "@/lib/db";
import { QuizQuestion } from "@/models/QuizQuestion";
import { logAuditAction } from "@/lib/audit";

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
        scores: { study_abroad: 5, skills: 1, employment: 0, research: 0, startup: 0 },
      },
      {
        id: "q1_b",
        text: "Trở thành Quản trị viên tập sự (Management Trainee) hoặc làm việc tại các tập đoàn đa quốc gia",
        scores: { employment: 5, skills: 1, study_abroad: 0, research: 0, startup: 0 },
      },
      {
        id: "q1_c",
        text: "Tham gia nghiên cứu khoa học, viết bài báo học thuật và hướng tới học thuật chuyên sâu",
        scores: { research: 5, study_abroad: 2, employment: 0, startup: 0, skills: 0 },
      },
      {
        id: "q1_d",
        text: "Xây dựng dự án khởi nghiệp hoặc tham gia các vườn ươm đổi mới sáng tạo sinh viên",
        scores: { startup: 5, employment: 1, study_abroad: 0, research: 0, skills: 0 },
      },
      {
        id: "q1_e",
        text: "Phát triển kỹ năng mềm, chứng chỉ ngoại ngữ và mở rộng trải nghiệm xã hội",
        scores: { skills: 5, study_abroad: 0, employment: 0, research: 0, startup: 0 },
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
        scores: { study_abroad: 4, skills: 2, employment: 0, research: 0, startup: 0 },
      },
      {
        id: "q2_b",
        text: "Giải quyết các bài toán kinh doanh (Case Study), đàm phán và thuyết trình dự án",
        scores: { employment: 4, startup: 2, study_abroad: 0, research: 0, skills: 0 },
      },
      {
        id: "q2_c",
        text: "Phân tích số liệu, đọc bài báo quốc tế và đào sâu lý thuyết chuyên ngành",
        scores: { research: 5, study_abroad: 0, employment: 0, startup: 0, skills: 0 },
      },
      {
        id: "q2_d",
        text: "Lên ý tưởng sản phẩm mới, tìm kiếm cộng sự và tạo ra giá trị kinh tế thực tế",
        scores: { startup: 5, employment: 2, study_abroad: 0, research: 0, skills: 0 },
      },
      {
        id: "q2_e",
        text: "Tham gia câu lạc bộ, tổ chức sự kiện và hoạt động tình nguyện vì cộng đồng",
        scores: { skills: 5, study_abroad: 0, employment: 0, research: 0, startup: 0 },
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
        scores: { study_abroad: 5, skills: 2, employment: 0, research: 0, startup: 0 },
      },
      {
        id: "q3_b",
        text: "Cần chứng chỉ để đáp ứng yêu cầu tuyển dụng của doanh nghiệp nước ngoài (FDI)",
        scores: { employment: 4, skills: 2, study_abroad: 0, research: 0, startup: 0 },
      },
      {
        id: "q3_c",
        text: "Cần chứng chỉ để đọc hiểu và viết bài tham luận nghiên cứu quốc tế",
        scores: { research: 3, skills: 2, study_abroad: 0, employment: 0, startup: 0 },
      },
      {
        id: "q3_d",
        text: "Tập trung vào kỹ năng giao tiếp thực chiến hơn là chứng chỉ học thuật",
        scores: { startup: 3, skills: 3, study_abroad: 0, employment: 0, research: 0 },
      },
      {
        id: "q3_e",
        text: "Chưa có kế hoạch cụ thể, muốn cải thiện dần dần từng bước",
        scores: { skills: 2, study_abroad: 0, employment: 0, research: 0, startup: 0 },
      },
    ],
  },
  {
    question: "Phong cách làm việc lý tưởng mà bạn mong muốn hướng tới là gì?",
    category: "WORK_STYLE",
    order: 4,
    isActive: true,
    options: [
      {
        id: "q4_a",
        text: "Môi trường quốc tế đa văn hóa, thường xuyên công tác hoặc sinh sống tại nước ngoài",
        scores: { study_abroad: 4, employment: 3, research: 0, startup: 0, skills: 0 },
      },
      {
        id: "q4_b",
        text: "Môi trường doanh nghiệp quy chuẩn, có lộ trình thăng tiến rõ ràng theo KPI",
        scores: { employment: 5, skills: 1, study_abroad: 0, research: 0, startup: 0 },
      },
      {
        id: "q4_c",
        text: "Môi trường học thuật tự do, tập trung vào nghiên cứu, phát kiến tri thức mới",
        scores: { research: 5, study_abroad: 2, employment: 0, startup: 0, skills: 0 },
      },
      {
        id: "q4_d",
        text: "Môi trường khởi nghiệp linh hoạt, tự chủ cao, dám chấp nhận rủi ro để bứt phá",
        scores: { startup: 5, employment: 1, study_abroad: 0, research: 0, skills: 0 },
      },
      {
        id: "q4_e",
        text: "Môi trường cân bằng giữa công việc và cuộc sống (Work-Life Balance)",
        scores: { skills: 4, employment: 1, study_abroad: 0, research: 0, startup: 0 },
      },
    ],
  },
  {
    question: "Bạn đánh giá mục tiêu kết quả học tập (GPA) của mình tại trường như thế nào?",
    category: "ACADEMIC",
    order: 5,
    isActive: true,
    options: [
      {
        id: "q5_a",
        text: "GPA xuất sắc (3.6+ / 4.0) là điều kiện tiên quyết để cạnh tranh học bổng danh giá",
        scores: { study_abroad: 5, research: 4, employment: 0, startup: 0, skills: 0 },
      },
      {
        id: "q5_b",
        text: "GPA Giỏi (3.2 - 3.5) là đủ, quan trọng là hoạt động ngoại khóa và kỹ năng mềm",
        scores: { employment: 4, skills: 3, study_abroad: 0, research: 0, startup: 0 },
      },
      {
        id: "q5_c",
        text: "GPA rất quan trọng ở các môn chuyên ngành vì tôi muốn học sâu lên thạc sĩ/tiến sĩ",
        scores: { research: 5, study_abroad: 3, employment: 0, startup: 0, skills: 0 },
      },
      {
        id: "q5_d",
        text: "Chỉ cần mức Khá trở lên, tôi ưu tiên kinh nghiệm thực tế và dự án",
        scores: { startup: 4, skills: 2, study_abroad: 0, employment: 0, research: 0 },
      },
      {
        id: "q5_e",
        text: "Đạt chuẩn tốt nghiệp đúng hạn kết hợp tham gia nhiều hoạt động rèn luyện",
        scores: { skills: 4, study_abroad: 0, employment: 0, research: 0, startup: 0 },
      },
    ],
  },
];

export async function POST() {
  try {
    const admin = await requireAdmin();
    await connectToDatabase();

    await QuizQuestion.deleteMany({});
    await QuizQuestion.insertMany(DEFAULT_QUESTIONS);

    await logAuditAction({
      admin: {
        id: admin.id,
        email: admin.email || "",
        name: admin.name || "Admin",
      },
      action: "STATUS_CHANGE",
      targetCollection: "quiz_questions",
      targetId: "RESET_FACTORY",
      targetTitle: "Khôi phục bộ 5 câu hỏi chuẩn định hướng",
      reason: "Admin reset quiz questions to default",
    });

    return NextResponse.json({
      success: true,
      message: "Đã khôi phục thành công bộ câu hỏi trắc nghiệm mặc định!",
    });
  } catch (error) {
    return handleAuthError(error);
  }
}

