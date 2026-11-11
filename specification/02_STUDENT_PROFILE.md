# Cụm Tính Năng 02: Quản Lý Hồ Sơ Cá Nhân Sinh Viên (Student Profile Management)

> **Mã SRS:** `FR-PRO-01` đến `FR-PRO-06`  
> **Trạng thái:** ![Hoàn thành](https://img.shields.io/badge/-ĐÃ%20HOÀN%20THÀNH%20100%25-emerald)  
> **Tác nhân:** Sinh viên (Student)

---

## 1. Cách Thức Hoạt Động Hiện Tại (Current Implementation)

Hồ sơ sinh viên là trung tâm dữ liệu cá nhân hóa, kết nối trực tiếp với kết quả trắc nghiệm và lộ trình đào tạo:

### 1.1 Giao Diện Người Dùng (`/profile`)
- **Tệp mã nguồn:** [`src/app/profile/page.tsx`](file:///c:/Users/AD/OneDrive/Desktop/Project/ULIS_DMST_2026/src/app/profile/page.tsx)
- Bố cục gồm 4 Tab chức năng theo chuẩn UI Modern EdTech:
  1. **Tab 1 — Học vấn & Cá nhân:** Họ và tên, Trường đại học, Ngành học, Khóa sinh viên (Năm 1, 2, 3, 4), Tiểu sử ngắn.
  2. **Tab 2 — Mục tiêu phát triển:** Các checkbox chọn mục tiêu trọng tâm (Du học, Quản trị viên tập sự / MNCs, Nghiên cứu khoa học, Khởi nghiệp, Kỹ năng mềm) và ghi chú mục tiêu cá nhân.
  3. **Tab 3 — Kỹ năng:** Quản lý danh sách tag kỹ năng cứng & kỹ năng mềm (Thêm mới, Xóa tag).
  4. **Tab 4 — Thành tích & Giải thưởng:** Danh sách các giải thưởng, học bổng đã đạt được trong quá trình học.

### 1.2 Backend APIs
- **`GET /api/profile`:** Lấy dữ liệu hồ sơ của sinh viên đang đăng nhập. Nếu chưa có, tự động khởi tạo bản ghi mặc định liên kết với `userId`.
- **`PUT /api/profile`:** Cập nhật thông tin họ tên, trường lớp, tiểu sử, kỹ năng, thành tích.
- **`PUT /api/profile/goals`:** 
  - Cập nhật các mục tiêu phát triển.
  - **Tự động kích hoạt cơ chế sinh Lộ trình:** Lưu trữ (`ARCHIVED`) lộ trình cũ và tự động sinh bản ghi `Roadmap` mới có trạng thái `ACTIVE` phù hợp với mục tiêu sinh viên vừa chọn.

### 1.3 Mô Hình Dữ Liệu `StudentProfile`
- **Tệp mã nguồn:** [`src/models/StudentProfile.ts`](file:///c:/Users/AD/OneDrive/Desktop/Project/ULIS_DMST_2026/src/models/StudentProfile.ts)
```typescript
interface IStudentProfile {
  userId: string; // Khóa ngoại liên kết với User._id
  fullName: string;
  avatar?: string;
  university: string;
  major: string;
  academicYear: string; // "Năm 1" | "Năm 2" | "Năm 3" | "Năm 4" | "Đã tốt nghiệp"
  bio?: string;
  developmentGoals: {
    studyAbroad?: boolean;
    employment?: boolean;
    scientificResearch?: boolean;
    startup?: boolean;
    personalGrowth?: boolean;
    notes?: string;
  };
  skills: string[];
  achievements: string[];
}
```

### 1.4 Bảo Vệ Quyền Sở Hữu Dữ Liệu (`FR-PRO-06`)
- Mọi thao tác đọc và ghi hồ sơ đều trích xuất `userId` từ token phiên đã xác thực phía server (`await requireAuth()`).
- Tuyệt đối không chấp nhận `userId` do client truyền qua body hoặc query param, ngăn chặn 100% nguy cơ tấn công IDOR (Insecure Direct Object References).
