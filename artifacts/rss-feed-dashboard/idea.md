## Overview
매일 아침 글로벌 금융 뉴스(Bloomberg, Reuters, CNBC 등)를 한 화면에서 모아보고,
주요 기사에 대한 투자 커뮤니티(Reddit r/investing, r/wallstreetbets)의 반응을 함께 확인해
주식 투자 판단 자료를 빠르게 수집·정리하는 개인 투자 리서치 대시보드.

## 테크 스택
- 프레임워크: Next.js 16 (App Router)
- UI: Tailwind CSS 4, shadcn/ui
- 런타임/패키지: Bun
- 테스트: Vitest + Testing Library

## 주요 뉴스 소스

| 소스 | 방식 | RSS/API URL 비고 |
|------|------|-----------------|
| Reuters | RSS | `feeds.reuters.com/reuters/businessNews` |
| CNBC | RSS | `cnbc.com/id/10001147/device/rss/rss.html` (Markets) |
| Bloomberg | RSS | `feeds.bloomberg.com/markets/news.rss` (비공식, 불안정) |
| Fox Business | RSS | `moxian.com/foxbusiness` 또는 공식 RSS |
| FinancialJuice | RSS | 무료 계정 RSS 제공 (features.financialjuice.com) |
| X (Walter Bloomberg) | 제한적 | X API v2 무료 티어 (500 req/월) — 별도 토큰 필요 |

> Bloomberg 공식 RSS는 2019년 이후 대부분 중단. **Alpha Vantage 뉴스 API**로 Bloomberg 발 기사도 커버 가능.

## 핵심 기능

### 1. 금융 뉴스 피드 (RSS 수집)
- 설명: Reuters, CNBC, FinancialJuice 등 등록 소스의 최신 헤드라인을 카드로 표시. 발행 시각 기준 정렬
- 추천 도구: `rss-parser` (RSS/Atom 파싱), Next.js Route Handler (서버사이드 CORS 우회)

### 2. 뉴스 감성 스코어 (AI Sentiment)
- 설명: 각 뉴스 아이템 옆에 Bullish / Bearish / Neutral 배지 표시. 티커 태그(AAPL, TSLA 등)도 함께 추출
- 추천 도구: **Alpha Vantage News Sentiment API** (무료 500 req/일, 뉴스 + 감성점수 + 티커 제공)

### 3. Reddit 커뮤니티 반응 패널
- 설명: 주요 종목/키워드에 대해 r/investing, r/wallstreetbets에서 언급량·감성을 집계해 표시
- 추천 도구:
  - **ApeWisdom API** (무료, 인증 불필요 — r/wsb·r/investing 종목 언급 순위)
  - **Tradestie API** (무료, WSB Top 50 종목 + 감성)
  - Reddit 공개 JSON API (`reddit.com/r/investing/hot.json` — 인증 불필요, 소량)

### 4. 소스별 탭 필터 + 키워드 검색
- 설명: 소스(Reuters / CNBC / FinancialJuice)별 탭 전환, 키워드 입력 시 관련 기사만 필터링
- 추천 도구: shadcn Tabs, `zustand` (필터 상태), `fuse.js` (클라이언트 퍼지 검색)

### 5. 북마크 & 메모
- 설명: 기사에 별표 북마크 + 짧은 투자 메모 입력. 북마크 탭에서 모아보기
- 추천 도구: `localStorage`, shadcn Dialog (메모 입력)

### 6. 수동 새로고침 + 마지막 업데이트 시각 표시
- 설명: 새로고침 버튼으로 모든 소스 재페치. 카드 상단에 "3분 전 업데이트" 표시
- 추천 도구: `@tanstack/react-query` (캐싱 + invalidate), `date-fns`

## 추천 무료 도구

### API / 서비스
| 도구 | 용도 | 무료 조건 | 링크 |
|------|------|-----------|------|
| Alpha Vantage | 뉴스 + AI 감성 스코어 + 티커 추출 | 500 req/일 (표준), 25 req/일 (프리미엄 엔드포인트) | https://www.alphavantage.co |
| ApeWisdom API | Reddit r/wsb·r/investing 종목 언급 순위 | 무료, 인증 불필요 | https://apewisdom.io/api/ |
| Tradestie API | WSB Top 50 종목 + 일별 감성 | 무료 | https://tradestie.com/apps/reddit/api/ |
| FinancialJuice RSS | 실시간 금융 헤드라인 | 무료 계정 RSS 제공 | https://features.financialjuice.com |
| Reddit JSON API | 서브레딧 최신 게시글 | 무료, 인증 불필요 (소량) — `.json` 접미 | https://www.reddit.com/r/investing/hot.json |
| Vercel | 배포 | Hobby 플랜 무료 | https://vercel.com |

### npm 패키지
| 패키지 | 용도 | 비고 |
|--------|------|------|
| `rss-parser` | RSS/Atom 피드 파싱 | TypeScript 내장 지원 |
| `@tanstack/react-query` | 피드 페치 + 캐싱 | staleTime 설정으로 과도한 API 호출 방지 |
| `zustand` | 클라이언트 상태 (탭, 북마크, 메모) | 경량, TypeScript 친화적 |
| `date-fns` | 발행 시각 포맷 ("2시간 전") | 번들 사이즈 작음 |
| `fuse.js` | 클라이언트 퍼지 검색 | 서버 없이 키워드 필터링 |
| `nanoid` | 소스·북마크 ID 생성 | 3KB 미만 |

### 디자인 / UI 리소스
| 리소스 | 용도 | 비고 |
|--------|------|------|
| Lucide React | 아이콘 (북마크, 새로고침, 트렌드) | 프로젝트에 이미 포함 |
| Phosphor Icons | 보조 아이콘 | 프로젝트에 이미 포함 |
| Pretendard | 한국어 최적화 폰트 | Google Fonts 또는 CDN |

### 스킬 (발견됨)
| 스킬 | 용도 | 설치 명령 |
|------|------|-----------|
| `brooksy4503/rss-agent-viewer` | RSS 뷰어 에이전트 | `npx skills add brooksy4503/rss-agent-viewer@rss-agent-viewer -g -y` |
| `odysseus0/feed@rss-digest` | RSS 다이제스트 | `npx skills add odysseus0/feed@rss-digest -g -y` |

## 제약 사항 및 고려점

| 항목 | 내용 |
|------|------|
| Bloomberg RSS | 공식 지원 중단 상태. Alpha Vantage로 Bloomberg 발 기사 커버 |
| X (Walter Bloomberg) | X API 무료 티어: 500 req/월로 매우 제한적. 직접 통합보다 수동 링크 추가 권장 |
| Alpha Vantage 무료 한도 | 500 req/일. 5개 소스 × 1시간 간격 기준 120 req/일 — 여유 있음 |
| CORS | RSS/외부 API 호출은 Next.js Route Handler 경유로 서버사이드에서 처리 |
