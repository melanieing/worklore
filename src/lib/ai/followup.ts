import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { z } from "zod";
import { getAnthropic } from "./client";
import { MODELS } from "./models";
import {
  FOLLOWUP_SYSTEM_PROMPT_V1,
  buildFollowupUserPrompt,
} from "./prompts/followup-questions.v1";

const followupSchema = z.object({
  questions: z
    .array(z.string())
    .describe("1-3 follow-up questions, ordered by value. Empty if nothing worth asking."),
});

// 역질문은 1~3개로 제한 (CLAUDE.md 원칙 3). 실패해도 기록 저장을 막으면 안 되므로
// 호출부에서 빈 배열을 안전한 폴백으로 다룬다.
export async function generateFollowupQuestions(
  rawText: string,
  entryDate: string,
): Promise<string[]> {
  const response = await getAnthropic().messages.parse({
    model: MODELS.light,
    max_tokens: 1024,
    system: FOLLOWUP_SYSTEM_PROMPT_V1,
    messages: [
      { role: "user", content: buildFollowupUserPrompt(rawText, entryDate) },
    ],
    output_config: {
      format: zodOutputFormat(followupSchema),
    },
  });

  return (response.parsed_output?.questions ?? []).slice(0, 3);
}
