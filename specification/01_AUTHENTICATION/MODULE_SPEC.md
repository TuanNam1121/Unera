# Module 01: Authentication — Xác Thực & Quản Lý Tài Khoản

> **Mã Module:** `AUTH`  
> **Trạng thái hiện tại:** Đã nâng cấp cặp JWT Access Token + Refresh Token (`src/lib/jwt.ts`, `src/lib/tokens.ts`), Multi-step Onboarding (`Register & Google OAuth`) và trang quản lý sinh viên cơ bản (`/admin/students` chỉ lọc `STUDENT`, chỉ khóa/mở khóa) — **Cần mở rộng (`AUTH-04`)** để Admin quản lý toàn bộ người dùng (`STUDENT` & `ADMIN`), chuyển đổi Role, tạo tài khoản, và Xóa tài khoản vĩnh viễn (Cascade Delete toàn bộ dữ liệu liên quan).  
> **Tác nhân:** Visitor (Khách), Student (Sinh viên), Admin (Quản trị viên).  
> **Tệp liên quan hiện tại:** [`src/lib/auth.ts`](file:///c:/Users/AD/OneDrive/Desktop/Project/ULIS_DMST_2026/src/lib/auth.ts), [`src/lib/session.ts`](file:///c:/Users/AD/OneDrive/Desktop/Project/ULIS_DMST_2026/src/lib/session.ts), [`src/lib/jwt.ts`](file:///c:/Users/AD/OneDrive/Desktop/Project/ULIS_DMST_2026/src/lib/jwt.ts), [`src/lib/tokens.ts`](file:///c:/Users/AD/OneDrive/Desktop/Project/ULIS_DMST_2026/src/lib/tokens.ts), [`src/proxy.ts`](file:///c:/Users/AD/OneDrive/Desktop/Project/ULIS_DMST_2026/src/proxy.ts), [`src/models/User.ts`](file:///c:/Users/AD/OneDrive/Desktop/Project/ULIS_DMST_2026/src/models/User.ts), [`src/models/RefreshToken.ts`](file:///c:/Users/AD/OneDrive/Desktop/Project/ULIS_DMST_2026/src/models/RefreshToken.ts), [`src/models/PasswordResetToken.ts`](file:///c:/Users/AD/OneDrive/Desktop/Project/ULIS_DMST_2026/src/models/PasswordResetToken.ts), [`src/app/admin/students/page.tsx`](file:///c:/Users/AD/OneDrive/Desktop/Project/ULIS_DMST_2026/src/app/admin/students/page.tsx).

---

## 1. Tổng Quan Nghiệp Vụ & Thay Đổi So Với Hiện Trạng

1. **Cơ chế Dual-Token JWT (Access Token + Refresh Token):**
   - Thay thế mô hình 1 session cookie cố định 30 ngày bằng cặp **Access Token** (thời hạn ngắn: `15m`) và **Refresh Token** (thời hạn dài: `7d` hoặc `30d` khi chọn "Ghi nhớ đăng nhập").
   - Lưu hash của Refresh Token (`tokenHash` SHA-256) trong collection `refresh_tokens` để hỗ trợ **Token Rotation**, **Revocation** (thu hồi ngay khi Logout, Reset Password, hoặc Admin khóa tài khoản `DISABLED`), và phát hiện tái sử dụng token bị đánh cắp (Reuse Detection).
2. **Đăng nhập Google OAuth tự động đăng ký & điều hướng hoàn thiện hồ sơ:**
   - Khi người dùng đăng nhập bằng Google lần đầu (email chưa tồn tại trong `users`), hệ thống tự động tạo `User` với `role = "STUDENT"`, `authProvider = "GOOGLE"`, `onboardingStep = "PROFILE"`.
   - Sau khi xác thực Google thành công, nếu `isProfileCompleted === false` (hoặc `onboardingStep === "PROFILE"`), hệ thống **bắt buộc điều hướng sang Bước 2 (Hoàn thiện thông tin sinh viên)** thay vì vào thẳng `/explore` như code cũ.
3. **Quy trình Đăng ký 3 bước (Multi-step Registration):**
   - **Bước 1 (Email/Password):** Email, Mật khẩu, Xác nhận lại mật khẩu. *(Bỏ qua bước này nếu đăng nhập qua Google OAuth)*.
   - **Bước 2 (Hồ sơ sinh viên bắt buộc):** Họ và tên, Năm sinh, Sinh viên năm mấy, Trường Đại Học (chọn từ danh sách chuẩn hóa có sẵn), Ngành học (tự điền).
   - **Bước 3 (Quiz định hướng):** Điều hướng sang bài Trắc nghiệm định hướng cá nhân (`Module 08`) để hoàn tất onboarding.
4. **Quên mật khẩu & Khôi phục:**
   - Nhập email → gửi email chứa link đặt lại mật khẩu có token hết hạn sau 30 phút.
   - Bấm vào link → nhập mật khẩu mới & xác nhận mật khẩu → đổi mật khẩu, thu hồi toàn bộ Refresh Token cũ → điều hướng về `/login`.
5. **Quản lý Người dùng, Phân quyền Role & Xóa tài khoản toàn diện (Admin — `AUTH-04`):**
   - Hợp nhất trang quản trị thành `/admin/users` (giữ điều hướng tương thích từ `/admin/students`) để Admin xem và tìm kiếm **toàn bộ người dùng** trong hệ thống (cả `STUDENT` lẫn `ADMIN`), tạo tài khoản mới và khóa/mở khóa tài khoản.
   - Cho phép Admin thay đổi vai trò (`STUDENT` ↔ `ADMIN`) kèm lý do bắt buộc, thu hồi ngay `RefreshToken` của user bị đổi role và đồng bộ kiểm tra `role`/`status` thời gian thực từ DB trong `requireAdmin()` / `getCurrentUser()`.
   - Áp dụng **Safety Guards**: chặn Admin tự hạ quyền/khóa/xóa chính mình và chặn tác động lên tài khoản `ADMIN` `ACTIVE` cuối cùng.
   - Bổ sung **nút Xóa tài khoản vĩnh viễn** dành cho Admin (xác nhận nhập lại email + lý do): chạy **Cascade Delete** xóa sạch toàn bộ dữ liệu cá nhân, phiên đăng nhập, hồ sơ, khảo sát/AI, lộ trình 4 năm, tương tác, thông báo và kết quả công cụ của user đó; đồng thời cập nhật lại bộ đếm tương tác công khai (`followerCount`, `likeCount`, `commentCount`, `bookmarkCount`), giữ nguyên bài viết CMS chung và ẩn danh hóa `AuditLog` cũ (nếu user từng là Admin).

---

## 2. Mô Hình Dữ Liệu (Data Models)

### 2.1 Mở rộng Collection `users` ([`User.ts`](file:///c:/Users/AD/OneDrive/Desktop/Project/ULIS_DMST_2026/src/models/User.ts))

| Trường | Kiểu | Bắt buộc | Mặc định | Mô tả |
|---|---|---|---|---|
| `name` | `String` | Có | — | Họ và tên hiển thị |
| `email` | `String` | Có | — | Lowercase, trim, unique index |
| `password` | `String` | Không | `undefined` | Bcrypt hash (salt 10); null nếu chỉ dùng Google OAuth |
| `authProviders` | `String[]` | Có | `["CREDENTIALS"]` | `["CREDENTIALS"]`, `["GOOGLE"]` hoặc cả hai |
| `googleId` | `String` | Không | `undefined` | Google `sub` ID (sparse unique index) |
| `role` | `Enum` | Có | `"STUDENT"` | `"STUDENT"` \| `"ADMIN"` |
| `status` | `Enum` | Có | `"ACTIVE"` | `"ACTIVE"` \| `"DISABLED"` |
| `isProfileCompleted` | `Boolean` | Có | `false` | `true` sau khi xong Bước 2 đăng ký (Admin mặc định `true`) |
| `onboardingStep` | `Enum` | Có | `"PROFILE"` | `"PROFILE"` \| `"QUIZ"` \| `"COMPLETED"` |
| `avatar` | `String` | Không | — | URL ảnh đại diện |
| `lastLoginAt` | `Date` | Không | — | Thời điểm đăng nhập gần nhất |

### 2.2 Collection mới `refresh_tokens`

| Trường | Kiểu | Bắt buộc | Mô tả |
|---|---|---|---|
| `userId` | `ObjectId` | Có | Tham chiếu `users._id`, index |
| `familyId` | `String` | Có | UUID định danh chuỗi token rotation |
| `tokenHash` | `String` | Có | SHA-256 hex digest của raw Refresh Token (unique index) |
| `userAgent` | `String` | Không | Thông tin trình duyệt/thiết bị |
| `ipAddress` | `String` | Không | IP đăng nhập |
| `expiresAt` | `Date` | Có | TTL index `{ expireAfterSeconds: 0 }` |
| `revokedAt` | `Date` | Không | Thời điểm bị thu hồi (`null` nếu còn hiệu lực) |
| `replacedByTokenHash` | `String` | Không | Hash của token kế nhiệm sau rotation |

### 2.3 Collection `password_reset_tokens` ([`PasswordResetToken.ts`](file:///c:/Users/AD/OneDrive/Desktop/Project/ULIS_DMST_2026/src/models/PasswordResetToken.ts))
- Lưu `userId`, `email`, `tokenHash` (nâng cấp từ lưu raw token sang lưu SHA-256 hash để bảo mật DB), `expiresAt` (30 phút), `usedAt`.

### 2.4 Mở rộng `auditlogs` & Tham chiếu Tác giả CMS cho tính năng Quản lý Role / Xóa User ([`AuditLog.ts`](file:///c:/Users/AD/OneDrive/Desktop/Project/ULIS_DMST_2026/src/models/AuditLog.ts))
- Mở rộng enum `AuditLog.action` thêm `"ROLE_CHANGE"` (bên cạnh `"CREATE"`, `"UPDATE"`, `"DELETE"`, `"LOCK_ACCOUNT"`, `"UNLOCK_ACCOUNT"`...).
- Chuyển các tham chiếu tác giả/người cập nhật có `required: true` (`AuditLog.adminId`, `OrientationArticle.createdByAdminId`, `MediaAsset.uploadedBy`) sang cho phép `null` (`required: false, default: null`) để khi Admin xóa một tài khoản từng là quản trị viên, hệ thống vẫn bảo toàn nội dung CMS cộng đồng & lịch sử kiểm toán ở trạng thái ẩn danh mà không phát sinh lỗi schema.

---

## 3. Danh Sách Đặc Tả Chi Tiết Trong Module

| Mã | Tên đặc tả | Tệp |
|---|---|---|
| `AUTH-01` | Đăng nhập JWT Access/Refresh Token & Google OAuth | [`01_LOGIN_JWT_AND_GOOGLE_OAUTH.md`](./01_LOGIN_JWT_AND_GOOGLE_OAUTH.md) |
| `AUTH-02` | Đăng ký đa bước (Credentials, Profile Setup, Quiz) | [`02_REGISTER_AND_ONBOARDING_FLOW.md`](./02_REGISTER_AND_ONBOARDING_FLOW.md) |
| `AUTH-03` | Quên mật khẩu & Đặt lại mật khẩu | [`03_FORGOT_AND_RESET_PASSWORD.md`](./03_FORGOT_AND_RESET_PASSWORD.md) |
| `AUTH-04` | Admin Quản lý User, Phân quyền Role & Xóa tài khoản toàn diện | [`04_ADMIN_USER_ROLE_AND_DELETION.md`](./04_ADMIN_USER_ROLE_AND_DELETION.md) |

