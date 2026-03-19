"use client";

import { useState } from "react";
import { Bookmark, BookmarkCheck, FileText, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useDashboardStore, selectIsBookmarked, selectMemo } from "@/lib/store";
import { formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";
import type { NewsItem, Sentiment } from "@/lib/types";

const SENTIMENT_COLOR: Record<Sentiment, string> = {
  Bullish: "bg-emerald-100 text-emerald-700 border-emerald-200",
  Bearish: "bg-rose-100 text-rose-700 border-rose-200",
  Neutral: "bg-gray-100 text-gray-600 border-gray-200",
};

const SENTIMENT_VARIANT: Record<Sentiment, "default" | "destructive" | "secondary"> = {
  Bullish: "default",
  Bearish: "destructive",
  Neutral: "secondary",
};

interface NewsCardProps {
  item: NewsItem;
  showSourceBadge?: boolean;
}

export function NewsCard({ item, showSourceBadge = false }: NewsCardProps) {
  const isBookmarked = useDashboardStore(selectIsBookmarked(item.id));
  const memo = useDashboardStore(selectMemo(item.id));
  const toggleBookmark = useDashboardStore((s) => s.toggleBookmark);
  const setMemo = useDashboardStore((s) => s.setMemo);

  const [memoOpen, setMemoOpen] = useState(false);
  const [draftMemo, setDraftMemo] = useState(memo);

  const handleMemoOpen = () => {
    setDraftMemo(memo);
    setMemoOpen(true);
  };

  const handleMemoSave = () => {
    setMemo(item.id, draftMemo);
    setMemoOpen(false);
  };

  return (
    <>
      <article>
        <div className="group bg-background rounded-xl border shadow-sm hover:shadow-md transition-shadow duration-200 h-full flex flex-col p-4 gap-3">
          {/* Badges row */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {showSourceBadge ? (
              <Badge variant="outline" className="text-xs font-medium">
                {item.sourceName}
              </Badge>
            ) : null}
            {item.sentiment ? (
              <Badge variant={SENTIMENT_VARIANT[item.sentiment]} className={SENTIMENT_COLOR[item.sentiment]}>
                {item.sentiment}
              </Badge>
            ) : null}
          </div>

          {/* Title */}
          <a
            href={item.link}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-semibold leading-snug hover:text-primary transition-colors line-clamp-3 flex-1"
          >
            {item.title}
            <ExternalLink className="inline h-3 w-3 ml-1 opacity-0 group-hover:opacity-40 transition-opacity" />
          </a>

          {/* Memo preview */}
          {memo ? (
            <p className="text-xs text-muted-foreground italic bg-muted/50 rounded px-2 py-1">
              {memo}
            </p>
          ) : null}

          {/* Footer */}
          <div className="flex items-center justify-between pt-1 border-t border-border/50">
            <span className="text-xs text-muted-foreground">
              {item.sourceName} · {formatDistanceToNow(new Date(item.publishedAt), {
                addSuffix: true,
                locale: ko,
              })}
            </span>
            <div className="flex gap-0.5 -mr-1">
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0"
                aria-label="북마크"
                data-bookmarked={isBookmarked ? "true" : "false"}
                onClick={() => toggleBookmark(item.id)}
              >
                {isBookmarked ? (
                  <BookmarkCheck className="h-3.5 w-3.5 text-primary" data-icon="inline-start" />
                ) : (
                  <Bookmark className="h-3.5 w-3.5" data-icon="inline-start" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0"
                aria-label="메모"
                onClick={handleMemoOpen}
              >
                <FileText className="h-3.5 w-3.5" data-icon="inline-start" />
              </Button>
            </div>
          </div>
        </div>
      </article>

      <Dialog open={memoOpen} onOpenChange={setMemoOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>메모</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor={`memo-${item.id}`}>메모</Label>
            <Textarea
              id={`memo-${item.id}`}
              value={draftMemo}
              onChange={(e) => setDraftMemo(e.target.value)}
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMemoOpen(false)}>
              취소
            </Button>
            <Button onClick={handleMemoSave}>저장</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
