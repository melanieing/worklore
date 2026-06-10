# DESIGN.md — Worklore 브랜드 & 디자인 시스템

> 2026-06-10 제정. UI 작업 전 반드시 이 문서를 확인한다.
> 토큰 변경은 이 문서 → 코드(`globals.css` @theme) → 스토리보드 순으로 동기화.

## 1. 브랜드 에센스

**"커리어가 서사(lore)가 된다."**
Worklore는 도구라기보다 기록자다 — 종이 위에 보라 잉크로 쓰는 커리어 연대기.

- 무드: 따뜻한 종이 + 깊은 보라 잉크. 차가운 SaaS 대시보드가 아니라 잘 만든 노트.
- 디스플레이는 세리프(서사·기록의 무드), UI 본문은 산세리프(도구의 명료함).
- 보라는 **잉크처럼 절제해서** 쓴다. 넓은 면은 항상 종이(paper/white)다.

## 2. 컬러 팔레트

### 코어

| 토큰 | HEX | 용도 |
|---|---|---|
| `ink` | `#241F33` | 본문 텍스트, 주 버튼 배경 (보라 기운의 먹색) |
| `paper` | `#FAF8F5` | 앱 배경 (따뜻한 크림) |
| `surface` | `#FFFFFF` | 카드/입력 배경 |
| `line` | `#E6E1ED` | 보더, 디바이더 (라벤더 기운 그레이) |
| `muted` | `#6E6880` | 보조 텍스트 (보라 기운 그레이) |

### 브랜드 (보라 계열)

| 토큰 | HEX | 용도 |
|---|---|---|
| `iris` (primary) | `#6D28D9` | 주 CTA, 링크, AI 인터뷰어 시그니처 |
| `plum` (primary-deep) | `#4C1D95` | 호버/프레스, 강조 헤딩 |
| `lavender` (primary-soft) | `#F1ECFB` | AI 말풍선 배경, 선택 상태, 정보 칩 |
| `berry` | `#A21CAF` | V2 공고 맞춤·마케팅 하이라이트 (보라의 자매색) |
| `berry-soft` | `#FAE8FF` | berry 의 배경 톤 |

### 시맨틱

| 토큰 | HEX | 용도 |
|---|---|---|
| `gold` / `gold-soft` | `#B45309` / `#FEF3E2` | Pro·프리미엄·draft 상태 |
| `green` / `green-soft` | `#047857` / `#ECFDF3` | confirmed·성공·지표 상승 |
| `red` | `#DC2626` | 녹음 중, 삭제, 경고 (이것 외 용도 금지) |

### 사용 규칙

1. **보라 면적 총량 제한** — 화면의 ~10% 이하. CTA·링크·AI 말풍선·포인트에만.
   넓은 배경을 보라로 채우지 않는다 (generic AI 클리셰 방지).
2. **그라데이션 금지.** 특히 보라 그라데이션. 단색 + 여백으로 승부한다.
3. AI(인터뷰어)가 말하는 요소는 lavender 배경 + iris 포인트 — "AI의 시그니처 색".
4. 돈과 관련된 것(Pro, 유료벽, draft)은 gold. 확정된 성취는 green.
   사용자가 색만 봐도 상태를 알게 한다.
5. 다크 모드는 V1 보류 (토큰 구조는 대비 준비됨).

## 3. 타이포그래피

| 역할 | 서체 | 비고 |
|---|---|---|
| 디스플레이 (로고, 헤드라인) | **Fraunces**, Georgia, serif | 서사·기록의 무드. 이탤릭 포인트 허용 |
| UI 본문 | system-ui 스택 (EN) / Pretendard, Apple SD Gothic Neo (KO) | 명료함 우선 |
| 숫자 (지표) | `font-variant-numeric: tabular-nums` | 지표가 주인공인 제품 — 숫자는 항상 정렬 |

- 본문 13~14px, 행간 1.5~1.6. 헤드라인은 크게 쓰되 굵기보다 서체 대비로 위계.

## 4. 보이스 & 톤

**"다정한 인터뷰어, 호들갑 없는 코치."**

| 원칙 | Do | Don't |
|---|---|---|
| 죄책감 금지 (제품 원칙 4) | "주 2~3회면 충분해요" | "3일째 기록이 없어요!" / 스트릭·연속 기록 |
| 사용자의 숫자가 주인공 | "p95 75% 단축 — 이력서급 성과예요" | "AI가 놀라운 성과를 만들어냈어요!" |
| 짧고 담백하게 | "이거, 성취 같은데요." | 과장 수식어 ("혁신적인", "마법같은") |
| 질문은 구체적으로 | "전후 수치를 아세요? 대략이라도 좋아요" | "더 자세히 말해주세요" |
| 기술 내부 노출 금지 | "더 정교한 카드" (Pro 설명) | 모델명·토큰·프롬프트 등 노출 |

- 영어(V1)는 친근한 2인칭, 한국어(V1.5)는 해요체. 반말 금지.
- 이모지는 기능적 포인트(💡 힌트, 📬 요약)로만 — 문장마다 붙이지 않는다.

## 5. 컴포넌트 규칙

| 요소 | 규칙 |
|---|---|
| 버튼 | radius 10px. 주 CTA = iris, 보조 = surface + line 보더, 위험 = red. 한 화면에 주 CTA는 1개 |
| 카드 | radius 14px, line 보더, 그림자는 모달/부유 요소만 |
| 칩/배지 | pill (radius 99px). 상태색 규칙(§2-4) 준수 |
| AI 말풍선 | lavender 배경, 좌하단 radius 4px (말꼬리), 사용자 답변은 paper + 우하단 4px |
| 입력 | surface 배경, line 보더, 포커스 시 iris 보더 |
| 여백 | 섹션 간 32px+, 요소 간 12~16px. 빽빽함보다 호흡 |

## 6. 코드 적용 (Tailwind v4)

`src/app/globals.css`의 `@theme`에 토큰으로 등록해서 사용한다 (하드코딩 금지):

```css
@theme {
  --color-ink: #241f33;
  --color-paper: #faf8f5;
  --color-line: #e6e1ed;
  --color-muted: #6e6880;
  --color-iris: #6d28d9;
  --color-plum: #4c1d95;
  --color-lavender: #f1ecfb;
  --color-berry: #a21caf;
  --color-berry-soft: #fae8ff;
  --color-gold: #b45309;
  --color-gold-soft: #fef3e2;
  --color-green: #047857;
  --color-green-soft: #ecfdf3;
}
```

→ `bg-paper`, `text-ink`, `bg-iris`, `border-line` 형태로 사용.
적용 작업은 BACKLOG Q-7. 스토리보드(docs/storyboard*.html)는 이 팔레트의 시각 레퍼런스다.

## 7. 로고 & 아이콘

**컨셉: "W는 잉크로 그린 커리어 그래프다."**
W의 지그재그 = 라인 차트. 마지막 획은 시작점보다 높이 올라가고(상승하는 커리어),
그 끝에 아직 선이 닿지 않은 **금색 점 하나** = 다음 성취가 기다린다.

- 원본(SSOT): `src/app/icon.svg` — iris 배경 + paper 잉크 스트로크 + 금색 점.
  Next.js가 파비콘으로 자동 서빙.
- `gold-bright #FBBF24` — **아이콘/다크 배경 전용** 보조 토큰 (본문 gold `#B45309`는
  iris 위에서 대비가 부족해 아이콘에서만 밝은 톤 사용).
- 변형 규칙: 단색 버전은 iris 모노 / 화이트 모노만 허용. 그라데이션·광택·그림자 금지.
- 워드마크: 세리프(Fraunces 계열) "Worklore", W는 마크의 형태 언어와 통일.
  고해상 래스터(마케팅·스토어용)는 이미지 생성으로 제작 — 프롬프트는 아래 유지.

<details><summary>이미지 생성 프롬프트 (마케팅용 고해상 버전)</summary>

앱 아이콘:
> Flat vector app icon, rounded square with deep violet (#6D28D9) background. A single cream (#FAF8F5) calligraphic ink brush stroke forming the letter "W" that also reads as a rising line chart — the final stroke ends higher than it starts. A small warm gold (#FBBF24) dot floats at the upper right, like the next data point not yet connected. Very subtle paper grain. Strictly flat: no gradients, no gloss, no 3D, no drop shadows, no text. Centered, generous margins, iOS app icon style, 1024x1024.

워드마크:
> Minimal wordmark logo: the word "Worklore" set in an elegant high-contrast serif (Fraunces-like), deep violet ink (#6D28D9) on warm cream paper (#FAF8F5). The initial W's diagonal strokes subtly echo a rising line chart, ending with a tiny gold (#FBBF24) dot above the final stroke of the W. Flat, refined, editorial book-cover quality. No gradients, no icons besides the W detail, no taglines.

OG/소셜 이미지 (1200×630):
> Editorial illustration on warm cream paper (#FAF8F5): handwritten violet ink (#6D28D9) journal lines on the left gradually transforming into a clean rising line chart with gold (#FBBF24) data points on the right — "daily notes become career proof". Generous whitespace, flat vector style with subtle ink texture, no gradients, no glossy effects, no people, no UI screenshots. Leave the right third calm for overlay text.

</details>
