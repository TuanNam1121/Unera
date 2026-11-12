/**
 * Bộ dữ liệu chuẩn Trắc nghiệm Đa Trí Thông Minh — MI (`TOOL-02`)
 * Theo học thuyết Multiple Intelligences của Howard Gardner (8 nhóm)
 * - 40 phát biểu (5 phát biểu / nhóm trí thông minh), thang điểm Likert 1–5
 * - Hồ sơ phân tích chi tiết + phương pháp học tập ĐH + nhóm ngành nghề phù hợp
 */

export type MiCategoryKey =
  | "LINGUISTIC"
  | "LOGICAL_MATHEMATICAL"
  | "VISUAL_SPATIAL"
  | "MUSICAL"
  | "BODILY_KINESTHETIC"
  | "INTERPERSONAL"
  | "INTRAPERSONAL"
  | "NATURALIST";

export interface MiLikertOption {
  value: 1 | 2 | 3 | 4 | 5;
  shortLabel: string;
  label: string;
}

export interface MiCategoryMeta {
  key: MiCategoryKey;
  nameVi: string;
  shortLabel: string;
  englishTag: string;
  colorHex: string;
  badgeClass: string;
  barClass: string;
  description: string;
  indicators: string[];
  studyMethods: string[];
  suitableCareers: string[];
}

export interface MiQuestion {
  id: string;
  order: number;
  category: MiCategoryKey;
  statement: string;
}

export const MI_CATEGORY_ORDER: MiCategoryKey[] = [
  "LINGUISTIC",
  "LOGICAL_MATHEMATICAL",
  "VISUAL_SPATIAL",
  "MUSICAL",
  "BODILY_KINESTHETIC",
  "INTERPERSONAL",
  "INTRAPERSONAL",
  "NATURALIST",
];

export const MI_LIKERT_OPTIONS: MiLikertOption[] = [
  { value: 1, shortLabel: "1", label: "Hoàn toàn không đúng" },
  { value: 2, shortLabel: "2", label: "Ít đúng" },
  { value: 3, shortLabel: "3", label: "Phân vân" },
  { value: 4, shortLabel: "4", label: "Khá đúng" },
  { value: 5, shortLabel: "5", label: "Hoàn toàn đúng" },
];

export const MI_PROFILES: Record<MiCategoryKey, MiCategoryMeta> = {
  LINGUISTIC: {
    key: "LINGUISTIC",
    nameVi: "Trí thông minh Ngôn ngữ",
    shortLabel: "Ngôn ngữ",
    englishTag: "Word Smart",
    colorHex: "#2563EB",
    badgeClass: "bg-blue-50 text-blue-700 border-blue-200",
    barClass: "bg-blue-600",
    description:
      "Nhạy bén với từ ngữ, ngữ nghĩa, cấu trúc diễn đạt cả nói lẫn viết; học nhanh ngôn ngữ mới và truyền đạt ý tưởng mạch lạc.",
    indicators: [
      "Thích đọc sách, viết blog, ghi chép tóm tắt bài giảng bằng ngôn từ riêng",
      "Nhạy cảm với cách dùng từ chuẩn xác, chơi chữ hoặc sắc thái ngoại ngữ",
      "Dễ thuyết phục người khác thông qua bài luận, tranh biện hoặc kể chuyện",
    ],
    studyMethods: [
      "Tóm tắt bài học bằng cách tự viết lại giải thích như đang dạy bạn học",
      "Ghi âm hoặc đọc thành tiếng các khái niệm khó trước kỳ thi",
      "Dùng flashcard ngữ cảnh (context sentence) khi học ngoại ngữ và thuật ngữ chuyên ngành",
    ],
    suitableCareers: [
      "Biên – Phiên dịch & Ngoại giao",
      "Content Strategist / Copywriter / Nhà báo",
      "Giảng viên Ngôn ngữ / Truyền thông",
      "Luật sư / Chuyên viên Pháp chế",
    ],
  },
  LOGICAL_MATHEMATICAL: {
    key: "LOGICAL_MATHEMATICAL",
    nameVi: "Trí thông minh Logic – Toán học",
    shortLabel: "Logic - Toán",
    englishTag: "Number / Reasoning Smart",
    colorHex: "#4F46E5",
    badgeClass: "bg-indigo-50 text-indigo-700 border-indigo-200",
    barClass: "bg-indigo-600",
    description:
      "Tư duy trừu tượng mạch lạc, thích tìm quy luật nhân quả, phân tích con số, dữ liệu và giải bài toán có cấu trúc.",
    indicators: [
      "Thích bóc tách vấn đề lớn thành từng bước logic rõ ràng",
      "Hứng thú với số liệu thống kê, lập trình, tài chính hoặc câu đố tư duy",
      "Thường kiểm chứng lập luận bằng bằng chứng định lượng",
    ],
    studyMethods: [
      "Vẽ sơ đồ quy trình, bảng so sánh tiêu chí và công thức tổng quát thay vì học thuộc",
      "Thực hành nhiều case study có số liệu hoặc bài tập lập trình/tính toán thực tế",
      "Tự đặt câu hỏi 'Điều kiện cần và đủ của mô hình này là gì?'",
    ],
    suitableCareers: [
      "Kỹ sư Phần mềm / Khoa học Dữ liệu (Data & AI)",
      "Chuyên viên Phân tích Tài chính / Kiểm toán",
      "Nghiên cứu Khoa học & Kinh tế lượng",
      "Quản trị Vận hành & Chiến lược",
    ],
  },
  VISUAL_SPATIAL: {
    key: "VISUAL_SPATIAL",
    nameVi: "Trí thông minh Không gian – Thị giác",
    shortLabel: "Thị giác",
    englishTag: "Picture Smart",
    colorHex: "#0EA5E9",
    badgeClass: "bg-sky-50 text-sky-700 border-sky-200",
    barClass: "bg-sky-600",
    description:
      "Hình dung xuất sắc bằng hình ảnh, màu sắc, bố cục 2D/3D và bản đồ tư duy trực quan.",
    indicators: [
      "Ghi nhớ kiến thức tốt qua sơ đồ, biểu đồ, slide trực quan hoặc hình minh họa",
      "Chú ý mạnh đến tính cân đối, màu sắc, kiểu chữ và thẩm mỹ thị giác",
      "Dễ định hướng không gian, hình dung cấu trúc sản phẩm trước khi phác thảo",
    ],
    studyMethods: [
      "Sử dụng Mind Map, Sketch Note và mã hóa màu sắc (color coding) trong vở ghi",
      "Biến khối văn bản dài thành bảng biểu, wireframe hoặc infographic tóm tắt",
      "Xem video mô phỏng trực quan kết hợp phác thảo lại bằng tay",
    ],
    suitableCareers: [
      "UI/UX Designer & Product Design",
      "Thiết kế Đồ họa / Motion Graphics / Dựng phim",
      "Kiến trúc sư / Quy hoạch & Thiết kế Nội thất",
      "Data Visualization / Creative Art Director",
    ],
  },
  MUSICAL: {
    key: "MUSICAL",
    nameVi: "Trí thông minh Âm nhạc",
    shortLabel: "Âm nhạc",
    englishTag: "Music Smart",
    colorHex: "#9333EA",
    badgeClass: "bg-purple-50 text-purple-700 border-purple-200",
    barClass: "bg-purple-600",
    description:
      "Nhạy cảm đặc biệt với nhịp điệu, cao độ, âm sắc, ngữ điệu ngôn ngữ và cảm xúc qua âm thanh.",
    indicators: [
      "Dễ bắt giai điệu, nhận ra chi tiết âm thanh hoặc ngữ điệu bản xứ nhanh",
      "Thường gắn ký ức học tập hoặc cảm xúc với một bản nhạc, nhịp điệu",
      "Học ngoại ngữ tốt về phát âm, trọng âm và nối âm tự nhiên",
    ],
    studyMethods: [
      "Tạo môi trường âm thanh phù hợp (nhạc không lời / Lo-fi / Pomodoro) khi học sâu",
      "Đọc to có nhịp điệu hoặc gắn từ khóa cần nhớ thành câu vần dễ thuộc",
      "Tận dụng Podcast, Audiobook và Shadowing để tiếp thu kiến thức nhanh",
    ],
    suitableCareers: [
      "Sản xuất Âm thanh / Podcast & Multimedia",
      "Giảng dạy Ngôn ngữ & Ngữ âm học",
      "Sáng tạo Nội dung Số / Video Editor",
      "Quản lý Nghệ thuật & Sự kiện Văn hóa",
    ],
  },
  BODILY_KINESTHETIC: {
    key: "BODILY_KINESTHETIC",
    nameVi: "Trí thông minh Vận động Cơ thể",
    shortLabel: "Vận động",
    englishTag: "Body Smart",
    colorHex: "#F59E0B",
    badgeClass: "bg-amber-50 text-amber-700 border-amber-200",
    barClass: "bg-amber-500",
    description:
      "Học hỏi và biểu đạt tốt nhất thông qua trải nghiệm trực tiếp, thực hành tay nghề và phối hợp vận động tinh – thô.",
    indicators: [
      "Tiếp thu nhanh nhất khi tự tay thực hành lab, mô hình hoặc đóng vai mô phỏng",
      "Khó ngồi yên quá lâu nếu chỉ nghe giảng một chiều không tương tác",
      "Phối hợp ngôn ngữ cơ thể tự nhiên khi thuyết trình hoặc dẫn dắt hoạt động",
    ],
    studyMethods: [
      "Áp dụng học qua dự án thực hành (learning by doing), lab thí nghiệm và role-play",
      "Chia phiên học thành từng chặng 30–40 phút xen kẽ vận động nhẹ giữa giờ",
      "Đi lại hoặc vừa cầm bút phác thảo vừa ôn bài để tăng mức tập trung",
    ],
    suitableCareers: [
      "Tổ chức Sự kiện & Trải nghiệm Hiện trường",
      "Kỹ thuật Thực hành / Y sinh & Vật lý trị liệu",
      "Thể thao – Giải trí / Sân khấu & Biểu diễn",
      "Kinh doanh Thực địa & Dịch vụ Khách hàng Cao cấp",
    ],
  },
  INTERPERSONAL: {
    key: "INTERPERSONAL",
    nameVi: "Trí thông minh Tương tác – Giao tiếp",
    shortLabel: "Tương tác",
    englishTag: "People Smart",
    colorHex: "#10B981",
    badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200",
    barClass: "bg-emerald-600",
    description:
      "Đọc vị cảm xúc, nhu cầu, động cơ của người khác rất tốt; dễ xây dựng niềm tin, làm việc nhóm và lãnh đạo hài hòa.",
    indicators: [
      "Mở lòng kết bạn dễ dàng, thường là cầu nối trong lớp học và câu lạc bộ",
      "Hứng thú tìm hiểu tâm lý khách hàng, đồng đội hoặc hoạt động cộng đồng",
      "Giải quyết tốt mâu thuẫn bằng lắng nghe và đối thoại xây dựng",
    ],
    studyMethods: [
      "Tham gia nhóm học (study group), hỏi đáp cùng bạn bè hoặc cố vấn (mentor)",
      "Dạy lại kiến thức vừa học cho bạn cùng lớp để củng cố sâu hiểu biết",
      "Gắn lý thuyết với bài toán con người, phỏng vấn thực tế hoặc khảo sát",
    ],
    suitableCareers: [
      "Quản trị Nhân sự (HR / Talent Acquisition)",
      "Quan hệ Công chúng (PR) / Account Manager",
      "Tư vấn Tâm lý / Giáo dục & Công tác Sinh viên",
      "Quản lý Dự án / Business Development",
    ],
  },
  INTRAPERSONAL: {
    key: "INTRAPERSONAL",
    nameVi: "Trí thông minh Nội tâm",
    shortLabel: "Nội tâm",
    englishTag: "Self Smart",
    colorHex: "#EC4899",
    badgeClass: "bg-rose-50 text-rose-700 border-rose-200",
    barClass: "bg-rose-600",
    description:
      "Thấu hiểu sâu sắc điểm mạnh, giá trị cốt lõi, cảm xúc cá nhân và biết tự điều hướng mục tiêu dài hạn độc lập.",
    indicators: [
      "Thường xuyên tự phản tư (self-reflection) qua viết nhật ký hoặc đánh giá bản thân",
      "Độc lập trong tư duy, ít bị cuốn theo tâm lý đám đông nhất thời",
      "Ý thức rõ động lực bên trong khiến mình kiên trì học và phát triển",
    ],
    studyMethods: [
      "Thiết lập mục tiêu học tập cá nhân hóa và sổ theo dõi tự đánh giá hàng tuần",
      "Dành thời gian yên tĩnh tự đọc sâu, kết nối kiến thức với trải nghiệm bản thân",
      "Viết nhật ký học tập (learning journal) để nhận ra điều gì thực sự hiệu quả với mình",
    ],
    suitableCareers: [
      "Nghiên cứu Độc lập / Chiến lược Phát triển Bản thân",
      "Nhà tâm lý học / Coach Định hướng Nghề nghiệp",
      "Tác giả / Nhà phân tích Nội dung Chuyên sâu",
      "Khởi nghiệp Độc lập / Product Strategist",
    ],
  },
  NATURALIST: {
    key: "NATURALIST",
    nameVi: "Trí thông minh Thiên nhiên",
    shortLabel: "Thiên nhiên",
    englishTag: "Nature Smart",
    colorHex: "#0D9488",
    badgeClass: "bg-teal-50 text-teal-700 border-teal-200",
    barClass: "bg-teal-600",
    description:
      "Nhạy bén trong quan sát, phân loại hệ sinh thái, quy luật tự nhiên và các hệ thống hữu cơ bền vững.",
    indicators: [
      "Quan tâm sâu đến môi trường, phát triển bền vững (ESG), sinh học hoặc du lịch sinh thái",
      "Rất giỏi nhận diện quy luật biến đổi, phân loại mẫu vật và hệ thống hóa thực địa",
      "Cảm thấy tái tạo năng lượng rõ rệt khi gần thiên nhiên hoặc không gian xanh",
    ],
    studyMethods: [
      "Học trong không gian nhiều ánh sáng tự nhiên hoặc gần cây xanh khi cần tập trung",
      "Phân loại kiến thức theo hệ thống phân cấp (taxonomy), cây phân nhánh và thuộc tính",
      "Gắn đề tài học tập với khảo sát thực địa, phát triển bền vững hoặc bài toán xanh",
    ],
    suitableCareers: [
      "Chuyên viên Phát triển Bền vững (ESG) & Môi trường",
      "Công nghệ Sinh học / Khoa học Nông nghiệp & Thực phẩm",
      "Du lịch Sinh thái & Bảo tồn Di sản",
      "Quản trị Chuỗi cung ứng Xanh / Quy hoạch Đô thị Xanh",
    ],
  },
};

export const MI_QUESTIONS: MiQuestion[] = [
  // Chặng 1 (1..10)
  {
    id: "mi_01",
    order: 1,
    category: "LINGUISTIC",
    statement: "Tôi thường diễn đạt suy nghĩ bằng bài viết hoặc lời nói một cách mạch lạc và giàu hình ảnh.",
  },
  {
    id: "mi_02",
    order: 2,
    category: "LOGICAL_MATHEMATICAL",
    statement: "Tôi thích phân tích dữ liệu, tìm quy luật ẩn sau con số hoặc giải các bài toán logic phức tạp.",
  },
  {
    id: "mi_03",
    order: 3,
    category: "VISUAL_SPATIAL",
    statement: "Tôi nhớ thông tin nhanh hơn nhiều khi kiến thức được trình bày bằng biểu đồ, bản đồ tư duy hoặc hình ảnh.",
  },
  {
    id: "mi_04",
    order: 4,
    category: "MUSICAL",
    statement: "Tôi dễ nhận ra nhịp điệu, cao độ lệch tông hoặc bắt chước ngữ điệu, phát âm ngoại ngữ khá chuẩn xác.",
  },
  {
    id: "mi_05",
    order: 5,
    category: "BODILY_KINESTHETIC",
    statement: "Tôi học nhanh nhất khi được trực tiếp thực hành, thao tác trên mô hình thật thay vì chỉ đọc tài liệu.",
  },
  {
    id: "mi_06",
    order: 6,
    category: "INTERPERSONAL",
    statement: "Bạn bè thường tìm đến tôi để chia sẻ hoặc nhờ tôi làm cầu nối hòa giải khi nhóm có bất đồng.",
  },
  {
    id: "mi_07",
    order: 7,
    category: "INTRAPERSONAL",
    statement: "Tôi hiểu khá rõ điểm mạnh, giới hạn và những giá trị sống quan trọng nhất đối với bản thân mình.",
  },
  {
    id: "mi_08",
    order: 8,
    category: "NATURALIST",
    statement: "Tôi thích quan sát thời tiết, cây cối, động vật hoặc tìm hiểu các vấn đề về sinh thái và môi trường xanh.",
  },
  {
    id: "mi_09",
    order: 9,
    category: "LINGUISTIC",
    statement: "Tôi hay để ý lỗi chính tả, cách dùng từ đắt giá và thích học từ vựng mới qua đọc sách báo.",
  },
  {
    id: "mi_10",
    order: 10,
    category: "LOGICAL_MATHEMATICAL",
    statement: "Trước khi tin một kết luận, tôi thường yêu cầu số liệu kiểm chứng hoặc chuỗi suy luận nhân – quả rõ ràng.",
  },

  // Chặng 2 (11..20)
  {
    id: "mi_11",
    order: 11,
    category: "VISUAL_SPATIAL",
    statement: "Tôi có cảm quan tốt về phối màu, bố cục trang slide hoặc thiết kế không gian sao cho hài hòa.",
  },
  {
    id: "mi_12",
    order: 12,
    category: "MUSICAL",
    statement: "Âm nhạc ảnh hưởng rõ rệt đến tâm trạng của tôi và tôi thường ghi nhớ giai điệu rất lâu.",
  },
  {
    id: "mi_13",
    order: 13,
    category: "BODILY_KINESTHETIC",
    statement: "Tôi thấy bứt rứt nếu phải ngồi bất động nghe giảng quá lâu mà không có hoạt động tương tác.",
  },
  {
    id: "mi_14",
    order: 14,
    category: "INTERPERSONAL",
    statement: "Tôi dễ dàng nhận ra tâm trạng hoặc sự thay đổi thái độ của người khác qua ánh mắt và cử chỉ.",
  },
  {
    id: "mi_15",
    order: 15,
    category: "INTRAPERSONAL",
    statement: "Tôi thường dành thời gian một mình để tự nhìn lại các quyết định đã qua và rút kinh nghiệm sâu sắc.",
  },
  {
    id: "mi_16",
    order: 16,
    category: "NATURALIST",
    statement: "Tôi thích phân loại đồ vật, mẫu dữ liệu hoặc ghi nhận sự khác biệt tinh tế giữa các giống loài tự nhiên.",
  },
  {
    id: "mi_17",
    order: 17,
    category: "LINGUISTIC",
    statement: "Tôi hứng thú với việc viết luận, viết báo cáo, sáng tác nội dung hoặc tranh biện học thuật.",
  },
  {
    id: "mi_18",
    order: 18,
    category: "LOGICAL_MATHEMATICAL",
    statement: "Tôi giỏi lập bảng tính ngân sách, tối ưu hóa quy trình hoặc thiết lập hệ thống phân loại rành mạch.",
  },
  {
    id: "mi_19",
    order: 19,
    category: "VISUAL_SPATIAL",
    statement: "Tôi dễ dàng đọc bản đồ, hình dung vật thể xoay trong không gian 3 chiều hoặc vẽ phác thảo ý tưởng.",
  },
  {
    id: "mi_20",
    order: 20,
    category: "MUSICAL",
    statement: "Tôi thường vô thức gõ nhịp theo tiếng động xung quanh hoặc ngân nga giai điệu trong lúc làm việc.",
  },

  // Chặng 3 (21..30)
  {
    id: "mi_21",
    order: 21,
    category: "BODILY_KINESTHETIC",
    statement: "Tôi tiếp thu kỹ năng thể thao, nhảy múa, thủ công hoặc diễn xuất cơ thể tương đối nhanh.",
  },
  {
    id: "mi_22",
    order: 22,
    category: "INTERPERSONAL",
    statement: "Tôi cảm thấy tràn đầy năng lượng khi làm việc nhóm, tổ chức sự kiện hoặc mở rộng mạng lưới bạn bè mới.",
  },
  {
    id: "mi_23",
    order: 23,
    category: "INTRAPERSONAL",
    statement: "Tôi tự đặt ra mục tiêu cá nhân rõ ràng và hiếm khi bị lung lay bởi áp lực chạy theo số đông.",
  },
  {
    id: "mi_24",
    order: 24,
    category: "NATURALIST",
    statement: "Đi dạo ở công viên, leo núi hay làm vườn giúp tôi phục hồi tinh thần nhanh hơn ở trong phòng kín.",
  },
  {
    id: "mi_25",
    order: 25,
    category: "LINGUISTIC",
    statement: "Tôi nhớ tên sách, câu trích dẫn hay hoặc thông tin nghe được qua lời kể chính xác hơn nhiều người.",
  },
  {
    id: "mi_26",
    order: 26,
    category: "LOGICAL_MATHEMATICAL",
    statement: "Khi gặp sự cố kỹ thuật hoặc dự án bị lỗi, tôi thích từng bước khoanh vùng giả thuyết để tìm nguyên nhân gốc.",
  },
  {
    id: "mi_27",
    order: 27,
    category: "VISUAL_SPATIAL",
    statement: "Tôi thích chụp ảnh, chỉnh sửa hình ảnh, quay dựng video hoặc vẽ sơ đồ minh họa khi học tập.",
  },
  {
    id: "mi_28",
    order: 28,
    category: "MUSICAL",
    statement: "Tôi có thể nhận biết được nhiều loại nhạc cụ hoặc giọng hát hòa âm trong cùng một bản thu.",
  },
  {
    id: "mi_29",
    order: 29,
    category: "BODILY_KINESTHETIC",
    statement: "Khi giải thích một điều gì đó cho người khác, tôi thường dùng nhiều cử chỉ tay và minh họa trực quan.",
  },
  {
    id: "mi_30",
    order: 30,
    category: "INTERPERSONAL",
    statement: "Tôi biết cách điều chỉnh cách giao tiếp cho phù hợp với từng kiểu người khác nhau trong tập thể.",
  },

  // Chặng 4 (31..40)
  {
    id: "mi_31",
    order: 31,
    category: "INTRAPERSONAL",
    statement: "Tôi thích các bài tập tự nghiên cứu độc lập, nơi tôi được tự chủ tốc độ và chiều sâu khám phá.",
  },
  {
    id: "mi_32",
    order: 32,
    category: "NATURALIST",
    statement: "Tôi quan tâm đến tác động của tiêu dùng xanh, tái chế, năng lượng sạch và phát triển bền vững.",
  },
  {
    id: "mi_33",
    order: 33,
    category: "LINGUISTIC",
    statement: "Khi học một khái niệm khó, tôi thích đọc nhiều nguồn giải thích khác nhau và tự viết lại bằng câu chữ của mình.",
  },
  {
    id: "mi_34",
    order: 34,
    category: "LOGICAL_MATHEMATICAL",
    statement: "Tôi thấy thoải mái khi làm việc với các công thức, mô hình toán học, xác suất hoặc ngôn ngữ truy vấn.",
  },
  {
    id: "mi_35",
    order: 35,
    category: "VISUAL_SPATIAL",
    statement: "Tôi dễ nhận ra một giao diện app/website bị lệch hàng, rối mắt hoặc thiếu nhất quán về màu sắc.",
  },
  {
    id: "mi_36",
    order: 36,
    category: "MUSICAL",
    statement: "Tôi thấy việc nghe podcast, tài liệu âm thanh hoặc đọc thành tiếng theo nhịp giúp tôi tập trung tốt hơn.",
  },
  {
    id: "mi_37",
    order: 37,
    category: "BODILY_KINESTHETIC",
    statement: "Tôi thích các chuyến đi thực địa, hội thảo workshop thực hành hoặc tự lắp ráp thiết bị mới.",
  },
  {
    id: "mi_38",
    order: 38,
    category: "INTERPERSONAL",
    statement: "Tôi thường chủ động khích lệ tinh thần và kết nối các thành viên rụt rè cùng tham gia đóng góp ý kiến.",
  },
  {
    id: "mi_39",
    order: 39,
    category: "INTRAPERSONAL",
    statement: "Tôi thường viết nhật ký, ghi chú phản tư hoặc lập kế hoạch phát triển cá nhân theo từng học kỳ.",
  },
  {
    id: "mi_40",
    order: 40,
    category: "NATURALIST",
    statement: "Tôi hứng thú tìm hiểu cách các yếu tố tự nhiên, khí hậu hoặc tài nguyên ảnh hưởng đến đời sống và kinh tế.",
  },
];

