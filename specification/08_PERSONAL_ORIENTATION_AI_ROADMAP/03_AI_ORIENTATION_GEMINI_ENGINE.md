# MOD8-AI: AI-Powered Orientation Engine — Gemini API & JSON Validation (AI01–AI11)

> **Module:** `08_PERSONAL_ORIENTATION_AI_ROADMAP`  
> **Feature IDs:** `AI01`–`AI11`.  
> **Tác nhân:** System Backend (tích hợp Google Gemini API), Student (xem & yêu cầu tái phân tích), Admin (quản lý System Prompt).

---

## 1. Đặc Tả Từng Feature ID (`AI01` – `AI11`)

| ID | Feature | Đặc tả Kỹ thuật & Nghiệp vụ |
|---|---|---|
| `AI01` | **Assessment Data Processing** | Service `buildAiOrientationInput(studentId, submissionId)` tổng hợp: (1) Hồ sơ sinh viên (`fullName`, `birthYear`, `academicYear`, `university`, `major`, `bio`, `hardSkills`, `softSkills`, `achievements`); (2) Toàn bộ câu hỏi + câu trả lời tương ứng từ `AssessmentSubmission` (map `optionId` sang nhãn text dễ đọc với AI). |
| `AI02` | **Gemini API Integration** | Tích hợp `@google/genai` (Node.js SDK chính thức của Google Gemini) ở phía **Server-only** (`process.env.GEMINI_API_KEY`). Cấu hình `responseMimeType: "application/json"` và `responseSchema` (Structured Outputs) để ép Gemini trả đúng JSON, timeout `30s`, exponential backoff retry tối đa `2` lần cho lỗi mạng/429. |
| `AI03` | **System Prompt Management** | Lưu trong collection `system_prompts` theo `key` (`"ORIENTATION_ANALYSIS"`, `"ROADMAP_GENERATION"`). Trang `/admin/ai-prompts` cho phép Admin xem, sửa, thử nghiệm, tạo phiên bản mới (`version++`), và kích hoạt phiên bản active. (Có fallback default prompt hardcoded trong `src/constants/aiPrompts.ts` nếu DB chưa seed). |
| `AI04` | **AI Orientation Analysis** | Gemini phân tích sâu: `summary` (tổng quan chân dung sinh viên), `interests` (sở thích nổi trội), `strengths` (điểm mạnh), `weaknessesToImprove` (điểm cần cải thiện), `personalityInsights` (nhận xét xu hướng tính cách & động lực). |
| `AI05` | **Orientation Compatibility Evaluation** | Đánh giá mức độ tương thích (`compatibilityScore: 0–100`) cho từng hướng định hướng (VD: *Việc làm khối ngành*, *Du học & Học bổng*, *Nghiên cứu khoa học*, *Khởi nghiệp*) kèm `reasoning` (lý do khớp/chưa khớp dựa trên năm học, chuyên ngành, kỹ năng và câu trả lời thực tế). |
| `AI06` | **Career Recommendation** | Đề xuất Top `2–3` định hướng nghề nghiệp / vai trò cụ thể phù hợp (`roleTitle`, `industry`, `matchPercent`, `whyItFits`, `entryLevelRoles`). |
| `AI07` | **Learning Recommendation** | Đề xuất kỹ năng chuyên môn (`hardSkillsToLearn`), kỹ năng mềm (`softSkillsToDevelop`), chứng chỉ mục tiêu (`recommendedCertificates`), và chủ đề kiến thức cần bổ sung (`knowledgeTopics`) kèm mức độ ưu tiên (`HIGH` \| `MEDIUM`). |
| `AI08` | **AI Result Validation** | Sau khi nhận text JSON từ Gemini, parse JSON và chạy **`aiOrientationResultSchema.safeParse(parsed)` bằng Zod**. Chuẩn hóa lại giá trị biên (VD: clamp `score` trong `0..100`, trim strings, loại phần tử rỗng) trước khi lưu DB. Nếu sai schema → ném lỗi validation để kích hoạt retry hoặc xử lý lỗi `AI10`. |
| `AI09` | **AI Analysis Storage** | Lưu kết quả đã validate vào `ai_orientation_analyses` gắn `studentId`, `submissionId`, `promptVersion`, `modelUsed`, `inputSnapshot`, `analysisResult`, `status: "COMPLETED"`. |
| `AI10` | **AI Error Handling** | Khi Gemini API timeout, mất key, rate limit (`429`), hoặc trả JSON sai schema sau retry: (1) **Không làm mất `AssessmentSubmission`** đã nộp; (2) Lưu/cập nhật bản ghi `AiOrientationAnalysis` với `status: "FAILED"` và `errorMessage` thân thiện; (3) Trả UI trạng thái rõ ràng kèm nút **"Thử phân tích lại"** (`AI11`). Không bao giờ rò rỉ `GEMINI_API_KEY` hay stack trace ra client. |
| `AI11` | **AI Regeneration** | Cho phép sinh viên bấm **"Phân tích lại bằng AI"** khi: (a) lần trước bị `FAILED`, hoặc (b) sinh viên vừa cập nhật thêm kỹ năng/thành tích/năm học trong `StudentProfile` và muốn AI đánh giá lại trên dữ liệu hồ sơ mới nhất. Tạo bản ghi `AiOrientationAnalysis` mới (giữ bản cũ làm lịch sử). |

---

## 2. JSON Schema Thống Nhất Đầu Ra Cho Gemini (`AI08`)

Mọi System Prompt phân tích định hướng (`ORIENTATION_ANALYSIS`) bắt buộc cấu hình kèm `responseSchema` & Zod Schema sau:

```typescript
export const aiOrientationResultSchema = z.object({
  overallSummary: z.string().min(20),
  profileEvaluation: z.object({
    interests: z.array(z.string()).min(1).max(6),
    strengths: z.array(z.string()).min(1).max(6),
    areasForImprovement: z.array(z.string()).min(1).max(6),
  }),
  orientationCompatibility: z.array(
    z.object({
      directionCode: z.enum(["CAREER_INDUSTRY", "STUDY_ABROAD", "RESEARCH", "STARTUP", "POSTGRAD"]),
      directionTitle: z.string(),
      compatibilityScore: z.number().min(0).max(100),
      isPrimaryRecommendation: z.boolean(),
      reasoning: z.string(),
    })
  ).min(2),
  careerRecommendations: z.array(
    z.object({
      title: z.string(),
      industry: z.string(),
      matchScore: z.number().min(0).max(100),
      reason: z.string(),
      nextSteps: z.array(z.string()).min(1).max(4),
    })
  ).min(1).max(4),
  learningRecommendations: z.object({
    hardSkills: z.array(z.object({ name: z.string(), priority: z.enum(["HIGH", "MEDIUM"]), reason: z.string() })),
    softSkills: z.array(z.object({ name: z.string(), priority: z.enum(["HIGH", "MEDIUM"]), reason: z.string() })),
    certificatesOrCourses: z.array(z.string()),
  }),
});
```

---

## 3. Đặc Tả API Contract

| Method | Endpoint | Auth | Feature ID | Mô tả |
|---|---|---|---|---|
| `POST` | `/api/ai/orientation/analyze` | Student | `AI01`–`AI10` | Chạy phân tích AI cho `submissionId` (thường tự gọi khi submit `PA09` hoặc gọi tách async với UI loading state) |
| `POST` | `/api/ai/orientation/regenerate` | Student | `AI11` | Tạo bản phân tích AI mới dựa trên lần nộp gần nhất + hồ sơ hiện tại |
| `GET` | `/api/ai/orientation/latest` | Student | `AI09` | Lấy bản phân tích AI mới nhất của sinh viên |
| `GET/POST` | `/api/admin/ai-prompts` | Admin | `AI03` | Xem / Tạo phiên bản System Prompt mới |
| `PATCH` | `/api/admin/ai-prompts/[id]/activate` | Admin | `AI03` | Kích hoạt phiên bản System Prompt |

---

## 4. Tiêu Chí Chấp Thuận

- **AC-01 (`AI01`–`AI09`):** *Given* sinh viên nộp bài trắc nghiệm định hướng, *When* backend tổng hợp hồ sơ + đáp án và gọi Gemini API, *Then* phản hồi JSON được validate qua `aiOrientationResultSchema` thành công và lưu bản ghi `COMPLETED` vào `ai_orientation_analyses`.
- **AC-02 (`AI08`, `AI10` Invalid JSON / Timeout):** *Given* Gemini trả JSON thiếu trường bắt buộc hoặc bị timeout, *When* quá trình retry thất bại, *Then* `AssessmentSubmission` vẫn nguyên vẹn trạng thái `SUBMITTED`, bản phân tích lưu `FAILED`, và UI hiển thị nút "Thử phân tích lại".
- **AC-03 (`AI03`):** Admin cập nhật và kích hoạt phiên bản v2 của System Prompt → các lượt phân tích kế tiếp ghi nhận `promptVersion: 2`.

