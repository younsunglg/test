"use client";

import { useState } from "react";
import { Rss } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useDashboardStore } from "@/lib/store";
import { nanoid } from "nanoid";
import type { RssSource } from "@/lib/types";

// Hoisted at module level (js-hoist-regexp rule)
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

  const [url, setUrl] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleAdd = () => {
    const trimmed = url.trim();

    if (!trimmed) {
      setError("URL을 입력해주세요");
      return;
    }

    // Validate URL format using URL constructor (no regex needed for this)
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

    // O(1) URL duplicate check using Set (js-set-map-lookups rule)
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
    <div className="mb-4 space-y-2">
      <div className="flex gap-2">
        <div className="flex-1 flex items-center border rounded-md px-3 py-1.5 gap-2">
          <Rss className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          <Input
            className="border-0 p-0 h-auto focus-visible:ring-0 shadow-none"
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
        <Button variant="outline" onClick={handleAdd}>
          + 소스 추가
        </Button>
      </div>
      {error !== null ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}
    </div>
  );
}
