"use client";

import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import type { RedditData } from "@/lib/types";

interface RedditPanelProps {
  data: RedditData | undefined;
  error: unknown;
  onRetry: () => void;
}

export function RedditPanel({ data, error, onRetry }: RedditPanelProps) {
  if (error) {
    return (
      <div className="mt-8 space-y-3">
        <h2 className="text-sm font-semibold">Reddit 커뮤니티</h2>
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
    <div className="mt-8 grid gap-6 md:grid-cols-2">
      {/* WSB Top Tickers */}
      <section>
        <h2 className="text-sm font-semibold mb-3">WSB Top 종목</h2>
        <ul className="space-y-1.5">
          {data.wsb.map((item) => (
            <li key={item.ticker} className="text-sm">
              {item.rank}. {item.ticker} {item.mentions}회
            </li>
          ))}
        </ul>
      </section>

      <Separator className="md:hidden" />

      {/* r/investing posts */}
      <section>
        <h2 className="text-sm font-semibold mb-3">r/investing 최신 게시글</h2>
        <ul className="space-y-2">
          {data.investing.map((post) => (
            <li key={post.url}>
              <a
                href={post.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm hover:underline leading-snug block"
              >
                {post.title}
              </a>
              <span className="text-xs text-muted-foreground">
                {post.score}점 · 댓글 {post.numComments}
              </span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
