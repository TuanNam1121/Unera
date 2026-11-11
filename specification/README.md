# UNERA — BẢN ĐỒ ĐẶC TẢ TÍNH NĂNG TOÀN DỰ ÁN (MASTER SPECIFICATION MAP)

> **Tài liệu chuẩn hóa:** Hệ thống hóa toàn bộ các tính năng đã hoàn thiện và các tính năng kế hoạch theo chuẩn SRS 1.0.  
> **Phiên bản:** 1.0 (Live Implementation & Future Roadmap)  
> **Cập nhật lần cuối:** 11/11/2026  
> **Mục đích:** Giúp Nhà phát triển, Quản trị viên và Đội ngũ sản phẩm nắm rõ 100% tình trạng triển khai, cách thức hoạt động thực tế của mã nguồn và các bước tiếp theo cần thực hiện.

---

## 1. Tóm Tắt Tình Trạng Triển Khai (Progress Overview)

| Tổng số Cụm tính năng SRS | Đã Hoàn Thành (Implemented) | Kế Hoạch / Tiếp Tục Hoàn Thiện (Planned) | Tỷ Lệ Hoàn Thành Cốt Lõi |
|:---:|:---:|:---:|:---:|
| **16 Cụm Tính Năng** | **10 Cụm (Hoàn chỉnh / Cốt lõi MVP)** | **6 Cụm (Mở rộng & Công cụ)** | **~75% Toàn Hệ Thống** |

```
[████████████████████████████████████████░░░░░░░░░░░░] 75% Hoàn thành
✓ Cụm 01: Authentication (100%)       ✓ Cụm 02: Student Profile (100%)
✓ Cụm 03: Onboarding Quiz (100%)      ✓ Cụm 04: Personal Roadmap (MVP)
✓ Cụm 05 & 06: Explore & Search (MVP) ✓ Cụm 07: Saved & Applications (Cơ bản)
✓ Cụm 08: Calendar & Deadlines (API)  ✓ Cụm 09: Notifications (Model/Bell)
✓ Cụm 10: Mentor Connection (Admin)   ✓ Cụm 13 & 14: News & Sponsored (100%)
✓ Cụm 15: Admin CMS & Audit (100%)    ⏳ Cụm 11, 12, 16: Kế hoạch triển khai
```

---

## 2. Ma Trận Theo Dõi Toàn Diện 16 Cụm Tính Năng (Master Feature Matrix)

| Mã Cụm | Tên Cụm Tính Năng (SRS) | Trạng Thái | Giao Diện (Routes) | Backend APIs | Models CSDL | Chi Tiết Đặc Tả |
|:---:|---|:---:|---|---|---|:---:|
| **01** | **Xác Thực & Quản Lý Tài Khoản** *(Authentication & Accounts)* | ![Hoàn thành](https://img.shields.io/badge/-HOÀN%20THÀNH%20100%25-emerald) | `/login`<br>`/register`<br>`/forgot-password`<br>`/reset-password` | `POST /api/auth/register`<br>`POST /api/auth/forgot-password`<br>`POST /api/auth/reset-password`<br>`GET /api/auth/me`<br>`DELETE /api/users/me` (403) | `User`<br>`PasswordResetToken`<br>`StudentProfile` | [`01_AUTHENTICATION.md`](./01_AUTHENTICATION.md) |
| **02** | **Hồ Sơ Cá Nhân Sinh Viên** *(Student Profile Management)* | ![Hoàn thành](https://img.shields.io/badge/-HOÀN%20THÀNH%20100%25-emerald) | `/profile` (4 tab: Học vấn, Mục tiêu, Kỹ năng, Thành tích) | `GET /api/profile`<br>`PUT /api/profile`<br>`PUT /api/profile/goals` | `StudentProfile` | [`02_STUDENT_PROFILE.md`](./02_STUDENT_PROFILE.md) |
| **03** | **Trắc Nghiệm Định Hướng** *(Onboarding Quiz & Orientation)* | ![Hoàn thành](https://img.shields.io/badge/-HOÀN%20THÀNH%20100%25-emerald) | `/onboarding` (Stepper + Nút Skip + Kết quả)<br>`/admin/quiz` (Admin CMS) | `GET /api/quiz`<br>`POST /api/quiz/submit`<br>`GET /api/admin/quiz/questions`<br>`POST /api/admin/quiz/questions`<br>`PATCH /api/admin/quiz/questions/[id]`<br>`DELETE /api/admin/quiz/questions/[id]` | `QuizQuestion`<br>`QuizResult` | [`03_ONBOARDING_QUIZ.md`](./03_ONBOARDING_QUIZ.md) |
| **04** | **Lộ Trình Cá Nhân Hóa** *(Personal Roadmap)* | ![Hoàn thành](https://img.shields.io/badge/-HOÀN%20THÀNH%20(MVP)-emerald) | `/roadmap` (4 năm / 8 kỳ / Milestones)<br>`/` (Widget HomeRoadmapCard) | `GET /api/roadmap`<br>`PATCH /api/roadmap`<br>`POST /api/roadmap` | `Roadmap`<br>`RoadmapTemplate` | [`04_PERSONAL_ROADMAP.md`](./04_PERSONAL_ROADMAP.md) |
| **05 & 06** | **Khám Phá Cơ Hội & Tìm Kiếm** *(Explore, Search & Filtering)* | ![Hoàn thành](https://img.shields.io/badge/-HOÀN%20THÀNH%20(MVP)-emerald) | `/explore`<br>`/admin/opportunities`<br>`/admin/opportunities/new` | `GET /api/opportunities`<br>`GET /api/opportunities/[id]`<br>`POST /api/admin/opportunities` | `Opportunity` | [`05_06_EXPLORE_AND_SEARCH.md`](./05_06_EXPLORE_AND_SEARCH.md) |
| **07** | **Cơ Hội Đã Lưu & Ứng Tuyển** *(Saved & Application Tracking)* | ![Cơ bản](https://img.shields.io/badge/-ĐÃ%20CÓ%20API%20%26%20MODEL-blue) | Nút Bookmark trên thẻ & chi tiết<br>*Kế hoạch:* `/applications` (Kanban) | `GET /api/saved`<br>`POST /api/saved`<br>`DELETE /api/saved` | `SavedOpportunity`<br>`Application` | [`07_SAVED_AND_APPLICATIONS.md`](./07_SAVED_AND_APPLICATIONS.md) |
| **08** | **Lịch & Theo Dõi Hạn Chót** *(Calendar & Deadline Tracking)* | ![Cơ bản](https://img.shields.io/badge/-ĐÃ%20CÓ%20API%20%26%20WIDGET-blue) | Widget Hạn sắp tới trên `/`<br>*Kế hoạch:* `/calendar` (Lịch tháng) | `GET /api/calendar`<br>`POST /api/calendar` | `CalendarEntry` | [`08_CALENDAR_AND_DEADLINES.md`](./08_CALENDAR_AND_DEADLINES.md) |
| **09** | **Hệ Thống Thông Báo** *(In-app & Email Notifications)* | ![Cơ bản](https://img.shields.io/badge/-ĐÃ%20CÓ%20MODEL%20%26%20BELL-blue) | Icon chuông Topbar<br>*Kế hoạch:* `/notifications` | Đã có schema lưu DB<br>*Kế hoạch:* API list & mark read | `Notification` | [`09_NOTIFICATIONS.md`](./09_NOTIFICATIONS.md) |
| **10** | **Kết Nối Cố Vấn (Mentor)** *(Mentor Connection & Booking)* | ![Cơ bản](https://img.shields.io/badge/-ĐÃ%20CÓ%20ADMIN%20CMS-blue) | `/admin/bookings` (Duyệt lịch + Meet)<br>*Kế hoạch:* `/mentors` (Sinh viên) | `GET /api/admin/bookings`<br>`PATCH /api/admin/bookings/[id]` | `MentorProfile`<br>`BookingRequest` | [`10_MENTOR_CONNECTION.md`](./10_MENTOR_CONNECTION.md) |
| **11** | **Bộ Công Cụ Sinh Viên** *(Student Tools - CV, Thuế, Lương)* | ![Kế hoạch](https://img.shields.io/badge/-KẾ%20HOẠCH-amber) | *Kế hoạch:* `/tools/cv-builder`<br>`/tools/gross-net`<br>`/tools/tax` | *Kế hoạch:* API sinh CV, tính thuế | Chưa tạo | [`11_STUDENT_TOOLS.md`](./11_STUDENT_TOOLS.md) |
| **12** | **Chứng Chỉ & Hoạt Động** *(Certificates & Student Activities)* | ![Kế hoạch](https://img.shields.io/badge/-KẾ%20HOẠCH-amber) | *Kế hoạch:* `/certificates`<br>`/activities` | *Kế hoạch:* API CRUD chứng chỉ & hoạt động | Chưa tạo | [`12_CERTIFICATES_AND_ACTIVITIES.md`](./12_CERTIFICATES_AND_ACTIVITIES.md) |
| **13 & 14** | **Cộng Đồng & Tin Tức - Bài Viết** *(Community & News Articles)* | ![Hoàn thành](https://img.shields.io/badge/-HOÀN%20THÀNH%20100%25-emerald) | `/news` (Thư viện bài viết chuẩn UI)<br>`/news/[slug]` (Chi tiết + Tài trợ)<br>`/admin/news`<br>`/admin/news/new` | `GET /api/news`<br>`GET /api/news/[slug]`<br>`GET /api/admin/news`<br>`POST /api/admin/news`<br>`PATCH /api/admin/news/[id]`<br>`DELETE /api/admin/news/[id]` | `NewsArticle` | [`13_14_COMMUNITY_AND_NEWS.md`](./13_14_COMMUNITY_AND_NEWS.md) |
| **15** | **Quản Trị CMS & Kiểm Toán** *(Admin CMS & Audit Logs)* | ![Hoàn thành](https://img.shields.io/badge/-HOÀN%20THÀNH%20100%25-emerald) | `/admin` (Dashboard KPIs)<br>`/admin/students` (Khóa/Mở có lý do)<br>`/admin/opportunities`<br>`/admin/bookings`<br>`/admin/news`<br>`/admin/quiz`<br>`/admin/audit-logs` (Diff Viewer) | `GET /api/admin/dashboard/stats`<br>`GET /api/admin/students`<br>`PATCH /api/admin/students/[id]/status`<br>`GET /api/admin/audit-logs` | `AuditLog`<br>`User` | [`15_ADMIN_CMS_AND_AUDIT.md`](./15_ADMIN_CMS_AND_AUDIT.md) |
| **16** | **Tải Lên Tệp & Lưu Trữ** *(File Upload & Storage)* | ![Kế hoạch](https://img.shields.io/badge/-KẾ%20HOẠCH-amber) | Upload CV, Avatar, Bằng chứng | *Kế hoạch:* `POST /api/upload` (Max 10MB, kiểm tra MIME) | Chưa tạo | [`16_FILE_UPLOAD_AND_STORAGE.md`](./16_FILE_UPLOAD_AND_STORAGE.md) |

---

## 3. Kiến Trúc Kỹ Thuật Tổng Quan (Technical Architecture)

- **Frontend:** Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4, Lucide Icons, Font chữ Inter cho tiếng Việt chuẩn.
- **Backend / API:** Next.js Route Handlers (`src/app/api/...`), Server Actions, Edge Proxy Middleware (`src/middleware.ts`).
- **Database:** MongoDB 7.0+ kết nối qua Mongoose ODM (`src/lib/db.ts`).
- **Authentication:** NextAuth v5 (`@auth/core`, Credentials Provider + Google OAuth 2.0).
- **Concurrency & Audit:** Optimistic Locking (`version` trên Opportunity) & Append-only Audit Log (`AuditLog` cho mọi thay đổi của Admin).
- **UI/UX Guidelines:** Tuân thủ hệ màu Modern EdTech tại [`UI_UX_DESIGN_SYSTEM.md`](file:///c:/Users/AD/OneDrive/Desktop/Project/ULIS_DMST_2026/UI_UX_DESIGN_SYSTEM.md).

---

## 4. Cấu Trúc Thư Mục `specification/`

Để tra cứu nhanh, mỗi cụm tính năng được phân tách thành một tài liệu độc lập mô tả cụ thể:
1. [`01_AUTHENTICATION.md`](./01_AUTHENTICATION.md): Cách đăng nhập, đăng ký, khôi phục mật khẩu, Google OAuth, phân quyền Admin/Student, danh sách tài khoản seed.
2. [`02_STUDENT_PROFILE.md`](./02_STUDENT_PROFILE.md): Cấu trúc 4 tab hồ sơ sinh viên, lưu mục tiêu và đồng bộ lộ trình.
3. [`03_ONBOARDING_QUIZ.md`](./03_ONBOARDING_QUIZ.md): Thuật toán chấm điểm Rule-based, cơ chế nút Skip, CMS quản trị câu hỏi và ma trận điểm số của Admin.
4. [`04_PERSONAL_ROADMAP.md`](./04_PERSONAL_ROADMAP.md): Bất biến 1 Active Roadmap, cấu trúc 4 năm đại học, công thức tính % tiến độ tự động.
5. [`05_06_EXPLORE_AND_SEARCH.md`](./05_06_EXPLORE_AND_SEARCH.md): Cấu trúc cơ hội học bổng/việc làm, bộ lọc trong nước/quốc tế, kiểm soát phiên bản (Optimistic Locking).
6. [`07_SAVED_AND_APPLICATIONS.md`](./07_SAVED_AND_APPLICATIONS.md): Hiện trạng bookmark và đặc tả kế hoạch màn hình bảng theo dõi ứng tuyển (Kanban Tracker).
7. [`08_CALENDAR_AND_DEADLINES.md`](./08_CALENDAR_AND_DEADLINES.md): Hiện trạng lưu hạn chót và đặc tả kế hoạch màn hình Lịch tháng (`/calendar`).
8. [`09_NOTIFICATIONS.md`](./09_NOTIFICATIONS.md): Hiện trạng chuông thông báo và đặc tả kế hoạch trung tâm thông báo (`/notifications`).
9. [`10_MENTOR_CONNECTION.md`](./10_MENTOR_CONNECTION.md): Quy trình phê duyệt cố vấn trung gian của Admin (gửi link Google Meet) và đặc tả kế hoạch màn hình sinh viên (`/mentors`).
10. [`11_STUDENT_TOOLS.md`](./11_STUDENT_TOOLS.md): Đặc tả kế hoạch công cụ tạo CV chuẩn ATS, tính lương Gross - Net, tính thuế TNCN.
11. [`12_CERTIFICATES_AND_ACTIVITIES.md`](./12_CERTIFICATES_AND_ACTIVITIES.md): Đặc tả kế hoạch quản lý chứng chỉ và danh mục hoạt động sinh viên.
12. [`13_14_COMMUNITY_AND_NEWS.md`](./13_14_COMMUNITY_AND_NEWS.md): Thư viện bài viết, nhãn minh bạch đối tác tài trợ (Sponsored), bài viết nổi bật (Featured).
13. [`15_ADMIN_CMS_AND_AUDIT.md`](./15_ADMIN_CMS_AND_AUDIT.md): Sidebar Admin riêng biệt, Dashboard số liệu thống kê thời gian thực, quản lý sinh viên và nhật ký kiểm toán Diff Viewer.
14. [`16_FILE_UPLOAD_AND_STORAGE.md`](./16_FILE_UPLOAD_AND_STORAGE.md): Đặc tả kế hoạch hệ thống upload file an toàn giới hạn 10MB.
