import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectToDatabase } from "@/lib/db";
import { User } from "@/models/User";
import { StudentProfile } from "@/models/StudentProfile";
import { Opportunity } from "@/models/Opportunity";
import { Roadmap } from "@/models/Roadmap";
import { CalendarEntry } from "@/models/CalendarEntry";
import { SavedOpportunity } from "@/models/SavedOpportunity";
import { MentorProfile } from "@/models/MentorProfile";
import { USER_ROLES, ACCOUNT_STATUS, OPPORTUNITY_CATEGORIES, OPPORTUNITY_STATUS } from "@/constants";

export async function POST() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Seed API chỉ khả dụng trong môi trường phát triển" }, { status: 403 });
  }

  try {
    await connectToDatabase();

    // 1. Tạo tài khoản Admin mặc định
    const adminPassword = await bcrypt.hash("Admin@123456", 10);
    const admin = await User.findOneAndUpdate(
      { email: "admin@unera.edu.vn" },
      {
        name: "Ban Quản Trị Unera",
        email: "admin@unera.edu.vn",
        password: adminPassword,
        role: USER_ROLES.ADMIN,
        status: ACCOUNT_STATUS.ACTIVE,
      },
      { upsert: true, new: true }
    );

    // 2. Tạo tài khoản Sinh viên mặc định
    const studentPassword = await bcrypt.hash("Student@123456", 10);
    const student = await User.findOneAndUpdate(
      { email: "student@unera.edu.vn" },
      {
        name: "Nguyễn Văn Sinh Viên",
        email: "student@unera.edu.vn",
        password: studentPassword,
        role: USER_ROLES.STUDENT,
        status: ACCOUNT_STATUS.ACTIVE,
      },
      { upsert: true, new: true }
    );

    // Hồ sơ sinh viên
    await StudentProfile.findOneAndUpdate(
      { userId: student._id.toString() },
      {
        userId: student._id.toString(),
        fullName: student.name,
        university: "Đại học Quốc gia Hà Nội",
        major: "Ngôn ngữ Anh & Công nghệ",
        academicYear: "YEAR_3",
        bio: "Sinh viên năm 3 định hướng du học bậc Thạc sĩ và ứng tuyển vị trí Product/Design tại các tập đoàn công nghệ.",
        developmentGoals: {
          studyAbroad: true,
          employment: true,
          scientificResearch: true,
          startup: false,
          personalGrowth: true,
        },
        skills: ["IELTS 7.5", "UI/UX Design", "Figma", "Nghiên cứu định lượng", "Quản lý dự án"],
        achievements: ["Học bổng Khuyến khích học tập 2025", "Giải Nhì NCKH cấp Trường 2025"],
      },
      { upsert: true }
    );

    // 3. Xóa và khởi tạo lại danh sách cơ hội mẫu
    await Opportunity.deleteMany({});

    const sampleOpportunities = [
      {
        title: "UX/UI Design Intern (Summer 2026)",
        description: "Chương trình thực tập sinh thiết kế trải nghiệm người dùng tại trung tâm nghiên cứu và phát triển sản phẩm số.",
        category: OPPORTUNITY_CATEGORIES.MULTINATIONAL.id,
        eligibility: "Sinh viên năm 3 hoặc năm 4 khối ngành Thiết kế, Công nghệ thông tin hoặc liên quan.",
        requirements: "Có Portfolio thiết kế UI/UX trên Figma, tư duy thẩm mỹ tốt, kỹ năng làm việc nhóm.",
        benefits: "Trợ cấp thực tập cạnh tranh, được kèm cặp 1-1 bởi Senior Product Designer, cơ hội lên chính thức.",
        applicationInstructions: "Nộp CV và link Portfolio trực tuyến qua cổng tuyển dụng.",
        openingDate: new Date("2026-10-01"),
        deadline: new Date(Date.now() + 18 * 24 * 60 * 60 * 1000), // Còn 18 ngày
        location: "Hà Nội · Hybrid",
        isDomestic: true,
        sourceName: "Tech Talent Portal",
        sourceUrl: "https://example.com/careers/ux-intern",
        verificationDate: new Date(),
        status: OPPORTUNITY_STATUS.PUBLISHED,
        isSponsored: true,
        version: 1,
        updatedByAdminId: admin._id.toString(),
      },
      {
        title: "Digital Skills Full Scholarship 2026",
        description: "Học bổng toàn phần dành cho sinh viên xuất sắc theo đuổi các kỹ năng số nâng cao và công nghệ mới.",
        category: OPPORTUNITY_CATEGORIES.STUDY_ABROAD.id,
        eligibility: "Sinh viên đại học quốc tế hoặc Việt Nam có GPA từ 3.2/4.0 trở lên.",
        requirements: "Bài luận cá nhân (500 từ), 2 thư giới thiệu, bảng điểm học tập gần nhất.",
        benefits: "Hỗ trợ 100% học phí, sinh hoạt phí hàng tháng và vé máy bay khứ hồi.",
        applicationInstructions: "Hoàn thiện hồ sơ trực tuyến kèm chứng chỉ ngoại ngữ tương đương IELTS 6.5+.",
        openingDate: new Date("2026-09-15"),
        deadline: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000), // Còn 25 ngày
        location: "Trực tuyến · 8 tuần",
        isDomestic: false,
        sourceName: "Global Education Foundation",
        sourceUrl: "https://example.com/scholarships/digital-skills",
        verificationDate: new Date(),
        status: OPPORTUNITY_STATUS.PUBLISHED,
        isSponsored: false,
        version: 1,
        updatedByAdminId: admin._id.toString(),
      },
      {
        title: "Build for Tomorrow Hackathon & Innovation Contest 2026",
        description: "Cuộc thi sáng tạo công nghệ và giải quyết các bài toán xã hội quy mô toàn quốc dành cho sinh viên.",
        category: OPPORTUNITY_CATEGORIES.COMPETITIONS.id,
        eligibility: "Sinh viên các trường đại học toàn quốc, thi theo đội từ 2-4 thành viên.",
        requirements: "Đề án sản phẩm hoặc nguyên mẫu công nghệ giải quyết 1 trong 3 chủ đề: Giáo dục, Y tế, Bền vững.",
        benefits: "Tổng giải thưởng 200.000.000 VNĐ, tài trợ ươm tạo dự án và kết nối các quỹ đầu tư thiên thần.",
        applicationInstructions: "Đại diện nhóm đăng ký trực tuyến kèm slide trình bày ý tưởng trước hạn chót.",
        openingDate: new Date("2026-10-10"),
        deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // Còn 30 ngày
        location: "Toàn quốc · Đội 2-4 người",
        isDomestic: true,
        sourceName: "National Youth Innovation",
        sourceUrl: "https://example.com/competitions/build-tomorrow",
        verificationDate: new Date(),
        status: OPPORTUNITY_STATUS.PUBLISHED,
        isSponsored: true,
        version: 1,
        updatedByAdminId: admin._id.toString(),
      },
      {
        title: "Unilever Future Leaders Programme (UFLP 2026)",
        description: "Chương trình Quản trị viên tập sự danh giá đào tạo các nhà lãnh đạo tương lai trong vòng 3 năm.",
        category: OPPORTUNITY_CATEGORIES.MANAGEMENT_TRAINEE.id,
        eligibility: "Sinh viên năm cuối hoặc mới tốt nghiệp dưới 2 năm kinh nghiệm.",
        requirements: "Tiếng Anh trôi chảy, tư duy logic, tố chất lãnh đạo, khả năng thích ứng cao.",
        benefits: "Lộ trình đào tạo quốc tế chuyên sâu, mức đãi ngộ top đầu thị trường, luân chuyển phòng ban đa quốc gia.",
        applicationInstructions: "Ứng tuyển trực tuyến qua hệ thống kiểm tra năng lực và làm video phỏng vấn.",
        openingDate: new Date("2026-10-01"),
        deadline: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000), // Còn 12 ngày
        location: "Hà Nội / TP. Hồ Chí Minh",
        isDomestic: true,
        sourceName: "Unilever Careers Vietnam",
        sourceUrl: "https://example.com/uflp",
        verificationDate: new Date(),
        status: OPPORTUNITY_STATUS.PUBLISHED,
        isSponsored: true,
        version: 1,
        updatedByAdminId: admin._id.toString(),
      },
      {
        title: "Tài trợ Đề tài Nghiên cứu Khoa học Sinh viên 2026",
        description: "Quỹ tài trợ các công trình nghiên cứu khoa học sinh viên trong lĩnh vực Khoa học Xã hội và Trí tuệ nhân tạo.",
        category: OPPORTUNITY_CATEGORIES.SCIENTIFIC_RESEARCH.id,
        eligibility: "Nhóm nghiên cứu sinh viên có giảng viên hướng dẫn bảo trợ.",
        requirements: "Thuyết minh đề tài nghiên cứu chi tiết kèm tổng quan tài liệu và phương pháp nghiên cứu dự kiến.",
        benefits: "Hỗ trợ kinh phí nghiên cứu tối đa 30.000.000 VNĐ/đề tài, hỗ trợ xuất bản bài báo khoa học.",
        applicationInstructions: "Nộp đề cương thuyết minh qua văn phòng nghiên cứu khoa học.",
        openingDate: new Date("2026-09-01"),
        deadline: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
        location: "Toàn quốc",
        isDomestic: true,
        sourceName: "Hội đồng Khoa học Sinh viên",
        sourceUrl: "https://example.com/nckh-fund",
        verificationDate: new Date(),
        status: OPPORTUNITY_STATUS.PUBLISHED,
        isSponsored: false,
        version: 1,
        updatedByAdminId: admin._id.toString(),
      },
      {
        title: "Chương trình Đại sứ Sinh viên Google Developer Student Club 2026",
        description: "Đại diện trường học xây dựng cộng đồng học tập công nghệ, kết nối sinh viên với các chuyên gia toàn cầu.",
        category: OPPORTUNITY_CATEGORIES.AMBASSADOR_PROGRAMS.id,
        eligibility: "Sinh viên năm 1, 2, 3 đam mê công nghệ và có tinh thần phụng sự cộng đồng.",
        requirements: "Kỹ năng truyền cảm hứng, tổ chức sự kiện, có kiến thức cơ bản về lập trình hoặc thiết kế.",
        benefits: "Chứng nhận chính thức từ Google, tham gia hội nghị toàn cầu, bộ kit đại sứ độc quyền.",
        applicationInstructions: "Quay video 90 giây tự giới thiệu bản thân và lý do muốn trở thành Đại sứ.",
        openingDate: new Date("2026-10-01"),
        deadline: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000),
        location: "Toàn quốc",
        isDomestic: true,
        sourceName: "Google for Developers",
        sourceUrl: "https://example.com/gdsc-ambassador",
        verificationDate: new Date(),
        status: OPPORTUNITY_STATUS.PUBLISHED,
        isSponsored: false,
        version: 1,
        updatedByAdminId: admin._id.toString(),
      },
    ];

    const createdOpportunities = await Opportunity.insertMany(sampleOpportunities);

    // 4. Khởi tạo Lộ trình phát triển mẫu cho Sinh viên (FR-RM-01)
    await Roadmap.deleteMany({ studentId: student._id.toString() });

    await Roadmap.create({
      studentId: student._id.toString(),
      status: "ACTIVE",
      goalSnapshot: {
        studyAbroad: true,
        employment: true,
        scientificResearch: true,
      },
      progressPercent: 67,
      years: [
        {
          yearNumber: 3,
          semesters: [
            {
              semesterNumber: 1,
              milestones: [
                {
                  id: "m1",
                  title: "Xây dựng năng lực ngoại ngữ & Điểm số",
                  tasks: [
                    { id: "t1", title: "Đạt GPA tích lũy trên 3.6/4.0", completed: true },
                    { id: "t2", title: "Ôn thi và thi chứng chỉ IELTS đạt 7.5", completed: true },
                  ],
                },
              ],
            },
            {
              semesterNumber: 2,
              milestones: [
                {
                  id: "m2",
                  title: "Kinh nghiệm thực tế & Nghiên cứu",
                  tasks: [
                    { id: "t3", title: "Hoàn thành bài báo NCKH cấp trường", completed: true },
                    { id: "t4", title: "Ứng tuyển thực tập sinh UX/UI tại tập đoàn", completed: true },
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
                  id: "m3",
                  title: "Chuẩn bị hồ sơ du học Thạc sĩ",
                  tasks: [
                    { id: "t5", title: "Đạt GPA 4.5 Năm 4", completed: true },
                    { id: "t6", title: "Nộp cover letter & bài luận cá nhân", completed: false },
                    { id: "t7", title: "Xin 02 thư giới thiệu từ Giảng viên", completed: false },
                  ],
                },
              ],
            },
          ],
        },
      ],
    });

    // 5. Thêm cơ hội vào Lịch theo dõi hạn chót của Sinh viên (FR-CAL-01)
    await CalendarEntry.deleteMany({ studentId: student._id.toString() });
    await SavedOpportunity.deleteMany({ studentId: student._id.toString() });

    if (createdOpportunities.length >= 2) {
      // Cơ hội 1 được Thêm vào lịch
      await CalendarEntry.create({
        studentId: student._id.toString(),
        opportunityId: createdOpportunities[0]._id.toString(),
        deadline: createdOpportunities[0].deadline,
        isActive: true,
        remindersSent: [],
      });

      // Cơ hội 2 chỉ được Lưu (Saved)
      await SavedOpportunity.create({
        studentId: student._id.toString(),
        opportunityId: createdOpportunities[1]._id.toString(),
      });
    }

    // 6. Khởi tạo danh sách Mentor mẫu (FR-MEN-01)
    await MentorProfile.deleteMany({});
    await MentorProfile.insertMany([
      {
        name: "TS. Trần Minh Đức",
        position: "Nghiên cứu viên cao cấp",
        organization: "Đại học Oxford / VinAI Research",
        expertise: ["Trí tuệ nhân tạo", "Học bổng du học Anh - Mỹ", "Nghiên cứu khoa học"],
        experience: "10+ năm kinh nghiệm hướng dẫn học bổng sau đại học và công bố bài báo quốc tế.",
        bio: "Đam mê hỗ trợ các bạn trẻ tiếp cận các trường đại học hàng đầu thế giới.",
        topics: ["Định hướng du học bậc Thạc sĩ/Tiến sĩ", "Cách viết đề cương nghiên cứu khoa học"],
        isActive: true,
      },
      {
        name: "Chị Lê Hoàng Mai",
        position: "Product Lead",
        organization: "Shopee Singapore",
        expertise: ["Quản lý sản phẩm", "UX/UI Design", "Management Trainee"],
        experience: "Cựu Quản trị viên tập sự, 7 năm kinh nghiệm xây dựng sản phẩm công nghệ.",
        bio: "Chia sẻ kinh nghiệm thực tế về ứng tuyển và phát triển sự nghiệp trong ngành công nghệ.",
        topics: ["Kỹ năng làm CV và Portfolio chuẩn quốc tế", "Phỏng vấn và vượt qua kỳ thi MT"],
        isActive: true,
      },
    ]);

    return NextResponse.json({
      message: "Khởi tạo dữ liệu mẫu (Seed Data) thành công!",
      accounts: {
        admin: { email: "admin@unera.edu.vn", password: "Admin@123456" },
        student: { email: "student@unera.edu.vn", password: "Student@123456" },
      },
      summary: {
        opportunities: createdOpportunities.length,
        mentors: 2,
        activeRoadmaps: 1,
        calendarEntries: 1,
        savedOpportunities: 1,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Đã có lỗi xảy ra";
    return NextResponse.json({ error: "Lỗi trong quá trình khởi tạo dữ liệu", details: message }, { status: 500 });
  }
}

export async function GET() {
  return POST();
}
