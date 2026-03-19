"use client";

import { AlertCircle, TrendingUp, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import type { RedditData } from "@/lib/types";

interface RedditPanelProps {
  data: RedditData | undefined;
  error: unknown;
  onRetry: () => void;
}

export function RedditPanel({ data, error, onRetry }: RedditPanelProps) {
  if (error) {
    return (
      <div className="space-y-3">
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Reddit 커뮤니티</h2>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Reddit 데이터를 불러올 수 없습니다</AlertDescription>
        </Alert>
        <Button variant="outline" size="sm" onClick={onRetry}>
          재시도
        </Button>
      </div>
    );
  }

  if (!data?.wsb || !data?.investing) {
    return null;
  }

  return (
    <div className="space-y-5">
      {/* WSB Top Tickers */}
      <section>
        <div className="flex items-center gap-1.5 mb-3">
          <TrendingUp className="h-3.5 w-3.5 text-primary" />
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">WSB Top 종목</h2>
        </div>
        <ul className="space-y-1">
          {data.wsb.map((item) => (
            <li key={item.ticker} className="py-1 text-sm border-b border-border/40 last:border-0">
              {item.rank}. {item.ticker} {item.mentions}회
            </li>
          ))}
        </ul>
      </section>

      {/* r/investing posts */}
      <section>
        <div className="flex items-center gap-1.5 mb-3">
          <MessageSquare className="h-3.5 w-3.5 text-primary" />
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">r/investing</h2>
        </div>
        <ul className="space-y-3">
          {data.investing.map((post) => (
            <li key={post.url}>
              <a
                href={post.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-medium hover:text-primary transition-colors leading-snug block line-clamp-2"
              >
                {post.title}
              </a>
              <span className="text-xs text-muted-foreground mt-0.5 block">
                ▲ {post.score} · 댓글 {post.numComments}
              </span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
