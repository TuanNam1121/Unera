# Tính Năng: Bookmark Lưu Trữ Cơ Hội & Bài Viết (Saved Opportunities)

> **Mã SRS:** `FR-APP-01`, `FR-APP-02`, `FR-APP-03`  
> **Trạng thái:** ![Hoàn thành](https://img.shields.io/badge/-ĐÃ%20HOÀN%20THÀNH%20100%25-emerald)  
> **Thuộc cụm:** `07_SAVED_AND_APPLICATIONS`  
> **Tác nhân:** Sinh viên (Student)

---

## 1. Cách Thức Hoạt Động Hiện Tại (Implementation Details)

### 1.1 Thao Tác Bookmark Một Chạm
- Trên mỗi thẻ cơ hội tại `/explore` và thẻ bài viết tại `/news` đều có nút icon Bookmark:
  - Khi chưa lưu: Icon viền xám rỗng.
  - Khi đã lưu: Icon đổi sang màu xanh đậm `text-blue-600 fill-blue-600`.
- Nút "Cơ hội đã lưu" và "Bài viết đã lưu" trên header giúp sinh viên xem nhanh danh sách những mục mình quan tâm.

### 1.2 Backend APIs
- **Mô hình CSDL:** [`src/models/SavedOpportunity.ts`](file:///c:/Users/AD/OneDrive/Desktop/Project/ULIS_DMST_2026/src/models/SavedOpportunity.ts) (`studentId`, `opportunityId`, `createdAt`).
- `GET /api/saved`: Lấy danh sách ID các cơ hội mà sinh viên đã lưu.
- `POST /api/saved`: Lưu một cơ hội mới vào danh sách.
- `DELETE /api/saved`: Bỏ lưu cơ hội.
