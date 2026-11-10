/**
 * UNERA System Constants
 * Căn cứ theo SRS 1.0 và PROJECT_CONTEXT.md
 */

// Vai trò người dùng trong hệ thống
export const USER_ROLES = {
  STUDENT: "STUDENT",
  ADMIN: "ADMIN",
} as const;

export type UserRole = (typeof USER_ROLES)[keyof typeof USER_ROLES];

// Trạng thái tài khoản người dùng
export const ACCOUNT_STATUS = {
  ACTIVE: "ACTIVE",
  DISABLED: "DISABLED",
} as const;

export type AccountStatus = (typeof ACCOUNT_STATUS)[keyof typeof ACCOUNT_STATUS];

// Danh mục Cơ hội (Opportunity Categories - 7 danh mục theo FR-EXP-01)
export const OPPORTUNITY_CATEGORIES = {
  STUDY_ABROAD: {
    id: "study_abroad",
    label: "Học bổng & Du học",
    description: "Các học bổng chính phủ, học bổng trường và chương trình trao đổi sinh viên",
  },
  CAREER_DISCIPLINE: {
    id: "career_discipline",
    label: "Việc làm theo khối ngành",
    description: "Cơ hội việc làm chuyên môn, thực tập sinh phân theo ngành học",
  },
  MULTINATIONAL: {
    id: "multinational",
    label: "Tập đoàn đa quốc gia (MNC)",
    description: "Cơ hội tuyển dụng và thực tập tại các tập đoàn toàn cầu",
  },
  SCIENTIFIC_RESEARCH: {
    id: "scientific_research",
    label: "Nghiên cứu khoa học",
    description: "Đề tài nghiên cứu, hội thảo học thuật, bài báo khoa học sinh viên",
  },
  MANAGEMENT_TRAINEE: {
    id: "management_trainee",
    label: "Quản trị viên tập sự (MT)",
    description: "Các chương trình MT hàng đầu dành cho sinh viên xuất sắc",
  },
  COMPETITIONS: {
    id: "competitions",
    label: "Cuộc thi sinh viên",
    description: "Các cuộc thi học thuật, giải case, khởi nghiệp và đổi mới sáng tạo",
  },
  AMBASSADOR_PROGRAMS: {
    id: "ambassador_programs",
    label: "Chương trình Đại sứ sinh viên",
    description: "Cơ hội trở thành đại sứ thương hiệu, đại diện các tổ chức uy tín",
  },
} as const;

export type OpportunityCategoryId = (typeof OPPORTUNITY_CATEGORIES)[keyof typeof OPPORTUNITY_CATEGORIES]["id"];

// Trạng thái cơ hội (Opportunity Status)
export const OPPORTUNITY_STATUS = {
  DRAFT: "DRAFT",
  PUBLISHED: "PUBLISHED",
  CLOSED: "CLOSED",
  ARCHIVED: "ARCHIVED",
} as const;

export type OpportunityStatus = (typeof OPPORTUNITY_STATUS)[keyof typeof OPPORTUNITY_STATUS];

// Trạng thái ứng tuyển cá nhân (Application Tracking Status theo FR-APP-05)
export const APPLICATION_STATUS = {
  INTERESTED: { id: "INTERESTED", label: "Quan tâm", color: "blue" },
  PREPARING: { id: "PREPARING", label: "Đang chuẩn bị hồ sơ", color: "yellow" },
  APPLIED: { id: "APPLIED", label: "Đã nộp đơn", color: "purple" },
  INTERVIEWING: { id: "INTERVIEWING", label: "Đang phỏng vấn", color: "orange" },
  ACCEPTED: { id: "ACCEPTED", label: "Trúng tuyển / Được nhận", color: "green" },
  REJECTED: { id: "REJECTED", label: "Không trúng tuyển", color: "red" },
  WITHDRAWN: { id: "WITHDRAWN", label: "Rút hồ sơ", color: "gray" },
} as const;

export type ApplicationStatusId = keyof typeof APPLICATION_STATUS;

// Trạng thái yêu cầu đặt lịch Mentor (Booking Request Status theo FR-MEN-07)
export const BOOKING_STATUS = {
  PENDING: { id: "PENDING", label: "Chờ xử lý" },
  APPROVED: { id: "APPROVED", label: "Đã duyệt & Xác nhận" },
  REJECTED: { id: "REJECTED", label: "Từ chối" },
  CANCELLED: { id: "CANCELLED", label: "Đã hủy" },
  COMPLETED: { id: "COMPLETED", label: "Đã hoàn thành" },
} as const;

export type BookingStatusId = keyof typeof BOOKING_STATUS;

// Giới hạn tệp tin tải lên (File Upload Constraints theo SRS)
export const FILE_UPLOAD_CONFIG = {
  MAX_SIZE_BYTES: 10 * 1024 * 1024, // 10MB
  MAX_SIZE_MB: 10,
  ALLOWED_EXTENSIONS: ["pdf", "doc", "docx", "jpg", "jpeg", "png"],
  ALLOWED_MIME_TYPES: [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "image/jpeg",
    "image/png",
  ],
} as const;

// Khoảng thời gian nhắc hẹn hạn chót (Deadline reminder offsets theo FR-NOTI-10)
export const DEADLINE_REMINDER_OFFSETS_DAYS = [7, 3, 1] as const;

// Năm học của sinh viên
export const ACADEMIC_YEARS = [
  { value: "YEAR_1", label: "Năm nhất" },
  { value: "YEAR_2", label: "Năm hai" },
  { value: "YEAR_3", label: "Năm ba" },
  { value: "YEAR_4", label: "Năm tư" },
  { value: "YEAR_5_PLUS", label: "Năm 5 trở lên / Tốt nghiệp" },
] as const;

