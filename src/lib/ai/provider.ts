import { anthropic } from "@ai-sdk/anthropic";
import { google } from "@ai-sdk/google";
import { openai } from "@ai-sdk/openai";
import type { LanguageModel } from "ai";

// 프로바이더 중립 레이어 (docs/COSTS.md): 모델은 "provider:model-id" 문자열로
// env 주입되며, 벤더 교체에 코드 변경이 없어야 한다.
const PROVIDERS = {
  openai,
  google,
  anthropic,
} as const;

type ProviderName = keyof typeof PROVIDERS;

export function resolveModel(spec: string): LanguageModel {
  const sep = spec.indexOf(":");
  const provider = sep === -1 ? "" : spec.slice(0, sep);
  const modelId = sep === -1 ? "" : spec.slice(sep + 1);

  if (!modelId || !(provider in PROVIDERS)) {
    throw new Error(
      `Invalid model spec "${spec}" — expected "provider:model-id" with provider one of ${Object.keys(PROVIDERS).join(", ")}`,
    );
  }
  return PROVIDERS[provider as ProviderName](modelId);
}
