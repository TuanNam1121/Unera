import { z } from "zod";
import { OPPORTUNITY_CATEGORIES, OPPORTUNITY_STATUS, APPLICATION_STATUS, BOOKING_STATUS } from "@/constants";

// 1. Auth Validations
export const registerSchema = z.object({
  name: z.string().min(2, "Họ và tên phải có ít nhất 2 ký tự"),
  email: z.string().email("Địa chỉ email không hợp lệ"),
  password: z.string().min(6, "Mật khẩu phải có ít nhất 6 ký tự"),
});

export const loginSchema = z.object({
  email: z.string().email("Địa chỉ email không hợp lệ"),
  password: z.string().min(1, "Vui lòng nhập mật khẩu"),
});

// 2. Profile Validations
export const updateProfileSchema = z.object({
  fullName: z.string().min(2, "Họ và tên không được để trống").optional(),
  university: z.string().optional(),
  major: z.string().optional(),
  academicYear: z.string().optional(),
  bio: z.string().max(500, "Giới thiệu tối đa 500 ký tự").optional(),
  skills: z.array(z.string()).optional(),
  achievements: z.array(z.string()).optional(),
});

export const updateGoalsSchema = z.object({
  studyAbroad: z.boolean().optional(),
  employment: z.boolean().optional(),
  scientificResearch: z.boolean().optional(),
  startup: z.boolean().optional(),
  personalGrowth: z.boolean().optional(),
  notes: z.string().max(1000).optional(),
});

// 3. Opportunity Validations
const categoryKeys = Object.values(OPPORTUNITY_CATEGORIES).map((c) => c.id) as [string, ...string[]];
const statusKeys = Object.values(OPPORTUNITY_STATUS) as [string, ...string[]];

export const createOpportunitySchema = z.object({
  title: z.string().min(5, "Tiêu đề cơ hội phải có ít nhất 5 ký tự"),
  description: z.string().min(10, "Mô tả cơ hội phải có ít nhất 10 ký tự"),
  category: z.enum(categoryKeys, {
    message: "Danh mục không hợp lệ",
  }),
  eligibility: z.string().optional(),
  requirements: z.string().optional(),
  benefits: z.string().optional(),
  applicationInstructions: z.string().optional(),
  openingDate: z.coerce.date().optional(),
  deadline: z.coerce.date().nullable().optional(),
  location: z.string().optional(),
  isDomestic: z.boolean().default(true),
  sourceName: z.string().optional(),
  sourceUrl: z.string().url("URL nguồn không hợp lệ").optional().or(z.literal("")),
  status: z.enum(statusKeys).default("DRAFT"),
  isSponsored: z.boolean().default(false),
});

export const updateOpportunitySchema = createOpportunitySchema.partial().extend({
  version: z.number({
    message: "Yêu cầu cung cấp phiên bản dữ liệu (version) để kiểm tra xung đột",
  }),
});

// 4. Calendar Validation
export const addToCalendarSchema = z.object({
  opportunityId: z.string().min(1, "Opportunity ID không được để trống"),
});

// 5. Application Tracking Validation
export const updateApplicationSchema = z.object({
  status: z.enum(Object.keys(APPLICATION_STATUS) as [string, ...string[]]),
  notes: z.string().max(2000).optional(),
});

// 6. Mentor Booking Validation
export const createBookingRequestSchema = z.object({
  mentorId: z.string().min(1, "Vui lòng chọn Mentor"),
  topic: z.string().min(5, "Vui lòng ghi rõ chủ đề cần tư vấn (tối thiểu 5 ký tự)"),
  preferredTime: z.string().min(5, "Vui lòng cung cấp khung thời gian phù hợp"),
  message: z.string().min(10, "Vui lòng giới thiệu và đặt câu hỏi cụ thể cho Mentor"),
});

export const updateBookingStatusSchema = z.object({
  status: z.enum(Object.keys(BOOKING_STATUS) as [string, ...string[]]),
  adminResponse: z.string().optional(),
});
