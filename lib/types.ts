export interface RssSource {
  id: string;
  name: string;
  url: string;
  addedAt: number;
}

export type Sentiment = "Bullish" | "Bearish" | "Neutral";

export interface NewsItem {
  id: string;
  sourceId: string;
  sourceName: string;
  title: string;
  link: string;
  publishedAt: string; // ISO 8601 string
  sentiment?: Sentiment;
  tickers?: string[];
}

export interface BookmarkEntry {
  articleId: string;
  memo: string;
  bookmarkedAt: number;
}

export interface WsbTicker {
  rank: number;
  ticker: string;
  mentions: number;
}

export interface RedditPost {
  title: string;
  url: string;
  score: number;
  numComments: number;
}

export interface RedditData {
  wsb: WsbTicker[];
  investing: RedditPost[];
}
