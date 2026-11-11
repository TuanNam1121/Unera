# Đặc Tả Tính Năng: Admin Quản Trị Bộ Câu Hỏi & Phương Án Trắc Nghiệm Định Hướng

> **Mã tính năng:** `FR-ONB-10`, `FR-ONB-11`, `FR-ONB-12`  
> **Thuộc cụm:** `03_ONBOARDING_QUIZ`  
> **Tác nhân:** Quản trị viên (Admin), Hệ thống (System)  
> **Mức độ ưu tiên:** Bắt buộc (P0 - MVP Core Admin CMS)  
> **Trạng thái:** Confirmed Business Decision (Đã cập nhật theo yêu cầu quản trị Admin)  

---

## 1. Mục Tiêu & Mô Tả Nghiệp Vụ

Nhằm đảm bảo bài trắc nghiệm định hướng (`/onboarding`) luôn bám sát xu hướng tuyển sinh, đào tạo và thị trường lao động, Quản trị viên có toàn quyền kiểm soát nội dung bộ câu hỏi và cơ chế tính điểm mà không cần can thiệp vào mã nguồn:

### 1.1 Quản trị Danh mục & Câu hỏi (FR-ONB-10)
- **Thêm mới câu hỏi:** Soạn thảo tiêu đề câu hỏi, gán nhóm danh mục khảo sát (`Mục tiêu tương lai - GOAL`, `Sở thích - INTEREST`, `Chuẩn bị - PREPARATION`, `Phong cách làm việc - WORK_STYLE`, `Giá trị - VALUES`, `Học thuật - ACADEMIC`, `Kỹ năng - SKILLS`).
- **Sắp xếp thứ tự (`order`):** Điều chỉnh thứ tự xuất hiện của câu hỏi trong quy trình khảo sát từng bước (Stepper).
- **Bật/Tắt kích hoạt (`isActive`):** Cho phép tạm ẩn câu hỏi khỏi màn hình làm bài của sinh viên mà không làm mất dữ liệu lịch sử bài làm trước đây.
- **Xóa câu hỏi:** Loại bỏ câu hỏi không còn phù hợp khỏi bộ trắc nghiệm hiện hành.

### 1.2 Quản trị Động Danh sách Phương án Lựa chọn & Trọng số Điểm (FR-ONB-11)
- Mỗi câu hỏi có từ 2 đến 6 phương án trả lời tùy chỉnh.
- Với mỗi phương án, Admin có quyền:
  1. Thêm mới hoặc xóa bớt phương án lựa chọn.
  2. Sửa nội dung văn bản hiển thị của phương án (`text`).
  3. Cấu hình bảng trọng số điểm (`scores`) trực tiếp cho 5 nhóm định hướng nghề nghiệp:
     - `study_abroad`: Du học & Săn học bổng Quốc tế.
     - `employment`: Quản trị viên Tập sự & Doanh nghiệp Toàn cầu (MNCs).
     - `research`: Nghiên cứu Khoa học & Học thuật Chuyên sâu.
     - `startup`: Khởi nghiệp & Đổi mới Sáng tạo.
     - `skills`: Phát triển Năng lực Cá nhân & Kỹ năng Toàn diện.
- Điểm trọng số là số nguyên không âm ($\ge 0$, thường từ 0 đến 5). Khi sinh viên chọn phương án này, hệ thống sẽ cộng điểm tương ứng vào tổng điểm của nhóm định hướng đó.

### 1.3 Loại Trừ Hoàn Toàn AI Trong MVP (FR-ONB-12 & BR-05)
- Thuật toán chấm điểm hoàn toàn dựa trên quy tắc cộng dồn trọng số (Rule-based Scoring Matrix).
- Tuyệt đối không tích hợp các API mô hình ngôn ngữ lớn (LLM như OpenAI, Claude hay Gemini) vào khâu sinh câu hỏi hay chấm điểm trắc nghiệm trong phiên bản 1.0, nhằm đảm bảo:
  - Tính nhất quán, minh bạch và có thể giải thích được 100% của kết quả.
  - Tốc độ phản hồi tức thì (< 300ms) không phụ thuộc vào hạ tầng mạng bên ngoài.
  - Chi phí vận hành bằng 0 cho phần định hướng học thuật.

---

## 2. Mô Hình Dữ Liệu Chi Tiết (`quiz_questions`)

```typescript
export interface IQuizOption {
  id: string;               // Mã định danh phương án (ví dụ: "q1_a", "opt_123")
  text: string;             // Nội dung phương án sinh viên nhìn thấy
  scores: {
    study_abroad: number;   // Điểm cộng du học (0 - 10)
    employment: number;     // Điểm cộng việc làm MNC / MT (0 - 10)
    research: number;       // Điểm cộng nghiên cứu khoa học (0 - 10)
    startup: number;        // Điểm cộng khởi nghiệp (0 - 10)
    skills: number;         // Điểm cộng kỹ năng toàn diện (0 - 10)
  };
}

export interface IQuizQuestion {
  _id: ObjectId;
  question: string;         // Câu hỏi khảo sát
  category: string;         // Nhóm câu hỏi (GOAL, INTEREST, PREPARATION, v.v.)
  order: number;            // Thứ tự hiển thị tăng dần (1, 2, 3...)
  isActive: boolean;        // true: hiển thị cho sinh viên; false: ẩn
  options: IQuizOption[];   // Mảng các phương án lựa chọn
  createdAt: Date;
  updatedAt: Date;
}
```

---

## 3. Danh Mục API Endpoints Quản Trị Của Admin

Tất cả các endpoint dưới đây đều bắt buộc xác thực quyền Quản trị viên (`requireAdmin`):

| Phương thức | Endpoint | Chức năng nghiệp vụ | Nhật ký kiểm toán (Audit) |
|---|---|---|---|
| `GET` | `/api/admin/quiz/questions` | Lấy danh sách toàn bộ câu hỏi kèm options & trọng số điểm | Không ghi log |
| `POST` | `/api/admin/quiz/questions` | Tạo câu hỏi mới kèm danh sách options | Ghi log `CREATE` |
| `GET` | `/api/admin/quiz/questions/[id]` | Lấy thông tin chi tiết một câu hỏi | Không ghi log |
| `PATCH` | `/api/admin/quiz/questions/[id]` | Sửa tiêu đề, category, order, options, trọng số hoặc bật/tắt `isActive` | Ghi log `UPDATE` / `STATUS_CHANGE` |
| `DELETE` | `/api/admin/quiz/questions/[id]` | Xóa câu hỏi khỏi cơ sở dữ liệu | Ghi log `DELETE` |
| `POST` | `/api/admin/quiz/reset-default` | Khôi phục bộ 10 câu hỏi chuẩn ban đầu của trường | Ghi log `STATUS_CHANGE` |

---

## 4. Giao Diện Quản Trị Admin CMS (`/admin/quiz`)

1. **Bảng Điều Khiển Tổng Quan:**
   - Thống kê: Tổng số câu hỏi, Số câu đang hoạt động, Tổng số lựa chọn.
   - Nút **"Thêm câu hỏi mới"** mở modal/form soạn thảo.
   - Nút **"Khôi phục mặc định"** để đồng bộ lại bộ câu hỏi chuẩn nếu cần.
2. **Danh Sách & Thao Tác Nhanh:**
   - Hiển thị thứ tự kéo thả / số thứ tự, nội dung câu hỏi, chuyên mục.
   - Thẻ hiển thị số lượng lựa chọn và các hướng nghề nghiệp được phân bổ điểm.
   - Switch toggle bật/tắt `isActive` tức thì.
   - Nút Chỉnh sửa (Edit) và Xóa (Delete).
3. **Modal/Form Soạn Thảo Câu Hỏi & Options:**
   - Nhập tiêu đề câu hỏi, chuyên mục, số thứ tự.
   - Danh sách phương án:
     - Nút "Thêm phương án lựa chọn".
     - Nhập nội dung text phương án.
     - 5 ô nhập điểm tương ứng với: Du học, Việc làm MNC, Nghiên cứu, Khởi nghiệp, Kỹ năng.
     - Nút xóa phương án (tối thiểu giữ lại 2 phương án).

---

## 5. Tiêu Chí Chấp Thuận (Acceptance Criteria)

- **AC-01:** Admin thêm câu hỏi mới có 4 lựa chọn với điểm số cấu hình sẵn. Lưu thành công, câu hỏi xuất hiện ngay trong danh sách quản trị.
- **AC-02:** Sinh viên truy cập `/onboarding`, câu hỏi mới của Admin xuất hiện đúng theo số thứ tự `order` đã cấu hình.
- **AC-03:** Sinh viên nộp bài trắc nghiệm chọn phương án mới, hệ thống tính toán chính xác tổng điểm theo đúng trọng số Admin đã nhập.
- **AC-04:** Admin gạt tắt `isActive: false` cho một câu hỏi. Sinh viên làm bài sẽ không còn nhìn thấy câu hỏi đó, và tổng số câu hỏi tự động giảm tương ứng.
- **AC-05:** Mọi thay đổi về câu hỏi đều được ghi vết minh bạch vào bảng `audit_logs` với đầy đủ thông tin Admin, thời gian và dữ liệu trước/sau thay đổi.
