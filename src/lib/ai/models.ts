// 모델 라우팅 (PRODUCT_SPEC §7): 가벼운 작업은 소형 모델, 품질이 중요한 작업은 상위 모델.
// 비용 목표: 사용자당 월 AI 원가 < $0.5 — env 로 오버라이드 가능하게 변수화.
export const MODELS = {
  /** 역질문 생성, 태깅/분류 */
  light: process.env.AI_MODEL_LIGHT ?? "claude-haiku-4-5",
  /** 성취 카드 생성, 이력서 불릿 생성 (M2+) */
  quality: process.env.AI_MODEL_QUALITY ?? "claude-opus-4-8",
} as const;
