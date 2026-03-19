import { NextResponse } from "next/server";
import type { WsbTicker, RedditPost } from "@/lib/types";

const APE_WISDOM_URL = "https://apewisdom.io/api/v1.0/filter/all-reddit/page/1";
const REDDIT_INVESTING_URL = "https://www.reddit.com/r/investing/new.json?limit=10";

async function fetchWsbTop(): Promise<WsbTicker[]> {
  const response = await fetch(APE_WISDOM_URL, {
    headers: { "User-Agent": "RssDashboard/1.0" },
  });
  if (!response.ok) throw new Error("ApeWisdom API error");

  const data = await response.json();
  // ApeWisdom returns { results: [{ rank, ticker, mentions, upvotes }] }
  return (data.results ?? []).slice(0, 10).map((item: { rank: number; ticker: string; mentions: number }) => ({
    rank: item.rank,
    ticker: item.ticker,
    mentions: item.mentions,
  }));
}

async function fetchInvestingPosts(): Promise<RedditPost[]> {
  const response = await fetch(REDDIT_INVESTING_URL, {
    headers: { "User-Agent": "RssDashboard/1.0" },
  });
  if (!response.ok) throw new Error("Reddit API error");

  const data = await response.json();
  const children = data?.data?.children ?? [];

  return children
    .slice(0, 10)
    .map((child: { data: { title: string; url: string; score: number; num_comments: number } }) => ({
      title: child.data.title,
      url: child.data.url,
      score: child.data.score,
      numComments: child.data.num_comments,
    }));
}

export async function GET() {
  try {
    // Parallel fetch (async-parallel rule)
    const [wsb, investing] = await Promise.all([fetchWsbTop(), fetchInvestingPosts()]);
    return NextResponse.json({ wsb, investing });
  } catch {
    return NextResponse.json(
      { error: true, message: "Reddit 데이터를 불러올 수 없습니다" },
      { status: 502 },
    );
  }
}
