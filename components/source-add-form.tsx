"use client";

import { useState } from "react";
import { Rss, Plus, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useDashboardStore } from "@/lib/store";
import { nanoid } from "nanoid";
import type { RssSource } from "@/lib/types";

function extractSourceName(url: string): string {
  const hostname = new URL(url).hostname;
  const parts = hostname.split(".");
  const commonPrefixes = new Set(["feeds", "rss", "news", "www", "search"]);
  const tlds = new Set(["com", "net", "org", "io", "co", "uk"]);
  const meaningful = parts.find((p) => !commonPrefixes.has(p) && !tlds.has(p)) ?? parts[0];
  return meaningful.charAt(0).toUpperCase() + meaningful.slice(1);
}

export function SourceAddForm() {
  const sources = useDashboardStore((s) => s.sources);
  const addSource = useDashboardStore((s) => s.addSource);
  const removeSource = useDashboardStore((s) => s.removeSource);

  const [url, setUrl] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleAdd = () => {
    const trimmed = url.trim();

    if (!trimmed) {
      setError("URL을 입력해주세요");
      return;
    }

    let parsed: URL;
    try {
      parsed = new URL(trimmed);
      if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
        throw new Error("Invalid protocol");
      }
    } catch {
      setError("올바른 URL 형식이 아닙니다");
      return;
    }

    const sourceUrlSet = new Set(sources.map((s) => s.url));
    if (sourceUrlSet.has(trimmed)) {
      setError("이미 등록된 소스입니다");
      return;
    }

    const name = extractSourceName(trimmed);
    const newSource: RssSource = {
      id: nanoid(8),
      name,
      url: trimmed,
      addedAt: Date.now(),
    };

    addSource(newSource);
    setUrl("");
    setError(null);
  };

  return (
    <div className="space-y-3">
      {/* Input row */}
      <div className="flex gap-2">
        <div className="flex-1 flex items-center bg-muted/50 border rounded-lg px-3 py-2 gap-2 focus-within:ring-2 focus-within:ring-ring/30 transition-shadow">
          <Rss className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
          <Input
            className="border-0 p-0 h-auto focus-visible:ring-0 shadow-none bg-transparent text-sm"
            placeholder="RSS URL 입력 (https://...)"
            value={url}
            onChange={(e) => {
              setUrl(e.target.value);
              setError(null);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleAdd();
            }}
          />
        </div>
        <Button size="sm" onClick={handleAdd} className="shrink-0">
          <Plus className="h-3.5 w-3.5" />
          <span>+ 소스 추가</span>
        </Button>
      </div>

      {error !== null ? (
        <p className="text-xs text-destructive px-1">{error}</p>
      ) : null}

      {/* Source list */}
      {sources.length > 0 ? (
        <ul className="space-y-1">
          {sources.map((source) => (
            <li key={source.id} className="flex items-center justify-between text-xs py-1 px-2 rounded-lg hover:bg-muted/50 group">
              <div className="flex items-center gap-2 min-w-0">
                <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                <span className="font-medium truncate">· {source.name}</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => removeSource(source.id)}
                aria-label={`${source.name} 삭제`}
              >
                <X className="h-3 w-3" />
              </Button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
