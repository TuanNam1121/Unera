# Đặc Tả Tính Năng: Phân Quyền Vai Trò & Đa Tài Khoản Admin Đồng Đẳng

> **Mã tính năng:** `FR-AUTH-07`, `FR-AUTH-12`, `FR-AUTH-13`  
> **Thuộc cụm:** `01_AUTHENTICATION`  
> **Tác nhân thực hiện:** Hệ thống (System), Sinh viên (Student), Quản trị viên (Admin)  
> **Mức độ ưu tiên:** Bắt buộc (P0 - MVP)  
> **Trạng thái:** Confirmed  

---

## 1. Mục Tiêu & Nghiệp Vụ

1. **Phân quyền dựa trên vai trò trên Server (FR-AUTH-07):**
   - Mọi thao tác truy xuất hoặc thay đổi dữ liệu phải được kiểm tra quyền hạn ở phía Server (Server-side Authorization). Việc ẩn hoặc vô hiệu hóa nút bấm trên giao diện người dùng (Client-side) chỉ mang tính trải nghiệm, không thay thế được việc kiểm tra bảo mật ở tầng backend.
   - Không tin cậy bất kỳ tham số `studentId` hoặc `userId` nào do client gửi lên trong body hoặc URL query. Định danh người dùng hiện tại **bắt buộc phải được trích xuất trực tiếp từ session JWT đã được ký mật mã**.
2. **Hỗ trợ đa tài khoản Admin (FR-AUTH-12):**
   - Hệ thống cho phép nhiều tài khoản Admin cùng hoạt động đồng thời để quản lý thông tin cơ hội, duyệt bài trắc nghiệm, tạo template lộ trình và xử lý đặt lịch mentor.
3. **Quyền hạn Admin đồng đẳng (FR-AUTH-13):**
   - **Tất cả các Admin đều có quyền hạn ngang nhau.**
   - Không có phân cấp Super-Admin, Admin trưởng hay Admin phòng ban trong phạm vi phiên bản hiện tại. Mọi Admin đều có quyền xem và xử lý toàn bộ danh mục tài nguyên chung.

---

## 2. Đặc Tả Kỹ Thuật (Server Authorization Pattern)

```typescript
// Helper kiểm tra quyền Admin trên Server (src/lib/session.ts)
export async function requireAdmin() {
  const session = await auth();
  if (!session?.user || (session.user as any).role !== "ADMIN") {
    throw new Response(
      JSON.stringify({ error: "Truy cập bị từ chối. Yêu cầu quyền Quản trị viên." }),
      { status: 403, headers: { "Content-Type": "application/json" } }
    );
  }
  return session.user;
}

// Helper lấy ID sinh viên từ phiên (Ngăn chặn ID Spoofing)
export async function requireStudent() {
  const session = await auth();
  if (!session?.user) {
    throw new Response(
      JSON.stringify({ error: "Yêu cầu đăng nhập." }),
      { status: 401, headers: { "Content-Type": "application/json" } }
    );
  }
  return session.user.id;
}
```

---

## 3. Tiêu Chí Chấp Thuận

- **AC-01:** Sinh viên đăng nhập gửi request `POST /api/opportunities` (tạo cơ hội mới) nhận phản hồi HTTP `403 Forbidden`.
- **AC-02:** Sinh viên A cố ý gửi request sửa hồ sơ của Sinh viên B bằng cách đổi `studentId` trong payload bị hệ thống ghi đè bằng `userId` từ session hoặc từ chối HTTP `403`.
- **AC-03:** Bất kỳ tài khoản Admin hợp lệ nào đều có thể duyệt yêu cầu mentor hoặc xuất bản cơ hội mà không bị chặn bởi cơ chế phân cấp.

