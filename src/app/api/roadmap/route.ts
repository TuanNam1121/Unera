import { NextResponse } from "next/server";
import { requireAuth, handleAuthError } from "@/lib/session";
import { connectToDatabase } from "@/lib/db";
import { Roadmap } from "@/models/Roadmap";
import { StudentProfile } from "@/models/StudentProfile";

function createDefaultRoadmapData(studentId: string, goalTitle?: string) {
  return {
    studentId,
    status: "ACTIVE",
    goalSnapshot: {
      notes: goalTitle || "Trở thành Du học sinh Mỹ & Học bổng Toàn phần",
      studyAbroad: true,
    },
    progressPercent: 25,
    years: [
      {
        yearNumber: 1,
        semesters: [
          {
            semesterNumber: 1,
            milestones: [
              {
                id: "m1_1",
                title: "Khởi động & Hòa nhập môi trường đại học",
                tasks: [
                  {
                    id: "t1_1_1",
                    title: "Đạt GPA từ 3.2 trở lên trong học kỳ đầu",
                    description: "Xây dựng phương pháp ghi chép và tự học hiệu quả các môn đại cương",
                    completed: true,
                    dueDate: new Date("2026-01-15"),
                  },
                  {
                    id: "t1_1_2",
                    title: "Gia nhập 1 CLB học thuật hoặc ngoại ngữ",
                    description: "Mở rộng mạng lưới kết nối bạn bè và rèn luyện kỹ năng làm việc nhóm",
                    completed: true,
                    dueDate: new Date("2026-02-28"),
                  },
                ],
              },
            ],
          },
          {
            semesterNumber: 2,
            milestones: [
              {
                id: "m1_2",
                title: "Định vị năng lực & Khảo sát hướng đi",
                tasks: [
                  {
                    id: "t1_2_1",
                    title: "Thi thử IELTS / TOEFL xác định trình độ",
                    description: "Đặt band điểm mục tiêu tối thiểu 7.0 IELTS",
                    completed: true,
                    dueDate: new Date("2026-05-20"),
                  },
                  {
                    id: "t1_2_2",
                    title: "Tìm hiểu 5 chương trình học bổng phù hợp",
                    description: "Lập danh sách các trường đại học mục tiêu tại Mỹ và Châu Âu",
                    completed: false,
                    dueDate: new Date("2026-06-30"),
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        yearNumber: 2,
        semesters: [
          {
            semesterNumber: 1,
            milestones: [
              {
                id: "m2_1",
                title: "Tích lũy hồ sơ & Nghiên cứu khoa học",
                tasks: [
                  {
                    id: "t2_1_1",
                    title: "Duy trì GPA tích lũy 3.5+ Năm 2",
                    description: "Tập trung các môn chuyên ngành nền tảng để tạo điểm nhấn học thuật",
                    completed: false,
                    dueDate: new Date("2026-11-30"),
                  },
                  {
                    id: "t2_1_2",
                    title: "Nộp cover letter & Đơn ứng tuyển Trợ lý nghiên cứu (RA)",
                    description: "Liên hệ giảng viên hướng dẫn hoặc bộ môn để tham gia nhóm đề tài",
                    completed: false,
                    dueDate: new Date("2026-12-15"),
                  },
                  {
                    id: "t2_1_3",
                    title: "Thi chính thức chứng chỉ ngoại ngữ IELTS 7.5+",
                    description: "Hoàn tất chứng chỉ chuẩn hóa phục vụ hồ sơ học bổng",
                    completed: false,
                    dueDate: new Date("2027-01-20"),
                  },
                ],
              },
            ],
          },
          {
            semesterNumber: 2,
            milestones: [
              {
                id: "m2_2",
                title: "Thực tập và Trải nghiệm thực chiến",
                tasks: [
                  {
                    id: "t2_2_1",
                    title: "Ứng tuyển thực tập sinh mùa hè tại doanh nghiệp/tổ chức",
                    description: "Tìm kiếm các vị trí thực tập thuộc khối ngành liên quan",
                    completed: false,
                    dueDate: new Date("2027-05-15"),
                  },
                  {
                    id: "t2_2_2",
                    title: "Tham gia cuộc thi học thuật cấp trường hoặc quốc gia",
                    description: "Tích lũy thành tích ngoại khóa và giải thưởng học thuật",
                    completed: false,
                    dueDate: new Date("2027-06-30"),
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        yearNumber: 3,
        semesters: [
          {
            semesterNumber: 1,
            milestones: [
              {
                id: "m3_1",
                title: "Chuẩn bị bài luận cá nhân (SOP / Personal Statement)",
                tasks: [
                  {
                    id: "t3_1_1",
                    title: "Viết dàn ý bài luận cá nhân thể hiện rõ động lực và khát vọng",
                    description: "Nhờ cố vấn mentor hoặc giảng viên nhận xét bản thảo đầu tiên",
                    completed: false,
                    dueDate: new Date("2027-11-15"),
                  },
                  {
                    id: "t3_1_2",
                    title: "Liên hệ xin 2-3 Thư giới thiệu (Letters of Recommendation)",
                    description: "Giữ liên lạc với các thầy cô và quản lý trực tiếp",
                    completed: false,
                    dueDate: new Date("2027-12-30"),
                  },
                ],
              },
            ],
          },
          {
            semesterNumber: 2,
            milestones: [
              {
                id: "m3_2",
                title: "Hoàn thiện bộ hồ sơ nộp đơn sớm (Early Round)",
                tasks: [
                  {
                    id: "t3_2_1",
                    title: "Dịch thuật công chứng bảng điểm và các chứng chỉ liên quan",
                    description: "Chuẩn bị đầy đủ bản cứng và bản mềm theo quy chuẩn ATS",
                    completed: false,
                    dueDate: new Date("2028-04-30"),
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        yearNumber: 4,
        semesters: [
          {
            semesterNumber: 1,
            milestones: [
              {
                id: "m4_1",
                title: "Nộp hồ sơ chính thức & Phỏng vấn học bổng",
                tasks: [
                  {
                    id: "t4_1_1",
                    title: "Gửi hồ sơ hoàn chỉnh tới các trường đại học mục tiêu",
                    description: "Theo dõi sát sao cổng ứng tuyển và xác nhận biên lai tiếp nhận",
                    completed: false,
                    dueDate: new Date("2028-11-30"),
                  },
                  {
                    id: "t4_1_2",
                    title: "Luyện phỏng vấn 1-1 với Mentor học bổng",
                    description: "Tập dượt các câu hỏi về mục tiêu nghề nghiệp và đóng góp cộng đồng",
                    completed: false,
                    dueDate: new Date("2028-12-20"),
                  },
                ],
              },
            ],
          },
          {
            semesterNumber: 2,
            milestones: [
              {
                id: "m4_2",
                title: "Tốt nghiệp đại học & Chuẩn bị xuất cảnh",
                tasks: [
                  {
                    id: "t4_2_1",
                    title: "Bảo vệ khóa luận tốt nghiệp đạt điểm xuất sắc",
                    completed: false,
                    dueDate: new Date("2029-05-15"),
                  },
                  {
                    id: "t4_2_2",
                    title: "Hoàn tất thủ tục visa du học và vé máy bay",
                    completed: false,
                    dueDate: new Date("2029-07-30"),
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
  };
}

/**
 * GET /api/roadmap
 * Trả về lộ trình đang kích hoạt (ACTIVE) duy nhất của sinh viên (FR-RM-01, FR-RM-02, BR-07)
 */
export async function GET() {
  try {
    const user = await requireAuth();
    await connectToDatabase();

    let roadmap = await Roadmap.findOne({
      studentId: user.id,
      status: "ACTIVE",
    });

    // Nếu sinh viên chưa có lộ trình, tự động tạo mới dựa trên thông tin hồ sơ
    if (!roadmap) {
      const profile = await StudentProfile.findOne({ userId: user.id });
      let goalText = "Trở thành Du học sinh & Học bổng Toàn phần";
      if (profile?.developmentGoals?.notes) {
        goalText = profile.developmentGoals.notes;
      } else if (profile?.developmentGoals?.employment) {
        goalText = "Quản trị viên Tập sự (Management Trainee) & Khối MNCs";
      } else if (profile?.developmentGoals?.scientificResearch) {
        goalText = "Nghiên cứu Khoa học & Học thuật Chuyên sâu";
      } else if (profile?.developmentGoals?.startup) {
        goalText = "Khởi nghiệp & Đổi mới Sáng tạo";
      }

      const defaultData = createDefaultRoadmapData(user.id, goalText);
      roadmap = new Roadmap(defaultData);
      await roadmap.save();
    }

    return NextResponse.json({
      success: true,
      roadmap,
    });
  } catch (error) {
    return handleAuthError(error);
  }
}

/**
 * PATCH /api/roadmap
 * Cập nhật trạng thái nhiệm vụ (tick hoàn thành / đổi hạn chót)
 * FR-RM-05, FR-RM-06, FR-RM-07
 */
export async function PATCH(req: Request) {
  try {
    const user = await requireAuth();
    const body = await req.json();
    const { taskId, completed, dueDate, title } = body;

    if (!taskId) {
      return NextResponse.json(
        { error: "Thiếu mã định danh nhiệm vụ (taskId)." },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const roadmap = await Roadmap.findOne({
      studentId: user.id,
      status: "ACTIVE",
    });

    if (!roadmap) {
      return NextResponse.json(
        { error: "Không tìm thấy lộ trình đang kích hoạt." },
        { status: 404 }
      );
    }

    let found = false;

    // Duyệt qua cấu trúc cây năm -> kỳ -> cột mốc -> nhiệm vụ
    for (const year of roadmap.years) {
      for (const semester of year.semesters) {
        for (const milestone of semester.milestones) {
          for (const task of milestone.tasks) {
            if (task.id === taskId) {
              found = true;
              if (typeof completed === "boolean") {
                task.completed = completed;
              }
              if (dueDate !== undefined) {
                task.dueDate = dueDate ? new Date(dueDate) : undefined;
              }
              if (title) {
                task.title = title;
              }
              break;
            }
          }
          if (found) break;
        }
        if (found) break;
      }
      if (found) break;
    }

    if (!found) {
      return NextResponse.json(
        { error: "Nhiệm vụ không tồn tại trong lộ trình." },
        { status: 404 }
      );
    }

    // roadmap.save() kích hoạt hook pre("save") tự động cập nhật progressPercent (FR-RM-07)
    await roadmap.save();

    return NextResponse.json({
      success: true,
      message: "Cập nhật tiến độ nhiệm vụ thành công",
      progressPercent: roadmap.progressPercent,
      roadmap,
    });
  } catch (error) {
    return handleAuthError(error);
  }
}

/**
 * POST /api/roadmap
 * Bổ sung nhiệm vụ mới vào một cột mốc cụ thể
 */
export async function POST(req: Request) {
  try {
    const user = await requireAuth();
    const body = await req.json();
    const { milestoneId, title, description, dueDate } = body;

    if (!milestoneId || !title) {
      return NextResponse.json(
        { error: "Vui lòng nhập đầy đủ cột mốc và tiêu đề nhiệm vụ." },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const roadmap = await Roadmap.findOne({
      studentId: user.id,
      status: "ACTIVE",
    });

    if (!roadmap) {
      return NextResponse.json(
        { error: "Không tìm thấy lộ trình đang kích hoạt." },
        { status: 404 }
      );
    }

    let found = false;
    const newTaskId = `custom_${Date.now()}`;

    for (const year of roadmap.years) {
      for (const semester of year.semesters) {
        for (const milestone of semester.milestones) {
          if (milestone.id === milestoneId) {
            milestone.tasks.push({
              id: newTaskId,
              title: title.trim(),
              description: description?.trim() || "",
              completed: false,
              dueDate: dueDate ? new Date(dueDate) : undefined,
            });
            found = true;
            break;
          }
        }
        if (found) break;
      }
      if (found) break;
    }

    if (!found) {
      return NextResponse.json(
        { error: "Không tìm thấy cột mốc tương ứng để thêm nhiệm vụ." },
        { status: 404 }
      );
    }

    await roadmap.save();

    return NextResponse.json({
      success: true,
      message: "Thêm nhiệm vụ mới thành công",
      taskId: newTaskId,
      progressPercent: roadmap.progressPercent,
      roadmap,
    });
  } catch (error) {
    return handleAuthError(error);
  }
}

