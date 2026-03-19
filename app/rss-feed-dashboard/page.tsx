"use client";

import { useState, useEffect, startTransition } from "react";
import useSWR from "swr";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { RefreshCw, Search, TrendingUp } from "lucide-react";
import { useDashboardStore, STORAGE_KEY } from "@/lib/store";
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
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_init] = useState(() => {
    if (typeof window !== "undefined" && !localStorage.getItem(STORAGE_KEY)) {
      useDashboardStore.getState().reset();
    }
    return true;
  });

  const sources = useDashboardStore((s) => s.sources);
  const bookmarks = useDashboardStore((s) => s.bookmarks);

  const [activeTab, setActiveTab] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [lastUpdatedAt, setLastUpdatedAt] = useState<number | null>(null);

  const newsKey = `/api/rss?sources=${sources.map((s) => `${s.id}:${encodeURIComponent(s.name)}:${encodeURIComponent(s.url)}`).join(",")}`;
  const { data: newsItems, isLoading, mutate: refreshNews } = useSWR<NewsItem[]>(newsKey, fetcher);

  const {
    data: redditData,
    error: redditError,
    mutate: refreshReddit,
  } = useSWR<RedditData>("/api/reddit", fetcher);

  useEffect(() => {
    if (newsItems) setLastUpdatedAt(Date.now());
  }, [newsItems]);

  const allItems = Array.isArray(newsItems) ? newsItems : [];

  const tabFiltered =
    activeTab === "All"
      ? allItems
      : activeTab === "북마크"
        ? allItems.filter((item) => Boolean(bookmarks[item.id]))
        : allItems.filter((item) => item.sourceId === activeTab);

  const fuse = new Fuse(tabFiltered, { keys: ["title"], threshold: 0.4 });
  const filteredItems = searchQuery.trim()
    ? fuse.search(searchQuery).map((r) => r.item)
    : tabFiltered;

  const sortedItems = filteredItems
    .slice()
    .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());

  const handleRefresh = () => {
    refreshNews();
    refreshReddit();
  };

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Top Header */}
      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur border-b">
        <div className="max-w-screen-xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            <span className="font-bold text-base tracking-tight">투자 리서치</span>
            {lastUpdatedAt !== null ? (
              <span className="text-xs text-muted-foreground hidden sm:inline">
                · {formatLastUpdated(lastUpdatedAt)}
              </span>
            ) : null}
          </div>
          <Button variant="ghost" size="sm" onClick={handleRefresh} aria-label="새로고침">
            <RefreshCw className="h-4 w-4" />
            <span className="hidden sm:inline ml-1.5">새로고침</span>
          </Button>
        </div>
      </header>

      <div className="max-w-screen-xl mx-auto px-6 py-6">
        <div className="flex gap-6 items-start">

          {/* ── Left: News Feed ── */}
          <div className="flex-1 min-w-0">
            {/* Tabs + Search */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <div className="flex items-center gap-3 flex-wrap mb-4">
                <TabsList className="h-9">
                  <TabsTrigger value="All" className="text-xs px-3">All</TabsTrigger>
                  {sources.map((source) => (
                    <TabsTrigger key={source.id} value={source.id} className="text-xs px-3">
                      {source.name}
                    </TabsTrigger>
                  ))}
                  <TabsTrigger value="북마크" className="text-xs px-3">북마크</TabsTrigger>
                </TabsList>

                <div className="flex items-center border bg-background rounded-lg px-3 py-1.5 gap-2 ml-auto shadow-sm">
                  <Search className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                  <Input
                    className="border-0 p-0 h-auto focus-visible:ring-0 shadow-none w-36 text-sm"
                    placeholder="키워드 검색..."
                    value={searchQuery}
                    onChange={(e) => startTransition(() => setSearchQuery(e.target.value))}
                  />
                </div>
              </div>
            </Tabs>

            {/* Scrollable News Area */}
            <div className="h-[calc(100vh-180px)] overflow-y-auto pr-1">
              {isLoading ? (
                <div role="status" className="grid gap-3 sm:grid-cols-2">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <Skeleton key={i} className="h-36 w-full rounded-xl" />
                  ))}
                </div>
              ) : searchQuery.trim() !== "" && sortedItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-48 text-muted-foreground">
                  <Search className="h-8 w-8 mb-2 opacity-30" />
                  <p className="text-sm">검색 결과가 없습니다</p>
                </div>
              ) : sortedItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-48 text-muted-foreground">
                  <TrendingUp className="h-8 w-8 mb-2 opacity-30" />
                  <p className="text-sm">표시할 기사가 없습니다</p>
                </div>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  {sortedItems.map((item) => (
                    <NewsCard
                      key={item.id}
                      item={item}
                      showSourceBadge={activeTab === item.sourceId}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ── Right Sidebar ── */}
          <aside className="w-72 shrink-0 hidden lg:block">
            <div className="sticky top-20 space-y-4 h-[calc(100vh-100px)] overflow-y-auto pb-4">
              {/* Source Add */}
              <div className="bg-background rounded-xl border p-4 shadow-sm">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                  RSS 소스
                </p>
                <SourceAddForm />
              </div>

              {/* Reddit Panel */}
              <div className="bg-background rounded-xl border p-4 shadow-sm">
                <RedditPanel data={redditData} error={redditError} onRetry={refreshReddit} />
              </div>
            </div>
          </aside>

        </div>
      </div>
    </div>
  );
}
