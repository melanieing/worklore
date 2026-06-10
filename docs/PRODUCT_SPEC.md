# PRODUCT_SPEC.md — Worklore

> 이 문서는 기획 대화(2026-06-10)에서 합의된 내용의 단일 소스(SSOT)입니다.
> Claude Code는 기능 구현 전 반드시 이 문서의 해당 섹션을 확인합니다.

## 1. 문제 정의

직장인은 일에 치여 6개월~수년이 지나가고, 이직 시점에 이력서를 업데이트하려 하면
과거 프로젝트의 정량 지표·임팩트가 기억나지 않는다. 결과적으로 이력서 작성에
시간이 오래 걸리고 품질이 낮아진다. 정량 지표는 **시간이 지나면 복원 불가능한
데이터**다 — 일이 일어난 시점에는 대시보드/문서에 접근 가능하므로 답할 수 있지만,
6개월 뒤에는 불가능하다.

## 2. 솔루션과 핵심 차별화

영어권에는 "brag document" 문화와 경쟁 제품군(BragBook, bragdocument.io,
TrackToBrag, BragJournal)이 이미 존재한다 → 시장 검증됨. 단, 기존 제품은
(a) 구조화된 성취를 사용자가 직접 입력(부담 큼)하거나 (b) GitHub/Jira 메타데이터를
자동 수집(맥락·임팩트 누락)한다.

**Worklore의 차별화 = AI 실시간 역질문 루프.**
사용자가 줄글로 기록하면 AI가 즉시 인터뷰어처럼 1~3개의 follow-up 질문을 던져,
지표가 가장 신선한 시점에 정량 데이터를 캡처한다.

포지셔닝: "자동 이력서 툴"이 아니라 **"매일 5분, AI 커리어 인터뷰어"**.
이력서는 산출물 중 하나다.

## 3. 최대 리스크와 설계 대응

최대 리스크는 기술이 아니라 **리텐션(습관 형성)**. 일기 앱의 D30 리텐션은 낮다.

대응 설계:
1. 빈 페이지 금지 — AI가 먼저 묻는 대화형 입력이 기본, 줄글은 옵션
2. 음성 입력 1순위 (퇴근길 2분 녹음)
3. 주 2~3회로 충분하다는 제품 톤 (매일 강요 → 죄책감 → 이탈)
4. 빠른 보상 루프 — 2주 기록 시 "이번 달 임팩트 요약" 제공

## 4. 핵심 루프 (Core Loop)

```
[기록] 사용자가 텍스트/음성으로 오늘 일을 기록
   ↓
[역질문] AI가 1~3개 follow-up 질문 (정량 지표 우선: 전후 수치, 규모, 기간, 비용/매출)
   ↓
[답변] 사용자가 답변 (당시에는 자료 접근 가능 → 정확도 높음)
   ↓
[저장] 일기 원문 + 문답 전체를 원데이터로 immutable 저장
   ↓
[구조화] AI가 STAR 형식 성취 카드(Achievement Card) 생성/갱신
   ↓
[산출] 성취 카드 → 이력서 불릿 생성, Markdown/PDF export
```

## 5. MVP 범위

### V1 포함
- 이메일/소셜 Auth (Supabase Auth)
- 대화형 기록 입력: 텍스트 + 음성(STT)
- 기록 직후 AI 역질문 1~3개 + 답변 스레드
- 원데이터 보존: entries + qa_exchanges immutable 저장
- 성취 카드: AI 생성 + 사용자 편집, 타임라인 뷰
- 이력서 불릿 생성 + Markdown/PDF export
- Freemium: 월 기록 횟수 제한, export는 유료 (Stripe)
- 월간 임팩트 요약 이메일 (Resend)

### V1 제외 (명시적 비범위)
- 이력서 템플릿 디자인 다양화 — 기존 빌더가 잘함, export로 대체
- Jira/GitHub/캘린더 연동 — V2 차별화 카드로 보류
- 채용공고 맞춤 테일러링 — V2
- 팀/B2B(매니저 공유, 성과 리뷰) — V2+
- 모바일 네이티브 앱 — V1은 반응형 웹(PWA 수준)

## 6. 데이터 모델 (PostgreSQL / Supabase)

모든 테이블: `id uuid pk`, `created_at`, `user_id fk → auth.users`, RLS 필수.

```
profiles          : display_name, locale, job_title, timezone, plan(free|pro)
entries           : raw_text, source(text|voice), audio_url?, entry_date
                    -- 일기 원문. UPDATE 금지(immutable), 정정은 새 entry
qa_exchanges      : entry_id fk, question, answer?, asked_by(ai), answered_at?
                    -- 역질문 스레드. answer도 원데이터로 보존
achievement_cards : title, situation, task, action, result,
                    metrics jsonb[], skills text[], project_tag,
                    period_start, period_end, status(draft|confirmed),
                    source_entry_ids uuid[]   -- 원데이터 추적성
resume_bullets    : card_id fk, text, tone(concise|detailed), version int
exports           : type(md|pdf), file_url, snapshot jsonb
usage_counters    : month, entries_count  -- freemium 제한용
```

원칙: `achievement_cards` 이하의 모든 파생물은 `entries`+`qa_exchanges`에서
언제든 재생성 가능해야 한다 (AI 모델 업그레이드 시 일괄 재처리 가능).

## 7. AI 설계

| 작업 | 모델 등급 | 비고 |
|---|---|---|
| 역질문 생성 | 소형 (저비용) | 지표 캡처 질문 우선순위 로직 포함 |
| 태깅/분류 | 소형 | 프로젝트·스킬 자동 태깅 |
| 성취 카드 생성 | 상위 (고품질) | STAR 구조화, metrics 추출 |
| 이력서 불릿 생성 | 상위 | 간결/정량 중심 톤 |

- 프롬프트는 `/lib/ai/prompts/` 에 파일로 버전 관리
- 역질문 우선순위: ① 전후 비교 수치 ② 규모(트래픽/금액/인원) ③ 기간/효율 ④ 정성 임팩트
- 비용 목표: 사용자당 월 AI 원가 < $0.5

## 8. 비즈니스 모델 / GTM (참고용 — 코드 구현 시 가격 변수화)

- 타깃: 글로벌, 1차 페르소나 = 개발자/PM/퍼포먼스 마케터 (이직 사이클 빠르고 정량 문화 강함)
- 가격: Free(월 기록 제한) / Pro 월 $6~8 수준 — A/B 가능하도록 Stripe 가격을 환경변수/DB로 관리
- 과금 트리거: "이직 결심 순간" → 이력서 생성·export를 유료 벽 뒤에
- 마케팅 모멘트: 성과 리뷰 시즌(연말·연초), "brag document" 키워드 SEO

## 9. 네이밍 결정 기록

- 확정: **Worklore** — "lore"(개인 서사) 밈 컨텍스트 + "일이 곧 서사가 된다"
- 탈락: Feats(덴마크 커리어 스타트업 Feats와 카테고리 충돌), brag* 계열(포화+뉘앙스)
- TODO(코드 외 작업): worklore.com / worklore.ai 도메인 및 상표 가용성 최종 확인
