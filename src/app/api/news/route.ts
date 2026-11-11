import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { NewsArticle } from "@/models/NewsArticle";

const INITIAL_ARTICLES = [
  {
    title: "Chưa biết mình phù hợp với ngành nào? Bắt đầu từ đây.",
    slug: "chua-biet-minh-phu-hop-voi-nganh-nao-bat-dau-tu-day",
    summary:
      "Một hướng dẫn để hiểu bản thân, tìm hiểu ngành học và biến những băn khoăn thành kế hoạch cụ thể.",
    content: `
# Chưa biết mình phù hợp với ngành nào? Bắt đầu từ đây.

Đại học không chỉ là nơi học kiến thức, mà là hành trình tự khám phá và định hình bản thân. Khi bước vào giảng đường, rất nhiều sinh viên cảm thấy mông lung: liệu ngành mình đang học có phù hợp với mình? Liệu ra trường mình sẽ làm gì?

### 1. Hiểu mình trước khi chọn ngành
Đừng vội chạy theo những ngành "hot" trên mạng xã hội. Hãy tự hỏi:
- Bạn thích làm việc với con người, số liệu, máy móc hay ý tưởng?
- Điều gì khiến bạn có thể tập trung hàng giờ đồng hồ mà không cảm thấy mệt mỏi?
- Giá trị cốt lõi bạn hướng tới là gì: sự tự do, tính ổn định, thu nhập cao hay đóng góp xã hội?

### 2. Biến băn khoăn thành kế hoạch hành động
Thay vì lo lắng một cách thụ động, hãy:
1. Đăng ký làm bài trắc nghiệm định hướng năng lực trên Polaris/Unera.
2. Trò chuyện cùng các anh chị sinh viên khóa trên hoặc cố vấn chuyên môn.
3. Tham gia thử sức vào một dự án thực tế hoặc câu lạc bộ chuyên môn.
    `,
    category: "ORIENTATION",
    author: "Ban biên tập Polaris",
    readTime: "8 phút đọc",
    isFeatured: true,
    isSponsored: false,
    status: "PUBLISHED",
  },
  {
    title: "Du học không bắt đầu từ một bộ hồ sơ",
    slug: "du-hoc-khong-bat-dau-tu-mot-bo-ho-so",
    summary:
      "Cách xác định mục tiêu, chọn điểm đến và chuẩn bị nguồn lực trước khi nộp đơn.",
    content: `
# Du học không bắt đầu từ một bộ hồ sơ

Nhiều bạn nghĩ rằng du học chỉ bắt đầu khi bạn bắt tay vào viết Statement of Purpose hay ôn thi IELTS cấp tốc. Thực tế, một bộ hồ sơ học bổng thành công là kết quả của cả quá trình tích lũy 2-3 năm học thuật và hoạt động thực chất.

### Chuẩn bị gì từ sớm?
- **GPA vững chắc:** GPA từ 3.2 trở lên là tấm vé an toàn để nộp đơn vào các trường uy tín.
- **Chứng chỉ ngoại ngữ chuẩn hóa:** Đạt điểm mục tiêu trước hạn nộp đơn ít nhất 6 tháng.
- **Câu chuyện cá nhân:** Điểm đặc biệt khiến bạn khác biệt giữa hàng nghìn ứng viên toàn cầu.
    `,
    category: "STUDY_ABROAD",
    author: "Ban biên tập Polaris",
    readTime: "8 phút đọc",
    isFeatured: false,
    isSponsored: false,
    status: "PUBLISHED",
  },
  {
    title: "Kinh tế – Quản trị: Bạn sẽ học và làm gì?",
    slug: "kinh-te-quan-tri-ban-se-hoc-va-lam-gi",
    summary:
      "Hiểu về chương trình học, nhóm kỹ năng và các hướng nghề nghiệp sau tốt nghiệp.",
    content: `
# Kinh tế – Quản trị: Bạn sẽ học và làm gì?

Khối ngành Kinh tế - Quản trị mang đến góc nhìn bao quát về vận hành tổ chức, dòng tiền, thị trường và chiến lược tăng trưởng.

### Cơ hội nghề nghiệp tiêu biểu:
- Management Trainee tại các tập đoàn đa quốc gia FMCG, Tech, Finance.
- Chuyên viên phân tích kinh doanh (Business Analyst).
- Quản trị dự án và vận hành chuỗi cung ứng.
    `,
    category: "DISCIPLINES",
    author: "Ban biên tập Polaris",
    readTime: "6 phút đọc",
    isFeatured: false,
    isSponsored: false,
    status: "PUBLISHED",
  },
  {
    title: "CV đầu tiên: ít kinh nghiệm, vẫn có điểm mạnh",
    slug: "cv-dau-tien-it-kinh-nghiem-van-co-diem-manh",
    summary:
      "Biến dự án môn học và hoạt động sinh viên thành câu chuyện năng lực của bạn.",
    content: `
# CV đầu tiên: ít kinh nghiệm, vẫn có điểm mạnh

Là sinh viên năm 1, năm 2 chưa từng đi làm công ty, bạn hoàn toàn có thể viết một bản CV ấn tượng nếu biết cách cấu trúc theo công thức STAR (Situation - Task - Action - Result).

### Những gì bạn có thể đưa vào:
- Dự án môn học lớn (Term Project).
- Hoạt động câu lạc bộ, tổ chức sự kiện.
- Kỹ năng công cụ thực tế: Python, SQL, Excel, Figma, Ngoại ngữ.
    `,
    category: "SKILLS_CV",
    author: "Ban biên tập Polaris",
    readTime: "5 phút đọc",
    isFeatured: false,
    isSponsored: false,
    status: "PUBLISHED",
  },
  {
    title: "Học thạc sĩ ngay hay đi làm trước?",
    slug: "hoc-thac-si-ngay-hay-di-lam-truoc",
    summary:
      "Những câu hỏi cần tự trả lời để lựa chọn thời điểm học tiếp phù hợp với mình.",
    content: `
# Học thạc sĩ ngay hay đi làm trước?

Đây là băn khoăn của hầu hết sinh viên năm 3 và năm cuối. Quyết định phụ thuộc vào ngành nghề bạn theo đuổi:
- Nếu theo đuổi nghiên cứu học thuật sâu: học tiếp thạc sĩ sớm là lợi thế.
- Nếu theo khối ngành quản trị kinh doanh (MBA): 2-3 năm kinh nghiệm thực chiến là điều kiện gần như bắt buộc.
    `,
    category: "POSTGRAD",
    author: "Ban biên tập Polaris",
    readTime: "7 phút đọc",
    isFeatured: false,
    isSponsored: false,
    status: "PUBLISHED",
  },
  {
    title: "Tìm học bổng phù hợp, không chỉ học bổng lớn",
    slug: "tim-hoc-bong-phu-hop-khong-chi-hoc-bong-lon",
    summary:
      "Một cách tiếp cận có hệ thống để tìm kiếm, sàng lọc và theo dõi cơ hội học bổng.",
    content: `
# Tìm học bổng phù hợp, không chỉ học bổng lớn

Đừng chỉ nhắm vào những học bổng toàn phần có tỷ lệ chọi 1/1000. Có hàng trăm học bổng bán phần, học bổng theo khoa, hoặc học bổng hỗ trợ tài chính từ các doanh nghiệp ít người biết đến nhưng vừa sức hơn rất nhiều.
    `,
    category: "SCHOLARSHIPS",
    author: "Ban biên tập Polaris",
    readTime: "6 phút đọc",
    isFeatured: false,
    isSponsored: false,
    status: "PUBLISHED",
  },
  {
    title: "Bắt đầu nghiên cứu khoa học từ năm đại học",
    slug: "bat-dau-nghien-cuu-khoa-hoc-tu-nam-dai-hoc",
    summary:
      "Từ một câu hỏi nhỏ đến đề tài đầu tiên: cách tìm chủ đề, nhóm và người hướng dẫn.",
    content: `
# Bắt đầu nghiên cứu khoa học từ năm đại học

Nghiên cứu khoa học không phải là điều gì quá xa vời. Đó là quá trình rèn luyện tư duy phản biện, kỹ năng tra cứu tài liệu quốc tế và phương pháp luận giải quyết vấn đề một cách chặt chẽ.
    `,
    category: "ACTIVITIES",
    author: "Ban biên tập Polaris",
    readTime: "9 phút đọc",
    isFeatured: false,
    isSponsored: false,
    status: "PUBLISHED",
  },
];

/**
 * GET /api/news
 * Danh sách bài viết công khai với bộ lọc chuyên mục, tìm kiếm và phân trang
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");
    const search = searchParams.get("search");
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "9", 10);

    await connectToDatabase();

    // Tự động gieo dữ liệu mẫu ban đầu nếu bộ sưu tập rỗng
    const count = await NewsArticle.countDocuments();
    if (count === 0) {
      await NewsArticle.insertMany(INITIAL_ARTICLES);
    }

    const filter: Record<string, unknown> = {
      status: "PUBLISHED",
    };

    if (category && category !== "all") {
      filter.category = category.toUpperCase();
    }

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: "i" } },
        { summary: { $regex: search, $options: "i" } },
      ];
    }

    const total = await NewsArticle.countDocuments(filter);
    const articles = await NewsArticle.find(filter)
      .sort({ isFeatured: -1, publishedAt: -1, createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    // Lấy bài viết nổi bật cho Hero banner
    const featuredArticle =
      articles.find((a) => a.isFeatured) ||
      (await NewsArticle.findOne({ isFeatured: true, status: "PUBLISHED" }).lean());

    return NextResponse.json({
      success: true,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      articles,
      featuredArticle,
    });
  } catch (error) {
    console.error("GET /api/news error", error);
    return NextResponse.json(
      { error: "Lỗi khi tải danh sách tin tức & bài viết." },
      { status: 500 }
    );
  }
}
