/**
 * Bộ dữ liệu chuẩn Trắc nghiệm Tính cách MBTI (`TOOL-01`)
 * - 4 cặp trục: E/I, S/N, T/F, J/P
 * - 40 câu hỏi cân bằng (10 câu / cặp trục) theo ngữ cảnh sinh viên đại học
 * - 16 hồ sơ tính cách MBTI chi tiết bằng Tiếng Việt
 */

export type MbtiAxis = "EI" | "SN" | "TF" | "JP";
export type MbtiPole = "E" | "I" | "S" | "N" | "T" | "F" | "J" | "P";

export type MbtiCode =
  | "ISTJ"
  | "ISFJ"
  | "INFJ"
  | "INTJ"
  | "ISTP"
  | "ISFP"
  | "INFP"
  | "INTP"
  | "ESTP"
  | "ESFP"
  | "ENFP"
  | "ENTP"
  | "ESTJ"
  | "ESFJ"
  | "ENFJ"
  | "ENTJ";

export interface MbtiAxisMeta {
  axis: MbtiAxis;
  leftPole: MbtiPole;
  rightPole: MbtiPole;
  leftLabel: string;
  rightLabel: string;
  title: string;
  /** Quy ước ưu tiên rõ ràng nếu hòa 50% - 50% */
  tieBreakerPole: MbtiPole;
  tieBreakerNote: string;
}

export interface MbtiQuestion {
  id: string;
  order: number;
  axis: MbtiAxis;
  prompt: string;
  optionA: {
    label: string;
    pole: MbtiPole;
  };
  optionB: {
    label: string;
    pole: MbtiPole;
  };
}

export interface MbtiTypeProfile {
  code: MbtiCode;
  nameVi: string;
  nickname: string;
  group:
    | "Nhóm Phân tích (Analysts)"
    | "Nhóm Ngoại giao (Diplomats)"
    | "Nhóm Bảo vệ (Sentinels)"
    | "Nhóm Khám phá (Explorers)";
  badgeTone: string;
  tagline: string;
  summary: string;
  strengths: string[];
  watchouts: string[];
  idealEnvironment: string;
  suitableCareers: string[];
}

export const MBTI_AXIS_META: Record<MbtiAxis, MbtiAxisMeta> = {
  EI: {
    axis: "EI",
    leftPole: "E",
    rightPole: "I",
    leftLabel: "Hướng ngoại (E)",
    rightLabel: "Hướng nội (I)",
    title: "Nguồn năng lượng & Tương tác",
    tieBreakerPole: "I",
    tieBreakerNote: "Nếu hòa 50% - 50%, hệ thống tạm nghiêng về I (Hướng nội linh hoạt).",
  },
  SN: {
    axis: "SN",
    leftPole: "S",
    rightPole: "N",
    leftLabel: "Giác quan (S)",
    rightLabel: "Trực giác (N)",
    title: "Cách tiếp nhận thông tin",
    tieBreakerPole: "N",
    tieBreakerNote: "Nếu hòa 50% - 50%, hệ thống tạm nghiêng về N (Trực giác mở rộng).",
  },
  TF: {
    axis: "TF",
    leftPole: "T",
    rightPole: "F",
    leftLabel: "Lý trí (T)",
    rightLabel: "Cảm xúc (F)",
    title: "Cách đưa ra quyết định",
    tieBreakerPole: "T",
    tieBreakerNote: "Nếu hòa 50% - 50%, hệ thống tạm nghiêng về T (Phân tích cân bằng).",
  },
  JP: {
    axis: "JP",
    leftPole: "J",
    rightPole: "P",
    leftLabel: "Nguyên tắc (J)",
    rightLabel: "Linh hoạt (P)",
    title: "Phong cách tổ chức công việc",
    tieBreakerPole: "J",
    tieBreakerNote: "Nếu hòa 50% - 50%, hệ thống tạm nghiêng về J (Chủ động kế hoạch).",
  },
};

export const MBTI_AXIS_ORDER: MbtiAxis[] = ["EI", "SN", "TF", "JP"];

export const MBTI_QUESTIONS: MbtiQuestion[] = [
  // Chặng 1 (1..10)
  {
    id: "mbti_01",
    order: 1,
    axis: "EI",
    prompt: "Sau một tuần thi cử hoặc chạy deadline căng thẳng, bạn thường nạp lại năng lượng bằng cách nào?",
    optionA: { label: "Đi cà phê, tụ tập hoặc tham gia hoạt động sôi nổi cùng bạn bè", pole: "E" },
    optionB: { label: "Ở một mình trong không gian yên tĩnh, nghe nhạc, đọc sách hoặc nghỉ ngơi", pole: "I" },
  },
  {
    id: "mbti_02",
    order: 2,
    axis: "SN",
    prompt: "Khi bắt đầu học một môn chuyên ngành mới, bạn hứng thú hơn với điều gì?",
    optionA: { label: "Ý tưởng tổng thể, bức tranh lớn và các giả thuyết mở rộng đằng sau", pole: "N" },
    optionB: { label: "Ví dụ thực tế, số liệu cụ thể và quy trình áp dụng từng bước", pole: "S" },
  },
  {
    id: "mbti_03",
    order: 3,
    axis: "TF",
    prompt: "Khi trong nhóm học tập xảy ra bất đồng về cách làm bài thuyết trình, bạn ưu tiên điều gì?",
    optionA: { label: "Đánh giá phương án nào hợp logic, hiệu quả và thuyết phục nhất dựa trên tiêu chí", pole: "T" },
    optionB: { label: "Lắng nghe cảm nhận của các thành viên để giữ hòa khí và sự đồng thuận", pole: "F" },
  },
  {
    id: "mbti_04",
    order: 4,
    axis: "JP",
    prompt: "Khi giảng viên giao bài tập lớn có hạn nộp sau 3 tuần, bạn thường xử lý thế nào?",
    optionA: { label: "Lên lịch chia nhỏ các mốc việc ngay từ tuần đầu và bám sát tiến độ", pole: "J" },
    optionB: { label: "Thu thập ý tưởng từ từ, làm bứt tốc mạnh nhất khi thấy cảm hứng hoặc gần hạn", pole: "P" },
  },
  {
    id: "mbti_05",
    order: 5,
    axis: "EI",
    prompt: "Trong một buổi workshop hoặc câu lạc bộ sinh viên có nhiều người lạ, bạn thường:",
    optionA: { label: "Chủ động bắt chuyện, làm quen và mở rộng mạng lưới kết nối", pole: "E" },
    optionB: { label: "Quan sát trước, trò chuyện sâu với 1–2 người ngồi cạnh hoặc quen sẵn", pole: "I" },
  },
  {
    id: "mbti_06",
    order: 6,
    axis: "SN",
    prompt: "Bạn tin tưởng nguồn thông tin nào hơn khi phân tích một vấn đề?",
    optionA: { label: "Kinh nghiệm đã kiểm chứng, dữ kiện thực tế và chi tiết quan sát được", pole: "S" },
    optionB: { label: "Trực giác, mô hình ẩn sau dữ liệu và khả năng phát triển trong tương lai", pole: "N" },
  },
  {
    id: "mbti_07",
    order: 7,
    axis: "TF",
    prompt: "Nếu một người bạn thân hỏi góp ý về bản CV hoặc bài luận chưa tốt, bạn sẽ:",
    optionA: { label: "Động viên tinh thần bạn ấy trước rồi mới góp ý thật nhẹ nhàng, khéo léo", pole: "F" },
    optionB: { label: "Chỉ thẳng các điểm chưa đạt và sửa trực tiếp để bài đạt chuẩn cao nhất", pole: "T" },
  },
  {
    id: "mbti_08",
    order: 8,
    axis: "JP",
    prompt: "Bàn học và thư mục tài liệu học tập của bạn thường trông như thế nào?",
    optionA: { label: "Thay đổi linh hoạt theo hứng thú hiện tại, miễn mình nhớ chỗ tìm là được", pole: "P" },
    optionB: { label: "Được phân loại thư mục, đặt tên rõ ràng và sắp xếp gọn gàng", pole: "J" },
  },
  {
    id: "mbti_09",
    order: 9,
    axis: "EI",
    prompt: "Khi nảy ra một ý tưởng hay cho dự án cá nhân hoặc nghiên cứu khoa học, bạn muốn:",
    optionA: { label: "Suy nghĩ kỹ trong đầu, phác thảo chắc chắn rồi mới chia sẻ", pole: "I" },
    optionB: { label: "Nói ra ngay với bạn bè hoặc mentor để thảo luận và bật thêm ý mới", pole: "E" },
  },
  {
    id: "mbti_10",
    order: 10,
    axis: "SN",
    prompt: "Khi đọc hướng dẫn thực tập hoặc thể lệ cuộc thi, bạn thường chú ý điều gì trước?",
    optionA: { label: "Đọc kỹ từng điều kiện, mốc thời gian, định dạng hồ sơ yêu cầu", pole: "S" },
    optionB: { label: "Nắm tinh thần cốt lõi rồi nghĩ cách làm khác biệt, sáng tạo hơn", pole: "N" },
  },

  // Chặng 2 (11..20)
  {
    id: "mbti_11",
    order: 11,
    axis: "TF",
    prompt: "Điều gì khiến bạn hài lòng hơn khi nhận một lời khen?",
    optionA: { label: "Được công nhận năng lực sắc bén, tính chính xác và hiệu quả công việc", pole: "T" },
    optionB: { label: "Được trân trọng vì sự tận tâm, thấu hiểu và giá trị bạn mang lại cho người khác", pole: "F" },
  },
  {
    id: "mbti_12",
    order: 12,
    axis: "JP",
    prompt: "Khi lên kế hoạch cho một chuyến đi thực tế hoặc du lịch cùng lớp, bạn thích:",
    optionA: { label: "Chốt lịch trình, điểm đến và chi phí dự kiến rõ ràng từ trước", pole: "J" },
    optionB: { label: "Giữ khung cơ bản và sẵn sàng đổi lịch nếu gặp trải nghiệm thú vị bất ngờ", pole: "P" },
  },
  {
    id: "mbti_13",
    order: 13,
    axis: "EI",
    prompt: "Trong lớp học thảo luận nhóm, bạn thường đóng vai trò nào?",
    optionA: { label: "Người khuấy động thảo luận, nêu ý kiến liên tục để thúc đẩy nhịp độ", pole: "E" },
    optionB: { label: "Người lắng nghe các luồng ý kiến rồi tổng hợp lại điểm mấu chốt", pole: "I" },
  },
  {
    id: "mbti_14",
    order: 14,
    axis: "SN",
    prompt: "Nếu được chọn giữa 2 đề tài tiểu luận, bạn nghiêng về đề tài nào hơn?",
    optionA: { label: "Khám phá một mô hình mới mẻ, liên ngành chưa có nhiều tài liệu đi trước", pole: "N" },
    optionB: { label: "Nghiên cứu ứng dụng thực tiễn với quy trình rõ ràng, số liệu sẵn có", pole: "S" },
  },
  {
    id: "mbti_15",
    order: 15,
    axis: "TF",
    prompt: "Khi chọn ngành nghề hoặc công việc thực tập sắp tới, yếu tố nào nặng ký hơn với bạn?",
    optionA: { label: "Sự phù hợp với giá trị sống, ý nghĩa nhân văn và văn hóa gắn kết", pole: "F" },
    optionB: { label: "Cơ hội phát triển năng lực chuyên môn, lộ trình thăng tiến và mức đãi ngộ", pole: "T" },
  },
  {
    id: "mbti_16",
    order: 16,
    axis: "JP",
    prompt: "Bạn cảm thấy thế nào khi một kế hoạch đã chốt bất ngờ thay đổi phút chót?",
    optionA: { label: "Hơi khó chịu vì mất sự chủ động và phải sắp xếp lại toàn bộ lịch", pole: "J" },
    optionB: { label: "Khá bình thường, nhanh chóng thích nghi và tìm phương án thay thế", pole: "P" },
  },
  {
    id: "mbti_17",
    order: 17,
    axis: "EI",
    prompt: "Bạn thích làm việc theo mô hình nào hơn trong kỳ thực tập đầu tiên?",
    optionA: { label: "Làm độc lập hoặc phối hợp chặt trong nhóm nhỏ 2–3 người", pole: "I" },
    optionB: { label: "Môi trường mở, trao đổi liên tục với nhiều phòng ban và khách hàng", pole: "E" },
  },
  {
    id: "mbti_18",
    order: 18,
    axis: "SN",
    prompt: "Khi kể lại một sự kiện vừa tham gia, bạn có xu hướng mô tả thế nào?",
    optionA: { label: "Kể tuần tự những gì thực tế đã diễn ra, chi tiết ai nói gì, làm gì", pole: "S" },
    optionB: { label: "Nhấn mạnh ý nghĩa, cảm nhận tổng thể hoặc liên hệ tới điều thú vị khác", pole: "N" },
  },
  {
    id: "mbti_19",
    order: 19,
    axis: "TF",
    prompt: "Khi đưa ra một quyết định khó khăn liên quan đến đội nhóm, bạn thường:",
    optionA: { label: "Ưu tiên sự công bằng khách quan theo đúng nguyên tắc đã thống nhất", pole: "T" },
    optionB: { label: "Cân nhắc hoàn cảnh riêng của từng người để có cách xử lý thấu tình", pole: "F" },
  },
  {
    id: "mbti_20",
    order: 20,
    axis: "JP",
    prompt: "Trong danh sách việc cần làm hàng ngày (To-do list), bạn thường:",
    optionA: { label: "Thấy thư thái hơn khi giữ các lựa chọn mở, làm việc theo mức ưu tiên linh hoạt", pole: "P" },
    optionB: { label: "Thấy nhẹ nhõm nhất khi gạch xong hết các đầu việc đã ghi ra từ sáng", pole: "J" },
  },

  // Chặng 3 (21..30)
  {
    id: "mbti_21",
    order: 21,
    axis: "EI",
    prompt: "Khi gặp một bài toán hoặc bug hóc búa, phản xạ đầu tiên của bạn là:",
    optionA: { label: "Hỏi hoặc trao đổi nhanh với đồng đội để vừa nói vừa tìm hướng giải", pole: "E" },
    optionB: { label: "Tự tra cứu, đào sâu suy nghĩ trước một mình cho đến khi thật sự bí mới hỏi", pole: "I" },
  },
  {
    id: "mbti_22",
    order: 22,
    axis: "SN",
    prompt: "Bạn đánh giá cao phẩm chất nào hơn ở một người cố vấn (Mentor)?",
    optionA: { label: "Tầm nhìn xa, truyền cảm hứng bằng những góc nhìn đột phá", pole: "N" },
    optionB: { label: "Kinh nghiệm thực chiến, hướng dẫn sát sao từng bước cụ thể", pole: "S" },
  },
  {
    id: "mbti_23",
    order: 23,
    axis: "TF",
    prompt: "Trong một cuộc tranh luận về chủ đề xã hội, phong cách của bạn giống bên nào hơn?",
    optionA: { label: "Phân tích lỗ hổng lập luận, dẫn chứng dữ liệu để bảo vệ quan điểm", pole: "T" },
    optionB: { label: "Tìm điểm chung, hiểu góc nhìn phía sau câu chuyện của người đối diện", pole: "F" },
  },
  {
    id: "mbti_24",
    order: 24,
    axis: "JP",
    prompt: "Trước khi đưa ra quyết định chọn học phần hoặc tham gia CLB, bạn thích:",
    optionA: { label: "Chốt dứt khoát sớm để yên tâm tập trung vào những việc khác", pole: "J" },
    optionB: { label: "Tìm hiểu thêm nhiều lựa chọn đến sát hạn đăng ký mới quyết định", pole: "P" },
  },
  {
    id: "mbti_25",
    order: 25,
    axis: "EI",
    prompt: "Số lượng mối quan hệ xã hội khiến bạn cảm thấy thoải mái nhất là:",
    optionA: { label: "Mạng lưới rộng rãi, quen biết nhiều bạn ở nhiều khoa và CLB khác nhau", pole: "E" },
    optionB: { label: "Một vòng tròn nhỏ bạn bè thật sự thân thiết và hiểu sâu về nhau", pole: "I" },
  },
  {
    id: "mbti_26",
    order: 26,
    axis: "SN",
    prompt: "Khi xem một sản phẩm ứng dụng hoặc thiết kế slide mới, bạn để ý gì trước?",
    optionA: { label: "Bố cục, lỗi chính tả, căn lề và tính tiện dụng ở từng nút bấm", pole: "S" },
    optionB: { label: "Ý tưởng concept chủ đạo và tiềm năng tạo khác biệt của sản phẩm", pole: "N" },
  },
  {
    id: "mbti_27",
    order: 27,
    axis: "TF",
    prompt: "Người khác thường mô tả phong cách ra quyết định của bạn là:",
    optionA: { label: "Tình cảm, tinh tế và dễ tạo sự tin cậy", pole: "F" },
    optionB: { label: "Lý trí, dứt khoát và nhìn thẳng vào trọng tâm", pole: "T" },
  },
  {
    id: "mbti_28",
    order: 28,
    axis: "JP",
    prompt: "Nếu đang làm dở một nhiệm vụ mà nảy sinh ý tưởng mới hấp dẫn hơn, bạn thường:",
    optionA: { label: "Ghi chú ý tưởng lại đó, hoàn thành dứt điểm việc đang làm rồi mới chuyển", pole: "J" },
    optionB: { label: "Thử nghiệm nhanh ý tưởng mới ngay xem có hướng nào đột phá hơn không", pole: "P" },
  },
  {
    id: "mbti_29",
    order: 29,
    axis: "EI",
    prompt: "Khi có thời gian rảnh giữa hai tiết học ở trường, bạn hay làm gì hơn?",
    optionA: { label: "Tìm một góc thư viện, đeo tai nghe lướt tài liệu hoặc nghỉ ngơi yên tĩnh", pole: "I" },
    optionB: { label: "Rủ bạn ra hành lang/căng tin nói chuyện phiếm hoặc tham gia sinh hoạt CLB", pole: "E" },
  },
  {
    id: "mbti_30",
    order: 30,
    axis: "SN",
    prompt: "Câu nói nào mô tả đúng hơn về tư duy của bạn?",
    optionA: { label: "Thực tế là nền tảng — hãy bắt đầu từ những gì nắm chắc trong tay", pole: "S" },
    optionB: { label: "Trí tưởng tượng mở ra tương lai — luôn có cách làm mới mẻ hơn", pole: "N" },
  },

  // Chặng 4 (31..40)
  {
    id: "mbti_31",
    order: 31,
    axis: "TF",
    prompt: "Điều gì dễ khiến bạn mất kiên nhẫn nhất khi làm việc nhóm?",
    optionA: { label: "Quyết định cảm tính thiếu căn cứ logic và tranh luận vòng vo", pole: "T" },
    optionB: { label: "Không khí căng thẳng, chỉ trích gay gắt thiếu sự tôn trọng lẫn nhau", pole: "F" },
  },
  {
    id: "mbti_32",
    order: 32,
    axis: "JP",
    prompt: "Cách bạn chuẩn bị cho kỳ thi cuối kỳ thường là:",
    optionA: { label: "Lập bảng kế hoạch ôn tập từng chương trước ngày thi ít nhất 2 tuần", pole: "J" },
    optionB: { label: "Ôn theo mạch hứng thú và tổng hợp kiến thức tập trung ở giai đoạn nước rút", pole: "P" },
  },
  {
    id: "mbti_33",
    order: 33,
    axis: "EI",
    prompt: "Trong giao tiếp qua tin nhắn hoặc email công việc, bạn thường:",
    optionA: { label: "Thích gọi điện hoặc gặp trao đổi trực tiếp 5 phút cho nhanh và rõ", pole: "E" },
    optionB: { label: "Thích nhắn tin hoặc gửi email rành mạch để có thời gian suy nghĩ câu chữ", pole: "I" },
  },
  {
    id: "mbti_34",
    order: 34,
    axis: "SN",
    prompt: "Khi đọc một cuốn sách hoặc tài liệu học thuật, bạn thích lối viết nào?",
    optionA: { label: "Nhiều ẩn dụ, khái niệm trừu tượng gợi mở suy ngẫm sâu", pole: "N" },
    optionB: { label: "Rõ ràng, đi thẳng vào định nghĩa, ví dụ minh họa cụ thể", pole: "S" },
  },
  {
    id: "mbti_35",
    order: 35,
    axis: "TF",
    prompt: "Bạn thấy mình tự nhiên hơn khi phải:",
    optionA: { label: "An ủi, lắng nghe tâm sự của một người bạn đang gặp bế tắc", pole: "F" },
    optionB: { label: "Giúp bạn ấy phân tích nguyên nhân gốc rễ và vạch giải pháp cụ thể", pole: "T" },
  },
  {
    id: "mbti_36",
    order: 36,
    axis: "JP",
    prompt: "Bạn phản ứng ra sao với các quy định và deadline cứng?",
    optionA: { label: "Thấy chúng giúp mọi thứ có cấu trúc rõ ràng và dễ dự đoán", pole: "J" },
    optionB: { label: "Thấy hơi gò bó nếu không có không gian tự do điều chỉnh cách làm", pole: "P" },
  },
  {
    id: "mbti_37",
    order: 37,
    axis: "EI",
    prompt: "Nếu phải thuyết trình trước hội trường 200 sinh viên, cảm giác nổi trội của bạn là:",
    optionA: { label: "Hào hứng khi được đứng trước đám đông chia sẻ và tương tác", pole: "E" },
    optionB: { label: "Làm tốt nếu chuẩn bị kỹ, nhưng xong xuôi sẽ thấy khá tiêu hao năng lượng", pole: "I" },
  },
  {
    id: "mbti_38",
    order: 38,
    axis: "SN",
    prompt: "Bạn thường dành nhiều sự chú ý hơn cho:",
    optionA: { label: "Hiện tại — làm thật tốt công việc trước mắt hôm nay", pole: "S" },
    optionB: { label: "Tương lai — 2–5 năm tới mình và xu hướng ngành sẽ đi về đâu", pole: "N" },
  },
  {
    id: "mbti_39",
    order: 39,
    axis: "TF",
    prompt: "Từ nào phản ánh đúng giá trị cốt lõi của bạn hơn?",
    optionA: { label: "Hiệu quả & Công minh", pole: "T" },
    optionB: { label: "Thấu cảm & Gắn kết", pole: "F" },
  },
  {
    id: "mbti_40",
    order: 40,
    axis: "JP",
    prompt: "Cuối tuần không có lịch cố định trước khiến bạn cảm thấy thế nào?",
    optionA: { label: "Tuyệt vời! Tha hồ tùy hứng làm điều mình thích lúc đó", pole: "P" },
    optionB: { label: "Hơi thiếu định hướng, vẫn muốn phác qua vài việc dự định hoàn thành", pole: "J" },
  },
];

export const MBTI_PROFILES: Record<MbtiCode, MbtiTypeProfile> = {
  INTJ: {
    code: "INTJ",
    nameVi: "Nhà Kiến Tạo Chiến Lược",
    nickname: "The Architect",
    group: "Nhóm Phân tích (Analysts)",
    badgeTone: "bg-indigo-50 text-indigo-700 border-indigo-200",
    tagline: "Tư duy hệ thống, độc lập và định hướng mục tiêu dài hạn sắc bén.",
    summary:
      "Sinh viên nhóm INTJ nổi bật với khả năng nhìn xuyên thấu cấu trúc vấn đề, tự đặt tiêu chuẩn cao và kiên trì theo đuổi tầm nhìn lớn. Bạn học nhanh nhất khi nắm được nguyên lý nền tảng thay vì học vẹt.",
    strengths: [
      "Lập chiến lược dài hạn và phân tích hệ thống phức tạp",
      "Tự chủ cao trong tự học, nghiên cứu và giải quyết vấn đề độc lập",
      "Giữ cái đầu lạnh khi xử lý khủng hoảng hoặc dữ liệu đa chiều",
      "Luôn tìm cách tối ưu hóa quy trình thay vì làm theo lối mòn",
    ],
    watchouts: [
      "Đôi khi quá khắt khe với bản thân và tiêu chuẩn của đồng đội",
      "Dễ bỏ qua yếu tố cảm xúc khi phản hồi trực diện",
      "Cần rèn luyện giao tiếp mềm mỏng để thuyết phục các bên liên quan",
    ],
    idealEnvironment:
      "Môi trường đề cao năng lực thực chất, tự chủ cao, có bài toán hóc búa và lộ trình phát triển chuyên môn rõ ràng.",
    suitableCareers: [
      "Kiến trúc sư Hệ thống / Software Engineer",
      "Chuyên viên Phân tích Dữ liệu (Data Analyst / BI)",
      "Quản lý Sản phẩm (Product Manager)",
      "Tư vấn Chiến lược & Quản trị Doanh nghiệp",
      "Nghiên cứu viên Khoa học / R&D",
      "Phân tích Tài chính Đầu tư",
    ],
  },
  INTP: {
    code: "INTP",
    nameVi: "Nhà Tư Duy Logic",
    nickname: "The Logician",
    group: "Nhóm Phân tích (Analysts)",
    badgeTone: "bg-indigo-50 text-indigo-700 border-indigo-200",
    tagline: "Tò mò trí tuệ không giới hạn, yêu thích mô hình lý thuyết và bản chất sự việc.",
    summary:
      "Bạn bị cuốn hút bởi câu hỏi 'Tại sao lại vận hành như vậy?'. Sinh viên INTP thường xuất sắc ở khả năng phân tích khái niệm trừu tượng, phát hiện mâu thuẫn logic và sáng tạo giải pháp mới.",
    strengths: [
      "Tư duy phản biện mạnh mẽ và khả năng khái quát hóa xuất sắc",
      "Linh hoạt tiếp thu công nghệ, phương pháp nghiên cứu mới",
      "Khách quan, không bị cảm xúc chi phối khi đánh giá giả thuyết",
      "Giỏi tìm hướng giải độc đáo cho các bài toán chưa có tiền lệ",
    ],
    watchouts: [
      "Dễ sa vào phân tích quá lâu mà chậm bắt tay triển khai",
      "Đôi khi bỏ dở dự án khi phần thú vị cốt lõi đã được giải xong",
      "Cần chú ý bám sát deadline và quy chuẩn trình bày hình thức",
    ],
    idealEnvironment:
      "Không gian học thuật hoặc công nghệ cởi mở, ít thủ tục rườm rà, cho phép thử nghiệm ý tưởng mới.",
    suitableCareers: [
      "Kỹ sư AI / Machine Learning",
      "Nhà nghiên cứu Khoa học / Giảng viên",
      "Phát triển Phần mềm & Kiến trúc Dữ liệu",
      "Kinh tế lượng & Phân tích Chính sách",
      "Thiết kế Game / Hệ thống Tương tác",
      "An ninh mạng (Cybersecurity)",
    ],
  },
  ENTJ: {
    code: "ENTJ",
    nameVi: "Nhà Lãnh Đạo Quyết Đoán",
    nickname: "The Commander",
    group: "Nhóm Phân tích (Analysts)",
    badgeTone: "bg-indigo-50 text-indigo-700 border-indigo-200",
    tagline: "Quyết liệt, nhìn xa trông rộng và có khả năng điều phối đội ngũ đạt mục tiêu lớn.",
    summary:
      "Sinh viên ENTJ thường tự nhiên bước lên vị trí nhóm trưởng trong các dự án lớn, cuộc thi kinh doanh hoặc ban chủ nhiệm CLB. Bạn nhìn ra tiềm năng tổ chức và biến ý tưởng thành kế hoạch hành động cụ thể.",
    strengths: [
      "Khả năng lãnh đạo, phân công và tạo động lực thực thi rõ ràng",
      "Ra quyết định nhanh gọn, tự tin dưới áp lực cao",
      "Giao tiếp thuyết phục, định hướng kết quả rõ rệt",
      "Tham vọng tích cực và tinh thần cải tiến liên tục",
    ],
    watchouts: [
      "Có thể vô tình áp đặt nhịp độ nhanh khiến thành viên khác áp lực",
      "Cần dành thời gian lắng nghe cảm nhận của người ít nói trong nhóm",
      "Dễ quá tải nếu ôm đồm quá nhiều dự án cùng lúc",
    ],
    idealEnvironment:
      "Môi trường năng động, cạnh tranh lành mạnh, có mục tiêu tăng trưởng rõ ràng và trao quyền dẫn dắt.",
    suitableCareers: [
      "Quản trị viên Tập sự (Management Trainee)",
      "Quản lý Dự án / Product Owner",
      "Tư vấn Quản trị & M&A",
      "Khởi nghiệp / Điều hành Doanh nghiệp",
      "Trưởng phòng Kinh doanh / Phát triển Thị trường",
      "Luật sư Doanh nghiệp",
    ],
  },
  ENTP: {
    code: "ENTP",
    nameVi: "Người Khởi Xướng Sáng Tạo",
    nickname: "The Debater",
    group: "Nhóm Phân tích (Analysts)",
    badgeTone: "bg-indigo-50 text-indigo-700 border-indigo-200",
    tagline: "Nhanh trí, thích tranh biện đa chiều và bùng nổ ý tưởng đột phá.",
    summary:
      "Bạn là 'cây sáng kiến' không ngừng đặt câu hỏi ngược để thách thức giới hạn cũ. Sinh viên ENTP tỏa sáng ở hackathon, case competition, truyền thông sáng tạo và các dự án khởi nghiệp giai đoạn 0→1.",
    strengths: [
      "Brainstorm ý tưởng nhanh, kết nối các lĩnh vực tưởng như không liên quan",
      "Tranh biện sắc sảo, thuyết trình lôi cuốn và ứng biến linh hoạt",
      "Không ngại thay đổi, thích nghi cực nhanh với xu hướng mới",
      "Lan tỏa năng lượng tò mò tích cực cho đội ngũ",
    ],
    watchouts: [
      "Dễ chán các công việc vận hành lặp lại hoặc tiểu tiết hành chính",
      "Thỉnh thoảng tranh luận quá hăng khiến người khác thấy bị thử thách",
      "Cần ghép đôi với người thiên về thực thi kỷ luật để đi đường dài",
    ],
    idealEnvironment:
      "Startup, agency sáng tạo, đội đổi mới sáng tạo hoặc môi trường đa dự án liên tục biến chuyển.",
    suitableCareers: [
      "Growth Marketing / Brand Strategist",
      "Chuyên viên Phát triển Kinh doanh (BD)",
      "Product Innovation / Startup Founder",
      "Nhà báo / Host Podcast & Truyền thông",
      "Tư vấn Giải pháp Công nghệ",
      "Luật sư Tranh tụng",
    ],
  },
  INFJ: {
    code: "INFJ",
    nameVi: "Người Dẫn Đường Thấu Cảm",
    nickname: "The Advocate",
    group: "Nhóm Ngoại giao (Diplomats)",
    badgeTone: "bg-emerald-50 text-emerald-700 border-emerald-200",
    tagline: "Sâu sắc, giàu lý tưởng nhân văn và có trực giác tinh tế về con người.",
    summary:
      "Sinh viên INFJ kết hợp giữa chiều sâu nội tâm, tầm nhìn có hệ thống và mong muốn đóng góp giá trị bền vững cho cộng đồng. Bạn thường là điểm tựa tinh thần âm thầm nhưng đáng tin cậy trong nhóm.",
    strengths: [
      "Thấu hiểu động lực và cảm xúc người khác rất nhạy bén",
      "Viết lách truyền cảm hứng, tổng hợp ý nghĩa sâu sắc",
      "Kiên trì theo đuổi mục tiêu gắn với giá trị đạo đức và giáo dục",
      "Làm việc có kế hoạch, chỉn chu và đáng tin cậy",
    ],
    watchouts: [
      "Dễ kiệt sức cảm xúc nếu gánh vấn đề của người khác quá nhiều",
      "Xu hướng cầu toàn dẫn đến ngại chia sẻ sản phẩm khi chưa thật ưng ý",
      "Cần học cách từ chối khéo léo để bảo vệ thời gian cá nhân",
    ],
    idealEnvironment:
      "Môi trường giàu tính nhân văn, gắn kết đội nhóm chân thành, cho phép vừa nghiên cứu sâu vừa giúp ích xã hội.",
    suitableCareers: [
      "Chuyên gia Tâm lý Học đường / Tham vấn",
      "Giảng viên / Thiết kế Chương trình Giáo dục",
      "UX Researcher / Product Designer",
      "Chuyên viên Phát triển Nhân tài (L&D / HRBP)",
      "Biên tập viên / Truyền thông Cộng đồng (NGO)",
      "Quản lý Dự án Phát triển Bền vững (ESG)",
    ],
  },
  INFP: {
    code: "INFP",
    nameVi: "Người Kể Chuyện Lý Tưởng",
    nickname: "The Mediator",
    group: "Nhóm Ngoại giao (Diplomats)",
    badgeTone: "bg-emerald-50 text-emerald-700 border-emerald-200",
    tagline: "Chân thành, giàu trí tưởng tượng và luôn tìm kiếm ý nghĩa đích thực trong công việc.",
    summary:
      "Sinh viên INFP sở hữu thế giới nội tâm phong phú, khả năng ngôn ngữ tinh tế và lòng trắc ẩn sâu sắc. Bạn làm việc tốt nhất khi được tự do thể hiện dấu ấn cá nhân trong các dự án có giá trị tinh thần.",
    strengths: [
      "Sáng tạo nội dung, kể chuyện (storytelling) và thẩm mỹ ngôn từ tốt",
      "Lắng nghe không phán xét, xây dựng niềm tin sâu với người xung quanh",
      "Tư duy mở, tôn trọng sự đa dạng văn hóa và góc nhìn cá nhân",
      "Động lực nội tại cực mạnh khi làm việc đúng đam mê",
    ],
    watchouts: [
      "Dễ bị chùn bước trước xung đột gay gắt hoặc phê bình khô khan",
      "Khó tập trung vào công việc nặng tính quy trình máy móc, thiếu ý nghĩa",
      "Cần công cụ quản lý thời gian để tránh trì hoãn các đầu việc thực tế",
    ],
    idealEnvironment:
      "Văn hóa tôn trọng cá tính, ít kiểm soát vi mô, đề cao tính sáng tạo, nghệ thuật hoặc phục vụ cộng đồng.",
    suitableCareers: [
      "Content Strategist / Copywriter",
      "Thiết kế Đồ họa / Minh họa & Sáng tạo",
      "Biên dịch / Phiên dịch Văn hóa – Giáo dục",
      "Chuyên viên Tâm lý & Công tác Xã hội",
      "UX Writer / Storytelling Marketing",
      "Giáo viên Ngôn ngữ / Văn học",
    ],
  },
  ENFJ: {
    code: "ENFJ",
    nameVi: "Người Truyền Cảm Hứng",
    nickname: "The Protagonist",
    group: "Nhóm Ngoại giao (Diplomats)",
    badgeTone: "bg-emerald-50 text-emerald-700 border-emerald-200",
    tagline: "Ấm áp, có sức hút tự nhiên và tài năng kết nối mọi người cùng tiến lên.",
    summary:
      "Sinh viên ENFJ thường là linh hồn của các câu lạc bộ, chiến dịch tình nguyện và nhóm học tập lớn. Bạn nhìn thấy điểm mạnh tiềm ẩn ở bạn bè và khéo léo khơi dậy tinh thần hợp tác.",
    strengths: [
      "Giao tiếp lôi cuốn, thuyết trình truyền cảm hứng trước đám đông",
      "Tổ chức con người, hòa giải mâu thuẫn và gắn kết tập thể",
      "Chủ động nhận trách nhiệm, luôn hướng đến lợi ích chung",
      "Nhạy bén với nhu cầu phát triển của từng thành viên",
    ],
    watchouts: [
      "Dễ đặt nhu cầu của người khác lên trên sức khỏe và mục tiêu riêng",
      "Nhạy cảm quá mức nếu cảm thấy nỗ lực của mình chưa được ghi nhận",
      "Cần rèn thêm kỹ năng ra quyết định cứng rắn khi cần thiết",
    ],
    idealEnvironment:
      "Tổ chức văn hóa cởi mở, đề cao làm việc nhóm, đào tạo, kết nối đối ngoại hoặc phát triển cộng đồng.",
    suitableCareers: [
      "Chuyên viên Đào tạo & Phát triển Nhân sự (L&D)",
      "Quan hệ Công chúng (PR) & Đối ngoại",
      "Điều phối Dự án Cộng đồng / NGO",
      "Cố vấn Học tập / Tuyển sinh Đại học",
      "Account Manager / Customer Success",
      "Quản trị Nhân sự (HR Manager)",
    ],
  },
  ENFP: {
    code: "ENFP",
    nameVi: "Người Khám Phá Nhiệt Huyết",
    nickname: "The Campaigner",
    group: "Nhóm Ngoại giao (Diplomats)",
    badgeTone: "bg-emerald-50 text-emerald-700 border-emerald-200",
    tagline: "Tràn đầy năng lượng tích cực, giàu sáng tạo và kết nối dễ dàng với mọi cá tính.",
    summary:
      "Bạn coi đại học là hành trình thử nghiệm vô vàn trải nghiệm thú vị: từ CLB, truyền thông, trao đổi quốc tế đến khởi nghiệp xã hội. Sinh viên ENFP nhanh nhạy với con người và luôn truyền lửa lạc quan.",
    strengths: [
      "Nhiệt huyết bùng nổ, khởi tạo ý tưởng mới và kết nối mạng lưới rộng",
      "Thích nghi nhanh với môi trường đa văn hóa, đa lĩnh vực",
      "Đồng cảm tốt, tạo không khí thoải mái và sáng tạo cho cả nhóm",
      "Kỹ năng thuyết phục và truyền thông đầy cảm xúc",
    ],
    watchouts: [
      "Dễ ôm quá nhiều hứng thú mới cùng lúc dẫn đến dàn trải",
      "Thường gặp khó với công việc kiểm tra số liệu chi tiết lặp đi lặp lại",
      "Cần checklist cụ thể để đưa ý tưởng về đích trọn vẹn đúng hạn",
    ],
    idealEnvironment:
      "Môi trường trẻ trung, linh hoạt, khuyến khích sáng tạo, tương tác con người và đổi mới liên tục.",
    suitableCareers: [
      "Creative Marketing / Social Media & Events",
      "Chuyên viên Tuyển dụng & Thương hiệu Nhà tuyển dụng",
      "Điều phối Giao lưu Quốc tế / Du học",
      "UX Designer / Product Marketing",
      "Biên tập Truyền hình / Content Creator",
      "Đào tạo Kỹ năng mềm & Coaching",
    ],
  },
  ISTJ: {
    code: "ISTJ",
    nameVi: "Người Gìn Giữ Trật Tự",
    nickname: "The Logistician",
    group: "Nhóm Bảo vệ (Sentinels)",
    badgeTone: "bg-sky-50 text-sky-700 border-sky-200",
    tagline: "Kỷ luật, cẩn trọng, chuẩn xác và luôn giữ trọn lời hứa đến phút cuối.",
    summary:
      "Sinh viên ISTJ là xương sống vững chắc của mọi nhóm dự án. Bạn làm việc dựa trên sự thật, quy trình chuẩn mực, hoàn thành xuất sắc phần việc đúng hạn và rất ít khi mắc sai sót chi tiết.",
    strengths: [
      "Tinh thần trách nhiệm cao, trung thực và đáng tin cậy tuyệt đối",
      "Quản lý thời gian, tài liệu và số liệu cực kỳ ngăn nắp",
      "Kiên nhẫn xử lý quy trình phức tạp đòi hỏi độ chính xác cao",
      "Học tốt từ kinh nghiệm thực tế và bài tập thực hành có cấu trúc",
    ],
    watchouts: [
      "Đôi khi quá thận trọng với các thay đổi đột ngột chưa có tiền lệ",
      "Dễ gánh thay phần việc của thành viên làm ẩu trong nhóm",
      "Cần cởi mở hơn với các cách tiếp cận thử nghiệm mới",
    ],
    idealEnvironment:
      "Tổ chức minh bạch, quy chuẩn rõ ràng, đánh giá công bằng dựa trên kết quả và cam kết thực tế.",
    suitableCareers: [
      "Kiểm toán & Kế toán Tài chính (Audit / Accounting)",
      "Chuyên viên Pháp chế & Tuân thủ (Compliance)",
      "Quản trị Chuỗi cung ứng & Logistics",
      "Kiểm thử Phần mềm (QA / QC Engineer)",
      "Quản lý Vận hành & Hành chính Chuyên nghiệp",
      "Phân tích Rủi ro Ngân hàng",
    ],
  },
  ISFJ: {
    code: "ISFJ",
    nameVi: "Người Bảo Trợ Tận Tâm",
    nickname: "The Defender",
    group: "Nhóm Bảo vệ (Sentinels)",
    badgeTone: "bg-sky-50 text-sky-700 border-sky-200",
    tagline: "Chu đáo, bền bỉ, tinh tế quan sát từng nhu cầu thực tế của mọi người.",
    summary:
      "Sinh viên ISFJ kết hợp sự chăm chỉ tỉ mỉ với tấm lòng tận tụy. Bạn nhớ rõ các chi tiết quan trọng của đồng đội, chuẩn bị chu toàn hậu cần và tạo ra bầu không khí ổn định, ấm áp cho tập thể.",
    strengths: [
      "Tận tâm, tỉ mỉ và ghi nhớ chi tiết thực tế rất chính xác",
      "Hỗ trợ người khác thiết thực, kiên nhẫn và đáng tin cậy",
      "Giữ cam kết cao, hoàn thành ổn định các nhiệm vụ dài hơi",
      "Xây dựng mối quan hệ bền vững dựa trên sự chân thành",
    ],
    watchouts: [
      "Thường ngại lên tiếng bảo vệ quyền lợi hoặc từ chối khi quá tải",
      "Dễ lo lắng quá mức khi môi trường xung quanh có nhiều biến động",
      "Cần tự tin hơn khi nhận sự ghi nhận cho thành quả của bản thân",
    ],
    idealEnvironment:
      "Môi trường ổn định, hợp tác thân thiện, ghi nhận sự đóng góp âm thầm và đề cao chất lượng chăm sóc.",
    suitableCareers: [
      "Chuyên viên Nhân sự C&B / Admin HR",
      "Chăm sóc Khách hàng Cao cấp / Account Support",
      "Giáo dục Tiểu học / Sư phạm & Thư viện",
      "Điều dưỡng / Quản lý Y tế & Sức khỏe Cộng đồng",
      "Kế toán Tổng hợp / Kiểm soát Nội bộ",
      "Điều phối Sự kiện & Học vụ",
    ],
  },
  ESTJ: {
    code: "ESTJ",
    nameVi: "Nhà Điều Hành Thực Tiễn",
    nickname: "The Executive",
    group: "Nhóm Bảo vệ (Sentinels)",
    badgeTone: "bg-sky-50 text-sky-700 border-sky-200",
    tagline: "Tổ chức xuất sắc, thực tế, thẳng thắn và thúc đẩy tiến độ cực kỳ hiệu quả.",
    summary:
      "Sinh viên ESTJ giỏi biến kế hoạch trên giấy thành lịch trình hành động rõ người, rõ việc, rõ thời hạn. Bạn coi trọng quy tắc chung, hiệu suất đo lường được và tinh thần làm thật ăn thật.",
    strengths: [
      "Điều phối công việc, quản lý ngân sách và nhân lực chuẩn xác",
      "Giao tiếp rõ ràng, dứt khoát, không nói vòng vo",
      "Giữ kỷ luật tập thể và đảm bảo tiến độ dự án luôn đúng hẹn",
      "Năng lực thực thi vững vàng ở các vai trò quản lý vận hành",
    ],
    watchouts: [
      "Có thể hơi cứng nhắc với những người có nhịp độ làm việc tùy hứng",
      "Cần chú ý sắc thái giọng điệu để không tạo cảm giác quá nghiêm khắc",
      "Nên dành không gian cho các thử nghiệm mới chưa chắc kết quả ngay",
    ],
    idealEnvironment:
      "Doanh nghiệp quy mô bài bản, có hệ thống KPI minh bạch, tôn trọng kỷ luật và cơ hội thăng tiến theo năng lực.",
    suitableCareers: [
      "Quản lý Vận hành / Project Coordinator",
      "Tài chính Ngân hàng & Tín dụng Doanh nghiệp",
      "Quản trị Chuỗi cung ứng & Thu mua",
      "Sales B2B / Quản lý Kinh doanh Khu vực",
      "Chuyên viên Hành chính Công / Quản lý Giáo dục",
      "Kiểm soát Chất lượng & Vận hành Hệ thống",
    ],
  },
  ESFJ: {
    code: "ESFJ",
    nameVi: "Người Kết Nối Chu Đáo",
    nickname: "The Consul",
    group: "Nhóm Bảo vệ (Sentinels)",
    badgeTone: "bg-sky-50 text-sky-700 border-sky-200",
    tagline: "Thân thiện, nhiệt tình tổ chức cộng đồng và luôn quan tâm đến trải nghiệm chung.",
    summary:
      "Sinh viên ESFJ rất có duyên gắn kết tập thể lớp, tổ chức các hoạt động ngoại khóa mượt mà và giúp thành viên mới hòa nhập nhanh chóng. Bạn nhạy bén với văn hóa giao tiếp và trách nhiệm xã hội.",
    strengths: [
      "Giao tiếp lịch thiệp, tạo dựng thiện cảm nhanh với đối tác và khách hàng",
      "Tổ chức sự kiện, hậu cần và chăm sóc trải nghiệm người tham gia tốt",
      "Phối hợp nhóm nhịp nhàng, duy trì tinh thần đoàn kết",
      "Kiên trì, có trách nhiệm với các chuẩn mực chung",
    ],
    watchouts: [
      "Quá bận tâm xem mọi người nghĩ gì dễ dẫn đến áp lực làm vừa lòng tất cả",
      "Ngại đối mặt trực diện với mâu thuẫn dù cần giải quyết dứt điểm",
      "Cần tách bạch góp ý công việc khỏi đánh giá giá trị cá nhân",
    ],
    idealEnvironment:
      "Môi trường cộng tác sôi nổi, tôn trọng truyền thống gắn kết và giao tiếp thường xuyên với con người.",
    suitableCareers: [
      "Quản lý Sự kiện (Event Management)",
      "Chuyên viên Quan hệ Khách hàng (Account / CRM)",
      "Nhân sự Tuyển dụng & Gắn kết Nội bộ",
      "Du lịch – Khách sạn & Dịch vụ Hàng không",
      "Giáo viên / Điều phối Chương trình Sinh viên",
      "Truyền thông Thương hiệu & Cộng đồng",
    ],
  },
  ISTP: {
    code: "ISTP",
    nameVi: "Kỹ Sư Thực Chiến",
    nickname: "The Virtuoso",
    group: "Nhóm Khám phá (Explorers)",
    badgeTone: "bg-amber-50 text-amber-700 border-amber-200",
    tagline: "Điềm tĩnh, thực hành nhanh nhạy và xuất sắc xử lý sự cố kỹ thuật tức thời.",
    summary:
      "Sinh viên ISTP học hiệu quả nhất qua việc 'bắt tay vào làm thật'. Bạn bình tĩnh trước các tình huống phát sinh bất ngờ, thích tháo rời cơ chế vận hành để hiểu tận gốc và tối ưu hiệu năng.",
    strengths: [
      "Xử lý sự cố thực tế nhanh chóng, bình tĩnh dưới áp lực khẩn cấp",
      "Nắm bắt công cụ, phần mềm, thiết bị kỹ thuật cực nhanh",
      "Tiết kiệm lời nói, tập trung thẳng vào hiệu quả hành động",
      "Tư duy thực dụng, không bị vướng bởi thủ tục rườm rà",
    ],
    watchouts: [
      "Dễ thấy chán với các bài giảng lý thuyết suông kéo dài",
      "Đôi khi giữ kín tiến độ khiến đồng đội khó theo dõi phối hợp",
      "Cần chú ý duy trì giao tiếp định kỳ và kế hoạch dài hạn hơn",
    ],
    idealEnvironment:
      "Công việc giàu tính thực hành, kỹ thuật, có thử thách xử lý tình huống trực tiếp và tôn trọng không gian riêng.",
    suitableCareers: [
      "Kỹ sư Phần mềm / DevOps & Hạ tầng Cloud",
      "Kỹ thuật Cơ khí / Tự động hóa & IoT",
      "Phân tích Dữ liệu Tài chính / Trading",
      "Quay dựng Video / Kỹ thuật Sản xuất Media",
      "Kỹ sư Bảo mật & Kiểm thử Hệ thống",
      "Thương mại Điện tử & Vận hành Kỹ thuật",
    ],
  },
  ISFP: {
    code: "ISFP",
    nameVi: "Nghệ Sĩ Tinh Tế",
    nickname: "The Adventurer",
    group: "Nhóm Khám phá (Explorers)",
    badgeTone: "bg-amber-50 text-amber-700 border-amber-200",
    tagline: "Nhạy cảm với cái đẹp, sống chân thực với hiện tại và khéo léo trong từng trải nghiệm.",
    summary:
      "Sinh viên ISFP sở hữu gu thẩm mỹ tự nhiên, sự dịu dàng tinh tế và tinh thần ham trải nghiệm thực tế. Bạn thể hiện cá tính qua sản phẩm trực quan, nghệ thuật, thiết kế hoặc chăm sóc tận tình.",
    strengths: [
      "Gu thẩm mỹ cao, nhạy bén màu sắc, bố cục và cảm xúc thị giác",
      "Linh hoạt, nhẹ nhàng, không áp đặt lên người khác",
      "Khéo tay và tinh tế khi tạo ra trải nghiệm sản phẩm thực tế",
      "Trung thành với giá trị cá nhân và chân thành trong hành động",
    ],
    watchouts: [
      "Ngại cạnh tranh gay gắt hoặc môi trường quá nhiều áp lực chính trị văn phòng",
      "Dễ ngại lập kế hoạch dài hạn quá chi tiết từ sớm",
      "Cần rèn luyện khả năng tự quảng bá thành quả và thuyết trình tự tin",
    ],
    idealEnvironment:
      "Không gian sáng tạo thoải mái, tôn trọng cá tính thẩm mỹ, có sản phẩm hữu hình để tự hào.",
    suitableCareers: [
      "UI/UX Designer & Thiết kế Đồ họa",
      "Nhiếp ảnh, Thời trang & Nghệ thuật Thị giác",
      "Biên tập Video / Creative Content",
      "Kiến trúc Nội thất & Trải nghiệm Không gian",
      "Chăm sóc Sức khỏe / Dinh dưỡng & Thẩm mỹ",
      "Thủ công Mỹ nghệ & Thương hiệu Phong cách sống",
    ],
  },
  ESTP: {
    code: "ESTP",
    nameVi: "Người Hành Động Nhanh Nhạy",
    nickname: "The Entrepreneur",
    group: "Nhóm Khám phá (Explorers)",
    badgeTone: "bg-amber-50 text-amber-700 border-amber-200",
    tagline: "Năng động, thực chiến sắc bén, đọc tình huống nhanh và dám nắm bắt cơ hội ngay.",
    summary:
      "Sinh viên ESTP là kiểu người 'thấy cơ hội là thử ngay'. Bạn sắc sảo trong thương lượng, xử lý tình huống trực tiếp trước khách hàng và tạo sức hút lôi cuốn trong các dự án kinh doanh thực chiến.",
    strengths: [
      "Nhanh nhạy nắm bắt cơ hội thị trường và hành vi thực tế của con người",
      "Đàm phán tự tin, xử lý tình huống bất ngờ cực kỳ linh hoạt",
      "Dám làm, dám chịu trách nhiệm, không sợ thử thách ngoài vùng an toàn",
      "Lan tỏa năng lượng sôi nổi, đẩy tiến độ hành động ngay lập tức",
    ],
    watchouts: [
      "Đôi khi quyết định quá nhanh trước khi kiểm tra đủ rủi ro dài hạn",
      "Khó kiên trì với giấy tờ hành chính dài dòng hay lý thuyết thuần túy",
      "Cần cân nhắc tác động dài hạn trước khi cam kết vội",
    ],
    idealEnvironment:
      "Môi trường tốc độ nhanh, hướng kết quả rõ rệt, nhiều tương tác thương lượng, thị trường và thực địa.",
    suitableCareers: [
      "Phát triển Kinh doanh (Business Development) & Sales",
      "Thương mại Điện tử / Vận hành Kinh doanh Số",
      "Quản lý Chuỗi Bán lẻ & F&B",
      "Tài chính Đầu tư / Môi giới Chứng khoán",
      "Tổ chức Sự kiện & Thể thao – Giải trí",
      "Khởi nghiệp Thương mại / Dịch vụ",
    ],
  },
  ESFP: {
    code: "ESFP",
    nameVi: "Ngôi Sao Truyền Năng Lượng",
    nickname: "The Entertainer",
    group: "Nhóm Khám phá (Explorers)",
    badgeTone: "bg-amber-50 text-amber-700 border-amber-200",
    tagline: "Hoạt bát, duyên dáng, kết nối mọi người bằng sự nhiệt thành và tinh thần lạc quan.",
    summary:
      "Sinh viên ESFP làm bừng sáng mọi căn phòng họ bước vào. Bạn học và làm tốt nhất khi có sự tương tác trực tiếp với con người, được biểu đạt sinh động và mang lại niềm vui thiết thực cho cộng đồng.",
    strengths: [
      "Giao tiếp tự nhiên, có duyên sân khấu và khả năng khuấy động không khí",
      "Quan sát nhanh tâm trạng thực tế của người đối diện",
      "Thẩm mỹ hiện đại, bắt kịp xu hướng truyền thông đại chúng",
      "Sẵn sàng giúp đỡ thực tế, khiến làm việc nhóm trở nên hào hứng",
    ],
    watchouts: [
      "Dễ bị phân tâm bởi quá nhiều hoạt động vui nhộn cùng lúc",
      "Thường né tránh công việc cô độc quá lâu hoặc phân tích bảng tính dày đặc",
      "Cần rèn thói quen quản lý tài chính cá nhân và bám sát lịch trình học tập",
    ],
    idealEnvironment:
      "Môi trường sôi động, gắn với truyền thông, dịch vụ, con người và sân khấu sáng tạo.",
    suitableCareers: [
      "MC / Host Sự kiện & Sáng tạo Nội dung Số (KOL / Creator)",
      "PR & Truyền thông Giải trí",
      "Quản trị Du lịch – Khách sạn & Lữ hành",
      "Tư vấn Dịch vụ & Trải nghiệm Khách hàng",
      "Nhân sự Tuyển dụng & Hoạt động Sinh viên",
      "Giảng dạy Tương tác / Huấn luyện Nghệ thuật",
    ],
  },
};

