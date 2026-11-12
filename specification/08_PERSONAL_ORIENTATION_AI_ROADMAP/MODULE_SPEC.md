# Module 08: Trắc Nghiệm Định Hướng Cá Nhân, AI Gemini & Lộ Trình Phát Triển (PA01–PA25, AI01–AI11, RM01–RM14)

> **Mã Module:** `PERSONAL_ORIENTATION_AI_ROADMAP`  
> **Phạm vi yêu cầu:**  
> 1. **Personal Orientation Assessment (`PA01`–`PA25`):** Bộ câu hỏi động (4 loại câu hỏi + logic điều kiện + lưu tiến độ + lịch sử + Admin builder & preview).  
> 2. **AI-Powered Orientation (`AI01`–`AI11`):** Tích hợp **Gemini API**, quản lý System Prompt, chuẩn hóa đầu ra theo **JSON Schema + Zod**, lưu kết quả phân tích, xử lý lỗi & tái tạo.  
> 3. **Personalized Roadmap (`RM01`–`RM14`):** Sinh lộ trình Năm 1–Năm 4 bằng Gemini AI, CRUD mục tiêu, trạng thái, tiến độ, sắp xếp thứ tự, tái tạo khi đổi định hướng, lịch sử & khôi phục phiên bản cũ.  
> **Trạng thái hiện tại:** [`QuizQuestion.ts`](file:///c:/Users/AD/OneDrive/Desktop/Project/ULIS_DMST_2026/src/models/QuizQuestion.ts), [`QuizResult.ts`](file:///c:/Users/AD/OneDrive/Desktop/Project/ULIS_DMST_2026/src/models/QuizResult.ts), [`Roadmap.ts`](file:///c:/Users/AD/OneDrive/Desktop/Project/ULIS_DMST_2026/src/models/Roadmap.ts) hiện tại chỉ hỗ trợ câu hỏi single-choice cứng 5 hướng rule-based và roadmap mẫu tĩnh, **chưa có** Dynamic Questionnaire, Conditional Logic, Gemini AI, System Prompt CMS, và Goal CRUD/Reorder/Restore. Cần nâng cấp/tái kiến trúc toàn diện.

---

## 1. Luồng Nghiệp Vụ Khép Kín (End-to-End Pipeline)

```text
[1. Admin Builder (PA13–PA25)]
   Tạo Questionnaire -> Thêm Question (Single/Multiple/Scale/Text)
   -> Gắn Conditional Logic -> Preview (PA25) -> Activate (PA16)
           │
           ▼
[2. Student Assessment (PA01–PA12)]
   Xem bộ câu hỏi Active (PA01) -> Render động + ẩn/hiện câu điều kiện (PA02–PA07)
   -> Auto-save/Save Progress (PA08) -> Submit (PA09)
           │
           ▼
[3. AI Orientation Engine (AI01–AI11)]
   Gộp Assessment Answers + StudentProfile (AI01) + Active System Prompt (AI03)
   -> Gọi Gemini API JSON Schema Mode (AI02) -> Validate Zod (AI08)
   -> Lưu AiOrientationAnalysis (AI09) [Nếu lỗi -> Retry/Fallback (AI10)]
           │
           ▼
[4. Personalized Roadmap (RM01–RM14)]
   Gemini AI sinh Roadmap 4 năm (RM01) -> Validate Zod -> Archive bản cũ -> Active bản mới
   -> Sinh viên xem 4 năm/từng năm, Thêm/Sửa/Xóa/Hoàn thành/Đổi trạng thái/Sắp xếp Goals
   -> Tái tạo khi đổi định hướng (RM12) / Xem lịch sử & Khôi phục bản cũ (RM13, RM14)
```

---

## 2. Mô Hình Dữ Liệu (MongoDB / Mongoose)

### 2.1 `questionnaires` (`PA13`–`PA16`, `PA01`)
| Trường | Kiểu | Mô tả |
|---|---|---|
| `title` | `String` | Tên bộ câu hỏi (VD: *"Khảo sát Định hướng Nghề nghiệp & Học thuật 2026"*) |
| `description` | `String` | Mô tả mục đích bộ câu hỏi |
| `version` | `Number` | Phiên bản bộ câu hỏi |
| `isActive` | `Boolean` | Chỉ bộ `isActive: true` được hiển thị cho sinh viên (`PA01`, `PA16`) |
| `isDeleted` | `Boolean` | Soft-delete để bảo toàn lịch sử bài làm cũ (`PA15`) |
| `createdByAdminId` | `ObjectId` | Admin tạo |

### 2.2 `assessment_questions` (`PA02`–`PA07`, `PA17`–`PA24`)
| Trường | Kiểu | Mô tả |
|---|---|---|---|
| `questionnaireId` | `ObjectId` | Ref `questionnaires._id`, index |
| `code` | `String` | Mã tham chiếu ổn định trong bộ câu hỏi (VD: `"Q1"`, `"Q_MAJOR_FOCUS"`) |
| `questionText` | `String` | Nội dung câu hỏi |
| `description` | `String` | Ghi chú/hướng dẫn trả lời (tùy chọn) |
| `questionType` | `Enum` | `"SINGLE_CHOICE"` \| `"MULTIPLE_CHOICE"` \| `"SCALE"` \| `"TEXT"` (`PA21`) |
| `isRequired` | `Boolean` | Bắt buộc trả lời khi câu hỏi đang được hiển thị (`PA22`) |
| `order` | `Number` | Thứ tự hiển thị (`PA23`) |
| `options` | `Array` | Dùng cho `SINGLE_CHOICE` / `MULTIPLE_CHOICE`: `[{ id, label, value, order }]` (`PA20`) |
| `scaleConfig` | `Object` | Dùng cho `SCALE`: `{ min: 1, max: 5, step: 1, minLabel, maxLabel }` (`PA05`) |
| `textConfig` | `Object` | Dùng cho `TEXT`: `{ placeholder, maxLength: 1000, multiline: boolean }` (`PA06`) |
| `multipleConfig` | `Object` | Dùng cho `MULTIPLE_CHOICE`: `{ minSelect?: number, maxSelect?: number }` |
| `conditionalLogic` | `Object \| null` | Quy tắc hiển thị (`PA07`, `PA24`): `{ enabled: boolean, matchType: "ALL" | "ANY", rules: [{ sourceQuestionId, operator: "EQUALS" | "NOT_EQUALS" | "CONTAINS" | "GREATER_THAN" | "LESS_THAN", value }] }` |

### 2.3 `assessment_submissions` (`PA08`–`PA12`)
| Trường | Kiểu | Mô tả |
|---|---|---|
| `studentId` | `ObjectId` | Ref `users._id`, index |
| `questionnaireId` | `ObjectId` | Ref `questionnaires._id` |
| `status` | `Enum` | `"IN_PROGRESS"` (lưu nháp `PA08`) \| `"SUBMITTED"` (`PA09`) |
| `attemptNumber` | `Number` | Lần làm thứ `1, 2, 3...` (`PA11`, `PA12`) |
| `answers` | `Array` | Snapshot câu trả lời: `[{ questionId, questionTextSnapshot, questionType, value }]` (dạng string, string[], hoặc number) |
| `currentStepIndex` | `Number` | Vị trí câu hỏi đang làm dở (`PA08`) |
| `lastSavedAt` | `Date` | Thời điểm lưu nháp gần nhất |
| `submittedAt` | `Date` | Thời điểm nộp bài |

### 2.4 `system_prompts` (`AI03`)
| Trường | Kiểu | Mô tả |
|---|---|---|
| `key` | `Enum` | `"ORIENTATION_ANALYSIS"` \| `"ROADMAP_GENERATION"` |
| `name` | `String` | Tên gợi nhớ |
| `promptContent` | `String` | Nội dung System Prompt chuẩn hóa |
| `modelName` | `String` | VD: `"gemini-2.5-flash"` hoặc `"gemini-2.5-pro"` |
| `temperature` | `Number` | Mặc định `0.3`–`0.4` để ổn định JSON |
| `version` | `Number` | Tăng tự động mỗi lần chỉnh sửa |
| `isActive` | `Boolean` | Chỉ 1 bản active cho mỗi `key` |
| `updatedByAdminId` | `ObjectId` | Admin cập nhật |

### 2.5 `ai_orientation_analyses` (`AI04`–`AI11`)
| Trường | Kiểu | Mô tả |
|---|---|---|
| `studentId` | `ObjectId` | Ref `users._id`, index |
| `submissionId` | `ObjectId` | Ref `assessment_submissions._id`, index |
| `promptVersion` | `Number` | Phiên bản System Prompt đã dùng |
| `modelUsed` | `String` | Model Gemini đã gọi |
| `inputSnapshot` | `Mixed` | Dữ liệu hồ sơ + câu trả lời đã gửi cho Gemini (`AI01`) |
| `status` | `Enum` | `"PROCESSING"` \| `"COMPLETED"` \| `"FAILED"` |
| `errorMessage` | `String` | Thông báo lỗi chi tiết nếu `FAILED` (`AI10`) |
| `retryCount` | `Number` | Số lần đã thử lại |
| `analysisResult` | `Object` | Dữ liệu JSON đã qua **Zod Validation** (`AI04`–`AI08`) |
| `regenerationOfId` | `ObjectId` | Tham chiếu bản phân tích trước nếu là `AI11` |

### 2.6 `roadmaps` (`RM01`–`RM14` — Nâng cấp [`Roadmap.ts`](file:///c:/Users/AD/OneDrive/Desktop/Project/ULIS_DMST_2026/src/models/Roadmap.ts))
| Trường | Kiểu | Mô tả |
|---|---|---|
| `studentId` | `ObjectId` | Ref `users._id`, index |
| `analysisId` | `ObjectId` | Ref `ai_orientation_analyses._id` |
| `title` | `String` | Tên lộ trình (VD: `"Lộ trình Du học Thạc sĩ Ngôn ngữ Anh"`) |
| `orientationDirection` | `String` | Định hướng mục tiêu chính |
| `version` | `Number` | Phiên bản `1, 2, 3...` (`RM13`) |
| `status` | `Enum` | `"ACTIVE"` \| `"ARCHIVED"` (Partial unique index đảm bảo **tối đa 1 `ACTIVE` per `studentId`**) |
| `source` | `Enum` | `"AI_GENERATED"` \| `"RESTORED_FROM_HISTORY"` |
| `restoredFromRoadmapId` | `ObjectId` | ID lộ trình gốc nếu được khôi phục (`RM14`) |
| `progressPercent` | `Number` | `0–100` (tự tính từ danh sách goals) |
| `years` | `Array` | Mảng cố định 4 năm (`yearNumber: 1..4`, `title`, `summary`, `goals: RoadmapGoal[]`) |

#### Cấu trúc `RoadmapGoal` nhúng trong từng Year (`RM03`–`RM11`):
| Trường | Kiểu | Mô tả |
|---|---|---|
| `id` | `String` | UUID định danh mục tiêu |
| `title` | `String` | Tiêu đề mục tiêu (`RM04`–`RM06`) |
| `description` | `String` | Mô tả chi tiết cách thực hiện (`RM04`) |
| `category` | `String` | VD: `"ACADEMIC"`, `"SKILL"`, `"CERTIFICATE"`, `"EXPERIENCE"`, `"CAREER"` |
| `semester` | `Number` | `1` \| `2` \| `0` (Cả năm) |
| `priority` | `Enum` | `"HIGH"` \| `"MEDIUM"` \| `"LOW"` |
| `status` | `Enum` | `"NOT_STARTED"` \| `"IN_PROGRESS"` \| `"COMPLETED"` \| `"SKIPPED"` (`RM08`, `RM09`) |
| `dueDate` | `Date \| null` | Hạn mục tiêu dự kiến |
| `order` | `Number` | Thứ tự sắp xếp trong năm (`RM11`) |
| `isCustom` | `Boolean` | `true` nếu sinh viên tự thêm (`RM05`), `false` nếu AI sinh (`RM01`) |
| `completedAt` | `Date \| null` | Thời điểm hoàn thành |

---

## 3. Danh Sách Đặc Tả Chi Tiết

| Mã | Tính năng bao phủ | Tệp |
|---|---|---|
| `MOD8-PA-S` | `PA01`–`PA12`: Trắc nghiệm động cho Sinh viên | [`01_STUDENT_DYNAMIC_ASSESSMENT.md`](./01_STUDENT_DYNAMIC_ASSESSMENT.md) |
| `MOD8-PA-A` | `PA13`–`PA25`: Admin Questionnaire & Conditional Logic Builder | [`02_ADMIN_QUESTIONNAIRE_BUILDER.md`](./02_ADMIN_QUESTIONNAIRE_BUILDER.md) |
| `MOD8-AI` | `AI01`–`AI11`: AI-Powered Orientation Engine (Gemini API + Prompt + Validation) | [`03_AI_ORIENTATION_GEMINI_ENGINE.md`](./03_AI_ORIENTATION_GEMINI_ENGINE.md) |
| `MOD8-RM` | `RM01`–`RM14`: Quản lý Lộ trình Cá nhân 4 năm & Lịch sử / Khôi phục | [`04_PERSONALIZED_ROADMAP_MANAGEMENT.md`](./04_PERSONALIZED_ROADMAP_MANAGEMENT.md) |

