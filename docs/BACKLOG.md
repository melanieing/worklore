# BACKLOG.md — Worklore 개발 백로그

> 제품 정의는 `PRODUCT_SPEC.md`, 작업 컨벤션은 루트 `CLAUDE.md` 참조.
> 이 문서는 **전체 개발 과정의 단일 백로그**다. 작업 완료 시 체크박스를 갱신하고,
> 마일스톤 단위 회고/결정사항은 CLAUDE.md의 "마일스톤 진행 상황"에 누적한다.
>
> 상태 표기: `[x]` 완료 · `[ ]` 미착수 · `[~]` 진행 중
> 작업 ID는 `M{마일스톤}-{번호}` 형식. PR/커밋에서 ID를 참조한다.

## 전체 흐름 한눈에 보기

```
M0 셋업 ──▶ M1 스키마/Auth/기록+역질문 ──▶ M2 성취 카드 ──▶ M2.5 이력서 임포트 ──▶ M3 불릿/Export/결제 ──▶ M4 음성/요약 이메일 ──▶ 출시
(완료)        (완료)                        │                 │                        │
                                           └─ "보여줄 수 있는" 제품   └─ 콜드 스타트 해결    └─ "팔 수 있는" 제품
```

핵심 루프(기록 → 역질문 → 답변 → 카드 → 불릿)가 마일스톤 순서 그대로다.
각 마일스톤은 배포 가능한 상태로 끝나야 한다.

---

## M0 — 프로젝트 셋업 ✅ (2026-06-10)

- [x] M0-1 Next.js 16 + Tailwind v4 + TypeScript strict 스캐폴딩 (pnpm)
- [x] M0-2 Supabase CLI 셋업 (devDependency, `pnpm supabase ...`)
- [x] M0-3 git 저장소 초기화, conventional commits 시작
- [x] M0-4 `.env.example` / `.env.local` 환경변수 체계

## M1 — 스키마 + Auth + 기록 입력 + AI 역질문 루프 ✅ (2026-06-10)

- [x] M1-1 데이터 모델 마이그레이션 (PRODUCT_SPEC §6 전체 테이블 + RLS)
  - entries immutable 트리거, qa answer 1회 기록, usage_counters 트리거 증가
  - 로컬 Supabase에서 트리거 동작 검증 완료
- [x] M1-2 이메일/비밀번호 Auth (가입·로그인·로그아웃·이메일 확인 콜백)
- [x] M1-3 세션 갱신 proxy (`src/proxy.ts`) + 비로그인 리다이렉트
- [x] M1-4 기록 입력 페이지 (텍스트, entry_date 선택)
- [x] M1-5 AI 역질문 생성 (Haiku 라우팅, 1~3개, 구조화 출력, 프롬프트 v1 분리)
- [x] M1-6 역질문 답변 스레드 UI (저널 상세)
- [x] M1-7 저널 목록 페이지
- [ ] M1-8 소셜 로그인 (Google) — *M1에서 이연. 출시 준비(L-2) 전까지 완료*

## M2 — 성취 카드 생성/편집 + 타임라인 뷰

> 목표: 원데이터(entries + qa_exchanges)에서 STAR 성취 카드를 생성하고
> 사용자가 다듬을 수 있다. 여기부터 제품의 "산출물"이 보인다.

- [x] M2-0 AI 프로바이더 추상화 — Vercel AI SDK로 `src/lib/ai/` 이관, 모델 env 주입
  - LLM 벤더 중립 결정(`docs/COSTS.md`) 반영. 기본 라우팅: light=gpt-5-nano, quality=gemini-2.5-flash
  - 라우팅 함수는 `plan` 인자를 받는다 (Free/Pro 플랜별 품질 라우팅 — COSTS.md §2 결정)
  - `getModel(task, plan)` / 모델 spec 형식 `provider:model-id` (env: AI_MODEL_LIGHT/QUALITY/QUALITY_PRO)
- [ ] M2-1 카드 생성 프롬프트 v1 (`prompts/achievement-card.v1.ts`)
  - 입력: entry 원문 + 문답 스레드 / 출력: STAR + metrics + skills + 기간 (구조화 출력)
  - quality 라우팅, 카드 생성은 entry 단위로 시작 (멀티 entry 병합은 M2-6)
- [ ] M2-2 카드 생성 서버 액션 + `source_entry_ids` 추적성 보장
  - 답변 완료 시점(또는 수동 버튼)에 draft 카드 생성
- [ ] M2-3 카드 편집 UI (제목/STAR 필드/metrics/skills, draft → confirmed 전환)
- [ ] M2-4 타임라인 뷰 (`/timeline`) — 카드를 기간순 정렬, project_tag 필터
- [ ] M2-5 카드 재생성 — 원데이터에서 언제든 다시 생성 (기존 카드 보존/대체 선택)
  - "고품질 재생성"(상위 모델) 포함 — Pro 게이팅은 M3-7에서
- [ ] M2-6 같은 프로젝트 entry 누적 시 기존 카드 갱신 제안 (병합 로직)
- [ ] M2-7 자동 태깅 (project_tag, skills) — light 모델 라우팅
- [ ] M2-8 역질문 "힌트 요청" — 질문당 1회, light 모델 (2026-06-10 합의)
  - 마이그레이션: `qa_exchanges.hint` 컬럼 추가 + answer-once 트리거에 hint 1회 허용 반영
  - 프롬프트 `prompts/answer-hint.v1.ts` — 그 질문에 대한 답변 예시/정량화 가이드
  - 단방향 인터뷰 유지 — 자유 질문 UI 금지 (코치 모드는 V2+ 파킹랏)

**완료 기준**: 기록 3개 → 카드 생성 → 편집 → confirmed → 타임라인에서 확인까지 끊김 없이 동작.

## M2.5 — 기존 이력서 임포트 (콜드 스타트 해결)

> 목표: 가입 직후 빈 타임라인 문제 해결. 기존 이력서를 업로드하면 5분 안에
> 성취 카드가 채워진 타임라인을 본다. (2026-06-10 합의, PRODUCT_SPEC §5)

- [ ] M2.5-1 마이그레이션 — `resume_imports` 테이블 + `achievement_cards.source_import_id`
  (파일·추출 텍스트 immutable 보존, RLS)
- [ ] M2.5-2 파일 업로드 (PDF/DOCX → Supabase Storage, 다중 파일 지원)
- [ ] M2.5-3 AI 추출 — 멀티모달 LLM에 파일 직접 입력 → draft 카드 일괄 생성
  (quality 라우팅, 별도 파싱 인프라 구축 금지)
- [ ] M2.5-4 추출 카드 검토 UI — 일괄 확인/편집/삭제 후 확정 (AI가 멋대로 확정 금지)
- [ ] M2.5-5 온보딩 통합 — 가입 직후 "기존 이력서 있어요?" 단계 (건너뛰기 가능)
- [ ] M2.5-6 상시 임포트 진입점 (설정/이력서 화면) + 재임포트 시 중복 카드 감지·병합 제안

**완료 기준**: 신규 가입 → 이력서 PDF 업로드 → draft 카드 검토·확정 → 타임라인에
과거 경력이 채워짐. 같은 파일 재업로드 시 중복 카드가 생기지 않음.

## M3 — 이력서 불릿 + Export + Stripe 유료벽

> 목표: "이직 결심 순간"의 과금 트리거 완성. 여기부터 매출이 가능하다.

- [ ] M3-1 불릿 생성 프롬프트 v1 (confirmed 카드 → 정량 중심 불릿, tone 2종, version 관리)
- [ ] M3-2 불릿 생성/재생성 UI (카드 상세에서)
- [ ] M3-3 Markdown export (resume_bullets + 카드 스냅샷 → exports 테이블 기록)
- [ ] M3-4 PDF export (서버 사이드 렌더링, 단일 기본 템플릿 — 디자인 다양화는 V2)
- [ ] M3-5 Freemium 제한 enforcement — 월 기록 횟수 제한 (usage_counters 기반, 한도는 env/DB 변수화)
- [ ] M3-6 Stripe 연동 — Checkout + customer portal + webhook (plan 컬럼 갱신)
  - 가격은 env/DB로 변수화 (A/B 대비, PRODUCT_SPEC §8)
- [ ] M3-7 유료벽 게이팅 — export·불릿 생성·고품질 재생성을 Pro 뒤로, 업그레이드 유도 UI
  - Pro = 상위 모델 라우팅 ("더 정교한 카드/불릿"으로 표현, 모델명 노출 금지)
- [ ] M3-8 플랜/사용량 표시 (설정 페이지)

**완료 기준**: Free 유저가 한도 도달 → 업그레이드 → 결제 → export까지 전 과정 동작 (Stripe test mode).

## M4 — 음성 입력 + 월간 임팩트 요약

> 목표: 리텐션 설계의 핵심 2종 — 입력 마찰 최소화(음성)와 보상 루프(월간 요약).

- [ ] M4-1 브라우저 녹음 (MediaRecorder) + 업로드 (Supabase Storage, audio_url)
- [ ] M4-2 외부 STT API 연동 (자체 구축 금지) → raw_text 변환 후 기존 역질문 루프 재사용
- [ ] M4-3 음성 entry UI 통합 (녹음 → 전사 확인/수정 → 저장)
- [ ] M4-4 월간 임팩트 요약 생성 (해당 월 카드/기록 집계, quality 모델)
- [ ] M4-5 Resend 트랜잭션 이메일 (요약 발송, 수신 거부 설정)
- [ ] M4-6 월간 요약 스케줄링 (Vercel Cron 또는 Supabase pg_cron)
- [ ] M4-7 첫 보상 루프 — 기록 2주 누적 시 첫 요약 즉시 제공 (PRODUCT_SPEC §3)

**완료 기준**: 퇴근길 시나리오(모바일 웹에서 2분 녹음 → 역질문 답변)와 월간 요약 이메일 수신.

## L — 출시 준비 (Launch)

- [ ] L-1 프로덕션 Supabase 프로젝트 + `supabase db push` + Auth 이메일 템플릿
  (`/auth/confirm?token_hash={{ .TokenHash }}&type=signup`)
- [ ] L-2 소셜 로그인 활성화 (M1-8) + OAuth redirect 설정
- [ ] L-3 Vercel 배포 파이프라인 (preview/production, env 분리)
- [ ] L-4 도메인/상표 확정 — worklore.com / worklore.ai 가용성 확인 (PRODUCT_SPEC §9, 코드 외 작업)
- [ ] L-5 랜딩 페이지 + "brag document" 키워드 SEO 기본 (메타/OG/sitemap)
- [ ] L-6 분석 도구 (가입 퍼널, D7/D30 리텐션, 핵심 루프 완주율 추적)
- [ ] L-7 법적 문서 (이용약관, 개인정보처리방침 — 일기 데이터 민감성 명시)
- [ ] L-8 에러 모니터링 (Sentry 등) + AI 비용 모니터링 (사용자당 월 $0.5 목표 검증)

## Q — 품질/운영 (마일스톤과 병행, 상시)

- [ ] Q-1 `supabase gen types typescript`로 수동 타입(`src/lib/types.ts`) 대체
- [ ] Q-2 핵심 루프 E2E 테스트 (Playwright: 가입 → 기록 → 답변 → 카드)
- [ ] Q-3 AI 모듈 단위 테스트 (프롬프트 회귀 — 역질문 개수/품질 스냅샷)
- [ ] Q-4 CI (lint + tsc + build + test, GitHub Actions)
- [ ] Q-5 레이트 리밋 (AI 호출 남용 방지, 서버 액션 단)
- [ ] Q-6 i18n 구조 정비 — ko 로케일 추가 준비 (V1.5)

## V2+ 파킹랏 (V1 비범위 — 구현 금지, 아이디어만 적재)

- **채용공고 맞춤 테일러링 — V2 핵심 수익화 기능** (2026-06-10 구체화, PRODUCT_SPEC §5)
  - 공고 분석 → 요구 역량 추출 → 성취 카드 매칭 → 맞춤 문서 생성
    (이력서/경력기술서/포트폴리오/자소서, 로케일별 문서 종류)
  - 일반 추출 = Pro 기본 / 공고 맞춤 = 추가 과금 (상위 티어 or 공고당 크레딧, A/B)
  - 매칭 품질 = 쌓인 카드 의존 → V1 데이터 축적 루프가 선행 조건
- 이력서 템플릿 디자인 다양화
- Jira/GitHub/캘린더 연동 (V2 차별화 카드)
- 팀/B2B — 매니저 공유, 성과 리뷰 모드
- 모바일 네이티브 앱
- 커리어 코치 모드 — 카드/타임라인 컨텍스트 기반 자유 질의응답 (Pro 차별화 후보)
- 성과 리뷰 시즌 캠페인 자동화 (마케팅)

---

## 운영 규칙

1. **마일스톤 순서를 지킨다.** 각 마일스톤은 배포 가능한 상태로 끝난다.
2. 작업 시작 시 `[ ]` → `[~]`, 완료 시 `[x]` + 필요하면 한 줄 메모.
3. 마일스톤 완료 시: 이 문서 체크 + CLAUDE.md "마일스톤 진행 상황"에 결정사항/주의사항 누적.
4. 새 아이디어는 V1 범위면 해당 마일스톤에 ID 부여, 아니면 V2+ 파킹랏으로.
