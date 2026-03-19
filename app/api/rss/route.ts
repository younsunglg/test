import { NextRequest, NextResponse } from "next/server";
import Parser from "rss-parser";
import { nanoid } from "nanoid";
import type { NewsItem } from "@/lib/types";

const parser = new Parser({
  timeout: 10000,
  headers: { "User-Agent": "RssDashboard/1.0" },
});

async function fetchFeed(sourceId: string, sourceName: string, feedUrl: string): Promise<NewsItem[]> {
  try {
    const feed = await parser.parseURL(feedUrl);
    return feed.items.map((item) => ({
      id: item.guid ?? item.link ?? nanoid(),
      sourceId,
      sourceName: sourceName || feed.title || sourceId,
      title: item.title ?? "(no title)",
      link: item.link ?? "",
      publishedAt: item.isoDate ?? item.pubDate ?? new Date().toISOString(),
    }));
  } catch {
    return [];
  }
}

export async function GET(request: NextRequest) {
  const sourcesParam = request.nextUrl.searchParams.get("sources");

  if (!sourcesParam) {
    return NextResponse.json({ error: "sources parameter is required" }, { status: 400 });
  }

  // Format: "id:name:encodedUrl,id:name:encodedUrl,..."
  const entries = sourcesParam.split(",").map((entry) => {
    const [id, name, encodedUrl] = entry.split(":");
    return { id, name: decodeURIComponent(name ?? ""), url: decodeURIComponent(encodedUrl ?? "") };
  });

  const results = await Promise.all(
    entries.map(({ id, name, url }) => fetchFeed(id, name, url))
  );

  const items: NewsItem[] = results.flat();
  return NextResponse.json(items);
}
