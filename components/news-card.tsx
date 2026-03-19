"use client";

import { useState } from "react";
import { Bookmark, BookmarkCheck, FileText } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
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
        <Card className="h-full">
          <CardContent className="p-4 flex flex-col gap-2">
            {/* Source + Sentiment badges */}
            <div className="flex items-center gap-2 flex-wrap">
              {showSourceBadge ? (
                <Badge variant="outline">{item.sourceName}</Badge>
              ) : null}
              {item.sentiment ? (
                <Badge variant={SENTIMENT_VARIANT[item.sentiment]}>{item.sentiment}</Badge>
              ) : null}
            </div>

            {/* Title */}
            <a
              href={item.link}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-medium leading-snug hover:underline line-clamp-2"
            >
              {item.title}
            </a>

            {/* Memo preview */}
            {memo ? <p className="text-xs text-muted-foreground italic">{memo}</p> : null}

            {/* Footer: published time + actions */}
            <div className="flex items-center justify-between mt-auto">
              <span className="text-xs text-muted-foreground">
                {item.sourceName} · {formatDistanceToNow(new Date(item.publishedAt), {
                  addSuffix: true,
                  locale: ko,
                })}
              </span>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  aria-label="북마크"
                  data-bookmarked={isBookmarked ? "true" : "false"}
                  onClick={() => toggleBookmark(item.id)}
                >
                  {isBookmarked ? (
                    <BookmarkCheck data-icon="inline-start" />
                  ) : (
                    <Bookmark data-icon="inline-start" />
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  aria-label="메모"
                  onClick={handleMemoOpen}
                >
                  <FileText data-icon="inline-start" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
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
