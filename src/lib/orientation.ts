import { revalidatePath } from "next/cache";
import { Types } from "mongoose";
import { ORIENTATION_ARTICLE_STATUS } from "@/constants";
import { connectToDatabase } from "@/lib/db";
import { slugifyVietnamese } from "@/lib/orientation-utils";
import {
  createTiptapDoc,
  estimateReadTimeFromTiptap,
  extractPlainTextFromTiptap,
  tiptapCallout,
  tiptapHeading,
  tiptapList,
  tiptapParagraph,
  tiptapText,
} from "@/lib/content/tiptap-utils";
import { OrientationArticle } from "@/models/OrientationArticle";
import { OrientationCategory } from "@/models/OrientationCategory";
import { OrientationTopic } from "@/models/OrientationTopic";
import type {
  IOrientationArticleSummary,
  IOrientationCategoryDTO,
  IOrientationTopicDTO,
  TiptapJSONDoc,
} from "@/types";

interface PopulatedCategory {
  _id: Types.ObjectId | string;
  name: string;
  slug: string;
}

interface PopulatedTopic {
  _id: Types.ObjectId | string;
  name: string;
  slug: string;
  isActive?: boolean;
}

interface RawArticleDoc {
  _id: Types.ObjectId | string;
  title: string;
  slug: string;
  summary: string;
  contentJson?: TiptapJSONDoc;
  contentText?: string;
  coverImage?: string;
  categoryId: PopulatedCategory | Types.ObjectId | string | null;
  topicIds?: (PopulatedTopic | Types.ObjectId | string)[];
  tags?: string[];
  status: "DRAFT" | "PUBLISHED" | "UNPUBLISHED";
  isFeatured: boolean;
  authorName: string;
  readTimeMinutes: number;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  publishedAt?: Date | string | null;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

function isPopulatedRef(
  ref: unknown
): ref is { _id: Types.ObjectId | string; name: string; slug: string; isActive?: boolean } {
  return (
    typeof ref === "object" &&
    ref !== null &&
    "_id" in ref &&
    "name" in ref &&
    "slug" in ref
  );
}

export function serializeOrientationArticle(
  doc: RawArticleDoc,
  options?: { likedIds?: Set<string>; includeContent?: boolean; onlyActiveTopics?: boolean }
): IOrientationArticleSummary & {
  contentJson?: TiptapJSONDoc;
  contentText?: string;
  updatedAt?: string | Date;
} {
  const articleId = doc._id.toString();

  const category = isPopulatedRef(doc.categoryId)
    ? {
        _id: doc.categoryId._id.toString(),
        name: doc.categoryId.name,
        slug: doc.categoryId.slug,
      }
    : null;

  const topics = Array.isArray(doc.topicIds)
    ? doc.topicIds
        .filter((t): t is PopulatedTopic => {
          if (!isPopulatedRef(t)) return false;
          if (options?.onlyActiveTopics && t.isActive === false) return false;
          return true;
        })
        .map((t) => ({
          _id: t._id.toString(),
          name: t.name,
          slug: t.slug,
        }))
    : [];

  const base: IOrientationArticleSummary & {
    contentJson?: TiptapJSONDoc;
    contentText?: string;
    updatedAt?: string | Date;
  } = {
    _id: articleId,
    title: doc.title,
    slug: doc.slug,
    summary: doc.summary,
    coverImage: doc.coverImage || "",
    category,
    topics,
    tags: Array.isArray(doc.tags) ? doc.tags : [],
    status: doc.status,
    isFeatured: Boolean(doc.isFeatured),
    authorName: doc.authorName || "Ban biên tập Unera",
    readTimeMinutes: doc.readTimeMinutes || 5,
    viewCount: doc.viewCount || 0,
    likeCount: doc.likeCount || 0,
    commentCount: doc.commentCount || 0,
    isLikedByMe: options?.likedIds ? options.likedIds.has(articleId) : false,
    publishedAt: doc.publishedAt || null,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };

  if (options?.includeContent) {
    base.contentJson = doc.contentJson || {
      type: "doc",
      content: [{ type: "paragraph" }],
    };
    if (typeof doc.contentText === "string") {
      base.contentText = doc.contentText;
    }
  }

  return base;
}

const TAXONOMY_CACHE_TTL_MS = 60_000;

interface CachedTaxonomyState {
  tree: IOrientationCategoryDTO[];
  categoryBySlug: Map<string, { _id: string; name: string; slug: string }>;
  categoryById: Map<string, { _id: string; name: string; slug: string }>;
  topicBySlug: Map<
    string,
    { _id: string; categoryId: string; name: string; slug: string; isActive: boolean }
  >;
  topicById: Map<
    string,
    { _id: string; categoryId: string; name: string; slug: string; isActive: boolean }
  >;
  expiresAt: number;
}

let cachedTaxonomyState: CachedTaxonomyState | null = null;
let articleIndexesSyncStarted = false;

export function invalidateOrientationTaxonomyCache() {
  cachedTaxonomyState = null;
}

export function ensureOrientationArticleIndexesInBackground() {
  if (articleIndexesSyncStarted) return;
  articleIndexesSyncStarted = true;
  void OrientationArticle.syncIndexes().catch(() => {
    articleIndexesSyncStarted = false;
  });
}

export async function getCachedTaxonomyLookup(): Promise<CachedTaxonomyState> {
  const now = Date.now();
  if (cachedTaxonomyState && cachedTaxonomyState.expiresAt > now) {
    return cachedTaxonomyState;
  }

  await connectToDatabase();

  const [categories, topics] = await Promise.all([
    OrientationCategory.find({ isActive: true })
      .sort({ order: 1, createdAt: 1 })
      .lean(),
    OrientationTopic.find({ isActive: true })
      .sort({ order: 1, createdAt: 1 })
      .lean(),
  ]);

  const categoryBySlug = new Map<string, { _id: string; name: string; slug: string }>();
  const categoryById = new Map<string, { _id: string; name: string; slug: string }>();
  const topicBySlug = new Map<
    string,
    { _id: string; categoryId: string; name: string; slug: string; isActive: boolean }
  >();
  const topicById = new Map<
    string,
    { _id: string; categoryId: string; name: string; slug: string; isActive: boolean }
  >();
  const topicsByCategory = new Map<string, IOrientationTopicDTO[]>();

  for (const cat of categories) {
    const catId = cat._id.toString();
    const compact = { _id: catId, name: cat.name, slug: cat.slug };
    categoryBySlug.set(cat.slug, compact);
    categoryById.set(catId, compact);
  }

  for (const topic of topics) {
    const topicId = topic._id.toString();
    const catKey = topic.categoryId.toString();
    const compactTopic = {
      _id: topicId,
      categoryId: catKey,
      name: topic.name,
      slug: topic.slug,
      isActive: Boolean(topic.isActive),
    };
    topicBySlug.set(topic.slug, compactTopic);
    topicById.set(topicId, compactTopic);

    const list = topicsByCategory.get(catKey) || [];
    list.push({
      _id: topicId,
      categoryId: catKey,
      name: topic.name,
      slug: topic.slug,
      description: topic.description || "",
      order: topic.order,
      isActive: topic.isActive,
    });
    topicsByCategory.set(catKey, list);
  }

  const tree: IOrientationCategoryDTO[] = categories.map((cat) => {
    const catId = cat._id.toString();
    return {
      _id: catId,
      name: cat.name,
      slug: cat.slug,
      description: cat.description || "",
      icon: cat.icon || "Compass",
      order: cat.order,
      isActive: cat.isActive,
      topics: topicsByCategory.get(catId) || [],
    };
  });

  cachedTaxonomyState = {
    tree,
    categoryBySlug,
    categoryById,
    topicBySlug,
    topicById,
    expiresAt: now + TAXONOMY_CACHE_TTL_MS,
  };
  return cachedTaxonomyState;
}

export async function getActiveTaxonomyTree(): Promise<IOrientationCategoryDTO[]> {
  const state = await getCachedTaxonomyLookup();
  return state.tree;
}

export async function ensureUniqueArticleSlug(
  baseInput: string,
  excludeId?: string
): Promise<string> {
  const cleanBase = slugifyVietnamese(baseInput) || "bai-viet-dinh-huong";
  let candidate = cleanBase;
  let counter = 1;

  while (true) {
    const query: Record<string, unknown> = { slug: candidate };
    if (excludeId && Types.ObjectId.isValid(excludeId)) {
      query._id = { $ne: new Types.ObjectId(excludeId) };
    }
    const existing = await OrientationArticle.exists(query);
    if (!existing) return candidate;
    counter += 1;
    candidate = `${cleanBase}-${counter}`;
  }
}

export function revalidateOrientationRoutes(slugs: string[] = []) {
  invalidateOrientationTaxonomyCache();
  try {
    revalidatePath("/explore");
    for (const slug of slugs) {
      if (slug) revalidatePath(`/explore/${slug}`);
    }
  } catch {
    // Non-fatal in non-request contexts such as seed scripts
  }
}

export async function seedDefaultOrientationExplore(adminId: Types.ObjectId | string) {
  await connectToDatabase();

  const existingCount = await OrientationCategory.countDocuments({});
  if (existingCount > 0) {
    return { skipped: true };
  }

  const categories = await OrientationCategory.insertMany([
    {
      name: "Du học",
      slug: "du-hoc",
      description:
        "Chiến lược săn học bổng quốc tế, chọn quốc gia và chuẩn bị hồ sơ du học.",
      icon: "Globe2",
      order: 1,
      isActive: true,
    },
    {
      name: "Khối ngành",
      slug: "khoi-nganh",
      description:
        "Tìm hiểu bản chất ngành học, kỹ năng cốt lõi và lộ trình nghề nghiệp từng lĩnh vực.",
      icon: "Layers",
      order: 2,
      isActive: true,
    },
    {
      name: "Thạc sĩ, NCS, Tiến sĩ",
      slug: "sau-dai-hoc",
      description:
        "Định hướng nghiên cứu chuyên sâu, đề cương khoa học và con đường học thuật sau đại học.",
      icon: "GraduationCap",
      order: 3,
      isActive: true,
    },
  ]);

  const catBySlug = new Map(categories.map((c) => [c.slug, c]));

  const topicSeed = [
    { catSlug: "du-hoc", name: "Học bổng Chính phủ", slug: "hoc-bong-chinh-phu", order: 1 },
    { catSlug: "du-hoc", name: "Hồ sơ & Bài luận SOP", slug: "ho-so-sop", order: 2 },
    { catSlug: "khoi-nganh", name: "Ngôn ngữ", slug: "ngon-ngu", order: 1 },
    { catSlug: "khoi-nganh", name: "Kinh tế – Quản trị", slug: "kinh-te-quan-tri", order: 2 },
    { catSlug: "khoi-nganh", name: "Công nghệ – Kỹ thuật", slug: "cong-nghe-ky-thuat", order: 3 },
    { catSlug: "khoi-nganh", name: "Truyền thông", slug: "truyen-thong", order: 4 },
    { catSlug: "khoi-nganh", name: "Luật", slug: "luat", order: 5 },
    { catSlug: "khoi-nganh", name: "Khoa học xã hội", slug: "khoa-hoc-xa-hoi", order: 6 },
    { catSlug: "khoi-nganh", name: "Du lịch – Dịch vụ", slug: "du-lich-dich-vu", order: 7 },
    { catSlug: "sau-dai-hoc", name: "Nghiên cứu khoa học", slug: "nghien-cuu-khoa-hoc", order: 1 },
  ];

  const topics = await OrientationTopic.insertMany(
    topicSeed.map((t) => ({
      categoryId: catBySlug.get(t.catSlug)!._id,
      name: t.name,
      slug: t.slug,
      description: `Chủ đề chuyên sâu về ${t.name}`,
      order: t.order,
      isActive: true,
    }))
  );

  const topicBySlug = new Map(topics.map((t) => [t.slug, t._id]));
  const adminObjectId =
    typeof adminId === "string" ? new Types.ObjectId(adminId) : adminId;

  const sampleArticles = [
    {
      title: "Ngành Ngôn ngữ Anh: Học gì, kỹ năng nào và bản đồ nghề nghiệp 2026",
      slug: "nganh-ngon-ngu-anh-ban-do-nghe-nghiep-2026",
      summary:
        "Phân tích chi tiết các hướng đi từ Biên phiên dịch, Giảng dạy TESOL đến Truyền thông Doanh nghiệp và Công nghệ ngôn ngữ cho sinh viên khối Ngoại ngữ.",
      contentJson: createTiptapDoc([
        tiptapHeading(2, "1. Bức tranh tổng quan ngành Ngôn ngữ Anh"),
        tiptapParagraph([
          tiptapText(
            "Sinh viên Ngôn ngữ Anh ngày nay không chỉ giới hạn ở giảng dạy hay dịch thuật truyền thống. Năng lực ngoại ngữ kết hợp kỹ năng số mở ra nhiều vị trí có mức tăng trưởng cao."
          ),
        ]),
        tiptapHeading(3, "Các nhóm vị trí phổ biến"),
        tiptapList(false, [
          [
            tiptapText("Giảng dạy & Đào tạo học thuật: ", true),
            tiptapText(
              "Giáo viên tiếng Anh, chuyên viên phát triển học liệu, điều phối chương trình quốc tế."
            ),
          ],
          [
            tiptapText("Biên – Phiên dịch & Localization: ", true),
            tiptapText(
              "Chuyển ngữ tài liệu chuyên ngành, bản địa hóa sản phẩm phần mềm, trò chơi và nội dung đa phương tiện."
            ),
          ],
          [
            tiptapText("Truyền thông & Kinh doanh quốc tế: ", true),
            tiptapText(
              "Chuyên viên Quan hệ đối ngoại, Global Marketing, Điều phối dự án tại MNC."
            ),
          ],
        ]),
        tiptapHeading(2, "2. Lộ trình tích lũy trong 4 năm đại học"),
        tiptapList(true, [
          [
            tiptapText("Năm 1–2: ", true),
            tiptapText(
              "Xây dựng nền tảng ngôn ngữ học thuật (IELTS 7.0+ hoặc tương đương), tham gia CLB học thuật để rèn giao tiếp phản xạ."
            ),
          ],
          [
            tiptapText("Năm 3: ", true),
            tiptapText(
              "Chọn chuyên hướng thực chiến — chứng chỉ sư phạm (TESOL), công cụ dịch thuật (CAT Tools) hoặc phân tích dữ liệu tiếp thị."
            ),
          ],
          [
            tiptapText("Năm 4: ", true),
            tiptapText(
              "Thực tập tối thiểu 3–6 tháng tại tổ chức giáo dục, agency hoặc doanh nghiệp đa quốc gia để hoàn thiện portfolio thực tế."
            ),
          ],
        ]),
        tiptapCallout(
          "tip",
          "Gợi ý từ Unera",
          "Hãy kết hợp ngoại ngữ với ít nhất một kỹ năng bổ trợ (Phân tích dữ liệu, Quản trị dự án hoặc Sáng tạo nội dung số) để tạo lợi thế cạnh tranh vượt trội."
        ),
      ]),
      categoryId: catBySlug.get("khoi-nganh")!._id,
      topicIds: [topicBySlug.get("ngon-ngu")!],
      tags: ["Ngôn ngữ Anh", "TESOL", "Biên phiên dịch", "Định hướng ngành"],
      status: ORIENTATION_ARTICLE_STATUS.PUBLISHED,
      isFeatured: true,
      authorName: "Ban Biên Tập Định Hướng Unera",
      likeCount: 24,
      publishedAt: new Date(Date.now() - 2 * 86400000),
    },
    {
      title: "Lộ trình từ sinh viên IT năm nhất đến Kỹ sư Phần mềm tại tập đoàn công nghệ",
      slug: "lo-trinh-sinh-vien-cong-nghe-thong-tin-den-ky-su-phan-mem",
      summary:
        "Cách cân bằng kiến thức nền tảng CS (DSA, Hệ điều hành, CSDL) với dự án thực tế và chiến lược ứng tuyển kỳ thực tập năm 3.",
      contentJson: createTiptapDoc([
        tiptapHeading(2, "1. Nền tảng không thể bỏ qua"),
        tiptapParagraph([
          tiptapText(
            "Dù xu hướng AI thay đổi công cụ lập trình, doanh nghiệp công nghệ vẫn đánh giá cao tư duy giải quyết vấn đề và khả năng thiết kế hệ thống bền vững."
          ),
        ]),
        tiptapHeading(3, "3 trụ cột cần đầu tư sớm"),
        tiptapList(false, [
          [
            tiptapText("Cấu trúc dữ liệu & Giải thuật: ", true),
            tiptapText("Thành thạo phân tích độ phức tạp và luyện giải bài toán có hệ thống."),
          ],
          [
            tiptapText("Kiến trúc Web & Database: ", true),
            tiptapText("Hiểu rõ REST API, xác thực, mô hình hóa dữ liệu SQL/NoSQL và tối ưu truy vấn."),
          ],
          [
            tiptapText("Kỹ năng cộng tác kỹ thuật: ", true),
            tiptapText("Sử dụng thành thạo Git, viết unit test, đọc tài liệu tiếng Anh chuẩn."),
          ],
        ]),
        tiptapHeading(2, "2. Mục tiêu theo từng cột mốc"),
        tiptapList(false, [
          [
            tiptapText(
              "Xây dựng 2–3 dự án có người dùng thực tế hoặc bài toán rõ ràng thay vì sao chép tutorial đơn thuần."
            ),
          ],
          [
            tiptapText(
              "Săn tìm chương trình thực tập sinh sớm từ cuối năm 2 để tích lũy kinh nghiệm quy trình Agile/Scrum."
            ),
          ],
        ]),
      ]),
      categoryId: catBySlug.get("khoi-nganh")!._id,
      topicIds: [topicBySlug.get("cong-nghe-ky-thuat")!],
      tags: ["Software Engineer", "IT", "Thực tập công nghệ", "CS"],
      status: ORIENTATION_ARTICLE_STATUS.PUBLISHED,
      isFeatured: true,
      authorName: "ThS. Nguyễn Quốc Bảo",
      likeCount: 19,
      publishedAt: new Date(Date.now() - 4 * 86400000),
    },
    {
      title: "Cẩm nang săn Học bổng Chính phủ (Chevening, MEXT, Erasmus+) từ năm thứ hai",
      slug: "cam-nang-san-hoc-bong-chinh-phu-tu-nam-hai",
      summary:
        "Giải mã bộ tiêu chí cốt lõi của các học bổng danh giá: GPA, hoạt động lãnh đạo cộng đồng, thư giới thiệu và cách viết Statement of Purpose thuyết phục.",
      contentJson: createTiptapDoc([
        tiptapHeading(2, "1. Học bổng Chính phủ tìm kiếm điều gì?"),
        tiptapParagraph([
          tiptapText(
            "Khác với học bổng đơn thuần xét điểm số, các chương trình học bổng toàn phần cấp chính phủ tìm kiếm "
          ),
          tiptapText("những cá nhân tạo ra tác động dài hạn", true),
          tiptapText(" cho cộng đồng và lĩnh vực chuyên môn."),
        ]),
        tiptapHeading(3, "Bộ hồ sơ chuẩn cần chuẩn bị trước 12–18 tháng"),
        tiptapList(true, [
          [
            tiptapText("GPA duy trì ổn định ", true),
            tiptapText("từ 3.2/4.0 trở lên cùng định hướng nghiên cứu/nghề nghiệp nhất quán."),
          ],
          [
            tiptapText("Chứng chỉ ngoại ngữ chuẩn hóa ", true),
            tiptapText("vượt ngưỡng tối thiểu (thường IELTS 6.5–7.5+)."),
          ],
          [
            tiptapText("Câu chuyện lãnh đạo (Leadership Impact): ", true),
            tiptapText(
              "Minh chứng bằng con số cụ thể từ dự án CLB, NCKH hoặc sáng kiến cộng đồng."
            ),
          ],
          [
            tiptapText("Thư giới thiệu (LOR): ", true),
            tiptapText(
              "Xây dựng mối quan hệ làm việc thực chất với giảng viên hướng dẫn hoặc quản lý trực tiếp."
            ),
          ],
        ]),
        tiptapCallout(
          "info",
          "Lưu ý thời hạn nộp hồ sơ",
          "Đa số học bổng chính phủ mở đơn từ tháng 8 đến tháng 11 hàng năm cho kỳ nhập học mùa thu năm sau."
        ),
      ]),
      categoryId: catBySlug.get("du-hoc")!._id,
      topicIds: [
        topicBySlug.get("hoc-bong-chinh-phu")!,
        topicBySlug.get("ho-so-sop")!,
      ],
      tags: ["Du học", "Chevening", "Erasmus+", "MEXT", "SOP"],
      status: ORIENTATION_ARTICLE_STATUS.PUBLISHED,
      isFeatured: true,
      authorName: "Cố vấn Du học Unera",
      likeCount: 31,
      publishedAt: new Date(Date.now() - 6 * 86400000),
    },
    {
      title: "Khối ngành Kinh tế – Quản trị: Management Trainee hay Chuyên môn phân tích?",
      slug: "khoi-nganh-kinh-te-management-trainee-hay-chuyen-mon-phan-tich",
      summary:
        "So sánh hai con đường phát triển phổ biến nhất của sinh viên Kinh tế, Tài chính và Quản trị kinh doanh khi sắp tốt nghiệp.",
      contentJson: createTiptapDoc([
        tiptapHeading(2, "1. Hiểu đúng về Management Trainee (MT)"),
        tiptapParagraph([
          tiptapText(
            "Management Trainee phù hợp với sinh viên có tố chất lãnh đạo, khả năng thích nghi nhanh qua nhiều phòng ban luân chuyển và sức bền giải case study áp lực cao."
          ),
        ]),
        tiptapHeading(2, "2. Hướng đi Chuyên môn sâu (Specialist)"),
        tiptapParagraph([
          tiptapText(
            "Nếu bạn yêu thích phân tích tài chính doanh nghiệp, Business Intelligence hoặc Supply Chain Optimization, việc đi sâu từ vị trí Analyst sẽ giúp tích lũy năng lực chuyên môn vững chắc trong 2–3 năm đầu."
          ),
        ]),
      ]),
      categoryId: catBySlug.get("khoi-nganh")!._id,
      topicIds: [topicBySlug.get("kinh-te-quan-tri")!],
      tags: ["Kinh tế", "Management Trainee", "Business Analyst"],
      status: ORIENTATION_ARTICLE_STATUS.PUBLISHED,
      isFeatured: false,
      authorName: "Ban Biên Tập Unera",
      likeCount: 12,
      publishedAt: new Date(Date.now() - 9 * 86400000),
    },
    {
      title: "Chuẩn bị đề cương Nghiên cứu Khoa học (Research Proposal) cho bậc Thạc sĩ & Tiến sĩ",
      slug: "chuan-bi-de-cuong-nghien-cuu-khoa-hoc-bac-thac-si-tien-si",
      summary:
        "Hướng dẫn từng bước từ xác định khoảng trống nghiên cứu (Research Gap), tổng quan tài liệu đến liên hệ giáo sư hướng dẫn ở bậc Sau đại học.",
      contentJson: createTiptapDoc([
        tiptapHeading(2, "1. Tư duy chọn đề tài nghiên cứu có giá trị"),
        tiptapParagraph([
          tiptapText(
            "Một Research Proposal thuyết phục cần trả lời rõ 3 câu hỏi: Vấn đề nghiên cứu là gì, vì sao khoảng trống tài liệu hiện tại cần được giải quyết, và phương pháp nào khả thi để kiểm chứng giả thuyết."
          ),
        ]),
        tiptapHeading(3, "Các bước thực hành ngay từ bậc Cử nhân"),
        tiptapList(false, [
          [
            tiptapText(
              "Tham gia nhóm NCKH sinh viên để làm quen quy trình trích dẫn APA/IEEE và xử lý dữ liệu."
            ),
          ],
          [
            tiptapText(
              "Đọc tối thiểu 15–20 bài báo quốc tế (Scopus/WoS) trong chủ đề bạn quan tâm trước khi gửi email cho giáo sư."
            ),
          ],
        ]),
      ]),
      categoryId: catBySlug.get("sau-dai-hoc")!._id,
      topicIds: [topicBySlug.get("nghien-cuu-khoa-hoc")!],
      tags: ["Thạc sĩ", "Tiến sĩ", "NCKH", "Research Proposal"],
      status: ORIENTATION_ARTICLE_STATUS.PUBLISHED,
      isFeatured: false,
      authorName: "TS. Trần Minh Đức",
      likeCount: 15,
      publishedAt: new Date(Date.now() - 12 * 86400000),
    },
    {
      title: "Ngành Truyền thông & Quan hệ công chúng trong kỷ nguyên AI tạo sinh",
      slug: "nganh-truyen-thong-va-quan-he-cong-chung-trong-ky-nguyen-ai",
      summary:
        "Khi AI hỗ trợ sản xuất nội dung nhanh chóng, giá trị cốt lõi của người làm truyền thông nằm ở chiến lược thương hiệu, storytelling đa nền tảng và phân tích dữ liệu công chúng.",
      contentJson: createTiptapDoc([
        tiptapHeading(2, "1. Lợi thế cạnh tranh mới của sinh viên Truyền thông"),
        tiptapParagraph([
          tiptapText("Doanh nghiệp tìm kiếm nhân sự biết "),
          tiptapText("đặt câu hỏi chiến lược", true),
          tiptapText(
            " thay vì chỉ viết bài đơn lẻ: hiểu hành vi người dùng, đo lường hiệu quả chiến dịch và quản trị khủng hoảng truyền thông."
          ),
        ]),
        tiptapHeading(3, "Kỹ năng nên trang bị"),
        tiptapList(false, [
          [tiptapText("Tư duy biên tập & kể chuyện thương hiệu (Brand Storytelling).")],
          [tiptapText("Sử dụng công cụ đo lường (GA4, Social Listening) để tối ưu chiến dịch.")],
        ]),
      ]),
      categoryId: catBySlug.get("khoi-nganh")!._id,
      topicIds: [topicBySlug.get("truyen-thong")!],
      tags: ["Truyền thông", "PR", "Content Strategy"],
      status: ORIENTATION_ARTICLE_STATUS.PUBLISHED,
      isFeatured: false,
      authorName: "Ban Biên Tập Unera",
      likeCount: 9,
      publishedAt: new Date(Date.now() - 15 * 86400000),
    },
  ];

  await OrientationArticle.insertMany(
    sampleArticles.map((article) => {
      const contentText = extractPlainTextFromTiptap(article.contentJson);
      return {
        ...article,
        contentText,
        createdByAdminId: adminObjectId,
        readTimeMinutes: estimateReadTimeFromTiptap(article.contentJson, contentText),
        commentCount: 0,
        viewCount: 120,
      };
    })
  );

  return { skipped: false, categoriesCount: categories.length, topicsCount: topics.length, articlesCount: sampleArticles.length };
}

