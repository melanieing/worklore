import { generateObject } from "ai";
import { z } from "zod";
import { getModel, type Plan } from "./models";
import {
  CARD_SYSTEM_PROMPT_V1,
  buildCardUserPrompt,
} from "./prompts/achievement-card.v1";
import type { QaExchange } from "@/lib/types";

const isoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .nullable()
  .describe("YYYY-MM-DD or null when unknown");

const cardSchema = z.object({
  title: z.string().describe("Result-first headline, ≤ 80 chars"),
  situation: z.string(),
  task: z.string(),
  action: z.string(),
  result: z.string(),
  metrics: z.array(
    z.object({
      label: z.string().describe('e.g. "p95 latency"'),
      before: z.string().nullable(),
      after: z.string().nullable(),
      value: z.string().nullable().describe("single figure when no before/after"),
    }),
  ),
  skills: z.array(z.string()).describe("2-5 evidenced skills"),
  project_tag: z.string().nullable().describe("kebab-case grouping tag"),
  period_start: isoDate,
  period_end: isoDate,
});

export type GeneratedCard = z.infer<typeof cardSchema>;

// 성취 카드는 품질이 중요한 작업 — quality 라우팅, Pro 는 상위 모델 (docs/COSTS.md §2)
export async function generateAchievementCard(
  rawText: string,
  entryDate: string,
  exchanges: Pick<QaExchange, "question" | "answer">[],
  plan: Plan,
): Promise<GeneratedCard> {
  const { object } = await generateObject({
    model: getModel("quality", plan),
    schema: cardSchema,
    system: CARD_SYSTEM_PROMPT_V1,
    prompt: buildCardUserPrompt(rawText, entryDate, exchanges),
    maxOutputTokens: 2048,
  });

  return object;
}
