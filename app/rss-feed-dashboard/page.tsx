"use client";

import { useState, useEffect, startTransition } from "react";
import useSWR from "swr";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { RefreshCw, Search } from "lucide-react";
import { useDashboardStore, STORAGE_KEY, DEFAULT_SOURCES } from "@/lib/store";
import Fuse from "fuse.js";
import type { NewsItem, RedditData } from "@/lib/types";
import { NewsCard } from "@/components/news-card";
import { SourceAddForm } from "@/components/source-add-form";
import { RedditPanel } from "@/components/reddit-panel";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

function formatLastUpdated(ts: number): string {
  const diff = Date.now() - ts;
  if (diff < 60_000) return "방금 전 업데이트";
  const mins = Math.floor(diff / 60_000);
  return `${mins}분 전 업데이트`;
}

export default function RssFeedDashboardPage() {
  // Synchronous store reset when localStorage was cleared between tests (client-localstorage-schema rule)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_init] = useState(() => {
    if (typeof window !== "undefined" && !localStorage.getItem(STORAGE_KEY)) {
      useDashboardStore.getState().reset();
    }
    return true;
  });

  const sources = useDashboardStore((s) => s.sources);
  const bookmarks = useDashboardStore((s) => s.bookmarks);

  // Local transient state — resets on each component mount
  const [activeTab, setActiveTab] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [lastUpdatedAt, setLastUpdatedAt] = useState<number | null>(null);

  // SWR: news feed (client-swr-dedup rule)
  const newsKey = `/api/rss?sources=${sources.map((s) => `${s.id}:${encodeURIComponent(s.name)}:${encodeURIComponent(s.url)}`).join(",")}`;
  const { data: newsItems, isLoading, mutate: refreshNews } = useSWR<NewsItem[]>(
    newsKey,
    fetcher,
  );

  // SWR: Reddit community data
  const {
    data: redditData,
    error: redditError,
    mutate: refreshReddit,
  } = useSWR<RedditData>("/api/reddit", fetcher);

  // Track last update time (rendering-conditional-render rule: use ternary for null check)
  useEffect(() => {
    if (newsItems) setLastUpdatedAt(Date.now());
  }, [newsItems]);

  // --- Derived filtering (rerender-derived-state rule) ---
  const allItems = Array.isArray(newsItems) ? newsItems : [];

  const tabFiltered =
    activeTab === "All"
      ? allItems
      : activeTab === "북마크"
        ? allItems.filter((item) => Boolean(bookmarks[item.id]))
        : allItems.filter((item) => item.sourceId === activeTab);

  // fuse.js fuzzy search on title
  const fuse = new Fuse(tabFiltered, { keys: ["title"], threshold: 0.4 });
  const filteredItems = searchQuery.trim()
    ? fuse.search(searchQuery).map((r) => r.item)
    : tabFiltered;

  // Sort by publishedAt descending (js-tosorted-immutable rule)
  const sortedItems = filteredItems
    .slice()
    .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());

  const handleRefresh = () => {
    refreshNews();
    refreshReddit();
  };

  return (
    <main className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-lg font-bold">투자 리서치 대시보드</h1>
          {lastUpdatedAt !== null ? (
            <p className="text-xs text-muted-foreground">{formatLastUpdated(lastUpdatedAt)}</p>
          ) : null}
        </div>
        <Button variant="outline" size="sm" onClick={handleRefresh} aria-label="새로고침">
          <RefreshCw data-icon="inline-start" />
          새로고침
        </Button>
      </div>

      {/* Source Add Form */}
      <SourceAddForm />

      {/* Tabs + Search */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex items-center gap-3 flex-wrap">
          <TabsList>
            <TabsTrigger value="All">All</TabsTrigger>
            {sources.map((source) => (
              <TabsTrigger key={source.id} value={source.id}>
                {source.name}
              </TabsTrigger>
            ))}
            <TabsTrigger value="북마크">북마크</TabsTrigger>
          </TabsList>

          <div className="flex items-center border rounded-md px-3 py-1 gap-2 ml-auto">
            <Search className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <Input
              className="border-0 p-0 h-auto focus-visible:ring-0 shadow-none w-36"
              placeholder="키워드 검색..."
              value={searchQuery}
              onChange={(e) => startTransition(() => setSearchQuery(e.target.value))}
            />
          </div>
        </div>
      </Tabs>

      {/* News Feed */}
      <div className="mt-4">
        {isLoading ? (
          <div role="status" className="grid gap-3 md:grid-cols-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-32 w-full" />
            ))}
          </div>
        ) : searchQuery.trim() !== "" && sortedItems.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">검색 결과가 없습니다</p>
        ) : sortedItems.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">표시할 기사가 없습니다</p>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {sortedItems.map((item) => (
              <NewsCard key={item.id} item={item} showSourceBadge={activeTab === item.sourceId} />
            ))}
          </div>
        )}
      </div>

      {/* Reddit Panel */}
      <RedditPanel data={redditData} error={redditError} onRetry={refreshReddit} />
    </main>
  );
}
