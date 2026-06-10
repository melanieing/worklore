import type { LanguageModel } from "ai";
import { resolveModel } from "./provider";

// 모델 라우팅 (PRODUCT_SPEC §7 + docs/COSTS.md):
// - light  = 역질문 생성, 태깅/분류 (플랜 무관 최저가)
// - quality = 성취 카드, 이력서 불릿 — Free 는 최저가, Pro 는 상위 모델
// 단가 변동 시 env 로만 교체한다. 모델명은 사용자에게 절대 노출하지 않는다.
export type AiTask = "light" | "quality";
export type Plan = "free" | "pro";

const DEFAULT_SPECS = {
  light: "openai:gpt-5-nano",
  quality: "google:gemini-2.5-flash",
  qualityPro: "anthropic:claude-sonnet-4-6",
} as const;

export function modelSpecFor(task: AiTask, plan: Plan = "free"): string {
  if (task === "light") {
    return process.env.AI_MODEL_LIGHT ?? DEFAULT_SPECS.light;
  }
  if (plan === "pro") {
    return process.env.AI_MODEL_QUALITY_PRO ?? DEFAULT_SPECS.qualityPro;
  }
  return process.env.AI_MODEL_QUALITY ?? DEFAULT_SPECS.quality;
}

export function getModel(task: AiTask, plan: Plan = "free"): LanguageModel {
  return resolveModel(modelSpecFor(task, plan));
}
