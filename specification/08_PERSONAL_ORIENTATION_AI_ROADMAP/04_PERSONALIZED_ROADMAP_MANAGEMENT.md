# MOD8-RM: Quản Lý Lộ Trình Phát Triển Cá Nhân 4 Năm (RM01–RM14)

> **Module:** `08_PERSONAL_ORIENTATION_AI_ROADMAP`  
> **Feature IDs:** `RM01`–`RM14`.  
> **Tác nhân:** Student (chủ sở hữu duy nhất của lộ trình cá nhân).  
> **Tham chiếu hiện trạng:** [`src/app/roadmap/page.tsx`](file:///c:/Users/AD/OneDrive/Desktop/Project/ULIS_DMST_2026/src/app/roadmap/page.tsx) và [`src/app/api/roadmap/route.ts`](file:///c:/Users/AD/OneDrive/Desktop/Project/ULIS_DMST_2026/src/app/api/roadmap/route.ts) hiện mới chỉ có data mẫu hardcoded, toggle `completed` boolean và thêm task. Cần nâng cấp đầy đủ sang AI Generation + CRUD Goal + Status 4 trạng thái + Reorder + Regenerate + History & Restore.

---

## 1. Đặc Tả Từng Feature ID (`RM01` – `RM14`)

| ID | Feature | Đặc tả Nghiệp vụ & Kỹ thuật |
|---|---|---|
| `RM01` | **Generate Roadmap** | Gọi Gemini API với System Prompt `ROADMAP_GENERATION` (`AI03`), đầu vào gồm `StudentProfile` + `AiOrientationAnalysis` (`AI09`). Ép Gemini trả JSON Schema chuẩn gồm đủ **4 năm học (`yearNumber: 1..4`)**, mỗi năm chứa danh sách các mục tiêu (`goals`) cụ thể cho học kỳ 1 & 2, có `title`, `description`, `category`, `semester`, `priority`, `dueDate` gợi ý. Validate bằng Zod trước khi lưu. Đảm bảo chỉ có **1 Roadmap `ACTIVE`** duy nhất cho mỗi sinh viên. |
| `RM02` | **View Roadmap** | Trang `/roadmap` (và tóm tắt ở Tab "Lộ trình cá nhân" trong `/profile`) hiển thị tổng quan lộ trình `ACTIVE` từ Năm 1 đến Năm 4, tên định hướng chính, thanh tiến độ tổng thể, và danh sách năm học. |
| `RM03` | **View Roadmap by Year** | Thanh chuyển đổi theo năm: **Tất cả (Năm 1–4)** \| **Năm 1** \| **Năm 2** \| **Năm 3** \| **Năm 4** (tự động highlight năm học hiện tại của sinh viên theo `StudentProfile.academicYear`), kèm bộ lọc theo trạng thái mục tiêu (`Tất cả`, `Chưa bắt đầu`, `Đang thực hiện`, `Hoàn thành`). |
| `RM04` | **View Goal Detail** | Bấm vào một mục tiêu → Mở Drawer/Modal Chi tiết mục tiêu hiển thị: Tiêu đề, Mô tả đầy đủ, Năm học & Học kỳ, Danh mục (`ACADEMIC`, `SKILL`, `CERTIFICATE`, `EXPERIENCE`, `CAREER`), Độ ưu tiên, Trạng thái hiện tại, Hạn hoàn thành dự kiến, Nguồn (`AI gợi ý` hoặc `Tự thêm`), Ngày hoàn thành. |
| `RM05` | **Add Goal** | Nút **"+ Thêm mục tiêu"** cho phép sinh viên tự thêm mục tiêu cá nhân vào bất kỳ năm nào (`yearNumber: 1..4`), nhập `title`, `description`, `semester`, `category`, `priority`, `dueDate`. Đặt `isCustom: true`, `status: "NOT_STARTED"`, `order = maxOrder + 1`, và tính lại `progressPercent`. |
| `RM06` | **Edit Goal** | Chỉnh sửa thông tin mục tiêu (cả mục tiêu AI sinh lẫn mục tiêu tự thêm): tiêu đề, mô tả, học kỳ, độ ưu tiên, hạn hoàn thành, thậm chí chuyển sang năm khác nếu muốn. |
| `RM07` | **Delete Goal** | Xóa mục tiêu khỏi năm học (có xác nhận trước khi xóa), cập nhật lại `order` các mục tiêu còn lại và tính lại `progressPercent`. |
| `RM08` | **Complete Goal** | Nút/checkbox tick nhanh đánh dấu mục tiêu hoàn thành (`COMPLETED`) hoặc bỏ hoàn thành (trở về `NOT_STARTED` / `IN_PROGRESS`), ghi nhận `completedAt`, cập nhật `progressPercent` tức thì (Optimistic UI + Server recalc). |
| `RM09` | **Update Goal Status** | Dropdown/pill đổi trạng thái chi tiết 4 mức: `NOT_STARTED` (*Chưa bắt đầu*), `IN_PROGRESS` (*Đang thực hiện*), `COMPLETED` (*Hoàn thành*), `SKIPPED` (*Bỏ qua*). |
| `RM10` | **Track Roadmap Progress** | Tính toán: (a) **Tiến độ tổng thể:** `Math.round((completedGoals / countableGoals) * 100)` (với `countableGoals = goals có status !== "SKIPPED"` để tránh bị kẹt 99% khi bỏ qua mục tiêu không phù hợp); (b) **Tiến độ từng Năm (Năm 1..4):** Hiển thị thanh tiến độ riêng cho mỗi năm. |
| `RM11` | **Reorder Goals** | Cho phép thay đổi thứ tự mục tiêu trong cùng một năm học bằng kéo-thả hoặc nút Lên (`↑`) / Xuống (`↓`), lưu mảng thứ tự mới về server. |
| `RM12` | **Regenerate Roadmap** | Khi sinh viên thay đổi định hướng (hoặc bấm **"Tạo lại lộ trình AI"** và chọn hướng đi/ghi chú mới): (1) Gọi Gemini AI tạo lộ trình mới và validate Zod; (2) **Nếu Gemini lỗi/timeout → BẮT BUỘC giữ nguyên lộ trình `ACTIVE` hiện tại**, báo lỗi để sinh viên thử lại; (3) Nếu thành công → dùng transaction chuyển lộ trình cũ sang `ARCHIVED` và lưu lộ trình mới với `status: "ACTIVE"`, `version = maxVersion + 1`. |
| `RM13` | **Roadmap History** | Trang/Drawer **"Lịch sử lộ trình"** (`/roadmap/history`) liệt kê tất cả các phiên bản lộ trình đã lưu (`ARCHIVED` & `ACTIVE`): Số phiên bản (`v1, v2...`), Tên định hướng, Ngày tạo, % hoàn thành đã đạt được, nút **Xem chi tiết (Read-only)** toàn bộ mục tiêu của phiên bản cũ đó. |
| `RM14` | **Restore Previous Roadmap** | Trên màn hình xem chi tiết phiên bản lịch sử (`ARCHIVED`), nút **"Khôi phục lộ trình này"**: (1) Lưu/archive lộ trình `ACTIVE` hiện tại; (2) Khôi phục phiên bản cũ (khuyến nghị **clone thành một phiên bản `ACTIVE` mới** hoặc chuyển trạng thái về `ACTIVE` với ghi chú `restoredFromRoadmapId`, bảo toàn nguyên vẹn toàn bộ mục tiêu và trạng thái hoàn thành của bản cũ đó); (3) Đảm bảo vẫn chỉ có duy nhất 1 lộ trình `ACTIVE`. |

---

## 2. JSON Schema Đầu Ra Gemini Cho `RM01` / `RM12`

```typescript
export const aiRoadmapSchema = z.object({
  title: z.string().min(5),
  orientationDirection: z.string().min(3),
  years: z.array(
    z.object({
      yearNumber: z.number().int().min(1).max(4),
      title: z.string(),
      summary: z.string(),
      goals: z.array(
        z.object({
          title: z.string().min(3),
          description: z.string(),
          category: z.enum(["ACADEMIC", "SKILL", "CERTIFICATE", "EXPERIENCE", "CAREER"]),
          semester: z.union([z.literal(0), z.literal(1), z.literal(2)]),
          priority: z.enum(["HIGH", "MEDIUM", "LOW"]),
        })
      ).min(2).max(10),
    })
  ).length(4), // Bắt buộc đủ 4 năm từ Năm 1 đến Năm 4 (RM02)
});
```

---

## 3. Đặc Tả API Contract (`/api/roadmap/*`)

Tất cả endpoint yêu cầu `requireAuth()` và ràng buộc `studentId === authUser.id`.

| Method | Endpoint | Feature ID | Mô tả |
|---|---|---|---|
| `GET` | `/api/roadmap` | `RM02`, `RM03`, `RM10` | Lấy lộ trình `ACTIVE` hiện tại (kèm breakdown tiến độ tổng & từng năm) |
| `POST` | `/api/roadmap/generate` | `RM01`, `RM12` | Sinh lộ trình mới bằng Gemini AI (`{ analysisId?, targetDirection?, notes? }`). Bảo toàn bản cũ nếu lỗi |
| `POST` | `/api/roadmap/goals` | `RM05` | Thêm mục tiêu cá nhân vào `yearNumber` |
| `PATCH` | `/api/roadmap/goals/[goalId]` | `RM06`, `RM08`, `RM09` | Sửa thông tin mục tiêu hoặc cập nhật `status` (`NOT_STARTED` / `IN_PROGRESS` / `COMPLETED` / `SKIPPED`) |
| `DELETE` | `/api/roadmap/goals/[goalId]` | `RM07` | Xóa mục tiêu và tính lại `progressPercent` |
| `PATCH` | `/api/roadmap/years/[yearNumber]/reorder` | `RM11` | Sắp xếp lại thứ tự `orderedGoalIds` trong một năm |
| `GET` | `/api/roadmap/history` | `RM13` | Danh sách các phiên bản lộ trình trước đó |
| `GET` | `/api/roadmap/history/[roadmapId]` | `RM13` | Xem chi tiết (read-only) một phiên bản cũ |
| `POST` | `/api/roadmap/history/[roadmapId]/restore` | `RM14` | Khôi phục phiên bản cũ thành `ACTIVE` (archive bản hiện tại) |

---

## 4. Tiêu Chí Chấp Thuận (Acceptance Criteria)

- **AC-01 (`RM01`, `RM02`, `RM03`):** *Given* sinh viên hoàn thành phân tích AI, *When* hệ thống sinh lộ trình, *Then* tạo 1 lộ trình `ACTIVE` duy nhất gồm đủ 4 năm (`Năm 1` đến `Năm 4`) và sinh viên lọc xem từng năm chính xác.
- **AC-02 (`RM05`–`RM11`):** Sinh viên thêm mục tiêu tự chọn vào Năm 2, sửa tiêu đề, đổi thứ tự lên đầu, đánh dấu `COMPLETED`, rồi xóa 1 mục tiêu khác → `progressPercent` luôn được tính lại chính xác trên cả client & server.
- **AC-03 (`RM12` Safe Regeneration):** *Given* sinh viên đang có lộ trình v1 (`ACTIVE`) nhưng khi bấm "Tạo lại lộ trình mới" Gemini API bị lỗi/timeout, *Then* hệ thống báo lỗi rõ ràng và **lộ trình v1 vẫn giữ nguyên trạng thái `ACTIVE`, không bị mất dữ liệu**.
- **AC-04 (`RM13`, `RM14` History & Restore):** *Given* sinh viên đã tạo v2 và muốn quay lại v1, *When* mở Lịch sử lộ trình và bấm "Khôi phục v1", *Then* v2 chuyển sang `ARCHIVED`, v1 được khôi phục làm `ACTIVE` duy nhất với nguyên vẹn tiến độ trước đây của nó.

