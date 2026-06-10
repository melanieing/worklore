# CLAUDE.md — Worklore

이 파일은 Claude Code가 이 프로젝트에서 작업할 때 항상 참조하는 컨텍스트입니다.
제품 배경·범위·데이터 모델의 상세는 `PRODUCT_SPEC.md`를 먼저 읽으세요.

## 프로젝트 한 줄 요약

Worklore는 "매일 5분, AI 커리어 인터뷰어"입니다. 사용자가 직장에서 있었던 일을
줄글/음성으로 가볍게 기록하면, AI가 즉시 역질문(follow-up)으로 정량 지표와 임팩트를
캡처하고, 이를 구조화된 성취 카드(Achievement Card)로 변환하여 이력서/CV가
자동으로 누적·관리되게 합니다. 타깃은 글로벌 시장(영어 우선, i18n 고려)입니다.

## 핵심 제품 원칙 (코드 결정 시 항상 우선)

1. **입력 마찰 최소화가 최우선.** 빈 페이지를 주지 않는다. AI가 먼저 질문한다.
   음성 입력은 1급 시민(first-class)이다.
2. **원데이터는 절대 보존.** 일기 원문 + AI 문답 전체를 immutable하게 저장한다.
   구조화(성취 카드)는 원데이터에서 파생되며, 언제든 재생성 가능해야 한다.
3. **역질문은 1~3개로 제한.** 사용자를 심문하지 않는다. 가장 가치 높은
   정량 지표 질문을 우선한다 (전후 비교 수치, 규모, 기간, 비용/매출 영향).
4. **주 2~3회 기록이면 충분하다는 톤.** 매일 강요 금지. 스트릭(streak) 대신
   "이번 달 임팩트 요약" 같은 보상 루프를 우선한다.
5. **품질 vs 비용: AI 모델 라우팅.** 가벼운 작업(역질문 생성, 태깅)은 소형 모델,
   품질이 중요한 작업(성취 카드 생성, 이력서 불릿)은 상위 모델.

## 기술 스택 (2026 현행 표준, 변경 시 사용자와 상의)

- TypeScript + Next.js (App Router) + Tailwind CSS
- Supabase (PostgreSQL, Auth, Storage, RLS)
- Vercel (호스팅), Stripe (결제), Resend (트랜잭션 이메일)
- Anthropic API (모델 라우팅: 소형 모델 = 역질문/태깅, 상위 모델 = 카드/불릿 생성)
- 음성 입력: 브라우저 MediaRecorder → STT API (V1은 외부 STT, 자체 구축 금지)

## 코딩 컨벤션

- 전부 TypeScript, strict 모드. any 금지.
- 서버 로직은 Next.js Route Handlers / Server Actions. 별도 백엔드 서버 금지(V1).
- DB 접근은 Supabase 클라이언트 + RLS. 모든 테이블에 RLS 정책 필수.
- AI 프롬프트는 `/lib/ai/prompts/` 에 버전 관리되는 파일로 분리. 코드에 인라인 금지.
- 사용자 대면 문자열은 i18n 키로 분리 (V1은 en만 제공, ko는 V1.5).
- 커밋은 conventional commits (feat:, fix:, chore:).

## V1 범위 밖 (구현 제안 금지)

이력서 템플릿 디자인 다양화, Jira/GitHub 연동, 채용공고 맞춤 테일러링,
팀/B2B 기능, 모바일 네이티브 앱. 상세 근거는 PRODUCT_SPEC.md 참조.

## 마일스톤

- M1: 스키마 + Auth + 기록 입력(텍스트) + AI 역질문 루프
- M2: 성취 카드 생성/편집 + 타임라인 뷰
- M3: 이력서 불릿 생성 + Markdown/PDF export + Stripe 유료벽
- M4: 음성 입력 + 월간 임팩트 요약 이메일(Resend)

## 마일스톤 진행 상황 (세션 간 누적 — 마일스톤 완료 시마다 업데이트)

### M1 — 완료 (2026-06-10)

- **스택**: Next.js 16.2.7 (App Router, Turbopack, src dir), Tailwind v4, pnpm,
  Supabase (`supabase/` CLI는 devDependency, `pnpm supabase ...`로 실행)
- **주의: Next.js 16 breaking changes** — `middleware.ts` → `src/proxy.ts`
  (`export function proxy`, Node 런타임 전용), `cookies()`/`params`/`searchParams`
  모두 async(Promise). 새 코드 작성 시 반드시 `await` 할 것.
- **스키마**: `supabase/migrations/20260610000000_init_schema.sql` — PRODUCT_SPEC §6
  전체 테이블 + RLS. 핵심 설계:
  - entries는 트리거로 UPDATE 차단(immutable), qa_exchanges는 answer를 null→값 1회만 허용
  - usage_counters는 사용자 INSERT/UPDATE 정책 없음 — entries INSERT 트리거(security definer)로만 증가
  - profiles는 auth.users INSERT 트리거로 자동 생성
  - metrics는 spec의 jsonb[] 대신 단일 jsonb 배열로 구현 (쿼리 편의, 마이그레이션 주석 참조)
- **Auth**: 이메일/비밀번호 (`src/app/login/`), 이메일 확인은 `src/app/auth/confirm/route.ts`
  (verifyOtp), 세션 갱신은 `src/lib/supabase/session.ts` + `src/proxy.ts`
- **기록 입력 + 역질문 루프**: `src/app/(app)/journal/` — new(입력) → 서버 액션
  `createEntry`가 entry 저장 후 AI 역질문 생성 → `[id]` 페이지에서 답변(`answerQuestion`).
  AI 실패는 기록 저장을 막지 않음(원데이터 우선).
- **AI**: `src/lib/ai/` — 모델 라우팅 `models.ts` (light=claude-haiku-4-5,
  quality=claude-opus-4-8, env 오버라이드 가능). 프롬프트는 `prompts/*.v1.ts`로 버전 관리.
  구조화 출력은 `messages.parse()` + `zodOutputFormat` 사용.
- **환경**: `.env.example` 참조. Supabase publishable key(신규)와 anon key(레거시) 둘 다 지원.
- **남은 일(M1 범위 밖 메모)**: Supabase 호스팅 프로젝트 연결 + `supabase db push`,
  이메일 템플릿의 확인 링크를 `/auth/confirm?token_hash=...&type=signup`으로 설정 필요.

### M2 — 미착수

성취 카드 생성은 `quality` 모델 + STAR 구조화. `achievement_cards` 테이블/RLS는 M1에서 생성 완료.

@AGENTS.md
