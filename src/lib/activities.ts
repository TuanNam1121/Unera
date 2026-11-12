import { revalidatePath } from "next/cache";
import { Types } from "mongoose";
import { ACTIVITY_PUBLISH_STATUS } from "@/constants";
import { connectToDatabase } from "@/lib/db";
import { computeActivityStatus } from "@/lib/activity-utils";
import { slugifyVietnamese } from "@/lib/orientation-utils";
import {
  createTiptapDoc,
  EMPTY_TIPTAP_DOC,
  extractPlainTextFromTiptap,
  tiptapCallout,
  tiptapHeading,
  tiptapList,
  tiptapParagraph,
  tiptapText,
} from "@/lib/content/tiptap-utils";
import { ActivityCategory } from "@/models/ActivityCategory";
import { StudentActivity } from "@/models/StudentActivity";
import type {
  IActivityCategoryDTO,
  IStudentActivityDetail,
  IStudentActivitySummary,
  TiptapJSONDoc,
} from "@/types";

interface PopulatedActivityCategory {
  _id: Types.ObjectId | string;
  name: string;
  slug: string;
  colorToken?: string;
  icon?: string;
}

export interface RawActivityDoc {
  _id: Types.ObjectId | string;
  title: string;
  slug: string;
  summary: string;
  contentJson?: TiptapJSONDoc;
  contentText?: string;
  coverImage?: string;
  categoryId: PopulatedActivityCategory | Types.ObjectId | string | null;
  organizer?: string;
  location?: string;
  isDomestic?: boolean;
  eligibility?: string;
  requirements?: string;
  benefits?: string;
  applicationInstructions?: string;
  openingDate?: Date | string | null;
  deadline?: Date | string | null;
  eventDate?: Date | string | null;
  eventEndDate?: Date | string | null;
  registrationUrl?: string;
  tags?: string[];
  publishStatus: "DRAFT" | "PUBLISHED" | "UNPUBLISHED";
  manualClosed?: boolean;
  isFeatured?: boolean;
  followerCount?: number;
  viewCount?: number;
  version?: number;
  publishedAt?: Date | string | null;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

function isPopulatedCategory(ref: unknown): ref is PopulatedActivityCategory {
  return (
    typeof ref === "object" &&
    ref !== null &&
    "_id" in ref &&
    "name" in ref &&
    "slug" in ref
  );
}

export function serializeActivityCategory(
  doc: {
    _id: Types.ObjectId | string;
    name: string;
    slug: string;
    description?: string;
    icon?: string;
    colorToken?: string;
    order?: number;
    isActive?: boolean;
  },
  activityCount?: number
): IActivityCategoryDTO {
  return {
    _id: doc._id.toString(),
    name: doc.name,
    slug: doc.slug,
    description: doc.description || "",
    icon: doc.icon || "Sparkles",
    colorToken: doc.colorToken || "blue",
    order: typeof doc.order === "number" ? doc.order : 0,
    isActive: doc.isActive !== false,
    ...(typeof activityCount === "number" ? { activityCount } : {}),
  };
}

export function serializeStudentActivity(
  doc: RawActivityDoc,
  options?: {
    followedIds?: Set<string>;
    includeContent?: boolean;
    now?: Date;
    followPreferences?: {
      notifyDeadline: boolean;
      notifyEvent: boolean;
    } | null;
  }
): IStudentActivitySummary & Partial<IStudentActivityDetail> {
  const activityId = doc._id.toString();
  const now = options?.now ?? new Date();
  const manualClosed = Boolean(doc.manualClosed);

  const category = isPopulatedCategory(doc.categoryId)
    ? {
        _id: doc.categoryId._id.toString(),
        name: doc.categoryId.name,
        slug: doc.categoryId.slug,
        colorToken: doc.categoryId.colorToken || "blue",
        icon: doc.categoryId.icon || "Sparkles",
      }
    : null;

  const computedStatus = computeActivityStatus(
    {
      manualClosed,
      openingDate: doc.openingDate,
      deadline: doc.deadline,
      eventDate: doc.eventDate,
      eventEndDate: doc.eventEndDate,
    },
    now
  );

  const summary: IStudentActivitySummary = {
    _id: activityId,
    title: doc.title,
    slug: doc.slug,
    summary: doc.summary,
    coverImage: doc.coverImage || "",
    category,
    organizer: doc.organizer || "",
    location: doc.location || "",
    isDomestic: doc.isDomestic !== false,
    openingDate: doc.openingDate ?? null,
    deadline: doc.deadline ?? null,
    eventDate: doc.eventDate ?? null,
    eventEndDate: doc.eventEndDate ?? null,
    registrationUrl: doc.registrationUrl || "",
    tags: Array.isArray(doc.tags) ? doc.tags : [],
    publishStatus: doc.publishStatus,
    manualClosed,
    computedStatus,
    followerCount: typeof doc.followerCount === "number" ? doc.followerCount : 0,
    viewCount: typeof doc.viewCount === "number" ? doc.viewCount : 0,
    isFeatured: Boolean(doc.isFeatured),
    version: typeof doc.version === "number" ? doc.version : 1,
    publishedAt: doc.publishedAt ?? null,
    createdAt: doc.createdAt,
    ...(options?.followedIds
      ? { isFollowedByMe: options.followedIds.has(activityId) }
      : {}),
  };

  if (!options?.includeContent) {
    return summary;
  }

  return {
    ...summary,
    contentJson:
      doc.contentJson && doc.contentJson.type === "doc"
        ? doc.contentJson
        : EMPTY_TIPTAP_DOC,
    contentText: doc.contentText || "",
    eligibility: doc.eligibility || "",
    requirements: doc.requirements || "",
    benefits: doc.benefits || "",
    applicationInstructions: doc.applicationInstructions || "",
    updatedAt: doc.updatedAt,
    followPreferences: options?.followPreferences ?? null,
  };
}

const ACTIVITY_TAXONOMY_CACHE_TTL_MS = 60_000;

interface CachedActivityTaxonomy {
  categories: IActivityCategoryDTO[];
  byId: Map<string, IActivityCategoryDTO>;
  bySlug: Map<string, IActivityCategoryDTO>;
  expiresAt: number;
}

let cachedActivityTaxonomy: CachedActivityTaxonomy | null = null;
let activityIndexesSyncStarted = false;

export function invalidateActivityCategoryCache() {
  cachedActivityTaxonomy = null;
}

export function ensureActivityIndexesInBackground() {
  if (activityIndexesSyncStarted) return;
  activityIndexesSyncStarted = true;
  void StudentActivity.syncIndexes().catch(() => {
    activityIndexesSyncStarted = false;
  });
}

export async function getCachedActivityCategoryLookup(): Promise<CachedActivityTaxonomy> {
  const now = Date.now();
  if (cachedActivityTaxonomy && cachedActivityTaxonomy.expiresAt > now) {
    return cachedActivityTaxonomy;
  }

  await connectToDatabase();
  const docs = await ActivityCategory.find({ isActive: true })
    .sort({ order: 1, name: 1 })
    .lean();

  const categories = docs.map((cat) => serializeActivityCategory(cat));
  const byId = new Map<string, IActivityCategoryDTO>();
  const bySlug = new Map<string, IActivityCategoryDTO>();
  for (const cat of categories) {
    byId.set(cat._id, cat);
    bySlug.set(cat.slug.toLowerCase(), cat);
  }

  cachedActivityTaxonomy = {
    categories,
    byId,
    bySlug,
    expiresAt: now + ACTIVITY_TAXONOMY_CACHE_TTL_MS,
  };
  return cachedActivityTaxonomy;
}

export async function getActiveActivityCategories(): Promise<
  IActivityCategoryDTO[]
> {
  const lookup = await getCachedActivityCategoryLookup();
  return lookup.categories;
}

export async function ensureUniqueActivitySlug(
  baseInput: string,
  excludeId?: string
): Promise<string> {
  const cleanBase = slugifyVietnamese(baseInput) || `hoat-dong-${Date.now()}`;
  let candidate = cleanBase;
  let suffix = 1;

  while (true) {
    const query: Record<string, unknown> = { slug: candidate };
    if (excludeId && Types.ObjectId.isValid(excludeId)) {
      query._id = { $ne: new Types.ObjectId(excludeId) };
    }
    const existing = await StudentActivity.exists(query);
    if (!existing) return candidate;
    suffix += 1;
    candidate = `${cleanBase}-${suffix}`;
  }
}

export async function ensureUniqueActivityCategorySlug(
  baseInput: string,
  excludeId?: string
): Promise<string> {
  const cleanBase = slugifyVietnamese(baseInput) || `danh-muc-${Date.now()}`;
  let candidate = cleanBase;
  let suffix = 1;

  while (true) {
    const query: Record<string, unknown> = { slug: candidate };
    if (excludeId && Types.ObjectId.isValid(excludeId)) {
      query._id = { $ne: new Types.ObjectId(excludeId) };
    }
    const existing = await ActivityCategory.exists(query);
    if (!existing) return candidate;
    suffix += 1;
    candidate = `${cleanBase}-${suffix}`;
  }
}

export function revalidateActivityRoutes(slug?: string) {
  invalidateActivityCategoryCache();
  revalidatePath("/activities");
  revalidatePath("/admin/activities");
  revalidatePath("/admin/activities/categories");
  revalidatePath("/admin/activities/statistics");
  revalidatePath("/");
  if (slug) {
    revalidatePath(`/activities/${slug}`);
  }
}

export async function seedDefaultStudentActivities(adminId?: Types.ObjectId) {
  await connectToDatabase();

  const existingCategories = await ActivityCategory.countDocuments();
  const existingActivities = await StudentActivity.countDocuments();

  if (existingCategories > 0 && existingActivities > 0) {
    return {
      seeded: false,
      categoriesCount: existingCategories,
      activitiesCount: existingActivities,
    };
  }

  const categorySeeds = [
    {
      name: "Nghiên cứu khoa học (NCKH)",
      slug: "nckh",
      description: "Đề tài NCKH sinh viên các cấp, hội nghị học thuật và công bố quốc tế.",
      icon: "Microscope",
      colorToken: "blue",
      order: 1,
      isActive: true,
    },
    {
      name: "Management Trainee",
      slug: "management-trainee",
      description: "Chương trình Quản trị viên tập sự tại các tập đoàn đa quốc gia và doanh nghiệp lớn.",
      icon: "Briefcase",
      colorToken: "purple",
      order: 2,
      isActive: true,
    },
    {
      name: "Cuộc thi sinh viên",
      slug: "cuoc-thi",
      description: "Cuộc thi giải case kinh doanh, học thuật, công nghệ và khởi nghiệp đổi mới sáng tạo.",
      icon: "Trophy",
      colorToken: "emerald",
      order: 3,
      isActive: true,
    },
    {
      name: "Chương trình đại sứ",
      slug: "dai-su-sinh-vien",
      description: "Cơ hội trở thành Đại sứ sinh viên, đại diện thương hiệu và tổ chức thanh niên.",
      icon: "Sparkles",
      colorToken: "amber",
      order: 4,
      isActive: true,
    },
    {
      name: "Học bổng sinh viên",
      slug: "hoc-bong",
      description: "Học bổng khuyến khích học tập, học bổng doanh nghiệp và trao đổi quốc tế.",
      icon: "GraduationCap",
      colorToken: "rose",
      order: 5,
      isActive: true,
    },
    {
      name: "Sự kiện & Workshop",
      slug: "su-kien",
      description: "Tọa đàm hướng nghiệp, workshop kỹ năng và ngày hội kết nối doanh nghiệp.",
      icon: "CalendarDays",
      colorToken: "cyan",
      order: 6,
      isActive: true,
    },
  ];

  const categoryMap = new Map<string, Types.ObjectId>();
  for (const cat of categorySeeds) {
    const doc = await ActivityCategory.findOneAndUpdate(
      { slug: cat.slug },
      { $setOnInsert: cat },
      { upsert: true, returnDocument: "after" }
    );
    categoryMap.set(cat.slug, doc._id);
  }

  if (existingActivities > 0) {
    return {
      seeded: false,
      categoriesCount: categoryMap.size,
      activitiesCount: existingActivities,
    };
  }

  const dayMs = 24 * 60 * 60 * 1000;
  const now = Date.now();
  const inDays = (days: number) => new Date(now + days * dayMs);

  const sampleActivities = [
    {
      title: "Giải thưởng Nghiên cứu Khoa học Sinh viên ULIS 2026",
      slug: "giai-thuong-nckh-sinh-vien-ulis-2026",
      summary:
        "Sân chơi học thuật thường niên dành cho sinh viên thực hiện đề tài ngôn ngữ học, sư phạm, công nghệ giáo dục và kinh tế số.",
      categorySlug: "nckh",
      organizer: "Phòng Khoa học Công nghệ & Hợp tác Phát triển ULIS",
      location: "Hà Nội · ĐHQGHN",
      isDomestic: true,
      eligibility: "Sinh viên đại học chính quy năm 1 đến năm 4 (cá nhân hoặc nhóm tối đa 3 sinh viên).",
      requirements: "Đề cương nghiên cứu chi tiết bằng tiếng Việt hoặc tiếng Anh, có giảng viên hướng dẫn xác nhận.",
      benefits: "Kinh phí hỗ trợ đề tài, điểm rèn luyện nghiên cứu và đề cử tham dự giải cấp Bộ.",
      applicationInstructions: "Nộp bản đề cương PDF qua cổng đăng ký trực tuyến trước hạn chót.",
      openingDate: inDays(-10),
      deadline: inDays(4),
      eventDate: inDays(25),
      eventEndDate: inDays(26),
      registrationUrl: "https://ulis.vnu.edu.vn",
      tags: ["NCKH", "Học thuật", "Sinh viên ULIS"],
      isFeatured: true,
      contentJson: createTiptapDoc([
        tiptapHeading(2, "1. Mục tiêu của chương trình NCKH"),
        tiptapParagraph([
          tiptapText(
            "Khuyến khích sinh viên hình thành tư duy phản biện, phương pháp nghiên cứu chuẩn mực và giải quyết các bài toán thực tiễn trong giảng dạy ngoại ngữ, chuyển đổi số và truyền thông đa văn hóa."
          ),
        ]),
        tiptapHeading(2, "2. Các mốc thời gian quan trọng"),
        tiptapList(false, [
          [tiptapText("Nộp đề cương tóm tắt và đăng ký giảng viên hướng dẫn trước hạn chót.")],
          [tiptapText("Bảo vệ đề cương cấp Khoa và nhận kinh phí triển khai.")],
          [tiptapText("Báo cáo nghiệm thu và vinh danh đề tài xuất sắc toàn trường.")],
        ]),
        tiptapCallout(
          "tip",
          "Bí quyết chuẩn bị đề cương NCKH đạt điểm cao",
          "Hãy bắt đầu từ một câu hỏi nghiên cứu hẹp, có dữ liệu khảo sát khả thi trong 3 tháng và nêu rõ đóng góp mới của nhóm."
        ),
      ]),
    },
    {
      title: "Unilever Future Leaders Programme (UFLP) 2026",
      slug: "unilever-future-leaders-programme-2026",
      summary:
        "Chương trình Quản trị viên tập sự kéo dài 3 năm giúp sinh viên năm cuối và cử nhân mới tốt nghiệp phát triển thành nhà lãnh đạo tương lai.",
      categorySlug: "management-trainee",
      organizer: "Unilever Việt Nam",
      location: "TP. Hồ Chí Minh & Toàn quốc",
      isDomestic: true,
      eligibility: "Sinh viên năm cuối hoặc cử nhân mới tốt nghiệp dưới 2 năm kinh nghiệm, GPA >= 2.8/4.0.",
      requirements: "Khả năng giao tiếp tiếng Anh lưu loát, tư duy lãnh đạo và sẵn sàng luân chuyển phòng ban.",
      benefits: "Lộ trình đào tạo chuẩn quốc tế, mức lương cạnh tranh và cơ hội làm việc tại khu vực.",
      applicationInstructions: "Đăng ký hồ sơ qua cổng tuyển dụng chính thức và hoàn thành bài đánh giá trực tuyến.",
      openingDate: inDays(-5),
      deadline: inDays(18),
      eventDate: inDays(30),
      registrationUrl: "https://careers.unilever.com",
      tags: ["Management Trainee", "FMCG", "Leadership"],
      isFeatured: true,
      contentJson: createTiptapDoc([
        tiptapHeading(2, "Tổng quan lộ trình Management Trainee"),
        tiptapParagraph([
          tiptapText(
            "Chương trình tuyển chọn nhân tài cho các khối Marketing, Chuỗi cung ứng, Phát triển khách hàng và Nhân sự với sự dẫn dắt trực tiếp từ cấp quản lý."
          ),
        ]),
        tiptapHeading(2, "Quy trình 4 vòng tuyển chọn"),
        tiptapList(true, [
          [tiptapText("Vòng 1: Nộp hồ sơ trực tuyến và đánh giá chỉ số tương thích.")],
          [tiptapText("Vòng 2: Phỏng vấn tình huống kỹ thuật số (Digital Interview).")],
          [tiptapText("Vòng 3: Trung tâm đánh giá (Discovery Center) giải bài toán kinh doanh.")],
          [tiptapText("Vòng 4: Phỏng vấn cùng Ban Giám đốc.")],
        ]),
      ]),
    },
    {
      title: "Cuộc thi Giải Case Kinh doanh Quốc gia – Business Challenge 2026",
      slug: "cuoc-thi-business-challenge-2026",
      summary:
        "Sân chơi giải quyết tình huống thực chiến về chiến lược tăng trưởng, chuyển đổi số và ESG dành cho đội thi sinh viên toàn quốc.",
      categorySlug: "cuoc-thi",
      organizer: "Câu lạc bộ Khởi nghiệp & Kinh doanh Sinh viên",
      location: "Hà Nội · Trực tuyến vòng loại",
      isDomestic: true,
      eligibility: "Đội thi gồm 3–4 sinh viên đại học trên toàn quốc.",
      requirements: "Nộp slide phân tích tình huống tối đa 15 trang bằng tiếng Anh.",
      benefits: "Tổng giá trị giải thưởng 120 triệu đồng cùng suất thực tập đặc cách tại doanh nghiệp đối tác.",
      applicationInstructions: "Thành lập đội thi và nộp đăng ký trước khi mở đề vòng sơ loại.",
      openingDate: inDays(6),
      deadline: inDays(28),
      eventDate: inDays(40),
      registrationUrl: "https://example.com/business-challenge",
      tags: ["Case Competition", "Chiến lược", "Khởi nghiệp"],
      isFeatured: false,
      contentJson: createTiptapDoc([
        tiptapHeading(2, "Thử thách thực tế từ doanh nghiệp đồng hành"),
        tiptapParagraph([
          tiptapText(
            "Các đội thi sẽ đóng vai trò chuyên viên tư vấn chiến lược để đề xuất giải pháp mở rộng thị trường và tối ưu vận hành trong bối cảnh AI."
          ),
        ]),
        tiptapCallout(
          "info",
          "Đội thi cần chuẩn bị trước ngày mở đề",
          "Ôn lại khung phân tích tài chính cơ bản, chiến lược go-to-market và kỹ năng trình bày dữ liệu trực quan."
        ),
      ]),
    },
    {
      title: "Chương trình Đại sứ Sinh viên Unera Campus Ambassadors 2026",
      slug: "dai-su-sinh-vien-unera-campus-ambassadors-2026",
      summary:
        "Trở thành cầu nối lan tỏa văn hóa định hướng học tập, kết nối cộng đồng sinh viên năng động và tổ chức chuỗi workshop tại trường.",
      categorySlug: "dai-su-sinh-vien",
      organizer: "Unera Community Vietnam",
      location: "Hà Nội · TP.HCM · Đà Nẵng",
      isDomestic: true,
      eligibility: "Sinh viên năm 1 đến năm 3 đang hoạt động CLB/Đoàn-Hội hoặc yêu thích truyền thông giáo dục.",
      requirements: "Năng động, chủ động truyền thông và cam kết đồng hành tối thiểu 1 học kỳ.",
      benefits: "Chứng nhận Đại sứ, đào tạo kỹ năng lãnh đạo cộng đồng và quyền ưu tiên kết nối Mentor 1-1.",
      applicationInstructions: "Điền đơn ứng tuyển và đính kèm kế hoạch ý tưởng hoạt động tại khoa/trường.",
      openingDate: inDays(-7),
      deadline: inDays(6),
      eventDate: inDays(12),
      registrationUrl: "https://example.com/ambassador",
      tags: ["Đại sứ sinh viên", "Cộng đồng", "Kỹ năng mềm"],
      isFeatured: false,
      contentJson: createTiptapDoc([
        tiptapHeading(2, "Vai trò của Đại sứ sinh viên"),
        tiptapList(false, [
          [tiptapText("Đại diện lan tỏa các hoạt động hướng nghiệp và học bổng tới sinh viên cùng khóa.")],
          [tiptapText("Phối hợp tổ chức tọa đàm chia sẻ kinh nghiệm ôn thi, NCKH và phỏng vấn thực tập.")],
          [tiptapText("Đóng góp góc nhìn sinh viên để hoàn thiện nội dung nền tảng.")],
        ]),
      ]),
    },
    {
      title: "Học bổng Phát triển Tài năng Số & Ngoại ngữ 2026",
      slug: "hoc-bong-tai-nang-so-ngoai-ngu-2026",
      summary:
        "Học bổng hỗ trợ 100% học phí khóa đào tạo năng lực số ứng dụng AI và trợ cấp nghiên cứu cho sinh viên khối ngành ngoại ngữ - kinh tế.",
      categorySlug: "hoc-bong",
      organizer: "Quỹ Hỗ trợ Sinh viên Đổi mới Sáng tạo",
      location: "Toàn quốc & Quốc tế",
      isDomestic: false,
      eligibility: "Sinh viên đạt điểm GPA >= 3.2/4.0 và có minh chứng hoạt động ngoại khóa hoặc nghiên cứu.",
      requirements: "Bảng điểm gần nhất, 01 bài luận động lực 600 từ và thư giới thiệu của giảng viên.",
      benefits: "Gói học bổng trị giá 25.000.000 VNĐ/suất cùng cơ hội giao lưu học thuật khu vực ASEAN.",
      applicationInstructions: "Chuẩn bị hồ sơ bản mềm PDF và đăng ký trực tiếp tại cổng học bổng.",
      openingDate: inDays(-14),
      deadline: inDays(21),
      eventDate: inDays(45),
      registrationUrl: "https://example.com/scholarship-2026",
      tags: ["Học bổng", "Ngoại ngữ", "Kỹ năng số"],
      isFeatured: true,
      contentJson: createTiptapDoc([
        tiptapHeading(2, "Giá trị học bổng & Hỗ trợ đi kèm"),
        tiptapParagraph([
          tiptapText(
            "Chương trình hướng đến xây dựng thế hệ sinh viên thành thạo ngoại ngữ kết hợp năng lực phân tích dữ liệu và công cụ số trong môi trường làm việc toàn cầu."
          ),
        ]),
        tiptapCallout(
          "warning",
          "Lưu ý về bài luận học bổng",
          "Ban xét tuyển đánh giá cao câu chuyện thực tế thể hiện tinh thần chủ động học hỏi và tác động tích cực bạn mong muốn tạo ra."
        ),
      ]),
    },
    {
      title: "Workshop: Chuẩn bị Hồ sơ Thực tập & Phỏng vấn MNC 2026",
      slug: "workshop-ho-so-thuc-tap-phong-van-mnc-2026",
      summary:
        "Buổi hướng dẫn thực hành sửa CV trực tiếp và mô phỏng phỏng vấn hành vi STAR cùng các anh chị HR Partner & Alumni.",
      categorySlug: "su-kien",
      organizer: "Trung tâm Hỗ trợ Sinh viên & Quan hệ Doanh nghiệp",
      location: "Hội trường Nguyễn Văn Đạo · Hybrid",
      isDomestic: true,
      eligibility: "Mở tự do cho toàn thể sinh viên quan tâm tới thực tập và Management Trainee.",
      requirements: "Mang theo CV cá nhân (bản PDF hoặc giấy) để được góp ý 1-1 tại bàn cố vấn.",
      benefits: "Miễn phí tham dự, tặng bộ mẫu CV chuẩn ATS song ngữ và checklist luyện phỏng vấn.",
      applicationInstructions: "Đăng ký giữ chỗ trực tuyến trước ngày diễn ra sự kiện 24 giờ.",
      openingDate: inDays(-12),
      deadline: inDays(10),
      eventDate: inDays(4),
      eventEndDate: inDays(4),
      registrationUrl: "https://example.com/workshop-cv-star",
      tags: ["Workshop", "CV", "Phỏng vấn STAR"],
      isFeatured: false,
      contentJson: createTiptapDoc([
        tiptapHeading(2, "Nội dung chính của buổi Workshop"),
        tiptapList(true, [
          [tiptapText("Phân tích 5 lỗi phổ biến khiến CV sinh viên bị loại từ vòng lọc ATS.")],
          [tiptapText("Phương pháp trả lời phỏng vấn STAR qua tình huống thực tế.")],
          [tiptapText("Phiên Mock Interview & Review CV trực tiếp cùng khách mời doanh nghiệp.")],
        ]),
      ]),
    },
  ];

  const docsToInsert = sampleActivities.map((item) => {
    const categoryId = categoryMap.get(item.categorySlug);
    return {
      title: item.title,
      slug: item.slug,
      summary: item.summary,
      contentJson: item.contentJson,
      contentText: extractPlainTextFromTiptap(item.contentJson),
      coverImage: "",
      categoryId,
      organizer: item.organizer,
      location: item.location,
      isDomestic: item.isDomestic,
      eligibility: item.eligibility,
      requirements: item.requirements,
      benefits: item.benefits,
      applicationInstructions: item.applicationInstructions,
      openingDate: item.openingDate,
      deadline: item.deadline,
      eventDate: item.eventDate,
      eventEndDate: item.eventEndDate ?? null,
      registrationUrl: item.registrationUrl,
      tags: item.tags,
      publishStatus: ACTIVITY_PUBLISH_STATUS.PUBLISHED,
      manualClosed: false,
      isFeatured: item.isFeatured,
      followerCount: 0,
      viewCount: 0,
      publishedAt: new Date(),
      version: 1,
      ...(adminId ? { createdBy: adminId, updatedByAdminId: adminId } : {}),
    };
  });

  const created = await StudentActivity.insertMany(docsToInsert);

  return {
    seeded: true,
    categoriesCount: categoryMap.size,
    activitiesCount: created.length,
    activities: created,
  };
}
