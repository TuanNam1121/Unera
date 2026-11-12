import { NextResponse } from "next/server";
import { resolveAllowedGeminiModel, SYSTEM_PROMPT_KEYS } from "@/constants";
import {
  callGeminiOrientationAnalysis,
  callGeminiRoadmapGeneration,
  toFriendlyGeminiError,
} from "@/lib/gemini";
import { handleAuthError, requireAdmin } from "@/lib/session";

const SAMPLE_STUDENT_CONTEXT_ANALYSIS = `=== HỒ SƠ SINH VIÊN (MẪU THỬ NGHIỆM) ===
- Họ tên: Nguyễn Minh Anh
- Năm sinh: 2007
- Trường đại học: Trường Đại học Ngoại ngữ - ĐHQGHN
- Ngành học: Ngôn ngữ Anh
- Trình độ năm học: Năm nhất
- Kỹ năng chuyên môn đã khai báo: Chưa cập nhật (đang ở bước onboarding đầu tiên)
- Kỹ năng mềm đã khai báo: Chưa cập nhật (đang ở bước onboarding đầu tiên)
- Thành tích / Chứng nhận đã khai báo: Chưa cập nhật (đang ở bước onboarding đầu tiên)

=== KẾT QUẢ BÀI KHẢO SÁT ===
1. [Q1_MAIN_GOAL] Mục tiêu ưu tiên: Săn học bổng Du học (Thạc sĩ/Trao đổi quốc tế)
2. [Q2_ABROAD_FOCUS] Khu vực ưu tiên: Châu Âu / Vương quốc Anh
3. [Q4_INTEREST_DOMAINS] Lĩnh vực hứng thú: Giảng dạy/Ngôn ngữ ứng dụng; Công nghệ/UX/EdTech
4. [Q5_LANGUAGE_CONFIDENCE] Tự tin ngoại ngữ: 4/5
5. [Q8_CONTEXT_NOTES] Chia sẻ thêm: Mới vào năm nhất nên chưa có thành tích nổi bật, muốn vừa học tốt ngoại ngữ vừa tiếp cận EdTech/UX.`;

const SAMPLE_STUDENT_CONTEXT_ROADMAP = `=== HỒ SƠ SINH VIÊN (MẪU THỬ NGHIỆM) ===
- Trường: Trường Đại học Ngoại ngữ - ĐHQGHN
- Ngành: Ngôn ngữ Anh (Năm nhất)
- Định hướng nổi bật: Du học Thạc sĩ Châu Âu (EdTech / Ngôn ngữ học ứng dụng) kết hợp thực tập UX/EdTech.`;

/**
 * POST /api/admin/ai-prompts/test
 * AI03: Thử nghiệm trực tiếp System Prompt nháp với Google Gemini trên dữ liệu mẫu, không lưu DB.
 */
export async function POST(req: Request) {
  try {
    await requireAdmin(req);
    const body = await req.json();

    const key = body?.key;
    const promptContent =
      typeof body?.promptContent === "string" ? body.promptContent.trim() : "";
    const modelName = resolveAllowedGeminiModel(
      typeof body?.modelName === "string" ? body.modelName : undefined
    );
    const temperature =
      typeof body?.temperature === "number" ? body.temperature : 0.35;
    const customTestInput =
      typeof body?.sampleInput === "string" && body.sampleInput.trim()
        ? body.sampleInput.trim()
        : key === SYSTEM_PROMPT_KEYS.ROADMAP_GENERATION
          ? SAMPLE_STUDENT_CONTEXT_ROADMAP
          : SAMPLE_STUDENT_CONTEXT_ANALYSIS;

    if (!promptContent || promptContent.length < 20) {
      return NextResponse.json(
        { error: "Vui lòng nhập nội dung System Prompt tối thiểu 20 ký tự để thử nghiệm." },
        { status: 400 }
      );
    }

    const startedAt = Date.now();
    try {
      if (key === SYSTEM_PROMPT_KEYS.ROADMAP_GENERATION) {
        const result = await callGeminiRoadmapGeneration({
          modelName,
          temperature,
          systemPrompt: promptContent,
          userPrompt: customTestInput,
        });
        return NextResponse.json({
          success: true,
          durationMs: Date.now() - startedAt,
          retryCount: result.retryCount,
          modelUsed: result.modelUsed,
          output: result.data,
        });
      }

      const result = await callGeminiOrientationAnalysis({
        modelName,
        temperature,
        systemPrompt: promptContent,
        userPrompt: customTestInput,
      });
      return NextResponse.json({
        success: true,
        durationMs: Date.now() - startedAt,
        retryCount: result.retryCount,
        modelUsed: result.modelUsed,
        output: result.data,
      });
    } catch (geminiErr) {
      return NextResponse.json(
        {
          success: false,
          durationMs: Date.now() - startedAt,
          error: toFriendlyGeminiError(geminiErr),
        },
        { status: 502 }
      );
    }
  } catch (error) {
    return handleAuthError(error);
  }
}

