# Cụm Tính Năng 02: Quản Lý Hồ Sơ Sinh Viên (Student Profile Management)

> **Mã Module:** `PROFILE`  
> **Căn cứ SRS:** Mục 4.2 (FR-PRO-01 đến FR-PRO-06)  
> **Tác nhân:** Sinh viên (Student), Quản trị viên (Admin)  
> **Mục tiêu:** Cung cấp hồ sơ cá nhân hóa 360 độ gồm thông tin học vấn, mục tiêu nghề nghiệp, kỹ năng và thành tích để làm cơ sở tạo Lộ trình phát triển và hồ sơ CV.

---

## 1. Tổng Quan Nghiệp Vụ Cụm Tính Năng

Hồ sơ sinh viên là trung tâm dữ liệu cá nhân của người học tại UNERA:
1. **Thông tin nhân khẩu học & Học vấn:** Họ tên, avatar, trường đại học (`university`), chuyên ngành (`major`), năm học (`academicYear`: Năm 1 đến Năm 5+), tiểu sử ngắn.
2. **Mục tiêu phát triển (Development Goals):** 5 nhóm mục tiêu trọng tâm:
   - Du học & Học bổng quốc tế (`studyAbroad`)
   - Việc làm doanh nghiệp / Tập đoàn (`employment`)
   - Nghiên cứu khoa học (`scientificResearch`)
   - Khởi nghiệp & Đổi mới sáng tạo (`startup`)
   - Phát triển kỹ năng cá nhân (`personalGrowth`)
   - Ghi chú định hướng chi tiết (`notes`)
3. **Mối quan hệ liên kết sống (Dynamic Interconnection):**
   - **Khi sinh viên cập nhật mục tiêu phát triển:** Hệ thống tự động kích hoạt tính toán và sinh lại Lộ trình mới ngay lập tức (FR-RM-08).
4. **Bảo mật sở hữu dữ liệu (Profile Ownership - FR-PRO-06):** Sinh viên chỉ có thể xem và sửa hồ sơ của chính mình. Nghiêm cấm mọi hành vi truy cập chéo giữa các sinh viên.

---

## 2. Mô Hình Dữ Liệu `student_profiles`

Tham chiếu [`src/models/StudentProfile.ts`](file:///c:/Users/AD/OneDrive/Desktop/Project/ULIS_DMST_2026/src/models/StudentProfile.ts):

```typescript
interface IStudentProfile {
  _id: ObjectId;
  userId: string;              // Liên kết sang collection users (Unique Index)
  fullName: string;            // Họ và tên
  avatar?: string;             // Ảnh đại diện
  university?: string;         // Tên trường đại học
  major?: string;              // Chuyên ngành đào tạo
  academicYear?: string;       // YEAR_1, YEAR_2, YEAR_3, YEAR_4, YEAR_5_PLUS
  bio?: string;                // Giới thiệu bản thân (tối đa 500 ký tự)
  developmentGoals: {
    studyAbroad: boolean;
    employment: boolean;
    scientificResearch: boolean;
    startup: boolean;
    personalGrowth: boolean;
    notes?: string;
  };
  skills: string[];            // Danh sách kỹ năng (ví dụ: IELTS 7.5, Python, Figma)
  achievements: string[];      // Danh sách giải thưởng, thành tích
  createdAt: Date;
  updatedAt: Date;
}
```

---

## 3. Danh Mục Các Tính Năng Chi Tiết Trong Cụm

| Mã Tính Năng | Tên Tính Năng | File Đặc Tả Chi Tiết |
|---|---|---|
| **FR-PRO-01** | Thông tin cá nhân & Học vấn sinh viên | [`FR-PRO-01_PERSONAL_INFO.md`](./FR-PRO-01_PERSONAL_INFO.md) |
| **FR-PRO-02** | Quản lý mục tiêu phát triển (Kích hoạt Lộ trình) | [`FR-PRO-02_DEVELOPMENT_GOALS.md`](./FR-PRO-02_DEVELOPMENT_GOALS.md) |
| **FR-PRO-03 & 04** | Kỹ năng & Bảng thành tích sinh viên | [`FR-PRO-03_04_SKILLS_ACHIEVEMENTS.md`](./FR-PRO-03_04_SKILLS_ACHIEVEMENTS.md) |
| **FR-PRO-05 & 06** | Tổng quan hồ sơ & Bảo vệ quyền sở hữu dữ liệu | [`FR-PRO-05_06_PROFILE_OWNERSHIP.md`](./FR-PRO-05_06_PROFILE_OWNERSHIP.md) |
