# worklore

매일 5분, AI 커리어 인터뷰어

직장에서 있었던 일을 가볍게 기록하면, AI가 인터뷰어처럼 역질문해 정량 지표를
캡처하고 성취 카드 → 이력서로 누적해주는 서비스.

- 제품 스펙: [docs/PRODUCT_SPEC.md](docs/PRODUCT_SPEC.md)
- 개발 백로그: [docs/BACKLOG.md](docs/BACKLOG.md)
- 비용 전략: [docs/COSTS.md](docs/COSTS.md)

## 개발 환경

요구사항: Node 22+, pnpm, Docker (로컬 Supabase)

```bash
pnpm install
pnpm supabase start        # 로컬 Supabase (마이그레이션 자동 적용)
cp .env.example .env.local # 키 채우기 — 로컬 Supabase 키는 supabase start 출력 참조
pnpm dev                   # http://localhost:3000
```

검증:

```bash
pnpm lint && pnpm exec tsc --noEmit && pnpm build
```

## 스택

TypeScript · Next.js (App Router) · Tailwind · Supabase (Postgres/Auth/RLS) ·
LLM 프로바이더 중립(작업별 최저가 라우팅) · Vercel · Stripe · Resend

## License

[MIT](LICENSE)
