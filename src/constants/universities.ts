export interface UniversityItem {
  code: string;
  name: string;
  shortName: string;
  city: string;
  aliases?: string[];
}

export const PRESET_UNIVERSITIES: UniversityItem[] = [
  // ĐHQGHN & Các trường thành viên (Ưu tiên hiển thị)
  {
    code: "ULIS-VNU",
    name: "Trường Đại học Ngoại ngữ - ĐHQGHN",
    shortName: "ULIS - ĐHQGHN",
    city: "Hà Nội",
    aliases: ["ulis", "ngoai ngu", "vnu", "dhqghn"],
  },
  {
    code: "UET-VNU",
    name: "Trường Đại học Công nghệ - ĐHQGHN",
    shortName: "UET - ĐHQGHN",
    city: "Hà Nội",
    aliases: ["uet", "cong nghe", "vnu"],
  },
  {
    code: "UEB-VNU",
    name: "Trường Đại học Kinh tế - ĐHQGHN",
    shortName: "UEB - ĐHQGHN",
    city: "Hà Nội",
    aliases: ["ueb", "kinh te", "vnu"],
  },
  {
    code: "USSH-VNU",
    name: "Trường Đại học Khoa học Xã hội và Nhân văn - ĐHQGHN",
    shortName: "USSH - ĐHQGHN",
    city: "Hà Nội",
    aliases: ["ussh", "nhan van", "xhnv", "vnu"],
  },
  {
    code: "HUS-VNU",
    name: "Trường Đại học Khoa học Tự nhiên - ĐHQGHN",
    shortName: "HUS - ĐHQGHN",
    city: "Hà Nội",
    aliases: ["hus", "tu nhien", "khtn", "vnu"],
  },
  {
    code: "UED-VNU",
    name: "Trường Đại học Giáo dục - ĐHQGHN",
    shortName: "UED - ĐHQGHN",
    city: "Hà Nội",
    aliases: ["ued", "giao duc", "vnu"],
  },
  {
    code: "UMP-VNU",
    name: "Trường Đại học Y Dược - ĐHQGHN",
    shortName: "UMP - ĐHQGHN",
    city: "Hà Nội",
    aliases: ["ump", "y duoc", "vnu"],
  },
  {
    code: "UL-VNU",
    name: "Trường Đại học Luật - ĐHQGHN",
    shortName: "UL - ĐHQGHN",
    city: "Hà Nội",
    aliases: ["ul", "luat", "vnu"],
  },
  {
    code: "VJU-VNU",
    name: "Trường Đại học Việt Nhật - ĐHQGHN",
    shortName: "VJU - ĐHQGHN",
    city: "Hà Nội",
    aliases: ["vju", "viet nhat", "vnu"],
  },
  {
    code: "IS-VNU",
    name: "Trường Quốc tế - ĐHQGHN",
    shortName: "VNU-IS",
    city: "Hà Nội",
    aliases: ["is", "quoc te", "vnu"],
  },

  // Miền Bắc
  {
    code: "HUST",
    name: "Đại học Bách khoa Hà Nội",
    shortName: "HUST",
    city: "Hà Nội",
    aliases: ["bach khoa", "hust", "bkhn"],
  },
  {
    code: "NEU",
    name: "Đại học Kinh tế Quốc dân",
    shortName: "NEU",
    city: "Hà Nội",
    aliases: ["neu", "ktqd", "kinh te quoc dan"],
  },
  {
    code: "FTU",
    name: "Trường Đại học Ngoại thương",
    shortName: "FTU",
    city: "Hà Nội",
    aliases: ["ftu", "ngoai thuong"],
  },
  {
    code: "PTIT",
    name: "Học viện Công nghệ Bưu chính Viễn thông",
    shortName: "PTIT",
    city: "Hà Nội",
    aliases: ["ptit", "buu chinh vien thong"],
  },
  {
    code: "AOF",
    name: "Học viện Tài chính",
    shortName: "HVTC",
    city: "Hà Nội",
    aliases: ["hvtc", "aof", "tai chinh"],
  },
  {
    code: "BA",
    name: "Học viện Ngân hàng",
    shortName: "HVNH",
    city: "Hà Nội",
    aliases: ["hvnh", "ngan hang", "ba"],
  },
  {
    code: "TMU",
    name: "Trường Đại học Thương mại",
    shortName: "TMU",
    city: "Hà Nội",
    aliases: ["tmu", "thuong mai"],
  },
  {
    code: "DAV",
    name: "Học viện Ngoại giao",
    shortName: "DAV",
    city: "Hà Nội",
    aliases: ["dav", "hvng", "ngoai giao"],
  },
  {
    code: "HANU",
    name: "Trường Đại học Hà Nội",
    shortName: "HANU",
    city: "Hà Nội",
    aliases: ["hanu", "dh ha noi"],
  },
  {
    code: "AJC",
    name: "Học viện Báo chí và Tuyên truyền",
    shortName: "AJC",
    city: "Hà Nội",
    aliases: ["ajc", "bao chi", "tuyen truyen"],
  },
  {
    code: "HNUE",
    name: "Trường Đại học Sư phạm Hà Nội",
    shortName: "HNUE",
    city: "Hà Nội",
    aliases: ["hnue", "su pham", "sphn"],
  },
  {
    code: "HLU",
    name: "Trường Đại học Luật Hà Nội",
    shortName: "HLU",
    city: "Hà Nội",
    aliases: ["hlu", "luat ha noi"],
  },
  {
    code: "HMU",
    name: "Trường Đại học Y Hà Nội",
    shortName: "HMU",
    city: "Hà Nội",
    aliases: ["hmu", "y ha noi"],
  },
  {
    code: "HUP",
    name: "Trường Đại học Dược Hà Nội",
    shortName: "HUP",
    city: "Hà Nội",
    aliases: ["hup", "duoc ha noi"],
  },
  {
    code: "HUCE",
    name: "Trường Đại học Xây dựng Hà Nội",
    shortName: "HUCE",
    city: "Hà Nội",
    aliases: ["huce", "nuce", "xay dung"],
  },
  {
    code: "UTC",
    name: "Trường Đại học Giao thông Vận tải",
    shortName: "UTC",
    city: "Hà Nội",
    aliases: ["utc", "gtvt", "giao thong van tai"],
  },
  {
    code: "HAUI",
    name: "Trường Đại học Công nghiệp Hà Nội",
    shortName: "HaUI",
    city: "Hà Nội",
    aliases: ["haui", "cong nghiep ha noi"],
  },
  {
    code: "KMA",
    name: "Học viện Kỹ thuật Mật mã",
    shortName: "ACTVN / KMA",
    city: "Hà Nội",
    aliases: ["kma", "actvn", "mat ma"],
  },
  {
    code: "FPT-HN",
    name: "Trường Đại học FPT",
    shortName: "FPTU",
    city: "Toàn quốc",
    aliases: ["fpt", "fptu"],
  },
  {
    code: "VINUNI",
    name: "Trường Đại học VinUni",
    shortName: "VinUni",
    city: "Hà Nội",
    aliases: ["vinuni", "vin"],
  },
  {
    code: "RMIT",
    name: "Đại học RMIT Việt Nam",
    shortName: "RMIT",
    city: "Toàn quốc",
    aliases: ["rmit"],
  },
  {
    code: "BUV",
    name: "Trường Đại học Anh Quốc Việt Nam",
    shortName: "BUV",
    city: "Hà Nội / Hưng Yên",
    aliases: ["buv", "anh quoc"],
  },
  {
    code: "PHENIKAA",
    name: "Trường Đại học Phenikaa",
    shortName: "Phenikaa",
    city: "Hà Nội",
    aliases: ["phenikaa"],
  },
  {
    code: "TLU",
    name: "Trường Đại học Thăng Long",
    shortName: "TLU",
    city: "Hà Nội",
    aliases: ["thang long", "tlu"],
  },

  // Miền Trung
  {
    code: "DUT-UDN",
    name: "Trường Đại học Bách khoa - Đại học Đà Nẵng",
    shortName: "DUT - ĐHĐN",
    city: "Đà Nẵng",
    aliases: ["dut", "bach khoa da nang", "udn"],
  },
  {
    code: "DUE-UDN",
    name: "Trường Đại học Kinh tế - Đại học Đà Nẵng",
    shortName: "DUE - ĐHĐN",
    city: "Đà Nẵng",
    aliases: ["due", "kinh te da nang", "udn"],
  },
  {
    code: "UFL-UDN",
    name: "Trường Đại học Ngoại ngữ - Đại học Đà Nẵng",
    shortName: "UFL - ĐHĐN",
    city: "Đà Nẵng",
    aliases: ["ufl", "ngoai ngu da nang", "udn"],
  },
  {
    code: "HU",
    name: "Đại học Huế",
    shortName: "HU",
    city: "Thừa Thiên Huế",
    aliases: ["hue", "dh hue"],
  },

  // Miền Nam
  {
    code: "HCMUT-VNUHCM",
    name: "Trường Đại học Bách khoa - ĐHQG TP.HCM",
    shortName: "HCMUT - ĐHQG HCM",
    city: "TP.HCM",
    aliases: ["hcmut", "bach khoa hcm", "bk hcm"],
  },
  {
    code: "HCMUS-VNUHCM",
    name: "Trường Đại học Khoa học Tự nhiên - ĐHQG TP.HCM",
    shortName: "HCMUS - ĐHQG HCM",
    city: "TP.HCM",
    aliases: ["hcmus", "khtn hcm"],
  },
  {
    code: "UIT-VNUHCM",
    name: "Trường Đại học Công nghệ Thông tin - ĐHQG TP.HCM",
    shortName: "UIT - ĐHQG HCM",
    city: "TP.HCM",
    aliases: ["uit", "cntt hcm"],
  },
  {
    code: "HCMUSSH-VNUHCM",
    name: "Trường Đại học Khoa học Xã hội và Nhân văn - ĐHQG TP.HCM",
    shortName: "HCMUSSH - ĐHQG HCM",
    city: "TP.HCM",
    aliases: ["hcmussh", "nhan van hcm"],
  },
  {
    code: "UEL-VNUHCM",
    name: "Trường Đại học Kinh tế - Luật - ĐHQG TP.HCM",
    shortName: "UEL - ĐHQG HCM",
    city: "TP.HCM",
    aliases: ["uel", "kinh te luat"],
  },
  {
    code: "IU-VNUHCM",
    name: "Trường Đại học Quốc tế - ĐHQG TP.HCM",
    shortName: "HCMIU - ĐHQG HCM",
    city: "TP.HCM",
    aliases: ["hcmiu", "quoc te hcm"],
  },
  {
    code: "UEH",
    name: "Đại học Kinh tế TP. Hồ Chí Minh",
    shortName: "UEH",
    city: "TP.HCM",
    aliases: ["ueh", "kinh te hcm"],
  },
  {
    code: "FTU2",
    name: "Trường Đại học Ngoại thương - Cơ sở II TP.HCM",
    shortName: "FTU2",
    city: "TP.HCM",
    aliases: ["ftu2", "ngoai thuong hcm"],
  },
  {
    code: "TDTU",
    name: "Trường Đại học Tôn Đức Thắng",
    shortName: "TDTU",
    city: "TP.HCM",
    aliases: ["tdtu", "ton duc thang"],
  },
  {
    code: "UEF",
    name: "Trường Đại học Kinh tế - Tài chính TP.HCM",
    shortName: "UEF",
    city: "TP.HCM",
    aliases: ["uef"],
  },
  {
    code: "HCMUE",
    name: "Trường Đại học Sư phạm TP. Hồ Chí Minh",
    shortName: "HCMUE",
    city: "TP.HCM",
    aliases: ["hcmue", "su pham hcm"],
  },
  {
    code: "HCMLAW",
    name: "Trường Đại học Luật TP. Hồ Chí Minh",
    shortName: "ULAW",
    city: "TP.HCM",
    aliases: ["ulaw", "luat hcm"],
  },
  {
    code: "UMP-HCM",
    name: "Trường Đại học Y Dược TP. Hồ Chí Minh",
    shortName: "UMP TP.HCM",
    city: "TP.HCM",
    aliases: ["ump hcm", "y duoc hcm"],
  },
  {
    code: "SGU",
    name: "Trường Đại học Sài Gòn",
    shortName: "SGU",
    city: "TP.HCM",
    aliases: ["sgu", "sai gon"],
  },
  {
    code: "IUH",
    name: "Trường Đại học Công nghiệp TP.HCM",
    shortName: "IUH",
    city: "TP.HCM",
    aliases: ["iuh", "cong nghiep hcm"],
  },
  {
    code: "CTU",
    name: "Trường Đại học Cần Thơ",
    shortName: "CTU",
    city: "Cần Thơ",
    aliases: ["ctu", "can tho"],
  },

  // Khác (giữ option chuẩn hóa phòng trường hợp sinh viên học trường khác ngoài danh sách)
  {
    code: "OTHER",
    name: "Trường Đại học / Học viện khác",
    shortName: "Trường khác",
    city: "Khác",
    aliases: ["khac", "other"],
  },
];

export const PRESET_UNIVERSITY_NAMES = new Set(PRESET_UNIVERSITIES.map((u) => u.name));

export function isPresetUniversity(name: string): boolean {
  return PRESET_UNIVERSITY_NAMES.has(name.trim());
}

export function filterUniversities(query: string): UniversityItem[] {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return PRESET_UNIVERSITIES;

  return PRESET_UNIVERSITIES.filter((uni) => {
    const haystack = [uni.name, uni.shortName, uni.code, uni.city, ...(uni.aliases ?? [])]
      .join(" ")
      .toLowerCase();
    return haystack.includes(normalized);
  });
}

