import { revalidatePath } from "next/cache";
import { Types } from "mongoose";
import { NEWS_ARTICLE_STATUS, type NewsArticleStatus } from "@/constants";
import { connectToDatabase } from "@/lib/db";
import {
  EMPTY_TIPTAP_DOC,
  createTiptapDoc,
  extractPlainTextFromTiptap,
  tiptapCallout,
  tiptapHeading,
  tiptapList,
  tiptapParagraph,
  tiptapText,
} from "@/lib/content/tiptap-utils";
import { slugifyVietnamese } from "@/lib/orientation-utils";
import { NewsCategory } from "@/models/NewsCategory";
import { NewsTag } from "@/models/NewsTag";
import { NewsArticle } from "@/models/NewsArticle";
import type {
  INewsArticleDetail,
  INewsArticleSummary,
  INewsCategoryDTO,
  INewsTagDTO,
  TiptapJSONDoc,
} from "@/types";

export interface RawNewsCategoryDoc {
  _id: Types.ObjectId | string;
  name: string;
  slug: string;
  description?: string;
  colorToken?: string;
  order: number;
  isActive: boolean;
  showInSidebar?: boolean;
}

export interface RawNewsTagDoc {
  _id: Types.ObjectId | string;
  name: string;
  slug: string;
  usageCount: number;
  isActive: boolean;
}

export interface RawNewsArticleDoc {
  _id: Types.ObjectId | string;
  title: string;
  slug: string;
  summary: string;
  contentJson?: TiptapJSONDoc;
  contentText?: string;
  coverImage?: string;
  categoryId?:
    | {
        _id: Types.ObjectId | string;
        name: string;
        slug: string;
        colorToken?: string;
      }
    | Types.ObjectId
    | string
    | null;
  category: string;
  tags?: string[];
  authorName?: string;
  readTimeMinutes?: number;
  status: NewsArticleStatus;
  scheduledAt?: Date | string | null;
  publishedAt?: Date | string | null;
  isFeatured?: boolean;
  isSponsored?: boolean;
  sponsorInfo?: string;
  sourceName?: string;
  sourceUrl?: string;
  viewCount?: number;
  bookmarkCount?: number;
  shareCount?: number;
  version?: number;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

export function serializeNewsCategory(
  doc: RawNewsCategoryDoc,
  articleCount?: number
): INewsCategoryDTO {
  return {
    _id: doc._id.toString(),
    name: doc.name,
    slug: doc.slug,
    description: doc.description || "",
    colorToken: doc.colorToken || "blue",
    order: doc.order ?? 0,
    isActive: doc.isActive !== false,
    showInSidebar: doc.showInSidebar !== false,
    ...(typeof articleCount === "number" ? { articleCount } : {}),
  };
}

export function serializeNewsTag(doc: RawNewsTagDoc): INewsTagDTO {
  return {
    _id: doc._id.toString(),
    name: doc.name,
    slug: doc.slug,
    usageCount: typeof doc.usageCount === "number" ? doc.usageCount : 0,
    isActive: doc.isActive !== false,
  };
}

export function serializeNewsArticle(
  doc: RawNewsArticleDoc,
  options?: {
    bookmarkedIds?: Set<string>;
    includeContent?: boolean;
  }
): INewsArticleSummary | INewsArticleDetail {
  const articleId = doc._id.toString();

  const category =
    doc.categoryId &&
    typeof doc.categoryId === "object" &&
    "_id" in doc.categoryId &&
    "name" in doc.categoryId
      ? {
          _id: doc.categoryId._id.toString(),
          name: doc.categoryId.name,
          slug: doc.categoryId.slug,
          colorToken: doc.categoryId.colorToken || "blue",
        }
      : null;

  const summary: INewsArticleSummary = {
    _id: articleId,
    title: doc.title,
    slug: doc.slug,
    summary: doc.summary,
    coverImage: doc.coverImage || "",
    category,
    categorySlug: category?.slug || doc.category || "",
    tags: Array.isArray(doc.tags) ? doc.tags : [],
    authorName: doc.authorName || "Ban biên tập Unera",
    readTimeMinutes:
      typeof doc.readTimeMinutes === "number" && doc.readTimeMinutes > 0
        ? doc.readTimeMinutes
        : 3,
    status: doc.status,
    scheduledAt: doc.scheduledAt ?? null,
    publishedAt: doc.publishedAt ?? null,
    isFeatured: Boolean(doc.isFeatured),
    isSponsored: Boolean(doc.isSponsored),
    sponsorInfo: doc.sponsorInfo || "",
    sourceName: doc.sourceName || "",
    sourceUrl: doc.sourceUrl || "",
    viewCount: typeof doc.viewCount === "number" ? doc.viewCount : 0,
    bookmarkCount: typeof doc.bookmarkCount === "number" ? doc.bookmarkCount : 0,
    shareCount: typeof doc.shareCount === "number" ? doc.shareCount : 0,
    version: typeof doc.version === "number" ? doc.version : 1,
    createdAt: doc.createdAt,
    ...(options?.bookmarkedIds
      ? { isBookmarkedByMe: options.bookmarkedIds.has(articleId) }
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
    updatedAt: doc.updatedAt,
  };
}

export async function getActiveNewsCategories(): Promise<INewsCategoryDTO[]> {
  await connectToDatabase();
  const categories = await NewsCategory.find({ isActive: true })
    .sort({ order: 1, name: 1 })
    .lean();

  return categories.map((cat) => serializeNewsCategory(cat));
}

export async function getActiveNewsTags(): Promise<INewsTagDTO[]> {
  await connectToDatabase();
  const tags = await NewsTag.find({ isActive: true })
    .sort({ usageCount: -1, name: 1 })
    .lean();

  return tags.map((tag) => serializeNewsTag(tag));
}

export async function ensureUniqueNewsCategorySlug(
  baseInput: string,
  excludeId?: string
): Promise<string> {
  const cleanBase = slugifyVietnamese(baseInput) || `tin-tuc-${Date.now()}`;
  let candidate = cleanBase;
  let suffix = 1;

  while (true) {
    const query: Record<string, unknown> = { slug: candidate };
    if (excludeId && Types.ObjectId.isValid(excludeId)) {
      query._id = { $ne: new Types.ObjectId(excludeId) };
    }
    const existing = await NewsCategory.exists(query);
    if (!existing) return candidate;
    suffix += 1;
    candidate = `${cleanBase}-${suffix}`;
  }
}

export async function ensureUniqueNewsTagSlug(
  baseInput: string,
  excludeId?: string
): Promise<string> {
  const cleanBase = slugifyVietnamese(baseInput) || `tag-${Date.now()}`;
  let candidate = cleanBase;
  let suffix = 1;

  while (true) {
    const query: Record<string, unknown> = { slug: candidate };
    if (excludeId && Types.ObjectId.isValid(excludeId)) {
      query._id = { $ne: new Types.ObjectId(excludeId) };
    }
    const existing = await NewsTag.exists(query);
    if (!existing) return candidate;
    suffix += 1;
    candidate = `${cleanBase}-${suffix}`;
  }
}

export async function ensureUniqueNewsSlug(
  baseInput: string,
  excludeId?: string
): Promise<string> {
  const cleanBase = slugifyVietnamese(baseInput) || `bai-viet-${Date.now()}`;
  let candidate = cleanBase;
  let suffix = 1;

  while (true) {
    const query: Record<string, unknown> = { slug: candidate };
    if (excludeId && Types.ObjectId.isValid(excludeId)) {
      query._id = { $ne: new Types.ObjectId(excludeId) };
    }
    const existing = await NewsArticle.exists(query);
    if (!existing) return candidate;
    suffix += 1;
    candidate = `${cleanBase}-${suffix}`;
  }
}

export function revalidateNewsRoutes(slug?: string) {
  try {
    revalidatePath("/");
    revalidatePath("/news");
    revalidatePath("/news/saved");
    revalidatePath("/news/history");
    revalidatePath("/admin/news");
    if (slug) {
      revalidatePath(`/news/${slug}`);
    }
  } catch {
    // Non-fatal in background / script execution
  }
}

/**
 * Tự động chuyển trạng thái các bài viết SCHEDULED đã đến hoặc quá giờ hẹn (NEWS21).
 */
export async function promoteDueScheduledNews(): Promise<number> {
  await connectToDatabase();
  const now = new Date();
  const dueArticles = await NewsArticle.find({
    status: NEWS_ARTICLE_STATUS.SCHEDULED,
    scheduledAt: { $lte: now },
  })
    .select("_id slug scheduledAt")
    .lean();

  if (dueArticles.length === 0) return 0;

  await NewsArticle.bulkWrite(
    dueArticles.map((item) => ({
      updateOne: {
        filter: {
          _id: item._id,
          status: NEWS_ARTICLE_STATUS.SCHEDULED,
        },
        update: {
          $set: {
            status: NEWS_ARTICLE_STATUS.PUBLISHED,
            publishedAt: item.scheduledAt || now,
          },
        },
      },
    }))
  );

  for (const item of dueArticles) {
    revalidateNewsRoutes(item.slug);
  }

  return dueArticles.length;
}

/**
 * Đảm bảo danh sách tag từ bài viết tồn tại trong NewsTag và cập nhật usageCount chính xác.
 */
export async function syncNewsTagEntitiesAndUsage(
  rawTags: string[] = []
): Promise<string[]> {
  await connectToDatabase();
  const cleaned = Array.from(
    new Set(rawTags.map((t) => t.trim()).filter(Boolean))
  ).slice(0, 20);

  for (const tagName of cleaned) {
    const slug = slugifyVietnamese(tagName);
    if (!slug) continue;

    const existing = await NewsTag.findOne({
      $or: [{ slug }, { name: tagName }],
    });
    if (!existing) {
      try {
        await NewsTag.create({
          name: tagName,
          slug: await ensureUniqueNewsTagSlug(slug),
          usageCount: 0,
          isActive: true,
        });
      } catch {
        // Ignore duplicate race
      }
    }
  }

  await recalculateNewsTagUsageCounts();
  return cleaned;
}

export async function recalculateNewsTagUsageCounts(): Promise<void> {
  await connectToDatabase();
  const [counts, tags] = await Promise.all([
    NewsArticle.aggregate<{ _id: string; count: number }>([
      { $unwind: "$tags" },
      {
        $group: {
          _id: { $toLower: "$tags" },
          count: { $sum: 1 },
        },
      },
    ]),
    NewsTag.find().select("_id name slug usageCount").lean(),
  ]);

  const countMap = new Map<string, number>(
    counts.map((c) => [c._id, c.count])
  );

  if (tags.length > 0) {
    await NewsTag.bulkWrite(
      tags.map((tag) => ({
        updateOne: {
          filter: { _id: tag._id },
          update: {
            $set: {
              usageCount: countMap.get(tag.name.trim().toLowerCase()) || 0,
            },
          },
        },
      }))
    );
  }
}

export async function seedDefaultNews(adminId?: Types.ObjectId) {
  await connectToDatabase();

  let categoriesCount = await NewsCategory.countDocuments();
  if (categoriesCount === 0) {
    await NewsCategory.insertMany([
      {
        name: "Định hướng",
        slug: "orientation",
        description: "Góc nhìn lộ trình học tập, lựa chọn nghề nghiệp và phát triển bản thân.",
        colorToken: "blue",
        order: 1,
        isActive: true,
      },
      {
        name: "Du học",
        slug: "study-abroad",
        description: "Thông tin tuyển sinh quốc tế, học bổng trao đổi và kinh nghiệm du học.",
        colorToken: "indigo",
        order: 2,
        isActive: true,
      },
      {
        name: "Khối ngành",
        slug: "disciplines",
        description: "Xu hướng thị trường lao động cho sinh viên khối ngành Ngoại ngữ & Xã hội.",
        colorToken: "purple",
        order: 3,
        isActive: true,
      },
      {
        name: "Sau đại học",
        slug: "postgrad",
        description: "Chính sách thạc sĩ, tiến sĩ và cơ hội trợ giảng/trợ lý nghiên cứu.",
        colorToken: "teal",
        order: 4,
        isActive: true,
      },
      {
        name: "Kỹ năng & CV",
        slug: "skills-cv",
        description: "Bí quyết xây dựng CV song ngữ, portfolio và trả lời phỏng vấn hiệu quả.",
        colorToken: "amber",
        order: 5,
        isActive: true,
      },
      {
        name: "Học bổng",
        slug: "scholarships",
        description: "Tổng hợp học bổng Chính phủ, học bổng doanh nghiệp và tài trợ nghiên cứu.",
        colorToken: "emerald",
        order: 6,
        isActive: true,
      },
    ]);
    categoriesCount = await NewsCategory.countDocuments();
  }

  let tagsCount = await NewsTag.countDocuments();
  if (tagsCount === 0) {
    const defaultTags = [
      { name: "IELTS", slug: "ielts" },
      { name: "Học bổng Chính phủ", slug: "hoc-bong-chinh-phu" },
      { name: "Du học Châu Âu", slug: "du-hoc-chau-au" },
      { name: "CV & Phỏng vấn", slug: "cv-va-phong-van" },
      { name: "Định hướng nghề nghiệp", slug: "dinh-huong-nghe-nghiep" },
      { name: "Thạc sĩ", slug: "thac-si" },
      { name: "EdTech & AI", slug: "edtech-va-ai" },
      { name: "Nghiên cứu khoa học", slug: "nghien-cuu-khoa-hoc" },
    ];
    await NewsTag.insertMany(
      defaultTags.map((t) => ({ ...t, usageCount: 0, isActive: true }))
    );
    tagsCount = defaultTags.length;
  }

  const existingArticles = await NewsArticle.countDocuments();
  if (existingArticles > 0) {
    return {
      seeded: false,
      categoriesCount,
      tagsCount,
      articlesCount: existingArticles,
    };
  }

  const allCategories = await NewsCategory.find().lean();
  const catBySlug = new Map(allCategories.map((c) => [c.slug, c]));
  const now = Date.now();
  const day = 24 * 60 * 60 * 1000;

  const sampleArticles: Array<{
    title: string;
    slug: string;
    summary: string;
    categorySlug: string;
    tags: string[];
    authorName: string;
    readTimeMinutes: number;
    publishedOffsetDays: number;
    isFeatured: boolean;
    isSponsored?: boolean;
    sponsorInfo?: string;
    sourceName?: string;
    viewCount: number;
    bookmarkCount: number;
    shareCount: number;
    contentJson: TiptapJSONDoc;
  }> = [
    {
      title: "Mở rộng học bổng Chính phủ & Erasmus+ 2026 dành cho sinh viên khối ngành Ngôn ngữ",
      slug: "mo-rong-hoc-bong-chinh-phu-erasmus-2026-khoi-nganh-ngon-ngu",
      summary:
        "Nhiều chương trình học bổng song phương và liên minh đại học châu Âu bổ sung chỉ tiêu cho sinh viên ngoại ngữ kết hợp chuyển đổi số.",
      categorySlug: "scholarships",
      tags: ["Học bổng Chính phủ", "Du học Châu Âu", "IELTS"],
      authorName: "Ban Biên Tập Học Thuật UNERA",
      readTimeMinutes: 5,
      publishedOffsetDays: 0.2,
      isFeatured: true,
      sourceName: "Cổng Hợp tác Quốc tế ĐHQGHN",
      viewCount: 1240,
      bookmarkCount: 186,
      shareCount: 74,
      contentJson: createTiptapDoc([
        tiptapHeading(2, "Xu hướng xét tuyển học bổng năm 2026"),
        tiptapParagraph([
          tiptapText(
            "Năm học 2026 ghi nhận sự gia tăng đáng kể các suất học bổng liên ngành, nơi ứng viên sở hữu nền tảng ngoại ngữ kết hợp kỹ năng phân tích dữ liệu hoặc giảng dạy số được ưu tiên cao."
          ),
        ]),
        tiptapCallout(
          "tip",
          "Chuẩn bị hồ sơ sớm 6 tháng",
          "Sinh viên năm 3 nên hoàn thiện chứng chỉ IELTS từ 7.0 trở lên và có ít nhất 1 đề tài NCKH hoặc dự án cộng đồng trước tháng 11."
        ),
        tiptapList(false, [
          [tiptapText("Học bổng Hiệp định Chính phủ (Hungary, Nga, Nhật Bản, Hàn Quốc).")],
          [tiptapText("Chương trình trao đổi Erasmus+ ICM thời lượng 1–2 học kỳ.")],
          [tiptapText("Học bổng đồng tài trợ từ các tập đoàn giáo dục đa quốc gia.")],
        ]),
      ]),
    },
    {
      title: "Lộ trình xây dựng CV song ngữ chuẩn ATS giúp sinh viên Ngoại ngữ vượt vòng lọc đầu tiên",
      slug: "lo-trinh-xay-dung-cv-song-ngu-chuan-ats-cho-sinh-vien-ngoai-ngu",
      summary:
        "Hướng dẫn cách lượng hóa thành tích hoạt động CLB, giảng dạy gia sư và biên phiên dịch thành các bullet point thuyết phục nhà tuyển dụng.",
      categorySlug: "skills-cv",
      tags: ["CV & Phỏng vấn", "Định hướng nghề nghiệp"],
      authorName: "Chuyên gia Tuyển dụng Lê Hoàng Mai",
      readTimeMinutes: 6,
      publishedOffsetDays: 2,
      isFeatured: true,
      viewCount: 980,
      bookmarkCount: 215,
      shareCount: 92,
      contentJson: createTiptapDoc([
        tiptapHeading(2, "3 lỗi phổ biến khiến CV bị hệ thống ATS loại sớm"),
        tiptapParagraph([
          tiptapText(
            "Phần lớn CV của sinh viên năm nhất và năm hai thường dùng quá nhiều cột phức tạp hoặc chỉ liệt kê công việc thay vì nêu kết quả đo lường được."
          ),
        ]),
        tiptapList(true, [
          [tiptapText("Dùng cấu trúc 1 cột rõ ràng, giữ độ dài gọn trong 1 trang A4.")],
          [tiptapText("Áp dụng công thức Action Verb + Task + Quantified Impact.")],
          [tiptapText("Đưa từ khóa kỹ năng khớp trực tiếp với mô tả công việc (JD).")],
        ]),
      ]),
    },
    {
      title: "Khi AI tạo sinh trở thành trợ lý: Kỹ sư ngôn ngữ & Chuyên viên EdTech lên ngôi",
      slug: "ai-tao-sinh-va-co-hoi-nghe-nghiep-ky-su-ngon-ngu-edtech",
      summary:
        "Thị trường công nghệ đang săn đón nhân sự giỏi ngữ nghĩa học, kiểm định dữ liệu đa ngữ và thiết kế trải nghiệm học tập ứng dụng AI.",
      categorySlug: "disciplines",
      tags: ["EdTech & AI", "Định hướng nghề nghiệp"],
      authorName: "Phòng Phân tích Xu hướng Nghề nghiệp",
      readTimeMinutes: 5,
      publishedOffsetDays: 4,
      isFeatured: true,
      viewCount: 845,
      bookmarkCount: 134,
      shareCount: 58,
      contentJson: createTiptapDoc([
        tiptapHeading(2, "Lợi thế kép của sinh viên Ngoại ngữ trong kỷ nguyên AI"),
        tiptapParagraph([
          tiptapText(
            "Không chỉ dừng ở dịch thuật truyền thống, sinh viên am hiểu sắc thái văn hóa bản địa và cấu trúc ngôn ngữ có thể đảm nhận vai trò Prompt Linguist, Localization QA hoặc Learning Experience Designer."
          ),
        ]),
        tiptapCallout(
          "info",
          "Kỹ năng bổ trợ nên tích lũy ngay trên ghế nhà trường",
          "Làm quen với quản trị nội dung số, thiết kế khóa học E-learning và sử dụng công cụ đánh giá chất lượng mô hình ngôn ngữ."
        ),
      ]),
    },
    {
      title: "Checklist 12 tháng chinh phục học bổng Thạc sĩ Châu Âu dành cho sinh viên năm 3–4",
      slug: "checklist-12-thang-chinh-phuc-hoc-bong-thac-si-chau-au",
      summary:
        "Từ việc chọn danh sách trường mục tiêu, xin thư giới thiệu giảng viên đến viết Statement of Purpose có câu chuyện học thuật xuyên suốt.",
      categorySlug: "study-abroad",
      tags: ["Du học Châu Âu", "Thạc sĩ", "IELTS"],
      authorName: "TS. Trần Minh Đức",
      readTimeMinutes: 7,
      publishedOffsetDays: 6,
      isFeatured: false,
      viewCount: 720,
      bookmarkCount: 149,
      shareCount: 41,
      contentJson: createTiptapDoc([
        tiptapHeading(2, "Phân chia giai đoạn chuẩn bị theo từng quý"),
        tiptapParagraph([
          tiptapText(
            "Một kế hoạch 12 tháng rõ ràng giúp bạn không bị chồng chéo giữa khóa luận tốt nghiệp, thực tập và hạn chót nộp hồ sơ các trường tại Đức, Hà Lan, Pháp hay Bắc Âu."
          ),
        ]),
        tiptapList(false, [
          [tiptapText("Tháng 3–5: Khảo sát chương trình đào tạo và chuẩn bị IELTS/ngoại ngữ 2.")],
          [tiptapText("Tháng 6–8: Tham gia nghiên cứu khoa học và hoàn thành nháp Motivation Letter.")],
          [tiptapText("Tháng 9–11: Xin 2 thư giới thiệu và kiểm tra công chứng học bạ song ngữ.")],
        ]),
      ]),
    },
    {
      title: "Đề án tuyển sinh Sau đại học mới: Cơ hội liên thông Thạc sĩ cho sinh viên giỏi",
      slug: "de-an-tuyen-sinh-sau-dai-hoc-co-hoi-lien-thong-thac-si",
      summary:
        "Nhiều cơ sở đào tạo trong ĐHQGHN mở rộng chính sách xét tuyển thẳng và cấp học bổng hỗ trợ học phí cho sinh viên tốt nghiệp loại Giỏi/Xuất sắc.",
      categorySlug: "postgrad",
      tags: ["Thạc sĩ", "Nghiên cứu khoa học"],
      authorName: "Ban Truyền thông Đào tạo",
      readTimeMinutes: 4,
      publishedOffsetDays: 11,
      isFeatured: false,
      viewCount: 530,
      bookmarkCount: 78,
      shareCount: 25,
      contentJson: createTiptapDoc([
        tiptapHeading(2, "Điểm mới trong chính sách học tiếp bậc Thạc sĩ"),
        tiptapParagraph([
          tiptapText(
            "Sinh viên tham gia đề tài nghiên cứu khoa học cấp trường trở lên và có bài đăng kỷ yếu hội thảo được cộng điểm ưu tiên hoặc miễn giảm thi đánh giá năng lực đầu vào tùy chuyên ngành."
          ),
        ]),
      ]),
    },
    {
      title: "Định hướng năm nhất – năm hai: Nên chọn đi làm thêm sớm hay tập trung trải nghiệm học thuật?",
      slug: "dinh-huong-nam-nhat-nam-hai-lam-them-hay-trai-nghiem-hoc-thuat",
      summary:
        "Phân tích cân bằng giữa tích lũy tài chính, kỹ năng giao tiếp và xây nền GPA vững chắc cho các mục tiêu dài hạn.",
      categorySlug: "orientation",
      tags: ["Định hướng nghề nghiệp"],
      authorName: "Tổ Cố vấn Học tập UNERA",
      readTimeMinutes: 5,
      publishedOffsetDays: 18,
      isFeatured: false,
      viewCount: 640,
      bookmarkCount: 112,
      shareCount: 39,
      contentJson: createTiptapDoc([
        tiptapHeading(2, "Nguyên tắc 70–30 trong hai năm đại cương"),
        tiptapParagraph([
          tiptapText(
            "Thay vì chạy theo công việc lặp lại ít giá trị tích lũy, sinh viên năm nhất – năm hai nên chọn hoạt động gắn với kỹ năng cốt lõi: CLB chuyên môn, trợ giảng học thuật hoặc các cuộc thi giải case study."
          ),
        ]),
      ]),
    },
    {
      title: "Học bổng IELTS & Thực tập Quốc tế mùa Thu 2026: Mở cổng đăng ký toàn quốc",
      slug: "hoc-bong-ielts-va-thuc-tap-quoc-te-mua-thu-2026",
      summary:
        "Chương trình hỗ trợ 100% lệ phí thi chuẩn hóa ngoại ngữ và kết nối thực tập sinh tại doanh nghiệp đối tác khu vực Đông Nam Á.",
      categorySlug: "scholarships",
      tags: ["IELTS", "Học bổng Chính phủ"],
      authorName: "Đối tác Giáo dục Toàn cầu",
      readTimeMinutes: 4,
      publishedOffsetDays: 25,
      isFeatured: false,
      isSponsored: true,
      sponsorInfo: "Chương trình đối tác giáo dục — tài trợ lệ phí thi & học bổng ngôn ngữ 2026",
      sourceName: "Global Scholarship Network",
      viewCount: 412,
      bookmarkCount: 64,
      shareCount: 19,
      contentJson: createTiptapDoc([
        tiptapHeading(2, "Quyền lợi học bổng & Điều kiện xét duyệt"),
        tiptapParagraph([
          tiptapText(
            "Ứng viên là sinh viên chính quy năm 2 đến năm 4 có điểm trung bình tích lũy từ 3.0/4.0 và cam kết tham gia chuỗi workshop định hướng nghề nghiệp quốc tế."
          ),
        ]),
      ]),
    },
    {
      title: "Tổng hợp kinh nghiệm phỏng vấn Management Trainee cho sinh viên không học khối Kinh tế",
      slug: "kinh-nghiem-phong-van-management-trainee-cho-sinh-vien-ngoai-ngu",
      summary:
        "Cách chuyển hóa lợi thế tư duy phản biện, giao tiếp đa văn hóa và khả năng tự học nhanh khi đối mặt vòng Assessment Center.",
      categorySlug: "skills-cv",
      tags: ["CV & Phỏng vấn", "Định hướng nghề nghiệp"],
      authorName: "Cựu Thực tập sinh Tập đoàn FMCG",
      readTimeMinutes: 6,
      publishedOffsetDays: 45,
      isFeatured: false,
      viewCount: 890,
      bookmarkCount: 165,
      shareCount: 61,
      contentJson: createTiptapDoc([
        tiptapHeading(2, "Tư duy giải quyết vấn đề quan trọng hơn bằng cấp ngành kinh doanh"),
        tiptapParagraph([
          tiptapText(
            "Tại vòng thảo luận nhóm (Group Case), khả năng lắng nghe, tổng hợp ý kiến rõ ràng bằng tiếng Anh và điều phối thời gian giúp ứng viên khối Ngôn ngữ ghi điểm rất mạnh."
          ),
        ]),
      ]),
    },
  ];

  const createdDocs = [];
  for (const item of sampleArticles) {
    const categoryDoc = catBySlug.get(item.categorySlug) || allCategories[0];
    const publishedAt = new Date(now - item.publishedOffsetDays * day);
    const plainText = extractPlainTextFromTiptap(item.contentJson);
    createdDocs.push({
      title: item.title,
      slug: item.slug,
      summary: item.summary,
      contentJson: item.contentJson,
      contentText: plainText,
      coverImage: "",
      categoryId: categoryDoc._id,
      category: categoryDoc.slug,
      tags: item.tags,
      authorName: item.authorName,
      readTimeMinutes: item.readTimeMinutes,
      status: NEWS_ARTICLE_STATUS.PUBLISHED,
      scheduledAt: null,
      publishedAt,
      isFeatured: item.isFeatured,
      isSponsored: Boolean(item.isSponsored),
      sponsorInfo: item.sponsorInfo || "",
      sourceName: item.sourceName || "",
      sourceUrl: "",
      viewCount: item.viewCount,
      bookmarkCount: item.bookmarkCount,
      shareCount: item.shareCount,
      version: 1,
      ...(adminId ? { createdBy: adminId, updatedByAdminId: adminId } : {}),
    });
  }

  await NewsArticle.insertMany(createdDocs);
  await recalculateNewsTagUsageCounts();

  return {
    seeded: true,
    categoriesCount,
    tagsCount,
    articlesCount: createdDocs.length,
  };
}

