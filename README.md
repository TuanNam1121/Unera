# UNERA — Nền tảng Định hướng Học tập & Phát triển Sự nghiệp

> **Tài liệu tham chiếu chuẩn:** [`PROJECT_CONTEXT.md`](file:///c:/Users/AD/OneDrive/Desktop/Project/ULIS_DMST_2026/PROJECT_CONTEXT.md) và [`SRS_1.0.md`](file:///c:/Users/AD/OneDrive/Desktop/Project/ULIS_DMST_2026/SRS_1.0.md).

---

## 1. Giới thiệu dự án

**UNERA** là nền tảng web toàn diện dành cho sinh viên đại học Việt Nam, giải quyết bài toán thông tin cơ hội bị phân mảnh, thiếu lộ trình phát triển rõ ràng trong 4 năm đại học, bỏ lỡ hạn chót ứng tuyển và khó khăn trong việc quản lý hồ sơ, chứng chỉ, hoạt động.

### Vai trò hệ thống
- **STUDENT (Sinh viên):** Quản lý hồ sơ cá nhân, làm bài kiểm tra trắc nghiệm định hướng (onboarding quiz), quản lý duy nhất 01 lộ trình chủ động (active roadmap), khám phá và lưu cơ hội, thêm cơ hội vào lịch theo dõi hạn chót, quản lý hồ sơ ứng tuyển theo Kanban, đặt lịch tư vấn Mentor qua trung gian Admin, sử dụng các công cụ sinh viên (tạo CV, tính GPA, quy đổi ngoại ngữ).
- **ADMIN (Quản trị viên):** Thẩm định, tạo và xuất bản thông tin cơ hội ngoại kiểm, xử lý yêu cầu đặt lịch Mentor, quản lý danh mục câu hỏi quiz, template lộ trình, kiểm duyệt nội dung cộng đồng.

---

## 2. Công nghệ sử dụng (Tech Stack)

- **Framework:** Next.js (App Router, Server Components & Server Actions)
- **Ngôn ngữ:** TypeScript
- **Styling:** Tailwind CSS + Design Tokens
- **UI Components:** Thiết kế theo quy chuẩn shadcn/ui & thư viện biểu tượng `lucide-react`
- **Cơ sở dữ liệu:** MongoDB với Mongoose ODM (kèm cache connection pool cho môi trường Serverless / Hot-reload)
- **Xác thực:** NextAuth (Auth.js) hỗ trợ Email/Mật khẩu và Google OAuth
- **Kiểm tra dữ liệu (Validation):** Zod
- **AI Skill:** [UI/UX Pro Max Skill](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill) tích hợp tại `.agents/skills/`

---

## 3. Cấu trúc thư mục dự án

```text
.
├── .agents/                    # Bộ Antigravity Skills (Bao gồm ui-ux-pro-max)
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (auth)/             # Route nhóm xác thực (login, register)
│   │   ├── (student)/          # Route dành cho sinh viên (roadmap, explore, calendar, ...)
│   │   ├── (admin)/            # Route quản trị viên (opportunities, bookings, ...)
│   │   ├── api/
│   │   │   └── health/         # Endpoint kiểm tra trạng thái hệ thống & MongoDB
│   │   ├── globals.css         # Tailwind & theme variables
│   │   ├── layout.tsx          # Root Layout (Navbar & Footer)
│   │   └── page.tsx            # Trang chủ Landing Page giới thiệu UNERA
│   ├── components/
│   │   ├── common/             # Navbar, Footer
│   │   └── ui/                 # Button, Card, Badge, Input (shadcn pattern)
│   ├── constants/              # Vai trò, danh mục, trạng thái cơ hội & ứng tuyển
│   ├── lib/
│   │   ├── db.ts               # Kết nối MongoDB bền vững qua Mongoose
│   │   └── utils.ts            # Hàm cn() và tiện ích định dạng ngày/tiền tệ
│   ├── models/                 # Mongoose Data Models (User, Opportunity, Roadmap, ...)
│   ├── types/                  # TypeScript Types & Interfaces phản ánh SRS
│   └── validations/            # Zod validation schemas
├── .env.example                # Mẫu biến môi trường
├── PROJECT_CONTEXT.md          # Ngữ cảnh dự án & nguyên tắc bất biến
├── SRS_1.0.md                  # Đặc tả yêu cầu phần mềm chi tiết (SRS 1.0)
└── package.json
```

---

## 4. Hướng dẫn khởi chạy & phát triển

### 4.1 Chuẩn bị môi trường

1. Đảm bảo đã cài đặt Node.js v18+ (khuyến nghị v20+ hoặc v24).
2. Sao chép file cấu hình môi trường:
   ```bash
   cp .env.example .env.local
   ```
3. Cập nhật chuỗi kết nối `MONGODB_URI` trong file `.env.local` (sử dụng MongoDB cục bộ hoặc MongoDB Atlas).

### 4.2 Chạy môi trường Development

```bash
npm run dev
```

Truy cập [http://localhost:3000](http://localhost:3000) trên trình duyệt.

### 4.3 Kiểm tra Build & Type Check

```bash
npm run build
```

---

## 5. Các quyết định kiến trúc quan trọng (Architectural Guardrails)

1. **Phân định rõ ràng giữa "Lưu cơ hội" (Saved Opportunity) và "Thêm vào lịch" (Calendar Entry):**
   - Chỉ những cơ hội được sinh viên bấm **"Thêm vào lịch"** mới kích hoạt cơ chế nhắc hạn chót (7, 3, 1 ngày).
2. **Kiểm soát đồng thời (Optimistic Locking) khi Admin cập nhật Cơ hội:**
   - Trường `version` trong model `Opportunity` ngăn chặn việc ghi đè vô tình khi nhiều Admin cùng sửa một nội dung.
3. **Vòng đời Lộ trình (Single Active Roadmap):**
   - Mỗi sinh viên chỉ có duy nhất 01 lộ trình ở trạng thái `ACTIVE`. Khi mục tiêu phát triển thay đổi, hệ thống sẽ tự sinh lộ trình mới và lưu trữ lộ trình cũ vào lịch sử (`ARCHIVED`).
4. **Bảo vệ quyền truy cập từ Server:**
   - Luôn xác thực người dùng từ session phía Server, không tin cậy `studentId` gửi từ phía Client.
