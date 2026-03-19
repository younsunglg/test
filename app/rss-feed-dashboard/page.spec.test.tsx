/**
 * Spec Tests — RSS Feed Dashboard
 * spec.yaml: RSSDASH-001 ~ RSSDASH-016
 *
 * 이 파일은 spec.yaml에서 파생된 수용 기준 테스트입니다.
 * 구현이 spec과 맞지 않으면 구현을 수정합니다. (이 파일은 수정 금지)
 */

import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi, beforeEach, describe, it, expect } from "vitest";
import Page from "./page";

// ─── Mock SWR ───────────────────────────────────────────────────────────────
vi.mock("swr");

import useSWR from "swr";

const mockNewsItems = [
  {
    id: "item-1",
    sourceId: "reuters",
    sourceName: "Reuters",
    title: "Fed Signals Potential Rate Cuts in Q2",
    link: "https://reuters.com/1",
    publishedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    sentiment: "Bullish" as const,
    tickers: ["AAPL"],
  },
  {
    id: "item-2",
    sourceId: "cnbc",
    sourceName: "CNBC",
    title: "China Manufacturing PMI Drops Below 50",
    link: "https://cnbc.com/1",
    publishedAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    sentiment: "Bearish" as const,
    tickers: ["FXI"],
  },
  {
    id: "item-3",
    sourceId: "reuters",
    sourceName: "Reuters",
    title: "Oil Prices Slide 3% on Unexpected Build",
    link: "https://reuters.com/2",
    publishedAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
    sentiment: "Bearish" as const,
    tickers: ["XOM"],
  },
];

const mockRedditData = {
  wsb: [
    { rank: 1, ticker: "AAPL", mentions: 342 },
    { rank: 2, ticker: "TSLA", mentions: 298 },
    { rank: 3, ticker: "NVDA", mentions: 241 },
  ],
  investing: [
    {
      title: "Fed cuts — rotate to value?",
      url: "https://reddit.com/r/investing/1",
      score: 1200,
      numComments: 243,
    },
    {
      title: "Daily Discussion: March 19, 2026",
      url: "https://reddit.com/r/investing/2",
      score: 876,
      numComments: 512,
    },
    {
      title: "Oil inventory implications for energy ETFs",
      url: "https://reddit.com/r/investing/3",
      score: 634,
      numComments: 98,
    },
  ],
};

function mockSwrSuccess() {
  vi.mocked(useSWR).mockImplementation((key: unknown) => {
    if (typeof key === "string" && key.startsWith("/api/reddit")) {
      return { data: mockRedditData, error: undefined, isLoading: false, mutate: vi.fn() } as ReturnType<typeof useSWR>;
    }
    return {
      data: mockNewsItems,
      error: undefined,
      isLoading: false,
      mutate: vi.fn(),
    } as ReturnType<typeof useSWR>;
  });
}

function mockSwrLoading() {
  vi.mocked(useSWR).mockReturnValue({
    data: undefined,
    error: undefined,
    isLoading: true,
    mutate: vi.fn(),
  } as ReturnType<typeof useSWR>);
}

function mockSwrRedditError() {
  vi.mocked(useSWR).mockImplementation((key: unknown) => {
    if (typeof key === "string" && key.startsWith("/api/reddit")) {
      return { data: undefined, error: new Error("API Error"), isLoading: false, mutate: vi.fn() } as ReturnType<typeof useSWR>;
    }
    return {
      data: mockNewsItems,
      error: undefined,
      isLoading: false,
      mutate: vi.fn(),
    } as ReturnType<typeof useSWR>;
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
  mockSwrSuccess();
});

// ─── RSSDASH-001: 앱 최초 진입 — 기본 소스 피드 표시 ──────────────────────
describe("RSSDASH-001: 앱 최초 진입 — 기본 소스 피드 표시", () => {
  it("All·Reuters·CNBC·북마크 탭이 표시된다", () => {
    render(<Page />);
    expect(screen.getByRole("tab", { name: "All" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /Reuters/ })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /CNBC/ })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /북마크/ })).toBeInTheDocument();
  });

  it("All 탭에 기사 카드가 발행 시각 내림차순으로 표시된다", () => {
    render(<Page />);
    const cards = screen.getAllByRole("article");
    expect(cards.length).toBeGreaterThanOrEqual(2);
    // 첫 번째 카드는 가장 최신 기사 (Reuters)
    expect(cards[0]).toHaveTextContent("Reuters");
  });

  it("각 카드에 소스명·제목·Sentiment 배지가 표시된다", () => {
    render(<Page />);
    expect(screen.getByText("Fed Signals Potential Rate Cuts in Q2")).toBeInTheDocument();
    expect(screen.getAllByText("Reuters").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("Bullish")).toBeInTheDocument();
  });
});

// ─── RSSDASH-014: 초기 피드 로딩 중 상태 ─────────────────────────────────
describe("RSSDASH-014: 초기 피드 로딩 중 상태", () => {
  it("로딩 중에는 로딩 스피너가 표시되고 기사 카드가 없다", () => {
    mockSwrLoading();
    render(<Page />);
    expect(screen.getByRole("status")).toBeInTheDocument();
    expect(screen.queryByRole("article")).toBeNull();
  });
});

// ─── RSSDASH-002: RSS 소스 추가 — 유효한 URL ─────────────────────────────
describe("RSSDASH-002: RSS 소스 추가 — 유효한 URL", () => {
  it("유효한 URL 추가 시 새 소스 탭이 생긴다", async () => {
    const user = userEvent.setup();
    render(<Page />);
    const input = screen.getByPlaceholderText(/RSS URL/i);
    await user.type(input, "https://feeds.financialjuice.com/rss");
    await user.click(screen.getByRole("button", { name: /소스 추가/i }));
    await waitFor(() => {
      expect(screen.getByRole("tab", { name: /FinancialJuice/i })).toBeInTheDocument();
    });
  });
});

// ─── RSSDASH-003: RSS 소스 추가 — 빈 URL 오류 ────────────────────────────
describe("RSSDASH-003: RSS 소스 추가 — 빈 URL 오류", () => {
  it("빈 URL 추가 시 오류 메시지가 표시된다", async () => {
    const user = userEvent.setup();
    render(<Page />);
    await user.click(screen.getByRole("button", { name: /소스 추가/i }));
    expect(screen.getByText("URL을 입력해주세요")).toBeInTheDocument();
  });
});

// ─── RSSDASH-015: RSS 소스 추가 — 유효하지 않은 URL 형식 오류 ────────────
describe("RSSDASH-015: RSS 소스 추가 — 유효하지 않은 URL 형식 오류", () => {
  it("URL 형식이 아닌 텍스트 입력 시 오류 메시지가 표시된다", async () => {
    const user = userEvent.setup();
    render(<Page />);
    const input = screen.getByPlaceholderText(/RSS URL/i);
    await user.type(input, "not-a-url");
    await user.click(screen.getByRole("button", { name: /소스 추가/i }));
    expect(screen.getByText("올바른 URL 형식이 아닙니다")).toBeInTheDocument();
  });
});

// ─── RSSDASH-004: RSS 소스 추가 — 중복 URL 오류 ──────────────────────────
describe("RSSDASH-004: RSS 소스 추가 — 중복 URL 오류", () => {
  it("이미 등록된 URL 추가 시 오류 메시지가 표시된다", async () => {
    const user = userEvent.setup();
    render(<Page />);
    const input = screen.getByPlaceholderText(/RSS URL/i);
    await user.type(input, "https://feeds.reuters.com/reuters/businessNews");
    await user.click(screen.getByRole("button", { name: /소스 추가/i }));
    expect(screen.getByText("이미 등록된 소스입니다")).toBeInTheDocument();
  });
});

// ─── RSSDASH-005: 소스별 탭 필터 ─────────────────────────────────────────
describe("RSSDASH-005: 소스별 탭 필터", () => {
  it("Reuters 탭 클릭 시 Reuters 기사만 표시된다", async () => {
    const user = userEvent.setup();
    render(<Page />);
    await user.click(screen.getByRole("tab", { name: /Reuters/ }));
    await waitFor(() => {
      const articles = screen.getAllByRole("article");
      articles.forEach((article) => {
        expect(within(article).getByText("Reuters")).toBeInTheDocument();
      });
    });
  });

  it("All 탭 클릭 시 모든 소스 기사가 표시된다", async () => {
    const user = userEvent.setup();
    render(<Page />);
    await user.click(screen.getByRole("tab", { name: /Reuters/ }));
    await user.click(screen.getByRole("tab", { name: "All" }));
    await waitFor(() => {
      expect(screen.getByText("Reuters")).toBeInTheDocument();
      expect(screen.getByText("CNBC")).toBeInTheDocument();
    });
  });
});

// ─── RSSDASH-006: 키워드 검색 — 결과 있음 ────────────────────────────────
describe("RSSDASH-006: 키워드 검색 — 결과 있음", () => {
  it("'Fed' 검색 시 제목에 Fed 포함된 기사만 표시된다", async () => {
    const user = userEvent.setup();
    render(<Page />);
    const searchInput = screen.getByPlaceholderText(/키워드 검색/i);
    await user.type(searchInput, "Fed");
    await waitFor(() => {
      const articles = screen.getAllByRole("article");
      articles.forEach((article) => {
        expect(article.textContent?.toLowerCase()).toContain("fed");
      });
    });
  });

  it("검색창을 비우면 전체 기사 목록으로 돌아온다", async () => {
    const user = userEvent.setup();
    render(<Page />);
    const searchInput = screen.getByPlaceholderText(/키워드 검색/i);
    await user.type(searchInput, "Fed");
    await user.clear(searchInput);
    await waitFor(() => {
      expect(screen.getAllByRole("article").length).toBe(mockNewsItems.length);
    });
  });
});

// ─── RSSDASH-007: 키워드 검색 — 결과 없음 ────────────────────────────────
describe("RSSDASH-007: 키워드 검색 — 결과 없음", () => {
  it("매칭 없는 검색어 입력 시 빈 상태 문구가 표시된다", async () => {
    const user = userEvent.setup();
    render(<Page />);
    const searchInput = screen.getByPlaceholderText(/키워드 검색/i);
    await user.type(searchInput, "zzzznotfound");
    await waitFor(() => {
      expect(screen.getByText("검색 결과가 없습니다")).toBeInTheDocument();
    });
  });
});

// ─── RSSDASH-008: 기사 북마크 ─────────────────────────────────────────────
describe("RSSDASH-008: 기사 북마크", () => {
  it("북마크 아이콘 클릭 시 채워진 아이콘으로 바뀐다", async () => {
    const user = userEvent.setup();
    render(<Page />);
    const bookmarkButtons = screen.getAllByRole("button", { name: /북마크/i });
    await user.click(bookmarkButtons[0]);
    await waitFor(() => {
      expect(bookmarkButtons[0]).toHaveAttribute("data-bookmarked", "true");
    });
  });
});

// ─── RSSDASH-009: 기사 메모 추가 ─────────────────────────────────────────
describe("RSSDASH-009: 기사 메모 추가", () => {
  it("메모 저장 시 카드에 메모 미리보기가 표시된다", async () => {
    const user = userEvent.setup();
    render(<Page />);
    const memoButtons = screen.getAllByRole("button", { name: /메모/i });
    await user.click(memoButtons[0]);
    const textarea = await screen.findByRole("textbox", { name: /메모/i });
    await user.type(textarea, "AAPL 실적 발표 주목");
    await user.click(screen.getByRole("button", { name: /저장/i }));
    await waitFor(() => {
      expect(screen.getByText("AAPL 실적 발표 주목")).toBeInTheDocument();
    });
  });
});

// ─── RSSDASH-010: 북마크 탭 모아보기 ─────────────────────────────────────
describe("RSSDASH-010: 북마크 탭 모아보기", () => {
  it("북마크 탭 클릭 시 북마크된 기사만 표시된다", async () => {
    const user = userEvent.setup();
    render(<Page />);
    // 첫 번째 기사 북마크
    const bookmarkButtons = screen.getAllByRole("button", { name: /북마크/i });
    await user.click(bookmarkButtons[0]);
    // 북마크 탭으로 이동
    await user.click(screen.getByRole("tab", { name: /북마크/ }));
    await waitFor(() => {
      expect(screen.getAllByRole("article").length).toBe(1);
    });
  });
});

// ─── RSSDASH-011: 수동 새로고침 ──────────────────────────────────────────
describe("RSSDASH-011: 수동 새로고침", () => {
  it("새로고침 버튼 클릭 시 로딩 상태가 표시된다", async () => {
    const user = userEvent.setup();
    const mutateMock = vi.fn();
    vi.mocked(useSWR).mockReturnValue({
      data: mockNewsItems,
      error: undefined,
      isLoading: false,
      mutate: mutateMock,
    } as ReturnType<typeof useSWR>);
    render(<Page />);
    await user.click(screen.getByRole("button", { name: /새로고침/i }));
    expect(mutateMock).toHaveBeenCalled();
  });

  it("초기 로드 후 마지막 업데이트 시각이 표시된다", () => {
    render(<Page />);
    expect(screen.getByText(/업데이트/)).toBeInTheDocument();
  });
});

// ─── RSSDASH-012: Reddit WSB Top 종목 표시 ───────────────────────────────
describe("RSSDASH-012: Reddit WSB Top 종목 표시", () => {
  it("WSB Top 종목 순위·티커·언급수가 표시된다", () => {
    render(<Page />);
    expect(screen.getByText(/1\.\s*AAPL/)).toBeInTheDocument();
    expect(screen.getByText(/342회/)).toBeInTheDocument();
  });
});

// ─── RSSDASH-013: r/investing 최신 게시글 표시 ───────────────────────────
describe("RSSDASH-013: r/investing 최신 게시글 표시", () => {
  it("r/investing 게시글 3개 이상이 외부 링크와 함께 표시된다", () => {
    render(<Page />);
    expect(screen.getByText("Fed cuts — rotate to value?")).toBeInTheDocument();
    expect(screen.getByText("Daily Discussion: March 19, 2026")).toBeInTheDocument();
    expect(screen.getByText("Oil inventory implications for energy ETFs")).toBeInTheDocument();
    // 각 게시글은 링크 요소
    const links = screen.getAllByRole("link", { name: /Fed cuts|Daily Discussion|Oil inventory/i });
    expect(links.length).toBeGreaterThanOrEqual(3);
    links.forEach((link) => {
      expect(link).toHaveAttribute("target", "_blank");
    });
  });
});

// ─── RSSDASH-016: Reddit 섹션 — API 오류 상태 ───────────────────────────
describe("RSSDASH-016: Reddit 섹션 — API 오류 상태", () => {
  it("Reddit API 오류 시 오류 문구와 재시도 버튼이 표시된다", () => {
    mockSwrRedditError();
    render(<Page />);
    expect(screen.getByText("Reddit 데이터를 불러올 수 없습니다")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /재시도/i })).toBeInTheDocument();
  });
});
