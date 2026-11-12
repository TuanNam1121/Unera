import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectToDatabase } from "@/lib/db";
import { User } from "@/models/User";
import { StudentProfile } from "@/models/StudentProfile";
import { MentorProfile } from "@/models/MentorProfile";
import { OrientationCategory } from "@/models/OrientationCategory";
import { OrientationTopic } from "@/models/OrientationTopic";
import { OrientationArticle } from "@/models/OrientationArticle";
import { ArticleLike } from "@/models/ArticleLike";
import { ArticleComment } from "@/models/ArticleComment";
import { ActivityCategory } from "@/models/ActivityCategory";
import { StudentActivity } from "@/models/StudentActivity";
import { ActivityFollow } from "@/models/ActivityFollow";
import { NewsCategory } from "@/models/NewsCategory";
import { NewsTag } from "@/models/NewsTag";
import { NewsArticle } from "@/models/NewsArticle";
import { NewsBookmark } from "@/models/NewsBookmark";
import { NewsReadingHistory } from "@/models/NewsReadingHistory";
import { Notification } from "@/models/Notification";
import { ReminderSetting } from "@/models/ReminderSetting";
import { ToolResult } from "@/models/ToolResult";
import { MediaAsset } from "@/models/MediaAsset";
import { seedDefaultOrientationExplore } from "@/lib/orientation";
import { seedDefaultStudentActivities } from "@/lib/activities";
import { seedDefaultNews } from "@/lib/news";
import { seedDefaultNotifications } from "@/lib/notifications";
import { seedDefaultToolResults } from "@/lib/tools/results";
import { seedDefaultModule08Data } from "@/lib/assessment-seed";
import {
  USER_ROLES,
  ACCOUNT_STATUS,
  AUTH_PROVIDERS,
  ONBOARDING_STEPS,
  CONTENT_TARGET_COLLECTIONS,
  MEDIA_ASSET_STATUS,
} from "@/constants";

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
        authProviders: [AUTH_PROVIDERS.CREDENTIALS],
        isProfileCompleted: true,
        onboardingStep: ONBOARDING_STEPS.COMPLETED,
      },
      { upsert: true, returnDocument: "after" }
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
        authProviders: [AUTH_PROVIDERS.CREDENTIALS],
        isProfileCompleted: true,
        onboardingStep: ONBOARDING_STEPS.COMPLETED,
      },
      { upsert: true, returnDocument: "after" }
    );

    // Hồ sơ sinh viên
    await StudentProfile.findOneAndUpdate(
      { userId: student._id.toString() },
      {
        userId: student._id.toString(),
        fullName: student.name,
        birthYear: 2005,
        university: "Trường Đại học Ngoại ngữ - ĐHQGHN",
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
        hardSkills: ["IELTS 7.5", "Figma / UI-UX", "Nghiên cứu định lượng"],
        softSkills: ["Quản lý dự án", "Thuyết trình"],
        skills: ["IELTS 7.5", "Figma / UI-UX", "Nghiên cứu định lượng", "Quản lý dự án", "Thuyết trình"],
        achievements: ["Học bổng Khuyến khích học tập 2025", "Giải Nhì NCKH cấp Trường 2025"],
      },
      { upsert: true }
    );

    // 3. Làm mới dữ liệu Hoạt động sinh viên (Module 04) và gỡ liên kết media cũ
    await MediaAsset.updateMany(
      {
        "usedBy.targetCollection": CONTENT_TARGET_COLLECTIONS.STUDENT_ACTIVITIES,
      },
      {
        $pull: {
          usedBy: {
            targetCollection: CONTENT_TARGET_COLLECTIONS.STUDENT_ACTIVITIES,
          },
        },
      }
    );
    await Promise.all([
      ActivityFollow.deleteMany({}),
      StudentActivity.deleteMany({}),
      ActivityCategory.deleteMany({}),
    ]);
    const activitiesSeed = await seedDefaultStudentActivities(admin._id);

    // Tạo 2 lượt quan tâm mẫu cho tài khoản sinh viên mặc định
    let seededFollows = 0;
    const seededActivitiesList = activitiesSeed.activities || [];
    if (seededActivitiesList.length >= 2) {
      await ActivityFollow.insertMany([
        {
          studentId: student._id,
          activityId: seededActivitiesList[0]._id,
          notifyDeadline: true,
          notifyEvent: true,
        },
        {
          studentId: student._id,
          activityId: seededActivitiesList[1]._id,
          notifyDeadline: true,
          notifyEvent: true,
        },
      ]);
      await StudentActivity.updateMany(
        {
          _id: {
            $in: [seededActivitiesList[0]._id, seededActivitiesList[1]._id],
          },
        },
        { $set: { followerCount: 1 } }
      );
      seededFollows = 2;
    }

    // 4. Khởi tạo Module 08: Bộ câu hỏi động, System Prompts AI & Lộ trình 4 năm
    const module08Seed = await seedDefaultModule08Data(admin._id, student._id);

    // 5. Khởi tạo danh sách Mentor mẫu (FR-MEN-01)
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

    // 7. Khởi tạo Danh mục, Chủ đề & Bài viết Khám phá định hướng mẫu (Module 03)
    //    và Tin tức & Sự kiện mẫu (Module 05)
    await MediaAsset.updateMany(
      { "usedBy.targetCollection": CONTENT_TARGET_COLLECTIONS.ORIENTATION_ARTICLES },
      {
        $pull: {
          usedBy: { targetCollection: CONTENT_TARGET_COLLECTIONS.ORIENTATION_ARTICLES },
        },
      }
    );
    await MediaAsset.updateMany(
      { "usedBy.targetCollection": CONTENT_TARGET_COLLECTIONS.NEWS_ARTICLES },
      {
        $pull: {
          usedBy: { targetCollection: CONTENT_TARGET_COLLECTIONS.NEWS_ARTICLES },
        },
      }
    );
    await MediaAsset.updateMany(
      { usedBy: { $size: 0 }, status: MEDIA_ASSET_STATUS.ATTACHED },
      { $set: { status: MEDIA_ASSET_STATUS.ORPHANED } }
    );
    await Promise.all([
      ArticleLike.deleteMany({}),
      ArticleComment.deleteMany({}),
      OrientationArticle.deleteMany({}),
      OrientationTopic.deleteMany({}),
      OrientationCategory.deleteMany({}),
      NewsBookmark.deleteMany({}),
      NewsReadingHistory.deleteMany({}),
      NewsArticle.deleteMany({}),
      NewsTag.deleteMany({}),
      NewsCategory.deleteMany({}),
      Notification.deleteMany({}),
      ReminderSetting.deleteMany({}),
      ToolResult.deleteMany({}),
    ]);
    const [orientationSeed, newsSeed, notificationSeed, toolSeed] =
      await Promise.all([
        seedDefaultOrientationExplore(admin._id),
        seedDefaultNews(admin._id),
        seedDefaultNotifications(student._id, seededActivitiesList[0] || null),
        seedDefaultToolResults(student._id),
      ]);

    return NextResponse.json({
      message: "Khởi tạo dữ liệu mẫu (Seed Data) thành công!",
      accounts: {
        admin: { email: "admin@unera.edu.vn", password: "Admin@123456" },
        student: { email: "student@unera.edu.vn", password: "Student@123456" },
      },
      summary: {
        activityCategories: activitiesSeed.categoriesCount || 0,
        studentActivities: activitiesSeed.activitiesCount || 0,
        activityFollows: seededFollows,
        mentors: 2,
        questionnaires: module08Seed.questionnairesCount,
        assessmentQuestions: module08Seed.questionsCount,
        systemPrompts: module08Seed.promptsCount,
        activeRoadmaps: module08Seed.roadmapsCount,
        orientationCategories: orientationSeed.categoriesCount || 0,
        orientationTopics: orientationSeed.topicsCount || 0,
        orientationArticles: orientationSeed.articlesCount || 0,
        newsCategories: newsSeed.categoriesCount || 0,
        newsTags: newsSeed.tagsCount || 0,
        newsArticles: newsSeed.articlesCount || 0,
        notifications: notificationSeed.notificationsCount || 0,
        toolResults: toolSeed.toolResultsCount || 0,
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
