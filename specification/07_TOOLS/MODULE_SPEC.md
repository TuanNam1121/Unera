# Module 07: Công Cụ Sinh Viên (Student Tools)

> **Mã Module:** `TOOLS`  
> **Yêu cầu liên quan:** Trắc nghiệm MBTI, Trắc nghiệm MI, Tính lương Gross - Net, Tính thu nhập cá nhân (Thuế TNCN).  
> **Trạng thái hiện tại:** [`src/components/common/Sidebar.tsx`](file:///c:/Users/AD/OneDrive/Desktop/Project/ULIS_DMST_2026/src/components/common/Sidebar.tsx#L265-L277) đã gắn các route `/tools`, `/tools/mbti`, `/tools/mi`, `/tools/gross-net`, `/tools/tax`, nhưng các page & API trong `src/app/tools` chưa được tạo.  
> **Tác nhân:** Visitor (trải nghiệm tính toán / làm test nhanh), Student (làm test + lưu lịch sử kết quả MBTI/MI vào tài khoản).

---

## 1. Tổng Quan 4 Công Cụ & Định Tuyến

| Mã | Tên công cụ | Route | Mô tả | Lưu DB |
|---|---|---|---|---|
| `TOOL-01` | **Trắc nghiệm MBTI** | `/tools/mbti` | Trắc nghiệm tính cách 4 cặp trục (E/I, S/N, T/F, J/P) → 16 nhóm MBTI + gợi ý nghề nghiệp | Lưu lịch sử (nếu đã đăng nhập) |
| `TOOL-02` | **Trắc nghiệm MI** | `/tools/mi` | Trắc nghiệm Đa trí thông minh Howard Gardner (8 loại trí thông minh) + biểu đồ phân tích | Lưu lịch sử (nếu đã đăng nhập) |
| `TOOL-03` | **Tính lương Gross - Net** | `/tools/gross-net` | Quy đổi Gross ↔ Net 2 chiều, BHXH/BHYT/BHTN theo vùng I–IV, giảm trừ gia cảnh, bảng diễn giải | Tính toán client/shared helper |
| `TOOL-04` | **Tính Thu nhập Cá nhân** | `/tools/tax` | Tính Thuế TNCN chi tiết theo biểu lũy tiến 7 bậc, phân tách từng bậc thuế | Tính toán client/shared helper |
| `TOOL-HUB` | **Trang tổng hợp Công cụ** | `/tools` | Dashboard liệt kê 4 công cụ + kết quả MBTI/MI gần nhất của sinh viên | Đọc `tool_results` |

---

## 2. Mô Hình Dữ Liệu (`tool_results` — Lưu Lịch Sử MBTI & MI)

| Trường | Kiểu | Bắt buộc | Mô tả |
|---|---|---|---|
| `userId` | `ObjectId` | Có | Ref `users._id`, index |
| `toolType` | `Enum` | Có | `"MBTI"` \| `"MI"` |
| `answers` | `Mixed` | Có | Map `{ [questionId]: value }` |
| `resultCode` | `String` | Có | VD: `"INTJ"`, `"ENFP"` (MBTI) hoặc `"LINGUISTIC"` (Top 1 MI) |
| `scoresBreakdown` | `Mixed` | Có | Điểm số chi tiết từng trục MBTI hoặc 8 chỉ số MI |
| `summary` | `String` | Có | Tên/tóm tắt kết quả |
| `createdAt` | `Date` | Có | Thời điểm làm bài (index `{ userId: 1, toolType: 1, createdAt: -1 }`) |

---

## 3. Danh Sách Đặc Tả Chi Tiết

| Tệp | Nội dung |
|---|---|
| [`01_MBTI_ASSESSMENT_TOOL.md`](./01_MBTI_ASSESSMENT_TOOL.md) | Đặc tả Trắc nghiệm MBTI |
| [`02_MI_ASSESSMENT_TOOL.md`](./02_MI_ASSESSMENT_TOOL.md) | Đặc tả Trắc nghiệm Đa trí thông minh (MI) |
| [`03_GROSS_NET_SALARY_CALCULATOR.md`](./03_GROSS_NET_SALARY_CALCULATOR.md) | Đặc tả Công cụ Tính lương Gross ↔ Net |
| [`04_PERSONAL_INCOME_TAX_CALCULATOR.md`](./04_PERSONAL_INCOME_TAX_CALCULATOR.md) | Đặc tả Công cụ Tính Thuế Thu nhập Cá nhân (TNCN) |

