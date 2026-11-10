import {
  UserRole,
  AccountStatus,
  OpportunityCategoryId,
  OpportunityStatus,
  ApplicationStatusId,
  BookingStatusId,
} from "@/constants";

// ==============================================================================
// 1. User & Profile
// ==============================================================================

export interface IUser {
  _id: string;
  name: string;
  email: string;
  password?: string;
  role: UserRole;
  avatar?: string;
  status: AccountStatus;
  emailVerified?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface IDevelopmentGoals {
  studyAbroad?: boolean;
  employment?: boolean;
  scientificResearch?: boolean;
  startup?: boolean;
  personalGrowth?: boolean;
  notes?: string;
}

export interface IStudentProfile {
  _id: string;
  userId: string;
  fullName: string;
  avatar?: string;
  university?: string;
  major?: string;
  academicYear?: string;
  bio?: string;
  developmentGoals: IDevelopmentGoals;
  skills: string[];
  achievements: string[];
  createdAt: Date;
  updatedAt: Date;
}

// ==============================================================================
// 2. Opportunities (Explore & Search)
// ==============================================================================

export interface IOpportunity {
  _id: string;
  title: string;
  description: string;
  category: OpportunityCategoryId;
  eligibility?: string;
  requirements?: string;
  benefits?: string;
  applicationInstructions?: string;
  openingDate?: Date;
  deadline?: Date | null;
  location?: string;
  isDomestic: boolean;
  sourceName?: string;
  sourceUrl?: string;
  verificationDate?: Date;
  status: OpportunityStatus;
  isSponsored: boolean;
  version: number; // Concurrency check (optimistic locking)
  updatedByAdminId?: string;
  createdAt: Date;
  updatedAt: Date;
}

// ==============================================================================
// 3. Saved Opportunities & Applications Tracking
// ==============================================================================

export interface ISavedOpportunity {
  _id: string;
  studentId: string;
  opportunityId: string | IOpportunity;
  createdAt: Date;
}

export interface IApplicationHistoryItem {
  status: ApplicationStatusId;
  updatedAt: Date;
  note?: string;
}

export interface IApplicationRecord {
  _id: string;
  studentId: string;
  opportunityId: string | IOpportunity;
  status: ApplicationStatusId;
  notes?: string;
  history: IApplicationHistoryItem[];
  createdAt: Date;
  updatedAt: Date;
}

// ==============================================================================
// 4. Calendar & Deadlines
// ==============================================================================

export interface ICalendarEntry {
  _id: string;
  studentId: string;
  opportunityId: string | IOpportunity;
  deadline?: Date | null;
  isActive: boolean;
  remindersSent: number[]; // e.g. [7, 3, 1] offset days already notified
  createdAt: Date;
  updatedAt: Date;
}

// ==============================================================================
// 5. Personal Roadmap
// ==============================================================================

export interface IRoadmapTask {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  dueDate?: Date;
}

export interface IRoadmapMilestone {
  id: string;
  title: string;
  tasks: IRoadmapTask[];
}

export interface IRoadmapSemester {
  semesterNumber: number; // 1 or 2
  milestones: IRoadmapMilestone[];
}

export interface IRoadmapYear {
  yearNumber: number; // 1, 2, 3, 4, ...
  semesters: IRoadmapSemester[];
}

export interface IRoadmap {
  _id: string;
  studentId: string;
  status: "ACTIVE" | "ARCHIVED";
  templateId?: string;
  goalSnapshot: IDevelopmentGoals;
  progressPercent: number;
  years: IRoadmapYear[];
  createdAt: Date;
  updatedAt: Date;
}

export interface IRoadmapTemplate {
  _id: string;
  title: string;
  direction: string;
  description: string;
  structure: IRoadmapYear[];
  isActive: boolean;
  createdByAdminId: string;
  createdAt: Date;
  updatedAt: Date;
}

// ==============================================================================
// 6. Mentor Connection
// ==============================================================================

export interface IMentorProfile {
  _id: string;
  name: string;
  avatar?: string;
  position: string;
  organization: string;
  expertise: string[];
  experience: string;
  bio: string;
  topics: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IBookingRequest {
  _id: string;
  studentId: string;
  mentorId: string | IMentorProfile;
  topic: string;
  preferredTime: string;
  message: string;
  status: BookingStatusId;
  adminResponse?: string;
  processedByAdminId?: string;
  createdAt: Date;
  updatedAt: Date;
}

// ==============================================================================
// 7. Notifications
// ==============================================================================

export type NotificationType = "DEADLINE_REMINDER" | "BOOKING_UPDATE" | "ROADMAP_UPDATE" | "SYSTEM_ANNOUNCEMENT";
export type NotificationChannel = "IN_APP" | "EMAIL";
export type EmailDeliveryStatus = "PENDING" | "SENT" | "FAILED";

export interface INotification {
  _id: string;
  recipientId: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
  isRead: boolean;
  channel: NotificationChannel;
  emailDeliveryStatus?: EmailDeliveryStatus;
  opportunityId?: string;
  reminderOffsetDays?: number;
  createdAt: Date;
}

// ==============================================================================
// 8. Onboarding Quiz & Career Orientation
// ==============================================================================

export interface IQuizOption {
  id: string;
  text: string;
  scores: Record<string, number>; // Direction scores
}

export interface IQuizQuestion {
  id: string;
  question: string;
  category: string;
  options: IQuizOption[];
}

export interface IQuizResult {
  _id: string;
  studentId: string;
  answers: Record<string, string>;
  recommendedDirections: {
    direction: string;
    score: number;
    description: string;
  }[];
  createdAt: Date;
}
