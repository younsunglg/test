# RSS Feed Dashboard 구현 계획

## Architecture Decisions

| 결정 사항 | 선택 | 사유 |
|-----------|------|------|
| 클라이언트 데이터 페칭 | SWR | 경량, stale-while-revalidate, Next.js 궁합, client-swr-dedup 규칙 적용 가능 |
| 클라이언트 상태 | zustand | 탭·북마크·메모·소스 목록을 전역 관리. localStorage 미들웨어로 영속 |
| RSS·외부 API 프록시 | Next.js Route Handler | CORS 우회. Alpha Vantage·ApeWisdom·Reddit 모두 서버사이드 경유 |
| 영속 저장 | localStorage | 서버 불필요. 소스 목록·북마크·메모 저장 |
| 검색 | fuse.js | 클라이언트 퍼지 검색. 서버 왕복 없이 즉시 필터링 |
| 기본 소스 | 코드 내 하드코딩 | Reuters + CNBC RSS URL을 DEFAULT_SOURCES 상수로 정의 |

## Required Skills

| 스킬 | 용도 |
|------|------|
| `vercel-react-best-practices` | 데이터 페칭·렌더링·번들 최적화 규칙 준수 |
| `web-design-guidelines` | UI 컴포넌트 접근성·인터랙션 가이드라인 준수 |

## UI Components

### 설치 필요

| 컴포넌트 | 설치 명령 |
|----------|-----------|
| Tabs | `npx shadcn@latest add tabs` |
| Skeleton | `npx shadcn@latest add skeleton` |
| Alert | `npx shadcn@latest add alert` |

### 이미 설치됨

Button, Input, Badge, Card, Dialog, Textarea, Label, Select, Separator

### 커스텀 컴포넌트

| 컴포넌트 | 역할 |
|----------|------|
| `NewsCard` | 소스 배지 + Sentiment 배지 + 북마크/메모 아이콘 + 제목 + 메모 미리보기 |
| `SourceAddForm` | RSS URL 입력 + 유효성 검사 + 오류 메시지 |
| `RedditPanel` | WSB Top 종목 리스트 + r/investing 게시글 + API 오류 상태 |

## 실행 프로토콜

- 각 task 시작 전, **참조 규칙**에 나열된 파일을 반드시 읽고 규칙을 준수하며 구현한다

## Tasks

### Task 0: 의존성 및 shadcn 컴포넌트 설치

- **시나리오**: (선행 작업 — spec 테스트 작성 전 빌드 환경 필요)
- **참조 규칙**: `rules/bundle-barrel-imports.md`, `rules/bundle-dynamic-imports.md`
- **구현 대상**:
  - `bun add swr zustand fuse.js rss-parser date-fns nanoid` 실행
  - `npx shadcn@latest add tabs skeleton alert` 실행
  - `bun run build` 에러 없이 완료
- **수용 기준**:
  - [ ] `package.json`에 swr, zustand, fuse.js, rss-parser, date-fns, nanoid 추가
  - [ ] `components/ui/tabs.tsx`, `skeleton.tsx`, `alert.tsx` 생성
  - [ ] `bun run build` 성공
- **커밋**: `chore: install swr zustand fuse.js rss-parser and shadcn components`

---

### Task 1: Spec 테스트 생성 (Red)

- **시나리오**: RSSDASH-001 ~ 016 (전체)
- **참조 규칙**: `rules/rendering-conditional-render.md`, `rules/rendering-hydration-no-flicker.md`
- **구현 대상**: `app/rss-feed-dashboard/page.spec.test.tsx` — spec.yaml의 16개 시나리오를 수용 기준 테스트로 작성
- **수용 기준**:
  - [ ] `bun run test` 실행 시 16개 테스트 모두 실패 (Red 상태)
  - [ ] RSSDASH-001: `getByRole('tab', { name: 'All' })` 존재 확인
  - [ ] RSSDASH-014: `getByRole('status')` 로딩 스피너 존재 확인
  - [ ] RSSDASH-003: URL 빈 상태 추가 버튼 클릭 → `getByText('URL을 입력해주세요')` 확인
  - [ ] RSSDASH-007: 검색창에 'zzzznotfound' 입력 → `getByText('검색 결과가 없습니다')` 확인
  - [ ] RSSDASH-008: 북마크 아이콘 클릭 → `bookmark-check` 아이콘 존재 확인
  - [ ] RSSDASH-016: Reddit API 오류 → `getByText('Reddit 데이터를 불러올 수 없습니다')` + 재시도 버튼 확인
- **커밋**: `test: add spec tests for rss-feed-dashboard (RSSDASH-001~016)`

---

### Task 2: 데이터 모델 & zustand 스토어

- **시나리오**: RSSDASH-001, 008, 009, 010
- **참조 규칙**: `rules/client-localstorage-schema.md`, `rules/rerender-derived-state.md`, `rules/js-set-map-lookups.md`
- **구현 대상**:
  - `lib/types.ts` — RssSource, NewsItem, BookmarkEntry 타입 정의
  - `lib/store.ts` — zustand 스토어 (sources, bookmarks, memos, activeTab, searchQuery)
  - localStorage 미들웨어로 sources·bookmarks·memos 영속화
  - DEFAULT_SOURCES 상수 (Reuters + CNBC RSS URL)
- **수용 기준**:
  - [ ] `RssSource` 타입: `{ id, name, url, addedAt }` 필드 포함
  - [ ] `NewsItem` 타입: `{ id, sourceId, title, link, publishedAt, sentiment, tickers }` 필드 포함
  - [ ] `BookmarkEntry` 타입: `{ articleId, memo, bookmarkedAt }` 필드 포함
  - [ ] localStorage key `rss-dashboard-v1`로 스토어 영속화 (client-localstorage-schema 규칙 준수)
  - [ ] DEFAULT_SOURCES에 Reuters·CNBC URL 포함
- **커밋**: `feat: add data model types and zustand store`

---

### Task 3: Route Handlers — RSS 프록시 & Alpha Vantage

- **시나리오**: RSSDASH-001, 002, 014
- **참조 규칙**: `rules/async-parallel.md`, `rules/async-api-routes.md`, `rules/server-parallel-fetching.md`, `rules/server-cache-react.md`
- **구현 대상**:
  - `app/api/rss/route.ts` — `?url=` 파라미터로 RSS 피드를 파싱해 JSON 반환
  - `app/api/sentiment/route.ts` — `?topics=` 파라미터로 Alpha Vantage NEWS_SENTIMENT API 호출
  - 복수 소스 동시 페치 시 `Promise.all()` 사용 (async-parallel 규칙)
- **수용 기준**:
  - [ ] `GET /api/rss?url=https://feeds.reuters.com/reuters/businessNews` → `{ items: [...] }` JSON 반환
  - [ ] `GET /api/sentiment?topics=AAPL` → `{ feed: [{ title, sentiment_score, ticker_sentiment }] }` 반환
  - [ ] 유효하지 않은 URL → 400 상태 코드 반환
  - [ ] Alpha Vantage API 키 누락 시 → 503 상태 코드 반환
- **커밋**: `feat: add RSS proxy and Alpha Vantage sentiment Route Handlers`

---

### Task 4: Route Handlers — Reddit & ApeWisdom 프록시

- **시나리오**: RSSDASH-012, 013, 016
- **참조 규칙**: `rules/async-parallel.md`, `rules/server-parallel-fetching.md`
- **구현 대상**:
  - `app/api/reddit/route.ts` — ApeWisdom WSB Top + Reddit r/investing 최신글 동시 페치
  - API 실패 시 `{ error: true, message: "..." }` 형태로 일관된 오류 응답 반환
- **수용 기준**:
  - [ ] `GET /api/reddit` → `{ wsb: [{rank, ticker, mentions}], investing: [{title, url, score, numComments}] }` 반환
  - [ ] ApeWisdom API 오류 시 → `{ error: true, message: "Reddit 데이터를 불러올 수 없습니다" }` 반환
  - [ ] WSB Top 항목 5개 이상 포함
  - [ ] r/investing 게시글 3개 이상 포함
- **커밋**: `feat: add Reddit and ApeWisdom Route Handler`

---

### Task 5: 뉴스 피드 UI — 기본 레이아웃 & 탭 (Green)

- **시나리오**: RSSDASH-001, 005, 014
- **참조 규칙**: `rules/rendering-hydration-no-flicker.md`, `rules/rerender-no-inline-components.md`, `rules/rendering-conditional-render.md`, `rules/client-swr-dedup.md`, `web-design-guidelines` (https://raw.githubusercontent.com/vercel-labs/web-interface-guidelines/main/command.md)
- **구현 대상**:
  - `app/rss-feed-dashboard/page.tsx` — 메인 페이지 (shadcn Tabs로 탭 전환)
  - `components/news-card.tsx` — NewsCard 커스텀 컴포넌트 (소스 Badge, Sentiment Badge, 제목, 발행시각, 북마크/메모 버튼)
  - SWR로 `/api/rss` 페치, Skeleton으로 로딩 상태 표시
- **수용 기준**:
  - [ ] RSSDASH-001: `All` · `Reuters` · `CNBC` · `북마크` Tabs 렌더링 확인
  - [ ] RSSDASH-001: All 탭에 두 소스 기사가 발행 시각 내림차순 표시
  - [ ] RSSDASH-014: 로딩 중 Skeleton 카드 표시, 완료 후 NewsCard 표시
  - [ ] RSSDASH-005: Reuters 탭 클릭 → Reuters 기사만 표시
  - [ ] `bun run test` — RSSDASH-001, 005, 014 통과
- **커밋**: `feat: add news feed layout with tabs and loading skeleton`

---

### Task 6: 소스 추가 폼 (Green)

- **시나리오**: RSSDASH-002, 003, 004, 015
- **참조 규칙**: `rules/rerender-move-effect-to-event.md`, `rules/rerender-derived-state-no-effect.md`, `rules/js-hoist-regexp.md`, `web-design-guidelines`
- **구현 대상**:
  - `components/source-add-form.tsx` — RSS URL 입력 + 유효성 검사 + Alert 오류 메시지
  - URL 형식 검사: `new URL()` try/catch (정규식은 모듈 레벨 호이스팅)
  - 중복 URL 검사: zustand store의 sources Set을 O(1)으로 조회
- **수용 기준**:
  - [ ] RSSDASH-002: 유효한 URL 추가 → 탭에 소스명 추가, All 탭에 기사 합산
  - [ ] RSSDASH-003: 빈 URL → Alert "URL을 입력해주세요"
  - [ ] RSSDASH-004: 중복 URL → Alert "이미 등록된 소스입니다"
  - [ ] RSSDASH-015: URL 형식 아님 → Alert "올바른 URL 형식이 아닙니다"
  - [ ] `bun run test` — RSSDASH-002, 003, 004, 015 통과
- **커밋**: `feat: add RSS source add form with validation`

---

### Task 7: 키워드 검색 (Green)

- **시나리오**: RSSDASH-006, 007
- **참조 규칙**: `rules/rerender-transitions.md`, `rules/js-combine-iterations.md`, `rules/rerender-derived-state.md`
- **구현 대상**:
  - 검색창 Input → zustand `searchQuery` 업데이트
  - fuse.js로 `title` 필드 퍼지 검색, `startTransition` 으로 비급박(non-urgent) 업데이트 처리
  - 결과 없을 때 Empty State 컴포넌트
- **수용 기준**:
  - [ ] RSSDASH-006: 'Fed' 입력 → 제목에 'Fed' 포함 기사만 표시
  - [ ] RSSDASH-006: 검색창 비우면 전체 목록 복원
  - [ ] RSSDASH-007: 'zzzznotfound' 입력 → "검색 결과가 없습니다" 표시
  - [ ] `bun run test` — RSSDASH-006, 007 통과
- **커밋**: `feat: add fuzzy keyword search with fuse.js`

---

### Task 8: 북마크 & 메모 (Green)

- **시나리오**: RSSDASH-008, 009, 010
- **참조 규칙**: `rules/rerender-functional-setstate.md`, `rules/client-localstorage-schema.md`, `rules/rerender-no-inline-components.md`, `web-design-guidelines`
- **구현 대상**:
  - NewsCard에 북마크 토글 버튼 (BookmarkIcon ↔ BookmarkCheckIcon)
  - 메모 아이콘 클릭 → shadcn Dialog로 메모 입력 (Textarea + 저장/취소 버튼)
  - 메모가 있으면 카드에 이탤릭 미리보기 텍스트 표시
  - 북마크 탭 선택 시 bookmark된 기사만 필터
- **수용 기준**:
  - [ ] RSSDASH-008: 북마크 아이콘 클릭 → BookmarkCheck 아이콘으로 전환, localStorage 반영
  - [ ] RSSDASH-009: 메모 저장 → 카드에 "AAPL 실적 발표 주목" 미리보기 표시
  - [ ] RSSDASH-010: 북마크 탭 → 북마크된 기사 2개만 표시
  - [ ] 페이지 새로고침 후 북마크·메모 유지
  - [ ] `bun run test` — RSSDASH-008, 009, 010 통과
- **커밋**: `feat: add bookmark and memo functionality`

---

### Task 9: Reddit 섹션 (Green)

- **시나리오**: RSSDASH-012, 013, 016
- **참조 규칙**: `rules/client-swr-dedup.md`, `rules/rendering-conditional-render.md`, `rules/async-suspense-boundaries.md`, `web-design-guidelines`
- **구현 대상**:
  - `components/reddit-panel.tsx` — SWR로 `/api/reddit` 페치
  - WSB Top 종목 리스트 (순위·티커·언급수)
  - r/investing 최신 게시글 (외부 링크 `target="_blank" rel="noopener"`)
  - API 오류 시 오류 메시지 + 재시도 버튼 (`mutate()` 재호출)
- **수용 기준**:
  - [ ] RSSDASH-012: "1. AAPL 342회" 형식으로 WSB Top 항목 표시
  - [ ] RSSDASH-013: r/investing 게시글 3개 이상 표시, 각 항목 외부 링크
  - [ ] RSSDASH-016: API 실패 → "Reddit 데이터를 불러올 수 없습니다" + 재시도 버튼 표시
  - [ ] `bun run test` — RSSDASH-012, 013, 016 통과
- **커밋**: `feat: add Reddit community reaction panel`

---

### Task 10: 새로고침 & Sentiment 배지 (Green)

- **시나리오**: RSSDASH-001, 011
- **참조 규칙**: `rules/client-swr-dedup.md`, `rules/rendering-usetransition-loading.md`, `rules/async-parallel.md`
- **구현 대상**:
  - 새로고침 버튼 클릭 → SWR `mutate()` 호출, 로딩 중 loader 아이콘 표시
  - 페치 완료 후 "방금 전 업데이트" 텍스트 (`date-fns formatDistanceToNow`)
  - NewsCard에 Bullish/Bearish/Neutral Badge (Alpha Vantage sentiment_score 기반)
- **수용 기준**:
  - [ ] RSSDASH-011: 새로고침 버튼 클릭 → 로딩 스피너 표시
  - [ ] RSSDASH-011: 페치 완료 → "방금 전 업데이트" 텍스트 표시
  - [ ] RSSDASH-001: 각 NewsCard에 Bullish/Bearish/Neutral 배지 표시
  - [ ] `bun run test` — RSSDASH-011 통과, 전체 16개 통과
- **커밋**: `feat: add manual refresh and sentiment badges`

---

## 미결정 사항

- 소스 삭제 시 해당 소스의 북마크 기사 처리 (함께 삭제 vs 유지)
- Alpha Vantage 일일 한도(500 req) 초과 시 Sentiment 배지 처리 (숨김 vs 캐시 유지)
